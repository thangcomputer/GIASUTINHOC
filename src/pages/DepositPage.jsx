import Swal from 'sweetalert2';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import Navbar from '../components/Navbar'
import { useCredits } from '../context/CreditContext'
import {
  CheckCircle, CreditCard, ShieldCheck, Database,
  Zap, Coins, Copy, ArrowLeft, Sparkles, Star, Loader2, AlertTriangle, X, Gift, TrendingUp,
} from 'lucide-react'
import './DepositPage.css'
import { studentJsonAuthHeaders } from '../lib/authFetch'
import { fetchJsonIfOk } from '../lib/parseApiResponse.js'
import { getApiBaseUrl } from '../lib/apiBase'
import { mergeCoinPackagesIfMissing } from '../lib/mergeCoinPackages'
import { WELCOME_COINS } from '../lib/creditsPolicy'
import { GIASU_USER_REFRESH, notifyGiasuUserUpdated } from '../lib/giasuUserSync.js'

const BANK_INFO = {
  bank: 'acb',
  accountNo: '4628686',
  accountName: 'PHI VAN THANG',
}

const ICONS = [Database, Zap, ShieldCheck, Sparkles, Star]

/** Chuẩn hóa id gói (vd. yvip → vip) để gán icon / gói miễn phí */
function canonPlanBaseId(planId) {
  const id = String(planId || '').trim().toLowerCase()
  if (/^y(free|standard|pro|vip)$/.test(id)) return id.slice(1)
  return id
}

const PLAN_ICON = {
  free: Gift,
  standard: ShieldCheck,
  pro: Sparkles,
  vip: Star,
}

const PLAN_ORDER_MONTH = ['free', 'standard', 'pro', 'vip']
const PLAN_ORDER_YEAR = ['yfree', 'ystandard', 'ypro', 'yvip']

/** Gói được đánh dấu "Tin dùng / Ưa chuộng" (luôn VIP theo chu kỳ) */
function featuredPlanIdForCycle(cycle) {
  return cycle === 'year' ? 'yvip' : 'vip'
}

/** Gói Tiêu chuẩn — nhãn "Phổ biến" */
function popularPlanIdForCycle(cycle) {
  return cycle === 'year' ? 'ystandard' : 'standard'
}

/**
 * Gói mặc định được coi là "đang chọn" trên UI:
 * học viên chỉ có xu chào mừng (chưa nạp thêm) → free / yfree; đã nạp → nhấn mạnh VIP để nâng cấp.
 */
function defaultHighlightPlanIdForUser(cycle) {
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    const te = Number(u.totalEarned) || 0
    if (te <= WELCOME_COINS) return cycle === 'year' ? 'yfree' : 'free'
  } catch {
    /* noop */
  }
  return featuredPlanIdForCycle(cycle)
}

function idEq(a, b) {
  return String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()
}

/** Gói 0đ / id free — dùng cho viền xanh & gán highlight đúng thẻ dù cấu hình id lệch */
function isFreeTierPackage(pkg) {
  if (!pkg) return false
  if (canonPlanBaseId(pkg.id) === 'free') return true
  if (idEq(pkg.id, 'free') || idEq(pkg.id, 'yfree')) return true
  const amt = Number(pkg.amount) || 0
  const cr = Number(pkg.credits) || 0
  return amt === 0 && cr === 0
}

/**
 * `highlightedPlanId` luôn là id thật trong `packages` (sau khi fetch).
 * Khớp không phân biệt hoa thường + fallback theo thứ tự gói / giá — tránh không khớp → không có Đang chọn.
 */
