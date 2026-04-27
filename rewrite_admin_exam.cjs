const fs = require('fs');
let code = fs.readFileSync('src/components/AdminExamTab.jsx', 'utf8');

// 1. Thêm ReactQuill và CSS của nó. (Quill chạy browser only, vite handle css tốt)
if (!code.includes('import ReactQuill')) {
  code = code.replace(
    "import { FileText, CheckCircle",
    "import ReactQuill from 'react-quill';\nimport 'react-quill/dist/quill.snow.css';\nimport { PlusCircle, Trash, FileText, CheckCircle"
  );
}

// 2. Thay the phan <textarea> JSON cho quiz.
const oldQuizUI = /<div>\s*<p style=\{\{ color: '#94a3b8' \}\}>Dữ liệu JSON câu hỏi trắc nghiệm[\s\S]*?<\/div>/;

const newQuizUI = `
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
                                     name={\`correct-\${qIndex}\`} 
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
                                     placeholder={\`Lựa chọn \${oIndex + 1}\`}
                                  />
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
`;
code = code.replace(oldQuizUI, newQuizUI);

// 3. Thay the phan <textarea> Tự luận thanh <ReactQuill>
const oldEssayUI = /<textarea[\s\S]*?<\/textarea>/;
const newEssayUI = `
               <ReactQuill 
                  theme="snow"
                  value={courseConfig.essayQuestion} 
                  onChange={val => setCourseConfig({...courseConfig, essayQuestion: val})}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  style={{ background: '#0f172a', color: '#fff', borderRadius: '6px', minHeight: '150px' }}
               />
`;
code = code.replace(oldEssayUI, newEssayUI);

fs.writeFileSync('src/components/AdminExamTab.jsx', code);
console.log('AdminExamTab upgraded to V2!');
