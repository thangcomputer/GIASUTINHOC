import { getSettings } from '../routes/settingsRoutes.js';

/** Ngày hết hạn quyền dùng gói (tính từ lúc kích hoạt) */
export function computeCoinPlanValidUntil(paidAt, billingCycle) {
  const d = new Date(paidAt);
  if (Number.isNaN(d.getTime())) return null;
  if (billingCycle === 'year') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/**
 * Gán gói nạp xu «đang dùng» sau thanh toán (ghi đè gói cũ — tháng → năm chỉ còn năm active).
 * Không áp dụng gói 0đ.
 * @returns {boolean} đã gán hay không
 */
export function activateStudentCoinPlanFromPurchase(student, planId, planBillingCycle) {
  const pid = planId != null ? String(planId).trim() : '';
  if (!pid) return false;
  const pkgs = getSettings().coinPackages || [];
  const plan = pkgs.find((p) => String(p.id) === pid);
  if (!plan) return false;
  const amt = Number(plan.priceMs) || 0;
  const coins = Number(plan.coins) || 0;
  if (amt < 1000 || coins <= 0) return false;
  const cycle =
    planBillingCycle === 'year' || plan.billingCycle === 'year' ? 'year' : 'month';
  const now = new Date();
  student.activeCoinPlanId = pid;
  student.activeCoinPlanBillingCycle = cycle;
  student.activeCoinPlanPaidAt = now;
  student.activeCoinPlanValidUntil = computeCoinPlanValidUntil(now, cycle);
  return true;
}

/**
 * Bổ sung validUntil nếu thiếu (dữ liệu cũ); nếu đã quá hạn thì xóa active (xu trong ví giữ nguyên).
 * @param {import('mongoose').Document} student — document Student (đã load từ DB)
 */
export async function syncStudentActiveCoinPlanWindow(student) {
  if (!student?.activeCoinPlanId) return;

  if (!student.activeCoinPlanValidUntil && student.activeCoinPlanPaidAt) {
    const c = student.activeCoinPlanBillingCycle === 'year' ? 'year' : 'month';
    student.activeCoinPlanValidUntil = computeCoinPlanValidUntil(student.activeCoinPlanPaidAt, c);
    await student.save();
  }

  const until = student.activeCoinPlanValidUntil
    ? new Date(student.activeCoinPlanValidUntil).getTime()
    : null;
  if (!until) return;

  if (Date.now() > until) {
    student.activeCoinPlanId = '';
    student.activeCoinPlanBillingCycle = '';
    student.activeCoinPlanPaidAt = null;
    student.activeCoinPlanValidUntil = null;
    await student.save();
  }
}
