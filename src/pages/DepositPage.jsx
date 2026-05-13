import Swal from 'sweetalert2';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import Navbar from '../components/Navbar'
import { useCredits } from '../context/CreditContext'
import {
  CheckCircle, CreditCard, ShieldCheck, Database,
  Zap, Coins, Copy, ArrowLeft, Sparkles, Star, Loader2, AlertTriangle, X,
} from 'lucide-react'
import './DepositPage.css'
import { studentJsonAuthHeaders } from '../lib/authFetch'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'
import { getApiBaseUrl } from '../lib/apiBase'

const BANK_INFO = {
  bank: 'acb',
  accountNo: '4628686',
  accountName: 'PHI VAN THANG',
}

const ICONS = [Database, Zap, ShieldCheck, Sparkles, Star]

function readStudentId() {
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    if (u._id) return u._id
  } catch { /* noop */ }
  try {
    const ui = JSON.parse(localStorage.getItem('user_info') || '{}')
    return ui.id || ui._id || null
  } catch {
    return null
  }
}

function persistCoinsEverywhere(newCoins, coinsAdded) {
  try {
    const uis = localStorage.getItem('user_info')
    if (uis) {
      const uo = JSON.parse(uis)
      uo.credits = newCoins
      uo.coins = newCoins
      localStorage.setItem('user_info', JSON.stringify(uo))
    }
  } catch { /* noop */ }
  try {
    const gs = localStorage.getItem('giasu_user')
    if (gs) {
      const gu = JSON.parse(gs)
      gu.coins = newCoins
      localStorage.setItem('giasu_user', JSON.stringify(gu))
    }
  } catch { /* noop */ }
  localStorage.setItem('user_credits', String(newCoins))
  window.dispatchEvent(new Event('storage'))
}

