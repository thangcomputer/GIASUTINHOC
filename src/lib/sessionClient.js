/** Mã 401 từ API khi cần xoá phiên client và đưa về trang đăng nhập */
export const SESSION_FATAL_ERROR_CODES = new Set(['SESSION_REPLACED', 'SESSION_IDLE', 'SESSION_INVALID']);

const STUDENT_KEYS = ['auth_token', 'user_info', 'giasu_user', 'user_credits'];
const ADMIN_KEYS = ['admin_token', 'admin_user'];

function removeKeys(keys) {
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function clearStudentAuthStorage() {
  removeKeys(STUDENT_KEYS);
}

export function clearAdminAuthStorage() {
  removeKeys(ADMIN_KEYS);
}

export function clearAllAuthStorage() {
  clearStudentAuthStorage();
  clearAdminAuthStorage();
}

export function notifyAuthLost(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('giasu:auth-lost', { detail }));
  } catch {
    /* ignore */
  }
}

/**
 * @param {Response} res
 * @param {unknown} data — body JSON đã parse (hoặc null)
 * @returns {boolean} true nếu đã xử lý (phiên bị huỷ)
 */
export function handleSessionFatal401(res, data) {
  if (res.status !== 401 || data == null || typeof data !== 'object' || Array.isArray(data)) return false;
  const code = data.code;
  if (!code || !SESSION_FATAL_ERROR_CODES.has(code)) return false;
  clearAllAuthStorage();
  notifyAuthLost({ message: data.message, code });
  return true;
}
