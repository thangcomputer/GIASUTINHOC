const fs = require('fs');
let text = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf-8');

text = text.replace(
  /import \{ ArrowLeft, Lock, Play, BookOpen, PenTool, CheckCircle, ChevronRight \} from 'lucide-react'/g,
  `import { ArrowLeft, Lock, Play, BookOpen, PenTool, CheckCircle, ChevronRight, Trophy, Award, Download, X } from 'lucide-react'`
);

let helpers = `
/* ─── Helpers & Modal ───────────────────────────────────────────── */
function getYouTubeId(url = '') {
  const m = url.match(/(?:youtu\\.be\\/|youtube\\.com\\/(?:watch\\?v=|embed\\/))([\\w-]{11})/)
  return m ? m[1] : null
}
function isVideoUrl(url = '') {
  return url && (url.includes('youtube') || url.includes('youtu.be') || url.includes('.mp4') || url.includes('/uploads/'))
}

function CertificateModal({ cert, courseTitle, studentName, onClose }) {
  const certRef = React.useRef(null)
  const date = new Date(cert.completedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const handlePrint = () => {
    const content = certRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=640')
    win.document.write(\`
      <html><head>
        <title>Chứng Chỉ - \${studentName}</title>
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
      </head><body>\${content}</body></html>
    \`)
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
            <div style={{ position:'absolute', bottom:'18px', left:'50%', transform:'translateX(-50%)', fontSize:'9px', color:'#334155', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>Xác minh tại: giasuai.com/cert/{cert.certificateId}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
\nexport default function LessonDetailPage() {\n`

text = text.replace('export default function LessonDetailPage() {', helpers);

text = text.replace(
  'const [lesson, setLesson] = useState(null)',
  `const [lesson, setLesson] = useState(null)
  
  const [progressData, setProgressData] = useState(null)
  const [markingDone, setMarkingDone] = useState(false)
  const [showCert, setShowCert] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  
  const user = (() => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } })()`
);

text = text.replace(
  '      } catch {}\\n      setChecking(false);\\n    };\\n\\n    init();\\n  }, [id, navigate]);',
  `      } catch {}
      
      if (currentLesson && user._id) {
        try {
          const pr = await fetch(\`/api/progress/\${user._id}/\${currentLesson.id}\`);
          const d = await pr.json();
          if (d.success && d.data) {
            setProgressData(d.data);
            if (d.data.lastWatchedStep) setCurrentStep(d.data.lastWatchedStep);
          }
        } catch {}
      }
      setChecking(false);
    };

    init();
  }, [id, navigate, user._id]);

  const markStepDone = async (stepIdx) => {
    if (!user._id || markingDone) return;
    setMarkingDone(true);
    try {
      const r = await fetch('/api/progress/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user._id, courseId: lesson.id, stepIndex: stepIdx })
      });
      const d = await r.json();
      if (d.success) {
        setProgressData(d.data);
        if (d.data.isCompleted && !progressData?.isCompleted) {
          setJustCompleted(true);
          setTimeout(() => setShowCert(true), 1000);
        }
      }
    } catch {}
    setMarkingDone(false);
  };`
);

text = text.replace(
  'const progress = ((currentStep + 1) / lesson.steps.length) * 100',
  'const progress = progressData?.progressPct || ((currentStep + 1) / lesson.steps.length) * 100'
);

text = text.replace(
  `  const handleNext = () => {
    if (!isLastStep) { setCurrentStep(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else navigate('/lessons')
  }`,
  `  const handleNext = () => {
    if (!progressData?.completedSteps?.includes(currentStep)) markStepDone(currentStep);
    if (!isLastStep) { setCurrentStep(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else navigate('/lessons')
  }`
);

let unlockBadgeOld = `          {/* Unlock badge */}
          {isUnlocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
              <CheckCircle size={14}/> Đã mở khóa
            </div>`;

let unlockBadgeNew = `          {/* Action buttons (Unlock or Cert) */}
          {progressData?.isCompleted ? (
            <button onClick={() => setShowCert(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Award size={14}/> Chứng Chỉ
            </button>
          ) : isUnlocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', color: '#10b981', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
              <CheckCircle size={14}/> Đã mở khóa
            </div>`;
            
text = text.replace(unlockBadgeOld, unlockBadgeNew);            

text = text.replace('const isDone = i < currentStep;', 'const isDone = progressData?.completedSteps?.includes(i);');

