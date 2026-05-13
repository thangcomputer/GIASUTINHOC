import { verifyAccessToken } from '../utils/tokens.js';

function bearerToken(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

/** Nếu có Bearer hợp lệ → gắn req.user; không có hoặc lỗi → req.user = null */
export function optionalAuth(req, res, next) {
  const t = bearerToken(req);
  if (!t) {
    req.user = null;
    return next();
  }
  try {
    const p = verifyAccessToken(t);
    req.user = { id: p.sub, role: p.role };
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  const t = bearerToken(req);
  if (!t) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
  }
  try {
    const p = verifyAccessToken(t);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireAdmin(req, res, next) {
  const t = bearerToken(req);
  if (!t) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập quản trị' });
  }
  try {
    const p = verifyAccessToken(t);
    if (p.role !== 'admin' && p.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Cần quyền quản trị' });
    }
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ' });
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
