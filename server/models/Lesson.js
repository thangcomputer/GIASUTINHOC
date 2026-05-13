import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correctIndex: { type: Number, default: 0 },
  type: { type: String, default: 'mcq' }, // mcq | text | order
  acceptableAnswers: [String],
  hint: String,
  explanation: String // hiển thị sau lần sai đầu tiên
}, { _id: true });

const chapterSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  timeInSeconds: { type: Number, default: 0 }
}, { _id: false });

const quizCheckpointSchema = new mongoose.Schema({
  timeInSeconds: { type: Number, required: true },
  questions: [quizQuestionSchema]
}, { _id: true });

const stepSchema = new mongoose.Schema({
  title: String,
  content: String,
  videoUrl: String,
  tip: String,
  exercise: String,
  quizCheckpoints: [quizCheckpointSchema],
  learningObjectives: [String],
  summaryBullets: [String],
  chapters: [chapterSchema],
  transcript: String
});

const lessonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "ban-phim"
  title: { type: String, required: true },
  emoji: String,
  category: String,
  level: String,
  duration: String,
  color: String,
  description: String,
  tags: [String],
  steps: [stepSchema]
}, { timestamps: true });

export default mongoose.model('Lesson', lessonSchema);
