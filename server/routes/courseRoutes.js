import express from 'express';
import Lesson from '../models/Lesson.js';
import Student from '../models/Student.js';
import CourseProgress from '../models/CourseProgress.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAdmin, requireAuth, forceOwnStudentFields } from '../middleware/auth.js';

/* global process */

const router = express.Router();

// Cấu hình multer lưu file video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const uploadVideo = multer({ storage });

router.post('/upload-video', requireAdmin, uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) throw new Error('Không có file hoặc file không hợp lệ');
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mở khóa khóa học
router.post('/unlock', requireAuth, forceOwnStudentFields(['userId']), async (req, res) => {
  try {
    const { userId, courseId, cost } = req.body;
    if (!userId || !courseId) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });

    const student = await Student.findById(userId);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });

    if (!student.unlockedCourses) student.unlockedCourses = [];

    // Nếu đã mở khóa
    if (student.unlockedCourses.includes(courseId)) {
      return res.json({ success: true, message: 'Đã mở khóa', unlocked: true });
    }

    // Nếu chưa mở khóa thì trừ tiền
    if (student.coins < cost) {
      return res.status(400).json({ success: false, message: 'Bạn không đủ Point/Xu để mở khóa. Vui lòng nạp thêm.' });
    }

    student.coins -= cost;
    student.totalSpent += cost;
    student.unlockedCourses.push(courseId);
    await student.save();

    res.json({ success: true, coins: student.coins, unlockedCourses: student.unlockedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy danh sách toàn bộ khóa học
router.get('/', async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thống kê học tập theo khóa (admin): đăng ký, hoàn thành, mốc xem TB theo module
router.get('/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ id: req.params.id });
    if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });

    const progresses = await CourseProgress.find({ courseId: req.params.id }).lean();
    const n = lesson.steps?.length || 0;
    const enrolled = progresses.length;
    const completed = progresses.filter(p => p.isCompleted).length;

    const stepStats = Array.from({ length: n }, (_, stepIndex) => {
      const peaks = progresses.map(p => {
        const w = (p.watchPeaks || []).find(x => x.stepIndex === stepIndex);
        return w?.seconds ?? 0;
      });
      const withData = peaks.filter(s => s > 0);
      const sum = withData.reduce((a, b) => a + b, 0);
      const avgMaxWatchSeconds = withData.length ? Math.round(sum / withData.length) : 0;
      return {
        stepIndex,
        title: lesson.steps[stepIndex]?.title || `Module ${stepIndex + 1}`,
        learnersWithProgress: withData.length,
        avgMaxWatchSeconds,
      };
    });

    res.json({
      success: true,
      data: {
        courseId: lesson.id,
        title: lesson.title,
        enrolled,
        completed,
        totalSteps: n,
        steps: stepStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm một khóa học mới
router.post('/', requireAdmin, async (req, res) => {
  try {
    const newLesson = new Lesson(req.body);
    await newLesson.save();
    res.json({ success: true, data: newLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật khóa học
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await Lesson.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa khóa học
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Lesson.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' });
    res.json({ success: true, message: 'Đã xóa bài học' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chức năng đặc biệt: Đồng bộ dữ liệu gốc (Seed)
router.post('/seed', requireAdmin, async (req, res) => {
  try {
    // Nhận mảng dữ liệu tĩnh từ Client (hoặc Backend auto đọc file)
    const { lessonsArray } = req.body;
    if (!lessonsArray || !Array.isArray(lessonsArray)) {
       return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }
    
    await Lesson.deleteMany({}); // Cẩn thận: Xóa toàn bộ DB cũ để đè dữ liệu
    await Lesson.insertMany(lessonsArray);
    
    res.json({ success: true, message: 'Đã đồng bộ toàn bộ Bài Học vào MongoDB!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
