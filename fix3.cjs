const fs = require('fs');
const content = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf-8');
const lines = content.split(/\r?\n/);
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  if (lines[i].includes('setLesson(currentLesson);')) {
    newLines.push(`
      // TIẾN ĐỘ 
      if (user._id) {
        fetch('/api/progress/' + user._id + '/' + currentLesson.id)
          .then(r => r.json())
          .then(d => {
            if(d.success && d.data) {
               setProgressData(d.data);
               if (d.data.lastWatchedStep) setCurrentStep(d.data.lastWatchedStep);
            }
          }).catch(e => console.log('Không lấy được tiến độ', e));
      }`);
  }
  
  if (lines[i].includes('const step = lesson.steps[currentStep]')) {
    newLines.push(`
  const markStepDone = async (stepIdx) => {
    if (!user._id) {
      Swal.fire({ title: 'Vui lòng đăng nhập', text: 'Bạn cần đăng nhập để lưu kết quả học tập và nhận chứng chỉ.', icon: 'warning', confirmButtonColor: '#10b981' });
      return;
    }
    if (markingDone) return;
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
  };
    `);
  }
}

fs.writeFileSync('src/pages/LessonDetailPage.jsx', newLines.join('\n'));
