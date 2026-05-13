import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'
import { CreditProvider } from './context/CreditContext'
import { HelmetProvider } from 'react-helmet-async'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingPopup from './components/OnboardingPopup'
import AITutorBubble from './components/AITutorBubble'
import ActivityNotification from './components/ActivityNotification'
import LoginPopup from './components/LoginPopup'
import './pages/AdminDashboard.css'

// ── Eager load (trang marketing, luôn cần ngay) ──
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'

// ── Lazy load (tải khi cần, giảm bundle ban đầu) ──
const ChatPage = lazy(() => import('./pages/ChatPage'))
const LessonsPage = lazy(() => import('./pages/LessonsPage'))
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage'))
const ExamPage = lazy(() => import('./pages/ExamPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DepositPage = lazy(() => import('./pages/DepositPage'))
const DepositMockPage = lazy(() => import('./pages/DepositMockPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const AdminHomepageConfig = lazy(() => import('./pages/AdminHomepageConfig'))
const CertificateVerifyPage = lazy(() => import('./pages/CertificateVerifyPage'))
const CreditsGuidePage = lazy(() => import('./pages/CreditsGuidePage'))
const StartHerePage = lazy(() => import('./pages/StartHerePage'))

// ── Loading fallback ──
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0f1e' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Đang tải...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  </div>
)

function OnboardingGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const checkOnboarding = () => {
      try {
        // Bỏ qua với admin
        if (localStorage.getItem('admin_token')) return
        const token = localStorage.getItem('auth_token')
        const user = JSON.parse(localStorage.getItem('giasu_user') || '{}')
        if (!token || !user._id) return
        const doneKey = `onboarding_done_${user._id}`
        const alreadyDone = localStorage.getItem(doneKey)
        // Show if: logged in + not done + level is default
        if (!alreadyDone && user.currentLevel === 'Mới bắt đầu') {
          setShow(true)
        }
      } catch {}
    }
    checkOnboarding()
    // Re-check when storage changes (e.g. after login)
    window.addEventListener('storage', checkOnboarding)
    return () => window.removeEventListener('storage', checkOnboarding)
  }, [])

  if (!show) return null
  return <OnboardingPopup onComplete={() => setShow(false)} />
}

export default function App() {
  return (
    <HelmetProvider>
    <CreditProvider>
      <BrowserRouter>
        <OnboardingGate />
        <AITutorBubble />
        <ActivityNotification />
        <LoginPopup />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/exam/:id" element={<ExamPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/cert/:certificateId" element={<CertificateVerifyPage />} />
          <Route path="/credits" element={<CreditsGuidePage />} />
          <Route path="/start" element={<StartHerePage />} />

          {/* Protected routes — yêu cầu đăng nhập */}
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
          <Route path="/deposit-mock" element={<ProtectedRoute><DepositMockPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/homepage-config" element={<AdminHomepageConfig />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </CreditProvider>
    </HelmetProvider>
  )
}
