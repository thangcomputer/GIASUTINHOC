import Swal from 'sweetalert2';
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  Lock, HelpCircle, ArrowRight, Loader2, Eye, EyeOff, User, AtSign,
  GraduationCap, Coins, Zap, Award, Smartphone, AlertCircle,
} from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google';
import { WELCOME_COINS } from '../lib/creditsPolicy';
import { parseJsonResponse } from '../lib/parseApiResponse.js';
import './AuthPage.css';

const POST_LOGIN_REDIRECT_KEY = 'giasu_post_login_redirect'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const redirectTo = searchParams.get('redirect') || '/'
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
    <div className="authPage-root">
      <Navbar />

      <div className="authPage-bg" aria-hidden />

      <div className="authPage-inner">
        <div className="authPage-card">

          <div className="authPage-brand">
            <div className="authPage-brandGlow" aria-hidden />
            <div className="authPage-brandHead">
              <div className="authPage-logoRow">
                <div className="authPage-logoMark">
                  <GraduationCap size={26} strokeWidth={2} />
                </div>
                <div>
                  <div className="authPage-brandTitle">Gia Sư Tin Học</div>
                  <div className="authPage-brandSub">Trung tâm đào tạo tin học &amp; chứng chỉ</div>
                </div>
              </div>

              <h2 className="authPage-headline">
                Học 1 kèm 1<br />
                <span className="authPage-headlineAccent">trực tiếp và từ xa</span>
              </h2>
              <p className="authPage-lead">
                Nền tảng kết hợp giảng viên và AI trợ giảng — lộ trình rõ ràng, hướng tới chứng chỉ MOS/IC3.
              </p>

              <div className="authPage-features">
                {[
                  { Icon: Coins, text: `${WELCOME_COINS} xu chào mừng — trải nghiệm AI & đề tập` },
                  { Icon: Zap, text: 'Trợ giảng AI hỗ trợ 24/7' },
                  { Icon: Award, text: 'Chương trình hướng chứng chỉ quốc tế' },
                  { Icon: Smartphone, text: 'Học linh hoạt trên mọi thiết bị' },
                ].map(({ Icon, text }, i) => (
                  <div key={i} className="authPage-feature">
                    <div className="authPage-featureIcon">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <span className="authPage-featureText">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="authPage-brandFoot">
              © {new Date().getFullYear()} Gia Sư Tin Học · Kết nối bảo mật TLS
            </div>
          </div>

          <div className="authPage-formCol">
            <div className="authPage-tabs" role="tablist">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={`authPage-tab ${mode === m ? 'authPage-tabActive' : ''}`}
                  onClick={() => switchMode(m)}
                >
                  {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            <h3 className="authPage-formTitle">
              {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h3>
            <p className="authPage-formHint">
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục khóa học và công cụ AI của bạn.'
                : `Đăng ký để nhận ${WELCOME_COINS} xu chào mừng và bắt đầu lộ trình người mới.`}
            </p>

            {errorMsg && (
              <div className="authPage-alert" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="authPage-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="authPage-field">
                  <label className="authPage-label" htmlFor="auth-name">Họ và tên</label>
                  <div className="authPage-inputWrap">
                    <User size={16} className="authPage-inputIcon" aria-hidden />
                    <input
                      id="auth-name"
                      className="authPage-input"
                      type="text"
                      autoComplete="name"
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="authPage-field">
                <label className="authPage-label" htmlFor="auth-id">Email hoặc số điện thoại</label>
                <div className="authPage-inputWrap">
                  <AtSign size={16} className="authPage-inputIcon" aria-hidden />
                  <input
                    id="auth-id"
                    className={`authPage-input${identifier.trim() ? ' authPage-inputWithBadge' : ''}`}
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="email@domain.com hoặc 09xx xxx xxx"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                  />
                  {identifier.trim() && (
                    <span className={`authPage-badgeDetect ${isPhone ? 'authPage-badgePhone' : 'authPage-badgeEmail'}`}>
                      {isPhone ? 'SĐT' : 'Email'}
                    </span>
                  )}
                </div>
              </div>

              <div className="authPage-field">
                <div className="authPage-labelRow">
                  <label className="authPage-label" htmlFor="auth-pass">Mật khẩu</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="authPage-link"
                      onClick={() => Swal.fire({ icon: 'info', title: 'Quên mật khẩu?', text: 'Liên hệ quản trị viên hoặc hotline trung tâm để được hỗ trợ cấp lại mật khẩu.' })}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <HelpCircle size={14} aria-hidden />
                        Quên mật khẩu?
                      </span>
                    </button>
                  )}
                </div>
                <div className="authPage-inputWrap">
                  <Lock size={16} className="authPage-inputIcon" aria-hidden />
                  <input
                    id="auth-pass"
                    className="authPage-input authPage-inputPadRight"
                    type={showPass ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="authPage-toggleEye" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="authPage-field">
                  <label className="authPage-label" htmlFor="auth-pass2">Xác nhận mật khẩu</label>
                  <div className="authPage-inputWrap">
                    <Lock size={16} className="authPage-inputIcon" aria-hidden />
                    <input
                      id="auth-pass2"
                      className="authPage-input authPage-inputPadRight"
                      type={showPass2 ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      required
                      style={{
                        background: passwordConfirm ? (passwordConfirm === password ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)') : undefined,
                        borderColor: passwordConfirm ? (passwordConfirm === password ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)') : undefined,
                      }}
                    />
                    <button type="button" className="authPage-toggleEye" onClick={() => setShowPass2(!showPass2)} aria-label={showPass2 ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                      {showPass2 ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="authPage-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={20} className="authPage-spin" aria-hidden />
                    Đang xử lý…
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    <ArrowRight size={18} aria-hidden />
                  </>
                )}
              </button>
            </form>

            <div className="authPage-divider">
              <div className="authPage-dividerLine" />
              <span className="authPage-dividerText">hoặc</span>
              <div className="authPage-dividerLine" />
            </div>

            <button type="button" className="authPage-google" onClick={() => handleGoogleLogin()} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tiếp tục với Google
            </button>

            <p className="authPage-footNote">
              <Lock size={12} aria-hidden />
              Kết nối mã hóa TLS · Dữ liệu đăng nhập được bảo vệ theo chuẩn ngành
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
