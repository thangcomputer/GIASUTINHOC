import mongoose from 'mongoose';

/**
 * Phiên thanh toán QR ngân hàng (SePay + VietQR).
 * TTL: MongoDB xóa bản ghi sau 24h (đủ cho đối soát ngắn hạn).
 */
const PaymentSessionSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, unique: true, index: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  /** Chuỗi khớp nội dung CK (không dấu cách, chữ thường), ví dụ: giasuai600xua3f9 */
  refNorm:     { type: String, required: true, index: true },
  /** Hiển thị cho học viên / nhập CK, ví dụ: GIASUAI 600XU A3F9 */
  refDisplay:  { type: String, required: true },
  amount:      { type: Number, required: true },
  coins:       { type: Number, required: true },
  planId:      { type: String, default: '' },
  /** Chu kỳ gói tại lúc tạo phiên (tháng / năm) — dùng khi kích hoạt gói trên Student */
  planBillingCycle: { type: String, enum: ['month', 'year'], default: 'month' },
  planLabel:   { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'paid', 'expired', 'cancelled'], default: 'pending', index: true },
  studentName: { type: String, default: '' },
  paidAmount:  { type: Number, default: 0 },
  paidAt:      { type: Date },
  /** Id giao dịch SePay — chống webhook lặp */
  sepayTxnId:  { type: String, default: '', index: true },
}, { timestamps: true });

PaymentSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.models.PaymentSession || mongoose.model('PaymentSession', PaymentSessionSchema);
