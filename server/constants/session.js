/* global process */

/** Thời gian không hoạt động tối đa trước khi phiên bị từ chối (mặc định 1 giờ). */
export const SESSION_IDLE_MS = Math.max(
  60_000,
  Number(process.env.SESSION_IDLE_MS || 60 * 60 * 1000)
);

/**
 * Một số GET định kỳ (sync xu / profile) không được tính là “hoạt động” để
 * không vô hiệu hết hạn phiên phía server khi tab mở nhưng người dùng không thao tác.
 */
export function shouldBumpSessionActivity(req) {
  if (req.method !== 'GET') return true;
  const path = String(req.originalUrl || req.url || '')
    .split('?')[0]
    .toLowerCase();
  const hexId = '[a-f0-9]{24}';
  if (new RegExp(`^/api/users/${hexId}$`).test(path)) return false;
  if (new RegExp(`^/api/users/${hexId}/coins$`).test(path)) return false;
  return true;
}
