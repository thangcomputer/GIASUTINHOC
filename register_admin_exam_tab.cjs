const fs = require('fs');

// 1. Cập nhật route examRoutes
let apiCode = fs.readFileSync('server/routes/examRoutes.js', 'utf8');
if (!apiCode.includes('/grade')) {
  apiCode += `
// API: Get All Exams
router.get('/', async (req, res) => {
  try {
    const exams = await FinalExam.find({}).populate('studentId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Grade Exam
router.post('/grade', async (req, res) => {
  try {
    const { examId, passed, feedback, essayScore } = req.body;
    const exam = await FinalExam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });
    
    exam.status = 'graded';
    exam.isPassed = passed;
    exam.teacherFeedback = feedback;
    exam.essayScore = essayScore || (passed ? 8 : 4);
    exam.gradedAt = new Date();
    
    if (!passed) {
      exam.nextRetakeAllowedAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }
    
    await exam.save();
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
`;
  fs.writeFileSync('server/routes/examRoutes.js', apiCode);
}

// 2. Chèn AdminDashboard
let dashCode = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// Thêm import AdminExamTab nếu chưa có
if (!dashCode.includes('AdminExamTab')) {
  dashCode = dashCode.replace(
    /import AdminQuizForm from '\.\.\/components\/AdminQuizForm'/g,
    `import AdminQuizForm from '../components/AdminQuizForm'\nimport AdminExamTab from '../components/AdminExamTab'`
  );
  
  // Chèn mục Sidebar (sau BookOpen)
  let oldMenu = `<li className={tab === 'cms' ? 'active' : ''} onClick={() => setTab('cms')}>
            <BookOpen size={20} /> CMS Nội Dung
          </li>`;
  let newMenu = `<li className={tab === 'cms' ? 'active' : ''} onClick={() => setTab('cms')}>
            <BookOpen size={20} /> CMS Nội Dung
          </li>
          <li className={tab === 'exams' ? 'active' : ''} onClick={() => setTab('exams')}>
            <FileText size={20} /> Chấm Bài Thi
          </li>`;
  dashCode = dashCode.replace(oldMenu, newMenu);
  
  // Chèn render content (sau {tab === 'cms' && <div... />})
  let contentTarget = "{tab === 'cms' && (";
  let replacement = `{tab === 'exams' && <AdminExamTab />}\n          {tab === 'cms' && (`;
  dashCode = dashCode.replace(contentTarget, replacement);
  
  fs.writeFileSync('src/pages/AdminDashboard.jsx', dashCode);
}

console.log('Admin Exam Panel linked!');
