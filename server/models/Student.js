import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const StudentSchema = new mongoose.Schema({
  // Thông tin cơ bản
  name:     { type: String, required: true, trim: true },
  email:    { type: String, unique: true, required: true, lowercase: true, trim: true },
  phone:    { type: String, trim: true, default: '' },
  password: { type: String, default: '' },
  avatar:   { type: String, default: '' },

  // Phân quyền & trạng thái
  role:     { type: String, enum: ['student', 'admin', 'staff'], default: 'student' },
  isActive: { type: Boolean, default: true },

  // Hệ thống Xu
  coins:        { type: Number, default: 0 },
  totalEarned:  { type: Number, default: 0 }, // Tổng xu đã nạp vào (không bao giờ giảm)
  totalSpent:   { type: Number, default: 0 }, // Tổng xu đã tiêu

  /** Gói nạp xu đã thanh toán gần nhất (SePay / nạp thủ công) — đồng bộ UI «Đang dùng» */
  activeCoinPlanId: { type: String, default: '', trim: true },
  activeCoinPlanBillingCycle: { type: String, default: '' },
  activeCoinPlanPaidAt: { type: Date, default: null },

  // Thống kê sử dụng
  totalQuizGenerated: { type: Number, default: 0 },
  totalChatMessages:  { type: Number, default: 0 },
  unlockedCourses:    [{ type: String }], // Lưu ID khoá học đã mở

  // Thông tin sư phạm
  currentLevel: { type: String, default: 'Mới bắt đầu' },
  learningGoals: { type: String, default: 'Nắm vững tin học cơ bản' },

  // Thông tin đăng nhập
  lastLogin:  { type: Date },
  /** Tăng mỗi lần đăng nhập thành công — JWT phải khớp để chống nhiều thiết bị */
  sessionSerial: { type: Number, default: 0 },
  /** Cập nhật khi có request được coi là hoạt động (bỏ qua vài GET sync định kỳ) */
  lastActivityAt: { type: Date },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

// Ẩn password khi trả JSON
StudentSchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// NOTE: KHÔNG dùng pre-save hook để hash password ở đây.
// Tất cả các nơi lưu password đều dùng bcrypt.hashSync() thủ công trước khi insert/update.

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
