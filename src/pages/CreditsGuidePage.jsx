import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import {
  Gem,
  Sparkles,
  MessageSquare,
  ImageIcon,
  ClipboardList,
  GraduationCap,
  ArrowRight,
  Coins,
  Wallet,
} from 'lucide-react'
import { WELCOME_COINS, LOW_CREDIT_WARN_THRESHOLD } from '../lib/creditsPolicy'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'
import { useCredits } from '../context/CreditContext'
import './CreditsGuidePage.css'

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
  const { credits } = useCredits()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    try {
      const t = localStorage.getItem('auth_token')
      const u = localStorage.getItem('giasu_user')
      setHasSession(!!(t && u))
    } catch {
      setHasSession(false)
    }
  }, [])

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
    <div className="credits-page">
      <Helmet>
        <title>Xu học & gói nạp — Gia Sư Tin Học</title>
        <meta
          name="description"
          content="Mỗi tài khoản mới nhận xu chào mừng để trải nghiệm AI. Xem bảng giá xu theo tính năng và các gói nạp."
        />
      </Helmet>
      <div className="credits-bg" aria-hidden />
      <Navbar />

      <main className="credits-main">
        {hasSession && (
          <div className="credits-wallet">
            <div className="credits-wallet-left">
              <div className="credits-wallet-icon">
                <Wallet size={22} strokeWidth={2} aria-hidden />
              </div>
              <div>
                <div className="credits-wallet-label">Số xu hiện tại</div>
                <div className="credits-wallet-value">
                  {credits}
                  <span>xu</span>
                </div>
              </div>
            </div>
            <Link className="credits-wallet-link" to="/deposit">
              <Gem size={18} strokeWidth={2} aria-hidden />
              Nạp xu
            </Link>
          </div>
        )}

        <header className="credits-hero">
          <div>
            <div className="credits-pill">
              <Gem size={15} strokeWidth={2} aria-hidden />
              Minh bạch xu học
            </div>
            <h1>Xu học &amp; gói nạp</h1>
            <p className="credits-hero-lead">
              <strong>Xu</strong> là đơn vị dùng cho các tính năng AI (hỏi đáp, tạo đề, chấm bài, minh họa…). Bạn có{' '}
              <strong className="credits-gold">{welcome} xu miễn phí</strong> khi tạo tài khoản mới để làm quen. Hết
              xu, bạn có thể <Link to="/deposit">nạp thêm</Link> theo gói — không giới hạn thời gian dùng số xu đã có.
            </p>
          </div>

          <div className="credits-visual" aria-hidden>
            <div className="credits-visual-glow" />
            <span className="credits-coin-float credits-coin-float--a">
              <Coins size={16} strokeWidth={2.2} />
            </span>
            <span className="credits-coin-float credits-coin-float--b">
              <Gem size={14} strokeWidth={2.2} />
            </span>
            <span className="credits-coin-float credits-coin-float--c">
              <Coins size={13} strokeWidth={2.2} />
            </span>
            <div className="credits-coin-stack">
              <div className="credits-coin credits-coin--lg">
                <Gem size={40} strokeWidth={2} className="credits-coin-gem" aria-hidden />
              </div>
              <div className="credits-coin credits-coin--md">
                <Gem size={26} strokeWidth={2} className="credits-coin-gem" aria-hidden />
              </div>
              <div className="credits-coin credits-coin--sm">
                <Coins size={22} strokeWidth={2} className="credits-coin-gem" aria-hidden />
              </div>
            </div>
          </div>
        </header>

        <section className="credits-section credits-section--accent">
          <div className="credits-section-head">
            <div className="credits-section-icon credits-section-icon--gold">
              <Coins size={22} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2>Bảng giá xu</h2>
              <p className="credits-section-sub">Theo cấu hình hệ thống — admin có thể điều chỉnh. Giá hiển thị là mức hiện tại.</p>
            </div>
          </div>
          <div className="credits-cost-grid">
            {COST_ROWS.map(({ key, label, icon: Icon, hint }) => {
              const v = aiCost[key]
              const display = v === undefined || v === null ? '—' : `${v} xu`
              return (
                <div key={key} className="credits-cost-row">
                  <div className="credits-cost-icon">
                    <Icon size={19} strokeWidth={2} aria-hidden />
                  </div>
                  <div className="credits-cost-body">
                    <div className="credits-cost-title">{label}</div>
                    {hint && <div className="credits-cost-hint">{hint}</div>}
                  </div>
                  <div className="credits-cost-xu">
                    <Gem size={15} strokeWidth={2} aria-hidden />
                    {display}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="credits-section credits-section--tips credits-tips">
          <div className="credits-section-head">
            <div className="credits-section-icon">
              <Sparkles size={20} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h2>Gợi ý cho người mới</h2>
              <p className="credits-section-sub">Tối ưu xu khi mới bắt đầu.</p>
            </div>
          </div>
          <ul>
            <li>
              Bắt đầu với <strong>bài học có video/lý thuyết</strong> — không tốn xu.
            </li>
            <li>
              Dùng <strong>chế độ chat tiết kiệm</strong> (0 xu) khi chỉ cần gợi ý ngắn.
            </li>
            <li>
              Khi số dư còn khoảng <strong className="credits-gold">{warnAt} xu</strong>, hệ thống sẽ nhắc bạn nạp thêm.
            </li>
          </ul>
        </section>

        {packages.length > 0 && (
          <section className="credits-section">
            <div className="credits-packages-head">
              <div className="credits-section-icon credits-section-icon--gold">
                <Coins size={22} strokeWidth={2} aria-hidden />
              </div>
              <h2>Gói nạp xu</h2>
            </div>
            <div className="credits-package-grid">
              {packages.map((p) => (
                <div key={p.id} className="credits-package-card">
                  <div className="credits-package-left">
                    <div className="credits-package-coin">
                      <Gem size={20} strokeWidth={2} aria-hidden />
                    </div>
                    <div>
                      <div className="credits-package-title">{p.label}</div>
                      <div className="credits-package-meta">
                        <Coins size={14} strokeWidth={2} aria-hidden />
                        {p.coins} xu
                        {p.bonus && p.bonus !== '0%' ? ` · ${p.bonus}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="credits-package-price">{p.price}</div>
                </div>
              ))}
            </div>
            <Link className="credits-deposit-cta" to="/deposit">
              Đi tới nạp xu
              <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
            </Link>
          </section>
        )}

        <p className="credits-footnote">
          Học viên đã đăng ký trước khi đổi chính sách có thể có số xu khác theo lịch sử tài khoản.
        </p>
      </main>
    </div>
  )
}
