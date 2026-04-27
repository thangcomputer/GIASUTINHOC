import express from 'express';
import CourseProgress from '../models/CourseProgress.js';
import Lesson from '../models/Lesson.js';
import Student from '../models/Student.js';
import crypto from 'crypto';

const router = express.Router();

// ── GET /api/progress/:studentId — Lấy toàn bộ tiến độ của học viên ──────────
router.get('/:studentId', async (req, res) => {
  try {
    const data = await CourseProgress.find({ studentId: req.params.studentId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/progress/:studentId/:courseId — Tiến độ 1 khóa học ──────────────
router.get('/:studentId/:courseId', async (req, res) => {
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

// ── POST /api/progress/step — Đánh dấu hoàn thành 1 step ─────────────────────
router.post('/step', async (req, res) => {
  try {
    const { studentId, courseId, stepIndex } = req.body;
    if (!studentId || !courseId || stepIndex === undefined)
      return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    // Lấy bài học để biết tổng số bước
    const lesson = await Lesson.findOne({ id: courseId });
    const totalSteps = lesson?.steps?.length || 1;

    // Upsert tiến độ
    let progress = await CourseProgress.findOne({ studentId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        studentId, courseId,
        courseTitle: lesson?.title || '',
        totalSteps,
      });
    }

    // Thêm step nếu chưa có
    if (!progress.completedSteps.includes(stepIndex)) {
      progress.completedSteps.push(stepIndex);
    }
    progress.lastWatchedStep = stepIndex;
    progress.totalSteps = totalSteps;
    progress.progressPct = Math.round((progress.completedSteps.length / totalSteps) * 100);
    progress.courseTitle = lesson?.title || progress.courseTitle;

    // Kiểm tra hoàn thành toàn bộ
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

// ── GET /api/progress/certificate/:certId — Lấy thông tin chứng chỉ ──────────
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

export default router;
