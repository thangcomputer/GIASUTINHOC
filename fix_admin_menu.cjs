const fs = require('fs');

let dashCode = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

if (!dashCode.includes("id: 'exams'")) {
  dashCode = dashCode.replace(
    /\{ id: 'popups'/g,
    `{ id: 'exams',     icon: <FileText size={20}/>,      label: 'Chấm Bài Thi' },\n      { id: 'popups'`
  );
  
  if (!dashCode.includes("{tab === 'exams'")) {
      dashCode = dashCode.replace(
        /\{tab === 'cms' && \(/g,
        `{tab === 'exams' && <AdminExamTab />}\n          {tab === 'cms' && (`
      );
  }

  // Also verify import
  if (!dashCode.includes("import AdminExamTab")) {
      dashCode = dashCode.replace(
        "import AdminQuizForm from '../components/AdminQuizForm'",
        "import AdminQuizForm from '../components/AdminQuizForm'\nimport AdminExamTab from '../components/AdminExamTab'"
      );
  }

  fs.writeFileSync('src/pages/AdminDashboard.jsx', dashCode);
  console.log("Exams tab injected into AdminDashboard.jsx");
} else {
  console.log("Already injected.");
}
