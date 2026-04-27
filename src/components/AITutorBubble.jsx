import { useState, useRef, useEffect } from 'react'
import { X, Send, ChevronDown, Loader2 } from 'lucide-react'
import { marked } from 'marked'

// ─── Suggested questions ────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: 'Tôi nên học khóa nào trước?', category: 'Lộ trình' },
  { label: 'Chứng chỉ MOS có giá trị không?', category: 'Chứng chỉ' },
  { label: 'Học phí và thời gian học?', category: 'Học phí' },
  { label: 'MOS và IC3 khác nhau thế nào?', category: 'So sánh' },
  { label: 'Có học online được không?', category: 'Hình thức' },
  { label: 'Tôi đang đi làm, có học được không?', category: 'Đối tượng' },
]

// ─── Avatar SVG: giảng viên áo thun đỏ ─────────────────────────────────────
function TutorAvatar({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body - red polo shirt */}
      <circle cx="22" cy="22" r="22" fill="url(#tutor-grad)" />
      {/* Head */}
      <circle cx="22" cy="16" r="7" fill="#FDDCB5" />
      {/* Hair */}
      <path d="M15 13.5C15 9.36 18.13 6 22 6C25.87 6 29 9.36 29 13.5C29 13.5 27 12 22 12C17 12 15 13.5 15 13.5Z" fill="#2D1B0E" />
      {/* Red polo shirt collar */}
      <path d="M13 28C13 24 17 21 22 21C27 21 31 24 31 28L30 38H14L13 28Z" fill="#C0392B" />
      {/* Collar V detail */}
      <path d="M22 21L20 25H24L22 21Z" fill="#E74C3C" />
      {/* White collar lines */}
      <path d="M19 22L18 26" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M25 22L26 26" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
      {/* Skin neck */}
      <rect x="20" y="21" width="4" height="3" rx="1" fill="#FDDCB5" />
      <defs>
        <radialGradient id="tutor-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1',
          animation: `tutorDot 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AITutorBubble() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [messages, setMessages] = useState([]) // { role: 'ai'|'user', text: string }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Inject keyframe animation once
  useEffect(() => {
    if (document.getElementById('tutor-bubble-style')) return
    const style = document.createElement('style')
    style.id = 'tutor-bubble-style'
    style.textContent = `
      @keyframes tutorDot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-5px); opacity: 1; }
      }
      @keyframes tutorSlideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes tutorPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
        50%       { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
      }
    `
    document.head.appendChild(style)
  }, [])

  // Listen for external open triggers
  useEffect(() => {
    const handleOpenTutor = (e) => {
      setOpen(true)
      if (e.detail && e.detail.msg) {
        setInput(e.detail.msg)
        setTimeout(() => inputRef.current?.focus(), 150)
      }
    }
    window.addEventListener('open-tutor-with-msg', handleOpenTutor)
    return () => window.removeEventListener('open-tutor-with-msg', handleOpenTutor)
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Show welcome when opened for first time
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'ai',
        text: 'Chào bạn, tôi là **Trợ lý Tư vấn** của trung tâm **Thắng Tin Học**. Tôi có thể giúp bạn tìm hiểu về các khóa học, lộ trình phù hợp và thông tin đào tạo. Hãy chọn câu hỏi bên dưới hoặc đặt câu hỏi trực tiếp.'
      }])
    }
  }, [open])

  const getStudentId = () => {
    try { return JSON.parse(localStorage.getItem('giasu_user') || '{}')._id || null } catch { return null }
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setShowSuggestions(false)
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }))

      const res = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history })
      })
      const d = await res.json()
      const reply = d.data?.text || 'Xin lỗi, hệ thống tư vấn đang tạm thời gián đoạn. Vui lòng thử lại sau.'
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Không thể kết nối đến máy chủ AI lúc này. Vui lòng thử lại.' }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleOpen = () => {
    setOpen(o => !o)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  return (
    <>
      {/* ── Chat Panel ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '96px', right: '24px', width: '380px',
          maxHeight: '580px', background: 'linear-gradient(160deg, #0f172a, #1e1b4b)',
          border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          zIndex: 9998, animation: 'tutorSlideIn 0.25s ease-out'
        }}>

          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(99,102,241,0.08)', flexShrink: 0 }}>
            <TutorAvatar size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>Thầy Thắng</div>
              <div style={{ color: '#10b981', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Tư vấn Lộ trình & Khóa học
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                {m.role === 'ai' && <TutorAvatar size={28} />}
                <div style={{
                  maxWidth: '82%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                  border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.6,
                }}>
                  <div dangerouslySetInnerHTML={{ __html: marked(m.text) }} style={{ margin: 0 }} />
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <TutorAvatar size={28} />
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px 16px 16px 4px' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && messages.length === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '4px' }}>
                <div style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Câu hỏi gợi ý phổ biến:</div>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s.label)} style={{
                    textAlign: 'left', padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    transition: 'background 0.15s', outline: '1px solid rgba(99,102,241,0.15)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                  >
                    <span>{s.label}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.category}</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '10px 14px', color: '#e2e8f0', fontSize: '0.85rem',
                resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                maxHeight: '100px', overflowY: 'auto',
              }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
              width: '38px', height: '38px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
              boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
              color: input.trim() ? 'white' : '#334155',
            }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Chat với Gia sư AI"
        style={{
          position: 'fixed', bottom: '28px', right: '24px', zIndex: 9999,
          width: '60px', height: '60px', borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: open ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: hovered
            ? '0 8px 30px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.15)'
            : '0 6px 20px rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hovered ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
          transition: 'all 0.22s ease',
          animation: !open ? 'tutorPulse 2.5s ease infinite' : 'none',
        }}
      >
        {open ? <X size={22} color="white" /> : <TutorAvatar size={44} />}
      </button>

      {/* Tooltip */}
      {hovered && !open && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '24px', zIndex: 9999,
          background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '10px', padding: '8px 14px',
          color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none',
          whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'tutorSlideIn 0.2s ease'
        }}>
          Hỏi Gia sư AI
        </div>
      )}
    </>
  )
}
