import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import { recordTransaction } from './userRoutes.js';
import { getSettings } from './settingsRoutes.js';
import { activateStudentCoinPlanFromPurchase } from '../utils/coinPlanActivation.js';
import { optionalAuth, requireAdmin } from '../middleware/auth.js';

/* global process */

const router = express.Router();

const WEBHOOK_SECRET = process.env.BILLING_WEBHOOK_SECRET || '';
const ALLOW_CLIENT_DEPOSIT = process.env.ALLOW_CLIENT_DEPOSIT !== 'false';

function billingSecretOk(req) {
  if (!WEBHOOK_SECRET) return false;
  const h = req.headers['x-billing-secret'];
  return h === WEBHOOK_SECRET;
}

router.get('/plans', (req, res) => {
  const pkgs = getSettings().coinPackages || [];
  res.json({ success: true, data: pkgs });
});

// POST /api/billing/deposit
// - Admin JWT, hoặc header x-billing-secret đúng WEBHOOK_SECRET, hoặc (ALLOW_CLIENT_DEPOSIT và học viên nạp cho chính mình)
router.post('/deposit', optionalAuth, async (req, res) => {
  try {
    const { studentId, planId, amountVND, amountCoins, paymentMethod, paymentRef, note } = req.body;

    if (!studentId || (!planId && !amountVND && !amountCoins)) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu nạp xu' });
    }

    const adminOk = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    const webhookOk = billingSecretOk(req);
    const selfOk = ALLOW_CLIENT_DEPOSIT && req.user &&
      String(req.user.id) === String(studentId) &&
      req.user.role !== 'admin' && req.user.role !== 'staff';

    if (!adminOk && !webhookOk && !selfOk) {
      return res.status(403).json({
        success: false,
        message: 'Không được phép thực hiện nạp xu qua API này. Liên hệ quản trị hoặc cấu hình webhook.',
      });
    }

    let coinsToAdd = amountCoins || 0;
    let paidAmount = amountVND || 0;
    let planLabel  = note || 'Nạp tự động / thủ công';
    let planBillingCycle = 'month';

    const pkgs = getSettings().coinPackages || [];

    if (planId) {
      const plan = pkgs.find(p => p.id === String(planId));
      if (plan) {
        coinsToAdd = plan.coins;
        paidAmount = plan.priceMs;
        planLabel  = plan.label;
        planBillingCycle = plan.billingCycle === 'year' ? 'year' : 'month';
      }
    } else if (amountVND && !amountCoins) {
      const base  = Math.floor(paidAmount / 1000);
      const bPct  = paidAmount >= 200000 ? 0.15 : paidAmount >= 100000 ? 0.10 : 0;
      coinsToAdd  = Math.floor(base * (1 + bPct));
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'studentId không hợp lệ' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });

    student.coins       += coinsToAdd;
    student.totalEarned += coinsToAdd;
    if (planId) {
      activateStudentCoinPlanFromPurchase(student, planId, planBillingCycle);
    }
    await student.save();

    await recordTransaction(student._id, 'deposit', coinsToAdd, student.coins, {
      studentName:   student.name,
      amountVND:     paidAmount,
      paymentMethod: paymentMethod || '',
      paymentRef:    paymentRef    || '',
      description:   `Nạp xu - ${planLabel}`,
      metadata:      { planId, planLabel },
      status:        'completed',
    });

    res.json({
      success:      true,
      message:      `Nạp thành công ${coinsToAdd} xu`,
      added:        coinsToAdd,
      currentCoins: student.coins,
      activeCoinPlanId: student.activeCoinPlanId || '',
      activeCoinPlanBillingCycle: student.activeCoinPlanBillingCycle || '',
      activeCoinPlanPaidAt: student.activeCoinPlanPaidAt || null,
      activeCoinPlanValidUntil: student.activeCoinPlanValidUntil || null,
    });
  } catch (err) {
    console.error('Lỗi nạp tiền:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xử lý thanh toán' });
  }
});

router.post('/webhook/payment', optionalAuth, async (req, res) => {
  try {
    if (!billingSecretOk(req) && !(req.user && (req.user.role === 'admin' || req.user.role === 'staff'))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { studentId, amountPaid } = req.body;
    if (!studentId || !amountPaid)
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

    const base  = Math.floor(amountPaid / 1000);
    const bPct  = amountPaid >= 200000 ? 0.15 : amountPaid >= 100000 ? 0.10 : 0;
    const coins = Math.floor(base * (1 + bPct));

    const student = await Student.findByIdAndUpdate(
      studentId,
      { $inc: { coins, totalEarned: coins } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });

    await recordTransaction(student._id, 'deposit', coins, student.coins, {
      studentName: student.name,
      amountVND:   amountPaid,
      description: 'Nạp qua Webhook',
      status:      'completed',
    });

    res.json({ success: true, added: coins, currentCoins: student.coins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
});

router.get('/transactions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 30, type, studentId } = req.query;
    const query = {};
    if (type)      query.type      = type;
    if (studentId) query.studentId = studentId;

    const total        = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [revenueAgg, spendAgg, txCountByType, latestTx] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'deposit', status: 'completed' } },
        { $group: { _id: null, totalVND: { $sum: '$amountVND' }, totalCoins: { $sum: '$coinsDelta' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ['spend_chat','spend_quiz','spend_image','spend_grade'] } } },
        { $group: { _id: '$type', totalCoins: { $sum: '$coinsDelta' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Transaction.find({ type: 'deposit' })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('studentId', 'name email'),
    ]);

    res.json({
      success: true,
      data: {
        revenue:      revenueAgg[0] || { totalVND: 0, totalCoins: 0 },
        spendByType:  spendAgg,
        countByType:  txCountByType,
        latestDeposits: latestTx,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
