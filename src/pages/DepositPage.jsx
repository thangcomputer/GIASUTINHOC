import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useCredits } from '../context/CreditContext'
import {
  CheckCircle, CreditCard, ShieldCheck, Database,
  Zap, Coins, Copy, ArrowLeft, Sparkles, Star
} from 'lucide-react'
import './DepositPage.css'
import { studentJsonAuthHeaders } from '../lib/authFetch'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'

const BANK_INFO = {
  bank: 'ACB',
  accountNo: '4628686',
  accountName: 'PHI VAN THANG',
}

const ICONS = [Database, Zap, ShieldCheck, Sparkles, Star]

export default function DepositPage() {
  const { credits, addCredits } = useCredits()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState('')
  const [packages, setPackages] = useState([])

  // Lấy cài đặt Server
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
            highlight: p.bonus !== '0%' ? p.bonus + ' Xu thưởng' : p.label,
            color: p.color,
            features: [
              { text: `${p.coins} Xu nạp vào tài khoản`, strong: true },
              { text: `Sử dụng toàn bộ tính năng AI` },
              { text: `Không giới hạn thời gian sử dụng` }
            ]
         })))
      }
    })
      .catch(() => {})
  }, [])

  const handleSelect = (pkg) => {
    setSelected(pkg)
    setConfirmed(false)
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  // Demo: cộng Xu qua API
  const handleConfirm = async () => {
    if (!selected) return

    try {
      const userInfoStr = localStorage.getItem('user_info')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        
        // Gọi API nạp tiền thực tế
        const res = await fetch('/api/billing/deposit', {
          method: 'POST',
          headers: studentJsonAuthHeaders(),
          body: JSON.stringify({
             studentId: userInfo.id,
             planId: selected.id,
             amountCoins: selected.credits,
             amountVND: selected.amount,
             note: `Nạp xu - ${selected.label || 'Gói nạp'}`
          })
        });
        const d = await res.json();
        
        if (d.success) {
           userInfo.credits = d.currentCoins;
           localStorage.setItem('user_info', JSON.stringify(userInfo));
           localStorage.setItem('user_credits', String(userInfo.credits));
           addCredits(selected.credits); // Update react context
           
           const usersStr = localStorage.getItem('giasuai_users')
           if (usersStr) {
             const users = JSON.parse(usersStr)
             const idx = users.findIndex(u => u.id === userInfo.id)
             if (idx !== -1) {
               users[idx].credits = userInfo.credits
               localStorage.setItem('giasuai_users', JSON.stringify(users))
             }
           }
        } else {
           Swal.fire('Lỗi nạp xu: ' + d.message);
           return;
        }
      }
    } catch {}

    setConfirmed(true)
  }

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
            Chọn gói Xu phù hợp, chuyển khoản theo thông tin bên dưới và xác nhận để sử dụng ngay.{' '}
            <Link to="/credits" style={{ color: '#818cf8', fontWeight: 600 }}>Xem xu dùng cho tính năng nào</Link>.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            padding: '12px 24px', borderRadius: '12px', marginTop: '12px'
          }}>
            <Coins size={22} color="#6366f1" />
            <span style={{ color: '#cbd5e1' }}>Số dư hiện tại:</span>
            <strong style={{ fontSize: '1.4rem', color: '#fff' }}>{credits} Xu</strong>
          </div>
        </div>

        {/* Gói Xu */}
        {!confirmed && (
          <>
            <div className="packages-grid">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`package-card glass-card ${pkg.popular ? 'popular' : ''} ${selected?.id === pkg.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(pkg)}
                  style={{ cursor: 'pointer', outline: selected?.id === pkg.id ? `2px solid ${pkg.color || '#6366f1'}` : 'none' }}
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

                  {/* Highlight badge (ưu đãi / gói) */}
                  <div style={{
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '50px', marginBottom: '10px',
                    background: pkg.popular ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)',
                    color: pkg.popular ? '#f59e0b' : '#818cf8',
                    border: `1px solid ${pkg.popular ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.25)'}`,
                  }}>
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
                      }}>
                        <CheckCircle size={14} color={f.strong ? '#10b981' : '#475569'} style={{ marginTop: '2px', flexShrink: 0 }} />
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn-primary pkg-btn"
                    onClick={(e) => { e.stopPropagation(); handleSelect(pkg) }}
                    style={{ width: '100%', justifyContent: 'center', background: selected?.id === pkg.id ? 'linear-gradient(135deg,#059669,#10b981)' : undefined }}
                  >
                    {selected?.id === pkg.id ? '✓ Đã chọn' : `Chọn ${pkg.credits} Xu`}
                  </button>
                </div>
              ))}
            </div>

        {/* Thông tin chuyển khoản (Popup Modal) */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-box glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%', padding: '24px', position: 'relative', margin: 'auto', background: '#111128', borderRadius: '24px' }}>
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: '#94a3b8', fontSize: '1.2rem' }}>✕</button>
              
              <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '1.2rem', color: '#a5b4fc' }}>
                Quét Mã Trả Toán (VietQR)
              </h3>

              {/* QR Code Container */}
              <div style={{ background: '#fff', padding: '12px', borderRadius: '16px', width: 'fit-content', margin: '0 auto 20px' }}>
                <img 
                  src={`https://img.vietqr.io/image/${localStorage.getItem('admin_bank_name') || BANK_INFO.bank}-${localStorage.getItem('admin_bank_acc') || BANK_INFO.accountNo}-compact2.png?amount=${selected.amount}&addInfo=GIASUAI%20${selected.credits}XU&accountName=${encodeURIComponent(localStorage.getItem('admin_bank_owner') || BANK_INFO.accountName)}`} 
                  alt="Mã QR Thanh Toán" 
                  style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
                />
              </div>

              {[
                { label: 'Ngân hàng', value: localStorage.getItem('admin_bank_name') || BANK_INFO.bank },
                { label: 'Số tài khoản', value: localStorage.getItem('admin_bank_acc') || BANK_INFO.accountNo, copy: true },
                { label: 'Chủ tài khoản', value: localStorage.getItem('admin_bank_owner') || BANK_INFO.accountName },
                { label: 'Số tiền', value: selected.priceText, copy: false },
                { label: 'Nội dung CK', value: `GIASUAI ${selected.credits}XU`, copy: true },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{row.value}</span>
                    {row.copy && (
                      <button
                        onClick={() => handleCopy(row.value, row.label)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === row.label ? '#10b981' : '#6366f1', padding: '2px' }}
                      >
                        {copied === row.label ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: '16px', padding: '12px', borderRadius: '12px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: '0.82rem', color: '#fbbf24', lineHeight: 1.5, textAlign: 'center'
              }}>
                ⚠️ Khuyến khích sử dụng app ngân hàng / Momo quét mã ở trên để đúng số tiền và nội dung. Sau khi chuyển, nhấn xác nhận để xử lý nhé.
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                 <button className="btn-ghost" onClick={() => setSelected(null)} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>Đóng lại</button>
                 <button className="btn-primary" onClick={handleConfirm} style={{ flex: 2, padding: '12px', justifyContent: 'center' }}>Xác Nhận Đã Chuyển</button>
              </div>
            </div>
          </div>
        )}
      </>
    )}

        {/* Thành công */}
        {confirmed && (
          <div style={{ textAlign: 'center', maxWidth: '480px', margin: '0 auto', padding: '40px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <CheckCircle size={44} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '10px', color: '#10b981' }}>Nạp Xu Thành Công!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '8px' }}>
              Đã cộng <strong style={{ color: '#fff' }}>{selected?.credits} Xu</strong> vào tài khoản của bạn.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '28px' }}>
              Số dư hiện tại: <strong style={{ color: '#a5b4fc' }}>{credits} Xu</strong>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} /> Chat AI Ngay
              </button>
              <button className="btn-ghost" onClick={() => { setSelected(null); setConfirmed(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Nạp Thêm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
