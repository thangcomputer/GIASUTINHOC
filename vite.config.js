import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Khớp server/server.js: PORT — tránh 502 khi .env đặt PORT=4000 mà proxy vẫn trỏ 5000 */
  const port = String(env.PORT || '5000').trim()
  const target = String(env.VITE_DEV_API_PROXY || `http://127.0.0.1:${port}`).replace(/\/$/, '')

  return {
    plugins: [react()],
    server: {
      // Tránh chỉ lắng nghe [::1]: mở http://127.0.0.1:5173 vẫn vào được dev server + proxy /api
      host: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
