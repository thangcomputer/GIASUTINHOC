import mongoose from 'mongoose';
import Student from '../models/Student.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { SESSION_IDLE_MS, shouldBumpSessionActivity } from '../constants/session.js';

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

async function validateSessionPayload(p) {
  if (!mongoose.Types.ObjectId.isValid(p.sub)) {
    return { error: 'SESSION_INVALID', message: 'Phiên không hợp lệ — vui lòng đăng nhập lại.' };
  }
  const user = await Student.findById(p.sub).select('sessionSerial lastActivityAt isActive role').lean();
  if (!user) {
    return { error: 'SESSION_INVALID', message: 'Không tìm thấy tài khoản.' };
  }
  if (user.isActive === false) {
    return { error: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khoá' };
  }
  const sidJwt = p.sid != null ? Number(p.sid) : NaN;
  if (!Number.isFinite(sidJwt) || sidJwt < 1) {
    return { error: 'SESSION_INVALID', message: 'Phiên cũ — vui lòng đăng nhập lại.' };
  }
  const serial = user.sessionSerial ?? 0;
  if (sidJwt !== serial) {
    return {
      error: 'SESSION_REPLACED',
      message: 'Tài khoản đã đăng nhập ở thiết bị khác. Phiên hiện tại đã kết thúc.',
    };
  }
  const lastMs = user.lastActivityAt != null ? new Date(user.lastActivityAt).getTime() : Date.now();
  if (Date.now() - lastMs > SESSION_IDLE_MS) {
    return {
      error: 'SESSION_IDLE',
      message: 'Phiên đã hết hạn do không hoạt động. Vui lòng đăng nhập lại.',
    };
  }
  return { ok: true, sub: p.sub, role: p.role };
}

/**
 * Xác thực Bearer + khớp session DB + idle.
 * Khi hợp lệ và shouldBumpSessionActivity(req) → cập nhật lastActivityAt.
 */
async function verifyBearerSession(req) {
  const t = bearerToken(req);
  if (!t) return { kind: 'none' };
  let p;
  try {
    p = verifyAccessToken(t);
  } catch {
    return { kind: 'invalid' };
  }
  const v = await validateSessionPayload(p);
  if (v.error) return { kind: 'fatal', code: v.error, message: v.message };
  if (shouldBumpSessionActivity(req)) {
    await Student.updateOne({ _id: p.sub }, { $set: { lastActivityAt: new Date() } });
  }
  return { kind: 'ok', user: { id: String(p.sub), role: p.role } };
}

/** Nếu có Bearer hợp lệ → gắn req.user; không có hoặc lỗi → req.user = null */
export async function optionalAuth(req, res, next) {
  try {
    const t = bearerToken(req);
    if (!t) {
      req.user = null;
      return next();
    }
    const r = await verifyBearerSession(req);
    if (r.kind !== 'ok') {
      req.user = null;
      return next();
    }
    req.user = r.user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req, res, next) {
  try {
    const t = bearerToken(req);
    if (!t) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }
    const r = await verifyBearerSession(req);
    if (r.kind === 'invalid') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    }
    if (r.kind === 'fatal') {
      const status = r.code === 'ACCOUNT_LOCKED' ? 403 : 401;
      return res.status(status).json({ success: false, message: r.message, code: r.code });
    }
    if (r.kind !== 'ok') {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }
    req.user = r.user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const t = bearerToken(req);
    if (!t) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập quản trị' });
    }
    const r = await verifyBearerSession(req);
    if (r.kind === 'invalid') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ' });
    }
    if (r.kind === 'fatal') {
      const status = r.code === 'ACCOUNT_LOCKED' ? 403 : 401;
      return res.status(status).json({ success: false, message: r.message, code: r.code });
    }
    if (r.kind !== 'ok') {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập quản trị' });
    }
    if (r.user.role !== 'admin' && r.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Cần quyền quản trị' });
    }
    req.user = r.user;
    next();
  } catch (err) {
    next(err);
  }
}

export function allowSelfOrAdmin(param = 'id') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }
    const target = String(req.params[param] ?? '');
    if (req.user.role === 'admin' || req.user.role === 'staff') return next();
    if (String(req.user.id) === target) return next();
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập dữ liệu này' });
  };
}

/** Học viên: luôn gắn studentId/userId = JWT. Admin/staff: giữ nguyên body (hỗ trợ thao tác hộ). */
export function forceOwnStudentFields(fields = ['studentId']) {
  return (req, res, next) => {
    if (!req.user) return next();
    if (req.user.role === 'admin' || req.user.role === 'staff') return next();
    for (const f of fields) {
      if (req.body[f] != null && String(req.body[f]) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Không khớp tài khoản' });
      }
      req.body[f] = req.user.id;
    }
    next();
  };
}
