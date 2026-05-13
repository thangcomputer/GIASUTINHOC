import Swal from 'sweetalert2';
import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import { sendMessageToAI, sendMessageStreamToAI } from '../services/aiService'
import { useCredits } from '../context/CreditContext'
import {
  Send, Mic, Volume2, VolumeX, Trash2, ImagePlus,
  Plus, Search, MessageSquare, BookOpen, Target,
  ChevronDown, Sparkles, Shield, Loader2
} from 'lucide-react'
import { marked } from 'marked'
import './ChatPage.css'

/* ─── helpers ─────────────────────────────────────────────── */
const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

// Gợi ý theo từng khóa học
const COURSE_CHIPS = {
  'ban-phim':          ['Cách gõ nhanh không nhìn bàn phím', 'Phím tắt Windows hữu ích nhất', 'Luyện Telex gõ tiếng Việt', 'Phân biệt Delete và Backspace'],
  'chuot-may-tinh':    ['Cách click chuột chính xác không run tay', 'Kéo thả file như thế nào?', 'Phân biệt click trái và click phải', 'Dùng chuột cuộn trang như dân pro'],
  'bat-tat-may':       ['Tại sao không nên rút điện đột ngột?', 'Sự khác nhau giữa Restart và Shutdown', 'Máy tính bị treo phải làm gì?', 'Khi nào cần dùng chế độ Sleep?'],
  'internet-co-ban':   ['Cách tìm kiếm Google nhanh và chính xác', 'Tab ẩn danh dùng để làm gì?', 'Lưu trang web để đọc offline', 'Cách xóa lịch sử duyệt web'],
  'email-co-ban':      ['Cách viết email chuyên nghiệp', 'Đính kèm nhiều file vào Gmail', 'Tạo chữ ký tự động trong Gmail', 'Cách tổ chức hộp thư bằng nhãn (Label)'],
  'an-toan-mang':      ['Cách tạo mật khẩu mạnh dễ nhớ', 'Nhận dạng email lừa đảo (phishing)', 'Cài đặt bảo mật 2 lớp cho Google', 'Wifi công cộng có an toàn không?'],
  'tin-hoc-word':      ['Cách căn lề chuẩn theo quy định', 'Tạo mục lục tự động trong Word', 'Cách chèn bảng biểu đẹp vào Word', 'In văn bản đúng khổ giấy A4'],
  'tin-hoc-excel':     ['Phân tích hàm VLOOKUP chi tiết', 'Hướng dẫn Pivot Table nâng cao', 'Bí quyết luyện thi MOS Excel', 'Cách dùng hàm IF lồng nhau'],
  'tin-hoc-powerpoint':['Thiết kế slide đẹp chuyên nghiệp', 'Bí quyết thuyết trình cuốn hút', 'Thêm video vào slide PowerPoint', 'Chuyển PowerPoint sang PDF'],
};

const GENERAL_CHIPS = [
  'Phân tích hàm VLOOKUP chi tiết',
  'Bí quyết luyện thi MOS Excel',
  'Cách bảo mật máy tính văn phòng',
  'Hướng dẫn Pivot Table nâng cao',
  'Tạo mật khẩu mạnh dễ nhớ',
  'Cách tìm kiếm Google nhanh',
  'Phím tắt Windows hữu ích nhất',
  'Viết email chuyên nghiệp',
];

function getWelcomeChips() {
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}');
    const unlocked = u.unlockedCourses || [];
    let pool = [];
    unlocked.forEach(courseId => {
      if (COURSE_CHIPS[courseId]) pool = [...pool, ...COURSE_CHIPS[courseId]];
    });
    if (pool.length === 0) pool = GENERAL_CHIPS;
    // Shuffle và lấy 4 ngẫu nhiên
    return pool.sort(() => Math.random() - 0.5).slice(0, 4);
  } catch {
    return GENERAL_CHIPS.slice(0, 4);
  }
}

const MODE_OPTIONS = [
  { value: 'free', label: 'Tiết kiệm · Pollinations', icon: '⚡' },
  { value: 'pro',  label: 'Gemini Flash', icon: '✦' },
]

