import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import {
  Bot, BookOpen, Clock, Users, ArrowRight, GraduationCap,
  Sparkles, Target, ChevronRight, ChevronDown,
  Star, Award, MonitorPlay, Rocket,
  Layers, School, Lightbulb, HelpCircle, PenLine,
  ShieldCheck, Lock, CreditCard,
  Video, ClipboardCheck, ListChecks, Play,
  UserPlus, Coins, Unlock,
} from 'lucide-react'
import { WELCOME_COINS } from '../lib/creditsPolicy'
import { fetchHomeCoursesPreview } from '../lib/homeCoursesPreviewFetch.js'
import { HOME_HERO_IMAGES } from '../constants/homeHeroImages.js'
import './HomePage.css'

/** Chỉ ID 11 ký tự (phần sau watch?v=). Đặt trong .env: VITE_HOME_INTRO_YOUTUBE_ID=... */
const HOME_INTRO_YOUTUBE_ID = (import.meta.env.VITE_HOME_INTRO_YOUTUBE_ID || '').toString().trim()

const INTRO_HIGHLIGHTS = [
  {
    icon: Video,
    title: 'Video lý thuyết có lộ trình',
    desc: 'Xem từng bước trên trình duyệt, tạm dừng và làm lại khi cần — phù hợp học buổi tối hay giữa giờ.',
    link: '/lessons',
    linkLabel: 'Vào bài học',
  },
  {
    icon: ClipboardCheck,
    title: 'Ôn & kiểm tra sau mỗi phần',
    desc: 'Quiz và câu hỏi trắc nghiệm giúp bạn tự kiểm tra nhanh phần vừa học, trước khi sang bài mới.',
    link: '/quiz',
    linkLabel: 'Làm quiz',
  },
  {
    icon: Sparkles,
    title: 'Gợi ý thông minh từ AI',
    desc: 'AI gợi ý cách làm bài Word/Excel, chỉ rõ thao tác — hướng tới tự làm được, không chỉ “chép đáp án”.',
    link: '/chat',
    linkLabel: 'Mở chat AI',
  },
  {
    icon: Bot,
    title: 'Hỏi đáp song song khi học',
    desc: 'Vừa xem video vừa mở chat: kẹt chỗ nào hỏi ngay, tiếp tục bài mà không đứt mạch.',
    link: '/chat',
    linkLabel: 'Hỏi nhanh',
  },
  {
    icon: ListChecks,
    title: 'Tiến độ & nội dung rõ ràng',
    desc: 'Theo dõi các bước đã học trong khóa, biết còn phần nào cần ôn trước kiểm tra hay nộp bài.',
    link: '/lessons',
    linkLabel: 'Xem khóa học',
  },
]

/** Ba bước dưới video — đăng ký → xu → khóa học (có đường nối sáng trong CSS) */
const INTRO_ONBOARD_PATH = [
  {
    to: '/register',
    label: 'Đăng ký tài khoản',
    hint: `Nhận ${WELCOME_COINS} xu chào mừng`,
    Icon: UserPlus,
  },
  {
    to: '/deposit',
    label: 'Mua / nạp xu',
    hint: 'Dùng xu cho AI & mở nội dung',
    Icon: Coins,
  },
  {
    to: '/lessons',
    label: 'Mở khóa khóa học',
    hint: 'Chọn khóa rồi vào bài học',
    Icon: Unlock,
  },
]

const STATS = [
  { value: '2,000+', label: 'Bạn học', icon: Users, color: '#818cf8' },
  { value: '98%', label: 'Hài lòng', icon: Star, color: '#fbbf24' },
  { value: '24/7', label: 'Hỏi đáp AI', icon: Bot, color: '#22d3ee', staticDisplay: true },
  { value: '100%', label: 'Thực hành', icon: Award, color: '#34d399' },
]