let oldVideo1 = `              {/* ── VIDEO PLAYER (luôn hiển thị, blur nếu khóa) ── */}
              <div style={{ position: 'relative', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div style={{ filter: isCurrentStepFree ? 'none' : 'blur(8px)', transition: 'filter 0.3s' }}>
                  {isCurrentStepFree ? (
                    /* Module miễn phí / đã unlock: hiện video thẳng */
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                      <video 
                        src={step.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} 
                        controls={!activeCheckpoint} 
                        onTimeUpdate={handleTimeUpdate}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                    </div>`;

let newVideo1 = `              {/* ── JUST COMPLETED BANNER ── */}
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
                      {getYouTubeId(step.videoUrl) ? (
                        <iframe
                          src={\`https://www.youtube.com/embed/\${getYouTubeId(step.videoUrl)}?rel=0&modestbranding=1&color=white\`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                          title={step.title}
                        />
                      ) : (
                        <video 
                          src={step.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} 
                          controls={!activeCheckpoint} 
                          onTimeUpdate={handleTimeUpdate}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      )}
                    </div>`;
text = text.replace(oldVideo1, newVideo1);

let oldVideo2 = `                      {isCurrentStepFree ? (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                          <video 
                            src={step.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} 
                            controls={!activeCheckpoint} 
                            onTimeUpdate={handleTimeUpdate}
                            style={{ width: '100%', display: 'block', maxHeight: '400px' }} 
                          />`;
let newVideo2 = `                      {isCurrentStepFree ? (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', position: 'relative', aspectRatio: '16/9' }}>
                          {getYouTubeId(step.videoUrl) ? (
                            <iframe
                              src={\`https://www.youtube.com/embed/\${getYouTubeId(step.videoUrl)}?rel=0&modestbranding=1&color=white\`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              allowFullScreen
                              title={step.title}
                            />
                          ) : (
                            <video 
                              src={step.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"} 
                              controls={!activeCheckpoint} 
                              onTimeUpdate={handleTimeUpdate}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                          )}`;
text = text.replace(oldVideo2, newVideo2);

let oldNav = `              {/* ── NAVIGATION ───────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handlePrev} disabled={isFirstStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', fontWeight: 600, cursor: isFirstStep ? 'not-allowed' : 'pointer', opacity: isFirstStep ? 0 : 1, transition: 'all 0.2s', fontSize: '0.9rem' }}>
                  <ArrowLeft size={16}/> Bài trước
                </button>

                <span style={{ color: '#475569', fontSize: '0.85rem' }}>Bài {currentStep + 1} / {lesson.steps.length}</span>

                <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: isLastStep ? 'linear-gradient(135deg, #10b981, #059669)' : \`linear-gradient(135deg, \${lesson.color}, \${lesson.color}bb)\`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: \`0 4px 20px \${lesson.color}40\` }}>
                  {isLastStep ? '🎓 Hoàn Thành Giáo Trình' : <>Bài tiếp theo <ChevronRight size={16}/></>}
                </button>
              </div>

            </main>
          </>
        )}
      </div>
    </div>`;
    
let newNav = `              {/* ── NAVIGATION ───────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={handlePrev} disabled={isFirstStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', fontWeight: 600, cursor: isFirstStep ? 'not-allowed' : 'pointer', opacity: isFirstStep ? 0 : 1, transition: 'all 0.2s', fontSize: '0.9rem', flex: 1, maxWidth: '200px' }}>
                  <ArrowLeft size={16}/> Bài trước
                </button>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {!progressData?.completedSteps?.includes(currentStep) ? (
                    <button
                      onClick={() => markStepDone(currentStep)}
                      disabled={markingDone}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>
                      <CheckCircle size={18} /> Đánh dấu hoàn thành
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                      <CheckCircle size={18} /> Đã hoàn thành
                    </div>
                  )}
                </div>

                <button onClick={() => { if(isLastStep && !progressData?.isCompleted) markStepDone(currentStep); else handleNext() }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: isLastStep ? 'linear-gradient(135deg, #10b981, #059669)' : \`linear-gradient(135deg, \${lesson.color}, \${lesson.color}bb)\`, border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: \`0 4px 20px \${lesson.color}40\`, flex: 1, maxWidth: '200px' }}>
                  {isLastStep ? '🎓 Hoàn Thành' : <>Bài tiếp theo <ChevronRight size={16}/></>}
                </button>
              </div>

            </main>
          </>
        )}
      </div>

      {showCert && progressData?.isCompleted && (
        <CertificateModal
          cert={progressData}
          courseTitle={lesson.title}
          studentName={user.name || 'Học Viên'}
          onClose={() => setShowCert(false)}
        />
      )}
    </div>`;
text = text.replace(oldNav, newNav);

fs.writeFileSync('src/pages/LessonDetailPage.jsx', text);
console.log('Update length:', text.length);
