import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  // Liên kết người dùng
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  studentName: { type: String, default: '' }, // Snapshot để tránh N+1 query

  // Loại giao dịch
  type: {
    type: String,
    enum: [
      'deposit',       // Nạp tiền → cộng xu
      'spend_chat',    // Tiêu xu chat AI
      'spend_quiz',    // Tiêu xu tạo đề AI
      'spend_image',   // Tiêu xu tạo hình ảnh
      'spend_grade',   // Tiêu xu chấm bài AI
      'bonus',         // Thưởng xu (Admin tặng)
      'refund',        // Hoàn xu
      'reward_mission',// Thưởng thi thử
      'admin_adjust',  // Admin điều chỉnh thủ công
    ],
    required: true,
  },

  // Số xu (dương = cộng, âm = trừ)
  coinsDelta:   { type: Number, required: true }, // +10 or -3
  coinsAfter:   { type: Number, required: true }, // Số dư sau giao dịch

  // Thông tin thanh toán (chỉ cho type=deposit)
  amountVND:    { type: Number, default: 0 },      // Số tiền VND đã trả
  paymentMethod: { type: String, default: '' },     // momo, banking, cash...
  paymentRef:   { type: String, default: '' },      // Mã GD ngân hàng / Momo

  // Metadata
  description:  { type: String, default: '' },      // Ghi chú
  metadata:     { type: mongoose.Schema.Types.Mixed, default: {} }, // Extra data (topic, numQ, etc.)

  // Xác nhận thanh toán
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },

  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
