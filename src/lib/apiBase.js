/**
 * Base URL cho API & Socket.IO.
 * - Dev: mặc định http://localhost:5000 (backend riêng cổng).
 * - Production build: cùng origin với frontend (vd: https://giasutinhoc24h.com) nếu không set VITE_API_URL.
 */
export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, '');
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}
