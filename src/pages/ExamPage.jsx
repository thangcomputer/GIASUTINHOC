import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LESSONS } from '../data/lessons';
import Swal from 'sweetalert2';
import { CheckCircle, Clock, XCircle, FileText, Timer, UploadCloud, Loader2 } from 'lucide-react';
import Confetti from 'react-confetti';

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [essayFile, setEssayFile] = useState(null);

  const [phase, setPhase] = useState('quiz');
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [examState, setExamState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(270); // 4m30s default

  const fileInputRef = useRef(null);

  // ─── Chặn F5 ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'F5') || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
        if (phase === 'quiz' || phase === 'essay') {
          e.preventDefault();
          Swal.fire({ title: 'Cảnh Báo Khảo Thí', text: 'Bạn đang làm bài thi. Tải lại trang có thể mất dữ liệu!', icon: 'warning', confirmButtonColor: '#3b82f6', confirmButtonText: 'Đã Hiểu' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase]);

  // ─── Timer countdown ───
  useEffect(() => {
    let timer;
    if (phase === 'quiz' && questions.length > 0 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (phase === 'quiz' && timeLeft === 0 && questions.length > 0) {
      Swal.fire({ title: 'Hết Thời Gian!', text: 'Bài trắc nghiệm kết thúc tự động.', icon: 'warning' });
      setPhase('essay');
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft, questions.length]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ─── Hủy bài thi ───
  const handleCancelExam = () => {
    Swal.fire({
      title: 'Hủy Bài Thi?',
      text: 'Điểm sẽ ghi nhận là 0 và bạn sẽ rớt lập tức!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Chấp Nhận Hủy',
      cancelButtonText: 'Làm Tiếp'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(`giasu_exam_progress_${user?._id}_${id}`);
        fetch('/api/exams/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user._id, courseId: id, quizScore: 0, essayAnswer: '', essayFileUrl: '', essayFileName: '', isFailedFast: true })
        }).then(r => r.json()).then(d => {
          if (d.success) setExamState(d.data);
          setPhase('failed');
        });
      }
    });
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('giasu_user'));
    if (!u) { navigate('/login'); return; }
    setUser(u);

    const progressKey = `giasu_exam_progress_${u._id}_${id}`;
    const wasInProgress = localStorage.getItem(progressKey);

    const checkAndFetchData = async () => {
      if (wasInProgress) {
        localStorage.removeItem(progressKey);
        Swal.fire({
          title: 'Cảnh Báo',
          text: 'Hệ thống phát hiện bạn đã tải lại trang hoặc thoát bài thi đột ngột. Bài thi đã bị hủy và đánh rớt!',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        
        try {
          const r = await fetch('/api/exams/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: u._id, courseId: id, quizScore: 0, essayAnswer: 'Học viên bỏ thi / tải lại trang', essayFileUrl: '', essayFileName: '', isFailedFast: true })
          });
          const d = await r.json();
          if (d.success) setExamState(d.data);
          setPhase('failed');
        } catch (e) { console.error(e); }
      } else {
        try {
          const r = await fetch(`/api/exams/${u._id}/${id}`);
          const d = await r.json();
          if (d.success && d.data) {
            setExamState(d.data);
            if (d.data.status === 'grading') {
              setPhase('submitted');
            } else if (d.data.status === 'graded') {
              setPhase(d.data.isPassed ? 'passed' : 'failed');
              setQuizScore(d.data.quizScore || 0);
            } else {
              localStorage.setItem(progressKey, 'true');
            }
          } else {
            localStorage.setItem(progressKey, 'true');
          }
        } catch (e) {
          localStorage.setItem(progressKey, 'true');
        }
      }

      const c = LESSONS.find(l => l.id === id);
      if (!c) { navigate('/lessons'); return; }
      setCourse(c);

      let allQs = [];
      c.steps?.forEach(s => {
        if (s.quizCheckpoints) {
          s.quizCheckpoints.forEach(cp => {
            if (cp.questions) allQs = [...allQs, ...cp.questions];
          });
        }
      });
      if (allQs.length < 3) {
        allQs = [
          { question: "Điều kiện cần thiết để qua môn học này là gì?", options: ["Học ngẫu nhiên", "Hoàn thành 100% video và bài tập", "Không cần làm gì"], correctIndex: 1 },
          { question: "Môn học tập trung vào kỹ năng nào nhất?", options: ["Sử dụng phần mềm", "Lập trình", "Tư duy căn bản"], correctIndex: 0 },
          { question: "Nếu gặp sự cố kỹ thuật, bạn sẽ làm gì?", options: ["Liên hệ giảng viên", "Bỏ qua", "Tự sửa mainboard"], correctIndex: 0 }
        ];
      }
      const finalQs = allQs.slice(0, 5);
      setQuestions(finalQs);
      setTimeLeft(finalQs.length * 90);
    };

    checkAndFetchData();
  }, [id, navigate]);

  const handleQuizAnswer = (i) => {
    let newScore = quizScore;
    if (i === questions[currentQuiz].correctIndex) {
      newScore = quizScore + 1;
      setQuizScore(newScore);
    }
    if (currentQuiz < questions.length - 1) {
      setCurrentQuiz(p => p + 1);
    } else {
      const passed = newScore >= Math.ceil(questions.length * 0.5);
      if (!passed) {
        localStorage.removeItem(`giasu_exam_progress_${user?._id}_${id}`);
        Swal.fire({ title: 'Chưa Đủ Điểm Trắc Nghiệm', html: `Bạn chỉ đạt <b>${newScore}/${questions.length}</b> câu. Bạn đã bị rớt phần Trắc nghiệm.`, icon: 'error', confirmButtonColor: '#ef4444' });
        fetch('/api/exams/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: user._id, courseId: id, quizScore: Math.round((newScore / questions.length) * 10), essayAnswer: '', essayFileUrl: '', essayFileName: '', isFailedFast: true }) })
          .then(r => r.json())
          .then(d => {
            if (d.success) setExamState(d.data);
            setPhase('failed');
          });
      } else {
        Swal.fire({ title: 'Chúc Mừng!', text: `Đạt phần Trắc nghiệm (${newScore}/${questions.length}). Tiếp tục làm Tự Luận.`, icon: 'success', confirmButtonColor: '#10b981' });
        setPhase('essay');
      }
    }
  };

  const submitExam = async () => {
    if (!essayAnswer.trim() && !essayFile) {
      Swal.fire('Thiếu dữ liệu', 'Hãy điền bài luận hoặc đính kèm file!', 'warning');
      return;
    }
    setIsSubmitting(true);
    let fileUrl = '', fileName = '';
    if (essayFile) {
      fileName = essayFile.name;
      const reader = new FileReader();
      reader.readAsDataURL(essayFile);
      reader.onload = () => {
        fileUrl = reader.result;
        doSubmit(fileUrl, fileName);
      };
      return;
    }
    doSubmit('', '');
  };

  const doSubmit = async (fileUrl, fileName) => {
    try {
      localStorage.removeItem(`giasu_exam_progress_${user?._id}_${id}`);
      const res = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user._id, courseId: id, quizScore: Math.round((quizScore / questions.length) * 10), essayAnswer, essayFileUrl: fileUrl, essayFileName: fileName, isFailedFast: false })
      });
      const d = await res.json();
      if (d.success) {
        setPhase('submitted');
        Swal.fire('Nộp Bài Thành Công', 'Bài thi đã gửi cho Giảng viên chấm điểm.', 'success');
      } else {
        Swal.fire('Lỗi', d.message, 'error');
      }
    } catch {
      Swal.fire('Lỗi', 'Mất kết nối mạng.', 'error');
    }
    setIsSubmitting(false);
  };

  if (!course) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <Loader2 style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} size={48} />
    </div>
  );

  const progressPercent = phase === 'quiz' ? Math.round((currentQuiz / questions.length) * 100) : 100;
  const timerWarning = timeLeft <= 60;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', paddingTop: '60px', paddingBottom: '80px', color: '#f1f5f9' }}>
      {phase === 'passed' && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} />}

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            HỆ THỐNG THI CUỐI KHÓA
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>Môn: <strong style={{ color: '#fff' }}>{course.title}</strong></p>
        </div>

        {/* ── TABS TIẾN TRÌNH ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', background: phase === 'quiz' ? 'rgba(56,189,248,0.15)' : phase === 'essay' || phase === 'submitted' || phase === 'passed' || phase === 'failed' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${phase === 'quiz' ? 'rgba(56,189,248,0.4)' : 'rgba(16,185,129,0.3)'}`, color: phase === 'quiz' ? '#38bdf8' : '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle size={16} /> 1. Trắc Nghiệm Tư Duy
          </div>
          <div style={{ color: '#475569', fontSize: '1.2rem' }}>→</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', background: phase === 'essay' ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${phase === 'essay' ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`, color: phase === 'essay' ? '#818cf8' : '#475569', fontWeight: 600, fontSize: '0.9rem', opacity: phase === 'quiz' ? 0.5 : 1 }}>
            <FileText size={16} /> 2. Tự Luận & Thực Hành
          </div>
        </div>

        {/* ── PHASE: QUIZ ── */}
        {phase === 'quiz' && questions.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)' }}>
            {/* Header thanh tiến trình */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Tỷ Lệ Hoàn Thành: {progressPercent}%</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>CÂU {currentQuiz + 1} / {questions.length}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Thời gian còn lại</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: timerWarning ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Timer size={20} color={timerWarning ? '#ef4444' : '#f59e0b'} /> {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '28px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>

            {/* Câu hỏi */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
              <p style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>{questions[currentQuiz].question}</p>
            </div>

            {/* Đáp án */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions[currentQuiz].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuizAnswer(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.12)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <span style={{ minWidth: '32px', height: '32px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.85rem', marginTop: '20px', marginBottom: 0 }}>
              Lưu ý: Nếu không đạt tối thiểu {Math.ceil(questions.length * 0.5)}/{questions.length} câu, bạn sẽ bị RỚT ngay lập tức.
            </p>

            {/* NÚT HỦY BỎ - nằm dưới card, tách biệt khỏi header */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <button
                onClick={handleCancelExam}
                style={{ padding: '8px 20px', background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.7)', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
              >
                <XCircle size={15} /> Hủy bỏ bài thi
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE: ESSAY ── */}
        {phase === 'essay' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 8px', color: '#818cf8', fontSize: '1.2rem' }}>✍️ Phần 2: Tự Luận & Thực Hành</h3>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.95rem' }}>Hãy tóm tắt những kiến thức cốt lõi bạn học được, hoặc dán link/đoạn code bài thực hành vào đây.</p>

            <textarea
              value={essayAnswer}
              onChange={e => setEssayAnswer(e.target.value)}
              placeholder="Nhập câu trả lời của bạn..."
              style={{ width: '100%', height: '200px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
            />

            {/* Upload file */}
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".doc,.docx,.xls,.xlsx,.pdf,.zip" onChange={e => setEssayFile(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <UploadCloud size={18} /> {essayFile ? essayFile.name : 'Đính kèm File (Word/Excel/PDF)'}
              </button>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Nút hủy - góc trái, nhỏ và ít nổi bật */}
              <button
                onClick={handleCancelExam}
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.7)', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
              >
                <XCircle size={14} /> Hủy bỏ
              </button>

              <button
                onClick={submitExam}
                disabled={isSubmitting}
                style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                {isSubmitting ? 'Đang nộp...' : '📤 Nộp Bài Thi'}
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE: SUBMITTED ── */}
        {phase === 'submitted' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '50px 30px', textAlign: 'center' }}>
            <Clock size={64} color="#f59e0b" style={{ marginBottom: '20px' }} />
            <h2 style={{ color: '#f59e0b', fontSize: '1.8rem', margin: '0 0 16px' }}>Đang chờ chấm điểm!</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '0 0 24px', lineHeight: 1.6 }}>
              Bài trắc nghiệm: <strong style={{ color: '#fff' }}>{examState?.quizScore || Math.round((quizScore / questions.length) * 10)}/10 điểm</strong>.<br />
              Phần Tự luận đang được giảng viên xem xét. Vui lòng quay lại sau!
            </p>
            <button onClick={() => navigate('/lessons/' + id)} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
              Quay lại bài học
            </button>
          </div>
        )}

        {/* ── PHASE: PASSED ── */}
        {phase === 'passed' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '50px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏆</div>
            <h2 style={{ color: '#10b981', fontSize: '2.5rem', margin: '0 0 16px', fontWeight: 900 }}>XUẤT SẮC!</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem', margin: '0 0 10px' }}>Trắc nghiệm: <strong style={{ color: '#fff' }}>{examState?.quizScore}/10</strong></p>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem', margin: '0 0 24px' }}>Tự luận: <strong style={{ color: '#fff' }}>{examState?.essayScore}/10</strong></p>
            <h3 style={{ color: '#f59e0b', fontSize: '1.4rem', margin: '0 0 32px' }}>Nhận Xét: "{examState?.teacherFeedback}"</h3>
            <button onClick={() => navigate('/lessons/' + id)} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '1.1rem' }}>
              Nhận Chứng Chỉ 🎓
            </button>
          </div>
        )}

        {/* ── PHASE: FAILED ── */}
        {phase === 'failed' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '20px', padding: '50px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>💪</div>
            <h2 style={{ color: '#f97316', fontSize: '2rem', margin: '0 0 8px' }}>THI LẠI</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 20px' }}>Cố lên! Lần sau chắc chắn sẽ vượt qua 🔥</p>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '0 0 10px' }}>
              Trắc nghiệm: <strong style={{ color: '#fff' }}>{examState?.quizScore ?? Math.round((quizScore / questions.length) * 10)}/10</strong>
            </p>
            {examState && examState.essayScore !== undefined && (
              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '0 0 10px' }}>
                Tự luận: <strong style={{ color: '#fff' }}>{examState.essayScore}/10</strong>
              </p>
            )}

            {examState?.teacherFeedback && (() => {
              const cleanFeedback = examState.teacherFeedback
                .split('\n')
                .filter(line => !line.includes('[ADMIN_SYSTEM]'))
                .join('\n')
                .trim();
              return cleanFeedback ? (
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', padding: '16px', borderRadius: '10px', display: 'inline-block', marginBottom: '30px' }}>
                <p style={{ color: '#fdba74', margin: 0 }}>💬 Lời khuyên: {cleanFeedback}</p>
              </div>
              ) : null;
            })()}
            <br />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!examState?.nextRetakeAllowedAt || new Date() > new Date(examState.nextRetakeAllowedAt) ? (
                <button onClick={() => { 
                  localStorage.setItem(`giasu_exam_progress_${user?._id}_${id}`, 'true');
                  setPhase('quiz'); setCurrentQuiz(0); setQuizScore(0); setEssayAnswer(''); setEssayFile(null); 
                }} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  🔄 Thi Lại Ngay
                </button>
              ) : (
                <button disabled style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', color: '#94a3b8', fontWeight: 700, cursor: 'not-allowed' }}>
                  🕐 Thi lại sau: {new Date(examState.nextRetakeAllowedAt).toLocaleString('vi-VN')}
                </button>
              )}
              <button onClick={() => navigate('/lessons/' + id)} style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                ← Quay Về Bài Học
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
