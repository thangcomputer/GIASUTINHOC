import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Send, Clock, BookOpen, AlertCircle, Shield, ChevronLeft, ChevronRight, CheckCircle2, Circle, Lightbulb, MessageCircle, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import confetti from 'canvas-confetti';
import { studentJsonAuthHeaders } from '../lib/authFetch';
import { promptInsufficientCredits, isInsufficientCreditsStatus } from '../lib/insufficientCredits.js';

export default function VirtualExamRoom({ questions, timeLimit = 1800, onComplete, studentName = 'Học viên', topicName }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [droppedItems, setDroppedItems] = useState([]);
  const [showHint, setShowHint] = useState({});
  const [inlineChatOpen, setInlineChatOpen] = useState({});
  const [inlineChatMsgs, setInlineChatMsgs] = useState({});
  const [inlineChatInput, setInlineChatInput] = useState('');
  const [isInlineChatLoading, setIsInlineChatLoading] = useState(false);
  const inlineChatEndRef = React.useRef(null);
  
  useEffect(() => {
    if (inlineChatOpen[currentIdx]) {
      inlineChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inlineChatMsgs, currentIdx, isInlineChatLoading, inlineChatOpen]);

  const handleInlineChatSubmit = async (idx, questionText) => {
    if (!inlineChatInput.trim() || isInlineChatLoading) return;
    const userMsg = inlineChatInput.trim();
    setInlineChatInput('');
    setIsInlineChatLoading(true);
    
    const prevMsgs = inlineChatMsgs[idx] || [];
    const newMsgsForUI = [...prevMsgs, { role: 'user', content: userMsg }];
    setInlineChatMsgs(prev => ({ ...prev, [idx]: newMsgsForUI }));

    const contextualMessage = prevMsgs.length === 0 
      ? `[Học viên hỏi về câu thi: "${questionText}". Vui lòng CHỈ hướng dẫn tư duy loại trừ, TUYỆT ĐỐI KHÔNG tiết lộ đáp án đúng]\n\n${userMsg}`
      : userMsg;

    try {
      const user = JSON.parse(localStorage.getItem('giasu_user') || '{}');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: studentJsonAuthHeaders(),
        body: JSON.stringify({ 
          message: contextualMessage,
          history: prevMsgs,
          studentId: user._id || null,
          aiMode: 'free',
          type: 'chat'
        })
      });
      const data = await res.json();
      if (data.success) {
         const aiText = data.data.text || data.data.content || 'Đã có lỗi xử lý văn bản.';
         setInlineChatMsgs(prev => ({ ...prev, [idx]: [...newMsgsForUI, { role: 'ai', content: aiText }] }));
         window.dispatchEvent(new CustomEvent('coins_updated'));
      } else {
         if (isInsufficientCreditsStatus(res.status)) {
           await promptInsufficientCredits(data.message);
         } else {
           Swal.fire('Lỗi tổng đài', data.message, 'error');
         }
         setInlineChatMsgs(prev => ({ ...prev, [idx]: prevMsgs })); // revert user msg
      }
    } catch(err) {
       setInlineChatMsgs(prev => ({ ...prev, [idx]: [...newMsgsForUI, { role: 'ai', content: 'Lỗi kết nối máy chủ AI.' }] }));
    }
    setIsInlineChatLoading(false);
  };

  useEffect(() => {
    if (result) return;
    if (timeLeft <= 0) { handleFinalizeExam(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleSelectOption = (qIdx, optIdx) => {
    if (result) return;
    setAnswers({ ...answers, [qIdx]: optIdx });
  };

  const handleDragStart = (e, item) => setDraggedItem(item);
  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem && !droppedItems.includes(draggedItem)) setDroppedItems([...droppedItems, draggedItem]);
    setDraggedItem(null);
  };

  const handleSubmitClick = () => {
    Swal.fire({
      title: 'Xác nhận nộp bài',
      text: 'Bạn đã chắc chắn muốn nộp bài và kết thúc phiên đánh giá chưa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý nộp bài',
      cancelButtonText: 'Quay lại làm tiếp',
      background: '#1e1b4b',
      color: '#e2e8f0',
      confirmButtonColor: '#6366f1',
    }).then(res => { if (res.isConfirmed) handleFinalizeExam(); });
  };

  const handleFinalizeExam = async () => {
    setIsSubmitting(true);
    let score = 0;
    const wrongAnswers = [];
    questions.forEach((q, i) => {
      let cIdx = q.correct !== undefined ? q.correct : (q.correctAnswer !== undefined ? q.correctAnswer : q.answer);
      if (typeof cIdx === 'string') {
         const str = cIdx.toUpperCase().trim();
         if (str === 'A' || str.startsWith('A.') || str.includes('ĐÁP ÁN A')) cIdx = 0;
         else if (str === 'B' || str.startsWith('B.') || str.includes('ĐÁP ÁN B')) cIdx = 1;
         else if (str === 'C' || str.startsWith('C.') || str.includes('ĐÁP ÁN C')) cIdx = 2;
         else if (str === 'D' || str.startsWith('D.') || str.includes('ĐÁP ÁN D')) cIdx = 3;
         else {
             let parsed = parseInt(str, 10);
             if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
                 cIdx = parsed;
             } else {
                 let matchedIdx = q.options.findIndex(opt => opt.toUpperCase().includes(str) || str.includes(opt.toUpperCase()));
                 if (matchedIdx !== -1) cIdx = matchedIdx;
             }
         }
      }
      
      const isCorrect = Number(answers[i]) === Number(cIdx) && !isNaN(cIdx);

      if (isCorrect) {
        score++;
      } else {
        const correctStr = q.options[cIdx] !== undefined ? q.options[cIdx] : (q.correct || 'Chưa rõ');
        wrongAnswers.push({
          question: q.question,
          studentAnswer: answers[i] !== undefined ? q.options[answers[i]] : 'Bỏ trống',
          correctAnswer: correctStr,
        });
      }
    });
    const finalScore = Math.round((score / questions.length) * 1000);
    try {
      const user = JSON.parse(localStorage.getItem('giasu_user') || '{}');
      const studentId = user._id || null;
      if (!studentId) throw new Error('Chưa đăng nhập');
      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: studentJsonAuthHeaders(),
        body: JSON.stringify({ studentId, topic: topicName || questions[0]?.category || 'Tổng hợp', score: score, totalQuestions: questions.length, wrongAnswers }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.earnedCoins > 0) {
          confetti({
            particleCount: 180,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
          });
          Swal.fire({ title: 'Hoàn thành nhiệm vụ!', text: `Xuất sắc! Bạn đạt trên 800 điểm và được thưởng ${data.earnedCoins} Xu!`, icon: 'success', background: '#1e1b4b', color: '#e2e8f0', confirmButtonColor: '#6366f1' });
        }
        setResult({ score: finalScore, correct: score, total: questions.length, wrongAnswers, feedback: data.data?.aiFeedback || '' });
      } else throw new Error(data.message);
    } catch {
      setResult({ score: finalScore, correct: score, total: questions.length, wrongAnswers, feedback: 'Hệ thống đang bận, không thể truy xuất nhận xét chuyên môn lúc này. Xin vui lòng liên hệ giáo viên phụ trách.' });
    }
    setIsSubmitting(false);
  };

  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const timeWarning = timeLeft < 300;
  const q = questions[currentIdx];

  // ─── Result Screen ─────────────────────────────────────────────────────────
  if (result) {
    const passed = result.score >= 800;
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '860px' }}>

          {/* Score Hero */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: passed ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: passed ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 40px rgba(239,68,68,0.4)' }}>
              <Shield size={48} color="white" />
            </div>
            <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 900, margin: '0 0 8px' }}>Báo Cáo Năng Lực Chuyên Môn</h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Hệ thống đánh giá — Trung tâm đào tạo 1 kèm 1 trực tiếp & từ xa</p>

            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px', marginTop: '20px', padding: '16px 40px', borderRadius: '20px', background: passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              <span style={{ fontSize: '4rem', fontWeight: 900, color: passed ? '#10b981' : '#ef4444', lineHeight: 1 }}>{result.score}</span>
              <span style={{ color: '#475569', fontSize: '1.2rem' }}>/1000</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: passed ? '#10b981' : '#ef4444', border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                {passed ? 'Đạt chuẩn (≥800)' : 'Cần ôn thêm (<800)'}
              </span>
              <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                Đúng {result.correct}/{result.total} câu
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Wrong Answers */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', gridColumn: result.wrongAnswers.length > 0 ? '1 / -1' : '1 / -1' }}>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                <AlertCircle size={18} color="#f59e0b" /> Phân Tích Câu Sai ({result.wrongAnswers.length} câu)
              </h3>
              {result.wrongAnswers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#10b981', fontWeight: 700, fontSize: '1.05rem' }}>
                  Hoàn thành xuất sắc 100% mục tiêu, không ghi nhận sai lệch chuyên môn.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.wrongAnswers.map((w, idx) => (
                    <div key={idx} style={{ borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.06)', borderRadius: '0 12px 12px 0', padding: '16px' }}>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: '12px' }}>Câu {idx + 1}: {w.question}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phương án bạn chọn</div>
                          <div style={{ color: '#fca5a5' }}>{w.studentAnswer}</div>
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đáp án tiêu chuẩn</div>
                          <div style={{ color: '#6ee7b7' }}>{w.correctAnswer}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Feedback */}
          {result.feedback && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderLeft: '4px solid #6366f1', borderRadius: '0 18px 18px 0', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <BookOpen size={16} /> Đánh Giá Từ Gia Sư Trưởng
              </h3>
              <div style={{ color: '#c7d2fe', lineHeight: 1.8, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: marked(result.feedback) }} />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => onComplete && onComplete(result)} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
              Trở Về Hệ Thống
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Exam Screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <div style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="white" />
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Phòng Khảo Thí</span>
          </div>

          {/* Progress */}
          <div style={{ flex: 1, maxWidth: '400px', display: window.innerWidth > 768 ? 'block' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Đã hoàn thành: {answeredCount}/{questions.length}</span>
              <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '10px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: timeWarning ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${timeWarning ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s' }}>
            <Clock size={16} color={timeWarning ? '#ef4444' : '#94a3b8'} />
            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: timeWarning ? '#ef4444' : 'white', letterSpacing: '0.05em' }}>{formatTime(timeLeft)}</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmitClick} disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', opacity: isSubmitting ? 0.6 : 1, boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            {isSubmitting ? 'Đang chấm...' : 'Nộp Bài'} <Send size={15} />
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: Question Navigator ── */}
        <div style={{ width: '260px', background: 'rgba(15,23,42,0.7)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Danh sách câu hỏi</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
            {questions.map((_, idx) => {
              const isActive = idx === currentIdx;
              const isAnswered = answers[idx] !== undefined;
              return (
                <button key={idx} onClick={() => setCurrentIdx(idx)} style={{
                  aspectRatio: '1', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s',
                  outline: isActive ? '2px solid #818cf8' : 'none', outlineOffset: '2px',
                  background: isAnswered ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)',
                  color: isAnswered ? '#ffffff' : '#cbd5e1',
                }}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(99,102,241,0.6)' }} />
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>Đã trả lời</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>Chưa trả lời</span>
            </div>
          </div>
        </div>

        {/* ── Right: Question Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* Question Header */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ padding: '5px 14px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontWeight: 700, fontSize: '0.82rem' }}>
                  Câu {currentIdx + 1} / {questions.length}
                </span>
                {q?.difficulty && (
                  <span style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)' }}>
                    {q.difficulty}
                  </span>
                )}
              </div>
              <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
                {q?.question}
              </h2>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {q?.options.map((opt, oIdx) => {
                const isSelected = answers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentIdx, oIdx)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px',
                      borderRadius: '14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', width: '100%',
                      background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      outline: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.07)',
                      outlineOffset: isSelected ? '0px' : '0px',
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                      border: `2px solid ${isSelected ? '#6366f1' : '#334155'}`,
                      background: isSelected ? '#6366f1' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div style={{ color: isSelected ? '#e0e7ff' : '#94a3b8', fontSize: '0.97rem', lineHeight: 1.5, fontWeight: isSelected ? 600 : 400, transition: 'all 0.2s' }}>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>



            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: currentIdx === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: currentIdx === 0 ? '#475569' : '#e2e8f0', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                <ChevronLeft size={16} /> Câu trước
              </button>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}>{currentIdx + 1} / {questions.length}</span>
              <button onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))} disabled={currentIdx === questions.length - 1} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: currentIdx === questions.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.4)', border: `1px solid ${currentIdx === questions.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.6)'}`, borderRadius: '10px', color: currentIdx === questions.length - 1 ? '#475569' : '#e0e7ff', cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                Câu tiếp <ChevronRight size={16} />
              </button>
            </div>

            {/* AI Assistant Tools */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => setShowHint(h => ({...h, [currentIdx]: !h[currentIdx]}))} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: showHint[currentIdx] ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showHint[currentIdx] ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', color: showHint[currentIdx] ? '#fde047' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.85rem' }}>
                    <Lightbulb size={16} /> {showHint[currentIdx] ? 'Đóng Gợi ý' : 'Xem Gợi ý'}
                  </button>
                  <button onClick={() => {
                    const isOpening = !inlineChatOpen[currentIdx];
                    setInlineChatOpen(c => ({...c, [currentIdx]: isOpening}));
                    // Lần đầu mở chat cho câu này → tự động điền câu hỏi vào input
                    if (isOpening && (!inlineChatMsgs[currentIdx] || inlineChatMsgs[currentIdx].length === 0)) {
                      setInlineChatInput(`Giải thích câu hỏi: "${q?.question}"`);
                    }
                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: inlineChatOpen[currentIdx] ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)', border: `1px solid ${inlineChatOpen[currentIdx] ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.2)'}`, borderRadius: '12px', color: inlineChatOpen[currentIdx] ? '#e0e7ff' : '#a5b4fc', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600, fontSize: '0.85rem' }}>
                    <MessageCircle size={16} /> {inlineChatOpen[currentIdx] ? 'Đóng Chat AI' : 'Hỏi Gia Sư AI'}
                  </button>
               </div>
               
               {showHint[currentIdx] && (
                 <div className="animate-fade-in-up" style={{ padding: '16px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderLeft: '4px solid #eab308', borderRadius: '8px 12px 12px 8px', color: '#fef08a', fontSize: '0.92rem', lineHeight: 1.6 }}>
                   <strong style={{ color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><Lightbulb size={16} /> Gợi ý tĩnh từ hệ thống:</strong> 
                   {q?.explanation ? (
                     <div dangerouslySetInnerHTML={{ __html: marked(q.explanation) }} />
                   ) : 'Hãy đọc kỹ câu hỏi và các phương án. Phân tích loại trừ các đáp án sai rõ ràng !'}
                 </div>
               )}

               {inlineChatOpen[currentIdx] && (
                 <div className="animate-fade-in-up" style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.3)', borderLeft: '4px solid #6366f1', borderRadius: '8px 12px 12px 8px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px' }}>
                   <strong style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <MessageCircle size={16} /> Khung Chat Gia Sư Trực Tiếp
                   </strong> 
                   
                   <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                      {(!inlineChatMsgs[currentIdx] || inlineChatMsgs[currentIdx].length === 0) && (
                         <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Chat với AI để được giải đáp cụ thể về câu hỏi này!</div>
                      )}
                      {(inlineChatMsgs[currentIdx] || []).map((m, i) => (
                        <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', color: '#e2e8f0', fontSize: '0.9rem', maxWidth: '85%', lineHeight: 1.5, border: m.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                           <div className="chat-inline-md" dangerouslySetInnerHTML={{ __html: marked(m.content || '') }} />
                        </div>
                      ))}
                      {isInlineChatLoading && (
                         <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', color: '#a5b4fc', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <Loader2 size={16} className="spin" /> Đang phản hồi...
                         </div>
                      )}
                      <div ref={inlineChatEndRef} />
                   </div>

                   <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input 
                         type="text" 
                         value={inlineChatInput} 
                         onChange={e => setInlineChatInput(e.target.value)} 
                         onKeyDown={e => {
                           if(e.key === 'Enter') handleInlineChatSubmit(currentIdx, q?.question);
                         }}
                         placeholder="Nhập câu hỏi... (VD: Vì sao đáp án kia lại sai?)" 
                         style={{ flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: '0.9rem' }} 
                      />
                      <button 
                         onClick={() => handleInlineChatSubmit(currentIdx, q?.question)} 
                         disabled={isInlineChatLoading || !inlineChatInput.trim()}
                         style={{ padding: '0 18px', background: '#6366f1', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: (!inlineChatInput.trim() || isInlineChatLoading) ? 0.5 : 1 }}
                      >
                         <Send size={18} />
                      </button>
                   </div>
                 </div>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
