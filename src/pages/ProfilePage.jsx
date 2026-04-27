import Swal from 'sweetalert2';
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCredits } from '../context/CreditContext'
import {
  User, Activity, BookOpen, Clock, PlayCircle, Target, Laptop, BarChart2,
  ShieldCheck, FileCheck2, Briefcase, Zap, Coins, CreditCard, MessageSquare,
  TrendingDown, TrendingUp, ChevronRight, Camera, Lock, Edit2, Save, X, Eye, EyeOff, Check, ClipboardList, ArrowLeft, LayoutDashboard
} from 'lucide-react'
import { io } from 'socket.io-client'
import './ProfilePage.css'
import './ProfileHistory.css'
import './ProfileEdit.css'

export default function ProfilePage() {
  const { credits, setCredits } = useCredits()
  const [activeTab, setActiveTab] = useState('overview')
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)

  // Lấy user từ localStorage
  const getUser = () => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } }
  const [userData, setUserData] = useState(getUser)

  const [quizzes, setQuizzes] = useState([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)

  // Edit profile state
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(userData.avatar || '')
  const fileRef = useRef()

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const userStats = {
    name:            userData.name  || 'Học Viên',
    email:           userData.email || '',
    phone:           userData.phone || '',
    joinDate:        userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : '—',
    coins:           credits, // Thay vì lấy tĩnh từ userData
    totalSpent:      userData.totalSpent   ?? 0,
    totalEarned:     userData.totalEarned  ?? 0,
    lessonsCompleted: 8,
    totalLessons:    24,
  }

  // Khởi đầu editForm khi vào edit mode
  const startEdit = () => {
    setEditForm({ name: userData.name || '', phone: userData.phone || '' })
    setSaveMsg('')
    setEditMode(true)
  }

  // Lưu thông tin (API + localStorage)
  const saveProfile = async () => {
    if (!editForm.name.trim()) { setSaveMsg('❌ Tên không được để trống'); return }
    setSaving(true); setSaveMsg('')
    try {
      const r = await fetch(`/api/users/${userData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name.trim(), phone: editForm.phone, avatar: avatarPreview })
      })
      const d = await r.json()
      if (d.success) {
        const updated = { ...userData, name: editForm.name.trim(), phone: editForm.phone, avatar: avatarPreview }
        localStorage.setItem('giasu_user', JSON.stringify(updated))
        setUserData(updated)
        setSaveMsg('✅ Đã lưu thông tin!')
        setEditMode(false)
      } else setSaveMsg('❌ ' + d.message)
    } catch { setSaveMsg('❌ Lỗi kết nối server') }
    setSaving(false)
  }

  // Upload avatar (base64 preview)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { Swal.fire('Ảnh tối đa 2MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // Đổi mật khẩu
  const changePassword = async () => {
    if (!pwForm.newPw || pwForm.newPw.length < 6) { setPwMsg('❌ Mật khẩu mới ít nhất 6 ký tự'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg('❌ Xác nhận mật khẩu không khớp'); return }
    setPwSaving(true); setPwMsg('')
    try {
      // 1. Verify mật khẩu hiện tại qua API login
      const check = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, password: pwForm.current })
      })
      const cd = await check.json()
      if (!cd.success) { setPwMsg('❌ Mật khẩu hiện tại không đúng'); setPwSaving(false); return }

      // 2. Reset password
      const r = await fetch(`/api/users/${userData._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pwForm.newPw })
      })
      const d = await r.json()
      if (d.success) {
        setPwMsg('✅ Đổi mật khẩu thành công!')
        setPwForm({ current: '', newPw: '', confirm: '' })
      } else setPwMsg('❌ ' + d.message)
    } catch { setPwMsg('❌ Lỗi kết nối server') }
    setPwSaving(false)
  }

  // Lịch sử giao dịch
  const fetchTransactions = async () => {
    if (!userData._id) return
    setTxLoading(true)
    try {
      const r = await fetch(`/api/users/${userData._id}/transactions?limit=30`)
      const d = await r.json()
      if (d.success) setTransactions(d.data)
    } catch {}
    setTxLoading(false)
  }

  // Lịch sử thi thử
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

  // Tải lại dữ liệu và kết nối Socket.io real-time
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const uId = JSON.parse(localStorage.getItem('giasu_user'))._id;
        const res = await fetch(`/api/users/${uId}`);
        const data = await res.json();
        if (data.success) {
          const newUserData = { ...userData, ...data.data };
          setUserData(newUserData);
          localStorage.setItem('giasu_user', JSON.stringify(newUserData));
          if (typeof data.data.coins === 'number') setCredits(data.data.coins);
        }
      } catch (err) {}
    };
    fetchRealData();

    // Socket.io for realtime coin updates
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(API_URL);

    socket.on('coin_update', (payload) => {
       const uId = JSON.parse(localStorage.getItem('giasu_user'))?._id;
       if (payload.studentId === uId) {
          setCredits(payload.newCoins);
          // Auto sync user data too
          const current = JSON.parse(localStorage.getItem('giasu_user') || '{}');
          current.coins = payload.newCoins;
          localStorage.setItem('giasu_user', JSON.stringify(current));
          setUserData(prev => ({ ...prev, coins: payload.newCoins }));
       }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchTransactions()
    if (activeTab === 'exam_history') fetchQuizzes()
  }, [activeTab])

  const recentActivity = [
    { type: 'lesson', title: 'Cơ sở hạ tầng phần cứng',     time: 'Hôm nay',     icon: Laptop },
    { type: 'quiz',   title: 'Thực hành IC3 GS6 Cơ bản',     time: 'Hôm qua',     icon: Target },
    { type: 'lesson', title: 'Thiết trị Giao diện Windows',   time: '2 ngày trước', icon: PlayCircle },
    { type: 'lesson', title: 'Quản trị Nguồn điện Hệ thống', time: '3 ngày trước', icon: Zap },
  ]

  const achievements = [
    { title: 'Bậc thầy Excel', desc: 'Sử dụng Pivot Table qua bài thi 800.', icon: Activity, earned: quizzes.some(q => q.topic.toLowerCase().includes('excel') && q.score >= 800) },
    { title: 'Chiến thần IC3', desc: 'Đạt 1000 điểm trọn vẹn IC3.', icon: ShieldCheck, earned: quizzes.some(q => q.topic.toLowerCase().includes('ic3') && q.score === 1000) },
    { title: 'Tối ưu Năng Lực', desc: 'Hoàn thành 5 bài thi.', icon: FileCheck2, earned: quizzes.length >= 5 },
    { title: 'Chuyên gia Đào Tạo', desc: 'Tích lũy đủ 1000 Xu.', icon: Zap, earned: credits >= 1000 },
  ]

  const TX_LABELS = {
    deposit:      { label: 'Nạp xu',           icon: '💰', color: '#10b981' },
    spend_chat:   { label: 'Chat AI Pro',       icon: '💬', color: '#6366f1' },
    spend_quiz:   { label: 'Tạo đề AI',         icon: '📝', color: '#8b5cf6' },
    spend_image:  { label: 'Tạo ảnh AI',        icon: '🖼️', color: '#ec4899' },
    spend_grade:  { label: 'Chấm bài AI',       icon: '📊', color: '#f59e0b' },
    bonus:        { label: 'Thưởng xu',         icon: '🎁', color: '#10b981' },
    refund:       { label: 'Hoàn xu',           icon: '↩️', color: '#06b6d4' },
    admin_adjust: { label: 'Admin điều chỉnh', icon: '🔧', color: '#94a3b8' },
  }

  const togglePwVisibility = (field) => setShowPw(p => ({ ...p, [field]: !p[field] }))

  return (
    <div className="profile-page">
      <Navbar />
      <div className="container profile-container">

        {/* ── Sidebar ── */}
        <aside className="profile-sidebar">
          <div style={{ marginBottom: '16px' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Quay Lại Bảng Điều Khiển
            </Link>
          </div>
          <div className="profile-card glass-card">
            {/* Avatar */}
            <div className="profile-avatar-wrap">
              <div className="profile-avatar" style={{ position: 'relative', overflow: 'visible' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <User size={48} color="#fff" />
                }
                <button
                  className="avatar-change-btn"
                  title="Thay ảnh đại diện"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={14} />
                </button>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
              <div className="level-badge" style={{ background: '#4f46e5' }}>Học viên Cấp 3</div>
            </div>

            {/* Tên và info */}
            {editMode ? (
              <div className="edit-fields">
                <label className="edit-label">Họ và tên</label>
                <input
                  className="edit-input"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Tên của bạn"
                />
                <label className="edit-label">Số điện thoại</label>
                <input
                  className="edit-input"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0909xxxxxx"
                />
                {saveMsg && <div className={`edit-msg ${saveMsg.startsWith('✅') ? 'success' : 'error'}`}>{saveMsg}</div>}
                <div className="edit-actions">
                  <button className="btn-edit-save" onClick={saveProfile} disabled={saving}>
                    {saving ? '⏳' : <><Check size={15}/> Lưu</>}
                  </button>
                  <button className="btn-edit-cancel" onClick={() => setEditMode(false)}>
                    <X size={15}/> Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <h1 className="profile-name">{userStats.name}</h1>
                  <button className="btn-edit-icon" onClick={startEdit} title="Sửa thông tin">
                    <Edit2 size={15}/>
                  </button>
                </div>
                <p className="profile-joined">{userStats.email}</p>
                {userStats.phone && <p className="profile-joined">📞 {userStats.phone}</p>}
                <p className="profile-joined">Ngày tham gia: {userStats.joinDate}</p>
              </>
            )}

            {/* Coin balance */}
            <div className="coin-balance-card">
              <div className="coin-balance-row">
                <span className="coin-icon">🪙</span>
                <div>
                  <div className="coin-amount">{userStats.coins.toLocaleString()} Xu</div>
                  <div className="coin-sub">Số dư hiện tại</div>
                </div>
                <Link to="/deposit" className="coin-topup-btn">Nạp thêm</Link>
              </div>
              <div className="coin-mini-stats">
                <span style={{ color: '#10b981' }}>↑ {userStats.totalEarned} đã nạp</span>
                <span style={{ color: '#f87171' }}>↓ {userStats.totalSpent} đã dùng</span>
              </div>
            </div>

            <div className="xp-bar-wrap" style={{ margin: '14px 0' }}>
              <div className="xp-labels">
                <span>450 Tín Chỉ</span>
                <span>500 Tín Chỉ (Chuẩn đầu ra)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '90%', background: '#4f46e5' }}></div>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="p-stat-box">
                <div className="p-stat-icon" style={{ color: '#4f46e5' }}><Clock size={24} /></div>
                <div className="p-stat-val">3</div>
                <div className="p-stat-label">Ngày truy cập</div>
              </div>
              <div className="p-stat-box">
                <div className="p-stat-icon" style={{ color: '#059669' }}><BookOpen size={24} /></div>
                <div className="p-stat-val">{userStats.lessonsCompleted}</div>
                <div className="p-stat-label">Module Đã HT</div>
              </div>
            </div>

            <Link to="/chat" className="btn-primary edit-profile-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Activity size={18} /> Phân Tích Lộ Trình Mới
            </Link>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="profile-main">
          <div className="profile-tabs">
            <button className={`p-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18}/> Tổng Quan
            </button>
            <button className={`p-tab ${activeTab === 'exam_history' ? 'active' : ''}`} onClick={() => setActiveTab('exam_history')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18}/> Lịch Sử Thi Thử
            </button>
            <button className={`p-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18}/> Lịch Sử Xu
            </button>
            <button className={`p-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18}/> Cài Đặt
            </button>
          </div>

          {/* ── Tab Hiệu Suất ── */}
          {activeTab === 'overview' && (
            <div className="tab-pane animate-fade-in-up">
              <section className="p-section">
                <div className="p-section-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={24}/> Biểu Đồ Đào Tạo 1 Kèm 1</h2>
                </div>
                <div className="course-progress-card glass-card">
                  <div className="cp-info">
                    <div className="cp-icon" style={{ background: 'rgba(79,70,229,0.1)', color: '#4f46e5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><BookOpen size={32}/></div>
                    <div>
                      <h3>Chứng nhận Đào Tạo Tin Học Chuyên Nghiệp</h3>
                      <p>{userStats.lessonsCompleted} / {userStats.totalLessons} Module chuyên sâu đã hoàn tất.</p>
                    </div>
                    <div className="cp-percentage">{Math.round((userStats.lessonsCompleted / userStats.totalLessons) * 100)}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(userStats.lessonsCompleted / userStats.totalLessons) * 100}%` }}></div>
                  </div>
                </div>
              </section>
              <section className="p-section mt-8">
                <div className="p-section-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={24}/> Lịch Trình Hoạt Động</h2>
                </div>
                <div className="activity-list glass-card">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="activity-item">
                      <div className="act-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><act.icon size={20}/></div>
                      <div className="act-info">
                        <h4>{act.title}</h4>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {act.type === 'lesson' ? 'Tiến Độ Bài Giảng' : 'Kết Quả Evaluation'}
                        </span>
                      </div>
                      <div className="act-time" style={{ color: '#64748b', fontSize: '0.875rem' }}>{act.time}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="p-section mt-8">
                <div className="p-section-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={24}/> Huy Hiệu & Thành Tích (Năng Lực)</h2>
                </div>
                <div className="achievements-grid">
                  {achievements.map((ach, i) => (
                    <div key={i} className={`achievement-card glass-card ${!ach.earned ? 'locked' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="ach-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: ach.earned ? '#10b981' : '#94a3b8' }}><ach.icon size={32}/></div>
                      <div className="ach-info"><h3>{ach.title}</h3><p>{ach.desc}</p></div>
                      {ach.earned
                        ? <div className="ach-status earned" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ShieldCheck size={16}/> Đã Chinh Phục</div>
                        : <div className="ach-status locked" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>Chưa Đạt</div>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ── Tab Lịch Sử Thi Thử ── */}
          {activeTab === 'exam_history' && (
            <div className="tab-pane animate-fade-in-up">
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
            </div>
          )}

          {/* ── Tab Lịch Sử Xu ── */}
          {activeTab === 'history' && (
            <div className="tab-pane animate-fade-in-up">
              <div className="history-summary">
                <div className="history-stat-card" style={{ borderTop: '3px solid #10b981' }}>
                  <TrendingUp size={22} color="#10b981"/><div><div className="hs-value" style={{ color: '#10b981' }}>+{userStats.totalEarned}</div><div className="hs-label">Tổng xu đã nạp</div></div>
                </div>
                <div className="history-stat-card" style={{ borderTop: '3px solid #f87171' }}>
                  <TrendingDown size={22} color="#f87171"/><div><div className="hs-value" style={{ color: '#f87171' }}>-{userStats.totalSpent}</div><div className="hs-label">Tổng xu đã dùng</div></div>
                </div>
                <div className="history-stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
                  <Coins size={22} color="#f59e0b"/><div><div className="hs-value" style={{ color: '#f59e0b' }}>{userStats.coins}</div><div className="hs-label">Số dư hiện tại</div></div>
                </div>
              </div>
              <div className="glass-card history-list">
                <div className="history-list-header">
                  <h3>📋 Lịch Sử Giao Dịch</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{transactions.length} giao dịch</span>
                </div>
                {txLoading ? <div className="history-loading">Đang tải...</div>
                : transactions.length === 0
                  ? <div className="history-empty"><CreditCard size={40} color="#334155"/><p>Chưa có giao dịch nào.</p></div>
                  : <div className="tx-list">
                      {transactions.map(tx => {
                        const meta = TX_LABELS[tx.type] || { label: tx.type, icon: '📌', color: '#94a3b8' }
                        return (
                          <div key={tx._id} className="tx-item">
                            <div className="tx-icon-wrap" style={{ background: `${meta.color}15` }}>
                              <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                            </div>
                            <div className="tx-info">
                              <div className="tx-label">{meta.label}</div>
                              <div className="tx-desc">{tx.description || '—'}</div>
                              <div className="tx-time">{new Date(tx.createdAt).toLocaleString('vi-VN')}</div>
                            </div>
                            <div className="tx-amount-col">
                              <div className="tx-delta" style={{ color: tx.coinsDelta >= 0 ? '#10b981' : '#f87171' }}>
                                {tx.coinsDelta >= 0 ? '+' : ''}{tx.coinsDelta} xu
                              </div>
                              <div className="tx-after">Còn lại: {tx.coinsAfter} xu</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                }
              </div>
              <div className="glass-card deposit-cta">
                <div>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>Cần thêm xu?</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Nạp xu để dùng AI, tạo đề và nhiều tính năng khác</div>
                </div>
                <Link to="/deposit" className="btn-deposit-cta">Nạp Xu Ngay <ChevronRight size={16}/></Link>
              </div>
            </div>
          )}

          {/* ── Tab Bảo Mật ── */}
          {activeTab === 'security' && (
            <div className="tab-pane animate-fade-in-up">
              <div className="security-grid">
                {/* Đổi mật khẩu */}
                <div className="glass-card security-card">
                  <div className="security-card-header">
                    <div className="security-icon-wrap"><Lock size={22}/></div>
                    <div>
                      <h3>Đổi Mật Khẩu</h3>
                      <p>Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ và số</p>
                    </div>
                  </div>

                  {[
                    { key: 'current', label: 'Mật khẩu hiện tại', placeholder: '••••••••' },
                    { key: 'newPw',   label: 'Mật khẩu mới',      placeholder: 'Tối thiểu 6 ký tự' },
                    { key: 'confirm', label: 'Xác nhận mật khẩu', placeholder: 'Nhập lại mật khẩu mới' },
                  ].map(({ key, label, placeholder }) => (
                    <div className="security-field" key={key}>
                      <label>{label}</label>
                      <div className="pw-field-wrap">
                        <input
                          type={showPw[key] ? 'text' : 'password'}
                          value={pwForm[key]}
                          onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="security-input"
                        />
                        <button type="button" className="pw-toggle" onClick={() => togglePwVisibility(key)}>
                          {showPw[key] ? <EyeOff size={17}/> : <Eye size={17}/>}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Strength indicator */}
                  {pwForm.newPw && (
                    <div className="pw-strength">
                      {['Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'].map((s, i) => {
                        const strength = pwForm.newPw.length >= 12 ? 3 : pwForm.newPw.length >= 8 ? 2 : pwForm.newPw.length >= 6 ? 1 : 0
                        const colors = ['#ef4444', '#f59e0b', '#10b981', '#6366f1']
                        return <div key={i} className="pw-strength-bar" style={{ background: i <= strength ? colors[strength] : 'rgba(148,163,184,0.1)' }}/>
                      })}
                      <span className="pw-strength-label" style={{
                        color: ['#ef4444','#f59e0b','#10b981','#6366f1'][pwForm.newPw.length >= 12 ? 3 : pwForm.newPw.length >= 8 ? 2 : pwForm.newPw.length >= 6 ? 1 : 0]
                      }}>
                        {['Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][pwForm.newPw.length >= 12 ? 3 : pwForm.newPw.length >= 8 ? 2 : pwForm.newPw.length >= 6 ? 1 : 0]}
                      </span>
                    </div>
                  )}

                  {pwMsg && <div className={`edit-msg ${pwMsg.startsWith('✅') ? 'success' : 'error'}`}>{pwMsg}</div>}

                  <button className="security-save-btn" onClick={changePassword} disabled={pwSaving}>
                    {pwSaving ? 'Đang xử lý...' : <><Lock size={16}/> Cập Nhật Mật Khẩu</>}
                  </button>
                </div>

                {/* Thông tin tài khoản */}
                <div className="glass-card security-card">
                  <div className="security-card-header">
                    <div className="security-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><User size={22}/></div>
                    <div>
                      <h3>Thông Tin Tài Khoản</h3>
                      <p>Thông tin cơ bản được liên kết với tài khoản của bạn</p>
                    </div>
                  </div>
                  {[
                    { label: '📧 Email', value: userStats.email },
                    { label: '👤 Họ tên', value: userStats.name },
                    { label: '📞 Điện thoại', value: userStats.phone || 'Chưa cập nhật' },
                    { label: '📅 Tham gia', value: userStats.joinDate },
                    { label: '🪙 Số dư xu', value: `${userStats.coins} xu` },
                  ].map(({ label, value }) => (
                    <div key={label} className="account-info-row">
                      <span className="ai-label">{label}</span>
                      <span className="ai-value">{value}</span>
                    </div>
                  ))}
                  <button className="btn-edit-profile" onClick={startEdit}>
                    <Edit2 size={16}/> Chỉnh Sửa Thông Tin
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
