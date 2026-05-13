import Swal from 'sweetalert2'

/**
 * Hiển thị khi API trả 402 — nạp xu / xem bảng giá.
 * @param {string} [serverMessage] - message từ server (tiếng Việt không dấu có thể có)
 */
export async function promptInsufficientCredits(serverMessage) {
  const detail =
    serverMessage && String(serverMessage).trim()
      ? String(serverMessage).trim()
      : 'Số dư xu không đủ. Nạp thêm xu để tiếp tục dùng tính năng AI (chat, tạo đề, v.v.).'

  const r = await Swal.fire({
    icon: 'warning',
    title: 'Không đủ xu',
    text: detail,
    confirmButtonText: 'Nạp xu ngay',
    denyButtonText: 'Xem bảng giá xu',
    cancelButtonText: 'Đóng',
    showCancelButton: true,
    showDenyButton: true,
    reverseButtons: true,
    focusCancel: true,
  })

  if (r.isConfirmed) window.location.href = '/deposit'
  else if (r.isDenied) window.location.href = '/credits'
}

export function isInsufficientCreditsStatus(status) {
  return status === 402
}
