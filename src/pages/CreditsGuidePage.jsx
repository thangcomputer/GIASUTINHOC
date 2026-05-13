import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import { Gem, Sparkles, MessageSquare, ImageIcon, ClipboardList, GraduationCap, ArrowRight, Coins } from 'lucide-react'
import { WELCOME_COINS, LOW_CREDIT_WARN_THRESHOLD } from '../lib/creditsPolicy'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'

const COST_ROWS = [
  { key: 'chatFree', label: 'Chat AI (chế độ tiết kiệm)', icon: MessageSquare, hint: 'Phù hợp làm quen' },
  { key: 'chatPro', label: 'Chat AI (Gia sư Pro)', icon: Sparkles, hint: 'Giải thích sâu, mặc định' },
  { key: 'chatOpenAI', label: 'Chat AI (OpenAI)', icon: Sparkles, hint: 'Tùy cấu hình admin' },
  { key: 'image', label: 'Tin nhắn kèm minh họa ảnh', icon: ImageIcon, hint: 'Cộng thêm vào giá mode' },
  { key: 'grade', label: 'Chấm điểm / nhận xét bài', icon: GraduationCap, hint: 'Theo từng lần gọi' },
  { key: 'quiz10', label: 'Tạo đề trắc nghiệm ~10 câu', icon: ClipboardList },
  { key: 'quiz20', label: 'Tạo đề trắc nghiệm ~20 câu', icon: ClipboardList },
  { key: 'quiz30', label: 'Tạo đề trắc nghiệm ~30 câu', icon: ClipboardList },
]

export default function CreditsGuidePage() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => {
        if (d?.success && d.data) setSettings(d.data)
      })
      .catch(() => {})
  }, [])

  const welcome = settings?.welcomeBonusCoins ?? WELCOME_COINS
  const warnAt = settings?.lowCreditWarnThreshold ?? LOW_CREDIT_WARN_THRESHOLD
  const aiCost = settings?.aiCost || {}
  const packages = settings?.coinPackages || []

  return (
    <div style={{ minHeight: '100vh', background: '#060912', color: '#e2e8f0' }}>
      <Helmet>
        <title>Xu học & gói nạp — Gia Sư Tin Học</title>
        <meta name="description" content="Mỗi tài khoản mới nhận xu chào mừng để trải nghiệm AI. Xem bảng giá xu theo tính năng và các gói nạp." />
      </Helmet>
      <Navbar />

      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '104px 24px 64px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '20px' }}>
          <Gem size={14} /> Minh bạch xu học
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Xu học là gì?
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.75, margin: '0 0 28px', fontSize: '1.02rem' }}>
          <strong style={{ color: '#e2e8f0' }}>Xu</strong> là đơn vị dùng cho các tính năng AI (hỏi đáp, tạo đề, chấm bài, minh họa…). Bạn có{' '}
          <strong style={{ color: '#fbbf24' }}>{welcome} xu miễn phí</strong> khi tạo tài khoản mới để làm quen. Hết xu, bạn có thể{' '}
          <Link to="/deposit" style={{ color: '#818cf8' }}>nạp thêm</Link> theo gói — không giới hạn thời gian dùng số xu đã có.
        </p>

        <section
          style={{
            background: 'rgba(15,23,42,0.65)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '16px',
            padding: '22px 24px',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={20} color="#fbbf24" /> Bảng giá xu (theo cấu hình hệ thống)
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px' }}>
            Số xu có thể được admin điều chỉnh trong cài đặt. Giá trị hiển thị là mức hiện tại.
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {COST_ROWS.map(({ key, label, icon: Icon, hint }) => {
              const v = aiCost[key]
              const display = v === undefined || v === null ? '—' : `${v} xu`
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Icon size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{label}</div>
                    {hint && <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{hint}</div>}
                  </div>
                  <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{display}</div>
                </div>
              )
            })}
          </div>
        </section>

        <section
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: '16px',
            padding: '22px 24px',
            marginBottom: '28px',
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 8px' }}>Gợi ý cho người mới</h2>
          <ul style={{ margin: 0, paddingLeft: '1.15rem', color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
            <li>Bắt đầu với <strong style={{ color: '#e2e8f0' }}>bài học có video/lý thuyết</strong> — không tốn xu.</li>
            <li>Dùng <strong style={{ color: '#e2e8f0' }}>chế độ chat tiết kiệm</strong> (0 xu) khi chỉ cần gợi ý ngắn.</li>
            <li>Khi số dư còn khoảng <strong style={{ color: '#fbbf24' }}>{warnAt} xu</strong>, hệ thống sẽ nhắc bạn nạp thêm.</li>
          </ul>
        </section>

        {packages.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px' }}>Gói nạp xu</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {packages.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.label}</div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {p.coins} xu{p.bonus && p.bonus !== '0%' ? ` · ${p.bonus}` : ''}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#a5b4fc' }}>{p.price}</div>
                </div>
              ))}
            </div>
            <Link
              to="/deposit"
              style={{
                marginTop: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.92rem',
              }}
            >
              Đi tới nạp xu <ArrowRight size={18} />
            </Link>
          </section>
        )}

        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Học viên đã đăng ký trước khi đổi chính sách có thể có số xu khác theo lịch sử tài khoản.
        </p>
      </main>
    </div>
  )
}
