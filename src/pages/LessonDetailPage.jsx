import Swal from 'sweetalert2';
import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import Navbar from '../components/Navbar'
import { LESSONS } from '../data/lessons'
import { useCredits } from '../context/CreditContext'
import ReactPlayer from 'react-player';
import { ArrowLeft, Lock, Play, BookOpen, PenTool, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Trophy, Award, Download, X, Clock, Menu, FileText, ListVideo } from 'lucide-react'
import './LessonDetailPage.css'
import { studentAuthHeaders, studentJsonAuthHeaders } from '../lib/authFetch'

/* ─── Helpers & Modal ───────────────────────────────────────────── */
function getYouTubeId(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/)
  return m ? m[1] : null
}
function isVideoUrl(url = '') {
  return url && (url.includes('youtube') || url.includes('youtu.be') || url.includes('.mp4') || url.includes('/uploads/'))
}

function normalizeQuizAnswer(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_\-]+/g, ' ')
    .trim();
}

/** mcq | text (nhập) | order (kéo thả thứ tự) */
function getQuestionType(q) {
  if (!q) return 'mcq';
  if (q.type === 'text' || q.type === 'order') return q.type;
  if (q.type === 'mcq') return 'mcq';
  if (Array.isArray(q.acceptableAnswers) && q.acceptableAnswers.length && (!q.options || q.options.length < 2)) return 'text';
  return 'mcq';
}

function formatVideoTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function escapeForSwalHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function CertificateModal({ cert, examState, courseTitle, studentName, onClose }) {
  const certRef = useRef(null)
  const rawDate = cert?.completedAt || examState?.gradedAt || new Date();
  const date = new Date(rawDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const handlePrint = () => {
    const content = certRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=640')
    win.document.write(`
      <html><head>
        <title>Chứng Chỉ - ${studentName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Be Vietnam Pro', system-ui, sans-serif; background: #fff; }
          .cert { width:900px; height:620px; position:relative; padding:50px 60px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%); color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
          .border-frame { position:absolute; inset:16px; border:2px solid rgba(245,158,11,0.4); border-radius:20px; pointer-events:none; }
          .tl { position:absolute; width:30px; height:30px; border-style:solid; top:24px; left:24px; border-width:3px 0 0 3px; border-color:#f59e0b; border-radius:6px 0 0 0; }
          .tr { position:absolute; width:30px; height:30px; border-style:solid; top:24px; right:24px; border-width:3px 3px 0 0; border-color:#f59e0b; border-radius:0 6px 0 0; }
          .bl { position:absolute; width:30px; height:30px; border-style:solid; bottom:24px; left:24px; border-width:0 0 3px 3px; border-color:#f59e0b; border-radius:0 0 0 6px; }
          .br { position:absolute; width:30px; height:30px; border-style:solid; bottom:24px; right:24px; border-width:0 3px 3px 0; border-color:#f59e0b; border-radius:0 0 6px 0; }
        </style>
      </head><body>${content}</body></html>
    `)
    win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close() }, 600)
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:20000, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:'960px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h3 style={{ color:'white', fontWeight:800, display:'flex', alignItems:'center', gap:'10px' }}><Trophy size={22} color="#f59e0b" /> Chứng Chỉ Hoàn Thành</h3>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handlePrint} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 18px', background:'linear-gradient(135deg, #f59e0b, #d97706)', border:'none', borderRadius:'10px', color:'white', fontWeight:700, cursor:'pointer' }}><Download size={16} /> In / Tải PDF</button>
            <button onClick={onClose} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,0.08)', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18} /></button>
          </div>
        </div>
        <div ref={certRef}>
          <div className="cert" style={{ width:'100%', aspectRatio:'900/620', position:'relative', padding:'50px 60px', background:'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', borderRadius:'20px', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', border:'1px solid rgba(245,158,11,0.08)', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
            <div style={{ position:'absolute', width:'700px', height:'700px', borderRadius:'50%', border:'1px solid rgba(99,102,241,0.05)', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
            <div className="border-frame" style={{ position:'absolute', inset:'16px', border:'2px solid rgba(245,158,11,0.4)', borderRadius:'14px' }} />
            <div className="tl" style={{ position:'absolute', width:'30px', height:'30px', borderStyle:'solid', top:'24px', left:'24px', borderTopWidth:'3px', borderLeftWidth:'3px', borderTopColor:'#f59e0b', borderLeftColor:'#f59e0b', borderBottomWidth:0, borderRightWidth:0 }} />
            <div className="tr" style={{ position:'absolute', width:'30px', height:'30px', borderStyle:'solid', top:'24px', right:'24px', borderTopWidth:'3px', borderRightWidth:'3px', borderTopColor:'#f59e0b', borderRightColor:'#f59e0b', borderBottomWidth:0, borderLeftWidth:0 }} />
            <div className="bl" style={{ position:'absolute', width:'30px', height:'30px', borderStyle:'solid', bottom:'24px', left:'24px', borderBottomWidth:'3px', borderLeftWidth:'3px', borderBottomColor:'#f59e0b', borderLeftColor:'#f59e0b', borderTopWidth:0, borderRightWidth:0 }} />
            <div className="br" style={{ position:'absolute', width:'30px', height:'30px', borderStyle:'solid', bottom:'24px', right:'24px', borderBottomWidth:'3px', borderRightWidth:'3px', borderBottomColor:'#f59e0b', borderRightColor:'#f59e0b', borderTopWidth:0, borderLeftWidth:0 }} />
            <div style={{ fontSize:'12px', letterSpacing:'0.2em', color:'#f59e0b', textTransform:'uppercase', marginBottom:'6px', fontWeight:700 }}>GIA SƯ TIN HỌC</div>
            <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'20px', letterSpacing:'0.1em' }}>TRUNG TÂM ĐÀO TẠO TIN HỌC ỨNG DỤNG</div>
            <div style={{ fontSize:'38px', fontFamily:"'Be Vietnam Pro', system-ui, sans-serif", fontWeight:800, background:'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'4px', lineHeight:1 }}>Chứng Chỉ Hoàn Thành</div>
            <div style={{ fontSize:'11px', color:'#94a3b8', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'24px' }}>Certificate of Completion</div>
            <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'8px' }}>Chứng nhận học viên</div>
            <div style={{ fontSize:'34px', fontWeight:900, color:'white', marginBottom:'12px', letterSpacing:'0.02em' }}>{studentName}</div>
            <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'10px' }}>đã hoàn thành xuất sắc khóa học</div>
            <div style={{ fontSize:'18px', fontWeight:700, color:'#a5b4fc', padding:'8px 24px', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:'30px', marginBottom:'24px' }}>{cert.courseTitle}</div>
            <div style={{ display:'flex', gap:'40px', justifyContent:'center', alignItems:'center' }}>
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>Ngày cấp</div><div style={{ fontSize:'13px', fontWeight:700, color:'#e2e8f0' }}>{date}</div></div>
              <div style={{ width:'1px', height:'30px', background:'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>Mã chứng chỉ</div><div style={{ fontSize:'13px', fontWeight:700, color:'#e2e8f0', fontFamily:'monospace' }}>{cert.certificateId}</div></div>
              <div style={{ width:'1px', height:'30px', background:'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign:'center' }}><div style={{ fontSize:'10px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>Xếp loại</div><div style={{ fontSize:'13px', fontWeight:700, color:'#34d399' }}>Hoàn Thành</div></div>
            </div>
            <div style={{ position:'absolute', bottom:'32px', right:'48px', width:'64px', height:'64px', borderRadius:'50%', background:'radial-gradient(circle, #f59e0b, #d97706)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(245,158,11,0.4)' }}><Award size={28} color="white" strokeWidth={2} /></div>
            <div style={{ position:'absolute', bottom:'18px', left:'50%', transform:'translateX(-50%)', fontSize:'9px', color:'#334155', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>Xác minh tại: giasutinhoc24h.com/cert/{cert.certificateId}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LessonDetailPage() {

  const { id } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState('theory') // theory | video | practice
  const [isTheoryExpanded, setIsTheoryExpanded] = useState(false)
  const { deductCredits } = useCredits()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)

  // Interactive Quiz States (nhiều điểm dừng, mỗi điểm nhiều câu hỏi)
  const [activeCheckpoint, setActiveCheckpoint] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0) // câu hỏi hiện tại trong checkpoint
  const [completedCheckpoints, setCompletedCheckpoints] = useState(new Set())
  const [videoPlaying, setVideoPlaying] = useState(true)
  const [quizWrongCount, setQuizWrongCount] = useState(0)
  const [textQuizInput, setTextQuizInput] = useState('')
  const [orderPermutation, setOrderPermutation] = useState(null) // chỉ số 0..n-1 sau khi xáo
  const [orderDragFrom, setOrderDragFrom] = useState(null)

  const [lesson, setLesson] = useState(null)
  
  const [progressData, setProgressData] = useState(null)
  const [markingDone, setMarkingDone] = useState(false)
  const [showCert, setShowCert] = useState(false);
  const [examState, setExamState] = useState(null);
  const [retakeCountdown, setRetakeCountdown] = useState('');
  const [justCompleted, setJustCompleted] = useState(false)
  const [lessonBootstrap, setLessonBootstrap] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transcriptQuery, setTranscriptQuery] = useState('')
  const playerRef = useRef(null)
  const lastWatchPostRef = useRef(0)
  
  const user = (() => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } })()

  // ─── Countdown timer cho thời gian chờ thi lại ───
  useEffect(() => {
    if (!examState?.nextRetakeAllowedAt) return;
    const calcCountdown = () => {
      const diff = new Date(examState.nextRetakeAllowedAt) - new Date();
      if (diff <= 0) { setRetakeCountdown(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRetakeCountdown(`Còn ${h > 0 ? h + 'g ' : ''}${m}ph ${s}giây`);
    };
    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [examState?.nextRetakeAllowedAt]);

  useEffect(() => {
    const init = async () => {
      setLessonBootstrap(true);
      let currentLesson = null;

      // Luôn ưu tiên lấy dữ liệu từ Database (có quiz data)
      try {
        const res = await fetch('/api/courses');
        const d = await res.json();
        if (d.success && d.data) {
          currentLesson = d.data.find(l => l.id === id);
        }
      } catch (e) {
        console.log('Không thể tải từ API, dùng dữ liệu tĩnh');
      }

      // Fallback: dùng dữ liệu tĩnh nếu API thất bại
      if (!currentLesson) {
        currentLesson = LESSONS.find(l => l.id === id);
      }

      if (!currentLesson) {
        setLessonBootstrap(false);
        navigate('/lessons');
        return;
      }

      // Migrate d\u1eef li\u1ec7u quiz c\u0169 sang c\u1ea5u tr\u00fac m\u1edbi (questions[])
      if (currentLesson?.steps) {
        currentLesson = {
          ...currentLesson,
          steps: currentLesson.steps.map(s => ({
            ...s,
            quizCheckpoints: (s.quizCheckpoints || []).map(cp => {
              // N\u1ebfu checkpoint c\u00f3 question tr\u1ef1c ti\u1ebfp (c\u1ea5u tr\u00fac c\u0169) th\u00ec chuy\u1ec3n sang questions[]
              if (cp.question && (!cp.questions || cp.questions.length === 0)) {
                return { timeInSeconds: cp.timeInSeconds, questions: [{ question: cp.question, options: cp.options || [], correctIndex: cp.correctIndex ?? 0 }] };
              }
              return cp;
            })
          }))
        };
      }

      setLesson(currentLesson);
      setLessonBootstrap(false);

      // TIẾN ĐỘ 
      if (user?._id) {
        fetch('/api/progress/' + user?._id + '/' + currentLesson.id, { headers: studentAuthHeaders() })
          .then(r => r.json())
          .then(d => {
            if(d.success && d.data) {
               setProgressData(d.data);
               if (d.data.lastWatchedStep) setCurrentStep(d.data.lastWatchedStep);
            }
          }).catch(e => console.log('Không lấy được tiến độ', e));

        // Lấy trạng thái bài thi cuối khóa
        try {
          const examRes = await fetch(`/api/exams/${user._id}/${currentLesson.id}`, { headers: studentAuthHeaders() });
          const examData = await examRes.json();
          if (examData.success && examData.data) {
            setExamState(examData.data);
          }
        } catch (e) {
          console.log('Không lấy được trạng thái bài thi', e);
        }
      }

      try {
        const u = JSON.parse(localStorage.getItem('giasu_user'));
        if (!u) { setChecking(false); return; }
        if (u.unlockedCourses && u.unlockedCourses.includes(currentLesson.id)) {
          setIsUnlocked(true); setChecking(false); return;
        }
        const res = await fetch(`/api/users/${u._id}`, { headers: studentAuthHeaders() });
        const d = await res.json();
        if (d.success && d.data?.unlockedCourses?.includes(currentLesson.id)) {
          setIsUnlocked(true);
          localStorage.setItem('giasu_user', JSON.stringify({ ...u, unlockedCourses: d.data.unlockedCourses }));
        }
      } catch {}
      setChecking(false);
    };

    init();
  }, [id, navigate]);

  useEffect(() => { setTranscriptQuery(''); setPlaybackRate(1); }, [currentStep]);

  // Reset tab + video + quiz khi chuyển step
  useEffect(() => { 
    setActiveTab('theory'); 
    setIsTheoryExpanded(false);
    setActiveCheckpoint(null);
    setCurrentQuestionIndex(0);
    setCompletedCheckpoints(new Set());
    setVideoPlaying(true);
    setQuizWrongCount(0);
    setTextQuizInput('');
    setOrderPermutation(null);
  }, [currentStep]);

  // Xáo thứ tự câu kéo-thả khi đổi câu trong checkpoint
  useEffect(() => {
    if (!activeCheckpoint) return;
    const questions = activeCheckpoint.questions || [];
    const currentQ = questions[currentQuestionIndex];
    setQuizWrongCount(0);
    setTextQuizInput('');
    if (!currentQ) {
      setOrderPermutation(null);
      return;
    }
    if (getQuestionType(currentQ) === 'order' && Array.isArray(currentQ.options) && currentQ.options.length >= 2) {
      const n = currentQ.options.length;
      const arr = [...Array(n).keys()];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      if (arr.every((v, i) => v === i) && n > 1) [arr[0], arr[1]] = [arr[1], arr[0]];
      setOrderPermutation(arr);
    } else {
      setOrderPermutation(null);
    }
  }, [activeCheckpoint, currentQuestionIndex]);

  if (lessonBootstrap) {
    return (
      <div className="lesson-detail-page lesson-detail-page--loading" style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a1a)' }}>
        <Navbar />
        <div className="container" style={{ paddingTop: '100px', maxWidth: '1100px' }}>
          <div className="lesson-skeleton lesson-skeleton--hero" />
          <div style={{ display: 'flex', gap: '24px', marginTop: '28px', flexWrap: 'wrap' }}>
            <div className="lesson-skeleton lesson-skeleton--sidebar" />
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div className="lesson-skeleton lesson-skeleton--video" />
              <div className="lesson-skeleton lesson-skeleton--line" style={{ marginTop: '16px' }} />
              <div className="lesson-skeleton lesson-skeleton--line short" style={{ marginTop: '10px' }} />
            </div>
          </div>
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '28px', fontSize: '0.9rem' }}>Đang tải khóa học…</p>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  const step = lesson.steps[currentStep];

  
  const checkAndShowExamPopup = (courseId) => {
    Swal.fire({
      title: 'Đã hoàn thành video!',
      text: 'Bạn cần thực hiện bài thi cuối khóa (Trắc nghiệm + Tự luận) để được cấp chứng chỉ. Bắt đầu thi ngay?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý thi',
      cancelButtonText: 'Hủy bỏ (Lần tới thi)'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/exam/' + courseId);
      }
    });
  };

  const markStepDone = async (stepIdx) => {
    if (!user?._id) {
      Swal.fire({ title: 'Vui lòng đăng nhập', text: 'Bạn cần đăng nhập để lưu kết quả học tập và nhận chứng chỉ.', icon: 'warning', confirmButtonColor: '#10b981' });
      return;
    }
    if (markingDone) return;
    setMarkingDone(true);
    try {
      const r = await fetch('/api/progress/step', {
        method: 'POST',
        headers: studentJsonAuthHeaders(),
        body: JSON.stringify({ studentId: user?._id, courseId: lesson.id, stepIndex: stepIdx })
      });
      const d = await r.json();
      if (d.success) {
        setProgressData(d.data);
        if (d.data.isCompleted && !progressData?.isCompleted) {
          setJustCompleted(true);
          setTimeout(() => checkAndShowExamPopup(lesson.id), 1000);
        }
      }
    } catch {}
    setMarkingDone(false);
  };
    
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === lesson.steps.length - 1
  const progress = progressData?.progressPct || ((currentStep + 1) / lesson.steps.length) * 100
  const isCurrentStepFree = isUnlocked || currentStep === 0

  const createMarkup = (text) => ({ __html: marked(text || '') })

  const handleNext = () => {
    if (!progressData?.completedSteps?.includes(currentStep)) markStepDone(currentStep);
    if (!isLastStep) { setCurrentStep(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else navigate('/lessons')
  }
  const handlePrev = () => { if (!isFirstStep) { setCurrentStep(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } }

  const handleTimeUpdate = (e) => {
    const checkpoints = step?.quizCheckpoints;
    if (!checkpoints || checkpoints.length === 0) return;
    const t = e.target?.currentTime ?? 0;
    if (activeCheckpoint) return;

    const sorted = [...checkpoints].sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    for (const cp of sorted) {
      const cpKey = `cp-${cp.timeInSeconds}`;
      if (t >= cp.timeInSeconds && !completedCheckpoints.has(cpKey) && cp.questions?.length > 0) {
        setVideoPlaying(false);
        setActiveCheckpoint(cp);
        setCurrentQuestionIndex(0);
        return;
      }
    }
  };

  const handlePlayerProgress = (st) => {
    const playedSeconds = st?.playedSeconds ?? 0;
    handleTimeUpdate({ target: { currentTime: playedSeconds } });
    if (!user?._id || !lesson?.id || !isCurrentStepFree || activeCheckpoint) return;
    const now = Date.now();
    if (now - lastWatchPostRef.current < 14000) return;
    lastWatchPostRef.current = now;
    fetch('/api/progress/watch', {
      method: 'POST',
      headers: studentJsonAuthHeaders(),
      body: JSON.stringify({
        studentId: user._id,
        courseId: lesson.id,
        stepIndex: currentStep,
        seconds: Math.floor(playedSeconds),
      }),
    }).catch(() => {});
  };

  const seekToSeconds = (sec) => {
    if (!isCurrentStepFree) return;
    const t = Math.max(0, Number(sec) || 0);
    const el = playerRef.current;
    if (el && typeof el.currentTime === 'number') {
      try { el.currentTime = t; } catch (_) { /* một số nguồn (iframe) có thể chặn seek */ }
    }
    setVideoPlaying(true);
    setSidebarOpen(false);
  };

  const closeCheckpointAndResume = () => {
    if (!activeCheckpoint) return;
    const cpKey = `cp-${activeCheckpoint.timeInSeconds}`;
    setCompletedCheckpoints(prev => new Set([...prev, cpKey]));
    setActiveCheckpoint(null);
    setCurrentQuestionIndex(0);
    setQuizWrongCount(0);
    setTextQuizInput('');
    setOrderPermutation(null);
    setVideoPlaying(true);
  };

  const showEncourageAndSkipCheckpoint = () => {
    Swal.fire({
      title: 'Bạn vẫn đang tiến bộ đấy',
      html: '<p style="color:#94a3b8;line-height:1.65">Không ai giỏi ngay từ lần đầu. Cứ xem tiếp video — mục <strong>Thực hành</strong> bên dưới vẫn chờ bạn luyện thêm khi đã tự tin hơn nhé.</p>',
      icon: 'info',
      confirmButtonText: 'Tiếp tục xem video',
      confirmButtonColor: '#6366f1',
    }).then(() => closeCheckpointAndResume());
  };

  const onQuizWrong = (explanation) => {
    setQuizWrongCount(w => {
      if (w >= 1) {
        queueMicrotask(() => showEncourageAndSkipCheckpoint());
        return w;
      }
      const expl = explanation ? String(explanation).trim() : '';
      queueMicrotask(() => (expl
        ? Swal.fire({
          title: 'Chưa khớp rồi',
          html: `<p style="color:#94a3b8;line-height:1.6;margin:0 0 12px">Thử thêm một lần nữa nhé.</p><div style="text-align:left;border-left:3px solid #6366f1;padding:10px 14px;background:rgba(99,102,241,0.08);border-radius:0 10px 10px 0;color:#c7d2fe;font-size:0.95rem;line-height:1.55"><strong style="color:#a5b4fc">Vì sao đáp án đúng?</strong><br/>${escapeForSwalHtml(expl)}</div>`,
          icon: 'info',
          confirmButtonColor: '#6366f1',
        })
        : Swal.fire({
          title: 'Chưa khớp rồi',
          text: 'Thử thêm một lần nữa nhé — nhầm lẫn là dấu hiệu não bạn đang học đấy.',
          icon: 'info',
          confirmButtonColor: '#6366f1',
        })));
      return w + 1;
    });
  };

  const advanceAfterCorrect = (questions) => {
    setQuizWrongCount(0);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      Swal.fire({ title: '✅ Chính xác!', text: `Câu ${currentQuestionIndex + 2}/${questions.length}`, icon: 'success', timer: 1100, showConfirmButton: false });
    } else {
      closeCheckpointAndResume();
      Swal.fire('🎉 Xuất sắc!', `Bạn đã vượt qua ${questions.length} câu tại điểm dừng này! Video tiếp tục...`, 'success');
    }
  };

  const handleMcqAnswer = (selectedIndex) => {
    if (!activeCheckpoint) return;
    const questions = activeCheckpoint.questions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ || getQuestionType(currentQ) !== 'mcq') return;
    if (selectedIndex === currentQ.correctIndex) advanceAfterCorrect(questions);
    else onQuizWrong(currentQ.explanation);
  };

  const handleTextQuizSubmit = () => {
    if (!activeCheckpoint) return;
    const questions = activeCheckpoint.questions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const raw = textQuizInput.trim();
    if (!raw) {
      Swal.fire({ title: 'Bạn chưa nhập đáp án', icon: 'info', confirmButtonColor: '#6366f1' });
      return;
    }
    const normIn = normalizeQuizAnswer(raw);
    const pool = Array.isArray(currentQ.acceptableAnswers) && currentQ.acceptableAnswers.length
      ? currentQ.acceptableAnswers
      : (currentQ.options || []).filter(Boolean);
    const ok = pool.some(a => {
      const n = normalizeQuizAnswer(a);
      return n && (normIn === n || normIn.includes(n) || n.includes(normIn));
    });
    if (ok) advanceAfterCorrect(questions);
    else onQuizWrong(currentQ.explanation);
  };

  const handleOrderQuizSubmit = () => {
    if (!activeCheckpoint || !orderPermutation) return;
    const questions = activeCheckpoint.questions || [];
    const currentQ = questions[currentQuestionIndex];
    const ok = orderPermutation.every((id, i) => id === i);
    if (ok) advanceAfterCorrect(questions);
    else onQuizWrong(currentQ?.explanation);
  };

  const moveOrderSlot = (from, to) => {
    if (from === to || !orderPermutation) return;
    const next = [...orderPermutation];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setOrderPermutation(next);
  };

  const renderCheckpointPanel = (compact) => {
    if (!activeCheckpoint) return null;
    const questions = activeCheckpoint.questions || [];
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;
    const qType = getQuestionType(currentQ);
    const pad = compact ? '24px' : '32px';
    const maxW = compact ? '500px' : '600px';

    return (
      <div
        className="animate-fade-in-up lesson-checkpoint-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-checkpoint-title"
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: pad }}
      >
        <div style={{ background: 'rgba(30,41,59,0.88)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '16px', padding: compact ? '24px' : '32px', width: '100%', maxWidth: maxW, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '12px' : '16px' }}>
            <h3 id="lesson-checkpoint-title" style={{ margin: 0, color: '#f8fafc', fontSize: compact ? '1.1rem' : '1.25rem', fontWeight: 'bold' }}>
              {qType === 'text' ? '✍️ Kiểm tra nhanh' : qType === 'order' ? '🔀 Sắp xếp thứ tự' : '✍️ Trắc nghiệm'}
            </h3>
            <span style={{ fontSize: compact ? '0.75rem' : '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: '20px' }}>⏱ {activeCheckpoint.timeInSeconds}s</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: compact ? '16px' : '20px' }}>
            {questions.map((_, qi) => (
              <div key={qi} style={{ flex: 1, height: compact ? '3px' : '4px', borderRadius: '2px', background: qi < currentQuestionIndex ? '#10b981' : qi === currentQuestionIndex ? '#6366f1' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <p style={{ color: '#818cf8', fontSize: compact ? '0.8rem' : '0.85rem', margin: '0 0 8px', fontWeight: 600 }}>Câu {currentQuestionIndex + 1} / {questions.length}</p>
          <p style={{ color: '#e2e8f0', fontSize: compact ? '1rem' : '1.1rem', marginBottom: '20px', textAlign: 'center' }}>{currentQ.question}</p>
          {quizWrongCount >= 1 && currentQ.hint && (
            <p style={{ color: '#a5b4fc', fontSize: '0.88rem', margin: '0 0 16px', padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)' }}>💡 Gợi ý: {currentQ.hint}</p>
          )}

          {qType === 'mcq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px' }}>
              {currentQ.options?.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Chọn đáp án ${String.fromCharCode(65 + i)}: ${opt}`}
                  onClick={() => handleMcqAnswer(i)}
                  style={{ padding: compact ? '12px 16px' : '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', cursor: 'pointer', textAlign: 'left', fontSize: compact ? '0.95rem' : '1rem', transition: 'all 0.2s', minHeight: '48px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {qType === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="settings-input"
                value={textQuizInput}
                onChange={e => setTextQuizInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTextQuizSubmit(); }}
                placeholder="Nhập đáp án của bạn..."
                aria-label="Ô nhập đáp án kiểm tra"
                autoComplete="off"
                style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', fontSize: '1rem' }}
              />
              <button type="button" onClick={handleTextQuizSubmit} style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kiểm tra</button>
            </div>
          )}

          {qType === 'order' && orderPermutation && Array.isArray(currentQ.options) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Kéo thả dòng hoặc dùng ↑ ↓ — thứ tự đúng là nội dung 1 → 2 → 3… như trong video.</p>
              {orderPermutation.map((optIdx, pos) => (
                <div
                  key={`${optIdx}-${pos}`}
                  draggable
                  onDragStart={() => setOrderDragFrom(pos)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (orderDragFrom !== null) moveOrderSlot(orderDragFrom, pos);
                    setOrderDragFrom(null);
                  }}
                  style={{ display: 'flex', alignItems: 'stretch', gap: '10px' }}
                >
                  <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '10px', color: '#e2e8f0', cursor: 'grab', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    {currentQ.options[optIdx]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                    <button type="button" onClick={() => pos > 0 && moveOrderSlot(pos, pos - 1)} disabled={pos === 0} style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: pos === 0 ? 'not-allowed' : 'pointer', opacity: pos === 0 ? 0.35 : 1 }}>↑</button>
                    <button type="button" onClick={() => pos < orderPermutation.length - 1 && moveOrderSlot(pos, pos + 1)} disabled={pos >= orderPermutation.length - 1} style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', cursor: pos >= orderPermutation.length - 1 ? 'not-allowed' : 'pointer', opacity: pos >= orderPermutation.length - 1 ? 0.35 : 1 }}>↓</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleOrderQuizSubmit} style={{ padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}>Kiểm tra thứ tự</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleUnlockCourse = async () => {
    const cost = 50;
    const u = JSON.parse(localStorage.getItem('giasu_user'));
    if (!u) { Swal.fire("Yêu cầu", "Bạn cần đăng nhập để mở khóa.", "info"); navigate('/'); return; }
    const confirm = await Swal.fire({
      title: '🔓 Mở Khóa Toàn Bộ Giáo Trình',
      html: `<p style="color:#94a3b8;line-height:1.7;margin:0">Thanh toán <strong style="color:#f59e0b;font-size:1.2em">${cost} Xu</strong> một lần duy nhất để mở vĩnh viễn tất cả <strong style="color:#e2e8f0">${lesson.steps.length} module</strong> trong khóa học này!</p>`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: '🔓 Mở Khóa Ngay', cancelButtonText: 'Để Sau', confirmButtonColor: '#10b981',
    });
    if (confirm.isConfirmed) {
      Swal.showLoading();
      try {
        const res = await fetch('/api/courses/unlock', { method: 'POST', headers: studentJsonAuthHeaders(), body: JSON.stringify({ userId: u._id, courseId: lesson.id, cost }) });
        const d = await res.json();
        if (d.success) {
          Swal.fire("🎉 Thành công!", "Toàn bộ giáo trình đã mở khóa vĩnh viễn!", "success");
          if (!d.unlocked) deductCredits(cost);
          setIsUnlocked(true);
          localStorage.setItem('giasu_user', JSON.stringify({ ...u, unlockedCourses: d.unlockedCourses, coins: d.coins }));
        } else {
          Swal.fire("Lỗi", d.message, "error");
          if (d.message.includes('không đủ')) navigate('/deposit');
        }
      } catch { Swal.fire("Lỗi", "Không thể kết nối máy chủ", "error"); }
    }
  };

  const TABS = [
    { id: 'theory', icon: <BookOpen size={16}/>, label: 'Lý Thuyết' },
    { id: 'video',  icon: <Play size={16}/>,     label: 'AI Hướng Dẫn' },
    { id: 'practice', icon: <PenTool size={16}/>, label: 'Thực Hành' },
    { id: 'transcript', icon: <FileText size={16}/>, label: 'Phụ đề' },
  ];

  const transcriptLines = (step.transcript || '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  const transcriptFiltered = transcriptQuery.trim()
    ? transcriptLines.filter(l => l.toLowerCase().includes(transcriptQuery.trim().toLowerCase()))
    : transcriptLines;

  return (
    <div className="lesson-detail-page" style={{ minHeight: '100vh', background: 'var(--bg-primary, #0a0a1a)' }}>
      <Navbar />

      {/* ── STICKY LESSON HEADER ─────────────────────────────── */}
      <div style={{ position: 'sticky', top: '64px', zIndex: 50, background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '14px 0' }}>
          {/* Back */}
          <Link to="/lessons" aria-label="Trở về danh sách khóa học" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={16}/> Trở Về
          </Link>

          <button
            type="button"
            className="lesson-toc-toggle"
            aria-expanded={sidebarOpen}
            aria-controls="lesson-toc-panel"
            onClick={() => setSidebarOpen(o => !o)}
            style={{ display: 'none', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(99,102,241,0.12)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}
          >
            <Menu size={18} /> Mục lục
          </button>

          {/* Title + Progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: lesson.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{lesson.category}</span>
              <span style={{ color: '#334155', fontSize: '0.75rem' }}>›</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${lesson.color}, ${lesson.color}88)`, transition: 'width 0.4s ease', borderRadius: '4px' }}></div>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                {currentStep + 1} / {lesson.steps.length} module
              </span>
            </div>
          </div>

          {/* Action buttons (Unlock or Cert) */}
          {progressData?.isCompleted ? (() => {
            const isSubmitted = !!examState; // đã từng nộp bài
            const isGrading = examState?.status === 'grading';
            const isPassed = examState?.status === 'graded' && examState?.isPassed;
            const isFailedBlocked = examState?.status === 'graded' && !examState?.isPassed && examState?.nextRetakeAllowedAt && new Date() < new Date(examState.nextRetakeAllowedAt);
            const canRetake = examState?.status === 'graded' && !examState?.isPassed && (!examState?.nextRetakeAllowedAt || new Date() >= new Date(examState.nextRetakeAllowedAt));

            // Đã nộp bài & đang chờ chấm → mờ, không bấm được
            if (isGrading) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#475569', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, cursor: 'not-allowed', opacity: 0.7 }}>
                  <CheckCircle size={14} color="#475569" /> Đã Hoàn Thành
                </div>
              );
            }

            let btnLabel = 'Bài Thi Cuối Khóa';
            let btnIcon = <Award size={14}/>;
            let bgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
            let isDisabled = false;
            
            if (isPassed) {
              btnLabel = 'Chứng Chỉ';
              btnIcon = <Trophy size={14}/>;
              bgColor = 'linear-gradient(135deg, #10b981, #059669)';
            } else if (isFailedBlocked) {
              btnLabel = retakeCountdown || 'Đang tính...';
              btnIcon = <Clock size={14} color="#ef4444" />;
              bgColor = 'rgba(239,68,68,0.08)';
              isDisabled = true;
            } else if (canRetake) {
              btnLabel = 'Thi Lại Cuối Khóa';
              btnIcon = <Award size={14}/>;
              bgColor = 'linear-gradient(135deg, #f97316, #ea580c)';
            }

            return (
            <button onClick={() => {
              if (isDisabled) return;
              if (isPassed) setShowCert(true);
              else if (!examState) checkAndShowExamPopup(lesson.id);
              else navigate('/exam/' + lesson.id); 
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: bgColor, border: isDisabled ? '1px solid rgba(255,255,255,0.2)' : 'none', borderRadius: '10px', color: isDisabled ? '#94a3b8' : '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: isDisabled ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
              {btnIcon} {btnLabel}
            </button>
            );
          })() : isUnlocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
              <CheckCircle size={14}/> Đã mở khóa
            </div>
          ) : (
            <button onClick={handleUnlockCourse} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Lock size={14}/> Mở Khóa (50 xu)
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN LAYOUT ───────────────────────────────────────── */}
      <div className="container lesson-detail-main-wrap" style={{ display: 'flex', gap: '32px', padding: '32px 0 80px', alignItems: 'flex-start', position: 'relative' }}>

        {checking ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '80px 0', color: '#475569' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px' }}>Đang xác thực quyền truy cập...</p>
          </div>
        ) : (
          <>
            {sidebarOpen && (
              <button type="button" className="lesson-toc-backdrop" aria-label="Đóng mục lục" onClick={() => setSidebarOpen(false)} />
            )}
            {/* ── SIDEBAR ──────────────────────────────────────── */}
            <aside id="lesson-toc-panel" className={`lesson-detail-toc ${sidebarOpen ? 'lesson-detail-toc--open' : ''}`} style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '130px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', zIndex: 40 }}>
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b' }}>Nội Dung Khóa Học</h4>
                </div>
                <div style={{ padding: '8px' }}>
                  {lesson.steps.map((s, i) => {
                    const isStepLocked = !isUnlocked && i > 0;
                    const isActive = i === currentStep;
                    const isDone = progressData?.completedSteps?.includes(i);
                    return (
                      <button key={i} type="button" onClick={() => { setCurrentStep(i); setSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px', background: isActive ? `${lesson.color}18` : 'transparent', border: `1px solid ${isActive ? `${lesson.color}40` : 'transparent'}`, borderRadius: '10px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '4px', minHeight: '48px' }}>
                        {/* Icon */}
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: isDone ? 'rgba(16,185,129,0.2)' : isActive ? lesson.color : isStepLocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, border: isDone && isActive ? '1px solid rgba(16,185,129,0.4)' : 'none' }}>
                          {isDone ? <CheckCircle size={14} color="#10b981"/> : isStepLocked ? <Lock size={12} color="#475569"/> : <span style={{ color: isActive ? '#fff' : '#64748b' }}>{i + 1}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 400, color: isActive ? '#f1f5f9' : isStepLocked ? '#334155' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                          {i === 0 && !isUnlocked && <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>✓ Miễn phí</div>}
                        </div>
                        {isActive && <ChevronRight size={14} color={lesson.color}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── CONTENT AREA ─────────────────────────────────── */}
            <main style={{ flex: 1, minWidth: 0 }}>

              {/* Module title */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ padding: '4px 10px', background: `${lesson.color}20`, border: `1px solid ${lesson.color}40`, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: lesson.color }}>
                    Module {currentStep + 1}
                  </div>
                  {!isCurrentStepFree && <div style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={11}/> Yêu cầu mở khóa</div>}
                  {currentStep === 0 && <div style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>Miễn phí</div>}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>{step.title}</h2>
                {Array.isArray(step.learningObjectives) && step.learningObjectives.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '16px 18px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Mục tiêu sau module này</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.65 }}>
                      {step.learningObjectives.map((obj, oi) => (
                        <li key={oi}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ── JUST COMPLETED BANNER ── */}
              {justCompleted && (
                <div className="animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Trophy size={32} color="#10b981" />
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1rem' }}>Tuyệt vời! Bạn đã hoàn thành khóa học!</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>Chứng chỉ của bạn đã được cấp. Nhấn nút "Chứng Chỉ" phía trên để xem và tải về.</div>
                  </div>
                </div>
              )}

              {/* ── VIDEO PLAYER (luôn hiển thị, blur nếu khóa) ── */}
              <div style={{ position: 'relative', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ filter: isCurrentStepFree ? 'none' : 'blur(8px)', transition: 'filter 0.3s' }}>
                  {isCurrentStepFree ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                      <ReactPlayer
                        ref={playerRef}
                        src={step.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                        playing={Boolean(isCurrentStepFree && videoPlaying && !activeCheckpoint)}
                        controls={!activeCheckpoint}
                        playbackRate={playbackRate}
                        onTimeUpdate={(e) => {
                          const playedSeconds = e?.currentTarget?.currentTime ?? 0;
                          handlePlayerProgress({ playedSeconds });
                        }}
                        onEnded={() => markStepDone(currentStep)}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                        config={{ youtube: { playerVars: { cc_load_policy: 1 } } }}
                      />
                    </div>
                  ) : (
                    /* Module bị khóa: thumbnail mờ */
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: `linear-gradient(135deg, #0f172a 0%, ${lesson.color}15 100%)` }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{ width: '64px', height: '64px', background: `${lesson.color}20`, border: `2px solid ${lesson.color}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={24} color={lesson.color} fill={lesson.color}/>
                        </div>
                        <p style={{ color: '#475569', margin: 0, fontSize: '0.9rem' }}>Video Hướng Dẫn AI Avatar</p>
                      </div>
                    </div>
                  )}
                </div>

                {isCurrentStepFree && (
                  <div className="lesson-video-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '12px 14px', background: 'rgba(15,23,42,0.94)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {(step.chapters || []).filter(ch => ch && (ch.title || ch.timeInSeconds != null)).length > 0 && (
                      <>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}><ListVideo size={14} aria-hidden /> Chương</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                          {(step.chapters || []).filter(ch => ch && (ch.title || ch.timeInSeconds != null)).map((ch, chi) => (
                            <button
                              key={chi}
                              type="button"
                              onClick={() => seekToSeconds(ch.timeInSeconds)}
                              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}
                              aria-label={`Nhảy tới ${ch.title || 'mốc'} lúc ${formatVideoTime(ch.timeInSeconds)}`}
                            >
                              {formatVideoTime(ch.timeInSeconds)}{ch.title ? ` · ${ch.title}` : ''}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#94a3b8', marginLeft: (step.chapters || []).length ? 'auto' : 0 }}>
                      Tốc độ
                      <select value={playbackRate} onChange={e => setPlaybackRate(Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }} aria-label="Tốc độ phát video">
                        {[0.75, 1, 1.25, 1.5].map(r => (
                          <option key={r} value={r}>{r}x</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {/* Overlay khóa đè lên video */}
                {!isCurrentStepFree && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,20,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                      <Lock size={24}/>
                    </div>
                    <p style={{ color: '#e2e8f0', margin: 0, fontWeight: 700, fontSize: '1rem' }}>Module này đang bị khóa</p>
                    <button onClick={handleUnlockCourse} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', padding: '10px 28px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                      🔓 Mở Khóa Toàn Bộ (50 Xu)
                    </button>
                  </div>
                )}

                {renderCheckpointPanel(false)}
              </div>

              {/* ── TABS ─────────────────────────────────────────── */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '28px', gap: '4px' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === t.id ? lesson.color : 'transparent'}`, color: activeTab === t.id ? lesson.color : '#64748b', fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* ── NỘI DUNG TAB = wrapper blur nếu khóa ─────────── */}
              <div style={{ position: 'relative' }}>
                <div style={{ filter: isCurrentStepFree ? 'none' : 'blur(5px)', userSelect: isCurrentStepFree ? 'auto' : 'none', pointerEvents: isCurrentStepFree ? 'auto' : 'none', transition: 'filter 0.3s' }}>

                  {/* TAB: LÝ THUYẾT */}
                  {activeTab === 'theory' && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: '0', overflow: 'hidden' }}>
                      {/* AI badge header (Clickable Accordion) */}
                      <div 
                        onClick={() => setIsTheoryExpanded(!isTheoryExpanded)}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                        style={{ padding: '16px 28px', borderBottom: isTheoryExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none', background: 'rgba(99,102,241,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }}></div>
                          <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.5px' }}>AI LESSON • NỘI DUNG LÝ THUYẾT</span>
                        </div>
                        {isTheoryExpanded ? <ChevronUp size={16} color="#818cf8" /> : <ChevronDown size={16} color="#818cf8" />}
                      </div>

                      {/* Expandable Content */}
                      {isTheoryExpanded && (
                        <div className="animate-fade-in-up">
                          <div className="markdown-body" style={{ padding: '32px 28px', lineHeight: 1.8, color: '#cbd5e1', fontSize: '1rem' }} dangerouslySetInnerHTML={createMarkup(step.content)}></div>

                          {Array.isArray(step.summaryBullets) && step.summaryBullets.length > 0 && (
                            <div style={{ margin: '0 28px 24px', padding: '18px 20px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '12px' }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Ôn nhanh — tóm tắt module</div>
                              <ul style={{ margin: 0, paddingLeft: '20px', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.65 }}>
                                {step.summaryBullets.map((b, bi) => (
                                  <li key={bi}>{b}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tip box */}
                          {step.tip && (
                            <div style={{ margin: '0 28px 28px', padding: '16px 20px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderLeft: `4px solid #6366f1`, borderRadius: '0 8px 8px 0' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💡 Mẹo AI</div>
                              <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>{step.tip}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: VIDEO */}
                  {activeTab === 'video' && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Play size={20} color={lesson.color}/>
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700 }}>Video Hướng Dẫn Thực Hành</h3>
                      </div>
                      <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '0.9rem' }}>AI Avatar dẫn dắt từng thao tác trực quan — phong cách học 1 kèm 1.</p>
                      {isCurrentStepFree ? (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>☝️ Video hướng dẫn chi tiết đang được chiếu ở khung hình phía trên.</p>
                          
                          {renderCheckpointPanel(true)}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <Lock size={32} color="#475569" style={{ marginBottom: '12px' }}/>
                          <p style={{ color: '#64748b', margin: 0 }}>Mở khóa toàn bộ giáo trình để xem video hướng dẫn</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: PHỤ ĐỀ / TRANSCRIPT */}
                  {activeTab === 'transcript' && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <FileText size={20} color={lesson.color} aria-hidden />
                        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700 }}>Phụ đề & tìm trong bài</h3>
                      </div>
                      <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: '0.88rem', lineHeight: 1.6 }}>Tìm nhanh đoạn giảng viên đã soạn (plain text). Nếu chưa có nội dung, hãy báo để đội ngũ bổ sung transcript.</p>
                      <input
                        className="settings-input"
                        value={transcriptQuery}
                        onChange={e => setTranscriptQuery(e.target.value)}
                        placeholder="Gõ từ khóa để lọc dòng…"
                        aria-label="Tìm trong phụ đề"
                        style={{ width: '100%', maxWidth: '420px', padding: '12px 14px', borderRadius: '12px', marginBottom: '18px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                      />
                      {transcriptLines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 20px', color: '#475569', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                          Chưa có transcript cho module này.
                        </div>
                      ) : (
                        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                          {transcriptFiltered.length === 0 ? (
                            <p style={{ color: '#64748b', padding: '20px', margin: 0 }}>Không có dòng nào khớp “{transcriptQuery}”.</p>
                          ) : (
                            transcriptFiltered.map((line, li) => (
                              <p key={li} style={{ margin: 0, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: '0.92rem', lineHeight: 1.55 }}>{line}</p>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: THỰC HÀNH */}
                  {activeTab === 'practice' && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: '0', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(16,185,129,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, letterSpacing: '0.5px' }}>NHIỆM VỤ THỰC HÀNH</span>
                      </div>
                      {step.exercise ? (
                        <div style={{ padding: '28px' }}>
                          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '24px' }}>
                            <p style={{ color: '#a7f3d0', fontWeight: 700, margin: '0 0 12px', fontSize: '0.95rem' }}>📌 Yêu cầu thực hành:</p>
                            <p style={{ color: '#e2e8f0', margin: 0, fontSize: '1rem', lineHeight: 1.7 }}>{step.exercise}</p>
                          </div>
                          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>💬 Sau khi hoàn thành thực hành, bấm <strong style={{color: '#94a3b8'}}>"Bài tiếp theo"</strong> để tiếp tục lộ trình học của bạn.</p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '48px 28px', textAlign: 'center', color: '#475569' }}>
                          <PenTool size={36} style={{ marginBottom: '12px', opacity: 0.4 }}/>
                          <p>Module này không có bài thực hành. Tiến thẳng sang bài tiếp theo!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Overlay khóa đè lên tabs */}
                {!isCurrentStepFree && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,20,0.8)', backdropFilter: 'blur(4px)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '16px' }}>
                    <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                      <Lock size={28}/>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 800 }}>Module {currentStep + 1} bị khóa</h3>
                      <p style={{ color: '#64748b', margin: 0, maxWidth: '320px', lineHeight: 1.6 }}>
                        Mở khóa <strong style={{ color: '#f59e0b' }}>một lần vĩnh viễn</strong> để truy cập toàn bộ {lesson.steps.length} module.
                      </p>
                    </div>
                    <button onClick={handleUnlockCourse} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', padding: '14px 36px', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 8px 30px rgba(16,185,129,0.35)', transition: 'transform 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      🔓 Mở Khóa Toàn Bộ Chỉ 50 Xu
                    </button>
                  </div>
                )}
              </div>

              {/* ── NAVIGATION ───────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handlePrev} disabled={isFirstStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', fontWeight: 600, cursor: isFirstStep ? 'not-allowed' : 'pointer', opacity: isFirstStep ? 0 : 1, transition: 'all 0.2s', fontSize: '0.9rem', flex: 1, maxWidth: '200px' }}>
                  <ArrowLeft size={16}/> Bài trước
                </button>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {!progressData?.completedSteps?.includes(currentStep) ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: '12px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                      ▶ Hãy xem hết video để tính hoàn thành
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                      <CheckCircle size={18} /> Đã hoàn thành
                    </div>
                  )}
                </div>

                <button onClick={() => { if(isLastStep && !progressData?.isCompleted) markStepDone(currentStep); else handleNext() }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: isLastStep ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${lesson.color}, ${lesson.color}bb)`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: `0 4px 20px ${lesson.color}40`, flex: 1, maxWidth: '200px' }}>
                  {isLastStep ? '🎓 Hoàn Thành' : <>Bài tiếp theo <ChevronRight size={16}/></>}
                </button>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.55, textAlign: 'center' }}>
                Module được ghi nhận hoàn thành khi video phát đến cuối. Các điểm dừng kiểm tra giúp bạn nhớ bài lâu hơn — nếu chưa đúng, hệ thống vẫn khuyến khích bạn xem tiếp.
              </p>

            </main>
          </>
        )}
      </div>

      {showCert && (progressData?.isCompleted || examState?.isPassed) && (
        <CertificateModal
          cert={progressData || {}}
          examState={examState}
          courseTitle={lesson.title}
          studentName={user.name || 'Học Viên'}
          onClose={() => setShowCert(false)}
        />
      )}
    </div>
  )
}
