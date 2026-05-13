import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import {
  Compass, BookOpen, Sparkles, Wallet, UserPlus, CheckCircle2, ArrowRight,
} from 'lucide-react'
import { WELCOME_COINS } from '../lib/creditsPolicy'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'

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
    <div style={{ minHeight: '100vh', background: '#060912', color: '#e2e8f0' }}>
      <Helmet>
        <title>Bắt đầu học — Gia Sư Tin Học</title>
        <meta name="description" content="Lộ trình 4 bước cho người mới: đăng ký, bài học, AI, xu và nạp tiền." />
      </Helmet>
      <Navbar />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '100px 24px 56px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '18px' }}>
          <Compass size={14} /> Dành cho người mới
        </div>
        <h1 style={{ fontSize: 'clamp(1.65rem, 4vw, 2.1rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Bắt đầu trong vài phút
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: '0 0 36px', fontSize: '1.02rem' }}>
          Làm lần lượt các bên dưới — không cần kinh nghiệm tin học trước đó. Bạn có thể quay lại trang này bất cứ lúc nào.
        </p>

        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
          {steps.map((s) => {
            const Icon = s.icon
            const href = s.n === 2 ? lessonHref : s.to
            const subtitle = s.n === 2 && firstTitle ? `Khóa gợi ý: ${firstTitle}` : null

            return (
              <li
                key={s.n}
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  padding: '20px 20px',
                  background: 'rgba(15,23,42,0.65)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '16px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(99,102,241,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a5b4fc',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: '1rem',
                  }}
                >
                  <Icon size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    Bước {s.n}
                  </div>
                  <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: '0 0 6px' }}>{s.title}</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 12px' }}>{s.desc}</p>
                  {subtitle && (
                    <p style={{ fontSize: '0.82rem', color: '#818cf8', margin: '0 0 12px' }}>{subtitle}</p>
                  )}
                  {href && (
                    <Link
                      to={href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        color: '#c4b5fd',
                        textDecoration: 'none',
                      }}
                    >
                      {s.cta} <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
                <CheckCircle2 size={22} style={{ color: 'rgba(52,211,153,0.35)', flexShrink: 0 }} aria-hidden />
              </li>
            )
          })}
        </ol>

        <div style={{ marginTop: '32px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            ← Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  )
}
