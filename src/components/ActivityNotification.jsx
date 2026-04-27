import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { UserPlus, Trophy, Zap, Star, CheckCircle } from 'lucide-react'

// ─── Dữ liệu giả ─────────────────────────────────────────────────────────────
const FIRST_NAMES = ['Minh', 'Linh', 'Hương', 'Tuấn', 'Thảo', 'Hùng', 'Lan', 'Dũng', 'Mai', 'Quân', 'Phúc', 'Ngọc', 'Khoa', 'Trang', 'Việt', 'Thu', 'Bình', 'Hoa', 'Long', 'Yến']
const LAST_NAMES  = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý']
const COURSES     = ['Excel Nâng Cao', 'MOS Word', 'IC3 Computing', 'PowerPoint Pro', 'Windows 11', 'Google Workspace', 'Bảo Mật Máy Tính', 'Tin Học Văn Phòng']
const TOPICS      = ['Excel', 'Word', 'IC3', 'PowerPoint', 'Windows', 'Google Docs', 'Bảo Mật', 'Internet']

// ─── Sinh dữ liệu ngẫu nhiên ──────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function maskEmail(name) {
  // tên****@gmail.com — lấy chữ cái đầu tên, 4 dấu sao, @gmail.com
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '')
  const visible = slug.slice(0, Math.min(3, slug.length))
  return `${visible}****@gmail.com`
}

function generateEvent() {
  const type = rand(['enroll', 'quiz', 'mission'])
  const firstName = rand(FIRST_NAMES)
  const lastName  = rand(LAST_NAMES)
  const fullName  = `${lastName} ${firstName}`
  const email     = maskEmail(fullName)

  if (type === 'enroll') {
    return {
      type,
      email,
      course: rand(COURSES),
      icon: UserPlus,
      iconColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.15)',
      accentColor: '#a5b4fc',
      label: 'Vừa đăng ký',
    }
  } else if (type === 'quiz') {
    const score = randInt(600, 1000)
    return {
      type,
      email,
      score,
      topic: rand(TOPICS),
      icon: score >= 800 ? Trophy : Star,
      iconColor: score >= 800 ? '#f59e0b' : '#94a3b8',
      iconBg: score >= 800 ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.1)',
      accentColor: score >= 800 ? '#fbbf24' : '#94a3b8',
      label: 'Hoàn thành bài thi',
    }
  } else {
    return {
      type,
      email,
      coins: 10,
      icon: Zap,
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.15)',
      accentColor: '#34d399',
      label: 'Vừa nhận thưởng nhiệm vụ',
    }
  }
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function ActivityNotification() {
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [timeAgo, setTimeAgo] = useState('vừa xong')
  const location = useLocation()

  // Ẩn notification nếu đang ở trang Admin
  if (location.pathname.startsWith('/admin')) return null;

  const showNext = useCallback(() => {
    // Ẩn popup cũ trước
    setVisible(false)

    setTimeout(() => {
      const event = generateEvent()
      const seconds = randInt(1, 59)
      setTimeAgo(seconds < 60 ? `${seconds} giây trước` : 'vừa xong')
      setCurrent(event)
      setVisible(true)

      // Tự ẩn sau 7 giây
      setTimeout(() => setVisible(false), 7000)
    }, 400)
  }, [])

  useEffect(() => {
    // Lần đầu xuất hiện sau 3 giây
    const initial = setTimeout(showNext, 3000)
    // Sau đó mỗi 10 giây
    const interval = setInterval(showNext, 10000)
    return () => { clearTimeout(initial); clearInterval(interval) }
  }, [showNext])

  if (!current) return null

  const Icon = current.icon

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-110%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
        .activity-notif {
          position: fixed;
          bottom: 28px;
          left: 24px;
          z-index: 9999;
          width: 320px;
          max-width: calc(100vw - 48px);
          pointer-events: auto;
        }
        .activity-notif.show {
          animation: slideInLeft 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .activity-notif.hide {
          animation: slideOutLeft 0.35s ease-in forwards;
        }
        .activity-notif-card {
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.45),
            0 0 0 1px rgba(255,255,255,0.04),
            inset 0 1px 0 rgba(255,255,255,0.06);
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .activity-notif-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 18px 18px 0 0;
        }
        .activity-notif-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .activity-notif-body {
          flex: 1;
          min-width: 0;
        }
        .activity-notif-label {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }
        .activity-notif-email {
          color: white;
          font-weight: 700;
          font-size: 0.88rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .activity-notif-detail {
          font-size: 0.78rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .activity-notif-time {
          font-size: 0.68rem;
          color: #475569;
          flex-shrink: 0;
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .activity-notif-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        .activity-notif-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 3px;
          border-radius: 0 0 18px 18px;
          animation: shrink-bar 7s linear forwards;
        }
        @keyframes shrink-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className={`activity-notif ${visible ? 'show' : 'hide'}`} role="status" aria-live="polite">
        <div className="activity-notif-card" style={{ borderColor: `${current.iconColor}28` }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${current.iconColor}, ${current.accentColor})`, borderRadius: '18px 18px 0 0' }} />

          {/* Icon */}
          <div className="activity-notif-icon" style={{ background: current.iconBg }}>
            <Icon size={22} color={current.iconColor} strokeWidth={2.5} />
          </div>

          {/* Body */}
          <div className="activity-notif-body">
            <div className="activity-notif-label" style={{ color: current.accentColor }}>
              {current.label}
            </div>
            <div className="activity-notif-email">{current.email}</div>
            <div className="activity-notif-detail">
              {current.type === 'enroll' && `Khóa học: ${current.course}`}
              {current.type === 'quiz'   && (
                <span>
                  Chủ đề <strong style={{ color: current.accentColor }}>{current.topic}</strong>
                  &nbsp;·&nbsp;
                  <strong style={{ color: current.accentColor }}>{current.score}/1000</strong> điểm
                  &nbsp;
                  {current.score >= 800 && <CheckCircle size={11} color="#10b981" style={{ display: 'inline', verticalAlign: 'middle' }} />}
                </span>
              )}
              {current.type === 'mission' && (
                <span>
                  Nhận thưởng&nbsp;
                  <strong style={{ color: current.accentColor }}>+{current.coins} Xu</strong>
                  &nbsp;nhiệm vụ 4 ngày
                </span>
              )}
            </div>
          </div>

          {/* Time + live dot */}
          <div className="activity-notif-time">
            <div className="activity-notif-dot" />
            <span>{timeAgo}</span>
          </div>

          {/* Progress bar */}
          <div
            className="activity-notif-progress"
            style={{ background: `linear-gradient(90deg, ${current.iconColor}, ${current.accentColor})`, opacity: 0.7 }}
          />
        </div>
      </div>
    </>
  )
}
