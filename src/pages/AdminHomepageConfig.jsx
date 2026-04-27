import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Save, AlertCircle, LayoutTemplate, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ANIMATIONS = [
  'none',
  'animate-fade-in-up',
  'animate-slide-in-left',
  'animate-zoom-in'
];

export default function AdminHomepageConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/homepage');
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Failed to load config", error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire('Thành công', 'Đã lưu cấu hình thiết kế Trang chủ', 'success');
      } else {
        Swal.fire('Lỗi', data.message, 'error');
      }
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu, vui lòng thử lại', 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Đang tải...</div>;
  if (!config) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>Không tìm thấy cấu hình</div>;

  const handleHeroChange = (field, value) => {
    setConfig({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const renderAnimationSelect = (sectionKey, label) => (
    <div style={{ marginTop: '10px' }}>
      <label style={{ color: '#a5b4fc', fontSize: '13px', display: 'block', marginBottom: '4px' }}>{label}</label>
      <select 
        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#334155', border: '1px solid #475569', color: '#fff' }}
        value={config[sectionKey]?.animation || 'animate-fade-in-up'}
        onChange={e => setConfig({ ...config, [sectionKey]: { ...config[sectionKey], animation: e.target.value } })}
      >
        {ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
            <LayoutTemplate size={28} color="#6366f1" /> Cấu Hình Trang Chủ Marketing
          </h1>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>1. Khu vực Hero (Đầu trang)</h2>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Dòng 1</label>
                <input type="text" value={config.hero?.titleLine1 || ''} onChange={e => handleHeroChange('titleLine1', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Học Tin Học" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient 1)</label>
                <input type="text" value={config.hero?.titleHighlight1 || ''} onChange={e => handleHeroChange('titleHighlight1', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Thông Minh" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Dòng 2</label>
                <input type="text" value={config.hero?.titleLine2 || ''} onChange={e => handleHeroChange('titleLine2', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Cùng Gia Sư" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient 2)</label>
                <input type="text" value={config.hero?.titleHighlight2 || ''} onChange={e => handleHeroChange('titleHighlight2', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: AI & Chuyên Gia" />
              </div>
            </div>
            
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Phụ đề</label>
              <input type="text" value={config.hero?.subtitle || ''} onChange={e => handleHeroChange('subtitle', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
            </div>

            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Mô tả chi tiết</label>
              <textarea rows={3} value={config.hero?.description || ''} onChange={e => handleHeroChange('description', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', resize: 'vertical' }} />
            </div>

            {renderAnimationSelect('hero', 'Hiệu ứng hiển thị Hero')}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>2. Khu vực Thống kê (Stats)</h2>
          {renderAnimationSelect('stats', 'Hiệu ứng hiển thị Khu vực Thống kê')}
          <div style={{ marginTop: '15px', color: '#94a3b8', fontSize: '14px' }}>
            <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Tạm thời chỉnh sửa dữ liệu thống kê bên trong mã nguồn nếu cần thêm mới.
          </div>
        </div>
        
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>3. Tính năng AI Cốt Lõi</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề</label>
              <input type="text" value={config.aiFeatures?.title || ''} onChange={e => setConfig({...config, aiFeatures: {...config.aiFeatures, title: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
            </div>
            {config.aiFeatures?.items?.map((item, idx) => (
              <div key={idx} style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tính năng {idx + 1}</label>
                <input type="text" value={item.title || ''} onChange={e => { const newItems = [...config.aiFeatures.items]; newItems[idx].title = e.target.value; setConfig({...config, aiFeatures: {...config.aiFeatures, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', marginBottom: '10px' }} placeholder="Tên tính năng" />
                <textarea rows={2} value={item.desc || ''} onChange={e => { const newItems = [...config.aiFeatures.items]; newItems[idx].desc = e.target.value; setConfig({...config, aiFeatures: {...config.aiFeatures, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', resize: 'vertical' }} placeholder="Mô tả" />
              </div>
            ))}
          </div>
          {renderAnimationSelect('aiFeatures', 'Hiệu ứng hiển thị Khu vực Tính năng AI')}
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>4. Phương pháp Học tập</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nhãn nhỏ (vd: Phương Thức Học)</label>
                 <input type="text" value={config.learningMethods?.pillText || ''} onChange={e => setConfig({...config, learningMethods: {...config.learningMethods, pillText: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div />
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề chính</label>
                <input type="text" value={config.learningMethods?.titleLine1 || ''} onChange={e => setConfig({...config, learningMethods: {...config.learningMethods, titleLine1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: 4 Cách Học" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient)</label>
                <input type="text" value={config.learningMethods?.titleHighlight1 || ''} onChange={e => setConfig({...config, learningMethods: {...config.learningMethods, titleHighlight1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Hiệu Quả" />
              </div>
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Phụ đề</label>
              <input type="text" value={config.learningMethods?.subtitle || ''} onChange={e => setConfig({...config, learningMethods: {...config.learningMethods, subtitle: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
            </div>
            {config.learningMethods?.items?.map((item, idx) => (
              <div key={idx} style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phương pháp {idx + 1}</label>
                <input type="text" value={item.title || ''} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].title = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', marginBottom: '10px' }} placeholder="Tên phương pháp" />
                <textarea rows={2} value={item.desc || ''} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].desc = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', resize: 'vertical', marginBottom: '10px' }} placeholder="Mô tả" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <input type="text" value={item.badge || ''} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].badge = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Badge (vd: Phổ Biến Nhất)" />
                  <input type="text" value={item.cta || ''} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].cta = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Nút (vd: Đặt Lịch)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '10px' }}>
                  <select value={item.mediaType || 'icon'} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].mediaType = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }}>
                    <option value="icon">Icon mặc định</option>
                    <option value="image">Hình ảnh</option>
                    <option value="video">Video (MP4)</option>
                  </select>
                  <input type="text" value={item.mediaUrl || ''} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].mediaUrl = e.target.value; setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder={item.mediaType !== 'icon' ? "Nhập đường dẫn URL Hình / Video" : "Không áp dụng cho Icon"} disabled={item.mediaType === 'icon'} />
                </div>
                <textarea rows={3} value={(item.features || []).join('\n')} onChange={e => { const newItems = [...config.learningMethods.items]; newItems[idx].features = e.target.value.split('\n'); setConfig({...config, learningMethods: {...config.learningMethods, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', resize: 'vertical' }} placeholder="Gạch đầu dòng tính năng (mỗi dòng 1 tính năng)" />
              </div>
            ))}
          </div>
          {renderAnimationSelect('learningMethods', 'Hiệu ứng hiển thị Khu vực Phương pháp Học')}
        </div>

        {/* COURSES */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>5. Khu vực Khóa Học</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nhãn nhỏ</label>
                 <input type="text" value={config.coursesSection?.pillText || ''} onChange={e => setConfig({...config, coursesSection: {...config.coursesSection, pillText: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div />
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề (Dòng 1)</label>
                <input type="text" value={config.coursesSection?.titleLine1 || ''} onChange={e => setConfig({...config, coursesSection: {...config.coursesSection, titleLine1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Chọn" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient)</label>
                <input type="text" value={config.coursesSection?.titleHighlight1 || ''} onChange={e => setConfig({...config, coursesSection: {...config.coursesSection, titleHighlight1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Khóa Học" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề (Dòng 2)</label>
                <input type="text" value={config.coursesSection?.titleLine2 || ''} onChange={e => setConfig({...config, coursesSection: {...config.coursesSection, titleLine2: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Phù Hợp" />
              </div>
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Phụ đề</label>
              <input type="text" value={config.coursesSection?.subtitle || ''} onChange={e => setConfig({...config, coursesSection: {...config.coursesSection, subtitle: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>Thẻ Khóa Học Liên Kết hiển thị trang chủ</label>
                <button onClick={() => {
                  const newItems = [...(config.coursesSection?.items || []), { title: 'Khóa Học Mới', level: 'Người mới', rating: '5.0', lessons: '20', duration: '2 tháng', students: '100+', color: '#6366f1', tags: ['Cơ bản'], link: '/lessons' }];
                  setConfig({ ...config, coursesSection: { ...config.coursesSection, items: newItems } });
                }} className="hp-btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>+ Thêm Khóa Học</button>
              </div>
              
              {config.coursesSection?.items?.map((item, idx) => (
                <div key={idx} style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 style={{ color: '#fff', margin: 0 }}>Thẻ Khóa Học {idx + 1}</h4>
                    <button onClick={() => {
                      const newItems = config.coursesSection.items.filter((_, i) => i !== idx);
                      setConfig({ ...config, coursesSection: { ...config.coursesSection, items: newItems } });
                    }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 100px 100px', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" value={item.title || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].title = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Tên Khóa Học" />
                    <input type="text" value={item.level || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].level = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Trình độ" />
                    <input type="color" value={item.color || '#6366f1'} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].color = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155' }} title="Màu thẻ" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" value={item.lessons || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].lessons = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Số bài học" />
                    <input type="text" value={item.duration || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].duration = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Thời lượng" />
                    <input type="text" value={item.students || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].students = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Học viên" />
                    <input type="text" value={item.rating || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].rating = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Đánh giá sao" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
                    <input type="text" value={(item.tags || []).join(', ')} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].tags = e.target.value.split(',').map(s=>s.trim()); setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Các thẻ nổi bật (cách nhau bằng dấu phẩy)" />
                    <input type="text" value={item.link || ''} onChange={e => { const newItems = [...config.coursesSection.items]; newItems[idx].link = e.target.value; setConfig({...config, coursesSection: {...config.coursesSection, items: newItems}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff' }} placeholder="Đường dẫn Link khi chuyển trang" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>6. Khu vực Đánh Giá (Học Viên Nói Gì)</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                 <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nhãn nhỏ</label>
                 <input type="text" value={config.testimonialsSection?.pillText || ''} onChange={e => setConfig({...config, testimonialsSection: {...config.testimonialsSection, pillText: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div />
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề (Dòng 1)</label>
                <input type="text" value={config.testimonialsSection?.titleLine1 || ''} onChange={e => setConfig({...config, testimonialsSection: {...config.testimonialsSection, titleLine1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Học Viên" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient)</label>
                <input type="text" value={config.testimonialsSection?.titleHighlight1 || ''} onChange={e => setConfig({...config, testimonialsSection: {...config.testimonialsSection, titleHighlight1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: Nói Gì" />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Dấu kết thúc</label>
                <input type="text" value={config.testimonialsSection?.titleLine2 || ''} onChange={e => setConfig({...config, testimonialsSection: {...config.testimonialsSection, titleLine2: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} placeholder="VD: ?" />
              </div>
            </div>
            <div style={{ marginTop: '10px', color: '#94a3b8', fontSize: '14px' }}>
              <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Tạm thời chỉnh sửa dữ liệu người bình luận bên trong mã nguồn tĩnh.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>7. Màn Bắt Đầu (Call To Action)</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tiêu đề chính</label>
                <input type="text" value={config.ctaSection?.titleLine1 || ''} onChange={e => setConfig({...config, ctaSection: {...config.ctaSection, titleLine1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Highlight (Màu Gradient)</label>
                <input type="text" value={config.ctaSection?.titleHighlight1 || ''} onChange={e => setConfig({...config, ctaSection: {...config.ctaSection, titleHighlight1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Mô tả kêu gọi</label>
              <textarea rows={2} value={config.ctaSection?.description || ''} onChange={e => setConfig({...config, ctaSection: {...config.ctaSection, description: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nút bấm 1 (Chính)</label>
                <input type="text" value={config.ctaSection?.buttonText1 || ''} onChange={e => setConfig({...config, ctaSection: {...config.ctaSection, buttonText1: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Nút bấm 2 (Phụ)</label>
                <input type="text" value={config.ctaSection?.buttonText2 || ''} onChange={e => setConfig({...config, ctaSection: {...config.ctaSection, buttonText2: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '80px' }}>
          <h2 style={{ color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '20px' }}>8. Chân Trang (Footer)</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Tên Thương Hiệu (Logo Text)</label>
                <input type="text" value={config.footer?.logoText || ''} onChange={e => setConfig({...config, footer: {...config.footer, logoText: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>Slogan / Tagline</label>
                <input type="text" value={config.footer?.tagline || ''} onChange={e => setConfig({...config, footer: {...config.footer, tagline: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ color: '#94a3b8', display: 'block', fontWeight: 'bold' }}>Quản lý Cột thông tin Footer</label>
                <button onClick={() => {
                  const newCols = [...(config.footer?.columns || []), { title: 'Cột mới', content: 'Nội dung cột' }];
                  setConfig({ ...config, footer: { ...config.footer, columns: newCols } });
                }} className="hp-btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>+ Thêm Cột Mới</button>
              </div>

              {/* Dynamic Footer Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                {config.footer?.columns?.map((col, idx) => (
                  <div key={idx} style={{ padding: '15px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ color: '#fff', margin: 0 }}>Cột {idx + 1}</h4>
                      <button onClick={() => {
                        const newCols = config.footer.columns.filter((_, i) => i !== idx);
                        setConfig({ ...config, footer: { ...config.footer, columns: newCols } });
                      }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Xóa Cột">Xóa Cột</button>
                    </div>
                    <input type="text" value={col.title || ''} onChange={e => { const newCols = [...config.footer.columns]; newCols[idx].title = e.target.value; setConfig({...config, footer: {...config.footer, columns: newCols}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', marginBottom: '10px' }} placeholder="Tiêu đề cột (VD: Liên Kết Nhanh)" />
                    <textarea rows={5} value={col.content || ''} onChange={e => { const newCols = [...config.footer.columns]; newCols[idx].content = e.target.value; setConfig({...config, footer: {...config.footer, columns: newCols}}) }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#1e293b', border: '1px solid #334155', color: '#fff', resize: 'vertical' }} placeholder={'Mỗi dòng một mục tương ứng với thẻ p.\n\nĐặc biệt với Cột Links:\nĐể tạo link chuyển trang sử dụng cú pháp: URL [tab] Tên Link\nVD: /chat\tChat với AI'} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '5px', marginTop: '10px' }}>Bản quyền (Copyright)</label>
              <input type="text" value={config.footer?.copyright || ''} onChange={e => setConfig({...config, footer: {...config.footer, copyright: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
