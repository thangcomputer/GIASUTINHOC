import { fetchJsonIfOk } from './parseApiResponse.js'

/** Một request đang chạy — tránh gọi /api/courses trùng (vd. React StrictMode dev). */
let inflight = null

/**
 * GET /api/courses cho preview trang chủ — dùng chung một Promise khi gọi song song.
 * @returns {Promise<object|null>}
 */
export function fetchHomeCoursesPreview() {
  if (inflight) return inflight
  inflight = fetch('/api/courses')
    .then((r) => fetchJsonIfOk(r))
    .finally(() => {
      inflight = null
    })
  return inflight
}
