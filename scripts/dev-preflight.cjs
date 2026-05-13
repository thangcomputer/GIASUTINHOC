/**
 * Kiểm tra nhanh trước khi dev: .env, MongoDB, cổng 5000 (nếu đã bật backend).
 * Luôn thoát 0 — chỉ in cảnh báo (không chặn npm run).
 */
require('dotenv').config()
const net = require('net')
const mongoose = require('mongoose')

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host }, () => {
      s.end()
      resolve(true)
    })
    s.on('error', () => resolve(false))
    s.setTimeout(1200, () => {
      s.destroy()
      resolve(false)
    })
  })
}

;(async () => {
  console.log('=== GIASUAI dev preflight ===\n')

  if (!process.env.MONGODB_URI) {
    console.warn('[!] MONGODB_URI chưa set trong .env — mặc định server dùng mongodb://127.0.0.1:27017/giasuai_db')
  } else {
    console.log('[✓] MONGODB_URI có trong .env')
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giasuai_db'
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 })
    console.log('[✓] Kết nối MongoDB OK')
    await mongoose.disconnect()
  } catch (e) {
    console.warn('[!] MongoDB:', e.message)
    console.warn('    → Bật mongod / MongoDB service rồi chạy lại backend.')
  }

  const apiPort = Number(process.env.PORT) || 5000
  const apiUp = await checkPort(apiPort)
  if (apiUp) {
    console.log(`[✓] Cổng ${apiPort} đang mở (có thể đã có backend)`)
  } else {
    console.log(`[ ] Cổng ${apiPort} chưa có — chạy: npm run start:backend (hoặc npm run dev:all); PORT trong .env phải khớp vite proxy.`)
  }

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('[!] Production nên đặt JWT_SECRET trong .env')
  }

  console.log('\nGợi ý: npm run dev:all')
  console.log('==========================\n')
})()
