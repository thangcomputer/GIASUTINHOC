import express from 'express';
import CourseProgress from '../models/CourseProgress.js';
import Lesson from '../models/Lesson.js';
import crypto from 'crypto';
import { requireAuth, allowSelfOrAdmin, forceOwnStudentFields } from '../middleware/auth.js';

const router = express.Router();

// Đặt route cụ thể trước /:studentId để không bắt nhầm "certificate"
/** Cập nhật mốc thời gian xem xa nhất (gọi định kỳ khi đang phát video) */
router.post('/watch', requireAuth, forceOwnStudentFields(['studentId']), async (req, res) => {
  try {
    const { studentId, courseId, stepIndex, seconds } = req.body;
    if (!studentId || !courseId || stepIndex === undefined || seconds === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    }
    const sec = Math.max(0, Math.floor(Number(seconds) || 0));
    const si = Number(stepIndex);
    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      const lesson = await Lesson.findOne({ id: courseId });
      progress = new CourseProgress({
        studentId,
        courseId,
        courseTitle: lesson?.title || '',
        totalSteps: lesson?.steps?.length || 0,
        watchPeaks: [{ stepIndex: si, seconds: sec }],
      });
      await progress.save();
      return res.json({ success: true, data: progress });
    }
    if (!progress.watchPeaks) progress.watchPeaks = [];
    const idx = progress.watchPeaks.findIndex(w => w.stepIndex === si);
    if (idx >= 0) {
      if (sec > (progress.watchPeaks[idx].seconds || 0)) progress.watchPeaks[idx].seconds = sec;
    } else {
      progress.watchPeaks.push({ stepIndex: si, seconds: sec });
    }
    await progress.save();
    res.json({ success: true, data: progress });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/step', requireAuth, forceOwnStudentFields(['studentId']), async (req, res) => {
  try {
    const { studentId, courseId, stepIndex } = req.body;
    if (!studentId || !courseId || stepIndex === undefined)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const lesson = await Lesson.findOne({ id: courseId });
    const totalSteps = lesson?.steps?.length || 1;

    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        studentId, courseId,
        courseTitle: lesson?.title || '',
        totalSteps,
      });
    }

    if (!progress.completedSteps.includes(stepIndex)) {
      progress.completedSteps.push(stepIndex);
    }
    progress.lastWatchedStep = stepIndex;
    progress.totalSteps = totalSteps;
    progress.progressPct = Math.round((progress.completedSteps.length / totalSteps) * 100);
    progress.courseTitle = lesson?.title || progress.courseTitle;

    if (progress.completedSteps.length >= totalSteps && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
      progress.certificateId = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
    }

    await progress.save();
    res.json({ success: true, data: progress });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/certificate/:certId', async (req, res) => {
  try {
    const progress = await CourseProgress.findOne({
      certificateId: req.params.certId,
      isCompleted: true,
    }).populate('studentId', 'name email');

    if (!progress)
      return res.status(404).json({ success: false, message: 'Không tìm thấy chứng chỉ' });

    res.json({
      success: true,
      data: {
        studentName:  progress.studentId?.name || 'Học viên',
        studentEmail: progress.studentId?.email || '',
        courseTitle:  progress.courseTitle,
        completedAt:  progress.completedAt,
        certificateId: progress.certificateId,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/:studentId/:courseId', requireAuth, allowSelfOrAdmin('studentId'), async (req, res) => {
  try {
    const p = await CourseProgress.findOne({
      studentId: req.params.studentId,
      courseId:  req.params.courseId,
    });
    res.json({ success: true, data: p || null });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/:studentId', requireAuth, allowSelfOrAdmin('studentId'), async (req, res) => {
  try {
    const data = await CourseProgress.find({ studentId: req.params.studentId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
