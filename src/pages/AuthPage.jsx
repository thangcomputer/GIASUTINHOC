import Swal from 'sweetalert2';
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  Lock, HelpCircle, ArrowRight, Loader2, Eye, EyeOff, User, AtSign,
  GraduationCap, Coins, Zap, Award, Smartphone, AlertCircle, Sparkles,
} from 'lucide-react'
import { WELCOME_COINS } from '../lib/creditsPolicy';
import { parseJsonResponse } from '../lib/parseApiResponse.js';
import { isGoogleOAuthConfigured } from '../lib/googleAuthEnv.js';
import AuthGoogleSection from './AuthGoogleSection.jsx';
import { AUTH_BRAND_VISUAL } from '../constants/authBrandVisual.js';
import './AuthPage.css';

const POST_LOGIN_REDIRECT_KEY = 'giasu_post_login_redirect'

/** Ghi nhớ đăng nhập (localStorage) — chỉ nên dùng trên thiết bị cá nhân. */
const AUTH_REMEMBER_FLAG = 'giasu_auth_remember_login'
const AUTH_SAVED_IDENTIFIER = 'giasu_auth_saved_identifier'
const AUTH_SAVED_PASSWORD = 'giasu_auth_saved_password'

function clearSavedLoginCredentials() {
  try {
    localStorage.removeItem(AUTH_REMEMBER_FLAG)
    localStorage.removeItem(AUTH_SAVED_IDENTIFIER)
    localStorage.removeItem(AUTH_SAVED_PASSWORD)
  } catch {
    /* ignore */
  }
}

function saveLoginCredentials(identifierVal, passwordVal) {
  try {
    localStorage.setItem(AUTH_REMEMBER_FLAG, '1')
    localStorage.setItem(AUTH_SAVED_IDENTIFIER, identifierVal)
    localStorage.setItem(AUTH_SAVED_PASSWORD, passwordVal)
  } catch {
    /* ignore */
  }
}

