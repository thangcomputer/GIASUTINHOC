import mongoose from 'mongoose';

const courseExamSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  
  // Trắc nghiệm
  questions: [{
    question: String,
    options: [String],
    correctIndex: Number,
  }],
  quizPassScore: { type: Number, default: 5 }, // Ví dụ: Cần 5/10 để qua

  // Tự luận
  essayQuestionTitle: { type: String, default: 'Bài Tập Thực Hành Cuối Khóa' },
  essayQuestion: { type: String, default: '' }, // Đề bài tự luận
  allowFileUpload: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('CourseExam', courseExamSchema);
