import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import PaymentSession from '../models/PaymentSession.js';
import Student from '../models/Student.js';
import { getSettings } from './settingsRoutes.js';
import { activateStudentCoinPlanFromPurchase, syncStudentActiveCoinPlanWindow } from '../utils/coinPlanActivation.js';
import { recordTransaction } from './userRoutes.js';
import { requireAuth, forceOwnStudentFields } from '../middleware/auth.js';

/* global process */

const router = express.Router();

function bankEnv() {
  return {
    bankId:   (process.env.BANK_ID || process.env.VIETQR_BANK_ID || 'acb').trim().toLowerCase(),
    accountNo:(process.env.ACCOUNT_NO || process.env.VIETQR_ACCOUNT_NO || '').trim(),
    accountName: (process.env.ACCOUNT_NAME || process.env.VIETQR_ACCOUNT_NAME || '').trim(),
  };
}

function sepayConfigured() {
  return !!(process.env.SEPAY_API_KEY || '').trim();
}

function sepayApiKeyOk(req) {
  const expected = (process.env.SEPAY_API_KEY || '').trim();
  if (!expected) return false;
  const auth = String(req.headers.authorization || '').trim();
  const m = /^apikey\s+(.+)$/i.exec(auth);
  return !!m && m[1].trim() === expected;
}

/** Chuỗi so khớp nội dung CK: chữ thường, bỏ khoảng trắng */
function compactLower(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '');
}

function randomSuffix(len = 6) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len).toLowerCase();
}

