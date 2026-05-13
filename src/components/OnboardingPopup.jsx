import { useState, useEffect } from 'react'
import { BookOpen, Target, Clock, ChevronRight, X, Sparkles, Check } from 'lucide-react'
import { studentJsonAuthHeaders } from '../lib/authFetch'

const STEPS = [
  {
    id: 'level',
    title: 'Trình độ hiện tại của bạn?',
    subtitle: 'Chúng tôi sẽ cá nhân hóa nội dung giảng dạy phù hợp với bạn.',
    icon: BookOpen,
    field: 'currentLevel',
    options: [
      { value: 'Mới bắt đầu', label: 'Mới bắt đầu', desc: 'Chưa biết gì về tin học văn phòng' },
      { value: 'Cơ bản', label: 'Cơ bản', desc: 'Đã biết dùng Word, Excel cơ bản' },
      { value: 'Nâng cao', label: 'Nâng cao', desc: 'Dùng thành thạo, muốn lấy chứng chỉ' },
    ]
  },
  {
    id: 'goal',
    title: 'Mục tiêu học tập của bạn?',
    subtitle: 'Giúp AI định hướng nội dung và bài tập phù hợp nhất.',
    icon: Target,
    field: 'learningGoals',
    options: [
      { value: 'Nắm vững MOS Word & Excel', label: 'Chứng chỉ MOS', desc: 'Microsoft Office Word, Excel, PowerPoint' },
      { value: 'Thi lấy chứng chỉ IC3', label: 'Chứng chỉ IC3', desc: 'Internet & Computing Core Certification' },
      { value: 'Tìm hiểu Công nghệ AI', label: 'Công nghệ AI', desc: 'AI, ChatGPT, kỹ năng số thời đại mới' },
      { value: 'Ôn tập toàn diện các kỹ năng', label: 'Toàn diện', desc: 'Muốn học hết tất cả các môn' },
    ]
  },
  {
    id: 'time',
    title: 'Thời gian học mỗi ngày?',
    subtitle: 'Để lên kế hoạch lộ trình phù hợp với lịch của bạn.',
    icon: Clock,
    field: 'dailyStudyTime',
    options: [
      { value: '30-60 phút', label: '30-60 phút', desc: 'Học tranh thủ, mỗi ngày một chút' },
      { value: '1-2 giờ', label: '1-2 giờ', desc: 'Có thời gian tương đối, học đều đặn' },
      { value: 'Trên 2 giờ', label: 'Trên 2 giờ', desc: 'Tập trung cao độ, đẩy nhanh tiến độ' },
    ]
  }
]

export default function OnboardingPopup({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [current.field]: value }))
  }

  const handleNext = async () => {
    if (!answers[current.field]) return
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      // Save to DB
      setSaving(true)
      try {
        const user = JSON.parse(localStorage.getItem('giasu_user') || '{}')
        if (user._id) {
          const res = await fetch(`/api/users/${user._id}`, {
            method: 'PUT',
            headers: studentJsonAuthHeaders(),
            body: JSON.stringify({
              currentLevel: answers.currentLevel,
              learningGoals: answers.learningGoals,
            })
          })
          const d = await res.json()
          if (d.success) {
            const updated = { ...user, currentLevel: answers.currentLevel, learningGoals: answers.learningGoals }
            localStorage.setItem('giasu_user', JSON.stringify(updated))
          }
        }
        // Mark onboarding done
        localStorage.setItem('onboarding_done_' + (JSON.parse(localStorage.getItem('giasu_user') || '{}')._id), 'true')
      } catch {}
      setSaving(false)
      onComplete()
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '24px', width: '100%', maxWidth: '520px',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="white" />
              </div>
              <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '0.9rem' }}>Thiết lập lộ trình cá nhân</span>
            </div>
            <span style={{ color: '#475569', fontSize: '0.82rem' }}>Bước {step + 1}/{STEPS.length}</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: '10px', transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <current.icon size={24} color="#6366f1" />
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
              {current.title}
            </h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '24px', marginLeft: '36px' }}>
            {current.subtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {current.options.map(opt => {
              const selected = answers[current.field] === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px', borderRadius: '14px', border: 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    background: selected
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))'
                      : 'rgba(255,255,255,0.04)',
                    outline: selected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    border: selected ? '2px solid #6366f1' : '2px solid #334155',
                    background: selected ? '#6366f1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {selected && <Check size={12} color="white" />}
                  </div>
                  <div>
                    <div style={{ color: selected ? 'white' : '#cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}>
                      {opt.label}
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2px' }}>
                      {opt.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 28px 28px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleNext}
            disabled={!answers[current.field] || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: answers[current.field]
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.06)',
              color: answers[current.field] ? 'white' : '#334155',
              fontWeight: 700, fontSize: '0.95rem',
              transition: 'all 0.2s',
              boxShadow: answers[current.field] ? '0 4px 16px rgba(99,102,241,0.4)' : 'none'
            }}
          >
            {saving ? 'Đang lưu...' : step < STEPS.length - 1 ? 'Tiếp theo' : 'Bắt đầu học'}
            {!saving && <ChevronRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
