const fs = require('fs');

const examPageJSX = `import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LESSONS } from '../data/lessons';
import Swal from 'sweetalert2';
import { CheckCircle, Clock, UploadCloud, XCircle, ArrowRight, Award, FileText, File as FileIcon, Loader2, Timer } from 'lucide-react';
import Confetti from 'react-confetti';

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [examConfig, setExamConfig] = useState(null); 
  
  const [quizScore, setQuizScore] = useState(0);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [essayFile, setEssayFile] = useState(null);
  
  const [phase, setPhase] = useState('quiz'); 
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [examState, setExamState] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  
  // Timer for Quiz
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút mặc định
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Xử lý đếm ngược
    let timerId;
    if (phase === 'quiz' && questions.length > 0 && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (phase === 'quiz' && timeLeft === 0 && questions.length > 0) {
      handleTimeUp();
    }
    return () => clearInterval(timerId);
  }, [phase, timeLeft, questions.length]);

  const handleTimeUp = () => {
      const isFailedFast = quizScore < examConfig.quizPassScore;
      if (isFailedFast) {
         Swal.fire({
             title: 'HẾT THỜI GIAN',
             html: \`Bạn chưa làm đủ điểm yêu cầu (Được \${quizScore}/\${questions.length}). Bạn đã bị đánh rớt phần Trắc nghiệm.\`,
             icon: 'error'
         });
         submitExamDirectly(true, Math.round((quizScore / questions.length) * 10), '', '', '');
      } else {
         Swal.fire('Hết Thời Gian Trắc Nghiệm', \`Bạn ĐẠT phần Trắc nghiệm (\${quizScore}/\${questions.length}). Chuyển sang phần Tự Luận.\`, 'info');
         setPhase('essay');
      }
  };

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return \`\${m}:\${s}\`;
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('giasu_user'));
    if (!u) { navigate('/login'); return; }
    setUser(u);

    fetch('/api/exams/course/' + id)
      .then(r => r.json())
      .then(dConfig => {
        const c = LESSONS.find(l => l.id === id);
        if (!c) { navigate('/lessons'); return; }
        setCourse(c);
        
        let conf = dConfig.data || {};
        
        let allQs = conf.questions && conf.questions.length > 0 ? conf.questions : [];
        if (allQs.length === 0) {
          c.steps.forEach(s => {
            if (s.quizCheckpoints) {
              s.quizCheckpoints.forEach(cp => {
                if (cp.questions) allQs = [...allQs, ...cp.questions];
              });
            }
          });
          if (allQs.length < 3) {
            allQs = [
              { question: "Điều kiện cần thiết để qua môn học này là gì?", options: ["Không cần làm gì", "Hoàn thành 100% video và bài tập", "Học ngẫu nhiên"], correctIndex: 1 },
              { question: "Nếu gặp sự cố khó trong bài tập thực hành, bạn nên ưu tiên làm gì đầu tiên?", options: ["Hỏi lại Chatbot AI Gia Sư", "Bỏ qua bài", "Xóa tài khoản"], correctIndex: 0 },
              { question: "Lợi ích cốt lõi của môn học là giúp bạn điều gì?", options: ["Hiểu bản chất", "Thi đậu", "Tất cả các ý trên"], correctIndex: 2 }
            ];
          }
          allQs = allQs.slice(0, 5);
        }
        
        setExamConfig({
           ...conf,
           questions: allQs,
           quizPassScore: conf.quizPassScore || Math.ceil(allQs.length * 0.5),
           essayQuestionTitle: conf.essayQuestionTitle || 'Bài Tập Thực Hành Cuối Khóa',
           essayQuestion: conf.essayQuestion || 'Mô tả chi tiết lại các bước bạn thực hiện, và tải tệp kết quả (nếu có) để giảng viên chấm thi.',
           allowFileUpload: conf.allowFileUpload !== false
        });
        setQuestions(allQs);
        setTimeLeft(allQs.length * 90); // Cho 1 phút 30 giây mỗi câu
        
        return fetch('/api/exams/' + u._id + '/' + id);
      })
      .then(r => r?.json())
      .then(d => {
        if (d?.success && d.data) {
           setExamState(d.data);
           if (d.data.status === 'grading') setPhase('submitted');
           else if (d.data.status === 'graded') {
             setPhase(d.data.isPassed ? 'passed' : 'failed');
             setQuizScore(d.data.quizScore);
           }
        }
      });
  }, [id, navigate]);

  const handleQuizAnswer = async (selectedIdx) => {
    let newScore = quizScore;
    if (selectedIdx === questions[currentQuiz].correctIndex) {
      newScore += 1;
      setQuizScore(newScore);
    }
    
    if (currentQuiz < questions.length - 1) {
      setCurrentQuiz(p => p + 1);
    } else {
      const scaledScore = Math.round((newScore / questions.length) * 10);
      const isFailedFast = newScore < examConfig.quizPassScore;
      
      if (isFailedFast) {
         Swal.fire({
            title: 'Chưa đủ điểm Trắc Nghiệm',
            html: \`Bạn chỉ đạt <b>\${newScore}/\${questions.length}</b> câu (Yêu cầu ít nhất \${examConfig.quizPassScore} câu).<br/>Bạn đã bị đánh rớt và KHÔNG được làm bài Tự luận.\`,
            icon: 'error',
            confirmButtonColor: '#ef4444'
         });
         submitExamDirectly(true, scaledScore, '', '', '');
      } else {
         Swal.fire({
           title: 'Chúc Mừng!',
           text: \`Bạn ĐẠT phần Trắc nghiệm (\${newScore}/\${questions.length}). Hãy bước vào bài thi Tự Luận / Thực hành.\`,
           icon: 'success',
           confirmButtonColor: '#10b981'
         });
         setPhase('essay');
      }
    }
  };

  const submitExamDirectly = async (isFailedFast, overrideQuizScore, overrideEssay, fileUrl, fileName) => {
     setIsSubmitting(true);
     try {
       const res = await fetch('/api/exams/submit', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           studentId: user._id,
           courseId: id,
           quizScore: overrideQuizScore !== undefined ? overrideQuizScore : Math.round((quizScore / questions.length) * 10),
           essayAnswer: overrideEssay !== undefined ? overrideEssay : essayAnswer,
           essayFileUrl: fileUrl, 
           essayFileName: fileName,
           isFailedFast
         })
       });
       const d = await res.json();
       if (d.success) {
         setExamState(d.data); 
         if (isFailedFast) setPhase('failed');
         else setPhase('submitted');
         
         if (!isFailedFast) Swal.fire('Thành Công', 'Bài thi đã gửi cho Giảng viên. Hãy đợi kết quả nhé!', 'success');
       } else {
         Swal.fire('Lỗi', d.message, 'error');
       }
     } catch (e) {
       Swal.fire('Lỗi', 'Mất kết nối.', 'error');
     }
     setIsSubmitting(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { Swal.fire('Lỗi', 'Vui lòng chọn tệp dưới 5MB', 'warning'); return; }
      setEssayFile(file);
      setFilePreview(file.name);
    }
  };

  const submitEssayPhase = async () => {
    if (!essayAnswer.trim() && !essayFile) {
      Swal.fire('Thiếu dữ liệu', 'Hãy điền bài luận hoặc đính kèm file kết quả làm việc!', 'warning');
      return;
    }
    
    let fileUrl = '';
    let fileName = '';
    if (essayFile) {
      fileName = essayFile.name;
      const reader = new FileReader();
      reader.readAsDataURL(essayFile);
      reader.onload = () => {
        fileUrl = reader.result;
        submitExamDirectly(false, undefined, essayAnswer, fileUrl, fileName);
      };
      return;
    }
    
    submitExamDirectly(false, undefined, essayAnswer, '', '');
  };

  if (!course || !examConfig) return (
     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <Loader2 className="animate-spin text-indigo-500" size={48} />
     </div>
  );

  const progressPercent = phase === 'quiz' ? (currentQuiz / questions.length) * 100 : 100;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', paddingTop: '60px', color: '#f1f5f9', paddingBottom: '100px' }}>
      {phase === 'passed' && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}

      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HỆ THỐNG THI CUỐI KHÓA
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: 0 }}>Môn: <strong style={{ color: '#fff' }}>{course.title}</strong></p>
        </div>

        {/* TABS HƯỚNG DẪN TIẾN TRÌNH */}
        {(phase === 'quiz' || phase === 'essay') && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
                <div style={{ 
                    padding: '12px 24px', borderRadius: '30px', 
                    background: phase === 'quiz' ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.1)', 
                    color: phase === 'quiz' ? '#38bdf8' : '#10b981', 
                    border: \`1px solid \${phase === 'quiz' ? 'rgba(56,189,248,0.5)' : 'rgba(16,185,129,0.3)'}\`,
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: phase === 'quiz' ? 1 : 0.6
                }}>
                    <CheckCircle size={18} /> 
                    1. Trắc Nghiệm Tư Duy
                </div>
                
                <div style={{ width: '40px', display: 'flex', alignItems: 'center', color: '#475569' }}>
                    <ArrowRight size={24} />
                </div>

                <div style={{ 
                    padding: '12px 24px', borderRadius: '30px', 
                    background: phase === 'essay' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.02)', 
                    color: phase === 'essay' ? '#10b981' : '#475569', 
                    border: \`1px solid \${phase === 'essay' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.05)'}\`,
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
                }}>
                    <FileIcon size={18} /> 
                    2. Tự Luận & Thực Hành
                </div>
            </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && questions[currentQuiz] && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '0', background: 'linear-gradient(180deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))', borderTop: '4px solid #3b82f6', overflow: 'hidden' }}>
            
            {/* THỜI GIAN & PROGRESS BAR */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
                    <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>Tỷ Lệ Hoàn Thành: {Math.round(progressPercent)}%</div>
                        <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           CÂU {currentQuiz + 1} / {questions.length}
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>Thời gian còn lại</div>
                        <div style={{ 
                            color: timeLeft <= 60 ? '#ef4444' : '#f59e0b', 
                            fontWeight: 800, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' 
                        }}>
                           <Timer size={24} className={timeLeft <= 60 ? "animate-pulse" : ""} />
                           {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: \`\${progressPercent}%\`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', transition: 'width 0.3s ease' }}></div>
                </div>
            </div>

            <div style={{ padding: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <p style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{questions[currentQuiz].question}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions[currentQuiz].options.map((opt, i) => (
                    <button
                    key={i}
                    onClick={() => handleQuizAnswer(i)}
                    style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '16px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; e.currentTarget.style.transform = 'translateX(8px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {String.fromCharCode(65 + i)}
                    </div>
                    {opt}
                    </button>
                ))}
                </div>
                
                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                Lưu ý: Nếu không đạt tối thiểu {examConfig.quizPassScore}/{questions.length} câu, bạn sẽ bị RỚT ngay lập tức.
                </div>
            </div>
          </div>
        )}

        {/* ESSAY PHASE */}
        {phase === 'essay' && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '40px', background: 'linear-gradient(180deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))', borderTop: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 20px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>
              <FileIcon size={24}/> THỰC HÀNH & KỸ NĂNG VÀ CHUYÊN MÔN
            </h3>
            
            <div style={{ background: 'rgba(16,185,129,0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '30px' }}>
               <h4 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: '#34d399' }}>📌 ĐỀ BÀI: {examConfig.essayQuestionTitle}</h4>
               <p style={{ color: '#e2e8f0', margin: 0, fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                 {examConfig.essayQuestion}
               </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#94a3b8' }}>Phần Tự Luận / Trả Lời (Text):</label>
              <textarea
                value={essayAnswer}
                onChange={e => setEssayAnswer(e.target.value)}
                placeholder="Nhập nội dung luận văn, tóm tắt, hoặc paste link Google Drive/Github của bạn vào đây..."
                style={{ width: '100%', height: '160px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '1.05rem', resize: 'vertical' }}
              />
            </div>

            {examConfig.allowFileUpload && (
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#94a3b8' }}>Đính Kèm Tệp Kết Quả (Max 5MB):</label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '30px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}} />
                  {filePreview ? (
                     <div style={{ color: '#34d399', fontWeight: 600, fontSize: '1.1rem' }}>
                       <FileText size={40} style={{ margin: '0 auto 10px' }}/>
                       {filePreview}
                     </div>
                  ) : (
                     <div>
                       <UploadCloud size={40} color="#94a3b8" style={{ margin: '0 auto 10px' }}/>
                       <span style={{ color: '#94a3b8' }}>Click để tải lên File báo cáo (Word, Excel, PDF...)</span>
                     </div>
                  )}
                </div>
                {filePreview && (
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button onClick={() => { setEssayFile(null); setFilePreview(null) }} style={{ background: 'none', border:'none', color: '#ef4444', cursor:'pointer', fontSize:'0.9rem'}}>Xóa tệp đính kèm</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', textAlign: 'right' }}>
              <button 
                onClick={submitEssayPhase}
                disabled={isSubmitting}
                style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} NỘP TẤT CẢ BÀI THI SAU CÙNG
              </button>
            </div>
          </div>
        )}

        {/* WAITING PHASE */}
        {phase === 'submitted' && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))' }}>
            <Clock size={80} color="#f59e0b" style={{ margin: '0 auto 24px', opacity: 0.8 }} />
            <h2 style={{ color: '#fca5a5', fontSize: '2rem', margin: '0 0 16px', color: '#f59e0b' }}>ĐANG TRONG PHÒNG CHỜ!</h2>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', display: 'inline-block', textAlign: 'left', marginBottom: '30px' }}>
               <p style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>✅ Bài Trắc nghiệm: <strong>{examState?.quizScore}/10 điểm</strong></p>
               <p style={{ margin: 0, fontSize: '1.1rem' }}>⏳ Bài Thực hành / Tự Luận: <span style={{ color: '#f59e0b' }}>Giảng viên đang chấm điểm...</span></p>
            </div>
            <div>
              <button onClick={() => navigate('/lessons/' + id)} style={{ padding: '12px 30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Về Lại Bài Học
              </button>
            </div>
          </div>
        )}

        {/* PASSED */}
        {phase === 'passed' && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '60px 30px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))', borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', marginBottom: '30px', boxShadow: '0 0 40px rgba(245,158,11,0.5)' }}>
               <Award size={50} color="#fff" />
            </div>
            <h2 style={{ color: '#10b981', fontSize: '2.8rem', margin: '0 0 16px', fontWeight: 900 }}>CHÚC MỪNG XUẤT SẮC!</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.2rem', margin: '0 0 12px' }}>Bạn đã chính thức Tốt Nghiệp môn <strong>{course.title}</strong></p>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', display: 'flex', gap: '40px', justifyContent: 'center', margin: '30px 0' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Trắc Nghiệm</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{examState?.quizScore}/10</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Thực Hành</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{examState?.essayScore}/10</div>
               </div>
            </div>

            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.4)', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '40px' }}>
               <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '8px' }}>Lời phê của Giảng viên:</strong>
               <span style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#e2e8f0' }}>"{examState?.teacherFeedback}"</span>
            </div>
            
            <div>
              <button onClick={() => navigate('/lessons/' + id)} style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(245,158,11,0.4)', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <Award size={24}/> NHẬN CHỨNG CHỈ NGAY
              </button>
            </div>
          </div>
        )}

        {/* FAILED */}
        {phase === 'failed' && (
          <div className="glass-card animate-fade-in-up" style={{ padding: '60px 30px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(239,68,68,0.1), transparent)', borderTop: '4px solid #ef4444' }}>
            <XCircle size={80} color="#ef4444" style={{ margin: '0 auto 24px', opacity: 0.9 }} />
            <h2 style={{ color: '#ef4444', fontSize: '2.5rem', margin: '0 0 16px', fontWeight: 900 }}>BẠN ĐÃ RỚT MÔN!</h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '0 0 24px' }}>Rất tiếc. Bạn cần ôn luyện thêm trước khi thi lại.</p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '16px', display: 'flex', gap: '40px', justifyContent: 'center', margin: '0 auto 30px', maxWidth: '400px' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Trắc Nghiệm</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{examState?.quizScore}/10</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '8px' }}>Thực Hành</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: examState?.essayScore < 5 ? '#ef4444' : '#10b981' }}>{examState?.essayScore}/10</div>
               </div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '40px', maxWidth: '600px' }}>
               <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '8px' }}>Góp ý từ Giảng viên:</strong>
               <span style={{ fontSize: '1.05rem', color: '#e2e8f0' }}>"{examState?.teacherFeedback}"</span>
            </div>
            <br/>
            
            {new Date() > new Date(examState?.nextRetakeAllowedAt) ? (
              <button onClick={() => { setPhase('quiz'); setCurrentQuiz(0); setQuizScore(0); setEssayAnswer(''); }} style={{ padding: '14px 36px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
                Đăng Ký Thi Lại Môn Này
              </button>
            ) : (
               <button disabled style={{ padding: '14px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#64748b', fontWeight: 600, cursor: 'not-allowed', fontSize: '1.1rem' }}>
                Mở khóa thi lại sau: {new Date(examState?.nextRetakeAllowedAt).toLocaleString('vi-VN')}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
`;

fs.writeFileSync('v3_exam_page.cjs', `const fs = require('fs');\nfs.writeFileSync('src/pages/ExamPage.jsx', \`${examPageJSX.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);\nconsole.log('ExamPage updated with Timer, Progress Bar, and Tabs!');`);
