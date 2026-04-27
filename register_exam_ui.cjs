const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('ExamPage')) {
  code = code.replace(
    /import LessonDetailPage from '\.\/pages\/LessonDetailPage';/g,
    `import LessonDetailPage from './pages/LessonDetailPage';\nimport ExamPage from './pages/ExamPage';`
  );
  code = code.replace(
    /<Route path="\/lessons\/:id" element={<LessonDetailPage \/>} \/>/g,
    `<Route path="/lessons/:id" element={<LessonDetailPage />} />\n          <Route path="/exam/:id" element={<ExamPage />} />`
  );
  fs.writeFileSync('src/App.jsx', code);
  console.log('Registered ExamPage in App.jsx');
}
