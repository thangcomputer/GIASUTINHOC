/**
 * URI Mongo mặc định khi không có MONGODB_URI trong .env.
 * Dùng chung cho server.js và seedAdmin.js (tránh seed vào DB khác với API).
 */
export const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/giasuai_db';
