import express from 'express';
import FinalExam from '../models/FinalExam.js';
import CourseProgress from '../models/CourseProgress.js';
import CourseExam from '../models/CourseExam.js';
import { requireAdmin, requireAuth, allowSelfOrAdmin, forceOwnStudentFields } from '../middleware/auth.js';

const router = express.Router();

// Lấy danh sách tất cả các bài thi (CMS)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const exams = await FinalExam.find({}).populate('studentId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cấp quyền thi lại (CMS)
router.post('/allow-retake', requireAdmin, async (req, res) => {
  try {
    const { examId } = req.body;
    const exam = await FinalExam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    
    exam.nextRetakeAllowedAt = null;
    
    await exam.save();
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chấm điểm bài thi (CMS)
router.post('/grade', requireAdmin, async (req, res) => {
  try {
    const { examId, isPassed, teacherFeedback, essayScore } = req.body;
    const exam = await FinalExam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    
    exam.status = 'graded';
    exam.isPassed = isPassed;
    exam.teacherFeedback = teacherFeedback;
    exam.essayScore = essayScore || (isPassed ? 8 : 4);
    exam.gradedAt = new Date();
    
    if (!isPassed) {
      exam.nextRetakeAllowedAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }
    
    await exam.save();
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET exam configuration per course (CMS)
// LƯU Ý: Tuyến này phải đặt TRƯỚC /:studentId/:courseId để không bị trùng lặp params
router.get('/course/:courseId', requireAdmin, async (req, res) => {
  try {
    const examConfig = await CourseExam.findOne({ courseId: req.params.courseId });
    res.json({ success: true, data: examConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE exam config for course (CMS)
router.post('/course/:courseId', requireAdmin, async (req, res) => {
  try {
    const { questions, quizPassScore, essayQuestionTitle, essayQuestion, allowFileUpload } = req.body;
    let examConfig = await CourseExam.findOne({ courseId: req.params.courseId });
    if (!examConfig) {
      examConfig = new CourseExam({ courseId: req.params.courseId });
    }
    
    examConfig.questions = questions || [];
    if (quizPassScore !== undefined) examConfig.quizPassScore = quizPassScore;
    if (essayQuestionTitle !== undefined) examConfig.essayQuestionTitle = essayQuestionTitle;
    if (essayQuestion !== undefined) examConfig.essayQuestion = essayQuestion;
    if (allowFileUpload !== undefined) examConfig.allowFileUpload = allowFileUpload;
    
    await examConfig.save();
    res.json({ success: true, data: examConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Nộp bài thi
router.post('/submit', requireAuth, forceOwnStudentFields(['studentId']), async (req, res) => {
  try {
    const { studentId, courseId, quizScore, essayAnswer, essayFileUrl, essayFileName, isFailedFast } = req.body;
    
    // Nếu có bài thi bị khóa 24h thì không cho thi
    const lastExam = await FinalExam.findOne({ studentId, courseId }).sort({ createdAt: -1 });
    if (lastExam && lastExam.status === 'graded' && !lastExam.isPassed) {
      if (lastExam.nextRetakeAllowedAt && new Date() < new Date(lastExam.nextRetakeAllowedAt)) {
         return res.status(403).json({ success: false, message: 'Bạn phải chờ đủ 24h mới được thi lại.' });
      }
    }
    
    const newExam = new FinalExam({
      studentId,
      courseId,
      quizScore,
      essayAnswer: essayAnswer || '',
      essayFileUrl: essayFileUrl || '',
      essayFileName: essayFileName || '',
      status: isFailedFast ? 'graded' : 'grading',
      isPassed: false,
      submittedAt: new Date()
    });
    
    if (isFailedFast) {
      newExam.gradedAt = new Date();
      newExam.teacherFeedback = 'Bạn chưa đạt đủ điểm phần Trắc Nghiệm khách quan để bước vào vòng Thực hành.';
      newExam.nextRetakeAllowedAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await newExam.save();
    res.json({ success: true, data: newExam });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET exam state cho học viên
// LƯU Ý: Phải để cuối vì params quá chung chung sẽ bắt nhầm các route cố định (như /submit, /course...) nếu để trên.
router.get('/:studentId/:courseId', requireAuth, allowSelfOrAdmin('studentId'), async (req, res) => {
  try {
    const exam = await FinalExam.findOne({ 
      studentId: req.params.studentId, 
      courseId: req.params.courseId 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
