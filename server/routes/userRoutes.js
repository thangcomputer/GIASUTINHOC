import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// ─────────────────────────────────────────────
// HELPER: Tạo transaction + cập nhật số dư
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/users/               → Danh sách người dùng (Admin)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
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

// ─────────────────────────────────────────────
// GET /api/users/:id            → Chi tiết người dùng
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
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

// ─────────────────────────────────────────────
// POST /api/users/register      → Đăng ký tài khoản mới
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc email' });

    const exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    const student = await Student.create({ name, email, phone, password, coins: 5 }); // Tặng 5 xu khi đăng ký

    await recordTransaction(student._id, 'bonus', 5, 5, {
      studentName: student.name,
      description: 'Xu chào mừng đăng ký tài khoản mới',
    });

    res.status(201).json({ success: true, data: student.toSafeJSON(), message: 'Đăng ký thành công! Tặng 5 xu chào mừng.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/users/add           → Admin/Staff tạo tài khoản bằng tay
// ─────────────────────────────────────────────
router.post('/add', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc email' });

    const exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    let finalPassword = password || '123456'; // Mặc định nếu không nhập
    const hash = bcrypt.hashSync(finalPassword, 10);

    const student = await Student.create({ 
       name, email, phone, password: hash, coins: 5, role: role || 'student' 
    });

    await recordTransaction(student._id, 'bonus', 5, 5, {
      studentName: student.name,
      description: 'Xu chào mừng đăng ký tài khoản mới',
    });

    res.status(201).json({ success: true, data: student.toSafeJSON(), message: 'Tạo tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────
// PUT /api/users/:id            → Cập nhật thông tin người dùng
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, phone, avatar, updatedAt: new Date() },
      { new: true, select: '-password' }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/users/:id         → Khoá / xoá tài khoản
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Đã vô hiệu hoá tài khoản' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/users/:id/coins      → Số dư xu hiện tại
// ─────────────────────────────────────────────
router.get('/:id/coins', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('name email coins totalEarned totalSpent');
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/users/:id/coins/adjust   → Admin điều chỉnh xu thủ công
// ─────────────────────────────────────────────
router.post('/:id/coins/adjust', async (req, res) => {
  try {
    const { delta, reason } = req.body; // delta: +/- số xu
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

// ─────────────────────────────────────────────
// GET /api/users/:id/transactions → Lịch sử giao dịch của 1 user
// ─────────────────────────────────────────────
router.get('/:id/transactions', async (req, res) => {
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

// ─────────────────────────────────────────────
// GET /api/users/stats/overview  → Tổng quan thống kê (Admin Dashboard)
// ─────────────────────────────────────────────
router.get('/stats/overview', async (req, res) => {
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

// ─────────────────────────────────────────────
// POST /api/users/:id/reset-password → Admin cấp lại mật khẩu
// ─────────────────────────────────────────────
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải tối thiểu 6 ký tự' });

    // Hash mật khẩu mới
    const hash = bcrypt.hashSync(newPassword, 10);

    // Dùng raw collection để bypass pre-save hook
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

// ─────────────────────────────────────────────
// PUT /api/users/:id → Học viên cập nhật profile (Tên, Số điện thoại, Avatar)
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    // Tìm user và update
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

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

export { recordTransaction };
export default router;
