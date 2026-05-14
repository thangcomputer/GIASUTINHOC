import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { LESSONS, CATEGORIES } from '../data/lessons'
import { BookOpen, Search, Laptop, Globe, Shield, Folder, Clock, List, ArrowRight, MessageSquare, Play, Trophy, Briefcase } from 'lucide-react'
import './LessonsPage.css'
import { studentAuthHeaders } from '../lib/authFetch'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'

export default function LessonsPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [search, setSearch] = useState('')
  const [dbLessons, setDbLessons] = useState(LESSONS)
  const [progressMap, setProgressMap] = useState({}) // courseId → progress data

  // Lấy user
  const user = (() => { try { return JSON.parse(localStorage.getItem('giasu_user') || '{}') } catch { return {} } })()

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => fetchJsonIfOk(res))
      .then((d) => {
        if (d?.success && d.data?.length > 0) {
          setDbLessons(d.data.map(c => ({
            ...c,
            description: c.description || 'Không có mô tả',
            tags: c.tags || [],
            steps: c.steps || []
          })));
        } else if (d === null) {
          console.warn('Không tải được /api/courses (backend tắt hoặc 502). Dùng dữ liệu mẫu trong app.')
        }
      })
      .catch((e) => console.warn('Lỗi mạng khi tải danh sách khóa:', e))

    // Fetch progress của học viên
    if (user?._id) {
      fetch(`/api/progress/${user._id}`, { headers: studentAuthHeaders() })
        .then((r) => fetchJsonIfOk(r))
        .then((d) => {
          if (d?.success && d.data) {
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
              {cat === 'Văn Phòng' && <Briefcase size={18} />}
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
            {filtered.map((lesson, i) => {
              const prog = progressMap[lesson.id]
              const ctaDone = prog?.isCompleted
              const ctaProgress = prog && !prog.isCompleted
              const ctaClass = `lesson-card-ctaBtn${ctaDone ? ' lesson-card-ctaBtn--gold' : ctaProgress ? ' lesson-card-ctaBtn--continue' : ''}`
              let ctaInner = (
                <>
                  <Play size={16} className="lesson-card-ctaIcon" aria-hidden />
                  Bắt đầu học
                </>
              )
              if (ctaDone) {
                ctaInner = (
                  <>
                    <Trophy size={16} className="lesson-card-ctaIcon" aria-hidden />
                    Xem lại &amp; chứng chỉ
                  </>
                )
              } else if (ctaProgress) {
                ctaInner = (
                  <>
                    <Play size={16} className="lesson-card-ctaIcon" fill="currentColor" aria-hidden />
                    Tiếp tục học
                  </>
                )
              }

              return (
                <Link
                  key={lesson.id}
                  to={`/lessons/${lesson.id}`}
                  className="lesson-card"
                  style={{
                    '--lesson-accent': lesson.color || '#6366f1',
                    animationDelay: `${i * 0.06}s`,
                  }}
                  id={`lesson-${lesson.id}`}
                >
                  <span className="lesson-card-shine" aria-hidden />
                  <div className="lesson-card-accent" aria-hidden />

                  <div className="lesson-card-head">
                    <div className="lesson-card-iconPlate">
                      <BookOpen size={22} strokeWidth={2} aria-hidden />
                    </div>
                    <div className="lesson-card-badges">
                      <span className="lesson-card-cat">{lesson.category}</span>
                      <span className="lesson-card-level">
                        <span className="lesson-card-levelDot" />
                        {lesson.level}
                      </span>
                    </div>
                  </div>

                  <h3 className="lesson-title">{lesson.title}</h3>
                  <p className="lesson-desc">{lesson.description}</p>

                  {prog && (
                    <div className="lesson-card-progress">
                      <div className="lesson-card-progressTop">
                        <span className="lesson-card-progressLabel">
                          {prog.isCompleted ? 'Đã hoàn thành' : `Tiến độ ${prog.completedSteps?.length || 0}/${prog.totalSteps || lesson.steps.length} bài`}
                        </span>
                        <span className={`lesson-card-progressPct${prog.isCompleted ? ' is-done' : ''}`}>
                          {prog.progressPct || 0}%
                        </span>
                      </div>
                      <div className="lesson-card-progressBar">
                        <div
                          className={`lesson-card-progressFill${prog.isCompleted ? ' is-done' : ''}`}
                          style={{ width: `${prog.progressPct || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="lesson-tags">
                    {lesson.tags.map(tag => (
                      <span key={tag} className="lesson-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="lesson-card-stats">
                    <span className="lesson-stat">
                      <Clock size={15} strokeWidth={2} aria-hidden />
                      {lesson.duration}
                    </span>
                    <span className="lesson-stat-sep" aria-hidden />
                    <span className="lesson-stat">
                      <List size={15} strokeWidth={2} aria-hidden />
                      {lesson.steps.length} phần
                    </span>
                  </div>

                  {user?._id && lesson.steps.length > 0 ? (
                    <span className={ctaClass}>{ctaInner}</span>
                  ) : (
                    <span className="lesson-card-ctaGhost">
                      Xem chương trình
                      <ArrowRight size={16} strokeWidth={2} aria-hidden />
                    </span>
                  )}
                </Link>
              )
            })}
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
