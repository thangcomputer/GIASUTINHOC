import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Target, X, Bell, ExternalLink, Clock } from 'lucide-react'

const MISSION_INTERVAL_DAYS = 4
const STORAGE_KEY = 'login_popup_shown_session'

export default function LoginPopup() {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState(null)         // 'mission' | 'admin'
  const [adminPopup, setAdminPopup] = useState(null)
  const [daysLeft, setDaysLeft] = useState(0)
  const [animated, setAnimated] = useState(false)
  const navigate = useNavigate()

  const checkAndShow = useCallback(async () => {
    try {
      // Chỉ xử lý nếu học viên đã đăng nhập (không phải admin)
      if (localStorage.getItem('admin_token')) return
      const token = localStorage.getItem('auth_token')
      const user = JSON.parse(localStorage.getItem('giasu_user') || '{}')
      if (!token || !user._id) return

      // Tránh hiện lại trong cùng một session trình duyệt
      const shownKey = `${STORAGE_KEY}_${user._id}`
      if (sessionStorage.getItem(shownKey)) return

      // ── 1. Kiểm tra nhiệm vụ 4 ngày ──────────────────────────────────────
      const histRes = await fetch(`/api/quizzes/history/${user._id}`)
      const histData = await histRes.json()
      if (histData.success) {
        const rewarded = (histData.data || []).filter(q => q.isDailyMissionRewarded)
        if (rewarded.length > 0) {
          const lastMission = rewarded.reduce((latest, q) =>
            new Date(q.createdAt) > new Date(latest.createdAt) ? q : latest
          )
          const nextDate = new Date(new Date(lastMission.createdAt).getTime() + MISSION_INTERVAL_DAYS * 86400000)
          const now = new Date()
          if (now >= nextDate) {
            // Đủ 4 ngày → hiện popup nhiệm vụ
            sessionStorage.setItem(shownKey, '1')
            setMode('mission')
            setVisible(true)
            setTimeout(() => setAnimated(true), 50)
            return
          } else {
            const remain = Math.ceil((nextDate - now) / 86400000)
            setDaysLeft(remain)
          }
        } else {
          // Chưa làm nhiệm vụ lần nào → cũng hiện popup nhiệm vụ
          sessionStorage.setItem(shownKey, '1')
          setMode('mission')
          setVisible(true)
          setTimeout(() => setAnimated(true), 50)
          return
        }
      }

      // ── 2. Nếu chưa đủ 4 ngày → lấy popup admin ─────────────────────────
      const popRes = await fetch('/api/popups/active')
      const popData = await popRes.json()
      if (popData.success && popData.data) {
        sessionStorage.setItem(shownKey, '1')
        setAdminPopup(popData.data)
        setMode('admin')
        setVisible(true)
        setTimeout(() => setAnimated(true), 50)
      }
    } catch (err) {
      console.error('LoginPopup error:', err)
    }
  }, [])

  useEffect(() => {
    // Chờ 1.5s sau load để dữ liệu localStorage ổn định
    const t = setTimeout(checkAndShow, 1500)
    // Cũng theo dõi khi user đăng nhập mới (storage change)
    const onStorage = () => setTimeout(checkAndShow, 800)
    window.addEventListener('storage', onStorage)
    return () => { clearTimeout(t); window.removeEventListener('storage', onStorage) }
  }, [checkAndShow])

  const close = () => {
    setAnimated(false)
    setTimeout(() => { setVisible(false); setMode(null) }, 350)
  }

  if (!visible || !mode) return null

  // ────────── Popup Nhiệm Vụ ───────────────────────────────────────────────
  if (mode === 'mission') {
    return (
      <div
        onClick={e => { if (e.target === e.currentTarget) close() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          transition: 'opacity 0.35s',
          opacity: animated ? 1 : 0,
        }}
      >
        <div style={{
          width: '100%', maxWidth: '480px',
          background: 'linear-gradient(145deg, #0f172a, #1e1b4b)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          transform: animated ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s',
          opacity: animated ? 1 : 0,
          position: 'relative',
        }}>
          {/* Top gradient bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)', backgroundSize: '200%', animation: 'shimmer 2s linear infinite' }} />

          {/* Close btn */}
          <button onClick={close} style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <X size={16} />
          </button>

          {/* Hero section */}
          <div style={{ padding: '36px 36px 28px', textAlign: 'center' }}>
            {/* Pulse icon */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 8px 32px rgba(99,102,241,0.5)' }}>
                <Zap size={40} color="white" strokeWidth={2.5} />
              </div>
              <div style={{ position: 'absolute', inset: '-8px', borderRadius: '30px', border: '2px solid rgba(99,102,241,0.3)', animation: 'ping 1.5s ease-in-out infinite' }} />
            </div>

            <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Nhiệm Vụ Sẵn Sàng!
            </div>

            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.6rem', margin: '0 0 12px', lineHeight: 1.2 }}>
              Đã đến lúc chinh phục<br />
              <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nhiệm Vụ 4 Ngày!</span>
            </h2>

            <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: '0 0 28px', fontSize: '0.95rem' }}>
              Hoàn thành bài thi đạt <strong style={{ color: '#fbbf24' }}>trên 800 điểm</strong> ngay hôm nay để nhận thưởng <strong style={{ color: '#34d399' }}>+10 Xu</strong> vào tài khoản.
            </p>

            {/* Reward preview */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }}>
              {[
                { icon: '⚡', label: 'Phần thưởng', value: '+10 Xu', color: '#34d399' },
                { icon: '🎯', label: 'Điểm yêu cầu', value: '≥ 800', color: '#fbbf24' },
                { icon: '📅', label: 'Chu kỳ', value: '4 ngày', color: '#a5b4fc' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{item.icon}</div>
                  <div style={{ color: item.color, fontWeight: 900, fontSize: '1rem' }}>{item.value}</div>
                  <div style={{ color: '#475569', fontSize: '0.68rem', marginTop: '3px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={close} style={{ flex: 1, padding: '13px', borderRadius: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Để sau
              </button>
              <Link
                to="/quiz"
                onClick={close}
                style={{ flex: 2, padding: '13px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(99,102,241,0.45)' }}
              >
                <Target size={18} /> Vào Thi Ngay!
              </Link>
            </div>
          </div>

          <style>{`
            @keyframes shimmer { 0% { background-position: 0% } 100% { background-position: 200% } }
            @keyframes ping { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 0; } }
          `}</style>
        </div>
      </div>
    )
  }

  // ────────── Popup Admin ───────────────────────────────────────────────────
  if (mode === 'admin' && adminPopup) {
    return (
      <div
        onClick={e => { if (e.target === e.currentTarget) close() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          opacity: animated ? 1 : 0,
          transition: 'opacity 0.35s',
        }}
      >
        <div style={{
          width: '100%', maxWidth: '500px',
          background: 'linear-gradient(145deg, #0f172a, #1a2035)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '26px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          transform: animated ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s',
          opacity: animated ? 1 : 0,
        }}>
          {/* Top bar */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)', backgroundSize: '200%', animation: 'shimmer2 2.5s linear infinite' }} />

          {/* Image nếu có */}
          {adminPopup.imageUrl && (
            <div style={{ height: '180px', overflow: 'hidden', background: '#0f172a' }}>
              <img src={adminPopup.imageUrl} alt="Thông báo" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
            </div>
          )}

          {/* Nội dung */}
          <div style={{ padding: '32px 32px 28px', position: 'relative' }}>
            <button onClick={close} style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={20} color="#10b981" />
              </div>
              <div>
                <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Thông Báo Từ Trung Tâm</div>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', margin: 0, paddingRight: '40px' }}>{adminPopup.title}</h3>
              </div>
            </div>

            {daysLeft > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '8px 14px', marginBottom: '14px' }}>
                <Clock size={14} color="#f87171" />
                <span style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>Nhiệm vụ mở lại sau <strong>{daysLeft} ngày</strong></span>
              </div>
            )}

            {adminPopup.content && (
              <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: '0 0 24px', fontSize: '0.92rem' }}>{adminPopup.content}</p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={close} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                Đóng
              </button>
              {adminPopup.buttonUrl ? (
                <a
                  href={adminPopup.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}
                >
                  {adminPopup.buttonText || 'Xem thêm'} <ExternalLink size={15} />
                </a>
              ) : (
                <button onClick={close} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>
                  {adminPopup.buttonText || 'Đã hiểu'}
                </button>
              )}
            </div>
          </div>

          <style>{`
            @keyframes shimmer2 { 0% { background-position: 0% } 100% { background-position: 200% } }
          `}</style>
        </div>
      </div>
    )
  }

  return null
}