function buildVietQrUrl({ amount, addInfo, accountName }) {
  const { bankId, accountNo, accountName: envName } = bankEnv();
  if (!accountNo) return '';
  const name = encodeURIComponent(accountName || envName || '');
  const info = encodeURIComponent(addInfo);
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${name}`;
}

// GET /api/webhooks/bank-info — phục vụ VietQR (không nhạy cảm)
router.get('/bank-info', (req, res) => {
  const b = bankEnv();
  res.json({
    success: true,
    data: {
      bankId: b.bankId,
      accountNo: b.accountNo,
      accountName: b.accountName,
      sepayEnabled: sepayConfigured(),
    },
  });
});

// POST /api/webhooks/payment-session
router.post(
  '/payment-session',
  requireAuth,
  forceOwnStudentFields(['studentId']),
  async (req, res) => {
    try {
      const { studentId, planId, amountVND, coins: coinsBody } = req.body;
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'studentId không hợp lệ' });
      }

      const student = await Student.findById(studentId).select('name coins');
      if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });

      const pkgs = getSettings().coinPackages || [];
      let amount = Number(amountVND) || 0;
      let coins = Number(coinsBody) || 0;
      let planLabel = 'Nạp xu';
      let pid = planId ? String(planId) : '';
      let planBillingCycle = 'month';

      if (planId) {
        const plan = pkgs.find((p) => String(p.id) === String(planId));
        if (!plan) return res.status(400).json({ success: false, message: 'Gói nạp không hợp lệ' });
        coins = Number(plan.coins) || 0;
        amount = Number(plan.priceMs) || 0;
        planLabel = plan.label || planLabel;
        planBillingCycle = plan.billingCycle === 'year' ? 'year' : 'month';
      } else {
        if (!amount || !coins) {
          return res.status(400).json({ success: false, message: 'Thiếu amountVND hoặc coins' });
        }
      }

      if (!amount || !coins || amount < 1000) {
        return res.status(400).json({ success: false, message: 'Số tiền hoặc xu không hợp lệ' });
      }

      const suffix = randomSuffix(6);
      const refNorm = compactLower(`giasuai ${coins}xu ${suffix}`);
      const refDisplay = `GIASUAI ${coins}XU ${suffix.toUpperCase()}`;

      const sessionId = `ps_${Date.now()}_${suffix}`;

      await PaymentSession.create({
        sessionId,
        studentId,
        refNorm,
        refDisplay,
        amount,
        coins,
        planId: pid,
        planBillingCycle,
        planLabel,
        status: 'pending',
        studentName: student.name || '',
      });

      const { bankId, accountNo, accountName } = bankEnv();
      const qrUrl = buildVietQrUrl({
        amount,
        addInfo: refDisplay,
        accountName,
      });

      res.json({
        success: true,
        data: {
          sessionId,
          ref: refDisplay,
          refNorm,
          amount,
          coins,
          planLabel,
          qrUrl,
          bankId,
          accountNo,
          accountName,
          sepayEnabled: sepayConfigured(),
        },
      });
    } catch (e) {
      console.error('payment-session:', e);
      res.status(500).json({ success: false, message: e.message || 'Lỗi tạo phiên thanh toán' });
    }
  },
);

// GET /api/webhooks/payment-session/:sessionId
router.get('/payment-session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const s = await PaymentSession.findOne({ sessionId }).lean();
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên' });
    if (String(s.studentId) !== String(req.user.id) && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }
    res.json({
      success: true,
      data: {
        sessionId: s.sessionId,
        status: s.status,
        amount: s.amount,
        coins: s.coins,
        refDisplay: s.refDisplay,
        paidAmount: s.paidAmount,
        paidAt: s.paidAt,
        currentCoins: (await Student.findById(s.studentId).select('coins').lean())?.coins,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/webhooks/payment-status?sessionId= — polling
router.get('/payment-status', requireAuth, async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ success: false, message: 'Thiếu sessionId' });
    const s = await PaymentSession.findOne({ sessionId }).lean();
    if (!s) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên' });
    if (String(s.studentId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }
    const st = await Student.findById(s.studentId)
      .select('coins activeCoinPlanId activeCoinPlanBillingCycle activeCoinPlanPaidAt activeCoinPlanValidUntil');
    if (st) await syncStudentActiveCoinPlanWindow(st);
    res.json({
      success: true,
      data: {
        sessionId: s.sessionId,
        status: s.status,
        amount: s.amount,
        coins: s.coins,
        refDisplay: s.refDisplay,
        paidAmount: s.paidAmount,
        paidAt: s.paidAt,
        currentCoins: st?.coins,
        activeCoinPlanId: st?.activeCoinPlanId || '',
        activeCoinPlanBillingCycle: st?.activeCoinPlanBillingCycle || '',
        activeCoinPlanPaidAt: st?.activeCoinPlanPaidAt || null,
        activeCoinPlanValidUntil: st?.activeCoinPlanValidUntil || null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

async function fulfillSession(sessionDoc, paidAmount, sepayTxnId, io) {
  const updated = await PaymentSession.findOneAndUpdate(
    { _id: sessionDoc._id, status: 'pending' },
    {
      $set: {
        status: 'paid',
        paidAmount,
        paidAt: new Date(),
        sepayTxnId: String(sepayTxnId || ''),
      },
    },
    { new: true },
  );
  if (!updated) return null;

  const student = await Student.findById(sessionDoc.studentId);
  if (!student) return null;

  const coins = sessionDoc.coins;
  student.coins += coins;
  student.totalEarned += coins;
  activateStudentCoinPlanFromPurchase(
    student,
    sessionDoc.planId,
    sessionDoc.planBillingCycle || 'month',
  );
  await student.save();

  await recordTransaction(student._id, 'deposit', coins, student.coins, {
    studentName: student.name,
    amountVND: paidAmount,
    paymentMethod: 'sepay_bank',
    paymentRef: String(sepayTxnId || sessionDoc.sessionId),
    description: `Nạp xu — ${sessionDoc.planLabel || 'QR'}`,
    metadata: {
      sessionId: sessionDoc.sessionId,
      refDisplay: sessionDoc.refDisplay,
      planId: sessionDoc.planId || '',
      planBillingCycle: sessionDoc.planBillingCycle || 'month',
    },
    status: 'completed',
  });

  io?.emit('coin_update', { studentId: String(student._id), newCoins: student.coins });
  return student;
}

// POST /api/webhooks/sepay — SePay gọi vào (JSON)
router.post('/sepay', async (req, res) => {
  const ok = () => res.json({ success: true });
  try {
    if (!sepayConfigured()) {
      console.warn('SePay webhook: SEPAY_API_KEY chưa cấu hình');
      return ok();
    }
    if (!sepayApiKeyOk(req)) {
      console.warn('SePay webhook: Authorization không hợp lệ');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = req.body || {};
    const transferType = String(payload.transferType || '').toLowerCase();
    if (transferType && transferType !== 'in') return ok();

    const sepayId = payload.id != null ? String(payload.id) : '';
    if (sepayId) {
      const dup = await PaymentSession.findOne({ sepayTxnId: sepayId, status: 'paid' }).lean();
      if (dup) return ok();
    }

    const content = [payload.content, payload.description, payload.code]
      .filter(Boolean)
      .join(' ');
    const hay = compactLower(content);
    if (!hay) return ok();

    const transferAmount = Number(payload.transferAmount);
    if (!Number.isFinite(transferAmount) || transferAmount < 1000) return ok();

    const candidates = await PaymentSession.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    const session = candidates.find((s) => {
      if (!hay.includes(s.refNorm)) return false;
      return transferAmount === Number(s.amount);
    });

    if (!session) {
      console.log('SePay: không khớp phiên pending', { transferAmount, content: content.slice(0, 120) });
      return ok();
    }

    const io = req.app.get('io');
    const st = await fulfillSession(session, transferAmount, sepayId, io);
    if (st) {
      console.log('SePay: đã nạp xu', session.sessionId, session.coins, 'xu cho', String(st._id));
    }
    return ok();
  } catch (e) {
    console.error('SePay webhook error:', e);
    return res.status(500).json({ success: false });
  }
});

export default router;
