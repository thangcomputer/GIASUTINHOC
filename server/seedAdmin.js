/**
 * Script tạo tài khoản admin mặc định (không dùng pre-save hook)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giasuai_db';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Kết nối MongoDB thành công');

  const ADMIN_EMAIL = 'admin@giasuai.com';
  const ADMIN_PASS  = 'Admin@2024!';
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);

  // Dùng raw collection (bypass pre-save hooks)
  const db = mongoose.connection.db;
  await db.collection('students').deleteOne({ email: ADMIN_EMAIL });
  const result = await db.collection('students').insertOne({
    name:               'Quản Trị Viên',
    email:              ADMIN_EMAIL,
    phone:              '0909000000',
    password:           hash,
    role:               'admin',
    coins:              99999,
    totalEarned:        99999,
    totalSpent:         0,
    totalQuizGenerated: 0,
    totalChatMessages:  0,
    isActive:           true,
    createdAt:          new Date(),
    updatedAt:          new Date(),
  });

  console.log('');
  console.log('🎉 TẠO ADMIN THÀNH CÔNG!');
  console.log('─────────────────────────────');
  console.log('  📧 Email   :', ADMIN_EMAIL);
  console.log('  🔑 Password:', ADMIN_PASS);
  console.log('  🌐 Dashboard: http://localhost:5173/admin');
  console.log('─────────────────────────────');
  console.log('  ID MongoDB:', result.insertedId.toString());
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
