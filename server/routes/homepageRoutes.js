import express from 'express';
import HomepageConfig from '../models/HomepageConfig.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Lấy cục cấu hình duy nhất
router.get('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      // Create default
      config = await HomepageConfig.create({
        stats: {
          items: [
            { label: 'Học viên', value: '25,000+', color: '#10b981' },
            { label: 'Chat đánh giá 5 sao', value: '98%', color: '#f59e0b' },
            { label: 'Khóa học', value: '50+', color: '#6366f1' },
            { label: 'Luôn sẵn sàng', value: '24/7', color: '#ec4899' }
          ]
        },
        aiFeatures: {
          title: 'Công Nghệ AI Cốt Lõi',
          subtitle: 'Trải nghiệm phương pháp học tập tương lai',
          items: [
            { title: 'Gia Sư AI Thông Minh', desc: 'Trợ lý AI phân tích trình độ, đặt câu hỏi thông minh.', iconName: 'Brain', color: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
            { title: 'Lộ Trình Cá Nhân Hóa', desc: 'AI tự động điều chỉnh nội dung học theo tốc độ.', iconName: 'Target', color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
            { title: 'Phản Hồi Tức Thì', desc: 'Nhận giải thích, gợi ý và đánh giá ngay lập tức.', iconName: 'Zap', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
            { title: 'Theo Dõi Tiến Độ', desc: 'Dashboard thông minh hiển thị hành trình học tập.', iconName: 'TrendingUp', color: '#ec4899', glow: 'rgba(236,72,153,0.4)' }
          ]
        },
        learningMethods: {
          title: 'Cách Của Chúng Tôi',
          subtitle: 'Hệ Sinh Thái Học Tập Toàn Diện',
          items: [
            { title: 'Học online có lộ trình', desc: 'Video, quiz và chat AI — học cùng gia sư tin học 24h, ôn mọi lúc.', badge: 'Phổ Biến Nhất', badgeColor: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', iconName: 'HeartHandshake', features: ['Học mọi lúc', 'Tiến độ rõ ràng'], link: '/lessons', cta: 'Vào bài học' },
            { title: 'Học Cùng Gia Sư AI', desc: 'Trò chuyện trực tiếp với AI thông minh, đặt câu hỏi.', badge: 'AI - 24/7', badgeColor: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)', iconName: 'Bot', features: ['Hỏi đáp không giới hạn', 'Giải thích dễ hiểu'], link: '/chat', cta: 'Chat Với AI Ngay' },
            { title: 'Bài Học Có Cấu Trúc', desc: 'Hệ thống bài học được thiết kế theo lộ trình.', badge: 'Tự Học', badgeColor: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', iconName: 'BookOpen', features: ['Video chất lượng cao', 'Bài tập thực hành'], link: '/lessons', cta: 'Xem Bài Học' },
            { title: 'Luyện Đề & Kiểm Tra', desc: 'Thư viện đề thi MOS, IC3.', badge: 'Luyện Tập', badgeColor: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', iconName: 'Target', features: ['Đề thi chuẩn MOS', 'Thống kê điểm số'], link: '/quiz', cta: 'Luyện Thi Ngay' }
          ]
        }
      });
    } else {
      let updated = false;
      if (!config.hero.titleLine1) {
        config.hero.titleLine1 = 'Học Tin Học';
        config.hero.titleHighlight1 = 'Thông Minh';
        config.hero.titleLine2 = 'Cùng Gia Sư';
        config.hero.titleHighlight2 = 'AI & Chuyên Gia';
        updated = true;
      }
      if (!config.learningMethods.titleLine1) {
        config.learningMethods.pillText = 'Phương Thức Học';
        config.learningMethods.titleLine1 = '4 Cách Học';
        config.learningMethods.titleHighlight1 = 'Hiệu Quả';
        updated = true;
      }
      if (!config.coursesSection) {
        config.coursesSection = {
          pillText: 'Khóa Học', titleLine1: 'Chọn', titleHighlight1: 'Khóa Học', titleLine2: ' Phù Hợp', subtitle: 'Từ cơ bản đến nâng cao — luôn có khóa học dành riêng cho bạn',
          items: [
            {
              title: 'Tin Học Cơ Bản',
              level: 'Người mới',
              rating: '4.9',
              lessons: '24',
              duration: '3 tháng',
              students: '1.2K+',
              color: '#0284c7',
              tags: ['Windows', 'Word', 'Excel', 'Internet'],
              link: '/chat?mode=basic'
            },
            {
              title: 'Luyện Thi MOS / IC3',
              level: 'Trung cấp',
              rating: '4.8',
              lessons: '36',
              duration: '4 tháng',
              students: '800+',
              color: '#059669',
              tags: ['Word Expert', 'Excel Expert', 'PowerPoint', 'IC3 GS6'],
              link: '/chat?mode=cert'
            },
            {
              title: 'Excel Nâng Cao & Data',
              level: 'Nâng cao',
              rating: '4.9',
              lessons: '28',
              duration: '2 tháng',
              students: '500+',
              color: '#7c3aed',
              tags: ['PivotTable', 'Power Query', 'Dashboard', 'VBA'],
              link: '/chat?mode=advanced'
            }
          ]
        };
        updated = true;
      } else if (!config.coursesSection.items || config.coursesSection.items.length === 0) {
        config.coursesSection.items = [
          {
            title: 'Tin Học Cơ Bản',
            level: 'Người mới',
            rating: '4.9',
            lessons: '24',
            duration: '3 tháng',
            students: '1.2K+',
            color: '#0284c7',
            tags: ['Windows', 'Word', 'Excel', 'Internet'],
            link: '/chat?mode=basic'
          },
          {
            title: 'Luyện Thi MOS / IC3',
            level: 'Trung cấp',
            rating: '4.8',
            lessons: '36',
            duration: '4 tháng',
            students: '800+',
            color: '#059669',
            tags: ['Word Expert', 'Excel Expert', 'PowerPoint', 'IC3 GS6'],
            link: '/chat?mode=cert'
          },
          {
            title: 'Excel Nâng Cao & Data',
            level: 'Nâng cao',
            rating: '4.9',
            lessons: '28',
            duration: '2 tháng',
            students: '500+',
            color: '#7c3aed',
            tags: ['PivotTable', 'Power Query', 'Dashboard', 'VBA'],
            link: '/chat?mode=advanced'
          }
        ];
        updated = true;
      }
      if (!config.testimonialsSection) {
        config.testimonialsSection = {
          pillText: 'Đánh Giá', titleLine1: 'Học Viên', titleHighlight1: 'Nói Gì', titleLine2: '?'
        };
        updated = true;
      }
      if (!config.ctaSection || !config.ctaSection.titleLine1) {
        config.ctaSection = {
          titleLine1: 'Bắt Đầu Hành Trình Học Tập', titleHighlight1: 'Thông Minh Ngay Hôm Nay',
          description: 'Hàng nghìn học viên đã tin tưởng và thành công. Đăng ký miễn phí và trải nghiệm sức mạnh của Gia Sư AI ngay bây giờ.',
          buttonText1: 'Đăng Ký Miễn Phí', buttonText2: 'Chat AI Thử Ngay'
        };
        updated = true;
      }
      if (!config.footer || !config.footer.logoText) {
        config.footer = {
          logoText: 'Gia Sư AI',
          tagline: 'Nền tảng học tin học thông minh kết hợp AI và giáo viên chuyên nghiệp.',
          columns: [
            {
              title: 'Về Chúng Tôi',
              content: 'Tầm nhìn\nSứ mệnh\nĐội ngũ chuyên gia'
            },
            {
              title: 'Liên Kết Nhanh',
              content: '/ [tab] Trang chủ\n/chat [tab] Hỏi Đáp AI\n/lessons [tab] Bài Giảng'
            },
            {
              title: 'Liên Hệ',
              content: '📍 Hà Nội, Việt Nam\n📞 0123 456 789'
            }
          ],
          copyright: `© ${new Date().getFullYear()} Gia Sư AI. All rights reserved.`
        };
        updated = true;
      }
      if (updated) await config.save();
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Cập nhật cấu hình
router.put('/', requireAdmin, async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig();
    }
    // Update fields
    if (req.body.hero) config.hero = req.body.hero;
    if (req.body.stats) config.stats = req.body.stats;
    if (req.body.aiFeatures) config.aiFeatures = req.body.aiFeatures;
    if (req.body.learningMethods) config.learningMethods = req.body.learningMethods;
    if (req.body.coursesSection) config.coursesSection = req.body.coursesSection;
    if (req.body.testimonialsSection) config.testimonialsSection = req.body.testimonialsSection;
    if (req.body.ctaSection) config.ctaSection = req.body.ctaSection;
    if (req.body.footer) config.footer = req.body.footer;

    await config.save();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
});

export default router;