function resolveDefaultHighlightId(packages, cycle) {
  const logical = defaultHighlightPlanIdForUser(cycle)
  if (!Array.isArray(packages) || packages.length === 0) return logical
  const pool = packages.filter((p) => p.billingCycle === cycle)
  if (pool.length === 0) return logical

  const findInPool = (idNeedle) => {
    if (idNeedle == null || idNeedle === '') return null
    const lo = String(idNeedle).toLowerCase()
    return (
      pool.find((p) => idEq(p.id, idNeedle)) ||
      pool.find((p) => String(p.id).toLowerCase() === lo) ||
      pool.find((p) => canonPlanBaseId(p.id) === canonPlanBaseId(idNeedle))
    )
  }

  /** Đang có gói trả phí active (đúng chu kỳ) → mặc định «Đang chọn» trùng thẻ đó, không nhảy sang VIP */
  const activeFromServer = readServerActivePlanIdForCycle(cycle)
  if (activeFromServer) {
    const hitActive = findInPool(activeFromServer)
    if (hitActive) return String(hitActive.id)
  }

  let hit = findInPool(logical)
  if (hit) return String(hit.id)

  const base = canonPlanBaseId(logical)
  hit = pool.find((p) => canonPlanBaseId(p.id) === base)
  if (hit) return String(hit.id)

  if (base === 'free') {
    hit = pool.find((p) => isFreeTierPackage(p))
    if (hit) return String(hit.id)
  }

  const order = planIdsForBillingCycle(cycle)
  for (const oid of order) {
    hit = findInPool(oid)
    if (hit) return String(hit.id)
  }

  const sorted = [...pool].sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
  let unpaidWelcome = false
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    unpaidWelcome = (Number(u.totalEarned) || 0) <= WELCOME_COINS
  } catch {
    unpaidWelcome = true
  }
  if (unpaidWelcome) {
    const freeLike = pool.find((p) => isFreeTierPackage(p)) || pool.find((p) => (Number(p.amount) || 0) === 0)
    if (freeLike) return String(freeLike.id)
    return logical
  }
  return sorted[0] ? String(sorted[0].id) : logical
}

/** Gói vừa thanh toán thành công theo chu kỳ — để hiển thị "ĐANG DÙNG" */
const LAST_PAID_PLAN_BY_CYCLE_KEY = 'giasu_last_paid_plan_by_cycle'

function persistLastPaidPlan(pkg) {
  if (!pkg?.id) return
  const c = pkg.billingCycle === 'year' ? 'year' : 'month'
  try {
    const o = JSON.parse(localStorage.getItem(LAST_PAID_PLAN_BY_CYCLE_KEY) || '{}')
    o[c] = String(pkg.id)
    localStorage.setItem(LAST_PAID_PLAN_BY_CYCLE_KEY, JSON.stringify(o))
  } catch {
    /* noop */
  }
}

/** Gói trả phí đã kích hoạt trên server — chỉ khi còn trong hạn dùng (bắt buộc có validUntil để tránh kẹt «đang dùng» từ dữ liệu cũ). */
function readServerActivePlanIdForCycle(cycle) {
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    const id = String(u.activeCoinPlanId || '').trim()
    if (!id) return ''
    const bc = u.activeCoinPlanBillingCycle === 'year' ? 'year' : 'month'
    if (bc !== cycle) return ''
    const untilRaw = u.activeCoinPlanValidUntil
    if (!untilRaw) return ''
    if (new Date(untilRaw).getTime() <= Date.now()) return ''
    return id
  } catch {
    return ''
  }
}

function readUserActivePlanValidUntilIso() {
  try {
    const u = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    return u.activeCoinPlanValidUntil ? String(u.activeCoinPlanValidUntil) : ''
  } catch {
    return ''
  }
}

