import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, ShieldCheck, LogOut, BarChart2,
  CreditCard, Settings, Search, RefreshCw, Plus, ChevronLeft,
  ChevronRight, KeyRound, Building2, BookOpen, Save, Eye, EyeOff, LayoutTemplate,
  Coins, MessageSquare, Bot, User as UserIcon, Database, Upload, FileText, CheckCircle, Trash2, Cpu, Edit, ArrowLeft, FileQuestion, Bell, ToggleLeft, ToggleRight, Image, X
} from 'lucide-react'
import './AdminDashboard.css'
import AdminCourseForm from '../components/AdminCourseForm'
import AdminQuizForm from '../components/AdminQuizForm'
import AdminExamTab from '../components/AdminExamTab'
import { adminJsonAuthHeaders, adminAuthHeaders } from '../lib/authFetch'

// ─── Guard: chỉ admin mới vào được ─────────────
function useAdminGuard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token || !token.includes('.')) { navigate('/admin'); return }
    const rawUser = localStorage.getItem('admin_user')
    if (!rawUser) { navigate('/admin'); return }
    let user
    try { user = JSON.parse(rawUser) } catch { navigate('/admin'); return }
    if (user.role !== 'admin' && user.role !== 'staff') { navigate('/admin'); return }
    setAdmin(user)
  }, [navigate])
  return admin
}

