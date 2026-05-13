import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { adminJsonAuthHeaders, adminAuthHeaders } from '../lib/authFetch';

export default function AdminCourseForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '', 
    title: '',
    emoji: '📝',
    category: '',
    level: 'Sơ Cấp',
    duration: '15 Phút',
    color: '#6366f1',
    description: '',
    tags: [],
    steps: []
  });

  const [tagInput, setTagInput] = useState('');
  const [expandedCheckpoints, setExpandedCheckpoints] = useState({}); // { stepIdx-cpIdx: true }

  useEffect(() => {
    if (initialData) {
      const normalizedData = {
        ...initialData,
        steps: (initialData.steps || []).map(s => {
          let checkpoints = Array.isArray(s.quizCheckpoints) ? s.quizCheckpoints : [];
          // Migrate: cấu trúc cũ (từng question/options/correctIndex trực tiếp trên checkpoint)
          checkpoints = checkpoints.map(cp => {
            if (cp.question && !cp.questions) {
              return { timeInSeconds: cp.timeInSeconds, questions: [{ question: cp.question, options: cp.options || [], correctIndex: cp.correctIndex ?? 0, type: 'mcq', acceptableAnswers: [], hint: '', explanation: '' }] };
            }
            return {
              timeInSeconds: cp.timeInSeconds || '',
              questions: Array.isArray(cp.questions)
                ? cp.questions.map(q => ({
                    ...q,
                    type: q.type || (q.options?.length >= 2 ? 'mcq' : 'text'),
                    acceptableAnswers: Array.isArray(q.acceptableAnswers) ? q.acceptableAnswers : (typeof q.acceptableAnswers === 'string' ? q.acceptableAnswers.split(',').map(s => s.trim()).filter(Boolean) : []),
                    hint: q.hint || '',
                    explanation: q.explanation || '',
                  }))
                : [],
            };
          });
          // Migrate: cấu trúc rất cũ (quizTime trực tiếp trên step)
          if (checkpoints.length === 0 && s.quizTime) {
            checkpoints = [{ timeInSeconds: s.quizTime, questions: [{ question: s.quizQuestion || '', options: Array.isArray(s.quizOptions) ? s.quizOptions : [], correctIndex: s.quizCorrectIndex ?? 0, type: 'mcq', acceptableAnswers: [], hint: '', explanation: '' }] }];
          }
          return {
            title: s.title || '', content: s.content || '', videoUrl: s.videoUrl || '', tip: s.tip || '', exercise: s.exercise || '', quizCheckpoints: checkpoints,
            learningObjectives: Array.isArray(s.learningObjectives) ? s.learningObjectives : [],
            summaryBullets: Array.isArray(s.summaryBullets) ? s.summaryBullets : [],
            chapters: Array.isArray(s.chapters) ? s.chapters.map(ch => ({ title: ch.title || '', timeInSeconds: Number(ch.timeInSeconds) || 0 })) : [],
            transcript: s.transcript || '',
          };
        })
      };
      setFormData(normalizedData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ─── Xử lý Tag ───
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };
  const removeTag = (t) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== t) }));
  };

  // ─── Xử lý Steps (Nội dung Bài Học) ───
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { title: 'Bài mới', content: '', videoUrl: '', tip: '', exercise: '', quizCheckpoints: [], learningObjectives: [], summaryBullets: [], chapters: [], transcript: '' }]
    }));
  };
  
  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // ─── Xử lý Quiz Checkpoints ───
  const addCheckpoint = (stepIdx) => {
    const newSteps = [...formData.steps];
    if (!newSteps[stepIdx].quizCheckpoints) newSteps[stepIdx].quizCheckpoints = [];
    newSteps[stepIdx].quizCheckpoints.push({ timeInSeconds: '', questions: [{ question: '', options: [], correctIndex: 0, type: 'mcq', acceptableAnswers: [], hint: '', explanation: '' }] });
    setFormData(prev => ({ ...prev, steps: newSteps }));
    const newIdx = newSteps[stepIdx].quizCheckpoints.length - 1;
    setExpandedCheckpoints(prev => ({ ...prev, [`${stepIdx}-${newIdx}`]: true }));
  };

  const removeCheckpoint = (stepIdx, cpIdx) => {
    const newSteps = [...formData.steps];
    newSteps[stepIdx].quizCheckpoints.splice(cpIdx, 1);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const handleCheckpointTimeChange = (stepIdx, cpIdx, value) => {
    const newSteps = [...formData.steps];
    newSteps[stepIdx].quizCheckpoints[cpIdx].timeInSeconds = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // ─── Xử lý Questions trong Checkpoint ───
  const addQuestion = (stepIdx, cpIdx) => {
    const newSteps = [...formData.steps];
    if (!newSteps[stepIdx].quizCheckpoints[cpIdx].questions) newSteps[stepIdx].quizCheckpoints[cpIdx].questions = [];
    newSteps[stepIdx].quizCheckpoints[cpIdx].questions.push({ question: '', options: [], correctIndex: 0, type: 'mcq', acceptableAnswers: [], hint: '', explanation: '' });
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const removeQuestion = (stepIdx, cpIdx, qIdx) => {
    const newSteps = [...formData.steps];
    newSteps[stepIdx].quizCheckpoints[cpIdx].questions.splice(qIdx, 1);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const handleQuestionChange = (stepIdx, cpIdx, qIdx, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[stepIdx].quizCheckpoints[cpIdx].questions[qIdx][field] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const toggleCheckpoint = (stepIdx, cpIdx) => {
    const key = `${stepIdx}-${cpIdx}`;
    setExpandedCheckpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addChapter = (stepIdx) => {
    const newSteps = [...formData.steps];
    if (!newSteps[stepIdx].chapters) newSteps[stepIdx].chapters = [];
    newSteps[stepIdx].chapters.push({ title: '', timeInSeconds: 0 });
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };
  const removeChapter = (stepIdx, chIdx) => {
    const newSteps = [...formData.steps];
    newSteps[stepIdx].chapters.splice(chIdx, 1);
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };
  const handleChapterChange = (stepIdx, chIdx, field, value) => {
    const newSteps = [...formData.steps];
    if (!newSteps[stepIdx].chapters) newSteps[stepIdx].chapters = [];
    newSteps[stepIdx].chapters[chIdx][field] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // ─── Gửi Data ───
  const handleSubmit = async () => {
    if (!formData.id || !formData.title || !formData.category) {
      return Swal.fire('Lỗi', 'Vui lòng nhập Mã ID, Tiêu đề và Chuyên mục!', 'warning');
    }

    try {
      const isEdit = !!initialData?._id;
      const res = await fetch(`/api/courses${isEdit ? `/${initialData.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const d = await res.json();
      if (d.success) {
        Swal.fire('Thành công', isEdit ? 'Đã cập nhật bài học' : 'Đã tạo bài học mới', 'success');
        onSave();
      } else {
        Swal.fire('Lỗi API', d.message, 'error');
      }
    } catch (e) {
      Swal.fire('Lỗi', 'Lỗi kết nối Server', 'error');
    }
  };

  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: '30px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button className="btn-ghost" onClick={onCancel} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}><ArrowLeft size={20} /></button>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{initialData ? '✏️ Chỉnh Sửa Khóa Học' : '🎓 Thiết Kế Khóa Học Mới'}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Thêm module, quiz trắc nghiệm và nội dung giảng dạy</p>
        </div>
      </div>

      {/* ═══ THÔNG TIN NHANH ═══ */}
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ width: '5px', height: '18px', borderRadius: '3px', background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          <span style={{ fontSize: '0.9rem', color: '#c4b5fd', fontWeight: 700 }}>Thông Tin Khóa Học</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Mã ID</label><input className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.id} onChange={e => handleChange('id', e.target.value)} disabled={!!initialData} placeholder="vd: hoc-excel" /></div>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Tiêu đề</label><input className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="Tên khóa học" /></div>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Chuyên mục</label><input className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.category} onChange={e => handleChange('category', e.target.value)} placeholder="Tin học" /></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Cấp độ</label><select className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.level} onChange={e => handleChange('level', e.target.value)}><option>Căn bản</option><option>Sơ Cấp</option><option>Trung Cấp</option><option>Chuyên Sâu</option></select></div>
            <div style={{ width: '65px' }}><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Emoji</label><input className="settings-input" style={{ textAlign: 'center', fontSize: '1.1rem' }} value={formData.emoji} onChange={e => handleChange('emoji', e.target.value)} /></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: '12px' }}>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Thời lượng</label><input className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.duration} onChange={e => handleChange('duration', e.target.value)} placeholder="30 Phút" /></div>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Màu chủ đạo</label><div style={{ display: 'flex', gap: '6px' }}><input type="color" value={formData.color} onChange={e => handleChange('color', e.target.value)} style={{ width: '36px', height: '34px', padding: 0, cursor: 'pointer', borderRadius: '6px', border: '2px solid rgba(255,255,255,0.1)' }} /><input className="settings-input" style={{ flex: 1, fontSize: '0.85rem' }} value={formData.color} onChange={e => handleChange('color', e.target.value)} /></div></div>
          <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Mô tả ngắn</label><input className="settings-input" style={{ fontSize: '0.88rem' }} value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Mô tả 1 dòng..." /></div>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tags:</span>
          {formData.tags.map(tag => (<span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', fontSize: '0.72rem', color: '#a5b4fc', cursor: 'pointer' }} onClick={() => removeTag(tag)}>{tag} <span style={{ fontSize: '8px', opacity: 0.6 }}>✕</span></span>))}
          <input className="settings-input" style={{ width: '120px', fontSize: '0.78rem', padding: '3px 10px', borderRadius: '20px' }} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="+ tag mới" />
        </div>
      </div>

      {/* ═══ NỘI DUNG GIẢNG DẠY ═══ */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '5px', height: '18px', borderRadius: '3px', background: 'linear-gradient(180deg, #10b981, #059669)' }} />
            <span style={{ fontSize: '0.95rem', color: '#6ee7b7', fontWeight: 700 }}>Nội Dung Giảng Dạy</span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '20px' }}>{formData.steps.length} module</span>
          </div>
          <button onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}><Plus size={15} /> Thêm Module</button>
        </div>

        {formData.steps.length === 0 && (<div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0', border: '2px dashed rgba(16,185,129,0.15)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}><p style={{ margin: 0 }}>📭 Chưa có module nào.</p><p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#475569' }}>Bấm "Thêm Module" để bắt đầu.</p></div>)}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formData.steps.map((step, idx) => (
            <div key={idx} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(30,41,59,0.4))', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>{idx + 1}</div>
                  <input className="settings-input" style={{ border: 'none', background: 'transparent', fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', padding: '4px 8px', width: '280px' }} placeholder="Tên Module..." value={step.title} onChange={e => handleStepChange(idx, 'title', e.target.value)} />
                </div>
                <button onClick={() => removeStep(idx)} style={{ padding: '5px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={13} /></button>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', display: 'block' }}>🎬 Video</label><div style={{ display: 'flex', gap: '8px' }}><input className="settings-input" style={{ flex: 1, fontSize: '0.85rem' }} placeholder="Link YouTube / MP4..." value={step.videoUrl || ''} onChange={e => handleStepChange(idx, 'videoUrl', e.target.value)} /><label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, color: '#c4b5fd', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', whiteSpace: 'nowrap' }}>📁 Tải lên<input type="file" accept="video/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files[0]; if (!file) return; Swal.fire({ title: 'Đang tải...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); const fd = new FormData(); fd.append('video', file); try { const res = await fetch('/api/courses/upload-video', { method: 'POST', headers: adminAuthHeaders(), body: fd }); const d = await res.json(); if (d.success) { handleStepChange(idx, 'videoUrl', d.url); Swal.fire('OK', 'Đã tải!', 'success'); } else Swal.fire('Lỗi', d.message, 'error'); } catch { Swal.fire('Lỗi', 'Mất kết nối', 'error'); } }} /></label></div></div>

                <div style={{ padding: '12px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc' }}>🎯 Trải nghiệm học (mục tiêu, chương, phụ đề)</span>
                  <div><label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Mục tiêu sau module (mỗi dòng một mục tiêu)</label><textarea className="settings-input" style={{ minHeight: '72px', fontSize: '0.83rem', marginTop: '4px' }} placeholder="Ví dụ: Nhận biết phím Enter trên bàn phím" value={(step.learningObjectives || []).join('\n')} onChange={e => handleStepChange(idx, 'learningObjectives', e.target.value.split('\n').map(l => l.trim()).filter(Boolean))} /></div>
                  <div><label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Tóm tắt cuối module (mỗi dòng một ý)</label><textarea className="settings-input" style={{ minHeight: '64px', fontSize: '0.83rem', marginTop: '4px' }} placeholder="3 bullet ôn nhanh..." value={(step.summaryBullets || []).join('\n')} onChange={e => handleStepChange(idx, 'summaryBullets', e.target.value.split('\n').map(l => l.trim()).filter(Boolean))} /></div>
                  <div><label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Transcript / phụ đề (plain text, học viên có thể tìm trong bài)</label><textarea className="settings-input" style={{ minHeight: '100px', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'inherit' }} placeholder="Dán lời thoại hoặc ghi chú..." value={step.transcript || ''} onChange={e => handleStepChange(idx, 'transcript', e.target.value)} /></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}><label style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Mốc chương trong video (nhảy thời gian)</label><button type="button" onClick={() => addChapter(idx)} style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '8px', border: '1px dashed rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', cursor: 'pointer' }}><Plus size={12} /> Thêm mốc</button></div>
                    {(step.chapters || []).map((ch, chIdx) => (
                      <div key={chIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input className="settings-input" style={{ flex: 1, fontSize: '0.82rem' }} placeholder="Tên chương" value={ch.title || ''} onChange={e => handleChapterChange(idx, chIdx, 'title', e.target.value)} />
                        <input className="settings-input" type="number" style={{ width: '88px', fontSize: '0.82rem' }} placeholder="Giây" value={ch.timeInSeconds ?? ''} onChange={e => handleChapterChange(idx, chIdx, 'timeInSeconds', e.target.value === '' ? 0 : Number(e.target.value))} />
                        <button type="button" onClick={() => removeChapter(idx, chIdx)} style={{ padding: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz */}
                <div style={{ padding: '12px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (step.quizCheckpoints || []).length > 0 ? '10px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ fontSize: '0.8rem' }}>⏱</span><span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>Quiz</span><span style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '1px 7px', borderRadius: '10px' }}>{(step.quizCheckpoints || []).length}</span></div>
                    <button type="button" onClick={() => addCheckpoint(idx)} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 9px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '7px', color: '#fbbf24', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}><Plus size={11} /> Điểm dừng</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {(step.quizCheckpoints || []).map((cp, cpIdx) => {
                      const cpKey = `${idx}-${cpIdx}`;
                      const isExp = expandedCheckpoints[cpKey];
                      const qc = (cp.questions || []).length;
                      return (<div key={cpIdx} style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div onClick={() => toggleCheckpoint(idx, cpIdx)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', cursor: 'pointer', userSelect: 'none' }}>
                          {isExp ? <ChevronDown size={13} color="#f59e0b" /> : <ChevronRight size={13} color="#64748b" />}
                          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: isExp ? '#fbbf24' : '#94a3b8' }}>⏱ {cp.timeInSeconds || '?'}s</span>
                          <span style={{ fontSize: '0.68rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '8px' }}>{qc} câu</span>
                          <span style={{ flex: 1 }} />
                          <button type="button" onClick={e => { e.stopPropagation(); removeCheckpoint(idx, cpIdx); }} style={{ padding: '2px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}><Trash2 size={11} /></button>
                        </div>
                        {isExp && (<div style={{ padding: '8px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ maxWidth: '140px' }}><label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Giây dừng</label><input className="settings-input" type="number" style={{ fontSize: '0.85rem' }} placeholder="30" value={cp.timeInSeconds || ''} onChange={e => handleCheckpointTimeChange(idx, cpIdx, e.target.value ? Number(e.target.value) : '')} /></div>
                          {(cp.questions || []).map((q, qIdx) => {
                            const qt = q.type || 'mcq';
                            return (<div key={qIdx} style={{ padding: '8px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '7px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a5b4fc' }}>Câu {qIdx + 1}</span><button type="button" onClick={() => removeQuestion(idx, cpIdx, qIdx)} style={{ padding: '1px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={10} /></button></div>
                            <div style={{ marginBottom: '6px' }}>
                              <label style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Dạng câu</label>
                              <select className="settings-input" style={{ fontSize: '0.8rem', padding: '6px 8px' }} value={qt} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'type', e.target.value)}>
                                <option value="mcq">Trắc nghiệm</option>
                                <option value="text">Nhập đáp án (Enter, từ khóa…)</option>
                                <option value="order">Kéo thả thứ tự</option>
                              </select>
                            </div>
                            <input className="settings-input" style={{ marginBottom: '4px', fontSize: '0.83rem' }} placeholder="Câu hỏi..." value={q.question || ''} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'question', e.target.value)} />
                            {qt === 'text' && (
                              <input className="settings-input" style={{ marginBottom: '4px', fontSize: '0.83rem' }} placeholder="Đáp án đúng (nhiều từ, cách nhau bởi phẩy)" value={Array.isArray(q.acceptableAnswers) ? q.acceptableAnswers.join(', ') : ''} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'acceptableAnswers', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            )}
                            {(qt === 'mcq' || qt === 'order') && (
                            <input className="settings-input" style={{ marginBottom: '4px', fontSize: '0.83rem' }} placeholder={qt === 'order' ? 'Các bước / dòng (phẩy) — thứ tự đúng = thứ tự bạn nhập' : 'A, B, C, D (phẩy)'} value={Array.isArray(q.options) ? q.options.join(', ') : ''} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'options', e.target.value.split(',').map(s => s.trim()))} />
                            )}
                            {qt === 'mcq' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}><label style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Đáp án đúng (index):</label><input className="settings-input" type="number" style={{ width: '45px', fontSize: '0.83rem', padding: '3px 6px' }} value={q.correctIndex ?? 0} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'correctIndex', Number(e.target.value))} /></div>
                            )}
                            <input className="settings-input" style={{ fontSize: '0.8rem', marginBottom: '6px' }} placeholder="Gợi ý sau lần sai thứ nhất (tuỳ chọn)" value={q.hint || ''} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'hint', e.target.value)} />
                            <textarea className="settings-input" style={{ fontSize: '0.78rem', minHeight: '56px', resize: 'vertical' }} placeholder="Giải thích ngắn sau lần sai đầu (tại sao đáp án đúng)" value={q.explanation || ''} onChange={e => handleQuestionChange(idx, cpIdx, qIdx, 'explanation', e.target.value)} />
                          </div>);
                          })}
                          <button type="button" onClick={() => addQuestion(idx, cpIdx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '5px', background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '7px', color: '#818cf8', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}><Plus size={11} /> Thêm câu hỏi</button>
                        </div>)}
                      </div>);
                    })}
                  </div>
                </div>

                <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', display: 'block' }}>📝 Nội dung</label><textarea className="settings-input" style={{ minHeight: '90px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.83rem' }} placeholder="Markdown / HTML..." value={step.content} onChange={e => handleStepChange(idx, 'content', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>💡 Mẹo</label><input className="settings-input" style={{ fontSize: '0.83rem' }} placeholder="Tip..." value={step.tip} onChange={e => handleStepChange(idx, 'tip', e.target.value)} /></div>
                  <div><label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>🏋️ Bài tập</label><input className="settings-input" style={{ fontSize: '0.83rem' }} placeholder="Thực hành..." value={step.exercise} onChange={e => handleStepChange(idx, 'exercise', e.target.value)} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ACTION ═══ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button onClick={onCancel} style={{ padding: '11px 22px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>Hủy Bỏ</button>
        <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 26px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}><Save size={17} /> Lưu Khóa Học</button>
      </div>
      </div>
    </div>
  );
}
