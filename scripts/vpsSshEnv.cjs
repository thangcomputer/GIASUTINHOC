'use strict';

const path = require('path');
const fs = require('fs');

try {
  const dotenv = require('dotenv');
  const root = path.join(__dirname, '..');
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
} catch {
  /* dotenv không bắt buộc */
}

/**
 * Cấu hình SSH cho script VPS (không hardcode mật khẩu trong repo).
 * Đặt trong .env hoặc export trước khi chạy:
 *   VPS_SSH_HOST=your.server.ip
 *   VPS_SSH_USER=root
 *   VPS_SSH_PASSWORD=...
 */
function requireVpsSsh() {
  const host = String(process.env.VPS_SSH_HOST || '').trim();
  const username = String(process.env.VPS_SSH_USER || 'root').trim();
  const password = String(process.env.VPS_SSH_PASSWORD || '').trim();
  if (!host || !password) {
    throw new Error(
      'Thiếu VPS_SSH_HOST hoặc VPS_SSH_PASSWORD. Thêm vào .env (local, không commit) hoặc export trước khi chạy script.',
    );
  }
  return { host, username, password };
}

module.exports = { requireVpsSsh };
