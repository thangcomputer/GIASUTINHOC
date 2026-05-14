import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCredits } from '../context/CreditContext'
import './Navbar.css'

import { Home, BookOpen, Target, User, Gem, Sparkles, MonitorPlay, ChevronUp, LayoutDashboard, Wallet, Compass, ArrowLeftRight } from 'lucide-react'
import { LOW_CREDIT_WARN_THRESHOLD } from '../lib/creditsPolicy'
import { clearStudentAuthStorage } from '../lib/sessionClient'

const navLinks = [
  { path: '/', label: 'Trang Chủ', icon: Home },
  { path: '/start', label: 'Người mới', icon: Compass },
  { path: '/lessons', label: 'Bài Học', icon: BookOpen },
  { path: '/credits', label: 'Xu & Gói', icon: Wallet },
  { path: '/chat', label: 'Hỏi Đáp AI', icon: Sparkles },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
]

const NAVBAR_GUEST_AUTH_SLOT = 'giasu_navbar_guest_auth_slot'
const NAVBAR_AUTH_ROTATE_MS = 3000

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { credits } = useCredits()
  const [showScroll, setShowScroll] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [isAdminSession, setIsAdminSession] = useState(false)

  const path = location.pathname
  const onLoginPage = path === '/login'
  const onRegisterPage = path === '/register'
  const showGuestAuthToggle = !onLoginPage && !onRegisterPage

  const [guestAuthSlot, setGuestAuthSlot] = useState(() => {
    try {
      const s = localStorage.getItem(NAVBAR_GUEST_AUTH_SLOT)
      if (s === 'login' || s === 'register') return s
    } catch {
      /* ignore */
    }
    return 'register'
  })

  useEffect(() => {
    if (onLoginPage) {
      setGuestAuthSlot('login')
      try {
        localStorage.setItem(NAVBAR_GUEST_AUTH_SLOT, 'login')
      } catch {
        /* ignore */
      }
    } else if (onRegisterPage) {
      setGuestAuthSlot('register')
      try {
        localStorage.setItem(NAVBAR_GUEST_AUTH_SLOT, 'register')
      } catch {
        /* ignore */
      }
    }
  }, [onLoginPage, onRegisterPage])

  useEffect(() => {
    if (!showGuestAuthToggle || isLoggedIn) return
    const id = setInterval(() => {
      setGuestAuthSlot((s) => {
        const n = s === 'login' ? 'register' : 'login'
        try {
          localStorage.setItem(NAVBAR_GUEST_AUTH_SLOT, n)
        } catch {
          /* ignore */
        }
        return n
      })
    }, NAVBAR_AUTH_ROTATE_MS)
    return () => clearInterval(id)
  }, [showGuestAuthToggle, isLoggedIn])

  const toggleGuestAuthSlot = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setGuestAuthSlot((s) => {
      const n = s === 'login' ? 'register' : 'login'
      try {
        localStorage.setItem(NAVBAR_GUEST_AUTH_SLOT, n)
      } catch {
        /* ignore */
      }
      return n
    })
  }

  let guestAuthHref = '/register'
  let guestAuthLabel = 'Đăng ký'
  if (onLoginPage) {
    guestAuthHref = '/register'
    guestAuthLabel = 'Đăng ký'
  } else if (onRegisterPage) {
    guestAuthHref = '/login'
    guestAuthLabel = 'Đăng nhập'
  } else {
    guestAuthHref = guestAuthSlot === 'login' ? '/login' : '/register'
    guestAuthLabel = guestAuthSlot === 'login' ? 'Đăng nhập' : 'Đăng ký'
  }

  const refreshSession = () => {
    const token = localStorage.getItem('auth_token')
    const userInfoStr = localStorage.getItem('giasu_user')
    setIsAdminSession(!!localStorage.getItem('admin_token'))
    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr)
        setIsLoggedIn(true)
        setUserName(user.name)
      } catch (e) {
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [location.pathname])

  useEffect(() => {
    const checkScrollTop = () => {
      if (window.scrollY > 300) setShowScroll(true)
      else setShowScroll(false)
    }
    window.addEventListener('scroll', checkScrollTop)
    window.addEventListener('storage', refreshSession)
    return () => {
      window.removeEventListener('scroll', checkScrollTop)
      window.removeEventListener('storage', refreshSession)
    }
  }, [])

  const handleLogout = async () => {
    const cf = await Swal.fire({title: 'Đăng xuất', text: 'Xác nhận Đăng xuất khỏi hệ thống?', icon: 'question', showCancelButton: true, confirmButtonText: 'Đăng xuất', cancelButtonText: 'Hủy'})
    if (cf.isConfirmed) {
      clearStudentAuthStorage()
      window.location.href = '/'
    }
  }

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: 'transparent', flexShrink: 0 }}>
              <img src="/logo_cartoon.png" alt="Gia Sư Tin Học 24h AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
            </div>
            <div className="brand-text">
              <span className="brand-name">Gia Sư Tin Học 24h</span>
              <span className="brand-sub">AI Gia Sư Thông Minh</span>
            </div>
          </Link>

          <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
            {navLinks.filter(link => !link.authOnly || isLoggedIn).map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <link.icon size={20} />
                <span style={{ fontSize: '0.8rem' }}>{link.label}</span>
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <Link 
                  to="/deposit" 
                  className={`credit-badge-nav${credits === 0 ? ' credit-badge-nav--empty' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Gem size={18} /> {credits} Xu
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="btn-outline" 
                  style={{ marginLeft: '4px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'transparent', color: '#cbd5e1', border: '1px solid #334155' }}
                >
                  Đăng Xuất
                </button>
              </>
            ) : (
              <div className="navbar-guestAuth">
                <Link
                  to={guestAuthHref}
                  className="navbar-guestAuth-link btn-primary"
                  onClick={() => setMenuOpen(false)}
                  aria-label={guestAuthLabel}
                >
                  {showGuestAuthToggle ? (
                    <span className="navbar-guestAuth-dualWrap" aria-live="polite">
                      <span className={`navbar-guestAuth-dualTxt ${guestAuthSlot === 'login' ? 'is-on' : ''}`}>
                        Đăng nhập
                      </span>
                      <span className={`navbar-guestAuth-dualTxt ${guestAuthSlot === 'register' ? 'is-on' : ''}`}>
                        Đăng ký
                      </span>
                    </span>
                  ) : (
                    guestAuthLabel
                  )}
                </Link>
                {showGuestAuthToggle && (
                  <button
                    type="button"
                    className="navbar-guestAuth-swap"
                    onClick={toggleGuestAuthSlot}
                    aria-label={
                      guestAuthSlot === 'register'
                        ? 'Chuyển sang hiển thị Đăng nhập'
                        : 'Chuyển sang hiển thị Đăng ký'
                    }
                    title="Đổi giữa đăng nhập / đăng ký"
                  >
                    <ArrowLeftRight size={16} strokeWidth={2} aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            id="hamburger-btn"
          >
            <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`ham-line ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        {isLoggedIn && !isAdminSession && credits <= LOW_CREDIT_WARN_THRESHOLD && (
          <div
            className={`navbar-credit-warn${credits === 0 ? ' navbar-credit-warn--empty' : ''}`}
            role="status"
          >
            {credits === 0 ? (
              <>
                <span>Bạn đã hết xu. Các tính năng AI tạm khóa cho đến khi bạn nạp thêm.</span>
                <Link to="/deposit" className="navbar-credit-warn-cta">Nạp xu ngay</Link>
                <Link to="/credits" className="navbar-credit-warn-link">Bảng giá</Link>
              </>
            ) : (
              <>
                <span>
                  Số dư còn <strong>{credits} xu</strong> — sắp không đủ cho vài lượt AI. Nạp thêm để học liền mạch.
                </span>
                <Link to="/deposit" className="navbar-credit-warn-cta">Nạp xu</Link>
                <Link to="/credits" className="navbar-credit-warn-link">Chi tiết</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Floating Scroll To Top Button */}
      {showScroll && (
        <button 
          onClick={scrollTop}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '30px',
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(99,102,241,0.5)',
            zIndex: 9999,
            transition: 'all 0.3s ease'
          }}
          title="Lên đầu trang"
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  )
}
