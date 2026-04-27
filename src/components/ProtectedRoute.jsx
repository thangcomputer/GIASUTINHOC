import { Navigate, useLocation } from 'react-router-dom'

/**
 * ProtectedRoute — Bảo vệ route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → redirect về /login, kèm `?redirect=<trang hiện tại>`
 * để sau khi login xong quay về đúng trang.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('auth_token')

  if (!token) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  }

  return children
}
