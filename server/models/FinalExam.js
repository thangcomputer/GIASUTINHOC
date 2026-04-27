import mongoose from 'mongoose';

const finalExamSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: String, required: true },
  
  // Trạng thái bài thi
  status: { type: String, enum: ['pending', 'grading', 'graded'], default: 'pending' },
  
  // Phần trắc nghiệm
  quizScore: { type: Number, default: 0 },
  quizMaxScore: { type: Number, default: 10 },
  
  // Phần tự luận
  essayAnswer: { type: String, default: '' },
  essayScore: { type: Number, default: 0 },
  essayFileUrl: { type: String, default: '' },
  essayFileName: { type: String, default: '' },
  essayMaxScore: { type: Number, default: 10 },
  teacherFeedback: { type: String, default: '' },
  
  // Tổng hợp
  isPassed: { type: Boolean, default: false },
  submittedAt: { type: Date },
  gradedAt: { type: Date },
  nextRetakeAllowedAt: { type: Date } // Chặn thi lại 24h nếu rớt
}, { timestamps: true });

export default mongoose.model('FinalExam', finalExamSchema);
