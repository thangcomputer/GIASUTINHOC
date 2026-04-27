const fs = require('fs');

let apiCode = fs.readFileSync('server/routes/examRoutes.js', 'utf8');

// Thêm import CourseExam
if (!apiCode.includes('import CourseExam')) {
  apiCode = apiCode.replace(
    /import CourseProgress from '\.\.\/models\/CourseProgress\.js';/g,
    "import CourseProgress from '../models/CourseProgress.js';\nimport CourseExam from '../models/CourseExam.js';"
  );
}

// Thêm routes cho CourseExam
const courseExamRoutes = `
// API: Lấy đề thi theo khóa học
router.get('/course/:courseId', async (req, res) => {
  try {
    const examConfig = await CourseExam.findOne({ courseId: req.params.courseId });
    res.json({ success: true, data: examConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Cập nhật đề thi cho khóa học (CMS Admin)
router.post('/course/:courseId', async (req, res) => {
  try {
    const { questions, quizPassScore, essayQuestionTitle, essayQuestion, allowFileUpload } = req.body;
    let examConfig = await CourseExam.findOne({ courseId: req.params.courseId });
    if (!examConfig) {
      examConfig = new CourseExam({ courseId: req.params.courseId });
    }
    
    examConfig.questions = questions || [];
    if (quizPassScore !== undefined) examConfig.quizPassScore = quizPassScore;
    if (essayQuestionTitle !== undefined) examConfig.essayQuestionTitle = essayQuestionTitle;
    if (essayQuestion !== undefined) examConfig.essayQuestion = essayQuestion;
    if (allowFileUpload !== undefined) examConfig.allowFileUpload = allowFileUpload;
    
    await examConfig.save();
    res.json({ success: true, data: examConfig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
`;

if (!apiCode.includes('/course/:courseId')) {
  apiCode = apiCode.replace(
    /export default router;/g,
    courseExamRoutes + '\nexport default router;'
  );
}

// Cập nhật POST /submit để hỗ trợ fail-fast và essay files
let oldSubmit = `    const newExam = new FinalExam({
      studentId,
      courseId,
      quizScore,
      essayAnswer,
      status: 'grading',
      submittedAt: new Date()
    });

    await newExam.save();`;

let newSubmit = `
    const { essayFileUrl, essayFileName, isFailedFast } = req.body;
    
    const newExam = new FinalExam({
      studentId,
      courseId,
      quizScore,
      essayAnswer: essayAnswer || '',
      essayFileUrl: essayFileUrl || '',
      essayFileName: essayFileName || '',
      status: isFailedFast ? 'graded' : 'grading',
      isPassed: false,
      submittedAt: new Date()
    });
    
    if (isFailedFast) {
      newExam.gradedAt = new Date();
      newExam.teacherFeedback = 'Bạn chưa đạt đủ điểm phần Trắc Nghiệm khách quan để bước vào vòng Thực hành.';
      newExam.nextRetakeAllowedAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await newExam.save();`;

if (apiCode.includes(oldSubmit)) {
  apiCode = apiCode.replace(oldSubmit, newSubmit);
}

fs.writeFileSync('server/routes/examRoutes.js', apiCode);
console.log('examRoutes updated for CourseExam and FailFast logic.');
