import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCredits } from '../context/CreditContext'
import './Navbar.css'

import { Home, BookOpen, Target, User, Gem, Sparkles, MonitorPlay, ChevronUp, LayoutDashboard } from 'lucide-react'

const navLinks = [
  { path: '/', label: 'Trang Chủ', icon: Home },
  { path: '/lessons', label: 'Bài Học', icon: BookOpen },
  { path: '/chat', label: 'Hỏi Đáp AI', icon: Sparkles },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authOnly: true },
]

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { credits } = useCredits()
  const [showScroll, setShowScroll] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userInfoStr = localStorage.getItem('giasu_user')
    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr)
        setIsLoggedIn(true)
        setUserName(user.name)
      } catch(e){}
    }

    const checkScrollTop = () => {
      if (window.scrollY > 300) setShowScroll(true)
      else setShowScroll(false)
    }
    window.addEventListener('scroll', checkScrollTop)
    return () => window.removeEventListener('scroll', checkScrollTop)
  }, [])

  const handleLogout = async () => {
    const cf = await Swal.fire({title: 'Đăng xuất', text: 'Xác nhận Đăng xuất khỏi hệ thống?', icon: 'question', showCancelButton: true, confirmButtonText: 'Đăng xuất', cancelButtonText: 'Hủy'})
    if (cf.isConfirmed) {
       localStorage.removeItem('auth_token')
       localStorage.removeItem('user_info')
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
              <img src="/logo_cartoon.png" alt="Thắng Tin Học AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
            </div>
            <div className="brand-text">
              <span className="brand-name">Thắng Tin Học</span>
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
                  className="credit-badge-nav"
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)} style={{ color: '#cbd5e1', fontWeight: 500 }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary nav-cta" onClick={() => setMenuOpen(false)} style={{ padding: '8px 20px', borderRadius: '50px' }}>
                  Đăng ký
                </Link>
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
