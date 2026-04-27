import mongoose from 'mongoose';

/**
 * Model lưu lịch sử hỏi đáp của học viên với AI
 */
const ChatHistorySchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, default: '' },
  studentEmail:{ type: String, default: '' },

  // Nội dung
  role:        { type: String, enum: ['user', 'ai'], required: true },
  content:     { type: String, required: true },
  type:        { type: String, enum: ['text', 'image', 'grade'], default: 'text' },
  aiMode:      { type: String, enum: ['free', 'pro'], default: 'pro' },

  // Cost
  coinCost:    { type: Number, default: 0 },

  // Metadata
  topic:       { type: String, default: '' }, // chủ đề câu hỏi nếu det được
  imageUrl:    { type: String, default: '' }, // nếu có hình AI tạo

  createdAt:   { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export default mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);
