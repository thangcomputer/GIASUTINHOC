import jwt from 'jsonwebtoken';

/* global process */

const JWT_SECRET = process.env.JWT_SECRET || 'giasuai-dev-secret-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signAccessToken({ sub, role = 'student', sid }) {
  const sidN = Number(sid);
  if (!Number.isFinite(sidN) || sidN < 1) {
    throw new Error('signAccessToken requires positive numeric sid (session serial)');
  }
  return jwt.sign({ sub: String(sub), role, sid: sidN }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
