import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import {
  Bot, BookOpen, Clock, Users, ArrowRight, GraduationCap,
  MonitorPlay, Shield, Sparkles, Zap, Brain, Target, ChevronRight,
  CheckCircle2, Star, TrendingUp, BarChart3, Cpu, Award, HeartHandshake,
  Play, MessageSquare, Layers, Code2
} from 'lucide-react'
import { WELCOME_COINS } from '../lib/creditsPolicy'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'
import { HOME_HERO_IMAGES } from '../constants/homeHeroImages.js'

/* ─── DATA ─── */
const STATS = [
  { value: '2,000+', label: 'Học Viên', icon: Users, color: '#6366f1' },
  { value: '98%', label: 'Hài Lòng', icon: Star, color: '#f59e0b' },
  { value: '24/7', label: 'Hỗ Trợ AI', icon: Bot, color: '#06b6d4' },
  { value: '100%', label: 'Thực Chiến', icon: Award, color: '#10b981' },
]

const FEATURES = [
  { icon: Brain, color: '#818cf8', bg: 'rgba(99,102,241,0.12)', title: 'AI Gia Sư Thông Minh', desc: 'Phân tích trình độ, tùy chỉnh lộ trình và giải thích từng bước một cách rõ ràng, kiên nhẫn 24/7.' },
  { icon: Target, color: '#34d399', bg: 'rgba(16,185,129,0.12)', title: 'Lộ Trình Cá Nhân Hóa', desc: 'AI điều chỉnh nội dung theo tốc độ, điểm mạnh và điểm yếu của từng học viên.' },
  { icon: Zap, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', title: 'Phản Hồi Tức Thì', desc: 'Nhận giải thích, gợi ý và đánh giá ngay lập tức. Không cần chờ đợi.' },
  { icon: TrendingUp, color: '#f472b6', bg: 'rgba(236,72,153,0.12)', title: 'Theo Dõi Tiến Độ', desc: 'Dashboard thông minh hiển thị hành trình học tập và điểm cần cải thiện chi tiết.' },
]

const COURSES = [
  { icon: '🖥️', color: '#0284c7', title: 'Tin Học Cơ Bản', label: 'Người mới', steps: 24, duration: '3 tháng', link: '/chat?mode=basic', tags: ['Windows', 'Word', 'Excel'] },
  { icon: '🏆', color: '#059669', title: 'Luyện Thi MOS / IC3', label: 'Trung cấp', steps: 36, duration: '4 tháng', link: '/lessons', tags: ['Word Expert', 'Excel', 'PowerPoint'] },
  { icon: '📊', color: '#7c3aed', title: 'Excel Nâng Cao & Data', label: 'Nâng cao', steps: 28, duration: '2 tháng', link: '/chat?mode=advanced', tags: ['PivotTable', 'Power Query', 'VBA'] },
]

const TESTIMONIALS = [
  { name: 'Nguyễn Thị Lan', role: 'Nhân viên văn phòng', avatar: 'NL', color: '#6366f1', rating: 5, text: 'Sau 2 tháng học 1 kèm 1 mình đã tự làm được báo cáo tổng hợp cho cả phòng. Thầy dạy rất tận tình và kiên nhẫn!' },
  { name: 'Trần Minh Khoa', role: 'Sinh viên CNTT', avatar: 'TK', color: '#10b981', rating: 5, text: 'Chat với AI giải thích rất dễ hiểu, hỏi đi hỏi lại nhiều lần cũng không bao giờ chán. Thi đậu MOS Excel 920/1000!' },
  { name: 'Lê Thị Hoa', role: 'Kế toán doanh nghiệp', avatar: 'LH', color: '#f59e0b', rating: 5, text: 'Excel nâng cao giúp mình tiết kiệm 3-4 tiếng mỗi ngày. Giờ làm macro tự động hóa hết rồi!' },
]

const DEMO_MESSAGES = [
  { from: 'user', text: 'VLOOKUP là gì và dùng như thế nào?' },
  { from: 'ai', text: 'VLOOKUP (Vertical Lookup) là hàm tìm kiếm dọc trong Excel. Cú pháp:\n=VLOOKUP(giá_trị, bảng, cột, 0)\nVí dụ: tìm lương theo tên nhân viên...' },
  { from: 'user', text: 'Cho mình ví dụ cụ thể với số liệu?' },
  { from: 'ai', text: '=VLOOKUP("Nguyễn Văn A", A2:C10, 3, 0)\n→ Kết quả: 15,000,000 đ ✅\nGiải thích: Tìm tên ở cột A, lấy giá trị cột 3 (lương).' },
]

function useCountUp(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    const num = parseInt(String(target).replace(/[^0-9]/g, ''))
    if (!num) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * num))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

