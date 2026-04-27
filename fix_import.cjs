const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('const ExamPage')) {
  code = code.replace(
    /const LessonDetailPage = lazy\(\(\) => import\('\.\/pages\/LessonDetailPage'\)\)/g,
    `const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage'))\nconst ExamPage = lazy(() => import('./pages/ExamPage'))`
  );
  fs.writeFileSync('src/App.jsx', code);
  console.log('Fixed App.jsx lazy import');
}