const FEATURES = [
  {
    icon: HelpCircle,
    color: '#5eead4',
    bg: 'rgba(45,212,191,0.12)',
    title: 'Hỏi đáp tin học tức thì',
    desc: 'Thắc mắc về Word, Excel, PowerPoint hay thao tác máy — AI trả lời bằng tiếng Việt rõ ràng, có ví dụ.',
    panel: {
      headline: 'Đặt câu hỏi — nhận lời giải thích có cấu trúc',
      lead: 'Bạn mô tả đúng tình huống đang gặp (phần mềm, phiên bản nếu biết). AI trả lời theo từng bước, chỉ rõ tên thẻ menu hoặc phím tắt thường dùng để em tự làm theo trên máy.',
      bullets: [
        'Word: định dạng, đánh số trang, chia cột, mục lục tự động, chèn ảnh/bảng.',
        'Excel: công thức cơ bản, lỗi ô (#DIV/0!, #REF!), lọc, sắp xếp, biểu đồ đơn giản.',
        'PowerPoint: chủ đề slide, chú thích diễn giả, chèn video/ảnh từ máy.',
        'Windows cơ bản: tệp & thư mục, tìm kiếm, in, kết nối Wi-Fi, lỗi thường gặp.',
      ],
      hint: 'Mẹo: ghi rõ “Word 2016” hoặc “Microsoft 365” và dán nội dung lỗi nếu có — gợi ý sẽ khớp giao diện hơn.',
      ctaPath: '/chat',
      ctaLabel: 'Mở chat hỏi ngay',
    },
  },
  {
    icon: PenLine,
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Gợi ý làm bài tập',
    desc: 'Gợi ý cách làm, công thức và từng bước thao tác để em tự hoàn thành bài, không chỉ “chép đáp án”.',
    panel: {
      headline: 'Đọc đề — tách ý — làm từng phần',
      lead: 'AI giúp em hiểu đề bài đang yêu cầu gì, nên dùng công cụ nào trong Office, và thứ tự thao tác hợp lý. Mục tiêu là em tự làm được bài khi đóng chat.',
      bullets: [
        'Phân tích yêu cầu: in đậm, căn lề, công thức, biểu đồ… theo đúng đề.',
        'Gợi ý lộ trình: làm phần dễ trước, kiểm tra kết quả từng bước.',
        'Gợi ý công thức hoặc thao tác, kèm giải thích vì sao dùng cách đó.',
        'Nếu kẹt: em chụp/ghi lại lỗi và hỏi tiếp — AI điều chỉnh gợi ý cho đúng máy em.',
      ],
      hint: 'Nên dán nguyên đề hoặc chụp đề (nếu được phép) để tránh hiểu sai yêu cầu giáo viên.',
      ctaPath: '/chat',
      ctaLabel: 'Gửi đề cho AI gợi ý',
    },
  },
  {
    icon: Target,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Lộ trình từ số không',
    desc: 'Phù hợp người mới: chuột, bàn phím, file, in ấn — lên dần tới soạn thảo và bảng tính.',
    panel: {
      headline: 'Bắt đầu từ lần đầu bật máy',
      lead: 'Trang “Bắt đầu tại đây” gom các bước nhỏ: làm quen màn hình, con trỏ, tạo và lưu file, rồi mới vào Word/Excel ở mức dễ. Mỗi bước có thể kết hợp hỏi AI khi không thấy nút.',
      bullets: [
        'Làm quen chuột, bàn phím, cửa sổ, tắt/mở chương trình an toàn.',
        'Tệp & thư mục: tạo, đổi tên, di chuyển, nén gửi qua Zalo/email.',
        'Word: gõ văn bản, lưu đúng định dạng, in một trang thử.',
        'Excel: nhập liệu, căn cột, cộng/trừ đơn giản trước khi học hàm nâng cao.',
      ],
      hint: 'Không vội: học 15–20 phút mỗi ngày và hỏi AI ngay chỗ không hiểu sẽ nhớ lâu hơn.',
      ctaPath: '/start',
      ctaLabel: 'Vào lộ trình người mới',
    },
  },
  {
    icon: Lightbulb,
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Ôn bài & chuẩn bị báo cáo',
    desc: 'Tóm tắt ý chính, gợi ý slide, kiểm tra lỗi thường gặp trước khi nộp bài hay thuyết trình.',
    panel: {
      headline: 'Rà soát trước khi nộp bài / thuyết trình',
      lead: 'Dùng AI như một checklist: gợi ý cấu trúc báo cáo, slide, và những lỗi định dạng hay quên. Phù hợp bài nhóm, tiểu luận, hoặc tiết thuyết trình cuối kỳ.',
      bullets: [
        'Word: kiểm tra mục lục, đánh số hình bảng, trích dẫn, căn trang in.',
        'PowerPoint: gợi ý số slide, tiêu đề rõ, chữ đủ lớn khi chiếu lớp.',
        'Excel: rà lại công thức, khóa tiêu đề cột, in vừa khổ giấy A4.',
        'Kết hợp khóa học trên web để ôn lại phần lý thuyết trước khi hỏi AI chỉnh sửa.',
      ],
      hint: 'Trước giờ nộp: nhờ AI liệt kê 5 điểm dễ bị trừ điểm theo đúng môn tin của em.',
      ctaPath: '/lessons',
      ctaLabel: 'Xem khóa để ôn bài',
    },
  },
]

const COURSES_FALLBACK = [
  { icon: MonitorPlay, color: '#2dd4bf', title: 'Máy vi tính cho người mới', label: 'Từ đầu', steps: 20, duration: 'Linh hoạt', link: '/start', tags: ['Windows', 'File & thư mục', 'Trình duyệt'] },
  { icon: School, color: '#38bdf8', title: 'Tin học THPT / ôn tập', label: 'Học sinh', steps: 28, duration: 'Theo học kỳ', link: '/lessons', tags: ['Word', 'Excel cơ bản', 'PowerPoint'] },
  { icon: BookOpen, color: '#a78bfa', title: 'Word · Excel cho bài tập', label: 'Sinh viên', steps: 32, duration: '2–3 tháng', link: '/chat?mode=basic', tags: ['Định dạng văn bản', 'Bảng tính', 'Biểu đồ'] },
]

const TESTIMONIALS = [
  { id: 't1', name: 'Phạm Gia Bảo', role: 'Học sinh lớp 10', avatar: 'GB', color: '#38bdf8', rating: 5, text: 'Em hay hỏi AI về Word và Excel bài cô giao. Giải thích từng bước nên em làm được chứ không chỉ copy.' },
  { id: 't2', name: 'Hoàng Thu Trang', role: 'Sinh viên năm 2', avatar: 'TT', color: '#818cf8', rating: 5, text: 'Làm báo cáo nhóm mà kẹt PowerPoint — chat AI gợi ý bố cục slide và cách chèn biểu đồ từ Excel rất nhanh.' },
  { id: 't3', name: 'Chị Minh Anh', role: 'Người mới dùng máy', avatar: 'MA', color: '#34d399', rating: 5, text: 'Chị không biết gì về máy tính. Lộ trình “bắt đầu tại đây” + hỏi AI lúc kẹt giúp chị tự tin gõ văn bản và gửi email.' },
  { id: 't4', name: 'Lê Quốc Huy', role: 'Học sinh lớp 11', avatar: 'QH', color: '#22d3ee', rating: 5, text: 'Em ôn hàm SUM, AVERAGE cho kiểm tra 15 phút. AI cho ví dụ số gần với đề trên lớp nên nhớ lâu.' },
  { id: 't5', name: 'Đặng Khánh Vy', role: 'Sinh viên năm 1', avatar: 'KV', color: '#f472b6', rating: 5, text: 'Slide thuyết trình tiếng Anh — em hỏi cách căn font và ghi chú diễn giả; AI chỉ đúng tab PowerPoint.' },
  { id: 't6', name: 'Bác Tuấn Hải', role: 'Học online buổi tối', avatar: 'TH', color: '#fb923c', rating: 5, text: 'Đi làm cả ngày, tối học lách qua lách lại file PDF và Word. Hỏi AI tiết kiệm thời gian hơn tự mò.' },
  { id: 't7', name: 'Ngô Bảo Châu', role: 'Học sinh lớp 12', avatar: 'BC', color: '#a78bfa', rating: 5, text: 'Em cần trích dẫn và mục lục tự động cho đồ án tốt nghiệp THPT. AI nhắc đúng thứ tự: tiêu đề → mục lục → cập nhật trường.' },
  { id: 't8', name: 'Vũ Đức An', role: 'Sinh viên CNTT', avatar: 'DA', color: '#2dd4bf', rating: 5, text: 'Debug công thức IF lồng nhau — AI không viết hộ cả bảng mà gợi ý tách điều kiện từng bước, em hiểu sai ở đâu.' },
  { id: 't9', name: 'Trần Thảo My', role: 'Học sinh lớp 9', avatar: 'TM', color: '#38bdf8', rating: 5, text: 'Bài Word chèn bảng điểm — em hỏi canh cột và kẻ viền. Làm xong em tự làm lại bài tương tự không cần hỏi nữa.' },
  { id: 't10', name: 'Phan Hữu Tài', role: 'Sinh viên năm 3', avatar: 'HT', color: '#818cf8', rating: 5, text: 'Đồ án nhóm Excel — chia sheet, đặt tên vùng, khóa ô nhập liệu. AI nhắc chỗ hay quên khi merge file.' },
  { id: 't11', name: 'Cô Lan Phương', role: 'Giáo viên phụ đạo', avatar: 'LP', color: '#fbbf24', rating: 5, text: 'Tôi gợi ý học sinh dùng chat sau giờ để ôn thao tác; nội dung vẫn theo SGK, AI chỉ hỗ trợ thao tác phần mềm.' },
  { id: 't12', name: 'Lý Gia Hưng', role: 'Người đổi nghề văn phòng', avatar: 'GH', color: '#34d399', rating: 5, text: 'Trước làm bếp, giờ cần Excel cơ bản cho ca làm. Hỏi AI từ “mở file .xlsx” tới lọc danh sách — không ngại hỏi nhiều lần.' },
]

