import mongoose from 'mongoose';

const quizHistorySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  topic: { type: String, default: 'Tổng hợp' },
  score: { type: Number, required: true }, // Điểm / 1000
  totalQuestions: { type: Number, required: true },
  wrongAnswers: { type: Array, default: [] },
  aiFeedback: { type: String, default: '' },
  isDailyMissionRewarded: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('QuizHistory', quizHistorySchema);
