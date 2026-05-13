import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { reloadKnowledge } from './aiRoutes.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.join(__dirname, '..', '..', 'data', 'knowledge');

// Đảm bảo thư mục gốc tồn tại
if (!fs.existsSync(KNOWLEDGE_DIR)) fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const topic = req.body.topic || 'other';
    const cleanTopic = topic.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'other';
    const targetDir = path.join(KNOWLEDGE_DIR, cleanTopic);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Tránh Unicode tự biến dạng
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Lấy danh sách file và topic
router.get('/', requireAdmin, (req, res) => {
  try {
    let topics = [];
    if (fs.existsSync(KNOWLEDGE_DIR)) {
      const dirs = fs.readdirSync(KNOWLEDGE_DIR, { withFileTypes: true }).filter(d => d.isDirectory());
      topics = dirs.map(d => {
        const dirPath = path.join(KNOWLEDGE_DIR, d.name);
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf') || f.endsWith('.docx') || f.endsWith('.txt'));
        return { name: d.name, files: files.map(f => ({ name: f, size: fs.statSync(path.join(dirPath, f)).size })) };
      });
    }
    
    // Đọc log index 
    let indexStats = null;
    const indexPath = path.join(__dirname, '..', '..', 'src', 'data', 'knowledge', 'knowledgeIndex.json');
    if (fs.existsSync(indexPath)) {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      indexStats = { builtAt: index.builtAt, stats: index.stats };
    }

    res.json({ success: true, data: topics, indexStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload
router.post('/upload', requireAdmin, upload.array('files'), (req, res) => {
  try {
    res.json({ success: true, message: `Đã tải lên ${req.files?.length || 0} file thành công!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa file
router.post('/delete', requireAdmin, (req, res) => {
  const { topic, file } = req.body;
  if (!topic || !file) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
  const cleanTopic = topic.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  const filePath = path.join(KNOWLEDGE_DIR, cleanTopic, file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Xoá file thành công' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy file' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Build lại kho tri thức
router.post('/build', requireAdmin, (req, res) => {
  const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'build_knowledge.cjs');
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Lỗi khi Build: ' + error.message, output: stderr });
    }
    // reload memory
    const reloaded = reloadKnowledge();
    if (!reloaded) {
      return res.json({ success: true, message: 'Đã tích hợp xong file, nhưng lỗi nạp vào AI. Hãy restart server thủ công.', output: stdout });
    }
    res.json({ success: true, message: 'Đã nhúng xong kho tri thức báo cáo cho AI!', output: stdout });
  });
});

export default router;
