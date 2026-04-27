import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { LESSONS, CATEGORIES } from '../data/lessons'
import { BookOpen, Search, Laptop, Globe, Shield, Folder, Clock, List, ArrowRight, MessageSquare, Play, CheckCircle, Trophy } from 'lucide-react'
import './LessonsPage.css'

export default function LessonsPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [dbLessons, setDbLessons] = useState(LESSONS)
  const [progressMap, setProgressMap] = useState({}) // courseId → progress data
  const navigate = useNavigate()

  // Lấy user
  const user = (() => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } })()

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data?.length > 0) {
          setDbLessons(d.data.map(c => ({
            ...c,
            description: c.description || 'Không có mô tả',
            tags: c.tags || [],
            steps: c.steps || []
          })));
        }
      })
      .catch(e => console.log("Lỗi tải data module list:", e));

    // Fetch progress của học viên
    if (user?._id) {
      fetch(`/api/progress/${user._id}`)
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data) {
            const map = {}
            d.data.forEach(p => { map[p.courseId] = p })
            setProgressMap(map)
          }
        })
        .catch(() => {})
    }
  }, [user._id]);

  const filtered = dbLessons.filter(lesson => {
    const matchCat = activeCategory === 'Tất cả' || lesson.category === activeCategory
    const matchSearch = lesson.title.toLowerCase().includes(search.toLowerCase()) ||
      lesson.description.toLowerCase().includes(search.toLowerCase()) ||
      lesson.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  return (
    <div className="lessons-page">
      <Navbar />
      <div className="lessons-hero">
        <div className="container">
          <div className="lessons-hero-content">
            <span className="badge badge-primary" style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}><BookOpen size={16} /> Chương Trình Đào Tạo</span>
            <h1>Định Hướng Học Tập <span className="gradient-text">Chuyên Sâu</span></h1>
            <p>Hệ thống giáo trình được biên soạn độc quyền bởi các chuyên gia tin học trong ngành</p>

            <div className="lessons-search-wrap">
              <div style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b'}}>
                <Search size={20} />
              </div>
              <input
                type="text"
                className="input-field lessons-search"
                style={{paddingLeft: '48px'}}
                placeholder="Tìm kiếm giáo trình... (VD: Excel, MOS, Windows)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="lessons-search"
              />
            </div>
          </div>
        </div>
        <div className="orb orb-purple" style={{ width: 300, height: 300, top: -100, right: -50, opacity: 0.15 }}></div>
      </div>

      <div className="container lessons-content">
        {/* Categories */}
        <div className="categories-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              id={`cat-${cat}`}
              style={{display: 'flex', alignItems: 'center', gap: '8px'}}
            >
              {cat === 'Tất cả' && <Folder size={18} />}
              {cat === 'Cơ Bản' && <Laptop size={18} />}
              {cat === 'Internet' && <Globe size={18} />}
              {cat === 'An Toàn' && <Shield size={18} />}
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="results-info">
          <span style={{fontWeight: 500}}>{filtered.length} chương trình</span>
          {search && <span className="search-tag">Kết quả cho: "{search}" ✕ <button onClick={() => setSearch('')}>Xóa</button></span>}
        </div>

        {/* Lessons Grid */}
        {filtered.length > 0 ? (
          <div className="lessons-grid">
            {filtered.map((lesson, i) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className="lesson-card glass-card"
                style={{ animationDelay: `${i * 0.08}s`, cursor: 'pointer', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                id={`lesson-${lesson.id}`}
              >
                <div className="lesson-card-top">
                  <div
                    className="lesson-icon-big"
                    style={{ background: `${lesson.color}22`, color: lesson.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <BookOpen size={24} />
                  </div>
                  <div className="lesson-card-meta">
                    <span className="badge badge-primary">{lesson.category}</span>
                    <span className="lesson-level">
                      <span className="level-dot" style={{ background: lesson.color }}></span>
                      {lesson.level}
                    </span>
                  </div>
                </div>

                <h3 className="lesson-title">{lesson.title}</h3>
                <p className="lesson-desc">{lesson.description}</p>

                {/* Progress bar nếu đã bắt đầu học */}
                {progressMap[lesson.id] && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {progressMap[lesson.id].isCompleted ? '✅ Đã hoàn thành' : `Tiến độ: ${progressMap[lesson.id].completedSteps?.length || 0}/${progressMap[lesson.id].totalSteps || lesson.steps.length} bài`}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: progressMap[lesson.id].isCompleted ? '#10b981' : '#6366f1', fontWeight: 700 }}>
                        {progressMap[lesson.id].progressPct || 0}%
                      </span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px', width: `${progressMap[lesson.id].progressPct || 0}%`, background: progressMap[lesson.id].isCompleted ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )}

                <div className="lesson-tags">
                  {lesson.tags.map(tag => (
                    <span key={tag} className="lesson-tag">{tag}</span>
                  ))}
                </div>

                <div className="lesson-footer">
                  <span className="lesson-duration" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}><Clock size={14} /> {lesson.duration}</span>
                  <span className="lesson-steps" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}><List size={14} /> {lesson.steps.length} phần</span>
                  {progressMap[lesson.id]?.isCompleted
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem' }}><Trophy size={13} /> Xem chứng chỉ</span>
                    : progressMap[lesson.id]
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#6366f1', fontWeight: 700, fontSize: '0.78rem' }}><Play size={13} fill="currentColor" /> Tiếp tục học</span>
                      : <span className="lesson-cta" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>Chi tiết <ArrowRight size={14} /></span>
                  }
                </div>

                {/* Nút Bắt đầu học nổi bật */}
                {user?._id && lesson.steps.length > 0 && (
                  <button
                    onClick={e => { e.preventDefault(); navigate(`/lessons/${lesson.id}`); }}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: progressMap[lesson.id]?.isCompleted ? 'rgba(245,158,11,0.1)' : progressMap[lesson.id] ? 'rgba(99,102,241,0.12)' : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', color: progressMap[lesson.id]?.isCompleted ? '#f59e0b' : '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.2s' }}
                  >
                    {progressMap[lesson.id]?.isCompleted
                      ? <><Trophy size={15} /> Xem lại &amp; Chứng Chỉ</>
                      : progressMap[lesson.id]
                        ? <><Play size={15} fill="currentColor" /> Tiếp tục học</>
                        : <><Play size={15} fill="currentColor" /> Bắt đầu học</>
                    }
                  </button>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-results glass-card">
            <div className="no-results-emoji" style={{color: '#94a3b8'}}><Search size={48} /></div>
            <h3>Không tìm thấy chuyên đề phù hợp</h3>
            <p>Vui lòng điều chỉnh từ khóa hoặc liên hệ cố vấn AI để nhận giáo trình riêng.</p>
            <Link to="/chat" className="btn-primary" style={{display: 'inline-flex', alignItems: 'center', gap: '8px'}}><MessageSquare size={20} /> Tham vấn Chuyên gia AI</Link>
          </div>
        )}
      </div>
    </div>
  )
}
