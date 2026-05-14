import { useGoogleLogin } from '@react-oauth/google'
import { parseJsonResponse } from '../lib/parseApiResponse.js'

const POST_LOGIN_REDIRECT_KEY = 'giasu_post_login_redirect'

export default function AuthGoogleSection({
  redirectTo,
  loading,
  setLoading,
  setErrorMsg,
}) {
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      setErrorMsg('')
      try {
        const token =
          tokenResponse.credential ||
          tokenResponse.access_token ||
          tokenResponse.id_token
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: token }),
        })
        const data = await parseJsonResponse(res)
        if (data.success) {
          const user = data.data
          if (data.token) localStorage.setItem('auth_token', data.token)
          localStorage.setItem(
            'user_info',
            JSON.stringify({
              id: user._id,
              name: user.name,
              identifier: user.email,
              credits: user.coins,
            }),
          )
          localStorage.setItem('giasu_user', JSON.stringify(user))
          let next = redirectTo
          try {
            const saved = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
            if (saved) {
              next = saved
              sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
            }
          } catch {
            /* ignore */
          }
          window.location.replace(next)
        } else {
          throw new Error(data.message)
        }
      } catch (err) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    },
    onError: () => setErrorMsg('Đăng nhập Google thất bại. Vui lòng thử lại.'),
  })

  return (
    <>
      <div className="authPage-divider">
        <div className="authPage-dividerLine" />
        <span className="authPage-dividerText">hoặc</span>
        <div className="authPage-dividerLine" />
      </div>

      <button
        type="button"
        className="authPage-google"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Tiếp tục với Google
      </button>
    </>
  )
}
