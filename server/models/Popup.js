import mongoose from 'mongoose';

const popupSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  content:     { type: String, default: '' },      // Nội dung HTML / text
  imageUrl:    { type: String, default: '' },       // URL ảnh minh hoạ (tuỳ chọn)
  buttonText:  { type: String, default: 'Đã hiểu' },
  buttonUrl:   { type: String, default: '' },       // Nếu có link điều hướng
  isActive:    { type: Boolean, default: true },    // Admin bật/tắt
  showOnce:    { type: Boolean, default: false },   // Chỉ hiện 1 lần / học viên
  priority:    { type: Number, default: 0 },        // Số càng cao càng ưu tiên
}, { timestamps: true });

export default mongoose.model('Popup', popupSchema);