function loadSavedLoginCredentials() {
  try {
    if (localStorage.getItem(AUTH_REMEMBER_FLAG) !== '1') return null
    return {
      identifier: localStorage.getItem(AUTH_SAVED_IDENTIFIER) || '',
      password: localStorage.getItem(AUTH_SAVED_PASSWORD) || '',
    }
  } catch {
    return null
  }
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [sessionBanner, setSessionBanner] = useState('')
  const redirectTo = searchParams.get('redirect') || '/'
  const [mode, setMode] = useState(() =>
    location.pathname === '/register' || searchParams.get('mode') === 'register'
      ? 'register'
      : 'login',
  )
  const prevAuthRouteKey = useRef(null)
  const [identifier, setIdentifier] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(false)

  useEffect(() => {
    const msg = location.state?.sessionMessage
    if (!msg) return
    setSessionBanner(msg)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, navigate])

  useEffect(() => {
    const rk = `${location.pathname}?${searchParams.toString()}`
    const next =
      location.pathname === '/register' || searchParams.get('mode') === 'register'
        ? 'register'
        : 'login'
    if (prevAuthRouteKey.current === null) {
      prevAuthRouteKey.current = rk
      return
    }
    if (prevAuthRouteKey.current === rk) return
    prevAuthRouteKey.current = rk
    setErrorMsg('')
    setIdentifier('')
    setPassword('')
    setPasswordConfirm('')
    setName('')
    if (next === 'register') setRememberLogin(false)
    setMode(next)
    /* URL đổi nhưng mode vẫn là login → không kích hoạt effect [mode]; phải nạp lại ghi nhớ ở đây */
    if (next === 'login') {
      const saved = loadSavedLoginCredentials()
      if (saved) {
        if (saved.identifier) setIdentifier(saved.identifier)
        if (saved.password) setPassword(saved.password)
        setRememberLogin(true)
      }
    }
  }, [location.pathname, searchParams.toString()])

  useEffect(() => {
    if (mode !== 'login') return
    const saved = loadSavedLoginCredentials()
    if (!saved) return
    if (saved.identifier) setIdentifier(saved.identifier)
    if (saved.password) setPassword(saved.password)
    setRememberLogin(true)
  }, [mode])

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
        if (authType === 'email' && !identifier.includes('@'))
          throw new Error('Vui lòng nhập email hợp lệ (có ký tự @).')

        const payload = authType === 'email' ? { email: identifier, password } : { phone: identifier, password }
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await parseJsonResponse(res)
        if (data.success) {
          const user = data.data
          if (rememberLogin) {
            saveLoginCredentials(identifier.trim(), password)
          } else {
            clearSavedLoginCredentials()
          }
          if (data.token) localStorage.setItem('auth_token', data.token)
          localStorage.setItem('user_info', JSON.stringify({ id: user._id, name: user.name, identifier: user.email || user.phone, credits: user.coins }))
          localStorage.setItem('giasu_user', JSON.stringify(user))
          window.location.replace(redirectTo)
        } else throw new Error(data.message)
      }
    } catch (err) {
      const m = err?.message || String(err)
      if (
        m === 'Failed to fetch' ||
        m.includes('NetworkError') ||
        m.includes('Load failed') ||
        m.includes('Network request failed')
      ) {
        setErrorMsg(
          'Không kết nối được API (mạng hoặc CORS). Hãy chạy backend: npm run start:backend (cùng npm run dev), bật MongoDB. Nếu .env có ALLOWED_ORIGINS chỉ domain production: khi dev, để NODE_ENV=development hoặc thêm CORS_ALLOW_LOCALHOST=true.',
        )
      } else {
        setErrorMsg(m)
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setErrorMsg('')
    setIdentifier('')
    setPassword('')
    setPasswordConfirm('')
    setName('')
    if (m === 'register') setRememberLogin(false)
  }

  const setAuthMode = (m) => {
    if (m === mode) return
    switchMode(m)
    navigate(m === 'login' ? '/login' : '/register', { replace: true })
  }

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
                  <GraduationCap size={24} strokeWidth={2} />
                </div>
                <div>
                  <div className="authPage-brandTitle">Gia Sư Tin Học</div>
                  <div className="authPage-brandSub">Trung tâm đào tạo tin học &amp; chứng chỉ</div>
                </div>
              </div>

              <h2 className="authPage-headline">
                Học tin học online<br />
                <span className="authPage-headlineAccent">cùng Gia Sư Tin Học &amp; AI</span>
              </h2>
              <p className="authPage-lead">
                Nền tảng kết hợp giảng viên và AI trợ giảng — lộ trình rõ ràng, hướng tới chứng chỉ MOS/IC3.
              </p>

              <figure className="authPage-brandVisual" aria-label={AUTH_BRAND_VISUAL.alt}>
                <div className="authPage-brandVisual-frame">
                  <img
                    src={AUTH_BRAND_VISUAL.src}
                    alt={AUTH_BRAND_VISUAL.alt}
                    className="authPage-brandVisual-img"
                    loading="lazy"
                    decoding="async"
                    crossOrigin="anonymous"
                  />
                  <div className="authPage-brandVisual-cap">
                    <Sparkles size={14} strokeWidth={2} aria-hidden />
                    <span>Học online cùng AI — gợi ý từng bước, ôn tập mọi lúc</span>
                  </div>
                </div>
              </figure>

              <div className="authPage-features">
                {[
                  { Icon: Coins, text: `${WELCOME_COINS} xu chào mừng — trải nghiệm AI & đề tập` },
                  { Icon: Zap, text: 'Trợ giảng AI hỗ trợ 24/7' },
                  { Icon: Award, text: 'Chương trình hướng chứng chỉ quốc tế' },
                  { Icon: Smartphone, text: 'Học linh hoạt trên mọi thiết bị' },
                ].map(({ Icon, text }, i) => (
                  <div key={i} className="authPage-feature">
                    <div className="authPage-featureIcon">
                      <Icon size={16} strokeWidth={2} />
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
            <div className="authPage-tabs" role="tablist" aria-label="Chế độ tài khoản">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  className={`authPage-tab ${mode === m ? 'authPage-tabActive' : ''}`}
                  onClick={() => setAuthMode(m)}
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

            {sessionBanner && (
              <div className="authPage-alert authPage-alertSession" role="status">
                <HelpCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{sessionBanner}</span>
              </div>
            )}

            {errorMsg && (
              <div className="authPage-alert" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
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
                        <HelpCircle size={12} aria-hidden />
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
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="authPage-remember">
                  <label className="authPage-rememberRow" htmlFor="auth-remember">
                    <input
                      id="auth-remember"
                      type="checkbox"
                      checked={rememberLogin}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setRememberLogin(checked)
                        if (!checked) clearSavedLoginCredentials()
                      }}
                    />
                    <span className="authPage-rememberLabel">
                      Ghi nhớ tên đăng nhập và mật khẩu trên thiết bị này
                    </span>
                  </label>
                  <p className="authPage-rememberHint">
                    Nên chỉ bật trên máy cá nhân; tránh máy dùng chung hoặc nơi công cộng.
                  </p>
                </div>
              )}

              <button type="submit" className="authPage-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={17} className="authPage-spin" aria-hidden />
                    Đang xử lý…
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    <ArrowRight size={16} aria-hidden />
                  </>
                )}
              </button>
            </form>

            {isGoogleOAuthConfigured() ? (
              <AuthGoogleSection
                redirectTo={redirectTo}
                loading={loading}
                setLoading={setLoading}
                setErrorMsg={setErrorMsg}
              />
            ) : (
              <>
                <div className="authPage-divider">
                  <div className="authPage-dividerLine" />
                  <span className="authPage-dividerText">hoặc</span>
                  <div className="authPage-dividerLine" />
                </div>
                <p className="authPage-googleDisabled">
                  Đăng nhập Google chưa bật: đặt <code className="authPage-code">VITE_GOOGLE_CLIENT_ID</code> trong{' '}
                  <code className="authPage-code">.env</code>, thêm URL trang vào <strong>Authorized JavaScript origins</strong>{' '}
                  trên Google Cloud, rồi chạy lại <code className="authPage-code">npm run build</code>.
                </p>
              </>
            )}

            <p className="authPage-footNote">
              <span className="authPage-footNoteIcon" aria-hidden>
                <Lock size={12} strokeWidth={2} />
              </span>
              <span className="authPage-footNoteText">
                Kết nối mã hóa TLS · Dữ liệu đăng nhập được bảo vệ theo chuẩn ngành
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
