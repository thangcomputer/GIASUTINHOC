/**
 * Chỉ parse khi HTTP OK; 502/503/rỗng → null (không ném SyntaxError).
 */
export async function fetchJsonIfOk(res) {
  if (!res?.ok) return null
  try {
    return await parseJsonResponse(res)
  } catch {
    return null
  }
}

/**
 * Đọc body fetch an toàn — tránh lỗi "Unexpected end of JSON input" khi server/proxy trả rỗng.
 */
export async function parseJsonResponse(res) {
  const text = await res.text()
  if (!text || !String(text).trim()) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(
        'Máy chủ API tạm không phản hồi (502/503/504). Hãy bật backend (cổng 5000), MongoDB, rồi thử lại.'
      )
    }
    throw new Error(
      `Không nhận được dữ liệu từ máy chủ (HTTP ${res.status}). Kiểm tra backend đã chạy và trình duyệt gọi đúng API.`
    )
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      'Phản hồi không phải JSON hợp lệ — thường do proxy lỗi hoặc đang tải nhầm trang HTML. Thử lại sau.'
    )
  }
}
