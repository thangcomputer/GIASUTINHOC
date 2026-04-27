import express from 'express';
import bcrypt from 'bcryptjs';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/auth/register  → Đăng ký
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: 'Thiếu tên hoặc email' });

    const exists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

    // Hash rõ trước khi insert để tránh pre-save hook
    const hash = bcrypt.hashSync(password || '', 10);

    const db = Student.db.db;
    const result = await db.collection('students').insertOne({
      name,
      email:              email.toLowerCase().trim(),
      phone:              phone || '',
      password:           hash,
      avatar:             '',
      role:               'student',
      isActive:           true,
      coins:              5,
      totalEarned:        5,
      totalSpent:         0,
      totalQuizGenerated: 0,
      totalChatMessages:  0,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    });

    // Ghi transaction
    await Transaction.create({
      studentId:   result.insertedId,
      studentName: name,
      type:        'bonus',
      coinsDelta:  5,
      coinsAfter:  5,
      description: 'Xu chào mừng đăng ký tài khoản mới',
      status:      'completed',
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Bạn được tặng 5 xu chào mừng.',
      data: { _id: result.insertedId, name, email, role: 'student', coins: 5 },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login     → Đăng nhập
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Thiếu email' });

    // Dùng raw collection để đọc đầy đủ field (kể cả password)
    const db = Student.db.db;
    const student = await db.collection('students').findOne({ email: email.toLowerCase().trim() });

    if (!student)
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

    if (student.isActive === false)
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' });

    // So sánh mật khẩu
    if (student.password) {
      const ok = bcrypt.compareSync(password || '', student.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Sai mật khẩu' });
    }

    // Cập nhật lastLogin mà KHÔNG trigger pre-save hook
    await db.collection('students').updateOne(
      { _id: student._id },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );

    // Trả về user info (không có password)
    const { password: _pw, ...safeUser } = student;
    res.json({ success: true, data: safeUser });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/google    → Đăng nhập bằng Google
// ─────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'Thiếu Token Google' });

    let email, name, avatar;
    try {
      // Dùng endpoint userinfo để giải mã access_token
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error_description || 'Invalid token');
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    } catch (tokenErr) {
      return res.status(401).json({ success: false, message: 'Token Google không hợp lệ hoặc đã hết hạn.' });
    }

    if (!email) return res.status(400).json({ success: false, message: 'Không lấy được Email từ Google' });

    const db = Student.db.db;
    const cleanEmail = email.toLowerCase().trim();
    let student = await db.collection('students').findOne({ email: cleanEmail });

    if (!student) {
      // Tự động đăng ký nếu chưa có tài khoản (SSO Auto-Provisioning)
      const randomPassword = bcrypt.hashSync(Math.random().toString(36).slice(-10), 10);
      const result = await db.collection('students').insertOne({
        name:               name || cleanEmail.split('@')[0],
        email:              cleanEmail,
        phone:              '',
        password:           randomPassword,
        avatar:             avatar || '',
        role:               'student',
        isActive:           true,
        coins:              5, // Bonus 5 xu như đky thường
        totalEarned:        5,
        totalSpent:         0,
        totalQuizGenerated: 0,
        totalChatMessages:  0,
        createdAt:          new Date(),
        updatedAt:          new Date(),
        lastLogin:          new Date()
      });

      // Ghi transaction
      await Transaction.create({
        studentId:   result.insertedId,
        studentName: name || cleanEmail.split('@')[0],
        type:        'bonus',
        coinsDelta:  5,
        coinsAfter:  5,
        description: 'Xu chào mừng đăng ký tài khoản mới qua Google',
        status:      'completed',
      });

      student = await db.collection('students').findOne({ _id: result.insertedId });
    } else {
      // Cập nhật lastLogin
      if (student.isActive === false) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' });
      await db.collection('students').updateOne(
        { _id: student._id },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );
    }

    const { password: _pw, ...safeUser } = student;
    res.json({ success: true, data: safeUser });

  } catch (err) {
    console.error('Google SSO error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
