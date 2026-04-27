import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct: { type: Number, required: true },
  explanation: String
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
