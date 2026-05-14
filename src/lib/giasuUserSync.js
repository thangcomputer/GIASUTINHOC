/** Cùng tab không nhận `storage` khi `localStorage.setItem('giasu_user')` — bắn sự kiện này sau mỗi lần ghi `giasu_user` cần UI (Deposit, xu, gói) cập nhật ngay. */
export const GIASU_USER_REFRESH = 'giasu_user_refresh'

export function notifyGiasuUserUpdated() {
  try {
    window.dispatchEvent(new CustomEvent(GIASU_USER_REFRESH))
    window.dispatchEvent(new Event('storage'))
  } catch {
    /* noop */
  }
}