export default function HomePage() {
  const [statsVisible, setStatsVisible] = useState(false)
  const [chatDemo, setChatDemo] = useState([])
  const [demoStep, setDemoStep] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [loadedCourses, setLoadedCourses] = useState(COURSES)
  const [config, setConfig] = useState(null)
  const statsRef = useRef(null)

  useEffect(() => {
    fetch('/api/homepage')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => { if (d?.success && d.data) setConfig(d.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => {
        if (d?.success && d.data?.length > 0) {
          setLoadedCourses(d.data.slice(0, 3).map(c => ({ icon: '📚', color: c.color || '#6366f1', title: c.title, label: c.level || 'Sơ cấp', steps: c.steps?.length || 0, duration: c.duration || 'N/A', link: `/lessons/${c.id}`, tags: c.tags || [] })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (demoStep >= DEMO_MESSAGES.length) return
    const t = setTimeout(() => { setChatDemo(p => [...p, DEMO_MESSAGES[demoStep]]); setDemoStep(s => s + 1) }, demoStep === 0 ? 900 : 2000)
    return () => clearTimeout(t)
  }, [demoStep])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#060912', color: 'white', overflowX: 'hidden' }}>
      <Helmet>
        <title>Gia Sư Tin Học — Học Máy Vi Tính, Tin Học Văn Phòng &amp; AI Online</title>
        <meta name="description" content="Gia Sư Tin Học — Gia sư tin học 1 kèm 1 kết hợp AI. Học máy vi tính cơ bản, tin học văn phòng Word, Excel, PowerPoint. Luyện thi MOS/IC3. Hỗ trợ 24/7. Cam kết đầu ra cho học viên tại TP.HCM và toàn quốc." />
        <meta name="keywords" content="học máy vi tính, tin học văn phòng, gia sư tin học, dạy tin học, học excel cơ bản, học word, học powerpoint, luyện thi MOS, luyện thi IC3, gia sư tin học TPHCM, học tin học online, học máy tính cho người lớn tuổi, học tin học trẻ em, trung tâm tin học, AI gia sư, gia sư tin học" />
        <link rel="canonical" href="https://giasutinhoc24h.com/" />
      </Helmet>
      <Navbar />

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Animated Background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)', borderRadius: '50%', animation: 'blob1 12s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)', borderRadius: '50%', animation: 'blob2 15s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', top: '30%', right: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)', borderRadius: '50%', animation: 'blob1 18s ease-in-out infinite reverse' }} />
          {/* Grid lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '120px 40px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          {/* LEFT */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '30px', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 700, marginBottom: '28px', letterSpacing: '0.05em' }}>
              <Sparkles size={14} /> TẶNG {WELCOME_COINS} XU CHÀO MỪNG · HỌC THỬ AI
            </div>

            <h1 style={{ fontSize: 'clamp(2.8rem, 5vw, 4.2rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.03em' }}>
              Học Tin Học<br />
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Thông Minh Hơn
              </span><br />
              Cùng Gia Sư AI
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: '0 0 36px', maxWidth: '520px' }}>
              Kết hợp sức mạnh của <strong style={{ color: '#a5b4fc' }}>Trí Tuệ Nhân Tạo</strong> và giáo viên 1 kèm 1 để tạo ra trải nghiệm học tập cá nhân hóa, hiệu quả gấp 3 lần truyền thống.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px' }}>
              {[`✅ ${WELCOME_COINS} xu miễn phí khi đăng ký`, '✅ AI 24/7', '✅ Chứng chỉ MOS', '✅ Bài học xem không tốn xu'].map(t => (
                <span key={t} style={{ padding: '7px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.45)', transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Bot size={20} /> Thử AI Miễn Phí
              </Link>
              <Link to="/lessons" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 32px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                <BookOpen size={20} /> Xem Khóa Học <ChevronRight size={18} />
              </Link>
              <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 28px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: '14px', color: '#6ee7b7', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <GraduationCap size={20} /> Lộ trình người mới
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', gap: '32px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — AI Chat Demo */}
          <div style={{ position: 'relative' }}>
            {/* Main chat window */}
            <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)' }}>
              {/* Chat header */}
              <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/logo_cartoon.png" alt="AI Tutor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Gia Sư Tin Học · AI Trợ lý</div>
                  <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Đang hoạt động
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                  {['#ef4444', '#f59e0b', '#10b981'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: '20px', minHeight: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatDemo.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: msg.from === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.07)', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line', color: 'white', border: msg.from === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {demoStep < DEMO_MESSAGES.length && (
                  <div style={{ display: 'flex', gap: '5px', padding: '10px 14px' }}>
                    {[0,1,2].map(i => <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', animation: `typing 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Hỏi bất kỳ điều gì về tin học...
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={16} color="white" />
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div style={{ position: 'absolute', top: '-20px', right: '-24px', padding: '12px 18px', background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '14px', animation: 'floatY 4s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={16} color="#34d399" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>MOS Certified</div>
                  <div style={{ fontSize: '0.65rem', color: '#34d399' }}>920 / 1000 điểm</div>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '-16px', left: '-20px', padding: '12px 18px', background: 'rgba(245,158,11,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', animation: 'floatY 5s 1s ease-in-out infinite' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#fbbf24" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>AI Powered</div>
                  <div style={{ fontSize: '0.65rem', color: '#fbbf24' }}>Gemini + GPT-4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ IMAGE SHOWCASE ══ */}
      <section style={{ padding: '100px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '30px', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: '20px' }}>
            <Sparkles size={13} /> TRẢI NGHIỆM THỰC TẾ
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Nền Tảng <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hiện Đại Nhất</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Giao diện trực quan, AI thông minh — học tập chưa bao giờ thú vị đến thế
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr', gap: '18px', alignItems: 'stretch', minHeight: '520px' }}>
          {/* Card 1 — AI Tutor */}
          <div className="img-card" style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', minHeight: '520px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <img src={HOME_HERO_IMAGES.tutor} alt="Học tập và làm việc nhóm với công nghệ" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} loading="lazy" decoding="async" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,9,18,0.96) 0%, rgba(6,9,18,0.4) 55%, rgba(6,9,18,0.1) 100%)' }} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(12px)', borderRadius: '30px', border: '1px solid rgba(99,102,241,0.35)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>Giảng Viên AI • Trực Tuyến</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(99,102,241,0.25)', borderRadius: '20px', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, marginBottom: '12px', border: '1px solid rgba(99,102,241,0.35)' }}>
                <Brain size={11} /> AI POWERED — GIA SƯ TIN HỌC
              </div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.2 }}>Giảng Viên AI<br />Bên Bạn 24/7</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: 1.6 }}>
                Phân tích trình độ, cá nhân hóa lộ trình, giải thích kiên nhẫn từng bước.
              </p>
              <Link to="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 22px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem' }}>
                Học Cùng AI <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Middle column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="img-card" style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', flex: 1, minHeight: '240px', border: '1px solid rgba(6,182,212,0.2)' }}>
              <img src={HOME_HERO_IMAGES.chat} alt="Học online trên laptop" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} loading="lazy" decoding="async" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,15,40,0.95) 0%, rgba(4,15,40,0.2) 65%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 12px', background: 'rgba(6,182,212,0.2)', backdropFilter: 'blur(8px)', borderRadius: '20px', border: '1px solid rgba(6,182,212,0.35)' }}>
                <span style={{ color: '#67e8f9', fontSize: '0.7rem', fontWeight: 700 }}>⚡ AI Chat 24/7</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 5px' }}>Chat AI Thông Minh</h4>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>Hỏi đáp không giới hạn, phản hồi tức thì</p>
              </div>
            </div>

            <div className="img-card" style={{ position: 'relative', borderRadius: '22px', overflow: 'hidden', flex: 1, minHeight: '240px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <img src={HOME_HERO_IMAGES.student} alt="Học viên làm việc hiệu quả" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} loading="lazy" decoding="async" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,25,20,0.95) 0%, rgba(5,25,20,0.2) 65%, transparent 100%)' }} />
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(16,185,129,0.2)', backdropFilter: 'blur(8px)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.35)' }}>
                <GraduationCap size={12} color="#34d399" />
                <span style={{ color: '#34d399', fontSize: '0.7rem', fontWeight: 700 }}>Chứng Chỉ MOS</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 5px' }}>Học Viên Thành Công</h4>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', margin: 0 }}>98% hài lòng sau khóa học</p>
              </div>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { icon: '🏆', val: '2,000+', lbl: 'Học viên', sub: 'tốt nghiệp', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.06)' },
              { icon: '⭐', val: '98%', lbl: 'Hài lòng', sub: 'sau khóa học', color: '#818cf8', border: 'rgba(99,102,241,0.25)', bg: 'rgba(99,102,241,0.06)' },
              { icon: '🚀', val: '24/7', lbl: 'AI hỗ trợ', sub: 'không nghỉ', color: '#34d399', border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.06)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '28px 22px', background: s.bg, borderRadius: '22px', border: `1px solid ${s.border}`, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{s.icon}</div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginTop: '6px' }}>{s.lbl}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '2px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section style={{ padding: '100px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '30px', color: '#c084fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: '24px' }}>
              <Bot size={13} /> GIA SƯ AI
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Trợ Lý AI <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thế Hệ Mới</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, margin: '0 0 40px', fontSize: '1.05rem' }}>
              Không chỉ là chatbot — đây là gia sư thực sự hiểu bạn, dạy theo cách bạn hiểu nhất.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} onClick={() => setActiveFeature(i)}
                  style={{ padding: '20px', borderRadius: '16px', border: `1px solid ${activeFeature === i ? f.color + '40' : 'rgba(255,255,255,0.06)'}`, background: activeFeature === i ? f.bg : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: activeFeature === i ? f.bg : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon size={20} color={activeFeature === i ? f.color : '#475569'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: activeFeature === i ? 'white' : '#64748b', marginBottom: '4px', transition: 'color 0.3s' }}>{f.title}</div>
                    {activeFeature === i && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6 }}>{f.desc}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '36px' }}>
              <Link to="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 8px 28px rgba(99,102,241,0.4)' }}>
                <Sparkles size={18} /> Trải Nghiệm Ngay
              </Link>
            </div>
          </div>

          {/* Right — visual */}
          <div style={{ position: 'relative' }}>
            <div style={{ padding: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '14px', background: i === activeFeature ? f.bg : 'transparent', marginBottom: '8px', transition: 'all 0.4s', transform: i === activeFeature ? 'scale(1.02)' : 'scale(1)', border: `1px solid ${i === activeFeature ? f.color + '30' : 'transparent'}` }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: i === activeFeature ? f.bg : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: i === activeFeature ? `0 0 20px ${f.color}40` : 'none', transition: 'all 0.4s' }}>
                    <f.icon size={24} color={i === activeFeature ? f.color : '#334155'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: i === activeFeature ? 'white' : '#475569', fontSize: '0.95rem', transition: 'color 0.3s' }}>{f.title}</div>
                    {i === activeFeature && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '4px' }}>{f.desc.substring(0, 60)}...</div>}
                  </div>
                  {i === activeFeature && <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: f.color, boxShadow: `0 0 12px ${f.color}` }} />}
                </div>
              ))}

              {/* Progress bar */}
              <div style={{ marginTop: '8px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: FEATURES[activeFeature].color, width: `${(activeFeature + 1) * 25}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COURSES ══ */}
      <section style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.04), transparent)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '30px', color: '#34d399', fontSize: '0.78rem', fontWeight: 700, marginBottom: '20px' }}>
              <BookOpen size={13} /> KHÓA HỌC
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Chọn <span style={{ background: 'linear-gradient(135deg, #34d399, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Khóa Học</span> Phù Hợp
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto' }}>Từ cơ bản đến nâng cao, luôn có khóa học dành riêng cho bạn</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {loadedCourses.map((c, i) => (
              <div key={i} className="course-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px', overflow: 'hidden', transition: 'all 0.35s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = c.color + '40'; e.currentTarget.style.boxShadow = `0 24px 60px ${c.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: '6px', background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
                <div style={{ padding: '28px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{c.icon}</div>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: `${c.color}15`, borderRadius: '20px', color: c.color, fontSize: '0.72rem', fontWeight: 700, marginBottom: '12px', border: `1px solid ${c.color}30` }}>{c.label}</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px' }}>{c.title}</h3>
                  <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '18px' }}>
                    <span><BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{c.steps} bài</span>
                    <span><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{c.duration}</span>
                    <span><Star size={12} fill="#f59e0b" color="#f59e0b" style={{ verticalAlign: 'middle', marginRight: 4 }} />4.9</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>
                    {(c.tags || []).slice(0, 3).map(t => (
                      <span key={t} style={{ padding: '4px 10px', background: `${c.color}10`, borderRadius: '8px', color: c.color, fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${c.color}20` }}>{t}</span>
                    ))}
                  </div>
                  <Link to={c.link} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: `${c.color}12`, borderRadius: '12px', color: c.color, textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem', border: `1px solid ${c.color}25`, transition: 'background 0.2s' }}>
                    Bắt Đầu Học <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ROW ══ */}
      <section ref={statsRef} style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {STATS.map((s, i) => {
            const num = useCountUp(s.value, 1600, statsVisible)
            const suffix = String(s.value).replace(/[0-9,]/g, '')
            return (
              <div key={i} style={{ padding: '32px 28px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                  <s.icon size={24} color={s.color} />
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {statsVisible ? `${num.toLocaleString()}${suffix}` : '—'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontWeight: 600 }}>{s.label}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ padding: '100px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '30px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700, marginBottom: '20px' }}>
            <Star size={13} /> ĐÁNH GIÁ
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Học Viên <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nói Gì?</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ padding: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + '30'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', gap: '4px', marginBottom: '18px' }}>
                {[...Array(t.rating)].map((_, j) => <Star key={j} size={15} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, fontSize: '0.92rem', margin: '0 0 24px', fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: t.color, border: `1px solid ${t.color}30` }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{t.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding: '120px 40px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Bắt Đầu Hành Trình<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Thông Minh Hôm Nay
            </span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', margin: '0 0 40px', lineHeight: 1.7 }}>
            Hàng nghìn học viên đã tin tưởng và thành công. Đăng ký miễn phí và trải nghiệm sức mạnh của Gia Sư AI ngay bây giờ.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth?mode=register" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}>
              <Sparkles size={20} /> Đăng Ký Miễn Phí
            </Link>
            <Link to="/chat" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
              <Bot size={20} /> Chat AI Thử Ngay
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SEO TEXT BLOCK — ẩn với người dùng, Google đọc được ══ */}
      <section aria-label="Thông tin dịch vụ" style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '40px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>
            Về Gia Sư Tin Học — Trung Tâm Dạy Tin Học & Gia Sư Máy Vi Tính
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.8 }}>
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>🖥️ Học Máy Vi Tính Cơ Bản</h3>
              <p>Dành cho người chưa biết gì về máy tính: bật/tắt máy, chuột, bàn phím 10 ngón, quản lý file và thư mục, kết nối internet, sử dụng trình duyệt, email cơ bản. Phù hợp cho học sinh, người đi làm, người lớn tuổi tại TP.HCM và học online toàn quốc.</p>
            </div>
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>📄 Tin Học Văn Phòng Word, Excel, PowerPoint</h3>
              <p>Khóa học tin học văn phòng toàn diện: soạn thảo văn bản chuyên nghiệp với Microsoft Word, phân tích dữ liệu bảng tính Excel (hàm IF, VLOOKUP, PivotTable), tạo bài thuyết trình ấn tượng với PowerPoint. Cam kết thành thạo sau 2-3 tháng học.</p>
            </div>
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>🤖 Gia Sư Tin Học AI 24/7</h3>
              <p>AI gia sư thông minh kết hợp Gemini và GPT-4 giải đáp mọi câu hỏi về tin học bất kỳ lúc nào, không giới hạn. Hỏi về hàm Excel, thao tác Word, cách tạo slide PowerPoint, sử dụng Zalo — AI trả lời ngay, kiên nhẫn, dễ hiểu.</p>
            </div>
            <div>
              <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>🏆 Luyện Thi Chứng Chỉ MOS & IC3</h3>
              <p>Ôn luyện bài bản và thi đỗ chứng chỉ Microsoft Office Specialist (MOS) cho Word, Excel, PowerPoint và chứng chỉ IC3 GS6. Hơn 500 học viên đã đạt điểm cao (trên 800/1000). Cam kết hoàn tiền nếu thi rớt lần 1.</p>
            </div>
          </div>
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Học máy vi tính', 'Tin học văn phòng', 'Gia sư tin học', 'Học Excel', 'Học Word', 'Học PowerPoint', 'Luyện thi MOS', 'Luyện thi IC3', 'AI gia sư', 'Học tin học online', 'Gia Sư Tin Học', 'Dạy Zalo cơ bản', 'Học máy tính cho người lớn tuổi'].map(tag => (
              <span key={tag} style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', color: 'rgba(165,180,252,0.7)', fontSize: '0.78rem' }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 40px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                <img src="/logo_cartoon.png" alt="Gia Sư Tin Học" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, background: 'linear-gradient(to right, white, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gia Sư Tin Học</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '280px' }}>Nền tảng học tin học thông minh kết hợp AI và giáo viên chuyên nghiệp 1 kèm 1.</p>
          </div>
          {[
            { title: 'Khóa Học', links: [['Tin Học Cơ Bản', '/lessons'], ['Luyện Thi MOS', '/lessons'], ['Excel Nâng Cao', '/lessons']] },
            { title: 'Công Cụ', links: [['Chat AI', '/chat'], ['Luyện Đề', '/quiz'], ['Dashboard', '/dashboard']] },
            { title: 'Hỗ Trợ', links: [['Đăng Nhập', '/auth'], ['Đăng Ký', '/auth?mode=register'], ['Liên Hệ', '/chat']] },
          ].map((col, i) => (
            <div key={i}>
              <h4 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(([label, href]) => (
                  <Link key={label} to={href} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.88rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
          <span>© {new Date().getFullYear()} Gia Sư Tin Học. All rights reserved.</span>
          <span>🔒 SSL Secured · Made with ❤️ in Vietnam</span>
        </div>
      </footer>

      <style>{`
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.05)} 66%{transform:translate(-20px,20px) scale(0.97)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-35px,25px) scale(1.04)} 66%{transform:translate(20px,-15px) scale(0.98)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes typing { 0%,100%{opacity:0.3;transform:scale(0.85)} 50%{opacity:1;transform:scale(1)} }
        .img-card { transition: transform 0.4s ease, box-shadow 0.4s ease; }
        .img-card:hover { transform: translateY(-8px); box-shadow: 0 40px 80px rgba(0,0,0,0.4); }
        @media (max-width: 1024px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          section > div[style*="grid-template-columns: 1.5fr"] { grid-template-columns: 1fr !important; }
          section > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          section > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
          section > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
