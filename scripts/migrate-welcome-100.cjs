/**
 * Bổ sung xu chào mừng cho tài khoản thời "5 xu" (chưa nạp thêm).
 *
 * Điều kiện: role student, totalEarned === 5 (chỉ có thưởng đăng ký cũ), chưa có giao dịch migration.
 *
 * Chạy:  node scripts/migrate-welcome-100.cjs           (dry-run, chỉ in log)
 *        node scripts/migrate-welcome-100.cjs --apply   (ghi DB)
 */
require('dotenv').config()
const mongoose = require('mongoose')

const WELCOME_TARGET = 100
const BONUS = WELCOME_TARGET - 5
const MIGRATION_DESC = 'Migration: bổ sung xu chào mừng lên mức 100 (tài khoản cũ)'

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giasuai_db'
  const apply = process.argv.includes('--apply')

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  const students = db.collection('students')
  const transactions = db.collection('transactions')

  const candidates = await students
    .find({
      role: 'student',
      totalEarned: 5,
      isActive: { $ne: false },
    })
    .toArray()

  let updated = 0
  for (const s of candidates) {
    const sid = s._id
    const dup = await transactions.findOne({
      studentId: sid,
      description: MIGRATION_DESC,
    })
    if (dup) continue

    const coinsAfter = (s.coins || 0) + BONUS
    console.log(
      apply ? '[APPLY]' : '[dry-run]',
      s.email || s.phone || sid,
      'coins',
      s.coins,
      '→',
      coinsAfter,
      'totalEarned',
      5,
      '→',
      (s.totalEarned || 0) + BONUS
    )

    if (apply) {
      await students.updateOne(
        { _id: sid },
        {
          $inc: { coins: BONUS, totalEarned: BONUS },
          $set: { updatedAt: new Date() },
        }
      )
      await transactions.insertOne({
        studentId: sid,
        studentName: s.name || '',
        type: 'bonus',
        coinsDelta: BONUS,
        coinsAfter,
        description: MIGRATION_DESC,
        status: 'completed',
        amountVND: 0,
        paymentMethod: '',
        paymentRef: '',
        metadata: {},
        createdAt: new Date(),
      })
    }
    updated++
  }

  console.log('---')
  console.log('Tổng tài khoản khớp điều kiện:', updated)
  if (!apply) console.log('Chưa ghi DB. Thêm --apply để thực hiện.')
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
