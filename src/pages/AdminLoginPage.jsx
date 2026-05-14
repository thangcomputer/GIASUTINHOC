import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@giasuai.com')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [sessionBanner, setSessionBanner] = useState('')
  const [loading, setLoading] = useState(false)
  /** null = đang kiểm tra; true/false chỉ dùng khi import.meta.env.DEV */
  const [apiReachable, setApiReachable] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 4000)
    fetch('/api/settings/public', { signal: ac.signal })
      .then((r) => setApiReachable(r.ok))
      .catch(() => setApiReachable(false))
      .finally(() => clearTimeout(t))
    return () => {
      clearTimeout(t)
      ac.abort()
    }
  }, [])

  useEffect(() => {
    const msg = location.state?.sessionMessage
    if (!msg) return
    setSessionBanner(msg)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.success) { setError(data.message); return }
      if (data.data.role !== 'admin' && data.data.role !== 'staff') { setError('Tài khoản không có quyền Admin/Nhân Viên'); return }
      if (!data.token) { setError('Server chưa trả về token. Hãy đăng nhập lại.'); return }

      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.data))
      navigate('/admin/dashboard')
    } catch {
      setError(
        'Không kết nối được API. Trong thư mục project chạy npm run dev (đã gồm Vite + backend). Bật MongoDB; lần đầu: npm run seed:admin. Kiểm tra PORT trong .env (mặc định 5000). Trên điện thoại dùng IP máy tính thay vì localhost.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      {/* Background aurora */}
      <div className="admin-aurora">
        <div className="aurora-orb orb1" />
        <div className="aurora-orb orb2" />
        <div className="aurora-orb orb3" />
      </div>

      <form className="admin-login-card glass-card" onSubmit={handleLogin}>
        {/* Logo */}
        <div className="admin-login-logo">
          <div className="logo-icon-wrap">
            <ShieldCheck size={36} />
          </div>
          <h1>Admin Portal</h1>
          <p>Gia Sư AI · Quản Trị Hệ Thống</p>
        </div>

        {sessionBanner && (
          <div className="admin-notice-box" role="status">{sessionBanner}</div>
        )}

        {import.meta.env.DEV && apiReachable === false && (
          <div className="admin-dev-api-hint" role="status">
            <strong>API chưa chạy hoặc sai cổng.</strong>
            <ol>
              <li>Bật MongoDB (mongod / Windows Service).</li>
              <li>Trong thư mục project chỉ cần: <code>npm run dev</code> — lệnh này đã chạy cả giao diện (Vite) và API (cổng mặc định 5000). Hoặc tách: <code>npm run dev:vite</code> + <code>npm run start:backend</code>.</li>
              <li>Lần đầu hoặc báo <strong>sai mật khẩu</strong>: <code>npm run seed:admin</code> — đăng nhập <code>admin@giasuai.com</code> / <code>Admin@2024!</code> (script luôn ghi đè mật khẩu đúng).</li>
              <li>Trong <code>.env</code>, <code>PORT</code> phải trùng proxy Vite (thường 5000). Nếu terminal báo <code>EADDRINUSE</code>: tắt các tiến trình <code>node</code> cũ đang giữ cổng đó rồi chạy lại <code>npm run dev</code>.</li>
              <li>Trên điện thoại cùng Wi‑Fi: mở <code>http://192.168.x.x:5173/admin</code> (IP máy tính), không dùng <code>localhost</code> trên điện thoại.</li>
            </ol>
          </div>
        )}

        {error && (
          <div className="admin-error-box">⚠️ {error}</div>
        )}

        <div className="admin-field">
          <label><Mail size={15} /> Email quản trị</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@giasuai.com"
            required
          />
        </div>

        <div className="admin-field">
          <label><Lock size={15} /> Mật khẩu</label>
          <div className="pw-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button className="admin-login-btn" type="submit" disabled={loading}>
          {loading ? (
            <span className="spin-dot" />
          ) : (
            <><LogIn size={18} /> ĐĂNG NHẬP HỆ THỐNG</>
          )}
        </button>

        <p className="admin-hint">
          Chỉ dành cho quản trị viên được cấp quyền.<br />
          <a href="/">← Quay về trang học viên</a>
        </p>
      </form>
    </div>
  )
}