/** Hiển thị đếm ngược thời gian còn lại của gói active */
function formatTimeLeftVn(untilIso, nowMs) {
  if (!untilIso) return ''
  const end = new Date(untilIso).getTime()
  const t = end - nowMs
  if (t <= 0) return 'Đã hết hạn gói — có thể chọn gói mới'
  const sec = Math.floor(t / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `Còn lại: ${d} ngày ${h} giờ`
  if (h > 0) return `Còn lại: ${h} giờ ${m} phút`
  return `Còn lại: ${m} phút`
}

function mergeActiveCoinPlanFromServerPayload(payload) {
  if (!payload || typeof payload !== 'object') return
  const id = String(payload.activeCoinPlanId ?? '').trim()
  try {
    const gu = JSON.parse(localStorage.getItem('giasu_user') || '{}')
    if (!id) {
      gu.activeCoinPlanId = ''
      gu.activeCoinPlanBillingCycle = ''
      gu.activeCoinPlanPaidAt = null
      gu.activeCoinPlanValidUntil = null
      localStorage.setItem('giasu_user', JSON.stringify(gu))
      localStorage.setItem(LAST_PAID_PLAN_BY_CYCLE_KEY, JSON.stringify({ month: '', year: '' }))
      notifyGiasuUserUpdated()
      return
    }
    const cycle = payload.activeCoinPlanBillingCycle === 'year' ? 'year' : 'month'
    gu.activeCoinPlanId = id
    gu.activeCoinPlanBillingCycle = cycle
    if (payload.activeCoinPlanPaidAt != null) {
      gu.activeCoinPlanPaidAt = payload.activeCoinPlanPaidAt
    }
    if (payload.activeCoinPlanValidUntil != null) {
      gu.activeCoinPlanValidUntil = payload.activeCoinPlanValidUntil
    }
    localStorage.setItem('giasu_user', JSON.stringify(gu))
    const o = JSON.parse(localStorage.getItem(LAST_PAID_PLAN_BY_CYCLE_KEY) || '{}')
    o[cycle] = id
    localStorage.setItem(LAST_PAID_PLAN_BY_CYCLE_KEY, JSON.stringify(o))
    notifyGiasuUserUpdated()
  } catch {
    /* noop */
  }
}

function planIdsForBillingCycle(cycle) {
  return cycle === 'year' ? PLAN_ORDER_YEAR : PLAN_ORDER_MONTH
}

/**
 * Chỉ giữ đúng 4 gói tháng + 4 gói năm (id chuẩn), bỏ dòng thừa do cấu hình cũ / trùng.
 * Nếu thiếu gói năm, sinh lại từ 4 tháng (mergeCoinPackagesIfMissing).
 */
function pickDepositCoinPackages(merged) {
  if (!Array.isArray(merged) || merged.length === 0) return merged
  const months = PLAN_ORDER_MONTH.map((id) =>
    merged.find((p) => (p.billingCycle || 'month') !== 'year' && idEq(p.id, id)),
  ).filter(Boolean)
  if (months.length !== 4) return merged
  let years = PLAN_ORDER_YEAR.map((id) =>
    merged.find((p) => p.billingCycle === 'year' && idEq(p.id, id)),
  ).filter(Boolean)
  if (years.length !== 4) {
    years = mergeCoinPackagesIfMissing(months).filter((p) => p.billingCycle === 'year')
  }
  return [...months, ...years]
}

function buildPlanFeatures({ billingCycle, credits, planId }) {
  const base = canonPlanBaseId(planId)
  const periodShort = billingCycle === 'year' ? 'năm' : 'tháng'
  const xuLabel = `${Number(credits) || 0} Xu`

  if (base === 'free') {
    return [
      {
        text: 'Lộ trình tin học văn phòng (Word, Excel, PowerPoint) qua bài học có hướng dẫn từng bước — phù hợp người mới bắt đầu',
        strong: true,
      },
      {
        text: 'Ôn luyện với câu hỏi trắc nghiệm theo chủ đề MOS và kiểm tra nhanh sau mỗi phần để nắm chắc kiến thức',
        strong: true,
      },
      {
        text: `Gia Sư AI đồng hành: giải thích lý thuyết, ví dụ minh họa và gợi ý cách làm bài trong phạm vi ${xuLabel} chào mừng`,
        strong: false,
      },
    ]
  }
  if (base === 'standard') {
    return [
      {
        text: `Gói ${periodShort} cho nhịp học đều đặn: làm bài trong khóa, củng cố phần yếu và luyện thực hành trên bài mẫu có đáp án tham khảo`,
        strong: true,
      },
      {
        text: `${xuLabel} dùng cho chat AI chữa bài, tạo đề luyện tập và chấm bài tập tự luận — học chủ động theo tiến độ của bạn`,
        strong: true,
      },
      {
        text: 'Phù hợp học sinh, sinh viên hoặc người đi làm cần luyện MOS / tin học văn phòng ở mức ổn định mỗi tuần',
        strong: false,
      },
    ]
  }
  if (base === 'pro') {
    return [
      {
        text: 'Luyện sâu: kết hợp bài lab, tình huống thực tế và phản hồi AI chi tiết để nâng kỹ năng Word/Excel nâng cao (hàm, bảng, biểu đồ…)',
        strong: true,
      },
      {
        text: `${xuLabel} dành cho nhiều vòng hỏi đáp, tạo đề dài hơn và chấm bài kỹ — phù hợp giai đoạn ôn thi hoặc dự án ngắn`,
        strong: true,
      },
      {
        text: 'Dành cho người đã có nền tảng, muốn chuẩn bị chứng chỉ hoặc cần tăng tốc học trong một khoảng thời gian tập trung',
        strong: false,
      },
    ]
  }
  if (base === 'vip') {
    return [
      {
        text: `Gói ${periodShort} đầy đủ: nhiều lượt AI cho vòng lặp học — hỏi — làm bài — chấm — chỉnh sửa liên tục trên toàn bộ nội dung khóa`,
        strong: true,
      },
      {
        text: `${xuLabel} để tận dụng tối đa chat AI, tạo đề và chấm bài khi bạn cần hỗ trợ dày đặc trong thời gian học`,
        strong: true,
      },
      {
        text: 'Phù hợp giáo viên hướng dẫn nhóm, doanh nghiệp đào tạo nội bộ hoặc học viên muốn trải nghiệm sâu mọi tính năng học tập trên nền tảng',
        strong: false,
      },
    ]
  }
  return [
    { text: `Gói học ${periodShort} — ${xuLabel} hỗ trợ luyện tập với AI theo nội dung khóa`, strong: true },
    { text: 'Truy cập bài học, đề thi và công cụ chấm bài theo quyền của gói', strong: true },
    { text: 'Theo dõi tiến độ và lặp lại phần chưa vững cho đến khi đạt mục tiêu', strong: false },
  ]
}

/** Một dòng: giá VND bên trái, xu bên phải (vd. 279.000đ / 500 Xu) */
function formatPriceCoinLine(amountMs, credits) {
  const n = Math.round(Number(amountMs) || 0)
  const c = Math.round(Number(credits) || 0)
  const vnd = n <= 0 ? '0đ' : `${n.toLocaleString('vi-VN')}đ`
  return `${vnd} / ${c} Xu`
}

function formatVndFromMs(ms) {
  const n = Math.round(Number(ms) || 0);
  if (!n) return 'Miễn phí';
  return `${n.toLocaleString('vi-VN')}₫`;
}

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
      if (typeof coinsAdded === 'number' && coinsAdded > 0) {
        gu.totalEarned = (Number(gu.totalEarned) || 0) + coinsAdded
      }
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
  /** Gói gợi ý trên thẻ (mặc định: free / VIP tùy tài khoản) — dùng cho dim / gợi ý, không phải «đã chọn» */
  const [highlightedPlanId, setHighlightedPlanId] = useState(() =>
    resolveDefaultHighlightId([], 'month'),
  )
  /** Chỉ sau khi học viên bấm chọn gói (hoặc đang checkout) mới coi là «ĐANG CHỌN» / viền cam — gợi ý mặc định VIP không tính */
  const [chosenByUser, setChosenByUser] = useState(false)
  /** @type {'month'|'year'} */
  const [billingCycle, setBillingCycle] = useState('month')

  const [checkout, setCheckout] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState('')
  /** Làm mới đếm ngược / hết hạn gói active (client) */
  const [clockTick, setClockTick] = useState(() => Date.now())
  const pollTimerRef = useRef(null)
  const paidDoneRef = useRef(false)
  const selectedPkgRef = useRef(null)
  /** true = học viên đã bấm chọn thẻ; không ghi đè highlight bằng mặc định khi `packages` re-render */
  const depositHighlightUserSetRef = useRef(false)

  useEffect(() => {
    selectedPkgRef.current = selected
  }, [selected])

  useEffect(() => {
    if (selected && selected.billingCycle !== billingCycle) {
      setSelected(null)
      setCheckout(null)
      setCheckoutErr('')
    }
  }, [billingCycle, selected])

  useEffect(() => {
    depositHighlightUserSetRef.current = false
    setChosenByUser(false)
  }, [billingCycle])

  useEffect(() => {
    const id = setInterval(() => setClockTick(Date.now()), 15_000)
    const bump = () => setClockTick(Date.now())
    window.addEventListener('storage', bump)
    window.addEventListener(GIASU_USER_REFRESH, bump)
    return () => {
      clearInterval(id)
      window.removeEventListener('storage', bump)
      window.removeEventListener(GIASU_USER_REFRESH, bump)
    }
  }, [])

  useEffect(() => {
    if (!packages.length) return
    if (depositHighlightUserSetRef.current) return
    setHighlightedPlanId(resolveDefaultHighlightId(packages, billingCycle))
  }, [billingCycle, packages])

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => fetchJsonIfOk(r))
      .then((d) => {
        if (d?.success && d.data?.coinPackages) {
          const merged = mergeCoinPackagesIfMissing(d.data.coinPackages)
          const forUi = pickDepositCoinPackages(merged)
          setPackages(
            forUi.map((p, i) => {
              const cycle = p.billingCycle === 'year' ? 'year' : 'month';
              const priceMs = Number(p.priceMs) || 0;
              const priceText =
                (p.price && String(p.price).trim()) || formatVndFromMs(priceMs);
              const baseId = canonPlanBaseId(p.id)
              const IconComp = PLAN_ICON[baseId] || ICONS[i % ICONS.length]
              const base = {
                id: p.id || String(i),
                priceText,
                amount: priceMs,
                credits: p.coins,
                label: p.label || 'Gói học',
                billingCycle: cycle,
                icon: IconComp,
                highlight:
                  p.bonus && String(p.bonus) !== '0%'
                    ? String(p.bonus).includes('%') || String(p.bonus).includes('Tiết')
                      ? p.bonus
                      : `${p.bonus}`
                    : cycle === 'year'
                      ? 'Lộ trình học cả năm'
                      : 'Gói học tiêu chuẩn',
                color: p.color || '#6366f1',
                features: buildPlanFeatures({
                  billingCycle: cycle,
                  credits: p.coins,
                  planId: p.id,
                }),
              };
              return base;
            }),
          );
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
    if (pkg) persistLastPaidPlan(pkg)
    const newCoins = data.currentCoins
    const added = data.coins ?? pkg?.credits
    if (typeof newCoins === 'number') {
      persistCoinsEverywhere(newCoins, added)
      if (typeof added === 'number') addCredits(added)
    }
    if (data && 'activeCoinPlanId' in data) {
      mergeActiveCoinPlanFromServerPayload(data)
    }
    setSuccessPkg(pkg)
    setSelected(null)
    setCheckout(null)
    setConfirmed(true)
    depositHighlightUserSetRef.current = false
    setChosenByUser(false)
    setHighlightedPlanId(resolveDefaultHighlightId(packages, billingCycle))
    Swal.fire({
      icon: 'success',
      title: 'Đã nhận thanh toán',
      text: `Đã cộng ${added} Xu vào tài khoản.`,
      timer: 2800,
      showConfirmButton: false,
    })
  }, [addCredits, billingCycle, packages])

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

  const visiblePackages = useMemo(() => {
    const pool = packages.filter((p) => p.billingCycle === billingCycle)
    const byId = new Map(pool.map((p) => [String(p.id).toLowerCase(), p]))
    const order = planIdsForBillingCycle(billingCycle)
    const ordered = order.map((id) => byId.get(String(id).toLowerCase())).filter(Boolean)
    if (ordered.length > 0) return ordered
    return [...pool].sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0))
  }, [packages, billingCycle])

  const defaultHighlightResolvedId = useMemo(
    () => resolveDefaultHighlightId(packages, billingCycle),
    [packages, billingCycle],
  )
  /** Chỉ tin bản sao active trên `giasu_user` (đã sync server); không dùng last-paid local để tránh «đang dùng» sai chu kỳ / sau khi đổi gói. */
  const lastPaidPlanIdForCycle = useMemo(
    () => readServerActivePlanIdForCycle(billingCycle),
    [billingCycle, clockTick],
  )

  /** Gói «đang dùng»: chỉ theo active trên server (chu kỳ khớp); không dùng highlight mặc định (VIP) → tránh hết xu vẫn hiện «ĐANG DÙNG» nhầm. Gói 0đ: chỉ khi đó là highlight mặc định (học viên chưa có gói trả phí active). */
  const inUsePlanId = useMemo(() => {
    const pool = visiblePackages
    if (!pool.length) return ''
    if (lastPaidPlanIdForCycle && pool.some((p) => idEq(p.id, lastPaidPlanIdForCycle))) {
      return String(pool.find((p) => idEq(p.id, lastPaidPlanIdForCycle)).id)
    }
    if (
      !lastPaidPlanIdForCycle &&
      defaultHighlightResolvedId &&
      pool.some((p) => idEq(p.id, defaultHighlightResolvedId))
    ) {
      const d = pool.find((p) => idEq(p.id, defaultHighlightResolvedId))
      if (d && isFreeTierPackage(d)) return String(d.id)
    }
    return ''
  }, [visiblePackages, lastPaidPlanIdForCycle, defaultHighlightResolvedId, clockTick])

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
          note: `Gói học (${selected.billingCycle === 'year' ? 'năm' : 'tháng'}) — ${selected.label || 'Gói'} (dev)`,
        }),
      })
      const d = await res.json()
      if (d.success) {
        userInfo.credits = d.currentCoins
        userInfo.coins = d.currentCoins
        localStorage.setItem('user_info', JSON.stringify(userInfo))
        localStorage.setItem('user_credits', String(userInfo.credits))
        addCredits(selected.credits)
        persistLastPaidPlan(selected)
        const gs = localStorage.getItem('giasu_user')
        if (gs) {
          const gu = JSON.parse(gs)
          gu.coins = d.currentCoins
          const add = Number(selected.credits) || 0
          if (add > 0) gu.totalEarned = (Number(gu.totalEarned) || 0) + add
          localStorage.setItem('giasu_user', JSON.stringify(gu))
        }
        mergeActiveCoinPlanFromServerPayload(d)
        setSuccessPkg(selected)
        setSelected(null)
        setCheckout(null)
        setConfirmed(true)
        depositHighlightUserSetRef.current = false
        setChosenByUser(false)
        setHighlightedPlanId(resolveDefaultHighlightId(packages, billingCycle))
      } else {
        Swal.fire('Lỗi', d.message, 'error')
      }
    } catch {
      Swal.fire('Lỗi', 'Không gọi được API nạp xu', 'error')
    }
  }

  const handleSelect = (pkg) => {
    const isFree = isFreeTierPackage(pkg)
    const isInUse = !!(inUsePlanId && idEq(pkg.id, inUsePlanId))
    if (isInUse) {
      if (!isFree) {
        const untilIso = readUserActivePlanValidUntilIso()
        const untilMs = untilIso ? new Date(untilIso).getTime() : null
        const subWindowOpen = untilMs == null || untilMs > clockTick
        if (credits > 0 && subWindowOpen) return
      } else if (!idEq(highlightedPlanId, pkg.id)) {
        return
      }
    }
    depositHighlightUserSetRef.current = true
    setChosenByUser(true)
    const sameFreeReselect = isFree && idEq(highlightedPlanId, pkg.id)
    setHighlightedPlanId(String(pkg.id))
    const paid = Number(pkg.amount) >= 1000 && Number(pkg.credits) > 0
    if (!paid || isFree) {
      setSelected(null)
      setCheckout(null)
      setCheckoutErr('')
      if (!sameFreeReselect) {
        Swal.fire({
          icon: 'info',
          title: 'Gói Miễn Phí',
          text: 'Bạn đang dùng gói miễn phí. Chọn Tiêu chuẩn / Pro / VIP để thanh toán và nhận xu.',
        })
      }
      return
    }
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
            <CreditCard size={16} /> Gói học &amp; thanh toán
          </span>
          <h1 className="gradient-text">Gói học Gia Sư AI</h1>
          <p style={{ color: '#94a3b8', maxWidth: '560px', margin: '12px auto' }}>
            Chọn chu kỳ <strong style={{ color: '#e2e8f0' }}>Tháng</strong> hoặc <strong style={{ color: '#e2e8f0' }}>Năm</strong>, rồi chọn gói — quét VietQR hoặc chuyển khoản đúng nội dung; hệ thống tự cộng xu khi nhận tiền (SePay).{' '}
            <Link to="/credits" style={{ color: '#818cf8', fontWeight: 600 }}>Xu dùng cho tính năng nào?</Link>
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
            <div className="deposit-billing-wrap">
              <p className="deposit-billing-label">Chu kỳ thanh toán</p>
              <div className="deposit-billing-toggle" role="tablist" aria-label="Chọn thanh toán theo tháng hoặc năm">
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === 'month'}
                  className={`deposit-billing-btn ${billingCycle === 'month' ? 'is-active' : ''}`}
                  onClick={() => setBillingCycle('month')}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === 'year'}
                  className={`deposit-billing-btn ${billingCycle === 'year' ? 'is-active' : ''}`}
                  onClick={() => setBillingCycle('year')}
                >
                  Năm
                  <span className="deposit-billing-discount" aria-hidden>~-17%</span>
                </button>
              </div>
              <p className="deposit-billing-hint">
                {billingCycle === 'month'
                  ? 'Thanh toán từng tháng — linh hoạt gia hạn.'
                  : 'Thanh toán cả năm — thường rẻ hơn so với 12 lần trả tháng.'}
              </p>
            </div>

            <div className="packages-grid packages-grid--animated" key={billingCycle}>
              {visiblePackages.length === 0 && (
                <p className="deposit-empty-cycle" style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                  Chưa có gói cho chu kỳ này. Vui lòng liên hệ quản trị hoặc chọn chu kỳ khác.
                </p>
              )}
              {visiblePackages.map((pkg) => {
                const isHighlight = idEq(highlightedPlanId, pkg.id)
                const inCheckout = idEq(selected?.id, pkg.id)
                const showChosenUi = (chosenByUser && isHighlight) || inCheckout
                const featuredId = featuredPlanIdForCycle(billingCycle)
                const isFeatured = idEq(pkg.id, featuredId)
                const popularId = popularPlanIdForCycle(billingCycle)
                const isPopularTier = idEq(pkg.id, popularId)
                const isInUsePlan = !!(inUsePlanId && idEq(pkg.id, inUsePlanId))
                const isFreePkg = isFreeTierPackage(pkg)
                const untilIso = readUserActivePlanValidUntilIso()
                const untilMs = untilIso ? new Date(untilIso).getTime() : null
                const subWindowOpen = untilMs == null || untilMs > clockTick
                const paidUseLocked = isInUsePlan && !isFreePkg && credits > 0 && subWindowOpen
                const freeUseLocked = isInUsePlan && isFreePkg && !isHighlight
                const inUseLockedUi = paidUseLocked || freeUseLocked
                const planCountdownLine =
                  isInUsePlan && !isFreePkg && untilIso ? formatTimeLeftVn(untilIso, clockTick) : ''
                const showBadges = isFeatured || showChosenUi || isPopularTier || isInUsePlan
                const highlightInList = visiblePackages.some((p) => idEq(p.id, highlightedPlanId))
                /** VIP «tin dùng» vẫn hiện nhãn, nhưng khi học viên đang chọn gói khác thì hạ độ nổi để thẻ «ĐANG CHỌN» nổi bật hơn */
                const featuredRecessed =
                  isFeatured && highlightInList && !isHighlight && !isInUsePlan
                const isDimmed = highlightInList && !isHighlight && !isFeatured && !isInUsePlan
                /** Viền xanh «đang dùng»; khi đang thanh toán trên đúng thẻ đó thì dùng viền cam checkout */
                const useGreenChrome = isInUsePlan && !(showChosenUi && inCheckout)
                const highlightCardClass =
                  isInUsePlan && !(showChosenUi && inCheckout)
                    ? 'package-card--current-tier'
                    : showChosenUi
                      ? 'popular'
                      : ''
                const iconAccent = useGreenChrome
                  ? '#34d399'
                  : showChosenUi
                    ? '#f59e0b'
                    : isFeatured
                      ? '#c4b5fd'
                      : '#6366f1'
                const pillBg = useGreenChrome
                  ? 'rgba(16,185,129,0.15)'
                  : showChosenUi
                    ? 'rgba(245,158,11,0.15)'
                    : isFeatured
                      ? 'rgba(168,85,247,0.14)'
                      : 'rgba(99,102,241,0.12)'
                const pillColor = useGreenChrome
                  ? '#34d399'
                  : showChosenUi
                    ? '#f59e0b'
                    : isFeatured
                      ? '#c4b5fd'
                      : '#818cf8'
                const pillBorder = useGreenChrome
                  ? 'rgba(16,185,129,0.35)'
                  : showChosenUi
                    ? 'rgba(245,158,11,0.3)'
                    : isFeatured
                      ? 'rgba(168,85,247,0.35)'
                      : 'rgba(99,102,241,0.25)'
                const topBadgeLabel =
                  inCheckout && showChosenUi
                    ? 'ĐANG CHỌN — thanh toán'
                    : isInUsePlan
                      ? 'ĐANG DÙNG'
                      : 'ĐANG CHỌN'
                const priceAmountMs = Math.round(Number(pkg.amount) || 0)
                const priceCredits = Math.round(Number(pkg.credits) || 0)
                const priceVndDisplay = priceAmountMs <= 0 ? '0đ' : `${priceAmountMs.toLocaleString('vi-VN')}đ`
                return (
                <div
                  key={pkg.id}
                  className={`package-card glass-card ${isFeatured ? 'package-card--featured' : ''} ${featuredRecessed ? 'package-card--featured-recessed' : ''} ${highlightCardClass} ${inCheckout ? 'selected package-card--checkout' : ''} ${showBadges ? 'package-card--has-badges' : ''} ${isDimmed ? 'package-card--muted' : ''} ${inUseLockedUi ? 'package-card--in-use-locked' : ''}`}
                  onClick={() => handleSelect(pkg)}
                  style={{ cursor: inUseLockedUi ? 'default' : 'pointer' }}
                  role="presentation"
                >
                  {showBadges && (
                    <div className="package-card__badges">
                      {isFeatured && (
                        <div className="featured-badge" role="status" aria-label="Gói tin dùng, ưa chuộng">
                          <Star size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                          Tin dùng · Ưa chuộng
                        </div>
                      )}
                      {isPopularTier && (
                        <div className="popular-tier-badge" role="status" aria-label="Gói phổ biến">
                          <TrendingUp size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                          Phổ biến
                        </div>
                      )}
                      {(isInUsePlan || showChosenUi) && (
                        <div className={`popular-badge ${isFeatured || isPopularTier ? 'popular-badge--below' : ''} ${isInUsePlan ? 'popular-badge--current' : ''}`}>
                          <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          {topBadgeLabel}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    style={{ color: iconAccent, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}
                  >
                    <pkg.icon size={38} />
                  </div>

                  <div
                    className="deposit-plan-period"
                    style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      marginBottom: '8px',
                      background: pkg.billingCycle === 'year' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                      color: pkg.billingCycle === 'year' ? '#fbbf24' : '#a5b4fc',
                      border: `1px solid ${pkg.billingCycle === 'year' ? 'rgba(245,158,11,0.35)' : 'rgba(99,102,241,0.3)'}`,
                    }}
                  >
                    {pkg.billingCycle === 'year' ? '1 năm' : '1 tháng'}
                  </div>

                  <h2 style={{ fontSize: '1.55rem', margin: '0 0 6px', lineHeight: 1.25 }}>{pkg.label}</h2>

                  <div style={{
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '50px', marginBottom: '10px',
                    background: pillBg,
                    color: pillColor,
                    border: `1px solid ${pillBorder}`,
                  }}
                  >
                    {pkg.highlight}
                  </div>

                  <div className="pkg-price-tag" style={{ margin: '8px 0 14px' }}>
                    <div className="pkg-price pkg-price--split" aria-label={formatPriceCoinLine(pkg.amount, pkg.credits)}>
                      <span className="pkg-price__vnd">{priceVndDisplay}</span>
                      <span className="pkg-price__sep" aria-hidden>/</span>
                      <span className="pkg-price__xu">{priceCredits} Xu</span>
                    </div>
                  </div>
                  {planCountdownLine ? (
                    <div className="deposit-plan-countdown" role="status">
                      {planCountdownLine}
                    </div>
                  ) : null}

                  <ul className="pkg-features" style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '20px' }}>
                    {pkg.features.map((f, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        marginBottom: '10px', fontSize: '0.86rem',
                        color: f.strong ? '#e2e8f0' : '#cbd5e1',
                        fontWeight: f.strong ? 700 : 500,
                      }}
                      >
                        <CheckCircle size={14} color={f.strong ? '#10b981' : '#64748b'} style={{ marginTop: '2px', flexShrink: 0 }} />
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`btn-primary pkg-btn ${isFeatured ? 'pkg-btn--featured' : ''}`}
                    tabIndex={inUseLockedUi ? -1 : 0}
                    onClick={(e) => { e.stopPropagation(); handleSelect(pkg) }}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      ...(inCheckout || useGreenChrome ? { background: 'linear-gradient(135deg,#059669,#10b981)' } : {}),
                    }}
                  >
                    {showChosenUi && !inCheckout && (isInUsePlan ? 'ĐANG DÙNG' : 'ĐANG CHỌN')}
                    {isInUsePlan && !showChosenUi && !inCheckout && 'ĐANG DÙNG'}
                    {showChosenUi && inCheckout && 'ĐANG CHỌN — thanh toán'}
                    {!showChosenUi && !isInUsePlan && `Chọn gói — ${pkg.billingCycle === 'year' ? 'năm' : 'tháng'}`}
                  </button>
                </div>
                )
              })}
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
            <h2 style={{ fontSize: '1.6rem', marginBottom: '10px', color: '#10b981' }}>Thanh toán thành công!</h2>
            <p style={{ color: '#94a3b8', marginBottom: '8px' }}>
              Đã cộng <strong style={{ color: '#fff' }}>{successPkg?.credits} Xu</strong> theo gói <strong style={{ color: '#e2e8f0' }}>{successPkg?.label}</strong>
              {successPkg?.billingCycle === 'year' ? ' (năm)' : ' (tháng)'}.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '28px' }}>
              Số dư hiện tại: <strong style={{ color: '#a5b4fc' }}>{credits} Xu</strong>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" onClick={() => navigate('/chat')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} /> Chat AI Ngay
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setSuccessPkg(null); setConfirmed(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Chọn gói khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
