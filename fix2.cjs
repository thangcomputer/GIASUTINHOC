const fs = require('fs');
let text = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf-8');

text = text.replace(
  `// Xử lý trả lời câu hỏi quiz
  const markStepDone = async (stepIdx) => {
    if (!user._id) {
      Swal.fire({ title: 'Vui lòng đăng nhập', text: 'Bạn cần đăng nhập để lưu kết quả học tập và nhận chứng chỉ.', icon: 'warning', confirmButtonColor: '#10b981' });
      return;
    }
    if (markingDone) return;
    const questions = activeCheckpoint.questions || [];`,
  `// Xử lý trả lời câu hỏi quiz
  const handleQuizAnswer = (selectedIndex) => {
    if (!activeCheckpoint) return;
    const questions = activeCheckpoint.questions || [];`
);

text = text.replace(
  `  const markStepDone = async (stepIdx) => {
    if (!user._id || markingDone) return;`,
  `  const markStepDone = async (stepIdx) => {
    if (!user._id) {
      Swal.fire({ title: 'Vui lòng đăng nhập', text: 'Bạn cần đăng nhập để lưu kết quả học tập và nhận chứng chỉ.', icon: 'warning', confirmButtonColor: '#10b981' });
      return;
    }
    if (markingDone) return;`
);

fs.writeFileSync('src/pages/LessonDetailPage.jsx', text);
