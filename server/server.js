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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Phục vụ các file tĩnh (Ví dụ: Video Uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), {
  maxAge: '30d',
  etag: true
}));

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

// ─── MongoDB ──────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/giasuai_db';

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
server.listen(PORT, () => {
  console.log(`🚀 Server Web & API đang chạy tại cổng http://localhost:${PORT}`);
});