// ─── Stat Card ───────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card glass-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────
export default function AdminDashboard() {
  const admin   = useAdminGuard()
  const navigate = useNavigate()

  const [tab, setTab]         = useState(() => localStorage.getItem('admin_tab') || 'overview')
  const [stats, setStats]     = useState(null)
  const [users, setUsers]     = useState([])
  const [txList, setTxList]   = useState([])
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(false)

  // Chat history
  const [chatHistory, setChatHistory]   = useState([])
  const [chatSearch, setChatSearch]     = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const [chatTotal, setChatTotal]       = useState(0)
  const [selectedStudent, setSelectedStudent] = useState(null) // lọc theo user

  // Modals
  const [adjustTarget, setAdjustTarget]   = useState(null)
  const [adjustDelta, setAdjustDelta]     = useState('')
  const [adjustReason, setAdjustReason]   = useState('')

  const [resetTarget, setResetTarget]     = useState(null)
  const [newPassword, setNewPassword]     = useState('')
  const [showNewPw, setShowNewPw]         = useState(false)
  const [resetLoading, setResetLoading]   = useState(false)
// States for Add User
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [addLoading, setAddLoading] = useState(false);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch('/api/users/add', {
        method: 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.success) {
         Swal.fire('Thành công', 'Thêm mới người dùng thành công', 'success');
         setShowAddUserModal(false);
         setNewUser({ name: '', email: '', password: '', role: 'student' });
         fetchUsers(); // Tải lại danh sách
      } else {
         Swal.fire('Lỗi', data.message, 'error');
      }
    } catch(err) {
      Swal.fire('Lỗi', 'Không thể kết nối đến server', 'error');
    }
    setAddLoading(false);
  };


  // Settings state
  const [bankInfo, setBankInfo] = useState({
    bankName: localStorage.getItem('admin_bank_name') || '',
    accountNumber: localStorage.getItem('admin_bank_acc') || '',
    accountName: localStorage.getItem('admin_bank_owner') || '',
    transferNote: localStorage.getItem('admin_bank_note') || 'NAP XU [TEN HOC VIEN]',
  })
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Footer config
  const loadFooter = () => {
    try { return JSON.parse(localStorage.getItem('admin_footer') || 'null') } catch { return null }
  }
  const [footerConfig, setFooterConfig] = useState(() => loadFooter() || {
    logoText:    'Gia Sư AI',
    logoTagline: 'Nền tảng học tập thông minh',
    logoUrl:     '',
    col1Title: 'Về Chúng Tôi',
    col1Lines: 'Học tin học online cùng Gia Sư Tin Học\nGiảng viên kinh nghiệm 10+ năm\nHọc mọi lúc, mọi nơi với AI',
    col2Title: 'Liên Kết Nhanh',
    col2Links: '/\tTrang Chủ\n/lessons\tKhoá Học\n/chat\tChat AI\n/quiz\tThi Trắc Nghiệm',
    col3Title: 'Liên Hệ',
    col3Lines: '📍 TP. Hồ Chí Minh\n📞 0909 000 000\n📧 info@giasutinhoc24h.com\n🕐 Thứ 2 - Thứ 7: 8h-20h',
    copyright: '© 2025 Gia Sư AI. Tất cả quyền được bảo lưu.',
  })
  const [footerSaved, setFooterSaved] = useState(false)

  // Server Settings state
  const [appSettings, setAppSettings] = useState({
    geminiKey: '', openaiKey: '', tavilyApiKey: '',
    coinPackages: [],
    aiCost: {}
  })
  const [appSettingsSaved, setAppSettingsSaved] = useState(false)

  // Advisor content state
  const [advisorContent, setAdvisorContent] = useState('')
  const [advisorSaved, setAdvisorSaved] = useState(false)

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin')
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { headers: adminAuthHeaders() })
      const d = await res.json()
      if (d.success && d.data) {
         setAppSettings(d.data)
         setAdvisorContent(d.data.advisorContent || '')
      }
    } catch {}
  }

  // Knowledge base state
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [knowledgeStats, setKnowledgeStats] = useState(null);
  const [uploadTopic, setUploadTopic] = useState('other');
  const [buildLoading, setBuildLoading] = useState(false);

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge', { headers: adminAuthHeaders() });
      const d = await res.json();
      if (d.success) {
        setKnowledgeData(d.data);
        setKnowledgeStats(d.indexStats);
      }
    } catch {}
  }

  useEffect(() => {
    if (tab === 'knowledge') fetchKnowledge();
  }, [tab])

  // CMS state
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [cmsView, setCmsView] = useState(() => localStorage.getItem('admin_cms_view') || 'overview'); // overview, courses, quizzes, courseForm, quizForm
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [courseAnalyticsOpen, setCourseAnalyticsOpen] = useState(false);
  const [courseAnalyticsData, setCourseAnalyticsData] = useState(null);
  const [courseAnalyticsLoading, setCourseAnalyticsLoading] = useState(false);

  const openCourseAnalytics = async (courseId) => {
    setCourseAnalyticsOpen(true);
    setCourseAnalyticsData(null);
    setCourseAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/analytics`, { headers: adminAuthHeaders() });
      const d = await res.json();
      if (d.success) setCourseAnalyticsData(d.data);
      else {
        Swal.fire('Lỗi', d.message || 'Không tải thống kê', 'error');
        setCourseAnalyticsOpen(false);
      }
    } catch {
      Swal.fire('Lỗi', 'Không kết nối được máy chủ', 'error');
      setCourseAnalyticsOpen(false);
    }
    setCourseAnalyticsLoading(false);
  };

  // Popup management state
  const [popups, setPopups] = useState([])
  const [popupLoading, setPopupLoading] = useState(false)
  const [popupForm, setPopupForm] = useState({ title: '', content: '', imageUrl: '', buttonText: 'Đã hiểu', buttonUrl: '', isActive: true, priority: 0 })
  const [editingPopup, setEditingPopup] = useState(null)
  const [showPopupForm, setShowPopupForm] = useState(false)

  useEffect(() => {
    localStorage.setItem('admin_tab', tab);
  }, [tab]);

  useEffect(() => {
    localStorage.setItem('admin_cms_view', cmsView);
  }, [cmsView]);
  
  const fetchCourses = async () => {
    try { const res = await fetch('/api/courses', { headers: adminAuthHeaders() }); const d = await res.json(); if(d.success) setCourses(d.data); } catch {}
  }
  const fetchQuizzes = async () => {
    try { const res = await fetch('/api/quizzes', { headers: adminAuthHeaders() }); const d = await res.json(); if(d.success) setQuizzes(d.data); } catch {}
  }
  
  useEffect(() => {
    if (tab === 'cms') { fetchCourses(); fetchQuizzes(); }
  }, [tab])

  const handleDeleteCourse = async (id) => {
    const confirmInfo = await Swal.fire({title: 'Xóa bài học?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'});
    if (!confirmInfo.isConfirmed) return;
    try {
      await fetch(`/api/courses/${id}`, { method: 'DELETE', headers: adminAuthHeaders() });
      fetchCourses();
      Swal.fire('Thành công', 'Đã xóa khóa học', 'success');
    } catch {}
  }
  
  const handleDeleteQuiz = async (id) => {
    const confirmInfo = await Swal.fire({title: 'Xóa câu hỏi?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'});
    if (!confirmInfo.isConfirmed) return;
    try {
      await fetch(`/api/quizzes/${id}`, { method: 'DELETE', headers: adminAuthHeaders() });
      fetchQuizzes();
      Swal.fire('Thành công', 'Đã xóa câu hỏi', 'success');
    } catch {}
  }

  const handleUploadFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('topic', uploadTopic);
    for(let i = 0; i < files.length; i++) { formData.append('files', files[i]); }

    try {
      const res = await fetch('/api/knowledge/upload', { method: 'POST', headers: adminAuthHeaders(), body: formData });
      const d = await res.json();
      if(d.success) { Swal.fire(d.message); fetchKnowledge(); } else Swal.fire('Lỗi: ' + d.message);
    } catch { Swal.fire('Lỗi tải file'); }
    e.target.value = '';
  }

  const handleDeleteFile = async (topic, file) => {
    const confirm = await Swal.fire({title: 'Xác nhận xoá', text: `Bạn có chắc chắn muốn xoá file "${file}" khỏi chủ đề "${topic}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy'})
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch('/api/knowledge/delete', {
        method: 'POST', headers: adminJsonAuthHeaders(),
        body: JSON.stringify({ topic, file })
      });
      const d = await res.json();
      if(d.success) { fetchKnowledge(); } else Swal.fire('Lỗi: ' + d.message);
    } catch {}
  }

  const handleBuildKnowledge = async () => {
    setBuildLoading(true);
    try {
      const res = await fetch('/api/knowledge/build', { method: 'POST', headers: adminAuthHeaders() });
      const d = await res.json();
      if(d.success) { 
        Swal.fire(d.message); 
        fetchKnowledge();
      } else Swal.fire('Lỗi: ' + d.message + '\n\n' + d.output);
    } catch { Swal.fire('Lỗi khi biên dịch tri thức'); }
    setBuildLoading(false);
  }

  const fetchStats = async () => {
    const r = await fetch('/api/users/stats/overview', { headers: adminAuthHeaders() })
    const d = await r.json()
    if (d.success) setStats(d.data)
  }

  const fetchUsers = async (pg = 1, q = '') => {
    setLoading(true)
    const r = await fetch(`/api/users?page=${pg}&limit=10&search=${encodeURIComponent(q)}`, { headers: adminAuthHeaders() })
    const d = await r.json()
    if (d.success) { setUsers(d.data); setTotalUsers(d.total) }
    setLoading(false)
  }

  const fetchTx = async () => {
    const r = await fetch('/api/billing/transactions?limit=40', { headers: adminAuthHeaders() })
    const d = await r.json()
    if (d.success) setTxList(d.data)
  }

  const fetchChatHistory = async (studentId = '') => {
    setChatLoading(true)
    const url = studentId
      ? `/api/chat-history/student/${studentId}?limit=40`
      : '/api/chat-history?limit=40'
    const r = await fetch(url, { headers: adminAuthHeaders() })
    const d = await r.json()
    if (d.success) { setChatHistory(d.data); setChatTotal(d.total) }
    setChatLoading(false)
  }

  useEffect(() => { fetchStats(); fetchUsers(); fetchTx(); fetchSettings(); }, [])

  const fetchPopups = async () => {
    setPopupLoading(true)
    try {
      const r = await fetch('/api/popups', { headers: adminAuthHeaders() })
      const d = await r.json()
      if (d.success) setPopups(d.data)
    } catch {}
    setPopupLoading(false)
  }

  const handleSavePopup = async () => {
    if (!popupForm.title.trim()) return Swal.fire('Vui lòng nhập tiêu đề popup')
    try {
      const url = editingPopup ? `/api/popups/${editingPopup._id}` : '/api/popups'
      const method = editingPopup ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: adminJsonAuthHeaders(), body: JSON.stringify(popupForm) })
      const d = await r.json()
      if (d.success) {
        Swal.fire({ icon: 'success', title: editingPopup ? 'Đã cập nhật popup!' : 'Đã tạo popup mới!', timer: 1500, showConfirmButton: false })
        setShowPopupForm(false); setEditingPopup(null)
        setPopupForm({ title: '', content: '', imageUrl: '', buttonText: 'Đã hiểu', buttonUrl: '', isActive: true, priority: 0 })
        fetchPopups()
      }
    } catch { Swal.fire('Lỗi kết nối server') }
  }

  const handleTogglePopup = async (id) => {
    try {
      const r = await fetch(`/api/popups/${id}/toggle`, { method: 'PATCH', headers: adminAuthHeaders() })
      const d = await r.json()
      if (d.success) fetchPopups()
    } catch {}
  }

  const handleDeletePopup = async (id) => {
    const c = await Swal.fire({ title: 'Xóa popup?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' })
    if (!c.isConfirmed) return
    await fetch(`/api/popups/${id}`, { method: 'DELETE', headers: adminAuthHeaders() })
    fetchPopups()
  }

  useEffect(() => {
    if (tab === 'chatlog') fetchChatHistory(selectedStudent || '')
  }, [tab, selectedStudent])

  useEffect(() => {
    if (tab === 'popups') fetchPopups()
  }, [tab])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1, search) }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Adjust coins
  const handleAdjust = async () => {
    if (!adjustDelta || isNaN(adjustDelta)) return Swal.fire('Nhập số xu cần điều chỉnh')
    const r = await fetch(`/api/users/${adjustTarget._id}/coins/adjust`, {
      method: 'POST',
      headers: adminJsonAuthHeaders(),
      body: JSON.stringify({ delta: Number(adjustDelta), reason: adjustReason })
    })
    const d = await r.json()
    if (d.success) {
      Swal.fire(`✅ ${d.message}. Số dư mới: ${d.currentCoins} xu`)
      setAdjustTarget(null); setAdjustDelta(''); setAdjustReason('')
      fetchUsers(page, search); fetchStats()
    } else Swal.fire('❌ ' + d.message)
  }

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return Swal.fire('Mật khẩu mới phải ít nhất 6 ký tự')
    setResetLoading(true)
    try {
      const r = await fetch(`/api/users/${resetTarget._id}/reset-password`, {
        method: 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify({ newPassword })
      })
      const d = await r.json()
      if (d.success) {
        Swal.fire(`✅ Đã đặt lại mật khẩu cho ${resetTarget.name}\nMật khẩu mới: ${newPassword}`)
        setResetTarget(null); setNewPassword('')
      } else Swal.fire('❌ ' + d.message)
    } catch { Swal.fire('Lỗi kết nối server') }
    finally { setResetLoading(false) }
  }

  // Save bank settings (lưu localStorage)
  const handleSaveSettings = () => {
    localStorage.setItem('admin_bank_name',  bankInfo.bankName)
    localStorage.setItem('admin_bank_acc',   bankInfo.accountNumber)
    localStorage.setItem('admin_bank_owner', bankInfo.accountName)
    localStorage.setItem('admin_bank_note',  bankInfo.transferNote)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // Save Server Config
  const handleSaveAppSettings = async () => {
    try {
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify(appSettings)
      })
      const d = await r.json()
      if (d.success) {
        setAppSettingsSaved(true)
        setTimeout(() => setAppSettingsSaved(false), 2000)
      } else Swal.fire('Lỗi: ' + d.message)
    } catch { Swal.fire('Lỗi kết nối server!') }
  }

  // Save Advisor Content
  const handleSaveAdvisorContent = async () => {
    try {
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify({ advisorContent })
      })
      const d = await r.json()
      if (d.success) {
        setAdvisorSaved(true)
        setTimeout(() => setAdvisorSaved(false), 2500)
      } else Swal.fire('Lỗi: ' + d.message)
    } catch { Swal.fire('Lỗi kết nối server!') }
  }

  // Save footer config (localStorage)
  const handleSaveFooter = () => {
    localStorage.setItem('admin_footer', JSON.stringify(footerConfig))
    setFooterSaved(true)
    setTimeout(() => setFooterSaved(false), 2200)
  }
  const setFooter = (key, val) => setFooterConfig(f => ({ ...f, [key]: val }))

  if (!admin) return null

  const totalPages = Math.ceil(totalUsers / 10)
  const TYPE_LABELS = {
    deposit: '💰 Nạp xu', spend_chat: '💬 Chat AI', spend_quiz: '📝 Tạo đề',
    spend_image: '🖼️ Ảnh AI', spend_grade: '📊 Chấm bài', bonus: '🎁 Thưởng',
    refund: '↩️ Hoàn xu', admin_adjust: '🔧 Admin điều chỉnh'
  }

  const ALL_NAV_ITEMS = [
    { id: 'overview',  icon: <BarChart2 size={20}/>,     label: 'Tổng Quan' },
    { id: 'users',     icon: <Users size={20}/>,         label: 'Người Dùng' },
    { id: 'billing',   icon: <CreditCard size={20}/>,   label: 'Giao Dịch' },
    { id: 'chatlog',   icon: <MessageSquare size={20}/>, label: 'Hỏi Đáp AI' },
    { id: 'advisor',   icon: <Bot size={20}/>,           label: 'Nội Dung Tư Vấn' },
    { id: 'knowledge', icon: <Database size={20}/>,      label: 'Huấn Luyện AI' },
    { id: 'cms',       icon: <BookOpen size={20}/>,      label: 'Nội Dung CMS' },
    { id: 'exams',     icon: <FileText size={20}/>,      label: 'Chấm Bài Thi' },
    { id: 'popups',    icon: <Bell size={20}/>,          label: 'Popup Thông Báo' },
    { id: 'settings',  icon: <Settings size={20}/>,     label: 'Cấu Hình' },
  ];

  // Giới hạn quyền Nhân Viên
  const STAFF_ALLOWED_TABS = ['overview', 'popups', 'billing', 'advisor', 'users'];
  const NAV_ITEMS = admin?.role === 'staff'
    ? ALL_NAV_ITEMS.filter(item => STAFF_ALLOWED_TABS.includes(item.id))
    : ALL_NAV_ITEMS;

  return (
    <div className="admin-dashboard">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar glass-card">
        <div className="sidebar-brand">
          <ShieldCheck size={28} color="#6366f1" />
          <span>Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className="sidebar-item" 
            onClick={() => navigate('/')}
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}
          >
            <ArrowLeft size={20}/> Ra Website Chính
          </button>
          
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => { setTab(item.id); if (item.id === 'cms') setCmsView('overview'); }}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <button 
            className="sidebar-item" 
            onClick={() => navigate('/admin/homepage-config')}
            style={{ marginTop: '16px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <LayoutTemplate size={20}/> Trang Chủ Marketing
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-admin-info">
            <div className="admin-avatar">{admin.name?.[0] || 'A'}</div>
            <div>
              <div className="admin-name">{admin.name}</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>📊 Tổng Quan Hệ Thống</h2>
              <button className="btn-refresh" onClick={() => { fetchStats(); fetchUsers(); fetchTx() }}>
                <RefreshCw size={16} /> Làm mới
              </button>
            </div>
            {stats ? (
              <>
                <div className="stats-grid">
                  <StatCard icon={<Users size={24}/>}      label="Tổng người dùng"   value={stats.totalUsers}                              sub={`${stats.totalActiveUsers} đang hoạt động`} color="#6366f1" />
                  <StatCard icon={<Coins size={24}/>}      label="Xu trong hệ thống" value={stats.totalCoinsInSystem?.toLocaleString()}    sub="Tổng số dư chưa tiêu"                       color="#f59e0b" />
                  <StatCard icon={<TrendingUp size={24}/>} label="Doanh thu"         value={`${((stats.totalRevenueVND||0)/1000).toFixed(0)}K ₫`} sub="Tổng nạp đã xác nhận"              color="#10b981" />
                  <StatCard icon={<ShieldCheck size={24}/>} label="Trạng thái"       value="Ổn định"                                       sub="Hệ thống hoạt động bình thường"              color="#ec4899" />
                </div>
                <div className="recent-section glass-card">
                  <h3>👤 Người dùng mới nhất</h3>
                  <table className="admin-table">
                    <thead><tr><th>Tên</th><th>Email</th><th>Xu</th><th>Đăng ký</th></tr></thead>
                    <tbody>
                      {stats.recentUsers.map(u => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className="coin-badge">{u.coins} xu</span></td>
                          <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : <div className="loading-state">Đang tải dữ liệu...</div>}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2>👥 Quản Lý Người Dùng</h2>
                <button onClick={() => setShowAddUserModal(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Plus size={16} /> THÊM NGƯỜI DÙNG
                </button>
              </div>
              <div className="search-box">
                <Search size={16} />
                <input placeholder="Tìm tên, email, SĐT..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="glass-card table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th><th>Email</th><th>SĐT</th>
                    <th>Xu</th><th>Tiêu</th><th>Role</th><th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'#64748b' }}>Đang tải...</td></tr>
                  ) : users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-sm">{u.name?.[0]}</div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td><span className="coin-badge">{u.coins}</span></td>
                      <td><span className="spent-badge">{u.totalSpent || 0}</span></td>
                      <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" title="Điều chỉnh xu" onClick={() => setAdjustTarget(u)}>
                            <Coins size={15} />
                          </button>
                          <button className="action-btn deposit" title="Nạp 30 xu nhanh" onClick={async () => {
                            const r = await fetch('/api/billing/deposit', { method:'POST', headers: adminJsonAuthHeaders(), body: JSON.stringify({ studentId: u._id, planId: 'starter' }) })
                            const d = await r.json()
                            if (d.success) { Swal.fire(`✅ Nạp ${d.added} xu cho ${u.name}`); fetchUsers(page, search); fetchStats() }
                          }}>
                            <Plus size={15} />
                          </button>
                          <button className="action-btn reset-pw" title="Reset mật khẩu" onClick={() => setResetTarget(u)}>
                            <KeyRound size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">
                <span className="page-info">Hiển thị {users.length}/{totalUsers} người dùng</span>
                <div className="page-btns">
                  <button disabled={page <= 1} onClick={() => { setPage(p => p-1); fetchUsers(page-1, search) }}><ChevronLeft size={16}/></button>
                  <span>{page} / {totalPages||1}</span>
                  <button disabled={page >= totalPages} onClick={() => { setPage(p => p+1); fetchUsers(page+1, search) }}><ChevronRight size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {tab === 'billing' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>💳 Lịch Sử Giao Dịch</h2>
              <button className="btn-refresh" onClick={fetchTx}><RefreshCw size={16}/> Làm mới</button>
            </div>
            <div className="glass-card table-card">
              <table className="admin-table">
                <thead>
                  <tr><th>Người dùng</th><th>Loại</th><th>Xu</th><th>Số dư sau</th><th>Ghi chú</th><th>Thời gian</th></tr>
                </thead>
                <tbody>
                  {txList.map(tx => (
                    <tr key={tx._id}>
                      <td>{tx.studentName||'—'}</td>
                      <td><span className={`tx-type ${tx.type?.startsWith('spend')?'spend':'earn'}`}>{TYPE_LABELS[tx.type]||tx.type}</span></td>
                      <td><span style={{color: tx.coinsDelta>=0?'#10b981':'#ef4444', fontWeight:'bold'}}>{tx.coinsDelta>=0?'+':''}{tx.coinsDelta}</span></td>
                      <td>{tx.coinsAfter}</td>
                      <td style={{fontSize:'0.83rem', color:'#94a3b8'}}>{tx.description?.slice(0,45)}</td>
                      <td style={{fontSize:'0.8rem', color:'#64748b'}}>{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CHATLOG TAB ── */}
        {tab === 'chatlog' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>💬 Lịch Sử Hỏi Đáp AI</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {selectedStudent && (
                  <button className="btn-refresh" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                    onClick={() => setSelectedStudent(null)}>
                    ✕ Bỏ lọc user
                  </button>
                )}
                <button className="btn-refresh" onClick={() => fetchChatHistory(selectedStudent || '')}>
                  <RefreshCw size={16}/> Làm mới
                </button>
              </div>
            </div>

            {/* Lọc theo học viên */}
            <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Lọc theo học viên:</span>
              <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                <Search size={16}/>
                <select
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.9rem', width: '100%' }}
                  value={selectedStudent || ''}
                  onChange={e => setSelectedStudent(e.target.value || null)}
                >
                  <option value="">— Tất cả học viên —</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <span style={{ color: '#475569', fontSize: '0.82rem' }}>Tổng: {chatTotal} tin nhắn</span>
            </div>

            {/* Danh sách hỏi đáp */}
            <div className="glass-card table-card">
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Đang tải lịch sử...</div>
              ) : chatHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
                  <MessageSquare size={40} color="#334155" style={{ margin: '0 auto 12px' }}/>
                  <p>Chưa có lịch sử hỏi đáp nào.</p>
                </div>
              ) : (
                <div className="chatlog-list">
                  {chatHistory.map((msg, idx) => {
                    const isUser = msg.role === 'user'
                    return (
                      <div key={msg._id || idx} className={`chatlog-item ${isUser ? 'user-msg' : 'ai-msg'}`}>
                        <div className="chatlog-avatar">
                          {isUser
                            ? <div className="chatlog-avatar-user"><UserIcon size={16}/></div>
                            : <div className="chatlog-avatar-ai"><Bot size={16}/></div>
                          }
                        </div>
                        <div className="chatlog-body">
                          <div className="chatlog-meta">
                            <span className="chatlog-name">
                              {isUser ? (msg.studentName || 'Học viên') : '🤖 Gia Sư AI'}
                            </span>
                            {isUser && <span className="chatlog-email">{msg.studentEmail}</span>}
                            <span className={`chatlog-mode ${msg.aiMode}`}>{msg.aiMode === 'pro' ? 'PRO' : 'Free'}</span>
                            <span className="chatlog-time">{new Date(msg.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className={`chatlog-content ${isUser ? 'user' : 'ai'}`}>
                            {msg.content?.slice(0, 400)}{msg.content?.length > 400 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── KNOWLEDGE BASE (Huấn luyện AI) ── */}
        {tab === 'knowledge' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2><Database size={24} color="#8b5cf6" style={{marginRight: 10, display: 'inline', verticalAlign: 'middle'}}/> Kho Tri Thức RAG (Huấn Luyện AI)</h2>
              <button className="btn-refresh" onClick={fetchKnowledge}>
                <RefreshCw size={16} /> Làm mới
              </button>
            </div>

            <div className="knowledge-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
              {/* Danh sách Chủ đề */}
              <div className="topic-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div className="glass-card settings-card">
                   <p style={{color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.65}}>Tải lên PDF, DOCX, TXT vào đúng <strong>chủ đề</strong>. Nhấn <strong>Biên Tập RAG</strong> để tạo chỉ mục: hệ thống dùng <strong>embedding Gemini</strong> (cần key trong Cấu hình + file <code>.env</code>) kết hợp <strong>từ khóa</strong> để tìm đoạn giống trợ lý đọc sách. Sau mỗi lần thêm/sửa file, <strong>build lại</strong> và restart server nếu cần.</p>
                 </div>
                 {knowledgeData.length === 0 ? (
                   <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed #64748b' }}>
                     Chưa có thư mục/tài liệu nào.
                   </div>
                 ) : (
                   knowledgeData.map(topic => (
                     <div key={topic.name} className="glass-card" style={{ padding: '16px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                         <h4 style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', margin: 0 }}>
                           <BookOpen size={18}/> Chủ đề: {topic.name}
                         </h4>
                         <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '20px' }}>{topic.files.length} file</span>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {topic.files.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Thư mục trống</p> : null}
                         {topic.files.map(file => (
                           <div key={file.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
                             <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '10px' }}>
                               <FileText size={15} color="#cbd5e1" style={{flexShrink:0}}/> {file.name} 
                               <span style={{color: '#64748b', fontSize: '0.75rem'}}>({(file.size / 1024).toFixed(1)} KB)</span>
                             </span>
                             <button onClick={() => handleDeleteFile(topic.name, file.name)} style={{ color: '#ef4444', background: 'none', cursor: 'pointer', flexShrink: 0, padding: '3px 8px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px' }} title="Xoá file">
                               <Trash2 size={14}/>
                             </button>
                           </div>
                         ))}
                       </div>
                     </div>
                   ))
                 )}
              </div>

              {/* Cột Upload & Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18}/> Nạp Thêm Tri Thức</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Chọn Chủ đề / Khóa học</label>
                      <select 
                        className="settings-input" 
                        value={uploadTopic} 
                        onChange={e => setUploadTopic(e.target.value)} 
                        style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', color: '#f1f5f9', cursor: 'pointer' }}
                      >
                        <option value="other">-- Khác / Chung --</option>
                        <option value="word">Microsoft Word</option>
                        <option value="excel">Microsoft Excel</option>
                        <option value="powerpoint">Microsoft PowerPoint</option>
                        <option value="ic3">Chứng chỉ IC3</option>
                        <option value="mos">Chứng chỉ MOS</option>
                        <option value="networking">Mạng Máy Tính (Networking)</option>
                        <option value="python">Lập trình Python</option>
                        <option value="c">Lập trình C/C++</option>
                        <option value="database">Cơ sở dữ liệu (Database)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tài liệu (PDF, DOCX, TXT)</label>
                      <input type="file" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleUploadFile} className="settings-input" style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}><Cpu size={18}/> Trạng Thái AI Core</h3>
                  
                  {knowledgeStats ? (
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.7', background: 'rgba(16,185,129,0.06)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <p style={{margin: '0 0 4px'}}>✅ <strong>Cập nhật:</strong> {new Date(knowledgeStats.builtAt).toLocaleString('vi-VN')}</p>
                      <p style={{margin: '0 0 4px'}}>📁 <strong>Tổng File:</strong> {knowledgeStats.stats.totalFiles || 0}</p>
                      <p style={{margin: '0 0 4px'}}>🧩 <strong>Dữ liệu Text:</strong> {knowledgeStats.stats.totalChunks || 0} đoạn</p>
                      <p style={{margin: 0}}>⚠️ <strong>Lỗi đọc file:</strong> {knowledgeStats.stats.skipped || 0}</p>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      Chưa có dữ liệu giáo trình. Khuyên dùng chức năng Build RAG.
                    </div>
                  )}

                  <button 
                    className="btn-primary" 
                    onClick={handleBuildKnowledge} 
                    disabled={buildLoading}
                    style={{ width: '100%', marginTop: '16px', justifyContent: 'center', padding: '12px', background: buildLoading ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)', boxShadow: buildLoading ? 'none' : '0 4px 15px rgba(16,185,129,0.4)', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 600, cursor: buildLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {buildLoading ? 'Đang Xử Lý...' : <><RefreshCw size={18}/> Biên Tập Tự Động RAG</>}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px', textAlign: 'center', lineHeight: 1.5 }}>
                    Mỗi lần tải lên file mới, bạn cần phải ấn Biên Tập để AI nạp dữ liệu. Quá trình có thể mất thời gian.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CMS KHOA HOC VA DE THI ── */}
        {tab === 'exams' && <AdminExamTab />}
          {tab === 'cms' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>📚 Quản Trị Hệ Thống Nội Dung (LMS CMS)</h2>
              {cmsView !== 'overview' && (
                <button className="btn-outline" onClick={() => setCmsView('overview')} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                  <ArrowLeft size={16}/> Quay lại Menu
                </button>
              )}
            </div>
            
            {cmsView === 'overview' && (
              <div className="glass-card" style={{ padding: '30px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                  <button 
                    className="btn-primary"
                    style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 20px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', transition: 'all 0.3s', cursor: 'pointer' }}
                    onClick={() => setCmsView('courses')}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(16,185,129,0.15)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <BookOpen size={48} />
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Quản Lý Khoá Học & Bài Giảng ({courses.length})</span>
                  </button>

                  <button 
                    className="btn-primary"
                    style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 20px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', transition: 'all 0.3s', cursor: 'pointer' }}
                    onClick={() => setCmsView('quizzes')}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(245,158,11,0.15)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <FileQuestion size={48} />
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Quản Lý KHO ĐỀ THI Random ({quizzes.length})</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '16px', color: '#818cf8', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
                    <Database size={40} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', color: '#f1f5f9' }}>Lưu trữ dữ liệu Khẩn Cấp (File Tĩnh sang MongoDB)</h3>
                    <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.5, maxWidth: '600px' }}>
                      Chức năng dùng để chuyển toàn bộ dữ liệu cứng hiện có lên server. Cẩn thận vì nó sẽ làm mới đè dữ liệu trên DB.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button 
                    className="btn-outline"
                    style={{ flex: 1, padding: '14px', borderRadius: '14px' }}
                    onClick={async () => {
                      try {
                        const m = await import('../data/lessons.js');
                        const res = await fetch('/api/courses/seed', { method: 'POST', headers: adminJsonAuthHeaders(), body: JSON.stringify({ lessonsArray: m.LESSONS }) });
                        const d = await res.json();
                        if(d.success) { fetchCourses(); Swal.fire('Thành công', d.message, 'success'); }
                      } catch (e) { Swal.fire('Lỗi', e.message || String(e), 'error'); }
                    }}
                  >
                    <Upload size={18} /> Forced Sync Bài Giảng lên Server
                  </button>
                  <button 
                    className="btn-outline"
                    style={{ flex: 1, padding: '14px', borderRadius: '14px' }}
                    onClick={async () => {
                      try {
                        const m = await import('../data/quizData.js');
                        const res = await fetch('/api/quizzes/seed', { method: 'POST', headers: adminJsonAuthHeaders(), body: JSON.stringify({ questionsArray: m.QUIZ_QUESTIONS }) });
                        const d = await res.json();
                        if(d.success) { fetchQuizzes(); Swal.fire('Thành công', d.message, 'success'); }
                      } catch (e) { Swal.fire('Lỗi', e.message || String(e), 'error'); }
                    }}
                  >
                    <Upload size={18} /> Forced Sync Đề Thi lên Server
                  </button>
                </div>
              </div>
            )}

            {cmsView === 'courses' && (
               <div className="glass-card table-card animate-fade-in-up">
                 <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', gap: '10px', alignItems: 'center' }}><BookOpen color="#10b981"/> Quản lý {courses.length} Khóa học</h3>
                   <button className="btn-primary" onClick={() => { setEditingCourse(null); setCmsView('courseForm'); }} style={{ background: '#10b981', border: 'none', borderRadius: '12px', padding: '10px 20px', display: 'flex', gap: '8px' }}>
                     <Plus size={18}/> Tạo Khóa Học Mới
                   </button>
                 </div>
                 <table className="admin-table">
                   <thead>
                     <tr>
                       <th>Mã ID</th>
                       <th>Tiêu đề Khóa học</th>
                       <th>Chuyên mục</th>
                       <th>Thời lượng</th>
                       <th>Lộ trình (Số Module)</th>
                       <th>Thao tác</th>
                     </tr>
                   </thead>
                   <tbody>
                     {courses.length === 0 ? <tr><td colSpan="6" style={{textAlign:'center', padding:'30px'}}>Chưa có dữ liệu, hãy ấn nút Đồng Bộ ở bên ngoài.</td></tr> : courses.map(c => (
                       <tr key={c._id}>
                         <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{c.id}</td>
                         <td><strong style={{color: c.color || '#fff'}}>{c.emoji} {c.title}</strong></td>
                         <td><span className="badge" style={{background: 'rgba(99,102,241,0.1)', color: '#818cf8'}}>{c.category}</span></td>
                         <td>{c.duration}</td>
                         <td><span style={{ fontWeight: 'bold' }}>{c.steps?.length || 0}</span> Bài chia nhỏ</td>
                         <td>
                           <div style={{display:'flex', gap:'8px', flexWrap: 'wrap'}}>
                             <button type="button" title="Thống kê học viên" className="btn-outline" style={{padding:'6px 10px', borderRadius: '8px', color:'#38bdf8', borderColor:'rgba(56,189,248,0.35)'}} onClick={() => openCourseAnalytics(c.id)}><BarChart2 size={16}/></button>
                             <button type="button" className="btn-outline" style={{padding:'6px 10px', borderRadius: '8px'}} onClick={() => { setEditingCourse(c); setCmsView('courseForm'); }}><Edit size={16}/></button>
                             <button type="button" className="btn-outline" style={{padding:'6px 10px', borderRadius: '8px', color:'#ef4444', borderColor:'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)'}} onClick={()=>handleDeleteCourse(c.id)}><Trash2 size={16}/></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}

            {cmsView === 'quizzes' && (
               <div className="glass-card table-card animate-fade-in-up">
                 <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', gap: '10px', alignItems: 'center' }}><FileQuestion color="#f59e0b"/> Quản lý {quizzes.length} Câu hỏi Đề thi</h3>
                   <button className="btn-primary" onClick={() => { setEditingQuiz(null); setCmsView('quizForm'); }} style={{ background: '#f59e0b', border: 'none', borderRadius: '12px', padding: '10px 20px', display: 'flex', gap: '8px', color: '#fff' }}>
                     <Plus size={18}/> Thêm Câu Hỏi Tay
                   </button>
                 </div>
                 <table className="admin-table">
                   <thead>
                     <tr>
                       <th style={{ width: '40px' }}>STT</th>
                       <th>Nội dung câu hỏi trắc nghiệm</th>
                       <th>Chuyên đề</th>
                       <th>Đáp án đúng (Key)</th>
                       <th>Thao tác</th>
                     </tr>
                   </thead>
                   <tbody>
                     {quizzes.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>Chưa có dữ liệu, hãy ấn nút Đồng Bộ ở bên ngoài.</td></tr> : quizzes.map((q, i) => (
                       <tr key={q._id}>
                         <td style={{ color: '#94a3b8' }}>#{i+1}</td>
                         <td style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, color: '#e2e8f0' }}>{q.question}</td>
                         <td><span className="badge" style={{background: 'rgba(245,158,11,0.1)', color: '#fcd34d'}}>{q.category}</span></td>
                         <td style={{ color: '#10b981', fontWeight: 'bold' }}> {['A','B','C','D'][q.correct]}. {q.options[q.correct]}</td>
                         <td>
                           <div style={{display:'flex', gap:'8px'}}>
                             <button className="btn-outline" style={{padding:'6px 10px', borderRadius: '8px'}} onClick={() => { setEditingQuiz(q); setCmsView('quizForm'); }}><Edit size={16}/></button>
                             <button className="btn-outline" style={{padding:'6px 10px', borderRadius: '8px', color:'#ef4444', borderColor:'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)'}} onClick={()=>handleDeleteQuiz(q._id)}><Trash2 size={16}/></button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}

            {cmsView === 'courseForm' && (
              <AdminCourseForm 
                initialData={editingCourse} 
                onSave={() => { fetchCourses(); setCmsView('courses'); }}
                onCancel={() => setCmsView('courses')}
              />
            )}

            {cmsView === 'quizForm' && (
              <AdminQuizForm 
                initialData={editingQuiz} 
                onSave={() => { fetchQuizzes(); setCmsView('quizzes'); }}
                onCancel={() => setCmsView('quizzes')}
              />
            )}

            {courseAnalyticsOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="course-analytics-title"
                style={{ position: 'fixed', inset: 0, zIndex: 25000, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
                onClick={() => setCourseAnalyticsOpen(false)}
                onKeyDown={(e) => { if (e.key === 'Escape') setCourseAnalyticsOpen(false); }}
              >
                <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '720px', marginTop: '48px', marginBottom: '48px', padding: '28px', border: '1px solid rgba(99,102,241,0.2)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <h3 id="course-analytics-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart2 size={22} color="#38bdf8" /> Thống kê khóa học</h3>
                      <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>{courseAnalyticsData?.title || '…'} · mã <code style={{ color: '#a5b4fc' }}>{courseAnalyticsData?.courseId}</code></p>
                    </div>
                    <button type="button" onClick={() => setCourseAnalyticsOpen(false)} aria-label="Đóng" style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                  </div>
                  {courseAnalyticsLoading && <p style={{ color: '#94a3b8' }}>Đang tải dữ liệu…</p>}
                  {!courseAnalyticsLoading && courseAnalyticsData && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Có tiến độ</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0' }}>{courseAnalyticsData.enrolled}</div></div>
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoàn thành</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>{courseAnalyticsData.completed}</div></div>
                        <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Số module</div><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{courseAnalyticsData.totalSteps}</div></div>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.55, margin: '0 0 16px' }}>Độ sâu xem trung bình (giây) theo từng module, tính trên học viên đã phát video ít nhất một lần. Dùng để phát hiện module nhiều người bỏ dở.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {(() => {
                          const maxS = Math.max(...(courseAnalyticsData.steps || []).map(s => s.avgMaxWatchSeconds || 0), 1);
                          return (courseAnalyticsData.steps || []).map((row) => (
                            <div key={row.stepIndex}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{row.stepIndex + 1}. {row.title}</span>
                                <span style={{ color: '#94a3b8' }}>TB {row.avgMaxWatchSeconds}s · {row.learnersWithProgress} HV</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(100, Math.round((row.avgMaxWatchSeconds / maxS) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '6px', transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ADVISOR CONTENT ── */}
        {tab === 'advisor' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>Noi Dung Tu Van Khoa Hoc</h2>
            </div>

            <div className="glass-card settings-card" style={{ maxWidth: '900px' }}>
              <div className="settings-card-header">
                <Bot size={22} color="#6366f1" />
                <div>
                  <h3>Thong Tin Tu Van (AI se doc noi dung nay)</h3>
                  <p>Nhap day du thong tin khoa hoc, lo trinh, hoc phi, doi tuong. AI Gia Su se dua vao day de tu van hoc vien chinh xac theo noi dung ban cap nhat.</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderLeft: '4px solid #6366f1', borderRadius: '0 10px 10px 0', fontSize: '0.85rem', color: '#a5b4fc', lineHeight: 1.7 }}>
                Huong dan viet noi dung hieu qua: Mo ta ten khoa, doi tuong, thoi luong, hoc phi, phuong thuc hoc (truc tiep / tu xa), chung chi dat duoc. Vi du:<br />
                <code style={{ color: '#c7d2fe', fontSize: '0.82rem' }}>Khoa MOS Excel: Danh cho nguoi di lam can chung chi. 2-3 thang. Hoc 1 kem 1. Phi: 3.000.000d. Da cap chung chi quoc te.</code>
              </div>

              <div className="settings-field">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Noi dung tu van khoa hoc / lo trinh</span>
                  <span style={{ color: '#475569', fontSize: '0.78rem' }}>{advisorContent.length} ky tu</span>
                </label>
                <textarea
                  className="settings-input"
                  rows={18}
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, fontSize: '0.9rem' }}
                  placeholder={`Vi du:\n\n--- KHOA MOS WORD & EXCEL ---\nDoi tuong: Hoc sinh, sinh vien, nguoi di lam can chung chi quoc te.\nThoi luong: 2-3 thang (hoc 1 kem 1 truc tiep hoac tu xa).\nHoc phi: 3.500.000d (tron goi).\nNoI dung: Word co ban den nang cao, Excel ham, bieu do, Pivot Table.\nChung chi: MOS (Microsoft Office Specialist) - Quoc te.\n\n--- KHOA IC3 ---\nDoi tuong: Nguoi can chung chi tin hoc co ban quoc te.\nThoi luong: 1-2 thang.\nHoc phi: 2.500.000d.\nNoi dung: Computing Fundamentals, Key Applications, Living Online.\nChung chi: IC3 - Certiport - Quoc te.\n\nLien he: 0909.000.000 / info@giasutinhoc24h.com`}
                  value={advisorContent}
                  onChange={e => setAdvisorContent(e.target.value)}
                />
              </div>

              <button
                className={`settings-save-btn ${advisorSaved ? 'saved' : ''}`}
                onClick={handleSaveAdvisorContent}
                style={{ marginTop: '16px' }}
              >
                {advisorSaved ? '✅ Da cap nhat noi dung tu van!' : <><Save size={18}/> Luu & Cap Nhat Noi Dung Tu Van</>}
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (

          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2>⚙️ Cấu Hình Hệ Thống</h2>
            </div>

            <div className="settings-grid">
              {/* Thông tin ngân hàng */}
              <div className="glass-card settings-card">
                <div className="settings-card-header">
                  <Building2 size={22} color="#10b981" />
                  <div>
                    <h3>Tài Khoản Ngân Hàng / Nạp Xu</h3>
                    <p>Thông tin STK hiển thị cho học viên khi nạp tiền</p>
                  </div>
                </div>

                <div className="settings-field">
                  <label>🏦 Tên Ngân Hàng</label>
                  <input
                    value={bankInfo.bankName}
                    onChange={e => setBankInfo(b => ({...b, bankName: e.target.value}))}
                    placeholder="VD: Vietcombank, MB Bank, Momo..."
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label>💳 Số Tài Khoản / SĐT Ví</label>
                  <input
                    value={bankInfo.accountNumber}
                    onChange={e => setBankInfo(b => ({...b, accountNumber: e.target.value}))}
                    placeholder="VD: 1234567890"
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label>👤 Tên Chủ Tài Khoản</label>
                  <input
                    value={bankInfo.accountName}
                    onChange={e => setBankInfo(b => ({...b, accountName: e.target.value}))}
                    placeholder="VD: NGUYEN VAN A"
                    className="settings-input"
                  />
                </div>
                <div className="settings-field">
                  <label>📝 Nội Dung Chuyển Khoản Mẫu</label>
                  <input
                    value={bankInfo.transferNote}
                    onChange={e => setBankInfo(b => ({...b, transferNote: e.target.value}))}
                    placeholder="VD: NAP XU [TEN HOC VIEN]"
                    className="settings-input"
                  />
                </div>

                {/* Preview QR-style card */}
                {bankInfo.accountNumber && (
                  <div className="bank-preview">
                    <div className="bank-preview-label">Xem trước thẻ thanh toán</div>
                    <div className="bank-card">
                      <div className="bank-card-top">
                        <span className="bank-name">{bankInfo.bankName || 'Ngân Hàng'}</span>
                        <Building2 size={20} color="rgba(255,255,255,0.7)" />
                      </div>
                      <div className="bank-card-number">{bankInfo.accountNumber}</div>
                      <div className="bank-card-owner">{bankInfo.accountName}</div>
                      <div className="bank-card-note">Nội dung: {bankInfo.transferNote}</div>
                    </div>
                  </div>
                )}

                <button
                  className={`settings-save-btn ${settingsSaved ? 'saved' : ''}`}
                  onClick={handleSaveSettings}
                >
                  {settingsSaved ? '✅ Đã lưu!' : <><Save size={18}/> Lưu Thông Tin Ngân Hàng</>}
                </button>
              </div>

              {/* Bảng giá Nạp Xu */}
              <div className="glass-card settings-card">
                <div className="settings-card-header">
                  <Coins size={22} color="#f59e0b" />
                  <div>
                    <h3>Gói học &amp; nạp xu</h3>
                    <p>Mỗi dòng: chu kỳ Tháng/Năm, nhãn, giá hiển thị, số xu cộng khi thanh toán thành công</p>
                  </div>
                </div>
                <div className="pricing-table">
                  {appSettings.coinPackages?.map((p, i) => (
                    <div key={p.id || i} className="pricing-row" style={{ borderLeft: `3px solid ${p.color}`, display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        className="settings-input"
                        style={{ width: '100px', padding: '4px 8px' }}
                        value={p.billingCycle === 'year' ? 'year' : 'month'}
                        onChange={(e) => {
                          const newP = [...appSettings.coinPackages];
                          newP[i] = { ...newP[i], billingCycle: e.target.value };
                          setAppSettings({ ...appSettings, coinPackages: newP });
                        }}
                        aria-label="Chu kỳ thanh toán"
                      >
                        <option value="month">Tháng</option>
                        <option value="year">Năm</option>
                      </select>
                      <input className="settings-input" style={{ minWidth: '120px', flex: 1, padding: '4px 8px' }} value={p.label || ''} onChange={(e) => {
                        const newP = [...appSettings.coinPackages];
                        newP[i] = { ...newP[i], label: e.target.value };
                        setAppSettings({ ...appSettings, coinPackages: newP });
                      }} placeholder="Tên gói" />
                      <input className="settings-input" style={{ flex: 1, padding: '4px 8px' }} value={p.price || ''} onChange={e => {
                        const newP = [...appSettings.coinPackages];
                        newP[i] = { ...newP[i], price: e.target.value, priceMs: Number(e.target.value.replace(/\D/g, '')) };
                        setAppSettings({...appSettings, coinPackages: newP})
                      }} />
                      <input className="settings-input" type="number" style={{width: '70px', padding: '4px 8px'}} value={p.coins || ''} onChange={e => {
                        const newP = [...appSettings.coinPackages];
                        newP[i] = { ...newP[i], coins: Number(e.target.value) };
                        setAppSettings({...appSettings, coinPackages: newP})
                      }} /> <span style={{fontSize:'0.8rem'}}>xu</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chi phí sử dụng AI */}
              <div className="glass-card settings-card">
                <div className="settings-card-header">
                  <BookOpen size={22} color="#8b5cf6" />
                  <div>
                    <h3>Chi Phí Sử Dụng AI</h3>
                    <p>Giá xu trừ mỗi lần dùng tính năng</p>
                  </div>
                </div>
                <div className="pricing-table">
                  {[
                    { label: 'Chat AI (Pro)', key: 'chatPro' },
                    { label: 'Chat AI (Free)', key: 'chatFree' },
                    { label: 'Tạo ảnh AI', key: 'image' },
                    { label: 'Chấm bài AI', key: 'grade' },
                    { label: 'Tạo đề 10 câu', key: 'quiz10' },
                    { label: 'Tạo đề 20 câu', key: 'quiz20' },
                    { label: 'Tạo đề 30 câu', key: 'quiz30' },
                  ].map(item => (
                    <div key={item.key} className="pricing-row" style={{ borderLeft: `3px solid #8b5cf6`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="pricing-label" style={{flex: 1}}>{item.label}</span>
                      <input className="settings-input" type="number" style={{width: '70px', padding: '4px 8px'}} value={appSettings.aiCost?.[item.key] ?? 0} onChange={e => {
                         setAppSettings({...appSettings, aiCost: {...appSettings.aiCost, [item.key]: Number(e.target.value)}})
                      }} /> <span style={{fontSize:'0.8rem'}}>xu</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cấu Hình AI API Keys */}
              <div className="glass-card settings-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-card-header">
                  <BookOpen size={22} color="#10b981" />
                  <div>
                    <h3>Cấu Hình API Keys (Trí Tuệ Nhân Tạo)</h3>
                    <p>Gemini / OpenAI cho chat; Tavily (tuỳ chọn) để bổ sung tìm kiếm web khi kho giáo trình nội bộ chưa đủ.</p>
                  </div>
                </div>

                <div className="settings-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="settings-field">
                    <label>Google Gemini API Key</label>
                    <input 
                      className="settings-input" 
                      type="password"
                      value={appSettings.geminiKey || ''} 
                      onChange={e => setAppSettings({ ...appSettings, geminiKey: e.target.value })} 
                      placeholder="AIzaSy..." 
                    />
                  </div>
                  <div className="settings-field">
                    <label>OpenAI API Key (DALL-E 3)</label>
                    <input 
                      className="settings-input" 
                      type="password"
                      value={appSettings.openaiKey || ''} 
                      onChange={e => setAppSettings({ ...appSettings, openaiKey: e.target.value })} 
                      placeholder="sk-..." 
                    />
                  </div>
                  <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Tavily API Key (tìm kiếm web — tạo tại tavily.com)</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={appSettings.tavilyApiKey || ''}
                      onChange={e => setAppSettings({ ...appSettings, tavilyApiKey: e.target.value })}
                      placeholder="tvly-... (để trống nếu không dùng web)"
                    />
                  </div>
                </div>

                <button className={`settings-save-btn ${appSettingsSaved ? 'saved' : ''}`} onClick={handleSaveAppSettings} style={{ marginTop: '16px' }}>
                  {appSettingsSaved ? '✅ Đã lưu Cấu Hình Server!' : <><Save size={18}/> Cập Nhật Cấu Hình Hệ Thống</>}
                </button>
              </div>


            </div>
          </div>
        )}

        {/* ── POPUP MANAGER ── */}
        {tab === 'popups' && (
          <div className="admin-content animate-fade-in-up">
            <div className="content-header">
              <h2><Bell size={22} color="#10b981" style={{display:'inline',verticalAlign:'middle',marginRight:10}}/> Quản Lý Popup Thông Báo</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-refresh" onClick={fetchPopups}><RefreshCw size={16}/> Làm mới</button>
                <button
                  onClick={() => { setEditingPopup(null); setPopupForm({ title: '', content: '', imageUrl: '', buttonText: 'Đã hiểu', buttonUrl: '', isActive: true, priority: 0 }); setShowPopupForm(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <Plus size={16}/> Tạo Popup Mới
                </button>
              </div>
            </div>

            {/* Info banner */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={18} color="#818cf8"/>
              <p style={{ color: '#a5b4fc', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                Popup sẽ hiện khi học viên đăng nhập. Nếu nhiệm vụ 4 ngày <strong>đã sẵn sàng</strong>, hệ thống ưu tiên hiện popup nhiệm vụ. Nếu chưa đến hạn, popup admin (đang bật) sẽ được hiển thị.
              </p>
            </div>

            {/* Form tạo/sửa */}
            {showPopupForm && (
              <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <h3 style={{ color: '#10b981', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingPopup ? <><Edit size={18}/> Chỉnh Sửa Popup</> : <><Plus size={18}/> Tạo Popup Mới</>}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="settings-field" style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Tiêu đề *</label>
                    <input className="settings-input" placeholder="VD: Khai giảng lớp Excel tháng 5" value={popupForm.title} onChange={e => setPopupForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Nội dung</label>
                    <textarea className="settings-input" rows={3} placeholder="Nội dung chi tiết hiển thị trong popup..." value={popupForm.content} onChange={e => setPopupForm(f => ({ ...f, content: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>URL Ảnh (tuỳ chọn)</label>
                    <input className="settings-input" placeholder="https://...jpg" value={popupForm.imageUrl} onChange={e => setPopupForm(f => ({ ...f, imageUrl: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Độ ưu tiên (số cao = hiện trước)</label>
                    <input className="settings-input" type="number" placeholder="0" value={popupForm.priority} onChange={e => setPopupForm(f => ({ ...f, priority: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Chữ nút bấm</label>
                    <input className="settings-input" placeholder="Đã hiểu" value={popupForm.buttonText} onChange={e => setPopupForm(f => ({ ...f, buttonText: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>URL nút bấm (để trống = chỉ đóng)</label>
                    <input className="settings-input" placeholder="https://... hoặc /courses" value={popupForm.buttonUrl} onChange={e => setPopupForm(f => ({ ...f, buttonUrl: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Bật ngay sau khi tạo:</label>
                    <button onClick={() => setPopupForm(f => ({ ...f, isActive: !f.isActive }))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: popupForm.isActive ? '#10b981' : '#64748b' }}>
                      {popupForm.isActive ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{popupForm.isActive ? 'Đang bật' : 'Tắt'}</span>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn-ghost modal-actions" onClick={() => { setShowPopupForm(false); setEditingPopup(null) }} style={{ padding: '10px 20px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>Huỷ</button>
                  <button onClick={handleSavePopup} style={{ flex: 1, padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Save size={16}/> {editingPopup ? 'Cập Nhật' : 'Tạo Popup'}
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách popup */}
            {popupLoading ? (
              <div className="loading-state">Đang tải danh sách popup...</div>
            ) : popups.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                <Bell size={48} color="#334155" style={{ marginBottom: '16px' }}/>
                <p style={{ color: '#64748b' }}>Chưa có popup nào. Nhấn "Tạo Popup Mới" để bắt đầu.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {popups.map(popup => (
                  <div key={popup._id} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px', border: popup.isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)' }}>
                    {popup.imageUrl && (
                      <img src={popup.imageUrl} alt="" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    )}
                    {!popup.imageUrl && (
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bell size={22} color="#10b981"/>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '1rem' }}>{popup.title}</h4>
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: popup.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: popup.isActive ? '#34d399' : '#64748b' }}>
                          {popup.isActive ? '● Đang bật' : '○ Tắt'}
                        </span>
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>Ưu tiên: {popup.priority}</span>
                      </div>
                      {popup.content && <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 6px', lineHeight: 1.5 }}>{popup.content.slice(0, 100)}{popup.content.length > 100 ? '...' : ''}</p>}
                      <span style={{ color: '#475569', fontSize: '0.72rem' }}>Nút: "{popup.buttonText}" {popup.buttonUrl && `→ ${popup.buttonUrl}`} · {new Date(popup.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleTogglePopup(popup._id)}
                        title={popup.isActive ? 'Tắt popup' : 'Bật popup'}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: popup.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)', color: popup.isActive ? '#10b981' : '#64748b' }}
                      >
                        {popup.isActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                      </button>
                      <button
                        onClick={() => { setEditingPopup(popup); setPopupForm({ title: popup.title, content: popup.content, imageUrl: popup.imageUrl, buttonText: popup.buttonText, buttonUrl: popup.buttonUrl, isActive: popup.isActive, priority: popup.priority }); setShowPopupForm(true) }}
                        title="Chỉnh sửa"
                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
                      >
                        <Edit size={16}/>
                      </button>
                      <button
                        onClick={() => handleDeletePopup(popup._id)}
                        title="Xóa popup"
                        style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Modal Điều chỉnh Xu ── */}
      {adjustTarget && (
        <div className="modal-overlay" onClick={() => setAdjustTarget(null)}>
          <div className="modal-box glass-card" onClick={e => e.stopPropagation()}>
            <h3>🪙 Điều Chỉnh Xu</h3>
            <p className="modal-sub">Học viên: <strong>{adjustTarget.name}</strong> — Số dư: <span style={{color:'#f59e0b'}}>{adjustTarget.coins} xu</span></p>
            <label>Số xu (+ tặng / − trừ)</label>
            <input type="number" placeholder="VD: +100 hoặc -10" value={adjustDelta} onChange={e => setAdjustDelta(e.target.value)} className="modal-input" />
            <label>Lý do ghi chú</label>
            <input type="text" placeholder="VD: Thưởng hoàn thành khoá học" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="modal-input" />
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAdjustTarget(null)}>Huỷ</button>
              <button className="btn-primary" onClick={handleAdjust}>Xác Nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Reset Mật Khẩu ── */}
      {resetTarget && (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="modal-box glass-card" onClick={e => e.stopPropagation()}>
            <h3>🔑 Cấp Lại Mật Khẩu</h3>
            <p className="modal-sub">Học viên: <strong>{resetTarget.name}</strong><br/><span style={{color:'#64748b'}}>{resetTarget.email}</span></p>
            <label>Mật khẩu mới (tối thiểu 6 ký tự)</label>
            <div className="pw-wrap-modal">
              <input
                type={showNewPw ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="modal-input"
              />
              <button type="button" className="pw-eye-modal" onClick={() => setShowNewPw(s => !s)}>
                {showNewPw ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
            <div className="pw-suggest">
              <span>Gợi ý:</span>
              {['Abc@123', 'Pass2024!', resetTarget.name?.replace(/\s/g,'')+'@123'].map(s => (
                <button key={s} className="suggest-chip" onClick={() => setNewPassword(s)}>{s}</button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setResetTarget(null)}>Huỷ</button>
              <button className="btn-primary btn-danger" onClick={handleResetPassword} disabled={resetLoading}>
                {resetLoading ? 'Đang xử lý...' : '🔐 Cấp Lại Mật Khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Thêm Người Dùng ── */}
      {showAddUserModal && (
        <div
          onClick={() => setShowAddUserModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-card"
            style={{ width: '460px', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 style={{ margin: '0 0 24px', fontSize: '1.3rem', fontWeight: 700 }}>➕ Thêm Người Dùng Mới</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nguyễn Văn A"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="example@gmail.com"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Mật khẩu <span style={{ color: '#64748b' }}>(để trống = 123456)</span></label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Phân quyền</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="student">🎓 Học Viên (student)</option>
                  {admin?.role === 'admin' && <option value="staff">👤 Nhân Viên (staff)</option>}
                  {admin?.role === 'admin' && <option value="admin">🛡️ Quản Trị Viên (admin)</option>}
                </select>
                {admin?.role === 'staff' && <small style={{ color: '#64748b', display: 'block', marginTop: '6px' }}>Nhân viên chỉ được tạo tài khoản Học Viên.</small>}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {addLoading ? 'Đang tạo...' : '✅ Xác Nhận Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
