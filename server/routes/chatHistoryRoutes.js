import express from 'express';
import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.js';

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/chat-history              → Tất cả hỏi đáp (Admin, phân trang)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30, studentId, role } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (role)      query.role      = role;

    const total = await ChatHistory.countDocuments(query);
    const data  = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/chat-history/student/:id  → Lịch sử hỏi đáp 1 học viên
// ─────────────────────────────────────────────
router.get('/student/:id', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { studentId: req.params.id };

    const total = await ChatHistory.countDocuments(query);
    const data  = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/chat-history/stats        → Thống kê hỏi đáp toàn hệ thống
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalMessages, userMessages, todayMessages, topStudents] = await Promise.all([
      ChatHistory.countDocuments(),
      ChatHistory.countDocuments({ role: 'user' }),
      ChatHistory.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
      }),
      ChatHistory.aggregate([
        { $match: { role: 'user' } },
        { $group: { _id: '$studentId', name: { $first: '$studentName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: { totalMessages, userMessages, todayMessages, topStudents }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