const HOME_FAQ = [
  {
    q: 'Video bài học và chat AI có tốn xu giống nhau không?',
    a: `Không hoàn toàn giống nhau: phần lý thuyết/video trong bài học thường xem theo từng bước khóa; chat AI thường tính theo gói xu khi gửi tin nhắn. Đăng ký tài khoản bạn nhận ${WELCOME_COINS} xu chào mừng để thử. Xem thêm tại trang Xu & gói và Hướng dẫn xu.`,
  },
  {
    q: 'Học sinh / sinh viên dùng AI có bị “chép bài” không?',
    a: 'Nền tảng khuyến khích AI gợi ý cách làm và thao tác từng bước để bạn tự hoàn thành bài. Bạn nên dùng gợi ý để hiểu bài, không nộp nguyên văn AI nếu giáo viên không cho phép.',
  },
  {
    q: 'Người mới chưa biết gì về máy tính có học được không?',
    a: 'Có. Chọn lộ trình “Bắt đầu tại đây” để làm quen chuột, bàn phím, file và in ấn; khi kẹt có thể hỏi AI từng thao tác cụ thể trên Windows và Word/Excel cơ bản.',
  },
  {
    q: 'Dữ liệu chat và tài khoản có an toàn không?',
    a: 'Trang chạy qua HTTPS. Bạn nên dùng mật khẩu riêng, không chia sẻ phiên đăng nhập; nội dung học tập được xử lý theo chính sách nền tảng (xem phần chân trang và trang hướng dẫn khi có).',
  },
  {
    q: 'Có cần cài phần mềm trên máy để học không?',
    a: 'Bạn học trên trình duyệt; phần mềm Word, Excel, PowerPoint thực hành thì làm trên máy cá nhân (Windows hoặc macOS có Office). AI hướng dẫn theo thao tác phổ biến trên Microsoft 365 hoặc bản Office bạn đang dùng.',
  },
  {
    q: 'Hết xu thì làm sao?',
    a: 'Vào trang Nạp xu / Xu & gói để xem gói phù hợp. Video lý thuyết trong khóa vẫn có thể xem khi bạn còn quyền truy cập khóa — chỉ riêng chat AI cần đủ xu theo quy định từng thời điểm.',
  },
]

const DEMO_MESSAGES = [
  { from: 'user', text: 'Cô giao bài Word: chia 2 cột, canh đều và chèn số trang ở giữa chân trang. Em làm sao ạ?' },
  { from: 'ai', text: 'Chào em! Làm lần lượt nhé:\n1) Bôi đen đoạn văn → tab Bố cục (Layout) → Cột → Chọn 2.\n2) Canh đều: Ctrl+J hoặc tab Home → Canh đều (Justify).\n3) Chèn → Số trang → Chân trang → Plain Number 2 (số giữa).\nEm thử xong nhắn lại nếu chỗ nào chưa ra nhé.' },
  { from: 'user', text: 'Em muốn từ trang 2 trở đi mới có số trang thì sao?' },
  { from: 'ai', text: 'Em dùng “Ngắt phần” (Section break):\n1) Đặt con trỏ cuối trang 1 → Bố cục → Ngắt → Trang tiếp theo.\n2) Vào chân trang trang 2 → tắt “Liên kết với phần trước”.\n3) Đặt định dạng số trang bắt đầu từ 1 ở phần 2.\nNếu em gửi ảnh màn hình, chị chỉ đúng nút trên máy em.' },
]

const AUDIENCE = [
  {
    to: '/start',
    accent: '#2dd4bf',
    icon: MonitorPlay,
    title: 'Người mới bắt đầu',
    desc: 'Lần đầu dùng máy tính: mở máy, tạo file, in ấn, tìm kiếm trên mạng — có lộ trình “Bắt đầu tại đây”.',
    cta: 'Vào lộ trình số 0',
  },
  {
    to: '/chat',
    accent: '#38bdf8',
    icon: School,
    title: 'Học sinh',
    desc: 'Làm bài Word/Excel/PowerPoint, chuẩn bị thuyết trình, hỏi nhanh khi đang làm bài ở nhà.',
    cta: 'Hỏi AI về bài tập',
  },
  {
    to: '/lessons',
    accent: '#a78bfa',
    icon: GraduationCap,
    title: 'Sinh viên',
    desc: 'Khóa có cấu trúc, bám môn tin học đại cương và kỹ năng văn phòng cho báo cáo, đồ án.',
    cta: 'Xem khóa học',
  },
]

