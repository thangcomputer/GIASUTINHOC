import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId:    { type: String, required: true },       // lesson.id
  courseTitle: { type: String, default: '' },

  // Tiến độ từng step
  completedSteps: [{ type: Number }],                  // index của step đã xong
  totalSteps:     { type: Number, default: 0 },
  progressPct:    { type: Number, default: 0 },        // 0-100

  // Trạng thái
  isCompleted:    { type: Boolean, default: false },
  completedAt:    { type: Date },
  lastWatchedStep:{ type: Number, default: 0 },

  // Chứng chỉ
  certificateId:  { type: String, default: '' },       // mã duy nhất cho chứng chỉ

  /** Theo dõi mốc xem xa nhất từng module (phục vụ thống kê drop-off) */
  watchPeaks: [{
    stepIndex: { type: Number, required: true },
    seconds:   { type: Number, default: 0 }
  }],
}, { timestamps: true });

// Unique: mỗi học viên chỉ có 1 record progress cho 1 khóa học
courseProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('CourseProgress', courseProgressSchema);
