import mongoose from 'mongoose';

const HomepageConfigSchema = new mongoose.Schema({
  hero: {
    title: { type: String, default: 'Gia Sư Tin Học 24h — Học tin học online' }, // keep for fallback if needed
    titleLine1: { type: String, default: 'Học Tin Học' },
    titleHighlight1: { type: String, default: 'Thông Minh' },
    titleLine2: { type: String, default: 'Cùng Gia Sư' },
    titleHighlight2: { type: String, default: 'AI & Chuyên Gia' },
    subtitle: { type: String, default: 'Học mọi lúc, mọi nơi, theo lộ trình của riêng bạn' },
    description: { type: String, default: 'Trải nghiệm học tập cá nhân hóa, hiệu quả và thú vị hơn bao giờ hết với trợ lý AI chuyên nghiệp.' },
    tags: { type: [String], default: ['AI 24/7', 'MOS Quốc Tế', 'Excel Nâng Cao', 'Tin Học Văn Phòng'] },
    animation: { type: String, default: 'animate-fade-in-up' }
  },
  stats: {
    visible: { type: Boolean, default: true },
    items: [{
      value: String,
      label: String,
      color: String
    }],
    animation: { type: String, default: 'animate-fade-in-up' }
  },
  aiFeatures: {
    title: { type: String, default: 'Công Nghệ AI Cốt Lõi' },
    subtitle: { type: String, default: 'Trải nghiệm phương pháp học tập tương lai' },
    items: [{
      title: String,
      desc: String,
      iconName: String,
      color: String,
      glow: String
    }],
    animation: { type: String, default: 'animate-fade-in-up' }
  },
  learningMethods: {
    pillText: { type: String, default: 'Phương Thức Học' },
    titleLine1: { type: String, default: '4 Cách Học' },
    titleHighlight1: { type: String, default: 'Hiệu Quả' },
    subtitle: { type: String, default: 'Chọn phương thức phù hợp nhất với lịch trình và mục tiêu của bạn' },
    items: [{
      title: String,
      desc: String,
      badge: String,
      badgeColor: String,
      gradient: String,
      iconName: String,
      mediaType: { type: String, default: 'icon' }, // 'icon', 'image', 'video'
      mediaUrl: String,
      features: [String],
      link: String,
      cta: String
    }],
    animation: { type: String, default: '' }
  },
  coursesSection: {
    pillText: { type: String, default: 'Khóa Học' },
    titleLine1: { type: String, default: 'Chọn' },
    titleHighlight1: { type: String, default: 'Khóa Học' },
    titleLine2: { type: String, default: ' Phù Hợp' },
    subtitle: { type: String, default: 'Từ cơ bản đến nâng cao — luôn có khóa học dành riêng cho bạn' },
    items: [{
      title: String,
      level: String,
      rating: String,
      lessons: String,
      duration: String,
      students: String,
      color: String,
      tags: [String],
      link: String
    }],
    animation: { type: String, default: '' }
  },
  testimonialsSection: {
    pillText: { type: String, default: 'Đánh Giá' },
    titleLine1: { type: String, default: 'Học Viên' },
    titleHighlight1: { type: String, default: 'Nói Gì' },
    titleLine2: { type: String, default: '?' },
    animation: { type: String, default: '' }
  },
  ctaSection: {
    titleLine1: { type: String, default: 'Bắt Đầu Hành Trình Học Tập' },
    titleHighlight1: { type: String, default: 'Thông Minh Ngay Hôm Nay' },
    description: { type: String, default: 'Hàng nghìn học viên đã tin tưởng và thành công. Đăng ký miễn phí và trải nghiệm sức mạnh của Gia Sư AI ngay bây giờ.' },
    buttonText1: { type: String, default: 'Đăng Ký Miễn Phí' },
    buttonText2: { type: String, default: 'Chat AI Thử Ngay' },
    animation: { type: String, default: '' }
  },
  footer: {
    logoText: { type: String, default: 'Gia Sư AI' },
    tagline: { type: String, default: 'Nền tảng học tin học thông minh kết hợp AI và giáo viên chuyên nghiệp.' },
    columns: [{
      title: String,
      content: String // Có thể là text với \n, HTML, v.v..
    }],
    copyright: { type: String, default: '© 2026 Gia Sư AI. All rights reserved.' }
  }
}, { timestamps: true });

const HomepageConfig = mongoose.model('HomepageConfig', HomepageConfigSchema);
export default HomepageConfig;
