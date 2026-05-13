import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ArrowLeft, Save } from 'lucide-react';
import { adminJsonAuthHeaders } from '../lib/authFetch';

export default function AdminQuizForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    explanation: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.question || formData.options.some(o => !o)) {
      return Swal.fire('Lỗi', 'Vui lòng nhập đầy đủ câu hỏi, chuyên mục và 4 đáp án', 'warning');
    }
    
    try {
      const isEdit = !!initialData?._id;
      const res = await fetch(`/api/quizzes${isEdit ? `/${initialData._id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: adminJsonAuthHeaders(),
        body: JSON.stringify(formData)
      });
      const d = await res.json();
      if (d.success) {
        Swal.fire('Thành công', isEdit ? 'Đã cập nhật câu hỏi' : 'Đã thêm câu hỏi mới', 'success');
        onSave();
      } else {
        Swal.fire('Lỗi', d.message, 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Lỗi kết nối máy chủ', 'error');
    }
  };

  return (
    <div className="glass-card animate-fade-in-up" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <button className="btn-ghost" onClick={onCancel} style={{ padding: '8px' }}><ArrowLeft size={20} /></button>
        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{initialData ? 'Chỉnh sửa Câu hỏi' : 'Tạo Câu hỏi Trắc nghiệm'}</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="settings-field">
          <label>Chuyên đề / Danh mục</label>
          <input className="settings-input" placeholder="VD: Lập trình cơ bản" value={formData.category} onChange={e => handleChange('category', e.target.value)} />
        </div>

        <div className="settings-field">
          <label>Nội dung câu hỏi</label>
          <textarea className="settings-input" style={{ minHeight: '100px', resize: 'vertical' }} placeholder="Nhập câu hỏi..." value={formData.question} onChange={e => handleChange('question', e.target.value)} />
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px' }}>
          <label style={{ display: 'block', marginBottom: '16px', fontWeight: 'bold' }}>Các đáp án (Options)</label>
          {formData.options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <input 
                type="radio" 
                name="correctAnswer" 
                checked={formData.correct === i} 
                onChange={() => handleChange('correct', i)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold', color: formData.correct === i ? '#10b981' : '#fff' }}>{['A','B','C','D'][i]}</span>
              <input 
                className="settings-input" 
                style={{ flex: 1, borderColor: formData.correct === i ? '#10b981' : 'transparent' }} 
                placeholder={`Nhập đáp án ${['A','B','C','D'][i]}`} 
                value={opt} 
                onChange={e => handleOptionChange(i, e.target.value)} 
              />
            </div>
          ))}
          <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '10px' }}>* Chọn nút tròn bên trái để chỉ định đáp án đúng</p>
        </div>

        <div className="settings-field">
          <label>Giải thích đáp án (Tùy chọn hiển thị khi làm sai)</label>
          <textarea className="settings-input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Giải thích vì sao lại chọn đáp án đó..." value={formData.explanation} onChange={e => handleChange('explanation', e.target.value)} />
        </div>

        <button className="btn-primary" onClick={handleSubmit} style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '1.1rem' }}>
          <Save size={20} /> Lưu Dữ Liệu
        </button>
      </div>
    </div>
  );
}
