import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@giasutinhoc24h.com')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      setError('Không thể kết nối đến Server')
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

        {error && (
          <div className="admin-error-box">⚠️ {error}</div>
        )}

        <div className="admin-field">
          <label><Mail size={15} /> Email quản trị</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@giasutinhoc24h.com"
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
