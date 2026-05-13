import Swal from 'sweetalert2';
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Lock, HelpCircle, ArrowRight, Loader2, Eye, EyeOff, User, AtSign } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google';
import { WELCOME_COINS } from '../lib/creditsPolicy';
import { parseJsonResponse } from '../lib/parseApiResponse.js';

const POST_LOGIN_REDIRECT_KEY = 'giasu_post_login_redirect'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const redirectTo = searchParams.get('redirect') || '/'

  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [identifier, setIdentifier] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)

  // Auto-detect whether identifier is phone or email
  const isPhone = /^[0-9+\s()-]{7,15}$/.test(identifier.trim())
  const authType = identifier.trim() && isPhone ? 'phone' : 'email'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    try {
      if (mode === 'register') {
        if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.')
        if (password !== passwordConfirm) throw new Error('Mật khẩu xác nhận không khớp.')

        const payload = authType === 'email'
          ? { email: identifier, name: name || identifier.split('@')[0], password }
          : { phone: identifier, name: name || identifier, password }

        if (authType === 'email' && !identifier.includes('@'))
          throw new Error('Email không hợp lệ.')

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await parseJsonResponse(res)
        if (data.success) {
          try { sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '/start') } catch {}
          setMode('login'); setPassword(''); setPasswordConfirm(''); setErrorMsg('')
          Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            html: `Bạn được tặng <b>${WELCOME_COINS} xu</b> chào mừng. Sau khi đăng nhập, bạn sẽ vào <b>Lộ trình người mới</b>.`,
            timer: 3200,
            showConfirmButton: false,
          })
        } else throw new Error(data.message)

      } else {
        const payload = authType === 'email' ? { email: identifier, password } : { phone: identifier, password }
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await parseJsonResponse(res)
        if (data.success) {
          const user = data.data
          if (data.token) localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user_info', JSON.stringify({ id: user._id, name: user.name, identifier: user.email || user.phone, credits: user.coins }))
          localStorage.setItem('giasu_user', JSON.stringify(user))
          window.location.replace(redirectTo)
        } else throw new Error(data.message)
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true); setErrorMsg('');
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.credential || tokenResponse.access_token || tokenResponse.id_token })
        })
        const data = await parseJsonResponse(res)
        if (data.success) {
          const user = data.data
          if (data.token) localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user_info', JSON.stringify({ id: user._id, name: user.name, identifier: user.email, credits: user.coins }))
          localStorage.setItem('giasu_user', JSON.stringify(user))
          let next = redirectTo
          try {
            const saved = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
            if (saved) {
              next = saved
              sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
            }
          } catch {}
          window.location.replace(next)
        } else throw new Error(data.message)
      } catch (err) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    },
    onError: () => setErrorMsg('Đăng nhập Google thất bại.')
  });

  const switchMode = (m) => { setMode(m); setErrorMsg(''); setIdentifier(''); setPassword(''); setPasswordConfirm(''); setName('') }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 10s ease-in-out infinite reverse' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)' }}>

          {/* LEFT PANEL — Branding */}
          <div style={{ background: 'linear-gradient(145deg, #3730a3 0%, #4f46e5 40%, #6366f1 100%)', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ position: 'relative' }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎓</span>
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Gia Sư Tin Học</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>Trung Tâm Đào Tạo</div>
                </div>
              </div>

              <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                Học 1 kèm 1<br />
                <span style={{ color: 'rgba(196,181,253,1)' }}>trực tiếp &amp; từ xa</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 40px' }}>
                Nền tảng học AI hiện đại, đồng hành cùng bạn trong từng bước tiến đến chứng chỉ tin học.
              </p>

              {/* Feature pills */}
              {[
                { icon: '🪙', text: `${WELCOME_COINS} xu miễn phí — trải nghiệm AI & đề tập` },
                { icon: '⚡', text: 'AI Gia Sư riêng 24/7' },
                { icon: '🏆', text: 'Chứng chỉ được công nhận' },
                { icon: '📱', text: 'Học mọi lúc, mọi nơi' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '10px', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', position: 'relative' }}>
              © {new Date().getFullYear()} Gia Sư Tin Học. Bảo mật SSL 256-bit.
            </div>
          </div>

          {/* RIGHT PANEL — Form */}
          <div style={{ padding: '60px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '36px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.25s', background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: mode === m ? 'white' : '#64748b', boxShadow: mode === m ? '0 4px 14px rgba(99,102,241,0.4)' : 'none' }}>
                  {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 8px' }}>
              {mode === 'login' ? 'Chào mừng trở lại! 👋' : 'Tạo tài khoản mới'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 28px' }}>
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục hành trình học của bạn'
                : `Tạo tài khoản để nhận ${WELCOME_COINS} xu chào mừng và học thử các tính năng AI.`}
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#f87171', fontSize: '0.875rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Tên (chỉ khi register) */}
              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ và tên</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input type="text" placeholder="Nguyễn Văn A..." value={name} onChange={e => setName(e.target.value)}
                      style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>
              )}

              {/* Email hoặc SĐT — 1 ô duy nhất, tự detect */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email hoặc Số điện thoại</label>
                <div style={{ position: 'relative' }}>
                  <AtSign size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                  <input
                    type="text"
                    placeholder="example@email.com hoặc 09xx xxx xxx"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  {identifier.trim() && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, background: isPhone ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', color: isPhone ? '#34d399' : '#818cf8', border: `1px solid ${isPhone ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
                      {isPhone ? '📱 SĐT' : '✉️ Email'}
                    </span>
                  )}
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự..." value={password} onChange={e => setPassword(e.target.value)} required
                    style={{ width: '100%', padding: '13px 44px 13px 42px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu (register) */}
              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Xác nhận mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input type={showPass2 ? 'text' : 'password'} placeholder="Nhập lại mật khẩu..." value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required
                      style={{ width: '100%', padding: '13px 44px 13px 42px', background: passwordConfirm && (passwordConfirm === password ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)'), border: `1px solid ${passwordConfirm ? (passwordConfirm === password ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    />
                    <button type="button" onClick={() => setShowPass2(!showPass2)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0 }}>
                      {showPass2 ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                  <button type="button" onClick={() => Swal.fire('Liên hệ quản trị viên để được cấp lại mật khẩu.')} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                    <HelpCircle size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: loading ? 'none' : '0 8px 28px rgba(99,102,241,0.45)', transition: 'all 0.2s', marginTop: '4px' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</> : <>{mode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'} <ArrowRight size={18} /></>}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>hoặc tiếp tục với</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google SSO */}
            <button onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', padding: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Tiếp tục với Google
            </button>

            <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', margin: '24px 0 0' }}>
              🔒 Bảo mật SSL 256-bit · Dữ liệu được mã hóa đầu cuối
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #334155; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0f172a inset !important; -webkit-text-fill-color: white !important; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="padding: 60px 48px"] { display: none !important; }
        }
      `}</style>
    </div>
  )
}
