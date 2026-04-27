import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCredits } from '../context/CreditContext'
import { io } from 'socket.io-client'
import {
  LayoutDashboard, Coins, ShieldCheck, Activity, BookOpen,
  ClipboardList, Target, TrendingUp, Zap, ChevronRight,
  Award, FileCheck2, BarChart2, Clock, User, Medal, Crown, Flame
} from 'lucide-react'

export default function StudentDashboard() {
  const { credits, setCredits } = useCredits()
  const navigate = useNavigate()

  const getUser = () => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } }
  const [userData, setUserData] = useState(getUser)

  const [quizzes, setQuizzes] = useState([])
  const [quizLoading, setQuizLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [leaderboard, setLeaderboard] = useState([])
  const [lbLoading, setLbLoading] = useState(true)
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) navigate('/login')
  }, [navigate])

  // Fetch fresh user data + socket
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const uid = JSON.parse(localStorage.getItem('giasu_user'))._id
        const res = await fetch(`/api/users/${uid}`)
        const d = await res.json()
        if (d.success) {
          const merged = { ...userData, ...d.data }
          setUserData(merged)
          localStorage.setItem('giasu_user', JSON.stringify(merged))
          if (typeof d.data.coins === 'number') setCredits(d.data.coins)
        }
      } catch {}
    }
    fetchUser()

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socket = io(API_URL)
    socket.on('coin_update', (payload) => {
      const uid = JSON.parse(localStorage.getItem('giasu_user'))?._id
      if (payload.studentId === uid) {
        setCredits(payload.newCoins)
        const cur = JSON.parse(localStorage.getItem('giasu_user') || '{}')
        cur.coins = payload.newCoins
        localStorage.setItem('giasu_user', JSON.stringify(cur))
        setUserData(prev => ({ ...prev, coins: payload.newCoins }))
      }
    })
    return () => socket.disconnect()
  }, [])

  // Fetch quiz history
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!userData._id) return
      setQuizLoading(true)
      try {
        const r = await fetch(`/api/quizzes/history/${userData._id}`)
        const d = await r.json()
        if (d.success) setQuizzes(d.data)
      } catch {}
      setQuizLoading(false)
    }
    if (userData._id) fetchQuizzes()
  }, [userData._id])

  // Fetch leaderboard
  useEffect(() => {
    const fetchLb = async () => {
      try {
        const r = await fetch('/api/quizzes/leaderboard')
        const d = await r.json()
        if (d.success) setLeaderboard(d.data)
      } catch {}
      setLbLoading(false)
    }
    fetchLb()
  }, [])

  // Dynamic badges based on real data
  const badges = [
    {
      title: 'Bậc Thầy Excel',
      desc: 'Đạt trên 800 điểm bài thi Excel',
      icon: BarChart2,
      color: '#10b981',
      bg: '#d1fae5',
      earned: quizzes.some(q => q.topic?.toLowerCase().includes('excel') && q.score >= 800)
    },
    {
      title: 'Chiến Thần IC3',
      desc: 'Đạt 1000 điểm tuyệt đối bài IC3',
      icon: ShieldCheck,
      color: '#6366f1',
      bg: '#ede9fe',
      earned: quizzes.some(q => q.topic?.toLowerCase().includes('ic3') && q.score === 1000)
    },
    {
      title: 'Siêu Sao AI',
      desc: 'Hoàn thành 5 bài thi thử',
      icon: Zap,
      color: '#f59e0b',
      bg: '#fef3c7',
      earned: quizzes.length >= 5
    },
    {
      title: 'Triệu Phú Xu',
      desc: 'Tích lũy đủ 500 Xu',
      icon: Coins,
      color: '#ec4899',
      bg: '#fce7f3',
      earned: credits >= 500
    },
  ]

  const totalScore = quizzes.reduce((s, q) => s + (q.score || 0), 0)
  const avgScore = quizzes.length ? Math.round(totalScore / quizzes.length) : 0
  const passCount = quizzes.filter(q => q.score >= 800).length
  const missionQuizzes = quizzes.filter(q => q.isDailyMissionRewarded)

  // Tính trạng thái nhiệm vụ 4 ngày
  const MISSION_INTERVAL_DAYS = 4
  const lastMission = missionQuizzes.length > 0
    ? missionQuizzes.reduce((latest, q) => new Date(q.createdAt) > new Date(latest.createdAt) ? q : latest)
    : null
  const nextMissionDate = lastMission
    ? new Date(new Date(lastMission.createdAt).getTime() + MISSION_INTERVAL_DAYS * 24 * 60 * 60 * 1000)
    : null
  const now = new Date()
  const missionReady = !nextMissionDate || now >= nextMissionDate
  const daysLeft = nextMissionDate && !missionReady
    ? Math.ceil((nextMissionDate - now) / (1000 * 60 * 60 * 24))
    : 0
  const hoursLeft = nextMissionDate && !missionReady
    ? Math.ceil((nextMissionDate - now) / (1000 * 60 * 60))
    : 0

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      <Navbar />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '100px 24px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutDashboard size={26} color="white" />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: 0 }}>
                Bảng Điều Khiển Học Viên
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
              Xin chào, <strong style={{ color: '#a5b4fc' }}>{userData.name || 'Học viên'}</strong> — Theo dõi tiến độ học tập tổng quan
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', fontSize: '0.95rem' }}>
              <User size={18} /> Hồ Sơ Của Tôi
            </Link>
            <Link to="/quiz" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderRadius: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', fontSize: '0.95rem' }}>
              <Target size={18} /> Làm Bài Thi Mới
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Số Dư Xu', value: `${credits} Xu`, icon: Coins, color: '#f59e0b', sub: 'Cập nhật real-time' },
            { label: 'Tổng Bài Thi', value: quizzes.length, icon: ClipboardList, color: '#6366f1', sub: 'Đã hoàn thành' },
            { label: 'Điểm Trung Bình', value: avgScore, icon: BarChart2, color: '#10b981', sub: `Tốt nhất: ${quizzes.reduce((m, q) => Math.max(m, q.score||0), 0)}` },
            { label: 'Bài Đạt Chuẩn', value: passCount, icon: Award, color: '#ec4899', sub: 'Trên 800 điểm' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: s.color, opacity: 0.1 }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'overview', label: 'Tổng Quan', icon: BarChart2 },
            { id: 'history', label: 'Lịch Sử Thi', icon: ClipboardList },
            { id: 'badges', label: 'Huy Hiệu', icon: Award },
            { id: 'missions', label: 'Nhiệm Vụ', icon: Zap },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s', background: activeSection === tab.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: activeSection === tab.id ? 'white' : '#64748b', boxShadow: activeSection === tab.id ? '0 4px 12px rgba(99,102,241,0.35)' : 'none' }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeSection === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Progress Chart */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px', gridColumn: '1 / -1' }}>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#6366f1" /> Biểu Đồ Điểm Số Theo Thời Gian
              </h3>
              {quizLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Đang tải...</div>
              ) : quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Target size={48} color="#334155" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Chưa có dữ liệu. Hãy làm bài thi đầu tiên!</p>
                  <Link to="/quiz" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>Làm Bài Ngay</Link>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {quizzes.slice(-10).map((q, i) => {
                      const pct = (q.score / 1000) * 100
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: q.score >= 800 ? '#10b981' : '#f87171', fontSize: '0.7rem', fontWeight: 700 }}>{q.score}</span>
                          <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '120px', display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{ width: '100%', height: `${pct}%`, borderRadius: '6px', background: q.score >= 800 ? 'linear-gradient(to top, #10b981, #34d399)' : 'linear-gradient(to top, #ef4444, #f87171)', transition: 'height 0.5s ease' }}></div>
                          </div>
                          <span style={{ color: '#475569', fontSize: '0.65rem' }}>{new Date(q.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }}></div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Đạt (≥800)</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }}></div><span style={{ color: '#64748b', fontSize: '0.8rem' }}>Chưa đạt</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Quizzes */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#6366f1" /> Bài Thi Gần Nhất
              </h3>
              {quizzes.slice(0, 4).map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{q.topic}</div>
                    <div style={{ color: '#475569', fontSize: '0.75rem' }}>{new Date(q.createdAt).toLocaleString('vi-VN')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {q.isDailyMissionRewarded && <span style={{ fontSize: '0.7rem', background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>+10 Xu</span>}
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: q.score >= 800 ? '#10b981' : '#f87171' }}>{q.score}</span>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 && <p style={{ color: '#475569', textAlign: 'center' }}>Chưa có dữ liệu</p>}
              {quizzes.length > 4 && (
                <button onClick={() => setActiveSection('history')} style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Xem tất cả <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* Quick Earned Badges */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#f59e0b" /> Huy Hiệu Đã Chinh Phục
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {badges.map((b, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '12px', background: b.earned ? `${b.color}15` : 'rgba(255,255,255,0.02)', border: `1px solid ${b.earned ? b.color+'30' : 'rgba(255,255,255,0.06)'}`, opacity: b.earned ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <b.icon size={20} color={b.earned ? b.color : '#475569'} />
                    <div>
                      <div style={{ color: b.earned ? 'white' : '#64748b', fontWeight: 700, fontSize: '0.82rem' }}>{b.title}</div>
                      {b.earned && <div style={{ color: b.color, fontSize: '0.7rem', fontWeight: 600 }}>Đã đạt</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Leaderboard Top 20 ── */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px', overflow: 'hidden', position: 'relative' }}>
              {/* Header glow */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Crown size={20} color="#f59e0b" />
                  </div>
                  Bảng Xếp Hạng Điểm Cao Nhất
                </h3>
                <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>Top 20 Học Viên</span>
              </div>

              {lbLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải bảng xếp hạng...</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                  <Crown size={40} color="#1e293b" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>Chưa có dữ liệu xếp hạng. Hãy là người đầu tiên!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Top 3 nổi bật */}
                  {leaderboard.slice(0, 3).length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {leaderboard.slice(0, 3).map((entry, i) => {
                        const podiumConfig = [
                          { rank: 1, label: 'Quán Quân', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: '0 0 24px rgba(245,158,11,0.2)', icon: '🥇', size: '1.5rem' },
                          { rank: 2, label: 'Á Quân',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', glow: '0 0 16px rgba(148,163,184,0.1)', icon: '🥈', size: '1.3rem' },
                          { rank: 3, label: 'Hạng Ba',  color: '#cd7c42', bg: 'rgba(205,124,66,0.1)',  border: 'rgba(205,124,66,0.25)',  glow: '0 0 16px rgba(205,124,66,0.1)',  icon: '🥉', size: '1.3rem' },
                        ][i]
                        const isMe = entry.studentId?.toString() === userData._id?.toString()
                        return (
                          <div key={i} style={{ background: podiumConfig.bg, border: `1px solid ${podiumConfig.border}`, borderRadius: '16px', padding: '20px 18px', textAlign: 'center', boxShadow: podiumConfig.glow, position: 'relative', overflow: 'hidden' }}>
                            {isMe && <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '10px' }}>Bạn</div>}
                            <div style={{ fontSize: podiumConfig.size, marginBottom: '8px' }}>{podiumConfig.icon}</div>
                            <div style={{ color: podiumConfig.color, fontWeight: 900, fontSize: '1.6rem', lineHeight: 1 }}>{entry.bestScore}<span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>/1000</span></div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem', marginTop: '6px', marginBottom: '4px' }}>{entry.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{entry.totalExams} bài thi · {entry.bestTopic}</div>
                            <div style={{ marginTop: '10px', padding: '4px 12px', background: `${podiumConfig.color}18`, borderRadius: '20px', display: 'inline-block', color: podiumConfig.color, fontWeight: 700, fontSize: '0.73rem' }}>{podiumConfig.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Top 4–20 dạng danh sách */}
                  {leaderboard.slice(3, showAllLeaderboard ? undefined : 10).map((entry, i) => {
                    const rank = i + 4
                    const isMe = entry.studentId?.toString() === userData._id?.toString()
                    const scorePct = (entry.bestScore / 1000) * 100
                    return (
                      <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', background: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: isMe ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                        {/* Rank badge */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: rank <= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: rank <= 5 ? '#fbbf24' : '#475569', fontWeight: 900, fontSize: '0.82rem' }}>#{rank}</span>
                        </div>
                        {/* Avatar chữ cái */}
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `hsl(${(rank * 47) % 360}, 60%, 30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: `hsl(${(rank * 47) % 360}, 80%, 80%)`, fontWeight: 800, fontSize: '0.88rem' }}>{entry.name.charAt(0)}</span>
                        </div>
                        {/* Tên + topic */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: isMe ? '#a5b4fc' : 'white', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                            {isMe && <span style={{ fontSize: '0.65rem', color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '1px 7px', borderRadius: '10px', fontWeight: 700, flexShrink: 0 }}>Bạn</span>}
                          </div>
                          <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '2px' }}>{entry.totalExams} bài thi · {entry.bestTopic}</div>
                        </div>
                        {/* Progress bar + score */}
                        <div style={{ width: '120px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: entry.bestScore >= 800 ? '#10b981' : '#f59e0b', fontWeight: 800, fontSize: '0.9rem' }}>{entry.bestScore}</span>
                            <span style={{ color: '#475569', fontSize: '0.72rem' }}>/1000</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }}>
                            <div style={{ height: '100%', borderRadius: '4px', width: `${scorePct}%`, background: entry.bestScore >= 800 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Nút Xem Thêm */}
                  {leaderboard.length > 10 && (
                    <button 
                      onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; }}
                      style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      {showAllLeaderboard ? 'Thu gọn' : 'Xem thêm...'}
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab: History */}
        {activeSection === 'history' && (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} color="#6366f1" /> Lịch Sử Thi Thử
              </h3>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>{quizzes.length} bài thi</span>
            </div>

            {quizLoading ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>Đang tải dữ liệu...</div>
            ) : quizzes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <ClipboardList size={48} color="#334155" />
                <p style={{ color: '#64748b', marginTop: '12px' }}>Học viên chưa làm bài thi nào.</p>
                <Link to="/quiz" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 24px', background: '#6366f1', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>Làm Bài Ngay</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {quizzes.map(q => (
                  <div key={q._id}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Chuyên đề: {q.topic}</span>
                          {q.isDailyMissionRewarded && <span style={{ background: '#064e3b', color: '#34d399', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>+10 Xu Nhiệm Vụ</span>}
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '10px' }}>
                          {new Date(q.createdAt).toLocaleString('vi-VN')} &nbsp;|&nbsp; {q.totalQuestions} câu hỏi
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', background: q.score >= 800 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: q.score >= 800 ? '#34d399' : '#f87171', border: `1px solid ${q.score >= 800 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                            {q.score}/1000 điểm
                          </span>
                          <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {q.score >= 800 ? 'Đạt chuẩn' : 'Cần ôn thêm'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link to={`/quiz?topic=${encodeURIComponent(q.topic)}`} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                          Thi lại
                        </Link>
                        <button
                          onClick={() => setSelectedQuiz(selectedQuiz === q._id ? null : q._id)}
                          style={{ padding: '10px 20px', background: selectedQuiz === q._id ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                        >
                          {selectedQuiz === q._id ? 'Đóng lại' : 'Xem lại lỗi sai'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {selectedQuiz === q._id && (
                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', padding: '24px', marginTop: '8px' }}>
                        <h4 style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Target size={16} /> Hồ Sơ Phân Tích Năng Lực
                        </h4>

                        {q.wrongAnswers?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {q.wrongAnswers.map((w, idx) => (
                              <div key={idx} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderLeft: '4px solid #ef4444', borderRadius: '10px', padding: '16px' }}>
                                <p style={{ color: 'white', fontWeight: 600, marginBottom: '12px', margin: '0 0 12px' }}>Câu {idx + 1}: {w.question}</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.78rem', marginBottom: '6px' }}>Phương án bạn chọn:</div>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>{w.studentAnswer || 'Bỏ trống'}</div>
                                  </div>
                                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.78rem', marginBottom: '6px' }}>Đáp án tiêu chuẩn:</div>
                                    <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>{w.correctAnswer}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '20px', color: '#34d399', fontWeight: 700, marginBottom: '20px' }}>
                            Hoàn thành xuất sắc 100% mục tiêu, không ghi nhận sai lệch chuyên môn.
                          </div>
                        )}

                        {q.aiFeedback && (
                          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderLeft: '4px solid #6366f1', borderRadius: '10px', padding: '20px' }}>
                            <h4 style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              <BookOpen size={14} /> Đánh Giá Từ Gia Sư Trưởng
                            </h4>
                            <p style={{ color: '#c7d2fe', lineHeight: 1.7, margin: 0, fontSize: '0.92rem' }}>{q.aiFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Badges */}
        {activeSection === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {badges.map((b, i) => (
              <div key={i} style={{ background: b.earned ? `${b.color}12` : 'rgba(255,255,255,0.04)', border: `2px solid ${b.earned ? b.color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: '20px', padding: '32px 24px', textAlign: 'center', opacity: b.earned ? 1 : 0.5, position: 'relative', overflow: 'hidden' }}>
                {b.earned && <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: b.color, opacity: 0.1 }}></div>}
                <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: b.earned ? `${b.color}20` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <b.icon size={36} color={b.earned ? b.color : '#475569'} />
                </div>
                <h3 style={{ color: b.earned ? 'white' : '#475569', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>{b.title}</h3>
                <p style={{ color: b.earned ? '#94a3b8' : '#334155', fontSize: '0.85rem', marginBottom: '16px' }}>{b.desc}</p>
                <div style={{ padding: '8px 20px', borderRadius: '20px', display: 'inline-block', fontWeight: 700, fontSize: '0.82rem', background: b.earned ? `${b.color}20` : 'rgba(255,255,255,0.04)', color: b.earned ? b.color : '#475569', border: `1px solid ${b.earned ? b.color + '40' : 'rgba(255,255,255,0.06)'}` }}>
                  {b.earned ? 'Đã Chinh Phục' : 'Chưa Đạt'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Missions */}
        {activeSection === 'missions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 4-Day Mission Card */}
            <div style={{ background: missionReady ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' : 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))', border: missionReady ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              {/* Glow khi sẵn sàng */}
              {missionReady && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)', borderRadius: '20px 20px 0 0' }} />}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: missionReady ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={28} color={missionReady ? 'white' : '#475569'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>Nhiệm Vụ 4 Ngày</h3>
                    {missionReady ? (
                      <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>Sẵn Sàng</span>
                    ) : (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>Còn {hoursLeft < 24 ? `${hoursLeft} giờ` : `${daysLeft} ngày`} nữa</span>
                    )}
                  </div>
                  <p style={{ color: '#a5b4fc', marginBottom: '16px', lineHeight: 1.6 }}>
                    Hoàn thành 1 bài thi thử đạt <strong style={{ color: '#fbbf24' }}>trên 800 điểm</strong> mỗi 4 ngày để nhận thưởng <strong style={{ color: '#34d399' }}>+10 Xu</strong> tự động vào tài khoản.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.5rem' }}>{missionQuizzes.length}</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Lần hoàn thành</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                      <div style={{ color: '#34d399', fontWeight: 900, fontSize: '1.5rem' }}>{missionQuizzes.length * 10} Xu</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Tổng Xu đã nhận</div>
                    </div>
                    {!missionReady && nextMissionDate && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ color: '#f87171', fontWeight: 900, fontSize: '1rem' }}>{nextMissionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Ngày mở lại</div>
                      </div>
                    )}
                  </div>
                </div>
                {missionReady ? (
                  <Link to="/quiz" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                    <Target size={18} /> Làm Ngay
                  </Link>
                ) : (
                  <div style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed' }}>
                    <Clock size={18} /> Đang Hồi Chiêu
                  </div>
                )}
              </div>
            </div>

            {/* Mission history */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '28px' }}>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} color="#10b981" /> Lịch Sử Nhận Thưởng Nhiệm Vụ
              </h3>
              {missionQuizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                  <Zap size={40} color="#1e293b" style={{ marginBottom: '12px' }} />
                  <p>Chưa có nhiệm vụ nào hoàn thành. Hãy thi đạt trên 800 điểm!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {missionQuizzes.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={18} color="#10b981" />
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{q.topic}</div>
                          <div style={{ color: '#475569', fontSize: '0.78rem' }}>{new Date(q.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: '#10b981', fontWeight: 800 }}>{q.score} điểm</span>
                        <span style={{ background: '#064e3b', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>+10 Xu</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