/* ─── Custom Mode Dropdown ─────────────────────────────────── */
function ModeDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const options = [
    { value: 'free',   label: 'Tiết kiệm (Pollinations)', icon: '⚡', cost: 0, hint: '0 Xu · phản hồi qua Pollinations' },
    { value: 'pro',    label: 'Gemini Flash', icon: '✦', cost: 1, hint: '1 Xu · tự chọn model khả dụng (2.5 / 2.0 / 1.5)' },
    { value: 'openai', label: 'OpenAI GPT-4o-mini', icon: '⊕', cost: 2, hint: '2 Xu · stream chữ; ảnh đính kèm: gom bản đầy đủ' },
  ]
  const current = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="mode-pill-select"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        type="button"
      >
        <Sparkles size={12} />
        {current?.label}
        <ChevronDown size={11} style={{ transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="mode-dropdown-menu">
          {options.map(opt => (
            <button
              key={opt.value}
              className={`mode-dropdown-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              type="button"
              title={opt.hint || ''}
            >
              <span className="mode-dropdown-icon">{opt.icon}</span>
              {opt.label}
              {opt.cost === 0
                ? <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>Free</span>
                : <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: opt.value === 'openai' ? '#f59e0b' : '#818cf8', fontWeight: 700 }}>{opt.cost} Xu</span>
              }
            </button>
          ))}

        </div>
      )}
    </div>
  )
}

/* ─── Typing dots ──────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="typing-indicator">
      <span /><span /><span />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { credits, deductCredits } = useCredits()

  /* ── conversations store ── */
  const [conversations, setConversations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('giai_conversations') || '[]') }
    catch { return [] }
  })
  const [activeId, setActiveId] = useState(null)

  /* ── current session state ── */
  const activeConv = conversations.find(c => c.id === activeId) || null

  const messages       = activeConv?.messages || []
  const convHistory    = activeConv?.history  || []

  /* ── UI state ── */
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [aiMode, setAiMode]         = useState('pro')
  const [isListening, setIsListening]   = useState(false)
  const [voiceOn, setVoiceOn]           = useState(false) // Default tắt tiếng theo yêu cầu
  const [welcomeChips] = useState(() => getWelcomeChips())
  const [generatingImgId, setGeneratingImgId] = useState(null)
  const [attachedFile, setAttachedFile]       = useState(null) // { name, type, content, previewUrl }

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const fileInputRef   = useRef(null)
  const recognitionRef = useRef(null)

  /* ── persist ── */
  useEffect(() => {
    try {
      const safeConvs = conversations.map(c => ({
        ...c,
        messages: c.messages.map(m => ({
          ...m,
          image_url: m.image_url && m.image_url.startsWith('data:image') && m.image_url.length > 200000 
            ? null // Don't persist giant base64 strings
            : m.image_url
        }))
      }))
      localStorage.setItem('giai_conversations', JSON.stringify(safeConvs))
    } catch(e) {
      console.warn('Storage limit exceeded, truncating history...')
    }
  }, [conversations])

  // Không tự động lưu activeId vào localStorage nữa để khi load trang luôn là chat mới

  /* ── speech recognition setup ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const r = new SR()
      r.lang = 'vi-VN'
      r.continuous = false
      r.interimResults = true
      recognitionRef.current = r
    }
  }, [])

  
  /* ── auto scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ── ADD COPY BUTTON TO TABLES ── */
  const anyMessageStreaming = messages.some(m => m.streaming)
  useEffect(() => {
    if (anyMessageStreaming) return
    const tables = document.querySelectorAll('.markdown-body table');
    tables.forEach(table => {
      // Bỏ qua nếu đã được wrap
      if (table.parentElement?.classList.contains('copyable-table-wrapper')) return;

      // Tạo wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'copyable-table-wrapper';
      wrapper.style.position = 'relative';

      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      // Tạo nút Copy
      const btn = document.createElement('button');
      btn.className = 'copy-table-btn';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="tooltip">Sao chép bảng</span>';
      
      btn.onclick = () => {
        let tsv = '';
        table.querySelectorAll('tr').forEach(tr => {
          const rowDetails = [];
          tr.querySelectorAll('td, th').forEach(cell => rowDetails.push(cell.innerText));
          tsv += rowDetails.join('\t') + '\n';
        });
        navigator.clipboard.writeText(tsv);

        const tooltip = btn.querySelector('.tooltip');
        tooltip.innerText = 'Đã chép!';
        setTimeout(() => tooltip.innerText = 'Sao chép bảng', 2000);
      };

      wrapper.appendChild(btn);
    });
  }, [messages, anyMessageStreaming]);


  /* ── save helper ── */
  const saveConv = useCallback((id, updater) => {
    setConversations(prev => prev.map(c => c.id === id ? updater(c) : c))
  }, [])

  /* ── new chat ── */
  const handleNewChat = () => {
    const id = makeId()
    const conv = {
      id,
      title: 'Cuộc trò chuyện mới',
      createdAt: Date.now(),
      messages: [],
      history: [],
    }
    setConversations(prev => [conv, ...prev])
    setActiveId(id)
    setInput('')
    inputRef.current?.focus()
  }

  /* ── delete conversation ── */
  const handleDeleteConv = (e, id) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(conversations.find(c => c.id !== id)?.id || null)
  }

  /* ── file attachment ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so same file can be re-selected

    const isImage = file.type.startsWith('image/')
    const isText  = /\.(txt|md|js|jsx|ts|tsx|py|java|c|cpp|cs|json|csv|html|css|sql)$/i.test(file.name)

    if (!isImage && !isText) {
      Swal.fire('Chỉ hỗ trợ ảnh và file văn bản (.txt, .js, .py, .csv, ...)')
      return
    }

    const reader = new FileReader()
    if (isImage) {
      reader.onload = (ev) => setAttachedFile({ name: file.name, type: 'image', content: ev.target.result, previewUrl: ev.target.result })
      reader.readAsDataURL(file)
    } else {
      reader.onload = (ev) => setAttachedFile({ name: file.name, type: 'text', content: ev.target.result, previewUrl: null })
      reader.readAsText(file, 'UTF-8')
    }
  }

  /* ── handler for pasting images ── */
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
       if (items[i].kind === 'file') {
         const file = items[i].getAsFile();
         if (file) {
            e.preventDefault();
            handleFileSelect({ target: { files: [file], value: '' } });
            break;
         }
       }
    }
  };

  /* ── speak ── */
  const speakText = useCallback((text) => {
    if (!window.speechSynthesis || !voiceOn) return
    window.speechSynthesis.cancel()
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g,   '$1')
      .replace(/#/g, '')
      .replace(/<[^>]*>/gm, '')
    const utt = new SpeechSynthesisUtterance(clean)
    const voices = window.speechSynthesis.getVoices()
    const viet = voices.find(v => v.lang.startsWith('vi') && (v.name.includes('Google') || v.name.includes('Natural')))
      || voices.find(v => v.lang.startsWith('vi'))
    if (viet) utt.voice = viet
    utt.lang = 'vi-VN'
    utt.rate = 0.88
    window.speechSynthesis.speak(utt)
  }, [voiceOn])

  /* ── mic toggle ── */
  const toggleListening = () => {
    if (!recognitionRef.current) {
      Swal.fire('Trình duyệt không hỗ trợ nhận diện giọng nói.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      recognitionRef.current.start()
      recognitionRef.current.onresult = (e) => {
        let final = ''
        for (let i = e.resultIndex; i < e.results.length; i++)
          if (e.results[i].isFinal) final += e.results[i][0].transcript
        if (final) setInput(p => (p + ' ' + final).trim())
      }
      recognitionRef.current.onend  = () => setIsListening(false)
      recognitionRef.current.onerror = () => setIsListening(false)
    }
  }

  /* ── send message ── */
  const sendMessage = async (text) => {
    let userText = (text || input).trim()
    if (!userText && !attachedFile) return
    if (loading) return

    let base64Data = null;
    if (attachedFile) {
      if (attachedFile.type === 'text') {
        userText = userText
          ? `${userText}\n\n[Nội dung file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content.slice(0, 8000)}\n\`\`\``
          : `[File đính kèm: ${attachedFile.name}]\n\n\`\`\`\n${attachedFile.content.slice(0, 8000)}\n\`\`\`\nHãy phân tích file này.`
      } else {
        userText = userText || `Phân tích ảnh đính kèm: ${attachedFile.name}`
        base64Data = attachedFile.content; // data URI
      }
      setAttachedFile(null)
    }

    if (!userText && !base64Data) return

    const cost = aiMode === 'free' ? 0 : aiMode === 'openai' ? 2 : 1
    if (aiMode !== 'free' && credits < cost) {
      Swal.fire('Không đủ Xu', `Cần ${cost} Xu để dùng tính năng này.`, 'warning')
      navigate('/deposit')
      return
    }

    // Create conversation if none active
    let cId = activeId
    if (!cId) {
      cId = makeId()
      const newConv = {
        id: cId,
        title: userText.slice(0, 40) || 'Phân tích ảnh',
        createdAt: Date.now(),
        messages: [],
        history: [],
      }
      setConversations(prev => [newConv, ...prev])
      setActiveId(cId)
    }

    if (aiMode !== 'free') deductCredits(cost)

    const textLower = userText.toLowerCase();
    const isDrawing = textLower.includes('vẽ') || textLower.includes('tạo ảnh') || textLower.includes('minh hoạ') || textLower.includes('hình');
    if (isDrawing) setGeneratingImgId(cId);
    else setGeneratingImgId(null);

    const userMsg = { id: makeId(), role: 'user', content: userText, image_url: base64Data, ts: Date.now() }
    const useStream = !(aiMode === 'openai' && base64Data)
    const aiMsgId = useStream ? makeId() : null
    const aiPlaceholder = useStream
      ? { id: aiMsgId, role: 'ai', content: '', streaming: true, image_url: null, ts: Date.now() }
      : null

    setConversations(prev => prev.map(c => {
      if (c.id !== cId) return c
      const title = c.messages.length === 0 ? (userText.slice(0, 40) || 'Phân tích ảnh') : c.title
      const messages = aiPlaceholder ? [...c.messages, userMsg, aiPlaceholder] : [...c.messages, userMsg]
      return { ...c, title, messages }
    }))

    setInput('')
    setLoading(true)

    const currentHistory = conversations.find(c => c.id === cId)?.history || []

    try {
      if (useStream) {
        await sendMessageStreamToAI(userText, currentHistory, aiMode, base64Data, {
          onTextChunk: (_chunk, fullText) => {
            setConversations(prev => prev.map(c => {
              if (c.id !== cId) return c
              return {
                ...c,
                messages: c.messages.map(m =>
                  m.id === aiMsgId ? { ...m, content: fullText } : m
                ),
              }
            }))
          },
          onDone: ({ fullText, image_url: imgUrl }) => {
            setConversations(prev => prev.map(c => {
              if (c.id !== cId) return c
              return {
                ...c,
                messages: c.messages.map(m =>
                  m.id === aiMsgId
                    ? { ...m, content: fullText, image_url: imgUrl || null, streaming: false }
                    : m
                ),
                history: [
                  ...(c.history || []),
                  { role: 'user', content: userText },
                  { role: 'ai', content: fullText },
                ],
              }
            }))
            if (voiceOn) speakText(fullText)
          },
        })
      } else {
        const reply = await sendMessageToAI(userText, currentHistory, false, aiMode, base64Data)
        const aiMsg = {
          id: makeId(),
          role: 'ai',
          content: reply.text,
          image_url: reply.image_url || null,
          ts: Date.now(),
        }
        setConversations(prev => prev.map(c => {
          if (c.id !== cId) return c
          return {
            ...c,
            messages: [...c.messages, aiMsg],
            history: [...(c.history || []),
              { role: 'user', content: userText },
              { role: 'ai', content: reply.text },
            ],
          }
        }))
        if (voiceOn) speakText(reply.text)
      }
    } catch (err) {
      if (useStream && aiMsgId) {
        setConversations(prev => prev.map(c => {
          if (c.id !== cId) return c
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === aiMsgId
                ? { ...m, content: `**Lỗi kết nối:** ${err.message || 'Vui lòng thử lại.'}`, streaming: false }
                : m
            ),
          }
        }))
      } else {
        const errMsg = {
          id: makeId(), role: 'ai',
          content: `**Lỗi kết nối:** ${err.message || 'Vui lòng thử lại.'}`,
          ts: Date.now(),
        }
        setConversations(prev => prev.map(c =>
          c.id === cId ? { ...c, messages: [...c.messages, errMsg] } : c
        ))
      }
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const isEmptyChat = messages.length === 0

  /* ════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════ */
  return (
    <div className="chat-page">
      <Helmet>
        <title>Hỏi đáp AI — Gia Sư Tin Học</title>
        <meta name="description" content="Trợ lý tin học chuyên nghiệp: Word, Excel, PowerPoint, Windows, MOS/IC3. Trả lời rõ ràng, có cấu trúc." />
      </Helmet>
      <Navbar />

      {credits === 0 && (
        <div
          role="alert"
          className="chat-zero-xu-banner"
          style={{
            margin: '12px 16px 0',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(127, 29, 29, 0.35)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
            color: '#fecaca',
            fontSize: '0.88rem',
            lineHeight: 1.5,
            maxWidth: '900px',
          }}
        >
          <strong style={{ color: '#fff' }}>Bạn đang có 0 xu.</strong>{' '}
          Chế độ <strong>tiết kiệm (0 Xu, Pollinations)</strong> vẫn dùng được. Các chế độ trừ xu (Flash, OpenAI, ảnh…) cần{' '}
          <Link to="/deposit" style={{ color: '#fde68a', fontWeight: 700 }}>nạp xu</Link>
          {' · '}
          <Link to="/credits" style={{ color: '#fde68a', fontWeight: 700 }}>bảng giá</Link>.
        </div>
      )}

      <div className="chat-layout">

        {/* ══ LEFT SIDEBAR ══════════════════════════════════ */}
        <aside className="chat-sidebar-left">
          <div className="sidebar-top">
            <button className="new-chat-btn" onClick={handleNewChat} id="new-chat-btn">
              <span className="nc-icon"><Plus size={16} /></span>
              <span>Chat mới</span>
            </button>
          </div>

          {/* Conversation history */}
          {conversations.length > 0 && (
            <>
              <div className="sidebar-section-label">Lịch sử</div>
              <div className="sidebar-conversations">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`conv-item ${conv.id === activeId ? 'active' : ''}`}
                    onClick={() => { setActiveId(conv.id); setInput('') }}
                  >
                    <MessageSquare size={14} style={{ flexShrink: 0, color: conv.id === activeId ? '#818cf8' : '#334155' }} />
                    <span className="conv-title">{conv.title}</span>
                    <button
                      className="conv-delete"
                      onClick={(e) => handleDeleteConv(e, conv.id)}
                      title="Xóa cuộc trò chuyện"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Quick links */}
          <div className="sidebar-section-label" style={{ marginTop: 'auto' }}>Khám phá</div>
          {[
            { icon: BookOpen, label: 'Bài học', to: '/lessons' },
            { icon: Target,   label: 'Kiểm tra',   to: '/quiz' },
          ].map(({ icon: Icon, label, to }) => (
            <Link key={to} to={to} className="sidebar-mode-pill">
              <Icon size={14} />{label}
            </Link>
          ))}

          {/* Voice toggle */}
          <button
            className={`sidebar-mode-pill ${voiceOn ? 'active-mode' : ''}`}
            style={{ marginBottom: '10px' }}
            onClick={() => { if (voiceOn) window.speechSynthesis?.cancel(); setVoiceOn(!voiceOn) }}
          >
            {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {voiceOn ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
          </button>
        </aside>

        {/* Hidden file input – shared by both toolbars */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.json,.csv,.html,.css,.sql"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* ══ MAIN CONTENT ══════════════════════════════════ */}
        <main className="chat-main">

          {isEmptyChat ? (
            /* ── WELCOME SCREEN ── */
            <div className="chat-welcome">
              <div>
                <h1 className="welcome-title">Gặp gỡ Gia Sư AI của bạn</h1>
                <p className="welcome-subtitle">Trợ lý chuyên nghiệp — trả lời rõ ràng, có cấu trúc · Đào tạo tin học 1 kèm 1 (trực tiếp &amp; từ xa)</p>
              </div>

              <div className="welcome-input-wrap">
                <div className="chat-input-box">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Hỏi bất cứ điều gì về Tin học (Ctrl+V để dán ảnh)..."
                    rows={2}
                    disabled={loading}
                    id="chat-input"
                    style={{ minHeight: '52px' }}
                  />
                  <div className="input-toolbar">
                    <div className="toolbar-left">
                      {/* + Attach file */}
                      <button
                        className="toolbar-btn attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Đính kèm ảnh hoặc file"
                        disabled={loading}
                        type="button"
                      >
                        <Plus size={17} />
                      </button>
                      {/* Attachment chip */}
                      {attachedFile && (
                        <div className="attach-chip">
                          {attachedFile.previewUrl
                            ? <img src={attachedFile.previewUrl} alt="preview" className="attach-thumb" />
                            : <span className="attach-icon">📄</span>
                          }
                          <span className="attach-name">{attachedFile.name}</span>
                          <button className="attach-remove" onClick={() => setAttachedFile(null)} type="button">×</button>
                        </div>
                      )}
                      <ModeDropdown value={aiMode} onChange={setAiMode} disabled={loading} />
                    </div>
                    <div className="toolbar-right">
                      <button
                        className={`toolbar-btn ${isListening ? 'listening' : ''}`}
                        onClick={toggleListening}
                        disabled={loading}
                        title="Nhập bằng giọng nói"
                      >
                        <Mic size={17} />
                      </button>
                      <button
                        className={`send-btn ${loading ? 'loading' : ''}`}
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        id="send-btn"
                      >
                        {loading ? <Search size={16} className="spin-icon" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="welcome-chips">
                  {welcomeChips.map(chip => (
                    <button key={chip} className="welcome-chip" onClick={() => sendMessage(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── CHAT VIEW ── */
            <>
              <div className="chat-messages-wrap">
                <div className="chat-messages-inner">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`message-wrapper ${msg.role}`}
                    >
                      {msg.role === 'ai' && (
                        <div className="msg-avatar ai-msg-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Shield size={16} color="white" />
                        </div>
                      )}

                      {msg.role === 'ai' ? (
                        /* ── AI bubble layout ── */
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="chat-bubble-ai">
                            {msg.streaming && !msg.content ? (
                              <div className="stream-thinking-wrap" aria-live="polite">
                                <span className="stream-thinking-label">Đang soạn câu trả lời</span>
                                <TypingDots />
                              </div>
                            ) : msg.streaming ? (
                              <div className="streaming-plain" aria-live="polite">
                                {msg.content}
                                <span className="stream-cursor" aria-hidden>▍</span>
                              </div>
                            ) : (
                              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked(msg.content) }} />
                            )}
                          </div>


                          {msg.image_url && (
                            <div className="msg-image-container" style={{ marginTop: '16px', maxWidth: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              <img src={msg.image_url} alt="AI minh họa" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── User bubble layout ── */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div className="chat-bubble-user">
                            {msg.content}
                          </div>
                          {msg.image_url && (
                            <div className="msg-image-user" style={{ marginTop: '8px', maxWidth: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={msg.image_url} alt="đính kèm" style={{ width: '100%', display: 'block' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}


                  {loading && (!messages.length || !messages[messages.length - 1]?.streaming) && (
                    <div className="message-wrapper ai">
                      <div className="msg-avatar ai-msg-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={16} color="white" />
                      </div>
                      {generatingImgId === activeId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', color: '#a5b4fc', fontSize: '0.88rem', fontWeight: 600, border: '1px solid rgba(99, 102, 241, 0.25)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.15)' }}>
                           <Loader2 size={18} className="spin-icon" style={{ filter: 'drop-shadow(0 0 6px #6366f1)' }} />
                           Hệ thống đang tiến hành tạo hình minh hoạ... 
                        </div>
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── INPUT DOCK ── */}
              <div className="chat-input-dock">
                <div className="chat-input-box">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Hỏi tiếp (Ctrl+V để dán ảnh)..."
                    rows={1}
                    disabled={loading}
                    id="chat-input"
                  />
                  <div className="input-toolbar">
                    <div className="toolbar-left">
                      <button
                        className="toolbar-btn attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Đính kèm ảnh hoặc file"
                        disabled={loading}
                        type="button"
                      >
                        <Plus size={17} />
                      </button>
                      {attachedFile && (
                        <div className="attach-chip">
                          {attachedFile.previewUrl
                            ? <img src={attachedFile.previewUrl} alt="preview" className="attach-thumb" />
                            : <span className="attach-icon">📄</span>
                          }
                          <span className="attach-name">{attachedFile.name}</span>
                          <button className="attach-remove" onClick={() => setAttachedFile(null)} type="button">×</button>
                        </div>
                      )}
                      <ModeDropdown value={aiMode} onChange={setAiMode} disabled={loading} />
                    </div>
                    <div className="toolbar-right">
                      {aiMode === 'pro' && credits < 1 && (
                        <span className="low-credits-warn" style={{ fontSize: '0.72rem', marginRight: '4px' }}>⚠ Hết Xu</span>
                      )}
                      <button
                        className={`toolbar-btn ${isListening ? 'listening' : ''}`}
                        onClick={toggleListening}
                        disabled={loading}
                        title="Nhập bằng giọng nói"
                      >
                        <Mic size={17} />
                      </button>
                      <button
                        className={`send-btn ${loading ? 'loading' : ''}`}
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim() || (aiMode === 'pro' && credits < 1)}
                        id="send-btn"
                      >
                        {loading ? <Search size={16} className="spin-icon" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="input-hint">
                  <Shield size={11} /> Đào tạo 1 kèm 1 · Trực tiếp &amp; từ xa
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
