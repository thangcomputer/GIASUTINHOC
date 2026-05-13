import Swal from 'sweetalert2';
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, CreditCard, ShieldCheck, ArrowLeft, Loader2, Key } from 'lucide-react'
import Navbar from '../components/Navbar'
import confetti from 'canvas-confetti'
import { getApiBaseUrl } from '../lib/apiBase'

const API_URL = getApiBaseUrl()

export default function DepositMockPage() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('orderCode')
  const navigate = useNavigate()
  
  const [isProcessing, setIsProcessing] = useState(false)
  
  const handlePaymentSuccess = async () => {
    setIsProcessing(true)
    
    try {
      // Gọi Webhook mô phỏng (giả lập ngân hàng gọi về hệ thống chúng ta)
      const response = await fetch(`${API_URL}/api/payment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            orderCode: Number(orderCode),
            amount: 0,
            code: '00'
          }
        })
      });

      if (response.ok) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
        Swal.fire(`MÔ PHỎNG: Xác thực thanh toán thành công qua Webhook cho mã ${orderCode}! Hệ thống sẽ tự động đối soát và cộng Xu.`)
        navigate('/')
      } else {
        Swal.fire('Lỗi khi giả lập Webhook')
      }
    } catch (e) {
      Swal.fire('Lỗi mạng khi gọi webhook')
    }
    
    setIsProcessing(false)
  }

  return (
    <div className="deposit-page">
      <Navbar />
      <div className="container deposit-container">
        <div className="qr-checkout-card glass-card animate-fade-in-up" style={{maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center'}}>
          <button className="back-btn" onClick={() => navigate('/deposit')} style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b'}}>
            <ArrowLeft size={16} /> Quay lại trang phân bổ
          </button>
          
          <div className="checkout-content" style={{marginTop: '24px'}}>
            <h2>Xác Thực Cấp Phép & Ký Quỹ (GIAO DIỆN MÔ PHỎNG)</h2>
            <p style={{color: '#ef4444', marginBottom: '24px'}}>Hệ thống Backend chưa cấu hình Key API của PayOS, vì vậy giao dịch được chuyển sang luồng giả lập nội bộ phục vụ việc phát triển.</p>

            <div className="qr-box" style={{background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '16px', border: '1px dashed #6366f1'}}>
              <div className="qr-image-placeholder" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <CreditCard size={48} color="#6366f1" style={{marginBottom: '16px'}} />
                <span>Khu vực Cổng Mã Hóa Thanh Toán QR (Giả lập)</span>
              </div>
            </div>

            <div className="qr-instructions" style={{textAlign: 'left', background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '8px', marginTop: '24px'}}>
              <p>Mã Hợp Đồng Ký Quỹ (OrderCode): <strong style={{color: '#10b981'}}>{orderCode}</strong></p>
              <p style={{fontSize: '0.875rem', color: '#94a3b8', marginTop: '8px'}}>Hệ thống AI sẽ tự động phân giải giao dịch và đối soát quyền hạn hợp đồng mạng khi bạn click nút bên dưới.</p>
            </div>

            <button 
              className="btn-primary checkout-btn" 
              onClick={handlePaymentSuccess} 
              disabled={isProcessing}
              style={{marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', fontSize: '1.1rem'}}
            >
              {isProcessing ? <Loader2 size={24} className="spin-icon" /> : <ShieldCheck size={24} />} 
              {isProcessing ? 'Đang gọi Wehook đối soát...' : 'Giả Lập Ngân Hàng Thanh Toán Thành Công'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
