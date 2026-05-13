import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getApiBaseUrl } from '../lib/apiBase'

export default function CertificateVerifyPage() {
  const { certificateId } = useParams()
  const [status, setStatus] = useState('loading') // loading | ok | notfound | error
  const [data, setData] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!certificateId?.trim()) {
      setStatus('notfound')
      setMessage('Thiếu mã chứng chỉ.')
      return
    }

    const base = getApiBaseUrl()
    fetch(`${base}/api/progress/certificate/${encodeURIComponent(certificateId.trim())}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (res.ok && json.success && json.data) {
          setData(json.data)
          setStatus('ok')
        } else if (res.status === 404) {
          setStatus('notfound')
          setMessage(json.message || 'Không tìm thấy chứng chỉ hợp lệ.')
        } else {
          setStatus('error')
          setMessage(json.message || 'Không thể xác minh lúc này.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Lỗi kết nối. Vui lòng thử lại sau.')
      })
  }, [certificateId])

  const completedLabel = data?.completedAt
    ? new Date(data.completedAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a0f1e 0%, #1e1b4b 45%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: '32px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Helmet>
        <title>
          {status === 'ok' ? 'Chứng chỉ hợp lệ — Gia Sư Tin Học 24h' : 'Xác minh chứng chỉ — Gia Sư Tin Học 24h'}
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <Link
          to="/"
          style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}
        >
          ← Về trang chủ
        </Link>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Loader2 size={40} color="#6366f1" style={{ animation: 'spin 0.9s linear infinite' }} />
            <p style={{ color: '#94a3b8', marginTop: '16px' }}>Đang xác minh chứng chỉ…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {(status === 'notfound' || status === 'error') && (
          <div
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '16px',
              padding: '28px',
              textAlign: 'center',
            }}
          >
            <XCircle size={48} color="#f87171" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>Không xác minh được</h1>
            <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{message}</p>
            {certificateId && (
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '16px', fontFamily: 'monospace' }}>
                Mã: {certificateId}
              </p>
            )}
          </div>
        )}

        {status === 'ok' && data && (
          <div
            style={{
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(52,211,153,0.35)',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <CheckCircle size={48} color="#34d399" style={{ margin: '0 auto 12px' }} />
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Chứng chỉ hợp lệ</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '8px 0 0' }}>
                Đã xác minh trên hệ thống Gia Sư Tin Học 24h
              </p>
            </div>
            <dl style={{ margin: 0, display: 'grid', gap: '14px' }}>
              <div>
                <dt style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Học viên
                </dt>
                <dd style={{ margin: '4px 0 0', fontWeight: 600, fontSize: '1.05rem' }}>{data.studentName}</dd>
              </div>
              <div>
                <dt style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Khóa học
                </dt>
                <dd style={{ margin: '4px 0 0', fontWeight: 600 }}>{data.courseTitle}</dd>
              </div>
              <div>
                <dt style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Ngày hoàn thành
                </dt>
                <dd style={{ margin: '4px 0 0' }}>{completedLabel}</dd>
              </div>
              <div>
                <dt style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                  Mã chứng chỉ
                </dt>
                <dd style={{ margin: '4px 0 0', fontFamily: 'monospace', fontSize: '0.95rem' }}>{data.certificateId}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
