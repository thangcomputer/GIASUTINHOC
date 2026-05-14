import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import { requireAdmin, requireAuth, allowSelfOrAdmin } from '../middleware/auth.js';
import { WELCOME_COINS } from '../constants/credits.js';

const router = express.Router();

async function recordTransaction(studentId, type, coinsDelta, coinsAfter, opts = {}) {
  const student = opts.studentName || '';
  await Transaction.create({
    studentId, studentName: student,
    type, coinsDelta, coinsAfter,
    amountVND:     opts.amountVND     || 0,
    paymentMethod: opts.paymentMethod || '',
    paymentRef:    opts.paymentRef    || '',
    description:   opts.description   || '',
    metadata:      opts.metadata      || {},
    status:        opts.status        || 'completed',
  });
}

// ── Admin: thống kê (đặt trước /:id) ─────────────────────────────────────────
router.get('/stats/overview', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalActiveUsers, totalCoinsInSystem, recentUsers] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ isActive: true }),
      Student.aggregate([{ $group: { _id: null, total: { $sum: '$coins' } } }]),
      Student.find().select('-password').sort({ createdAt: -1 }).limit(5),
    ]);

    const totalDeposit = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountVND' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalActiveUsers,
        totalCoinsInSystem: totalCoinsInSystem[0]?.total || 0,
        totalRevenueVND:    totalDeposit[0]?.total || 0,
        recentUsers,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search
      ? { $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ]}
      : {};

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc email' });

    const exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    const student = await Student.create({
      name, email, phone, password,
      coins: WELCOME_COINS,
      totalEarned: WELCOME_COINS,
    });

    await recordTransaction(student._id, 'bonus', WELCOME_COINS, WELCOME_COINS, {
      studentName: student.name,
      description: 'Xu chào mừng đăng ký tài khoản mới',
    });

    res.status(201).json({
      success: true,
      data: student.toSafeJSON(),
      message: `Đăng ký thành công! Tặng ${WELCOME_COINS} xu chào mừng.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/add', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc email' });

    const exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    let finalPassword = password || '123456';
    const hash = await bcrypt.hash(finalPassword, 10);

    const student = await Student.create({
      name, email, phone, password: hash,
      coins: WELCOME_COINS,
      totalEarned: WELCOME_COINS,
      role: role || 'student',
    });

    await recordTransaction(student._id, 'bonus', WELCOME_COINS, WELCOME_COINS, {
      studentName: student.name,
      description: 'Xu chào mừng tài khoản mới (tạo bởi admin)',
    });

    res.status(201).json({ success: true, data: student.toSafeJSON(), message: 'Tạo tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/coins', requireAuth, allowSelfOrAdmin('id'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('name email coins totalEarned totalSpent');
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/coins/adjust', requireAdmin, async (req, res) => {
  try {
    const { delta, reason } = req.body;
    if (!delta || isNaN(delta)) return res.status(400).json({ success: false, message: 'Thiếu hoặc sai delta' });

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const newCoins = Math.max(0, student.coins + Number(delta));
    if (Number(delta) > 0) student.totalEarned += Number(delta);
    else student.totalSpent += Math.abs(Number(delta));
    student.coins = newCoins;
    await student.save();

    await recordTransaction(student._id, 'admin_adjust', Number(delta), newCoins, {
      studentName: student.name,
      description: reason || 'Admin điều chỉnh thủ công',
    });

    res.json({ success: true, message: `Đã điều chỉnh ${delta > 0 ? '+' : ''}${delta} xu`, currentCoins: newCoins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/transactions', requireAuth, allowSelfOrAdmin('id'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { studentId: req.params.id };
    if (type) query.type = type;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải tối thiểu 6 ký tự' });

    const hash = await bcrypt.hash(newPassword, 10);

    const db = Student.db.db;
    const result = await db.collection('students').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: { password: hash, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result)
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.json({ success: true, message: `Đã cấp lại mật khẩu thành công cho ${result.name}` });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Học viên tự đổi mật khẩu (xác thực mật khẩu hiện tại). Admin đổi hộ → POST /:id/reset-password
router.post('/:id/change-password', requireAuth, async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Chỉ được đổi mật khẩu của chính mình' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải tối thiểu 6 ký tự' });

    const db = Student.db.db;
    const doc = await db.collection('students').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    if (!doc.password || !(await bcrypt.compare(currentPassword || '', doc.password))) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.collection('students').updateOne(
      { _id: doc._id },
      { $set: { password: hash, updatedAt: new Date() } }
    );
    res.json({ success: true, message: 'Đã đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', requireAuth, allowSelfOrAdmin('id'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', requireAuth, allowSelfOrAdmin('id'), async (req, res) => {
  try {
    const { name, phone, avatar, currentLevel, learningGoals } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (currentLevel !== undefined) updateData.currentLevel = currentLevel;
    if (learningGoals !== undefined) updateData.learningGoals = learningGoals;
    updateData.updatedAt = new Date();

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    res.json({ success: true, message: 'Đã cập nhật thông tin thành công', data: student });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, message: 'Không thể vô hiệu chính tài khoản đang đăng nhập' });
    }

    const target = await Student.findById(id).select('role isActive');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    if (target.isActive === false) {
      return res.json({ success: true, message: 'Tài khoản đã được vô hiệu hóa trước đó' });
    }

    if (req.user.role === 'staff' && target.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Nhân viên chỉ có thể vô hiệu tài khoản học viên' });
    }

    if (target.role === 'admin') {
      const activeAdmins = await Student.countDocuments({ role: 'admin', isActive: true });
      if (activeAdmins <= 1) {
        return res.status(400).json({ success: false, message: 'Không thể vô hiệu admin duy nhất còn hoạt động' });
      }
    }

    await Student.findByIdAndUpdate(id, {
      $set: { isActive: false, updatedAt: new Date() },
      $inc: { sessionSerial: 1 },
    });
    res.json({ success: true, message: 'Đã vô hiệu hóa tài khoản (không thể đăng nhập)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export { recordTransaction };
export default router;
