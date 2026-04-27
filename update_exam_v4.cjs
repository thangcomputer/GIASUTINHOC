const fs = require('fs');

let examCode = fs.readFileSync('src/pages/ExamPage.jsx', 'utf8');

// 1. Chèn hook chặn F5 và Cancel button
const cancelLogic = `
  // ─── CHẶN F5 / TẢI LẠI TRANG ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Chặn F5 và Ctrl+R
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
    
    // Gắn thêm sự kiện cảnh báo của trình duyệt (BeforeUnload)
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

if (!examCode.includes('handleCancelExam')) {
  // Inject exactly after fileInputRef
  examCode = examCode.replace(
    /const fileInputRef = useRef\(null\);/g, 
    "const fileInputRef = useRef(null);\n" + cancelLogic
  );
}

// 2. Chèn Nút vào Header.
const headerUI = `<div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HỆ THỐNG THI CUỐI KHÓA
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: 0 }}>Môn: <strong style={{ color: '#fff' }}>{course.title}</strong></p>
          
          {(phase === 'quiz' || phase === 'essay') && (
              <button 
                onClick={handleCancelExam}
                style={{ position: 'absolute', top: '10px', right: '0', padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                <XCircle size={18} /> HỦY BỎ BÀI
              </button>
          )}
        </div>`;

// Replace original header
examCode = examCode.replace(
  /<div style={{ textAlign: 'center', marginBottom: '30px' }}>\s*<h1 style={{ fontSize: '2\.5rem'[\s\S]*?<\/div>/,
  headerUI
);

// Ghi lại
fs.writeFileSync('src/pages/ExamPage.jsx', examCode);
console.log('F5 Blocker & Cancel Button Injected!');
