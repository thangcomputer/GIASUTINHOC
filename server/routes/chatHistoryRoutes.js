import express from 'express';
import mongoose from 'mongoose';
import ChatHistory from '../models/ChatHistory.js';
import { requireAdmin, requireAuth, allowSelfOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
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

router.get('/student/:id', requireAuth, allowSelfOrAdmin('id'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }
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

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalMessages, userMessages, todayMessages, topStudents] = await Promise.all([
      ChatHistory.countDocuments(),
      ChatHistory.countDocuments({ role: 'user' }),
      ChatHistory.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
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
