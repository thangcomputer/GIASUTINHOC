import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import { signAccessToken } from '../utils/tokens.js';
import { requireAuth } from '../middleware/auth.js';
import { WELCOME_COINS } from '../constants/credits.js';

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/auth/me  → Thông tin user theo JWT
// ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
    const student = await Student.findById(req.user.id).select('-password').lean();
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    if (student.isActive === false) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

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

    const hash = await bcrypt.hash(password || '', 10);

    const db = Student.db.db;
    const result = await db.collection('students').insertOne({
      name,
      email:              email.toLowerCase().trim(),
      phone:              phone || '',
      password:           hash,
      avatar:             '',
      role:               'student',
      isActive:           true,
      coins:              WELCOME_COINS,
      totalEarned:        WELCOME_COINS,
      totalSpent:         0,
      totalQuizGenerated: 0,
      totalChatMessages:  0,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    });

    await Transaction.create({
      studentId:   result.insertedId,
      studentName: name,
      type:        'bonus',
      coinsDelta:  WELCOME_COINS,
      coinsAfter:  WELCOME_COINS,
      description: 'Xu chào mừng đăng ký tài khoản mới',
      status:      'completed',
    });

    const created = await db.collection('students').findOne({ _id: result.insertedId });
    const token = signAccessToken({ sub: result.insertedId.toString(), role: 'student' });
    const { password: _p, ...safeUser } = created;

    res.status(201).json({
      success: true,
      message: `Đăng ký thành công! Bạn được tặng ${WELCOME_COINS} xu chào mừng để trải nghiệm.`,
      data: { ...safeUser, _id: result.insertedId },
      token,
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
    const { email, password, phone } = req.body;
    const loginEmail = email ? email.toLowerCase().trim() : '';
    if (!loginEmail && !phone) return res.status(400).json({ success: false, message: 'Thiếu email hoặc số điện thoại' });

    const db = Student.db.db;
    const query = loginEmail ? { email: loginEmail } : { phone: String(phone).trim() };
    const student = await db.collection('students').findOne(query);

    if (!student)
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

    if (student.isActive === false)
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' });

    if (student.password) {
      const ok = await bcrypt.compare(password || '', student.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Sai mật khẩu' });
    } else if (password) {
      return res.status(401).json({ success: false, message: 'Sai mật khẩu' });
    }

    await db.collection('students').updateOne(
      { _id: student._id },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    );

    const fresh = await db.collection('students').findOne({ _id: student._id });
    const role = fresh.role || 'student';
    const token = signAccessToken({ sub: fresh._id.toString(), role });
    const { password: _pw, ...safeUser } = fresh;
    res.json({ success: true, data: safeUser, token });
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
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` }
      });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error_description || 'Invalid token');
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    } catch {
      return res.status(401).json({ success: false, message: 'Token Google không hợp lệ hoặc đã hết hạn.' });
    }

    if (!email) return res.status(400).json({ success: false, message: 'Không lấy được Email từ Google' });

    const db = Student.db.db;
    const cleanEmail = email.toLowerCase().trim();
    let student = await db.collection('students').findOne({ email: cleanEmail });

    if (!student) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      const result = await db.collection('students').insertOne({
        name:               name || cleanEmail.split('@')[0],
        email:              cleanEmail,
        phone:              '',
        password:           randomPassword,
        avatar:             avatar || '',
        role:               'student',
        isActive:           true,
        coins:              WELCOME_COINS,
        totalEarned:        WELCOME_COINS,
        totalSpent:         0,
        totalQuizGenerated: 0,
        totalChatMessages:  0,
        createdAt:          new Date(),
        updatedAt:          new Date(),
        lastLogin:          new Date()
      });

      await Transaction.create({
        studentId:   result.insertedId,
        studentName: name || cleanEmail.split('@')[0],
        type:        'bonus',
        coinsDelta:  WELCOME_COINS,
        coinsAfter:  WELCOME_COINS,
        description: 'Xu chào mừng đăng ký tài khoản mới qua Google',
        status:      'completed',
      });

      student = await db.collection('students').findOne({ _id: result.insertedId });
    } else {
      if (student.isActive === false) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khoá' });
      await db.collection('students').updateOne(
        { _id: student._id },
        { $set: { lastLogin: new Date(), updatedAt: new Date() } }
      );
      student = await db.collection('students').findOne({ _id: student._id });
    }

    const role = student.role || 'student';
    const token = signAccessToken({ sub: student._id.toString(), role });
    const { password: _pw, ...safeUser } = student;
    res.json({ success: true, data: safeUser, token });
  } catch (err) {
    console.error('Google SSO error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
