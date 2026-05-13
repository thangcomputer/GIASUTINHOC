/**
 * Sinh file .env đầy đủ cho VPS — chỉ cần điền env.user-secrets.properties (5–6 dòng).
 * Chạy từ thư mục gốc repo:
 *   node scripts/gen-vps-env.cjs > vps.generated.env
 * Sau đó copy nội dung vps.generated.env → /www/wwwroot/giasuai/.env
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const secretsPath = path.join(root, 'env.user-secrets.properties');

function parseProps(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    out[k] = v;
  }
  return out;
}

if (!fs.existsSync(secretsPath)) {
  console.error('[gen-vps-env] Không thấy file: env.user-secrets.properties');
  console.error('  1) Copy env.user-secrets.properties.example → env.user-secrets.properties');
  console.error('  2) Điền GEMINI_API_KEY, VITE_GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.error('  3) Chạy lại: node scripts/gen-vps-env.cjs > vps.generated.env');
  process.exit(1);
}

const s = parseProps(fs.readFileSync(secretsPath, 'utf8'));

const gemini = String(s.GEMINI_API_KEY || s.VITE_GEMINI_API_KEY || '').trim();
const gid = String(s.VITE_GOOGLE_CLIENT_ID || s.GOOGLE_CLIENT_ID || '').trim();
const gsec = String(s.GOOGLE_CLIENT_SECRET || '').trim();
const openai = String(s.OPENAI_API_KEY || '').trim();
const origins = String(
  s.ALLOWED_ORIGINS || 'https://giasutinhoc24h.com,https://www.giasutinhoc24h.com'
).trim();
const mongo = String(s.MONGODB_URI || 'mongodb://127.0.0.1:27017/giasuai').trim();
const port = String(s.PORT || '4000').trim();
const jwtExp = String(s.JWT_EXPIRES_IN || '7d').trim();
const tavily = String(s.TAVILY_API_KEY || '').trim();

if (!gemini) {
  console.error('[gen-vps-env] Thiếu GEMINI_API_KEY trong env.user-secrets.properties');
  process.exit(1);
}
if (!gid || /REPLACE/i.test(gid) || !gid.includes('apps.googleusercontent.com')) {
  console.error('[gen-vps-env] Thiếu hoặc sai VITE_GOOGLE_CLIENT_ID (phải là …apps.googleusercontent.com)');
  process.exit(1);
}
if (!gsec || /REPLACE/i.test(gsec)) {
  console.error('[gen-vps-env] Thiếu GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

const jwt = crypto.randomBytes(48).toString('hex');

const out = [];
out.push('# GIASUAI — sinh tự động (scripts/gen-vps-env.cjs). Không commit file này nếu chứa bí mật riêng.');
out.push('');
out.push('PORT=' + port);
out.push('NODE_ENV=production');
out.push('');
out.push('MONGODB_URI=' + mongo);
out.push('');
out.push('JWT_SECRET=' + jwt);
out.push('JWT_EXPIRES_IN=' + jwtExp);
out.push('');
out.push('ALLOWED_ORIGINS=' + origins);
out.push('');
out.push('GEMINI_API_KEY=' + gemini);
out.push('VITE_GEMINI_API_KEY=' + gemini);
out.push('');
out.push('OPENAI_API_KEY=' + openai);
out.push('');
out.push('VITE_GOOGLE_CLIENT_ID=' + gid);
out.push('GOOGLE_CLIENT_ID=' + gid);
out.push('GOOGLE_CLIENT_SECRET=' + gsec);
out.push('');
out.push('# Frontend: để trống = cùng origin với trang (khuyến nghị khi API + dist cùng Node)');
out.push('# VITE_API_URL=');
out.push('');
if (tavily) {
  out.push('TAVILY_API_KEY=' + tavily);
} else {
  out.push('# TAVILY_API_KEY=');
}
out.push('');
out.push('# BILLING_WEBHOOK_SECRET=');
out.push('# ALLOW_CLIENT_DEPOSIT=true');
out.push('');

process.stdout.write(out.join('\n'));
