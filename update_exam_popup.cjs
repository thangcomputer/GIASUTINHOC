const fs = require('fs');
let code = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf8');

// 1. Thêm import
code = code.replace(
  "import ReactPlayer from 'react-player';",
  "import ReactPlayer from 'react-player';\nimport Swal from 'sweetalert2';" // Đảm bảo Swal có sẵn dù đã import ở đâu đó
);

// 2. Thêm state exam
code = code.replace(
  "const [showCert, setShowCert] = useState(false)",
  "const [showCert, setShowCert] = useState(false);\n  const [examState, setExamState] = useState(null);"
);

// 3. Gọi API exam
let oldFetch = `      // TIẾN ĐỘ 
      if (user._id) {
        fetch('/api/progress/' + user._id + '/' + currentLesson.id)
          .then(r => r.json())
          .then(d => {
            if(d.success && d.data) {
               setProgressData(d.data);
               if (d.data.lastWatchedStep) setCurrentStep(d.data.lastWatchedStep);
            }
          }).catch(e => console.log('Không lấy được tiến độ', e));
      }`;

let newFetch = `      // TIẾN ĐỘ VÀ THI CỬ
      if (user._id) {
        fetch('/api/progress/' + user._id + '/' + currentLesson.id)
          .then(r => r.json())
          .then(async d => {
            if(d.success && d.data) {
               setProgressData(d.data);
               if (d.data.lastWatchedStep) setCurrentStep(d.data.lastWatchedStep);
               
               // Lấy trạng thái bài thi
               if (d.data.isCompleted) {
                 try {
                   const ex = await fetch('/api/exams/' + user._id + '/' + currentLesson.id);
                   const exData = await ex.json();
                   if (exData.success && exData.data) {
                     setExamState(exData.data);
                   } else {
                     // Chưa thi! Check popup
                     checkAndShowExamPopup(currentLesson.id);
                   }
                 } catch {}
               }
            }
          }).catch(e => console.log('Lỗi', e));
      }`;

code = code.replace(oldFetch, newFetch);

// 4. Định nghĩa check popup
let oldMarkDone = "const markStepDone = async (stepIdx) => {";
let newMarkDone = `
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

  const markStepDone = async (stepIdx) => {`;
code = code.replace(oldMarkDone, newMarkDone);

// 5. Thay setTimeout ShowCert -> check popup
code = code.replace(
  "setTimeout(() => setShowCert(true), 1000);",
  "setTimeout(() => checkAndShowExamPopup(lesson.id), 1000);"
);

// 6. Nút Chứng chỉ header đổi thành Exam Result check
let headerBtnOld = `{progressData?.isCompleted ? (
            <button onClick={() => setShowCert(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Award size={14}/> Chứng Chỉ
            </button>
          ) : isUnlocked ?`;

let headerBtnNew = `{progressData?.isCompleted ? (
            <button onClick={() => {
              if (!examState) checkAndShowExamPopup(lesson.id);
              else if (examState.status === 'grading') Swal.fire('Đang chấm điểm', 'Giảng viên đang chấm bài tự luận của bạn. Vui lòng quay lại sau.', 'info');
              else if (examState.status === 'graded' && examState.isPassed) setShowCert(true);
              else if (examState.status === 'graded' && !examState.isPassed) Swal.fire('Rất tiếc', 'Bạn chưa qua bài thi. ' + (examState.nextRetakeAllowedAt ? 'Thi lại sau ' + new Date(examState.nextRetakeAllowedAt).toLocaleString() : ''), 'error');
            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              <Award size={14}/> {examState?.isPassed ? 'Chứng Chỉ' : 'Bài Thi Cuối Khóa'}
            </button>
          ) : isUnlocked ?`;
code = code.replace(headerBtnOld, headerBtnNew);

fs.writeFileSync('src/pages/LessonDetailPage.jsx', code);
console.log('Exam Integration Phase 1 Complete!');