function useCountUp(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || !target) return
    const num = parseInt(String(target).replace(/[^0-9]/g, ''), 10)
    if (!num) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor((1 - (1 - p) ** 3) * num))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function StatMetricCard({ item, started }) {
  const animate = !item.staticDisplay
  const num = useCountUp(animate ? item.value : '', 1600, started && animate)
  const suffix = String(item.value).replace(/[0-9,]/g, '')
  const Icon = item.icon
  const displayVal = !started
    ? '—'
    : item.staticDisplay
      ? item.value
      : `${num.toLocaleString('vi-VN')}${suffix}`
  return (
    <div className="hp-metric">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={item.color} aria-hidden />
        </div>
      </div>
      <div className="hp-metric-val" style={{ color: item.color }}>
        {displayVal}
      </div>
      <div className="hp-metric-lbl">{item.label}</div>
    </div>
  )
}

export default function HomePage() {
  const [statsVisible, setStatsVisible] = useState(false)
  const [chatDemo, setChatDemo] = useState([])
  const [demoStep, setDemoStep] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [featuresAutoplay, setFeaturesAutoplay] = useState(true)
  const [openFaq, setOpenFaq] = useState(null)
  const [loadedCourses, setLoadedCourses] = useState(COURSES_FALLBACK)
  const statsRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchHomeCoursesPreview()
      .then((d) => {
        if (cancelled || !d?.success || !d.data?.length) return
        setLoadedCourses(
          d.data.slice(0, 3).map((c) => ({
            icon: Layers,
            color: c.color || '#6366f1',
            title: c.title,
            label: c.level || 'Sơ cấp',
            steps: c.steps?.length || 0,
            duration: c.duration || '—',
            link: `/lessons/${c.id}`,
            tags: c.tags || [],
          })),
        )
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setStatsVisible(true)
    }, { threshold: 0.25 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (demoStep >= DEMO_MESSAGES.length) return
    const delay = demoStep === 0 ? 800 : 1900
    const t = setTimeout(() => {
      setChatDemo((p) => [...p, DEMO_MESSAGES[demoStep]])
      setDemoStep((s) => s + 1)
    }, delay)
    return () => clearTimeout(t)
  }, [demoStep])

  useEffect(() => {
    if (!featuresAutoplay) return
    const t = setInterval(() => setActiveFeature((p) => (p + 1) % FEATURES.length), 4800)
    return () => clearInterval(t)
  }, [featuresAutoplay])

  const feat = FEATURES[activeFeature]
  const FeatureDetailIcon = feat.icon
  const featurePanel = feat.panel

  return (
    <div className="home">
      <Helmet>
        <title>Gia Sư Tin Học — Học máy tính từ đầu, hỏi đáp &amp; AI gợi ý bài tập tin học</title>
        <meta name="description" content="Nền tảng học máy vi tính cho người mới, học sinh và sinh viên: lộ trình từ số không, khóa Word/Excel/PowerPoint, hỏi đáp 24/7 và AI gợi ý làm bài tập tin học bằng tiếng Việt." />
        <meta name="keywords" content="học máy vi tính cho người mới, tin học học sinh, tin học sinh viên, hỏi đáp tin học, giải bài tập word excel, AI gia sư tin học, học word excel online, ôn tin học THPT, lộ trình tin học cơ bản" />
        <link rel="canonical" href="https://giasutinhoc24h.com/" />
      </Helmet>
      <Navbar />

      <section className="hp-hero">
        <div className="hp-hero-bg" aria-hidden />
        <div className="hp-container hp-hero-grid">
          <div>
            <div className="hp-eyebrow hp-eyebrow-teal">
              <Sparkles size={14} aria-hidden />
              Lớp học số · AI đồng hành · {WELCOME_COINS} xu chào mừng
            </div>
            <h1 className="hp-h1">
              Học máy vi tính &amp; tin học văn phòng
              <br />
              <span className="hp-h1-accent">hỏi đáp, làm bài — có AI chỉ từng bước</span>
            </h1>
            <p className="hp-lead">
              Dành cho <strong style={{ color: '#e2e8f0' }}>người mới</strong>, <strong style={{ color: '#e2e8f0' }}>học sinh</strong> và <strong style={{ color: '#e2e8f0' }}>sinh viên</strong>
              : làm quen máy tính, soạn văn bản, bảng tính, slide — kết hợp bài học có lộ trình và chat AI để hỏi nhanh khi đang làm bài.
            </p>
            <div className="hp-pills">
              {['Hỏi đáp & gợi ý bài tập', 'Video lý thuyết không tốn xu', 'Lộ trình từ số không', 'Word · Excel · PowerPoint'].map((t) => (
                <span key={t} className="hp-pill">{t}</span>
              ))}
            </div>
            <div className="hp-actions">
              <Link className="hp-btn hp-btn-primary" to="/chat">
                <Bot size={18} aria-hidden />
                Hỏi AI về bài tập
              </Link>
              <Link className="hp-btn hp-btn-secondary" to="/lessons">
                <BookOpen size={18} aria-hidden />
                Học theo khóa
                <ChevronRight size={16} aria-hidden />
              </Link>
              <Link className="hp-btn hp-btn-ghost" to="/start">
                <MonitorPlay size={18} aria-hidden />
                Bắt đầu từ số không
              </Link>
            </div>
            <div className="hp-trust">
              {STATS.map((s) => (
                <div key={s.label} className="hp-trust-item">
                  <strong style={{ color: s.color }}>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-chat-wrap" style={{ position: 'relative' }}>
            <div className="hp-chat">
              <div className="hp-chat-head">
                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                  <img src="/logo_cartoon.png" alt="" width="40" height="40" style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>Trợ lý tin học · AI</h3>
                  <div className="hp-chat-status">
                    <span className="hp-dot" aria-hidden />
                    Sẵn sàng phản hồi
                  </div>
                </div>
              </div>
              <div className="hp-chat-body">
                {chatDemo.map((msg, i) => (
                  <div key={i} className={msg.from === 'user' ? 'hp-msg hp-msg-user' : 'hp-msg hp-msg-ai'}>
                    {msg.text}
                  </div>
                ))}
                {demoStep < DEMO_MESSAGES.length && (
                  <div className="hp-typing" aria-hidden>
                    <i /><i /><i />
                  </div>
                )}
              </div>
              <div className="hp-chat-foot">
                <span className="hp-chat-placeholder">Hỏi về bài Word, Excel, thao tác máy…</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(180deg,#4f46e5,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={16} color="#fff" aria-hidden />
                </div>
              </div>
            </div>
            <div className="hp-float hp-float-tl">
              <PenLine size={15} color="#5eead4" aria-hidden />
              <span style={{ color: '#e2e8f0' }}>Gợi ý bài tập</span>
            </div>
            <div className="hp-float hp-float-br">
              <HelpCircle size={15} color="#818cf8" aria-hidden />
              <span style={{ color: '#e2e8f0' }}>Hỏi đáp 24/7</span>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-audience" aria-label="Đối tượng học">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow hp-eyebrow-teal" style={{ margin: '0 auto 1rem' }}>
              <School size={14} aria-hidden />
              Chọn đúng nhóm của bạn
            </div>
            <h2 className="hp-h2">Ưu tiên người mới &amp; bài tập trên lớp</h2>
            <p className="hp-sub">Lộ trình dễ hiểu, hỏi AI bất cứ lúc nào — diễn đạt gần gũi, có thể nhắc lại từng thao tác trên Word, Excel, PowerPoint.</p>
          </div>
          <div className="hp-audience-grid">
            {AUDIENCE.map((p) => {
              const Icon = p.icon
              return (
                <Link
                  key={p.title}
                  to={p.to}
                  className="hp-persona-card"
                  style={{ '--persona-accent': p.accent }}
                >
                  <div className="hp-persona-icon" style={{ color: p.accent, background: `${p.accent}22` }}>
                    <Icon size={22} aria-hidden />
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <span className="hp-persona-cta" style={{ color: p.accent }}>
                    {p.cta}
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="hp-section hp-intro-video-section" aria-labelledby="hp-intro-video-heading">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow" style={{ margin: '0 auto 1rem' }}>
              <Video size={14} aria-hidden />
              Giới thiệu nền tảng
            </div>
            <h2 className="hp-h2" id="hp-intro-video-heading">Video &amp; cách học online cùng AI</h2>
            <p className="hp-sub">Một khung nhìn tổng quan: xem clip giới thiệu (hoặc placeholder), bên cạnh là các lợi ích khi học — có ôn tập, có gợi ý, có chat hỗ trợ.</p>
          </div>

          <div className="hp-intro-split">
            <div className="hp-intro-split__media">
              <div className="hp-video-shell">
                {HOME_INTRO_YOUTUBE_ID ? (
                  <iframe
                    className="hp-video-iframe"
                    title="Video giới thiệu Gia Sư Tin Học"
                    src={`https://www.youtube-nocookie.com/embed/${HOME_INTRO_YOUTUBE_ID}?rel=0`}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="hp-video-placeholder">
                    <div className="hp-video-placeholder-bg" aria-hidden />
                    <div className="hp-video-placeholder-content">
                      <div className="hp-video-placeholder-icon">
                        <Play size={36} color="#fff" fill="rgba(255,255,255,0.25)" aria-hidden />
                      </div>
                      <p className="hp-video-placeholder-title">Video giới thiệu</p>
                      <p className="hp-video-placeholder-hint">
                        Thêm biến môi trường <code className="hp-code">VITE_HOME_INTRO_YOUTUBE_ID</code> (ID video YouTube 11 ký tự) rồi build lại để nhúng clip tại đây.
                      </p>
                      <Link className="hp-btn hp-btn-secondary" to="/lessons">
                        <BookOpen size={17} aria-hidden />
                        Xem bài học trước
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <div className="hp-intro-media-pedestal" aria-label="Ba bước: đăng ký, nạp xu, mở khóa học">
                <div className="hp-intro-media-pedestal__head">
                  <Rocket size={16} aria-hidden />
                  <span>Lộ trình vào học</span>
                </div>
                <ol className="hp-intro-path__track">
                  {INTRO_ONBOARD_PATH.map((step, i) => {
                    const StepIcon = step.Icon
                    const isLast = i === INTRO_ONBOARD_PATH.length - 1
                    return (
                      <li
                        key={step.to}
                        className={`hp-intro-path__step-wrap${isLast ? ' hp-intro-path__step-wrap--last' : ''}`}
                      >
                        <Link to={step.to} className="hp-intro-path__card">
                          <span className="hp-intro-path__step-num" aria-hidden>
                            {i + 1}
                          </span>
                          <span className="hp-intro-path__ico" aria-hidden>
                            <StepIcon size={18} strokeWidth={2} />
                          </span>
                          <span className="hp-intro-path__label">{step.label}</span>
                          <span className="hp-intro-path__hint">{step.hint}</span>
                          <span className="hp-intro-path__go">
                            Tiếp tục <ChevronRight size={12} aria-hidden />
                          </span>
                        </Link>
                        {!isLast ? <span className="hp-intro-path__glow-line" aria-hidden /> : null}
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            <aside className="hp-intro-split__aside hp-intro-aside" aria-label="Lợi ích học online với AI">
              <h3 className="hp-intro-aside-title">Học online cùng AI</h3>
              <p className="hp-intro-aside-lead">
                Kết hợp <strong style={{ color: '#e2e8f0' }}>video</strong>, <strong style={{ color: '#e2e8f0' }}>quiz ôn tập</strong> và <strong style={{ color: '#e2e8f0' }}>chat gợi ý</strong> — phù hợp học sinh, sinh viên và người mới bắt đầu.
              </p>
              <ul className="hp-intro-highlight-list">
                {INTRO_HIGHLIGHTS.map((row) => {
                  const Hi = row.icon
                  return (
                    <li key={row.title} className="hp-intro-highlight">
                      <div className="hp-intro-highlight-ico" aria-hidden>
                        <Hi size={20} />
                      </div>
                      <div>
                        <div className="hp-intro-highlight-title">{row.title}</div>
                        <p className="hp-intro-highlight-desc">{row.desc}</p>
                        <Link className="hp-intro-highlight-link" to={row.link}>
                          {row.linkLabel}
                          <ChevronRight size={14} aria-hidden />
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow" style={{ margin: '0 auto 1rem' }}>
              <MonitorPlay size={14} aria-hidden />
              Trải nghiệm học
            </div>
            <h2 className="hp-h2">Học có hình — AI trả lời khi bạn đang làm bài</h2>
            <p className="hp-sub">Minh họa lớp online và thực hành; giao diện thân thiện trên điện thoại để hỏi nhanh giữa chừng.</p>
          </div>

          <div className="hp-bento">
            <div className="hp-bento-main">
              <img
                className="hp-bento-img"
                src={HOME_HERO_IMAGES.tutor}
                alt="Học nhóm và làm việc với laptop"
                loading="lazy"
                decoding="async"
                crossOrigin="anonymous"
              />
              <div className="hp-bento-scrim" />
              <div className="hp-bento-content">
                <div className="hp-eyebrow" style={{ marginBottom: 12, fontSize: '0.68rem' }}>AI + giảng viên</div>
                <h3 className="hp-h2" style={{ fontSize: '1.35rem', marginBottom: 8 }}>Học đi đôi với hỏi đáp</h3>
                <p className="hp-sub" style={{ marginBottom: 16, color: '#94a3b8' }}>Xem bài mẫu rồi mở chat AI để làm theo — phù hợp tiết thực hành và ôn ở nhà.</p>
                <Link className="hp-btn hp-btn-primary" to="/chat" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                  Học cùng AI
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            </div>
            <div className="hp-bento-stack">
              <div className="hp-bento-cell" style={{ flex: 1, minHeight: 200 }}>
                <img className="hp-bento-img" src={HOME_HERO_IMAGES.chat} alt="Học online trên laptop" loading="lazy" decoding="async" />
                <div className="hp-bento-scrim" />
                <div className="hp-bento-content" style={{ padding: 20 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600 }}>Lớp online &amp; xem lại</h4>
                  <p className="hp-sub" style={{ fontSize: '0.8rem', margin: 0 }}>Tạm dừng, hỏi AI, rồi làm tiếp — không sợ “lỡ nhịp”.</p>
                </div>
              </div>
              <div className="hp-bento-cell" style={{ flex: 1, minHeight: 200 }}>
                <img className="hp-bento-img" src={HOME_HERO_IMAGES.student} alt="Học viên làm việc hiệu quả" loading="lazy" decoding="async" />
                <div className="hp-bento-scrim" />
                <div className="hp-bento-content" style={{ padding: 20 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 600 }}>Bài tập thực hành</h4>
                  <p className="hp-sub" style={{ fontSize: '0.8rem', margin: 0 }}>Gần với đề Word/Excel trên lớp và đồ án.</p>
                </div>
              </div>
            </div>
            <div className="hp-bento-stack">
              {[
                { val: '2.000+', lbl: 'Bạn học', sub: 'HS · SV · người mới', c: '#fbbf24' },
                { val: '98%', lbl: 'Hài lòng', sub: ' khảo sát nội bộ', c: '#818cf8' },
                { val: '24/7', lbl: 'AI', sub: 'hỗ trợ ngoài giờ', c: '#34d399' },
              ].map((x) => (
                <div key={x.lbl} className="hp-bento-stat">
                  <strong style={{ color: x.c }}>{x.val}</strong>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e2e8f0' }}>{x.lbl}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{x.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hp-section hp-ai-section">
        <div className="hp-container hp-ai-shell">
          <header className="hp-ai-top">
            <div className="hp-ai-nav-head">
              <div className="hp-eyebrow hp-eyebrow-ai">
                <Bot size={14} aria-hidden />
                Trợ lý AI
              </div>
              <h2 className="hp-h2 hp-ai-title">AI hỗ trợ hỏi đáp và gợi ý bài tập</h2>
              <p className="hp-ai-lead">
                Hỏi → nhận gợi ý từng bước → tự làm trên máy. Chọn chủ đề ở hàng dưới (cột trái); khung bên phải hiển thị chi tiết tương ứng.
              </p>
            </div>
            <div className="hp-ai-steps" aria-label="Luồng học với AI">
              <div className="hp-ai-step">
                <span className="hp-ai-step-num">01</span>
                <strong>Hỏi</strong>
                <p>Gõ đề, dán lỗi Excel hoặc mô tả chỗ đang kẹt.</p>
              </div>
              <div className="hp-ai-step">
                <span className="hp-ai-step-num">02</span>
                <strong>Gợi ý</strong>
                <p>AI trả lời tiếng Việt, chia nhỏ thao tác — hỏi lại thoải mái.</p>
              </div>
              <div className="hp-ai-step">
                <span className="hp-ai-step-num">03</span>
                <strong>Làm bài</strong>
                <p>Làm theo trên Word/Excel; mở video bài khi cần nền lý thuyết.</p>
              </div>
            </div>
          </header>

          <div className="hp-ai-layout">
            <div className="hp-ai-col hp-ai-col-nav">
              <div className="hp-ai-tabbox" role="tablist" aria-label="Tính năng AI">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    role="tab"
                    id={`hp-feature-tab-${i}`}
                    aria-selected={activeFeature === i}
                    tabIndex={0}
                    className={`hp-feature-row ${activeFeature === i ? 'is-active' : ''}`}
                    style={{ '--f-color': f.color, '--f-bg': f.bg }}
                    onClick={() => {
                      setFeaturesAutoplay(false)
                      setActiveFeature(i)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setFeaturesAutoplay(false)
                        setActiveFeature(i)
                      }
                    }}
                  >
                    <div className="hp-feature-icon">
                      <f.icon size={20} color={activeFeature === i ? f.color : '#64748b'} aria-hidden />
                    </div>
                    <div className="hp-feature-row-text">
                      <span className="hp-feature-row-title">{f.title}</span>
                      {activeFeature === i ? (
                        <p className="hp-feature-row-desc">{f.desc}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hp-ai-nav-cta">
                <Link className="hp-btn hp-btn-primary hp-btn-block-sm" to="/chat">
                  <Sparkles size={17} aria-hidden />
                  Mở chat hỏi bài
                </Link>
              </div>
            </div>

            <div className="hp-ai-col hp-ai-col-stage">
              <div className="hp-feature-panel">
                <div
                  className="hp-feature-detail"
                  role="tabpanel"
                  id="hp-feature-panel"
                  aria-labelledby={`hp-feature-tab-${activeFeature}`}
                  key={activeFeature}
                  style={{ '--f-color': feat.color, '--f-bg': feat.bg }}
                >
                  <div className="hp-feature-detail-head">
                    <div className="hp-feature-detail-icon">
                      <FeatureDetailIcon size={28} color={feat.color} aria-hidden />
                    </div>
                    <div className="hp-feature-detail-intro">
                      <h3>{featurePanel.headline}</h3>
                      <p className="hp-feature-detail-lead">{featurePanel.lead}</p>
                    </div>
                  </div>
                  <ul className="hp-feature-detail-list">
                    {featurePanel.bullets.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {featurePanel.hint ? (
                    <p className="hp-feature-detail-hint">{featurePanel.hint}</p>
                  ) : null}
                  <div className="hp-feature-detail-cta">
                    <Link className="hp-btn hp-btn-primary hp-feature-detail-btn" to={featurePanel.ctaPath}>
                      {featurePanel.ctaLabel}
                      <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                  <div className="hp-feature-detail-progress" aria-hidden>
                    <div className="hp-progress hp-progress-inset">
                      <div
                        className="hp-progress-bar"
                        style={{ width: `${(activeFeature + 1) * 25}%`, background: feat.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-section">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow" style={{ margin: '0 auto 1rem' }}>
              <BookOpen size={14} aria-hidden />
              Khóa học
            </div>
            <h2 className="hp-h2">Khóa &amp; chủ đề phù hợp HS — SV</h2>
            <p className="hp-sub">Nội dung có thể do quản trị cập nhật; dưới đây là ba hướng gợi ý — ưu tiên nền tảng và bài tập.</p>
          </div>
          <div className="hp-courses">
            {loadedCourses.map((c, i) => {
              const Icon = c.icon || Layers
              return (
                <article key={`${c.title}-${i}`} className="hp-course">
                  <div className="hp-course-bar" style={{ background: `linear-gradient(90deg, ${c.color}, ${c.color}99)` }} />
                  <div className="hp-course-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={c.color} aria-hidden />
                      </div>
                      <div>
                        <span className="hp-tag" style={{ color: c.color, borderColor: `${c.color}44`, background: `${c.color}12`, marginBottom: 6, display: 'inline-block' }}>{c.label}</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{c.title}</h3>
                      </div>
                    </div>
                    <div className="hp-course-meta">
                      <span><BookOpen size={13} aria-hidden /> {c.steps} bước</span>
                      <span><Clock size={13} aria-hidden /> {c.duration}</span>
                      <span><Star size={13} fill="#fbbf24" color="#fbbf24" aria-hidden /> 4,9</span>
                    </div>
                    <div className="hp-tag-row">
                      {(c.tags || []).slice(0, 4).map((t) => (
                        <span key={t} className="hp-tag" style={{ color: c.color, borderColor: `${c.color}33`, background: `${c.color}0d` }}>{t}</span>
                      ))}
                    </div>
                    <Link className="hp-course-link" to={c.link} style={{ color: c.color, borderColor: `${c.color}40`, background: `${c.color}10` }}>
                      Vào học
                      <ArrowRight size={16} aria-hidden />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="hp-section" ref={statsRef}>
        <div className="hp-container">
          <div className="hp-metrics">
            {STATS.map((s) => (
              <StatMetricCard key={s.label} item={s} started={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      <section className="hp-section hp-quote-section" aria-labelledby="hp-quote-heading">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow" style={{ margin: '0 auto 1rem' }}>
              <Star size={14} aria-hidden />
              Phản hồi từ lớp
            </div>
            <h2 className="hp-h2" id="hp-quote-heading">Học sinh, sinh viên &amp; người mới nói gì?</h2>
          </div>
          <div
            className="hp-quote-marquee-wrap"
            role="region"
            aria-label="Phản hồi học viên, danh sách cuộn tự động"
          >
            <div className="hp-quote-marquee">
              <div className="hp-quote-marquee-track">
                {TESTIMONIALS.map((t) => (
                  <blockquote key={t.id} className="hp-quote hp-quote-marquee-card">
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={14} fill="#fbbf24" color="#fbbf24" aria-hidden />
                      ))}
                    </div>
                    <p>“{t.text}”</p>
                    <div className="hp-author">
                      <div className="hp-avatar" style={{ color: t.color, borderColor: `${t.color}44`, background: `${t.color}18` }}>{t.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                        <div className="hp-sub" style={{ fontSize: '0.78rem', margin: 0 }}>{t.role}</div>
                      </div>
                    </div>
                  </blockquote>
                ))}
                {TESTIMONIALS.map((t) => (
                  <blockquote key={`${t.id}-dup`} className="hp-quote hp-quote-marquee-card" aria-hidden="true">
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={14} fill="#fbbf24" color="#fbbf24" aria-hidden />
                      ))}
                    </div>
                    <p>“{t.text}”</p>
                    <div className="hp-author">
                      <div className="hp-avatar" style={{ color: t.color, borderColor: `${t.color}44`, background: `${t.color}18` }}>{t.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                        <div className="hp-sub" style={{ fontSize: '0.78rem', margin: 0 }}>{t.role}</div>
                      </div>
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hp-cta">
        <div className="hp-cta-bg" aria-hidden />
        <div className="hp-container hp-cta-inner">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(180deg,#4f46e5,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 36px rgba(67,56,202,0.35)' }}>
              <Rocket size={28} color="#fff" aria-hidden />
            </div>
          </div>
          <h2 className="hp-h2">Sẵn sàng hỏi bài cùng AI?</h2>
          <p className="hp-lead" style={{ margin: '0 auto 1.75rem' }}>
            Đăng ký để nhận xu chào mừng — thử hỏi đáp tin học và làm quen Word, Excel ngay trên trình duyệt.
          </p>
          <div className="hp-actions" style={{ justifyContent: 'center', marginBottom: 0 }}>
            <Link className="hp-btn hp-btn-primary" to="/auth?mode=register" style={{ padding: '14px 28px' }}>
              <Sparkles size={18} aria-hidden />
              Đăng ký
            </Link>
            <Link className="hp-btn hp-btn-secondary" to="/chat" style={{ padding: '14px 28px' }}>
              <Bot size={18} aria-hidden />
              Hỏi AI ngay
            </Link>
          </div>
        </div>
      </section>

      <section className="hp-trust-strip" aria-label="Thông tin tin cậy">
        <div className="hp-container">
          <ul className="hp-trust-list">
            <li>
              <ShieldCheck size={18} className="hp-trust-ico" aria-hidden />
              <span>Kết nối bảo mật <strong>HTTPS</strong></span>
            </li>
            <li>
              <Lock size={18} className="hp-trust-ico" aria-hidden />
              <span>Đăng nhập &amp; phiên làm việc được bảo vệ</span>
            </li>
            <li>
              <BookOpen size={18} className="hp-trust-ico" aria-hidden />
              <span>Bài học có <strong>lộ trình</strong> rõ ràng</span>
            </li>
            <li>
              <CreditCard size={18} className="hp-trust-ico" aria-hidden />
              <span>
                <Link to="/credits">Xu &amp; gói — minh bạch</Link>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="hp-faq-section" aria-labelledby="hp-faq-heading">
        <div className="hp-container">
          <div className="hp-section-head hp-center">
            <div className="hp-eyebrow" style={{ margin: '0 auto 1rem' }}>
              <HelpCircle size={14} aria-hidden />
              Câu hỏi thường gặp
            </div>
            <h2 className="hp-h2" id="hp-faq-heading">Trước khi bắt đầu, bạn thường hỏi…</h2>
            <p className="hp-sub">Chạm câu hỏi để xem trả lời ngắn gọn. Chi tiết luôn cập nhật theo chính sách trên trang Xu và Hướng dẫn.</p>
          </div>
          <div className="hp-faq-list">
            {HOME_FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={item.q} className={`hp-faq-item ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="hp-faq-q"
                    id={`hp-faq-q-${i}`}
                    aria-expanded={open}
                    aria-controls={`hp-faq-a-${i}`}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="hp-faq-q-text">{item.q}</span>
                    <ChevronDown className="hp-faq-chevron" size={20} aria-hidden />
                  </button>
                  <div
                    id={`hp-faq-a-${i}`}
                    className="hp-faq-a"
                    role="region"
                    aria-labelledby={`hp-faq-q-${i}`}
                    hidden={!open}
                  >
                    <p>{item.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="hp-faq-foot">
            Cần chi tiết nạp xu? <Link to="/deposit">Nạp xu</Link>
            {' · '}
            <Link to="/credits">Bảng giá xu</Link>
          </p>
        </div>
      </section>

      <section className="hp-seo" aria-label="Thông tin dịch vụ">
        <div className="hp-container">
          <div className="hp-seo-card">
            <h2 className="hp-h2" style={{ fontSize: '1.25rem', marginBottom: 16 }}>Học máy tính &amp; hỏi đáp tin học</h2>
            <div className="hp-seo-grid">
              <div>
                <h3>Người mới &amp; phụ huynh</h3>
                <p>Làm quen máy tính, tệp tin, in ấn, email và tìm kiếm an toàn — phù hợp người ít tiếp xúc công nghệ.</p>
              </div>
              <div>
                <h3>Học sinh</h3>
                <p>Word, Excel, PowerPoint theo bài tập trên lớp; chuẩn bị slide thuyết trình; hỏi AI khi kẹt thao tác.</p>
              </div>
              <div>
                <h3>Sinh viên</h3>
                <p>Định dạng báo cáo, bảng biểu, biểu đồ; ôn tin học đại cương; gợi ý cấu trúc nội dung trước khi nộp.</p>
              </div>
              <div>
                <h3>AI gia sư</h3>
                <p>Hỏi đáp tiếng Việt, giải thích từng bước; kết hợp khóa học và chính sách xu minh bạch trên trang hướng dẫn.</p>
              </div>
            </div>
            <div className="hp-seo-tags">
              {['Học máy vi tính từ đầu', 'Tin học học sinh', 'Tin học sinh viên', 'Hỏi đáp Word Excel', 'Giải bài tập tin học', 'AI gia sư', 'Ôn tin THPT', 'PowerPoint thuyết trình', 'Học online'].map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="hp-footer">
        <div className="hp-container">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/logo_cartoon.png" alt="" width={40} height={40} style={{ borderRadius: 10, objectFit: 'cover' }} />
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>Gia Sư Tin Học</span>
              </div>
              <p>Nền tảng học tin học hiện đại: bài học có lộ trình + AI hỗ trợ hỏi đáp và gợi ý bài tập cho học sinh, sinh viên và người mới.</p>
            </div>
            {[
              { title: 'Khóa học', links: [['Tổng quan', '/lessons'], ['Lộ trình mới', '/start']] },
              { title: 'Công cụ', links: [['Chat AI', '/chat'], ['Ôn tập', '/quiz'], ['Nạp xu', '/deposit']] },
              { title: 'Tài khoản', links: [['Đăng nhập', '/auth'], ['Đăng ký', '/auth?mode=register'], ['Bảng giá xu', '/credits']] },
            ].map((col) => (
              <div key={col.title} className="hp-footer-col">
                <h4>{col.title}</h4>
                {col.links.map(([label, href]) => (
                  <Link key={label} to={href}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="hp-footer-bottom">
            <span>© {new Date().getFullYear()} Gia Sư Tin Học</span>
            <span>TLS · Dữ liệu học tập được xử lý theo chính sách nền tảng</span>
          </div>
        </div>
      </footer>

      <Link to="/chat" className="hp-chat-fab" title="Hỏi nhanh — mở chat AI" aria-label="Hỏi nhanh, mở trang chat AI">
        <Bot size={22} aria-hidden />
        <span className="hp-chat-fab-text">Hỏi nhanh</span>
      </Link>
    </div>
  )
}
