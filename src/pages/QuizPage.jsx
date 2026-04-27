import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { QUIZ_QUESTIONS } from '../data/quizData'
import { Trophy, Target, BookOpen, RotateCcw, ArrowRight, ShieldCheck, FileQuestion, Download, Settings2, Play, Sparkles, Loader2 } from 'lucide-react'
import './QuizPage.css'
import confetti from 'canvas-confetti'
import VirtualExamRoom from '../components/VirtualExamRoom'

export default function QuizPage() {
  const [searchParams] = useSearchParams()
  const [appState, setAppState] = useState('setup') // 'setup', 'playing'
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || 'Chọn khóa học')
  const [numQuestions, setNumQuestions] = useState(10) // Mặc định 10 câu
  const [selectedDifficulty, setSelectedDifficulty] = useState('Ngẫu nhiên')
  
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Đang tạo đề...')

  useEffect(() => {
    let progressInterval;
    let textInterval;
    if (isGenerating) {
      setProgress(0);
      setLoadingText('Đang tạo đề...');
      
      progressInterval = setInterval(() => {
        setProgress(p => {
          if (p < 85) return p + Math.floor(Math.random() * 4) + 1;
          if (p < 98) return p + 1;
          return p;
        });
      }, 300);

      let toggle = false;
      textInterval = setInterval(() => {
        toggle = !toggle;
        setLoadingText(toggle ? 'Vui lòng đợi...' : 'Đang tạo đề...');
      }, 1500);
    }
    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    }
  }, [isGenerating])

  const topics = ['Chọn khóa học', ...new Set(QUIZ_QUESTIONS.map(q => q.category)), 'Cấu trúc máy tính', 'Lập trình căn bản', 'Thiết kế đồ hoạ']

  const handleStartExam = () => {
    const pool = selectedTopic === 'Chọn khóa học' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter(q => q.category === selectedTopic)
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    const selectedQ = shuffled.slice(0, Math.min(numQuestions, shuffled.length))
    
    if (selectedQ.length === 0) {
      Swal.fire("Không có câu hỏi nào cho chuyên mục này!");
      return;
    }

    setQuestions(selectedQ)
    setCurrentIdx(0)
    setScore(0)
    setShowResult(false)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setAppState('playing')
  }

  const handleGenerateFromAI = async () => {
    setIsGenerating(true)
    const user = JSON.parse(localStorage.getItem('giasu_user') || '{}');
    
    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: selectedTopic === 'Chọn khóa học' ? 'Tin học cơ bản' : selectedTopic, 
          numQuestions,
          difficulty: selectedDifficulty,
          studentId: user._id || 'anon' 
        })
      })
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        setQuestions(data.data)
        setCurrentIdx(0)
        setScore(0)
        setShowResult(false)
        setSelectedAnswer(null)
        setIsAnswered(false)
        setAppState('playing')
        
        // Phát sự kiện để báo Layout cập nhật lại Xu
        window.dispatchEvent(new CustomEvent('coins_updated'));
      } else {
        Swal.fire(data.message || 'Lỗi tạo đề thi từ AI')
      }
    } catch(err) {
      Swal.fire('Không thể kết nối đến máy chủ AI')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadTest = () => {
    const pool = selectedTopic === 'Chọn khóa học' ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter(q => q.category === selectedTopic)
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, Math.min(numQuestions, shuffled.length))
    
    if (shuffled.length === 0) {
      Swal.fire("Không có câu hỏi nào cho chuyên mục này!");
      return;
    }

    let content = `=======================================\nĐỀ KIỂM TRA TRẮC NGHIỆM TIN HỌC\nChuyên đề: ${selectedTopic}\nSố lượng: ${shuffled.length} câu\n=======================================\n\nHọ và tên: .......................................\nLớp/Đơn vị: ........................................\n\n`;
    
    shuffled.forEach((q, i) => {
        content += `CÂU ${i+1}: ${q.question}\n`;
        q.options.forEach((opt, j) => {
            content += `  ${['A','B','C','D'][j]}. ${opt}\n`;
        });
        content += `\n`;
    });
    
    content += `\n=======================================\nĐÁP ÁN (Dành cho Giáo viên)\n=======================================\n`;
    shuffled.forEach((q, i) => {
       content += `Câu ${i+1}: ${['A','B','C','D'][q.correct]}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `De_Kiem_Tra_${selectedTopic}.txt`;
    link.click();
  }

  const handleSelect = (idx) => {
    if (isAnswered) return
    setSelectedAnswer(idx)
    setIsAnswered(true)

    if (idx === questions[currentIdx].correct) {
      setScore(prev => prev + 1)
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#6366f1', '#818cf8']
      })
    }
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setShowResult(true)
      if (score >= Math.ceil(questions.length * 0.6)) {
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#10b981', '#34d399', '#4f46e5']
        })
      }
    }
  }

  const handleRestart = () => {
    setAppState('setup')
  }

  return (
    <div className="quiz-page" style={appState === 'playing' ? { paddingTop: '80px', height: '100vh', overflow: 'hidden' } : {}}>
      <Navbar />
      
      {appState === 'setup' ? (
        <div className="container quiz-container">
          <div className="quiz-setup glass-card animate-fade-in-up" style={{ padding: '40px 30px', maxWidth: '650px', margin: '40px auto', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>

            <div style={{display: 'flex', justifyContent: 'center', marginBottom: '15px', color: '#818cf8'}}>
               <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '50%', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}>
                 <Settings2 size={48} />
               </div>
            </div>
            <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '35px', fontSize: '2rem', letterSpacing: '0.05em' }}>Cấu Hình Bài Kiểm Tra</h1>
            
            <div style={{ marginBottom: '25px', position: 'relative', zIndex: 50 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>
                 <BookOpen size={18} color="#6366f1" /> 1. Tuyển Tập Môn Học:
               </label>
               
               <div style={{ position: 'relative', width: '100%' }}>
                 <div 
                   onClick={() => setDropdownOpen(!dropdownOpen)}
                   className="custom-select-trigger"
                   style={{ height: '54px', borderRadius: '14px', background: 'rgba(30,41,59,0.7)', border: dropdownOpen ? '1px solid #6366f1' : '1px solid rgba(148,163,184,0.2)', fontSize: '1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', boxShadow: dropdownOpen ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none', transition: 'all 0.3s' }}
                 >
                   <span style={{ fontWeight: '500' }}>{selectedTopic}</span>
                   <span style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', fontSize: '0.8rem', color: '#94a3b8' }}>▼</span>
                 </div>
                 
                 {dropdownOpen && (
                    <div className="custom-dropdown-menu animate-fade-in-up" style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '14px', padding: '8px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                      <div style={{ padding: '4px 8px 12px' }}>
                        <input 
                          type="text" 
                          placeholder="🔍 Tìm kiếm môn học..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.3)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                          autoFocus
                        />
                      </div>
                      
                      {topics.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                        topics.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
                          <div 
                            key={t} 
                            onClick={() => { setSelectedTopic(t); setDropdownOpen(false); setSearchQuery(''); }}
                            className="custom-dropdown-item"
                            style={{ 
                              padding: '12px 16px', 
                              color: selectedTopic === t ? '#fff' : '#cbd5e1', 
                              cursor: 'pointer', 
                              borderRadius: '10px', 
                              transition: 'all 0.2s', 
                              background: selectedTopic === t ? 'linear-gradient(90deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 100%)' : 'transparent', 
                              fontWeight: selectedTopic === t ? 'bold' : 'normal', 
                              marginBottom: '4px',
                              borderLeft: selectedTopic === t ? '3px solid #6366f1' : '3px solid transparent'
                            }}
                            onMouseEnter={(e) => { if(selectedTopic !== t) e.target.style.background = 'rgba(99,102,241,0.5)' }}
                            onMouseLeave={(e) => { if(selectedTopic !== t) e.target.style.background = 'transparent' }}
                          >
                            {t}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                          Không tìm thấy môn học "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </div>

            <div style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>
                 <Target size={18} color="#f59e0b" /> 2. Số Lượng Câu Hỏi Random:
               </label>
               <div style={{ display: 'flex', gap: '15px' }}>
                 {[10, 20, 30].map(num => {
                    let costText = "5 Xu";
                    let costColor = "#059669"; // Emerald
                    let boxColor = "#10b981";
                    
                    if(num === 20) { costText = "8 Xu"; costColor = "#d97706"; boxColor = "#f59e0b" } // Amber
                    if(num === 30) { costText = "15 Xu"; costColor = "#e11d48"; boxColor = "#f43f5e" } // Rose
                 
                    const isSelected = num === numQuestions;

                    return (
                      <button 
                        key={num}
                        onClick={() => setNumQuestions(num)}
                        style={{ 
                          flex: 1, 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '16px 8px',
                          border: isSelected ? `2px solid ${boxColor}` : '1px solid rgba(148,163,184,0.2)',
                          background: isSelected ? `rgba(${boxColor === '#10b981' ? '16,185,129' : boxColor === '#f59e0b' ? '245,158,11' : '244,63,94'}, 0.15)` : 'rgba(30,41,59,0.5)',
                          color: isSelected ? '#fff' : '#94a3b8',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isSelected ? `0 10px 20px -5px rgba(${boxColor === '#10b981' ? '16,185,129' : boxColor === '#f59e0b' ? '245,158,11' : '244,63,94'}, 0.3)` : 'none',
                          transform: isSelected ? 'translateY(-2px)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{num} BÀI</span>
                        <span style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '12px', background: costColor, color: '#fff', fontWeight: 'bold', boxShadow: `0 2px 5px rgba(0,0,0,0.2)` }}>{costText}</span>
                      </button>
                    )
                 })}
               </div>
            </div>

            <div style={{ marginBottom: '40px', position: 'relative', zIndex: 1 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>
                 <ShieldCheck size={18} color="#3b82f6" /> 3. Cấp Độ Khó:
               </label>
               <div style={{ display: 'flex', gap: '15px' }}>
                 {['Ngẫu nhiên', 'Cơ bản', 'Nâng cao'].map(diff => {
                    const isSelected = diff === selectedDifficulty;
                    return (
                      <button 
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        style={{ 
                          flex: 1, 
                          padding: '12px 8px',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(148,163,184,0.2)',
                          background: isSelected ? 'rgba(59,130,246, 0.15)' : 'rgba(30,41,59,0.5)',
                          color: isSelected ? '#fff' : '#94a3b8',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontWeight: isSelected ? '700' : '500',
                          transition: 'all 0.2s',
                        }}
                      >
                        {diff}
                      </button>
                    )
                 })}
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
               <button 
                 className="btn-primary" 
                 onClick={handleGenerateFromAI} 
                 disabled={isGenerating || selectedTopic === 'Chọn khóa học'} 
                 style={{ 
                   display: 'flex', 
                   justifyContent: 'center', 
                   alignItems: 'center', 
                   padding: '18px', 
                   background: (isGenerating || selectedTopic === 'Chọn khóa học') ? 'rgba(148,163,184,0.2)' : 'linear-gradient(135deg, #c026d3, #7e22ce)', 
                   color: (isGenerating || selectedTopic === 'Chọn khóa học') ? '#94a3b8' : '#fff',
                   border: 'none', 
                   borderRadius: '16px', 
                   fontWeight: 'bold', 
                   fontSize: '1.05rem', 
                   boxShadow: (isGenerating || selectedTopic === 'Chọn khóa học') ? 'none' : '0 10px 25px -5px rgba(126, 34, 206, 0.5)', 
                   textTransform: 'uppercase', 
                   transition: 'all 0.3s',
                   cursor: (isGenerating || selectedTopic === 'Chọn khóa học') ? 'not-allowed' : 'pointer',
                   position: 'relative',
                   overflow: 'hidden'
                 }}
               >
                 {isGenerating && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: 'rgba(99, 102, 241, 0.25)', transition: 'width 0.3s ease' }} />
                 )}
                 <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
                   {isGenerating ? <Loader2 size={24} className="spin" /> : <Sparkles size={24} />} 
                   {isGenerating ? `${loadingText} ${progress}%` : 'TẠO ĐỀ MỚI'}
                 </div>
               </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="w-full animate-fade-in-up" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: 'calc(100vh - 110px)' }}>
          <div style={{ height: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <VirtualExamRoom 
               questions={questions} 
               timeLimit={questions.length * 60} // 1 phút mỗi câu
               topicName={selectedTopic === 'Chọn khóa học' ? 'Tổng hợp' : selectedTopic}
               onComplete={(result) => setAppState('setup')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