export default function DepositPage() {
  const { credits, addCredits } = useCredits()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [successPkg, setSuccessPkg] = useState(null)
  const [copied, setCopied] = useState('')
  const [packages, setPackages] = useState([])

  const [checkout, setCheckout] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState('')
  const pollTimerRef = useRef(null)
  const paidDoneRef = useRef(false)
  const selectedPkgRef = useRef(null)

  useEffect(() => {
    selectedPkgRef.current = selected
  }, [selected])

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => {
        if (d?.success && d.data?.coinPackages) {
          setPackages(d.data.coinPackages.map((p, i) => ({
            id: p.id || String(i),
            priceText: p.price,
            amount: p.priceMs || 0,
            credits: p.coins,
            label: p.label,
            popular: i === 1,
            icon: ICONS[i % ICONS.length],
            highlight: p.bonus !== '0%' ? `${p.bonus} Xu thưởng` : p.label,
            color: p.color,
            features: [
              { text: `${p.coins} Xu nạp vào tài khoản`, strong: true },
              { text: 'Sử dụng toàn bộ tính năng AI' },
              { text: 'Không giới hạn thời gian sử dụng' },
            ],
          })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected) {
      setCheckout(null)
      setCheckoutErr('')
      setCheckoutLoading(false)
      paidDoneRef.current = false
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    let cancelled = false
    paidDoneRef.current = false
    setCheckout(null)
    setCheckoutErr('')

    ;(async () => {
      setCheckoutLoading(true)
      const studentId = readStudentId()
      if (!studentId) {
        setCheckoutErr('Vui lòng đăng nhập để tạo mã thanh toán.')
        setCheckoutLoading(false)
        return
      }
      try {
        const res = await fetch('/api/webhooks/payment-session', {
          method: 'POST',
          headers: studentJsonAuthHeaders(),
          body: JSON.stringify({ studentId, planId: selected.id }),
        })
        const d = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok || !d.success) {
          setCheckoutErr(d.message || 'Không tạo được phiên thanh toán')
          return
        }
        setCheckout(d.data)
      } catch (e) {
        if (!cancelled) setCheckoutErr(e.message || 'Lỗi mạng')
      } finally {
        if (!cancelled) setCheckoutLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [selected])

  const finalizePaid = useCallback((data) => {
    if (paidDoneRef.current) return
    paidDoneRef.current = true
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    const pkg = selectedPkgRef.current
    const newCoins = data.currentCoins
    const added = data.coins ?? pkg?.credits
    if (typeof newCoins === 'number') {
      persistCoinsEverywhere(newCoins, added)
      if (typeof added === 'number') addCredits(added)
    }
    setSuccessPkg(pkg)
    setSelected(null)
    setCheckout(null)
    setConfirmed(true)
    Swal.fire({
      icon: 'success',
      title: 'Đã nhận thanh toán',
      text: `Đã cộng ${added} Xu vào tài khoản.`,
      timer: 2800,
      showConfirmButton: false,
    })
  }, [addCredits])

  useEffect(() => {
    if (!checkout?.sessionId || paidDoneRef.current) return

    const pollOnce = async () => {
      try {
        const res = await fetch(
          `/api/webhooks/payment-status?sessionId=${encodeURIComponent(checkout.sessionId)}`,
          { headers: studentJsonAuthHeaders() },
        )
        const d = await res.json().catch(() => ({}))
        if (d.success && d.data?.status === 'paid' && selectedPkgRef.current) {
          finalizePaid(d.data)
        }
      } catch { /* noop */ }
    }

    pollOnce()
    pollTimerRef.current = setInterval(pollOnce, 3000)
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [checkout?.sessionId, finalizePaid])

  useEffect(() => {
    if (!checkout?.sessionId) return
    const API_URL = getApiBaseUrl()
    const socket = io(API_URL, { transports: ['websocket', 'polling'] })
    const sid = checkout.sessionId
    socket.on('coin_update', () => {
      fetch(`/api/webhooks/payment-status?sessionId=${encodeURIComponent(sid)}`, {
        headers: studentJsonAuthHeaders(),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data?.status === 'paid' && String(d.data.sessionId) === sid) {
            finalizePaid(d.data)
          }
        })
        .catch(() => {})
    })
    return () => socket.disconnect()
  }, [checkout?.sessionId, finalizePaid])

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  /** Chỉ dùng khi chưa cấu hình SePay — mô phỏng nạp (dev / demo) */
  const handleDevInstantDeposit = async () => {
    if (!selected) return
    if (checkout?.sepayEnabled) {
      Swal.fire('Thông báo', 'Đã bật SePay — hệ thống sẽ tự cộng xu khi nhận được chuyển khoản. Không cần bấm cộng thủ công.', 'info')
      return
    }
    try {
      const userInfoStr = localStorage.getItem('user_info')
      if (!userInfoStr) return
      const userInfo = JSON.parse(userInfoStr)
      const res = await fetch('/api/billing/deposit', {
        method: 'POST',
        headers: studentJsonAuthHeaders(),
        body: JSON.stringify({
          studentId: userInfo.id,
          planId: selected.id,
          amountCoins: selected.credits,
          amountVND: selected.amount,
          note: `Nạp xu - ${selected.label || 'Gói nạp'} (dev)`,
        }),
      })
      const d = await res.json()
      if (d.success) {
        userInfo.credits = d.currentCoins
        userInfo.coins = d.currentCoins
        localStorage.setItem('user_info', JSON.stringify(userInfo))
        localStorage.setItem('user_credits', String(userInfo.credits))
        addCredits(selected.credits)
        const gs = localStorage.getItem('giasu_user')
        if (gs) {
          const gu = JSON.parse(gs)
          gu.coins = d.currentCoins
          localStorage.setItem('giasu_user', JSON.stringify(gu))
        }
        setSuccessPkg(selected)
        setSelected(null)
        setCheckout(null)
        setConfirmed(true)
      } else {
        Swal.fire('Lỗi', d.message, 'error')
      }
    } catch {
      Swal.fire('Lỗi', 'Không gọi được API nạp xu', 'error')
    }
  }

  const handleSelect = (pkg) => {
    setSelected(pkg)
    setConfirmed(false)
  }

  const qrSrc = checkout
    ? (checkout.qrUrl || (() => {
        const bank = (checkout.bankId || localStorage.getItem('admin_bank_name') || BANK_INFO.bank).toLowerCase()
        const acc = checkout.accountNo || localStorage.getItem('admin_bank_acc') || BANK_INFO.accountNo
        const owner = checkout.accountName || localStorage.getItem('admin_bank_owner') || BANK_INFO.accountName
        if (!acc) return ''
        const addInfo = encodeURIComponent(checkout.ref || `GIASUAI ${selected?.credits}XU`)
        return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=${checkout.amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(owner)}`
      })())
    : ''

  const bankLabel = checkout?.bankId?.toUpperCase() || localStorage.getItem('admin_bank_name') || 'ACB'
  const accNo = checkout?.accountNo || localStorage.getItem('admin_bank_acc') || BANK_INFO.accountNo
  const accName = checkout?.accountName || localStorage.getItem('admin_bank_owner') || BANK_INFO.accountName
  const transferContent = checkout?.ref || (selected ? `GIASUAI ${selected.credits}XU` : '')
  const amountLabel = selected?.priceText || ''

  return (
    <div className="deposit-page">
      <Navbar />

      <div className="container deposit-container">
        <div className="deposit-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} /> Nạp Xu Học Tập
          </span>
          <h1 className="gradient-text">Nạp Xu Gia Sư AI</h1>
          <p style={{ color: '#94a3b8', maxWidth: '540px', margin: '12px auto' }}>
            Chọn gói Xu, quét VietQR hoặc chuyển khoản đúng nội dung — hệ thống tự cộng xu khi nhận được tiền (qua SePay).{' '}
            <Link to="/credits" style={{ color: '#818cf8', fontWeight: 600 }}>Xem xu dùng cho tính năng nào</Link>.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            padding: '12px 24px', borderRadius: '12px', marginTop: '12px',
          }}
          >
            <Coins size={22} color="#6366f1" />
            <span style={{ color: '#cbd5e1' }}>Số dư hiện tại:</span>
            <strong style={{ fontSize: '1.4rem', color: '#fff' }}>{credits} Xu</strong>
          </div>
        </div>

        {!confirmed && (
          <>
            <div className="packages-grid">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`package-card glass-card ${pkg.popular ? 'popular' : ''} ${selected?.id === pkg.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(pkg)}
                  style={{ cursor: 'pointer', outline: selected?.id === pkg.id ? `2px solid ${pkg.color || '#6366f1'}` : 'none' }}
                  role="presentation"
                >
                  {pkg.popular && (
                    <div className="popular-badge">
                      <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Đề xuất
                    </div>
                  )}

                  <div style={{ color: pkg.popular ? '#f59e0b' : '#6366f1', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <pkg.icon size={38} />
                  </div>

                  <h2 style={{ fontSize: '1.9rem', margin: '0 0 4px' }}>{pkg.credits} Xu</h2>

                  <div style={{
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '50px', marginBottom: '10px',
                    background: pkg.popular ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)',
                    color: pkg.popular ? '#f59e0b' : '#818cf8',
                    border: `1px solid ${pkg.popular ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.25)'}`,
                  }}
                  >
                    {pkg.highlight}
                  </div>

                  <div className="pkg-price-tag" style={{ margin: '8px 0 14px' }}>
                    <div className="pkg-price">{pkg.priceText}</div>
                  </div>

                  <ul className="pkg-features" style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '20px' }}>
                    {pkg.features.map((f, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        marginBottom: '10px', fontSize: '0.86rem',
                        color: f.strong ? '#e2e8f0' : '#94a3b8',
                        fontWeight: f.strong ? 700 : 400,
                      }}
                      >
                        <CheckCircle size={14} color={f.strong ? '#10b981' : '#475569'} style={{ marginTop: '2px', flexShrink: 0 }} />
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="btn-primary pkg-btn"
                    onClick={(e) => { e.stopPropagation(); handleSelect(pkg) }}
                    style={{ width: '100%', justifyContent: 'center', background: selected?.id === pkg.id ? 'linear-gradient(135deg,#059669,#10b981)' : undefined }}
                  >
                    {selected?.id === pkg.id ? '✓ Đã chọn' : `Chọn ${pkg.credits} Xu`}
                  </button>
                </div>
              ))}
            </div>

            {selected && (
              <div
                className="modal-overlay"
                onClick={() => setSelected(null)}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
                }}
              >
                <div
                  className="modal-box glass-card deposit-qr-modal"
                  onClick={e => e.stopPropagation()}
                  style={{
                    maxWidth: '440px', width: '100%', padding: '28px 24px', position: 'relative',
                    background: 'linear-gradient(165deg, #0f172a 0%, #111128 100%)', borderRadius: '20px',
                    border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                  }}
                >
                  <button
                    type="button"
                    aria-label="Đóng"
                    onClick={() => setSelected(null)}
                    style={{
                      position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.06)',
                      border: 'none', borderRadius: '10px', color: '#94a3b8', padding: '8px', cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <X size={18} />
                  </button>

                  <h3 style={{ textAlign: 'center', margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                    Quét mã thanh toán (VietQR)
                  </h3>
                  <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', margin: '0 0 18px' }}>
                    {checkout?.sepayEnabled
                      ? 'Đang chờ tiền về — tự cộng xu trong vài giây sau khi chuyển.'
                      : 'Chưa cấu hình SePay — chỉ dùng VietQR + xác nhận thủ công (dev).'}
                  </p>

                  {checkoutLoading && (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      <Loader2 size={36} color="#6366f1" style={{ animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
                      <p style={{ color: '#94a3b8', marginTop: '12px', fontSize: '0.9rem' }}>Đang tạo phiên thanh toán…</p>
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                  )}

                  {checkoutErr && !checkoutLoading && (
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fecaca', fontSize: '0.88rem' }}>
                      {checkoutErr}
                    </div>
                  )}

                  {!checkoutLoading && !checkoutErr && checkout && (
                    <>
                      <div style={{ background: '#fff', padding: '14px', borderRadius: '16px', width: 'fit-content', margin: '0 auto 20px' }}>
                        {qrSrc
                          ? (
                            <img
                              src={qrSrc}
                              alt="Mã QR thanh toán"
                              style={{ width: '228px', height: '228px', display: 'block', borderRadius: '8px' }}
                            />
                            )
                          : (
                            <div style={{ width: 228, height: 228, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>
                              Chưa cấu hình số tài khoản (ACCOUNT_NO). Thêm biến môi trường trên server để hiện QR.
                            </div>
                            )}
                      </div>

                      {[
                        { label: 'Ngân hàng', value: bankLabel, copy: false },
                        { label: 'Số tài khoản', value: accNo, copy: true },
                        { label: 'Chủ tài khoản', value: accName, copy: false },
                        { label: 'Số tiền', value: amountLabel, copy: false },
                        { label: 'Nội dung CK', value: transferContent, copy: true },
                      ].map(row => (
                        <div
                          key={row.label}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <span style={{ color: '#94a3b8', fontSize: '0.86rem', flexShrink: 0 }}>{row.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, justifyContent: 'flex-end' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                            {row.copy && (
                              <button
                                type="button"
                                onClick={() => handleCopy(row.value, row.label)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === row.label ? '#10b981' : '#818cf8', padding: '4px', flexShrink: 0 }}
                              >
                                {copied === row.label ? <CheckCircle size={16} /> : <Copy size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div style={{
                        marginTop: '16px', padding: '12px 14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
                        fontSize: '0.82rem', color: '#fcd34d', lineHeight: 1.55,
                      }}
                      >
                        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>
                          Quét bằng app ngân hàng / Momo để khớp số tiền và nội dung CK.
                          {checkout.sepayEnabled ? ' Sau khi chuyển, không cần bấm gì — hệ thống sẽ tự cộng xu.' : ' Bản dev: dùng nút bên dưới để cộng xu thử (không qua ngân hàng thật).'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
                        <button type="button" className="btn-ghost" onClick={() => setSelected(null)} style={{ flex: 1, padding: '12px', justifyContent: 'center', minWidth: '120px' }}>
                          Đóng
                        </button>
                        {!checkout.sepayEnabled && (
                          <button type="button" className="btn-primary" onClick={handleDevInstantDeposit} style={{ flex: 2, padding: '12px', justifyContent: 'center', minWidth: '160px' }}>
                            Cộng xu (dev)
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {confirmed && (
          <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', padding: '40px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}
            >
              <CheckCircle size={44} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '10px', color: '#10b981' }}>Nạp Xu Thành Công!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '8px' }}>
              Đã cộng <strong style={{ color: '#fff' }}>{successPkg?.credits} Xu</strong> vào tài khoản của bạn.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '28px' }}>
              Số dư hiện tại: <strong style={{ color: '#a5b4fc' }}>{credits} Xu</strong>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} /> Chat AI Ngay
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setSuccessPkg(null); setConfirmed(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Nạp Thêm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
