import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

/* global process */

// Routes
import billingRoutes     from './routes/billingRoutes.js';
import aiRoutes          from './routes/aiRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import authRoutes        from './routes/authRoutes.js';
import chatHistoryRoutes from './routes/chatHistoryRoutes.js';
import settingsRoutes    from './routes/settingsRoutes.js';
import knowledgeRoutes   from './routes/knowledgeRoutes.js';
import courseRoutes      from './routes/courseRoutes.js';
import quizRoutes        from './routes/quizRoutes.js';
import homepageRoutes    from './routes/homepageRoutes.js';
import popupRoutes       from './routes/popupRoutes.js';
import progressRoutes    from './routes/progressRoutes.js';
import examRoutes        from './routes/examRoutes.js';
import paymentWebhookRoutes from './routes/paymentWebhookRoutes.js';
import { DEFAULT_MONGODB_URI } from './constants/defaultMongoUri.js';

dotenv.config();

/** Origin Vite / preview — luôn gộp khi không phải production để đăng ký/đăng nhập từ localhost không bị CORS chặn. */
const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

// Production: ALLOWED_ORIGINS=https://giasutinhoc24h.com,https://www.giasutinhoc24h.com
const rawOrigins = process.env.ALLOWED_ORIGINS;
const isProd = process.env.NODE_ENV === 'production';
const allowLocalCors =
  !isProd ||
  String(process.env.CORS_ALLOW_LOCALHOST || '').toLowerCase() === 'true';

let corsOrigin;
if (!rawOrigins || !String(rawOrigins).trim()) {
  corsOrigin = true;
} else {
  const list = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  corsOrigin = allowLocalCors ? [...new Set([...list, ...LOCAL_DEV_ORIGINS])] : list;
}

if (allowLocalCors && Array.isArray(corsOrigin) && rawOrigins?.trim()) {
  const base = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);
  const added = corsOrigin.filter((o) => !base.includes(o));
  if (added.length) console.log('[CORS] Bổ sung origin dev:', added.join(', '));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin === true ? '*' : corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Middleware bảo mật & tăng tốc ────────────
app.use(helmet({
  contentSecurityPolicy: false, // Tắt CSP để không chặn iframe YouTube, Zalo, hay API bên ngoài nếu có
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Gzip tĩnh tài nguyên (văn bản, CSS, JS)

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Phục vụ các file tĩnh (Ví dụ: Video Uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), {
  maxAge: '30d',
  etag: true
}));

// Hỗ trợ Let's Encrypt SSL Challenge của aaPanel 
app.use('/.well-known', express.static(path.join(__dirname, '..', '.well-known')));

// ─── API Routes ───────────────────────────────
app.use('/api/billing',      billingRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/settings',     settingsRoutes);
app.use('/api/knowledge',    knowledgeRoutes);
app.use('/api/courses',      courseRoutes);
app.use('/api/quizzes',      quizRoutes);
app.use('/api/homepage',     homepageRoutes);
app.use('/api/popups',       popupRoutes);
app.use('/api/progress',     progressRoutes);
app.use('/api/exams',        examRoutes);
app.use('/api/webhooks',     paymentWebhookRoutes);

// ─── MongoDB ──────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

mongoose.connect(MONGODB_URI).then(() => {
  console.log("✅ Đã kết nối Database MongoDB (Node.js Backend)");
}).catch(err => {
  console.error("❌ Lỗi kết nối MongoDB:", err.message);
});

// ─── Production: Serve React build ────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist'), {
    maxAge: '1y', // Cache 1 năm cho tất cả file tĩnh để load SIÊU NHANH
    etag: true
  }));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server
  .listen(PORT, () => {
    console.log(`🚀 Server Web & API đang chạy tại cổng http://localhost:${PORT}`);
  })
  .on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`\n❌ Cổng ${PORT} đang được sử dụng (EADDRINUSE).`);
      console.error('   → Tắt tiến trình backend cũ (Task Manager / lệnh: Get-Process node | Stop-Process), hoặc đổi PORT trong .env và khớp Vite proxy.\n');
    } else {
      console.error('❌ Không thể mở cổng server:', err?.message || err);
    }
    process.exit(1);
  });
