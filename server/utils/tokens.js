import jwt from 'jsonwebtoken';

/* global process */

const JWT_SECRET = process.env.JWT_SECRET || 'giasuai-dev-secret-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signAccessToken({ sub, role = 'student' }) {
  return jwt.sign({ sub: String(sub), role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
