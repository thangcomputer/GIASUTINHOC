const fs = require('fs');

let code = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf8');

// Thêm import ReactPlayer
code = code.replace(
  "import { ArrowLeft, Lock",
  "import ReactPlayer from 'react-player';\nimport { ArrowLeft, Lock"
);

// Thay thế luồng markStepDone: 
// - Chuyển sang hoàn thành khi kết thúc Video
// - Không cho đánh dấu tay nữa
let oldNav = `                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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
                </div>`;

let newNav = `                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {!progressData?.completedSteps?.includes(currentStep) ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: '12px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                      ▶ Hãy xem hết video để tính hoàn thành
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                      <CheckCircle size={18} /> Đã hoàn thành
                    </div>
                  )}
                </div>`;
code = code.replace(oldNav, newNav);

// Đổi video trên cùng
let oldTopVideo = `                  {isCurrentStepFree ? (
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

let newTopVideo = `                  {isCurrentStepFree ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                      <ReactPlayer
                        url={step.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
                        controls={!activeCheckpoint}
                        onProgress={({ playedSeconds }) => handleTimeUpdate({ target: { currentTime: playedSeconds, pause: () => {} } })}
                        onEnded={() => markStepDone(currentStep)}
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                      />
                    </div>`;

code = code.replace(oldTopVideo, newTopVideo);

fs.writeFileSync('src/pages/LessonDetailPage.jsx', code);
console.log('Video anti-cheat injected successfully!');
