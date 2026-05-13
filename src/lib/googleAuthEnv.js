/**
 * Google OAuth (@react-oauth/google) — chỉ bọc provider & nút khi đã cấu hình thật.
 */
export function getGoogleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

export function isGoogleOAuthConfigured() {
  const id = getGoogleClientId()
  if (!id) return false
  if (/^123456789-dummy\.apps\.googleusercontent\.com$/i.test(id)) return false
  if (/REPLACE|dummy/i.test(id)) return false
  return true
}
