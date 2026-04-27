const fs = require('fs');
let c = fs.readFileSync('src/pages/ExamPage.jsx', 'utf8');

// 1. Hook F5 & Cancel button logic
const cancelLogic = `
  // ─── CHẶN F5 / TẢI LẠI TRANG ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'F5') || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
         if (phase === 'quiz' || phase === 'essay') {
           e.preventDefault();
           Swal.fire({
             title: 'Cảnh Báo Khảo Thí',
             text: 'Bạn đang làm bài thi. Hành động Tải lại trang (F5) không được phép vì có thể gây mất dữ liệu. Vui lòng hoàn thành quá trình thi!',
             icon: 'warning',
             confirmButtonColor: '#3b82f6',
             confirmButtonText: 'Đã Hiểu'
           });
         }
      }
    };
    const handleBeforeUnload = (e) => {
      if (phase === 'quiz' || phase === 'essay') {
         e.preventDefault();
         e.returnValue = 'Hệ thống đang mở. Việc tải lại sẽ hủy kết quả.';
         return '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [phase]);

  // ─── HỦY BỎ BÀI THI ───
  const handleCancelExam = () => {
    Swal.fire({
      title: 'Hủy Bài Thi?',
      text: 'Bạn có chắc chắn muốn bỏ dở bài thi này không? Hệ thống sẽ ghi nhận điểm Trắc nghiệm là 0 và bạn sẽ rớt lập tức!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Chấp Nhận Hủy',
      cancelButtonText: 'Làm Tiếp'
    }).then((result) => {
      if (result.isConfirmed) {
        submitExamDirectly(true, 0, '', '', '');
      }
    });
  };
`;
if (!c.includes('handleCancelExam')) {
  c = c.replace(/const fileInputRef = useRef\(null\);/, "const fileInputRef = useRef(null);\n" + cancelLogic);
}

// 2. Add HỦY BỎ BÀI button to the bottom of the container
const cancelButtonHtml = `

        {(phase === 'quiz' || phase === 'essay') && (
           <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                onClick={handleCancelExam}
                style={{ padding: '10px 30px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <XCircle size={18} /> HỦY BỎ BÀI THI & CHẤP NHẬN 0 ĐIỂM
              </button>
           </div>
        )}
      </div>
    </div>
  );
}
`;
if (!c.includes('HỦY BỎ BÀI THI & CHẤP NHẬN 0 ĐIỂM')) {
  c = c.replace(/      <\/div>\s*<\/div>\s*\);\s*\}\s*$/, cancelButtonHtml);
}

// 3. Re-render Essay phase to parse ReactQuill HTML
// Currently it renders `courseConfig.essayQuestion` directly inside a div or p. Let's find it.
// The text in ExamPage is usually `<div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #818cf8', marginBottom: '20px', whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>{examConfig.essayQuestion}</div>`
const essayRegex = /<div[^>]*>\{examConfig\.essayQuestion\}<\/div>/;
const newEssayHtml = `<div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #818cf8', marginBottom: '20px', color: '#cbd5e1', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: examConfig.essayQuestion }}></div>`;
if (c.match(essayRegex)) {
   c = c.replace(essayRegex, newEssayHtml);
}

fs.writeFileSync('src/pages/ExamPage.jsx', c);
console.log('ExamPage updated for ReactQuill & Cancel Button!');
