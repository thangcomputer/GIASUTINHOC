import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import {
  Compass,
  BookOpen,
  Sparkles,
  Wallet,
  UserPlus,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { WELCOME_COINS } from '../lib/creditsPolicy'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'
import './StartHerePage.css'

const STEP_GLOW = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b']

const steps = [
  {
    n: 1,
    title: 'Tạo tài khoản',
    desc: `Nhận ${WELCOME_COINS} xu chào mừng để trải nghiệm AI và đề tập.`,
    icon: UserPlus,
    to: '/register',
    cta: 'Đăng ký miễn phí',
  },
  {
    n: 2,
    title: 'Vào bài học đầu tiên',
    desc: 'Xem lý thuyết và video — không tốn xu. Làm quen giao diện và cách theo dõi tiến độ.',
    icon: BookOpen,
    to: null,
    cta: 'Mở bài học',
  },
  {
    n: 3,
    title: 'Hỏi Gia sư AI',
    desc: 'Chọn chế độ tiết kiệm (0 xu) khi chỉ cần gợi ý ngắn; Pro/OpenAI sẽ trừ xu theo bảng giá.',
    icon: Sparkles,
    to: '/chat',
    cta: 'Mở Hỏi đáp AI',
  },
  {
    n: 4,
    title: 'Khi sắp hết xu',
    desc: 'Xem mỗi tính năng tốn bao nhiêu xu, chọn gói nạp phù hợp.',
    icon: Wallet,
    to: '/credits',
    cta: 'Xu & gói nạp',
  },
]

export default function StartHerePage() {
  const [firstLessonId, setFirstLessonId] = useState(null)
  const [firstTitle, setFirstTitle] = useState('')

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => {
        const list = d?.success && Array.isArray(d.data) ? d.data : []
        if (list.length > 0) {
          const c = list[0]
          setFirstLessonId(c.id || c._id || null)
          setFirstTitle(c.title || 'Bài đầu tiên')
        }
      })
      .catch(() => {})
  }, [])

  const lessonHref = firstLessonId ? `/lessons/${firstLessonId}` : '/lessons'

  return (
    <div className="start-page">
      <Helmet>
        <title>Bắt đầu học — Gia Sư Tin Học 24h</title>
        <meta name="description" content="Lộ trình 4 bước cho người mới: đăng ký, bài học, AI, xu và nạp tiền." />
      </Helmet>
      <div className="start-bg" aria-hidden />
      <Navbar />

      <main className="start-main">
        <header className="start-hero">
          <div className="start-pill">
            <Compass size={15} strokeWidth={2} aria-hidden />
            Dành cho người mới
          </div>
          <h1>Bắt đầu trong vài phút</h1>
          <p className="start-hero-lead">
            Làm lần lượt các bước bên dưới — không cần kinh nghiệm tin học trước đó. Bạn có thể quay lại trang này bất cứ lúc nào.
          </p>
        </header>

        <ol className="start-steps">
          {steps.map((s) => {
            const Icon = s.icon
            const href = s.n === 2 ? lessonHref : s.to
            const subtitle = s.n === 2 && firstTitle ? `Khóa gợi ý: ${firstTitle}` : null
            const glow = STEP_GLOW[s.n - 1] || STEP_GLOW[0]

            return (
              <li
                key={s.n}
                className="start-step"
                style={{ '--step-glow': glow }}
              >
                <div className="start-step-icon">
                  <Icon size={23} strokeWidth={2} aria-hidden />
                </div>
                <div className="start-step-body">
                  <div className="start-step-kicker">Bước {s.n}</div>
                  <h2>{s.title}</h2>
                  <p>{s.desc}</p>
                  {subtitle && <p className="start-step-hint">{subtitle}</p>}
                  {href && (
                    <Link to={href} className="start-step-btn">
                      {s.cta}
                      <ArrowRight size={17} strokeWidth={2.5} aria-hidden />
                    </Link>
                  )}
                </div>
                <div className="start-step-mark" aria-hidden>
                  <CheckCircle2 size={20} strokeWidth={2} />
                </div>
              </li>
            )
          })}
        </ol>

        <div className="start-foot">
          <Link to="/">← Về trang chủ</Link>
        </div>
      </main>
    </div>
  )
}
