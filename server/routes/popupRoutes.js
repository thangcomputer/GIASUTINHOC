import express from 'express';
import Popup from '../models/Popup.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ── Học viên: lấy popup đang active (ưu tiên cao nhất) ──
router.get('/active', async (req, res) => {
  try {
    const popup = await Popup.findOne({ isActive: true }).sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: lấy tất cả popup ──
router.get('/', requireAdmin, async (req, res) => {
  try {
    const popups = await Popup.find().sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: popups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: tạo popup mới ──
router.post('/', requireAdmin, async (req, res) => {
  try {
    const popup = await Popup.create(req.body);
    res.json({ success: true, data: popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: cập nhật popup ──
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const popup = await Popup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!popup) return res.status(404).json({ success: false, message: 'Không tìm thấy popup' });
    res.json({ success: true, data: popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: bật/tắt popup ──
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const popup = await Popup.findById(req.params.id);
    if (!popup) return res.status(404).json({ success: false, message: 'Không tìm thấy popup' });
    popup.isActive = !popup.isActive;
    await popup.save();
    res.json({ success: true, data: popup });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: xóa popup ──
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Popup.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa popup' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
