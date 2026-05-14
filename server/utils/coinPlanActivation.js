import { getSettings } from '../routes/settingsRoutes.js';

/**
 * Gán gói nạp xu «đang dùng» sau thanh toán có gói (không áp dụng gói 0đ).
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
  student.activeCoinPlanId = pid;
  student.activeCoinPlanBillingCycle = cycle;
  student.activeCoinPlanPaidAt = new Date();
  return true;
}
