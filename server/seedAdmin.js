/**
 * Đặt / cập nhật tài khoản admin mặc định (luôn ghi đè mật khẩu đúng chuẩn).
 * Chạy: npm run seed:admin
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { DEFAULT_MONGODB_URI } from './constants/defaultMongoUri.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

const ADMIN_EMAIL = 'admin@giasuai.com';
const ADMIN_PASS = 'Admin@2024!';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection?.db?.databaseName || '(unknown)';
  console.log('✅ Kết nối MongoDB — database:', dbName);
  console.log('   URI (ẩn mật khẩu nếu có):', MONGODB_URI.replace(/:[^:@/]+@/, '://***@'));

  const hash = bcrypt.hashSync(ADMIN_PASS, 10);
  const db = mongoose.connection.db;
  const now = new Date();

  const { matchedCount, modifiedCount, upsertedCount } = await db.collection('students').updateOne(
    { email: ADMIN_EMAIL },
    {
      $set: {
        password: hash,
        role: 'admin',
        name: 'Quản Trị Viên',
        phone: '0909000000',
        coins: 99999,
        totalEarned: 99999,
        totalSpent: 0,
        totalQuizGenerated: 0,
        totalChatMessages: 0,
        isActive: true,
        sessionSerial: 1,
        lastActivityAt: now,
        lastLogin: now,
        updatedAt: now,
      },
      $setOnInsert: {
        email: ADMIN_EMAIL,
        avatar: '',
        unlockedCourses: [],
        currentLevel: 'Mới bắt đầu',
        learningGoals: 'Nắm vững tin học cơ bản',
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log('');
  console.log('🎉 Đã đồng bộ tài khoản admin (mật khẩu đã reset về mặc định).');
  console.log('─────────────────────────────');
  console.log('  📧 Email   :', ADMIN_EMAIL);
  console.log('  🔑 Password:', ADMIN_PASS);
  console.log('  🌐 /admin  : http://localhost:5173/admin');
  console.log('─────────────────────────────');
  console.log('  matched:', matchedCount, 'modified:', modifiedCount, 'upserted:', typeof upsertedCount === 'number' ? upsertedCount : 0);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
