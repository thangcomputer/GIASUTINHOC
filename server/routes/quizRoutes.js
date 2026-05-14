import express from 'express';
import Question from '../models/Question.js';
import QuizHistory from '../models/QuizHistory.js';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings } from './settingsRoutes.js';
import { requireAdmin, requireAuth, allowSelfOrAdmin, forceOwnStudentFields } from '../middleware/auth.js';

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  try {
    const top = await QuizHistory.aggregate([
      {
        $group: {
          _id: '$studentId',
          bestScore: { $max: '$score' },
          totalExams: { $sum: 1 },
          bestTopic: { $first: '$topic' },
          lastExam: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $match: { bestScore: { $gt: 0 } } },
      { $sort: { bestScore: -1, totalExams: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          name: { $ifNull: ['$student.name', 'Học viên'] },
          bestScore: 1,
          totalExams: 1,
          bestTopic: 1,
          lastExam: 1
        }
      }
    ]);

    const fakeDataCount = 20 - top.length;
    if (fakeDataCount > 0) {
      const fakeNames = ["Nguyễn Văn Thắng", "Trần Lan Anh", "Lê Hoàng Nam", "Phạm Thu Hương", "Hoàng Tiến Dũng", "Vũ Ngọc Mai", "Đặng Đình Quân", "Bùi Thanh Nga", "Đỗ Hữu Hùng", "Hồ Bích Oanh", "Ngô Tuấn Khang", "Dương Hải Yến", "Lý Tuấn Kiệt", "Đào Thị Bích", "Đoàn Anh Tuấn", "Vương Thu Hà", "Trịnh Phi Long", "Đinh Minh Thu", "Lâm Thanh Tùng", "Phùng Bích Vân"];
      const fakeTopics = ["Word Cơ Bản", "Excel Ứng Dụng", "PowerPoint Chuyên Nghiệp", "Luyện Thi IC3", "Thực Hành AI"];

      const fakeEntries = [];
      for (let i = 0; i < fakeDataCount; i++) {
        fakeEntries.push({
          studentId: 'fake_' + i,
          name: fakeNames[i],
          bestScore: 980 - (i * 15) > 0 ? 980 - (i * 15) : 100,
          totalExams: (i % 5) + 1,
          bestTopic: fakeTopics[i % fakeTopics.length],
          lastExam: new Date(Date.now() - (i + 1) * 86400000)
        });
      }

      top.push(...fakeEntries);
      top.sort((a, b) => b.bestScore - a.bestScore);
    }

    res.json({ success: true, data: top });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/history/:studentId', requireAuth, allowSelfOrAdmin('studentId'), async (req, res) => {
  try {
    const history = await QuizHistory.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submit', requireAuth, forceOwnStudentFields(['studentId']), async (req, res) => {
  try {
    const { studentId, topic, score: rawScore, totalQuestions, wrongAnswers } = req.body;

    const score = Math.round((rawScore / totalQuestions) * 1000);

    let aiFeedback = "Bài thi tốt, hãy tiếp tục phát huy.";

    if (wrongAnswers && wrongAnswers.length > 0) {
      const settings  = getSettings();
      const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
      if (geminiKey) {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.7 } });
        const prompt = `Tôi vừa hoàn thành bài kiểm tra với số điểm ${score}/1000.
Danh sách các câu làm sai:
${JSON.stringify(wrongAnswers)}

Yêu cầu phân tích: Dựa trên tư cách là Gia sư chuyên gia của trung tâm đào tạo tin học thực chiến, hãy đưa ra lời nhận xét thấu cảm, giải thích cặn kẽ những nguyên nhân sai, và định hướng lộ trình ôn tập.
TUYỆT ĐỐI TUÂN THỦ: Sử dụng ngôn ngữ chuẩn mực của Gia Sư Tin Học 24h — trung tâm đào tạo tin học online. Tuyệt đối không dùng biểu tượng cảm xúc (emoji). Không thêm các lời chào hỏi thừa thãi.`;
        try {
          const result = await model.generateContent(prompt);
          aiFeedback = result.response.text();
        } catch (err) {
          console.error("AI Feedback error:", err.message);
          aiFeedback = "Hệ thống chuyên gia đang bận, không thể trích xuất nhận xét chi tiết lúc này.";
        }
      }
    } else {
      aiFeedback = "Hoàn hảo! Bạn đánh giá đúng 100% các câu hỏi. Vui lòng duy trì phong độ xuất sắc này thông qua các học phần tiếp theo.";
    }

    let isMissionRewarded = false;
    let earnedCoins = 0;

    const student = await Student.findById(studentId);
    if (student) {
      if (score >= 800) {
        const MISSION_INTERVAL_DAYS = 4;
        const since = new Date(Date.now() - MISSION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

        const alreadyRewarded = await QuizHistory.findOne({
          studentId,
          createdAt: { $gte: since },
          isDailyMissionRewarded: true
        });

        if (!alreadyRewarded) {
          isMissionRewarded = true;
          earnedCoins = 10;
          student.coins = (student.coins || 0) + earnedCoins;
          await student.save();

          await Transaction.create({
            studentId,
            studentName: student.name,
            type: 'reward_mission',
            coinsDelta: earnedCoins,
            coinsAfter: student.coins,
            description: 'Thưởng nhiệm vụ hoàn thành bài thi xuất sắc',
            status: 'completed'
          });

          const io = req.app.get('io');
          if (io) {
            io.emit('coin_update', { studentId: studentId.toString(), newCoins: student.coins });
          }
        }
      }
    }

    const historyRecord = await QuizHistory.create({
      studentId,
      topic,
      score,
      totalQuestions,
      wrongAnswers,
      aiFeedback,
      isDailyMissionRewarded: isMissionRewarded
    });

    res.json({
      success: true,
      data: historyRecord,
      earnedCoins
    });
  } catch (error) {
    console.error("Quiz Submit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/seed', requireAdmin, async (req, res) => {
  try {
    const { questionsArray } = req.body;
    if (!questionsArray || !Array.isArray(questionsArray)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
    }

    await Question.deleteMany({});
    await Question.insertMany(questionsArray);

    res.json({ success: true, message: 'Đã đồng bộ toàn bộ Câu Hỏi Trắc Nghiệm vào MongoDB!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.json({ success: true, data: newQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
    res.json({ success: true, message: 'Đã xóa câu hỏi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
