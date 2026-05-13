import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { PlusCircle, Trash, FileText, CheckCircle, Clock, XCircle, Search, Download, Settings, Edit3, Save } from 'lucide-react';
import { LESSONS } from '../data/lessons';
import { adminJsonAuthHeaders, adminAuthHeaders } from '../lib/authFetch';

export default function AdminExamTab() {
  const [activeTab, setActiveTab] = useState('grading'); // grading | config
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Config tab states
  const [selectedCourseId, setSelectedCourseId] = useState(LESSONS[0]?.id || '');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [courseConfig, setCourseConfig] = useState({ questions: [], quizPassScore: 5, essayQuestionTitle: '', essayQuestion: '', allowFileUpload: true });

  const fetchExams = async () => {
    setLoading(true);
    try {
       const r = await fetch('/api/exams', { headers: adminAuthHeaders() });
       const d = await r.json();
       if (d.success) setExams(d.data);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'grading') fetchExams();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'config' && selectedCourseId) {
       setLoadingConfig(true);
       fetch('/api/exams/course/' + selectedCourseId, { headers: adminAuthHeaders() })
         .then(r => r.json())
         .then(d => {
            if (d.success && d.data) {
               setCourseConfig(d.data);
            } else {
               // init empty
               setCourseConfig({
                  questions: [],
                  quizPassScore: 5,
                  essayQuestionTitle: 'Bài Tập Cuối Khóa ' + (LESSONS.find(l => l.id === selectedCourseId)?.title || ''),
                  essayQuestion: 'Hãy trình bày giải pháp của bạn...',
                  allowFileUpload: true
               });
            }
         }).finally(() => setLoadingConfig(false));
    }
  }, [activeTab, selectedCourseId]);

  const handleCreateOrUpdateConfig = async () => {
    try {
      const res = await fetch('/api/exams/course/' + selectedCourseId, {
         method: 'POST',
         headers: adminJsonAuthHeaders(),
         body: JSON.stringify(courseConfig)
      });
      const d = await res.json();
      if (d.success) Swal.fire('Thành công', 'Đã lưu cấu hình đề thi', 'success');
      else Swal.fire('Lỗi', d.message, 'error');
    } catch(e) {
      Swal.fire('Lỗi', 'Mất kết nối', 'error');
    }
  };

  const handleGrade = async (examId, isCurrentPassed, currentScore, currentFeedback) => {
    const { value: formValues } = await Swal.fire({
      title: 'Chấm Điểm Tự Luận / Thực Hành',
      html: `
        <p style="text-align:left; color:#94a3b8; margin-bottom:8px">Điểm từ 0 đến 10:</p>
        <input id="swal-score" type="number" min="0" max="10" step="0.5" class="swal2-input" placeholder="Điểm tự luận..." style="margin-top:0" value="${currentScore !== undefined ? currentScore : ''}">
        <p style="text-align:left; color:#94a3b8; margin: 16px 0 8px">Lời nhận xét cho học viên:</p>
        <textarea id="swal-feedback" class="swal2-textarea" placeholder="Nhập nhận xét chi tiết để học viên xem lại..." style="margin-top:0; height: 140px; width: 100%; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; border-radius: 6px; box-sizing: border-box;">${currentFeedback || ''}</textarea>

      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Lưu Chấm Điểm',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const score = document.getElementById('swal-score').value;
        const feedback = document.getElementById('swal-feedback').value;
        if (!score) {
          Swal.showValidationMessage('Vui lòng nhập điểm!');
          return false;
        }
        return { score: parseFloat(score), feedback };
      }
    });

    if (formValues) {
       const isPassed = formValues.score >= 5; // Tự luận >= 5 là Đạt

       try {
         const res = await fetch('/api/exams/grade', {
           method: 'POST',
           headers: adminJsonAuthHeaders(),
           body: JSON.stringify({
             examId,
             essayScore: formValues.score,
             teacherFeedback: formValues.feedback,
             isPassed
           })
         });
         const d = await res.json();
         if (d.success) {
           Swal.fire('Thành công!', isPassed ? 'Học viên Đã Tốt Nghiệp!' : 'Học viên đã nhận điểm.', 'success');
           fetchExams();
         }
       } catch(e) {
         Swal.fire('Lỗi', 'Kết nối server thất bại', 'error');
       }
    }
  };

  const handleAllowRetake = async (examId) => {
    const confirm = await Swal.fire({
      title: 'Cấp Quyền Thi Lại?',
      text: 'Xóa bỏ thời gian phạt 24h, cho phép học viên thi lại ngay lập tức?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy bỏ',
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/exams/allow-retake', {
          method: 'POST',
          headers: adminJsonAuthHeaders(),
          body: JSON.stringify({ examId })
        });
        const d = await res.json();
        if (d.success) {
          Swal.fire('Thành công', 'Đã cấp quyền thi lại sớm!', 'success');
          fetchExams();
        } else Swal.fire('Lỗi', d.message, 'error');
      } catch (e) { Swal.fire('Lỗi', 'Kết nối thất bại', 'error'); }
    }
  };

  // Render Cấu Hình
  if (activeTab === 'config') {
    return (
      <div style={{ padding: '24px', background: '#0f172a', color: '#f1f5f9', minHeight: '80vh' }}>
         <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
            <button onClick={() => setActiveTab('grading')} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}>CẤP BẰNG & CHẤM THI</button>
            <button style={{ background: 'transparent', color: '#38bdf8', border: 'none', borderBottom: '2px solid #38bdf8', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}>CẤU HÌNH RA ĐỀ</button>
         </div>

         <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
            <label style={{ fontWeight: 600 }}>Khóa Học Đang RA ĐỀ:</label>
            <select 
              value={selectedCourseId} 
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid #334155', minWidth: '300px' }}
            >
               {LESSONS.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
         </div>

         <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', color: '#38bdf8', marginTop: 0 }}>VÒNG 1: Trắc Nghiệm Tự Động (MCQ)</h3>
            
            <div style={{ marginBottom: '16px' }}>
               <label>Yêu cầu Trắc nghiệm tối thiểu đạt (Cắt Fail-Fast): </label>
               <input type="number" min="1" max="100" value={courseConfig.quizPassScore} onChange={e => setCourseConfig({...courseConfig, quizPassScore: e.target.value})} style={{ padding: '6px', background: '#0f172a', border: '1px solid #334155', color: '#fff', width: '80px', borderRadius: '4px' }} />
               <span style={{ marginLeft: '8px', color: '#64748b' }}>câu (Nhiêu câu trở lên thì pass qua làm Tự luận)</span>
            </div>

            {/* Quản lý mảng questions ... */}
            
             {/* ── QUẢN LÝ CÂU HỎI TRẮC NGHIỆM TRỰC QUAN ── */}
             <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <p style={{ color: '#94a3b8', margin: 0 }}>Danh sách câu hỏi trắc nghiệm (Tự động chấm điểm)</p>
                   <button 
                      onClick={() => setCourseConfig({
                         ...courseConfig, 
                         questions: [...(courseConfig.questions || []), { question: 'Câu hỏi mới?', options: ['A', 'B', 'C', 'D'], correctIndex: 0 }]
                      })}
                      style={{ padding: '8px 16px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                   >
                     <PlusCircle size={16} /> THÊM TRẮC NGHIỆM
                   </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   {(courseConfig.questions || []).map((q, qIndex) => (
                      <div key={qIndex} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Câu {qIndex + 1}</span>
                            <button 
                               onClick={() => {
                                  const newQ = [...courseConfig.questions];
                                  newQ.splice(qIndex, 1);
                                  setCourseConfig({...courseConfig, questions: newQ});
                               }}
                               style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                               <Trash size={16} />
                            </button>
                         </div>
                         <input 
                            value={q.question}
                            onChange={(e) => {
                               const newQ = [...courseConfig.questions];
                               newQ[qIndex].question = e.target.value;
                               setCourseConfig({...courseConfig, questions: newQ});
                            }}
                            placeholder="Nhập nội dung câu hỏi..."
                            style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', marginBottom: '12px' }}
                         />
                         
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {q.options.map((opt, oIndex) => (
                               <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: q.correctIndex === oIndex ? 'rgba(52,211,153,0.1)' : '#0f172a', padding: '8px', borderRadius: '4px', border: q.correctIndex === oIndex ? '1px solid #34d399' : '1px solid #334155' }}>
                                  <input 
                                     type="radio" 
                                     name={`correct-${qIndex}`} 
                                     checked={q.correctIndex === oIndex} 
                                     onChange={() => {
                                        const newQ = [...courseConfig.questions];
                                        newQ[qIndex].correctIndex = oIndex;
                                        setCourseConfig({...courseConfig, questions: newQ});
                                     }}
                                  />
                                  <input 
                                     value={opt}
                                     onChange={(e) => {
                                        const newQ = [...courseConfig.questions];
                                        newQ[qIndex].options[oIndex] = e.target.value;
                                        setCourseConfig({...courseConfig, questions: newQ});
                                     }}
                                     style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none' }}
                                     placeholder={`Lựa chọn ${oIndex + 1}`}
                                  />
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>


            <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', color: '#10b981', marginTop: '40px' }}>VÒNG 2: Bài Tập Tự Luận & Thực Hành</h3>
            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', marginBottom: '8px' }}>Tiêu đề Giao Việc:</label>
               <input 
                  type="text" 
                  value={courseConfig.essayQuestionTitle} 
                  onChange={e => setCourseConfig({...courseConfig, essayQuestionTitle: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
               />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'block', marginBottom: '8px' }}>Mô tả cụ thể / Nội dung Đề bài Tự Luận:</label>
               <textarea 
                  value={courseConfig.essayQuestion} 
                  onChange={e => setCourseConfig({...courseConfig, essayQuestion: e.target.value})}
                  style={{ width: '100%', height: '140px', padding: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '6px' }}
               />
            </div>

            <div style={{ marginBottom: '16px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={courseConfig.allowFileUpload} onChange={e => setCourseConfig({...courseConfig, allowFileUpload: e.target.checked})} />
                  Cho phép Học viên Tải file Đính kèm (Word/Excel/PDF...)
               </label>
            </div>

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
               <button onClick={handleCreateOrUpdateConfig} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  <Save size={18} /> LƯU CHÍNH THỨC VÀO HỆ THỐNG
               </button>
            </div>
         </div>
      </div>
    );
  }

  // Render Chấm Thi
  return (
    <div style={{ padding: '24px', background: '#0f172a', color: '#f1f5f9' }}>
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
         <button style={{ background: 'transparent', color: '#38bdf8', border: 'none', borderBottom: '2px solid #38bdf8', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}>CẤP BẰNG & CHẤM THI</button>
         <button onClick={() => setActiveTab('config')} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}>CẤU HÌNH RA ĐỀ</button>
      </div>

      {loading ? (
         <div>Đang tải dữ liệu phòng ban khảo thí...</div>
      ) : exams.length === 0 ? (
         <div style={{ textAlign: 'center', opacity: 0.6, marginTop: '40px' }}>Hiện tại chưa có bài thi nào được nộp.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {exams.map(ex => {
            const isNeedAdminAction = ex.status === 'grading';
            const courseMeta = LESSONS.find(l => l.id === ex.courseId) || { title: 'Môn chưa xác định' };

            return (
              <div key={ex._id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', background: ex.status === 'graded' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: ex.status === 'graded' ? '#10b981' : '#f59e0b' }}>
                      {ex.status === 'graded' ? 'Đã Chấm Điểm' : '⏱ Cần Chấm & Feedback'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>Môn: <strong style={{color:'#fff'}}>{courseMeta.title}</strong></span>
                  </div>

                  <p style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Học viên Nộp <strong>{ex?.studentId?.name || 'Vô Danh'}</strong></p>
                  
                  {/* Điểm TRẮC NGHIỆM */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding:'12px', borderRadius: '8px', borderLeft: '3px solid #38bdf8', marginBottom: '12px' }}>
                    <span style={{ color:'#94a3b8', fontSize: '0.9rem' }}>Điểm Trắc Nghiệm Mạch Cứng (Khóa):</span>
                    <strong style={{ display:'block', color:'#38bdf8', fontSize: '1.2rem'}}>{ex.quizScore}/10 điểm</strong>
                  </div>

                  {/* Phần TỰ LUẬN */}
                  <div style={{ background: 'rgba(52,211,153,0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(52,211,153,0.3)' }}>
                    <p style={{ margin: '0 0 8px', color: '#34d399', fontWeight: 'bold', fontSize: '0.9rem' }}>BÀI LÀM TỰ LUẬN:</p>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.95rem', minHeight: '60px' }}>
                      {ex.essayAnswer || 'Học viên không viết giải trình (Chỉ đính kèm tệp)'}
                    </div>

                    {ex.essayFileName && (
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', marginTop: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: 600 }}>
                            <FileText size={18} /> {ex.essayFileName}
                          </span>
                          {/* File giả lập data base URI được lưu trên MongoDB -> download bằng cách nhúng attr */}
                          <a href={ex.essayFileUrl} download={ex.essayFileName} style={{ textDecoration:'none', padding: '6px 12px', background: '#3b82f6', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Download size={14} /> TẢI XUỐNG
                          </a>
                       </div>
                    )}
                  </div>
                </div>

                <div style={{ width: '220px', borderLeft: '1px dashed #334155', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                     <div style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>XẾP LOẠI HIỆN TẠI</div>
                     {ex.status === 'grading' ? (
                       <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>CHỜ PHÊ DUYỆT</strong>
                     ) : (
                       <strong style={{ color: ex.isPassed ? '#10b981' : '#ef4444', fontSize: '1.2rem' }}>{ex.isPassed ? '✅ HOA TIÊU (PASS)' : '❌ RỚT (FAIL)'}</strong>
                     )}
                  </div>

                  {isNeedAdminAction ? (
                    <button onClick={() => handleGrade(ex._id, false)} style={{ padding: '16px 0', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <Edit3 size={20} />
                      CHẤM ĐIỂM NGAY
                    </button>
                  ) : (
                    <button onClick={() => handleGrade(ex._id, ex.isPassed, ex.essayScore, ex.teacherFeedback)} style={{ padding: '8px 0', background: 'transparent', color: '#94a3b8', border: '1px dashed #334155', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Edit3 size={14} /> CHẤM LẠI
                    </button>
                  )}

                  {ex.status === 'graded' && !ex.isPassed && (
                    ex.nextRetakeAllowedAt ? (
                      <button onClick={() => handleAllowRetake(ex._id)} style={{ padding: '10px 0', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> CẤP QUYỀN LẠI
                      </button>
                    ) : (
                      <div style={{ padding: '10px 0', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', width: '100%', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <CheckCircle size={15} /> Đã Cấp Quyền
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
