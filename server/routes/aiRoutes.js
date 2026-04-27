import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Transaction from '../models/Transaction.js';
import ChatHistory from '../models/ChatHistory.js';
import { getSettings } from './settingsRoutes.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là Thầy Thắng - Chuyên gia Đào tạo Tin học Ứng dụng hàng đầu Việt Nam. Hình ảnh của bạn là một giảng viên mặc áo thun đỏ, từng đào tạo hơn 5000 học viên đạt chứng chỉ MOS và IC3 quốc tế. Bạn hoạt động theo mô hình 1 kèm 1 — luôn theo sát từng thao tác của học viên.

TRIẾT LÝ SƯ PHẠM CỐT LÕI:
- Nguyên lý "Tại sao trước Như thế nào": Luôn giải thích LÝ DO tồn tại của một tính năng trước khi hướng dẫn thao tác. Học viên hiểu bản chất sẽ không bao giờ quên.
- Kỹ thuật "Neo Ký ức": Gắn mỗi khái niệm kỹ thuật với một hình ảnh đời thường quen thuộc. Ví dụ: RAM như bàn làm việc, SSD như ngăn kéo tủ, VLOOKUP như tra danh bạ, Pivot Table như kế toán tổng hợp sổ sách.
- Nguyên tắc "Scaffolding": Xây dựng kiến thức từng bước — không nhảy cóc, không bỏ sót. Mỗi câu trả lời là một viên gạch đặt chắc chắn.
- Quy trình 4 bước cho MỌI câu trả lời:
  Bước 1 — Đồng cảm: Nhận ra khó khăn và cho học viên thấy bạn hiểu họ đang gặp vấn đề gì.
  Bước 2 — Bản chất: Giải thích nguyên lý bằng ví dụ đời thường CỰC KỲ DỄ HIỂU.
  Bước 3 — Thực hành: Hướng dẫn thao tác từng bước theo thứ tự cụ thể.
  Bước 4 — Kiểm tra hiểu: Đặt 1 câu hỏi gợi mở để học viên tự xác nhận đã nắm được.

THÍCH ỨNG THEO ĐỐI TƯỢNG (ƯU TIÊN CAO — bắt buộc nhận diện và áp dụng):
Bạn PHẢI TỰ NHẬN DIỆN đối tượng học viên qua ngôn ngữ, cách đặt câu hỏi và context hệ thống cung cấp:

► Nếu HỌC VIÊN LÀ TRẺ EM (ngôn ngữ đơn giản, hỏi kiểu "con click vào đâu?", hoặc hệ thống chỉ định là "trẻ em"):
  - Xưng "Thầy" (hoặc "Cô"), gọi học viên là "con" hoặc "bạn nhỏ"
  - Giọng điệu VUI TƯƠI, NĂNG ĐỘNG, hay khen ngợi. Hướng dẫn TỪNG BƯỚC MỘT.
  - Khen nhiệt tình khi làm đúng: "Wow, con giỏi quá!", "Đúng phóc rồi bạn ơi!", "Siêu luôn!"
  - Khi làm sai: nhẹ nhàng "Không sao đâu con! Cứ bấm Ctrl+Z để quay lại rồi thử lại nhé!"
  - TUYỆT ĐỐI không dùng thuật ngữ kỹ thuật — thay "Ribbon" → "thanh công cụ ở trên", thay "Minimize" → "nút dấu trừ để thu nhỏ cửa sổ"

► Nếu HỌC VIÊN LÀ NGƯỜI LỚN TUỔI (hỏi chậm, hỏi lại nhiều lần, tên kiểu "Bác Lan", "Chú Hùng", hoặc hệ thống chỉ định là "người lớn tuổi"):
  - Xưng "cháu", gọi học viên là "Bác" / "Cô" / "Chú" tùy ngữ cảnh
  - Giọng điệu ĐIỀM ĐẠM, CHẬM RÃI, TÔN TRỌNG và KIÊN NHẪN TUYỆT ĐỐI
  - Khen theo kiểu người lớn: "Dạ đúng rồi Bác ạ, Bác làm rất tốt!", "Cháu thấy Bác tiến bộ nhanh lắm đó ạ!"
  - Khi làm sai: "Dạ không sao Bác ơi, máy tính rất khỏe, không bao giờ hỏng vì thao tác sai. Bác cứ từ từ bấm Ctrl+Z để quay lại nhé."
  - KHÔNG dùng tiếng Anh kỹ thuật — giải thích hoàn toàn bằng tiếng Việt thuần

► MẶC ĐỊNH (không rõ đối tượng): Xưng "Tôi" hoặc "Thầy Thắng", gọi học viên là "bạn", giọng điệu THÂN THIỆN, CHUYÊN NGHIỆP.

QUY TẮC BẢO VỆ HỌC VIÊN (bất kể đối tượng):
- LUÔN trấn an: Nếu học viên sợ làm hỏng máy, nhắc ngay "Đừng lo, máy tính rất khỏe, không thể hỏng vì bấm nhầm phím đâu!"
- Nếu vấn đề phức tạp ngoài phạm vi: "Phần này hơi phức tạp một chút, hệ thống đã ghi nhận lại để giáo viên hỗ trợ đào tạo 1 kèm 1 trực tiếp & từ xa cho mình ngay nhé."

QUY TẮC PHONG CÁCH (Bắt buộc tuân thủ tuyệt đối):
- QUY TẮC HIỂN THỊ BẢNG EXCEL MINH HỌA: BẤT CỨ KHI NÀO giải thích hoặc làm ví dụ về số liệu Excel, BẠN BẮT BUỘC PHẢI VẼ BẢNG MARKDOWN TABLE VỚI GIAO DIỆN CHUẨN:
   + Cột đầu tiên (ngoài cùng bên trái) PHẢI là số thứ tự hàng: 1, 2, 3...
   + Hàng đầu tiên (trên cùng) PHẢI có ô trống ở góc trái, sau đó là tên cột: A, B, C, D...
   + Luôn luôn điền SỐ LIỆU thực tế vào trong bảng.
   + Ví dụ định dạng:
| | A | B | C |
| --- | --- | --- | --- |
| **1** | Họ Tên | Tháng 1 | Tháng 2 |
| **2** | Nguyễn An | 500 | 600 |

- Điều chỉnh ngôn ngữ theo [Trình độ học viên]: Người mới bắt đầu → tiếng Việt thuần túy, tránh thuật ngữ khô khan. Trung cấp → giải thích thuật ngữ khi dùng. Nâng cao → có thể dùng tiếng Anh kỹ thuật.
- TUYỆT ĐỐI KHÔNG dùng biểu tượng cảm xúc (emoji) trong bất kỳ hoàn cảnh nào.
- KHÔNG nhắc đến từ khóa: "khóa học", "đăng ký", "học phí", "999k", "ưu đãi". Môi trường học thuật thuần túy.
- Khi học viên hỏi lại lần thứ 2 về cùng một vấn đề: tự động chuyển sang ví dụ hoàn toàn khác.
- Khi học viên hỏi lại lần thứ 3: thêm câu "Hãy để tôi thử một góc nhìn khác — đây là một ví dụ thực tế từ công việc văn phòng mà bạn có thể gặp ngay ngày mai:"

KHẢ NĂNG TẠO ẢNH:
Khi và chỉ khi học viên yêu cầu xem ví dụ trực quan, vẽ sơ đồ, hoặc minh họa kỹ thuật — tự động gọi hàm create_realistic_illustration với prompt CỰC KỲ chi tiết, photorealistic, kỹ thuật cao.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function logTx(studentId, studentName, type, coinsDelta, coinsAfter, description, metadata = {}) {
  try {
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      await Transaction.create({ studentId, studentName, type, coinsDelta, coinsAfter, description, metadata, status: 'completed' });
    }
  } catch(e) { /* non-blocking */ }
}

async function logChat(studentId, studentName, studentEmail, role, content, opts = {}) {
  try {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) return;
    await ChatHistory.create({
      studentId, studentName, studentEmail, role,
      content: content?.slice(0, 2000) || '',
      type:    opts.type    || 'text',
      aiMode:  opts.aiMode  || 'pro',
      coinCost:opts.coinCost || 0,
      imageUrl:opts.imageUrl || '',
    });
  } catch(e) { /* non-blocking */ }
}

// ─── Vector Cosine Similarity ────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

// ─── Gemini Embedding (server-side runtime) ───────────────────────────────────
let _embeddingAvailable = null; // null=chưa thử, true=OK, false=không dùng được

async function embedQuery(text, apiKey) {
  if (_embeddingAvailable === false) return null; // đã biết không khả dụng
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text.slice(0, 1500));
    const vec = result.embedding?.values || null;
    if (vec) _embeddingAvailable = true;
    return vec;
  } catch (e) {
    if (e.message?.includes('404') || e.message?.includes('not found')) {
      _embeddingAvailable = false; // API key không hỗ trợ embedding
      console.log('  ℹ️  Gemini Embedding không khả dụng → dùng Keyword Search TF-IDF');
    }
    return null;
  }
}


// ─── Knowledge Base ───────────────────────────────────────────────────────────
let knowledgeIndex = { topics: {}, hasVectors: false };

export const reloadKnowledge = () => {
  try {
    const dataPath = path.join(__dirname, '..', '..', 'src', 'data', 'knowledge', 'knowledgeIndex.json');
    knowledgeIndex = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log("✅ Đã nạp lại tri thức vào bộ nhớ AI:", knowledgeIndex.builtAt || 'Không có thời gian');
    if (knowledgeIndex.hasVectors) console.log("   ⚡ Semantic Vector Search: BẬT");
    return true;
  } catch (e) {
    console.log("❌ Không thể đọc knowledgeIndex.json:", e.message);
    return false;
  }
};
reloadKnowledge();

// ─── Smart Search: Vector → Keyword fallback ─────────────────────────────────
async function searchKnowledge(query, topK = 5, apiKey = null) {
  if (!knowledgeIndex.topics) return [];
  const allChunks = [];

  for (const [key, topic] of Object.entries(knowledgeIndex.topics)) {
    for (const chunk of topic.chunks) {
      allChunks.push({ topic: topic.label, topicKey: key, text: chunk.text, vector: chunk.vector || null });
    }
  }
  if (!allChunks.length) return [];

  // ── Thử Vector Search trước (nếu có embedding) ──────────────────────────
  if (knowledgeIndex.hasVectors && apiKey) {
    try {
      const queryVec = await embedQuery(query, apiKey);
      if (queryVec) {
        const scored = allChunks
          .filter(c => c.vector)
          .map(c => ({ ...c, score: cosineSimilarity(queryVec, c.vector) }))
          .filter(c => c.score > 0.3)
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
        if (scored.length > 0) return scored;
      }
    } catch { /* rơi xuống keyword */ }
  }

  // ── Fallback: Keyword TF-IDF đơn giản ───────────────────────────────────
  const keywords = query.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

  if (!keywords.length) return [];

  const results = allChunks.map(chunk => {
    const lowerText = chunk.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const score = keywords.reduce((s, kw) => {
      const matches = (lowerText.match(new RegExp(kw, 'g')) || []).length;
      return s + matches * (1 + Math.log(kw.length)); // TF × IDF-like weight
    }, 0);
    return { ...chunk, score };
  });

  return results.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}

// ─── Tạo ảnh photorealistic qua Pollinations.ai (miễn phí, không cần key) ────
async function generatePhotorealisticImage(prompt) {
  // Phụ thuộc vào thông số của học viên. Tối ưu quỹ 800k bằng Pollinations (ẩn danh URL Imagen 3 prompt)
  const enhancedPrompt = encodeURIComponent(
    `${prompt}, photorealistic, professional technical lighting, 8k resolution, precise details, cinematic studio lighting, sharp focus, no cartoon style`
  );

  const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?nologo=true&width=1280&height=720&seed=${Date.now()}&model=flux-realism`;

  // Fetch ảnh và convert sang base64 để trả về cùng response
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Pollinations Error: ${response.status}`);

  const buffer   = await response.arrayBuffer();
  const base64   = Buffer.from(buffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';

  return `data:${mimeType};base64,${base64}`;
}

// ─── Middleware Trừ Xu ────────────────────────────────────────────────────────
const checkAndDeductCoins = async (req, res, next) => {
  const { studentId, aiMode } = req.body;
  if (!studentId) return next();

  const aiCost = getSettings().aiCost;
  let cost = aiCost.chatPro || 1;
  if (req.body.type === 'grade')    cost = aiCost.grade      || 3;
  if (aiMode === 'free')            cost = aiCost.chatFree   || 0;
  if (aiMode === 'openai')          cost = aiCost.chatOpenAI || 2;
  // Câu hỏi kèm ảnh: 2 Xu (tất cả mode Pro/OpenAI)
  if (req.body.imageBase64 && aiMode !== 'free') cost = Math.max(cost, aiCost.image || 2);

  try {
    let student = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = { _id: studentId, coins: 9999, save: async () => {} };
    }

    if (!student || student.coins < cost) {
      return res.status(402).json({
        success: false,
        message: `So du khong du! Yeu cau: ${cost} Xu. Vui long nap them Xu.`
      });
    }

    student.coins    -= cost;
    student.totalSpent = (student.totalSpent || 0) + cost;
    if (student.save) await student.save();

    req.currentCoins   = student.coins;
    req.studentId      = studentId;
    req.coinCost       = cost;
    req.studentName    = student.name || '';
    req.currentLevel   = student.currentLevel || 'Mới bắt đầu';
    req.learningGoals  = student.learningGoals || 'Nắm vững tin học cơ bản';
    next();
  } catch (err) {
    console.error("Loi khi tru Xu:", err);
    res.status(500).json({ success: false, message: "Loi Server noi bo" });
  }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', checkAndDeductCoins, async (req, res) => {
  try {
    const settings  = getSettings();
    const { message, history, aiMode = 'pro', imageBase64 } = req.body;
    const sEmail = req.body.studentEmail || '';

    const currentTime = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
    const hour = new Date().getHours();

    // ── Student Memory: lấy lịch sử thi để đưa vào context ──────────────────
    let studentMemoryBlock = '';
    if (req.studentId) {
      try {
        const QuizHistory = (await import('../models/QuizHistory.js')).default;
        const recentQuizzes = await QuizHistory.find({ studentId: req.studentId })
          .sort({ createdAt: -1 }).limit(5).lean();

        if (recentQuizzes.length > 0) {
          const avgScore = Math.round(recentQuizzes.reduce((s, q) => s + q.score, 0) / recentQuizzes.length);
          const weakTopics = recentQuizzes
            .filter(q => q.score < 800)
            .map(q => q.topic)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 3);
          const bestScore = Math.max(...recentQuizzes.map(q => q.score));

          studentMemoryBlock = `
[HỒ SƠ HỌC TẬP CÁ NHÂN CỦA HỌC VIÊN NÀY]
- Điểm thi trung bình: ${avgScore}/1000
- Điểm cao nhất đạt được: ${bestScore}/1000
- Bài thi gần nhất: ${recentQuizzes[0].topic} — ${recentQuizzes[0].score} điểm
${weakTopics.length > 0 ? `- Chủ đề cần củng cố thêm: ${weakTopics.join(', ')}` : '- Học viên đang học tốt ở tất cả chủ đề'}
[YÊU CẦU]: Khi trả lời, hãy ưu tiên kết nối với các chủ đề học viên đang yếu. Nếu câu hỏi liên quan đến chủ đề yếu, hãy thêm lời động viên nhẹ nhàng và gợi ý ôn tập thêm.`;
        }
      } catch { /* non-blocking */ }
    }

    const dynamicSystemPrompt = SYSTEM_PROMPT +
      `\n\n[DỮ LIỆU NGỮ CẢNH]\n` +
      `- Trình độ học viên: ${req.currentLevel || 'Mới bắt đầu'}\n` +
      `- Mục tiêu học tập: ${req.learningGoals || 'Nắm vững tin học cơ bản'}\n` +
      `- Thời gian: ${currentTime}\n` +
      (hour >= 23 || hour < 4 ? '- LƯU Ý: Học viên đang học đêm muộn. Cuối câu trả lời, nhắc nhẹ nhàng về tầm quan trọng của giấc ngủ với việc ghi nhớ kiến thức.\n' : '') +
      studentMemoryBlock +
      `\n[QUY TẮC BỔ SUNG]\n- Nếu học viên hỏi lại 3 lần về cùng một vấn đề, tự động đổi sang ví dụ thực tế hoàn toàn mới.`;

    // ── Free mode — dùng Pollinations ────────────────────────────────────────
    if (aiMode === 'free') {
      const freeSys = dynamicSystemPrompt + "\n\nDay la phien ban AI Mien phi (0 Xu): Tra loi ngan gon, co ban vua du dung. Toi da 600 tu.";
      const hits    = await searchKnowledge(message, 3);
      const ctx     = hits.length > 0 ? "\n\n--- GIAO TRINH THAM KHAO ---\n" + hits.map(h => `[${h.topic}] ${h.text}`).join('\n') + "\n--- HET ---" : '';

      const pollHistory = (history || []).map(m => ({
        role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
        content: m.content || m.parts
      }));

      const pollRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: freeSys + ctx }, ...pollHistory, { role: 'user', content: message }] })
      });
      const aiResponseText = await pollRes.text();

      // ── Tự động tạo ảnh minh họa nếu câu hỏi liên quan đến giao diện/hình ảnh ─
      let finalText = aiResponseText;
      const imageKeywords = ['giao diện', 'minh họa', 'hình ảnh', 'hình vẽ', 'sơ đồ', 'ảnh minh', 'cho xem', 'trông như thế nào', 'màn hình', 'screenshot', 'ribbon', 'toolbar', 'chart look', 'như thế nào', 'nhìn như', 'hình dạng', 'cách hiển thị', 'ví dụ hình'];
      const shouldGenImage = imageKeywords.some(kw => message.toLowerCase().includes(kw));
      if (shouldGenImage) {
        try {
          // Phát hiện phần mềm để tạo prompt phù hợp
          const msg = message.toLowerCase();
          let softwareCtx = 'Microsoft Office';
          if (msg.includes('word') || msg.includes('văn bản') || msg.includes('soạn thảo')) softwareCtx = 'Microsoft Word 365';
          else if (msg.includes('powerpoint') || msg.includes('slide') || msg.includes('thuyết trình')) softwareCtx = 'Microsoft PowerPoint 365';
          else if (msg.includes('excel') || msg.includes('bảng tính') || msg.includes('pivot') || msg.includes('hàm')) softwareCtx = 'Microsoft Excel 365';
          else if (msg.includes('zalo')) softwareCtx = 'Zalo app on Vietnamese Windows';

          const imgPrompt = `Professional ${softwareCtx} tutorial screenshot, showing ${message.slice(0, 100)}, clean modern UI, Vietnamese Windows environment, high quality educational material`;
          const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?nologo=true&width=960&height=540&seed=${Date.now()}&model=flux`;
          finalText = aiResponseText + `\n\n**Hình minh họa:**\n![Minh họa ${softwareCtx}](${imgUrl})`;
        } catch(imgErr) { /* không block nếu lỗi ảnh */ }
      }

      res.json({ success: true, data: { text: finalText, role: 'ai', remainingCoins: req.currentCoins } });
      if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, 'Chat AI Free', { aiMode: 'free', message: message?.slice(0, 60) });
      if (req.studentId && message) {
        logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode: 'free' });
        logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode: 'free', coinCost: req.coinCost || 0 });
      }
      return;
    }

    // ── OpenAI mode ────────────────────────────────────────────────────
    if (aiMode === 'openai') {
      const openaiKey = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
      if (!openaiKey) {
        return res.status(503).json({ success: false, message: 'OpenAI API Key chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
      }

      const openai = new OpenAI({ apiKey: openaiKey });
      const _geminiKeyForSearch = (getSettings().geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
      const hits   = await searchKnowledge(message, 5, _geminiKeyForSearch);
      const ctx    = hits.length > 0
        ? '\n\n--- GIAO TRINH THAM KHAO ---\n' + hits.map(h => `[${h.topic}] ${h.text}`).join('\n') + '\n--- HET ---'
        : '';

      let currentUserMsgContent = message?.trim() ? message : '[Bắt đầu trò chuyện]';
      if (imageBase64) {
        currentUserMsgContent = [
          { type: 'text', text: message?.trim() ? message : 'Phân tích ảnh:' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ];
      }

      const oaMessages = [
        { role: 'system', content: dynamicSystemPrompt + '\n\nDay la phien ban OpenAI GPT-4o-mini (Tra phi): Hay tra loi chi tiet, chuyen sau, co cau truc ro rang.' + ctx },
        ...(history || []).map(m => ({
          role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
          content: m.content?.trim() ? m.content : '[Ảnh/File đính kèm hoặc tin nhắn trống]'
        })),
        { role: 'user', content: currentUserMsgContent }
      ];

      const oaTools = [{
        type: "function",
        function: {
          name: "create_realistic_illustration",
          description: "Generate a photorealistic and professional technical illustration based on a detailed prompt.",
          parameters: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "A highly detailed, photorealistic visual prompt mapping the technical or educational concept."
              }
            },
            required: ["prompt"]
          }
        }
      }];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: oaMessages,
        tools: (!imageBase64) ? oaTools : undefined,
        tool_choice: (!imageBase64) ? "auto" : undefined,
        max_tokens: 1500,
        temperature: 0.4,
      });

      const responseMessage = completion.choices[0].message;
      let aiResponseText = responseMessage.content || '';
      let finalImageUrl = null;

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name === 'create_realistic_illustration') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              finalImageUrl = await generatePhotorealisticImage(args.prompt);

              const extraCost = 1;
              if (req.studentId && req.currentCoins >= extraCost) {
                if (mongoose.Types.ObjectId.isValid(req.studentId)) {
                  await Student.findByIdAndUpdate(req.studentId, { $inc: { coins: -extraCost, totalSpent: extraCost } });
                }
                req.currentCoins -= extraCost;
                req.coinCost += extraCost;
              }

              oaMessages.push(responseMessage);
              oaMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify({ image_url: finalImageUrl, success: true })
              });

              const secondCompletion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: oaMessages,
                max_tokens: 1500,
                temperature: 0.4,
              });
              aiResponseText = secondCompletion.choices[0].message.content || '';
            } catch(e) {
              console.error("OpenAI tool execution error:", e);
              aiResponseText += "\n*(Lỗi hệ thống khi tạo ảnh)*";
            }
          }
        }
      } else {
        // Fallback for hallucination
        const fallbackRegex = /(?:Hình minh họa|create_realistic_illustration\()[\s:]*['"]([\s\S]*?)['"]\)?/i;
        const match = aiResponseText.match(fallbackRegex);
        if (match) {
          try {
            finalImageUrl = await generatePhotorealisticImage(match[1]);
            const extraCost = 1;
            if (req.studentId && req.currentCoins >= extraCost) {
              if (mongoose.Types.ObjectId.isValid(req.studentId)) {
                await Student.findByIdAndUpdate(req.studentId, { $inc: { coins: -extraCost, totalSpent: extraCost } });
              }
              req.currentCoins -= extraCost;
              req.coinCost += extraCost;
            }
            aiResponseText = aiResponseText.replace(match[0], "\n*(Đã tạo hình minh hoạ thành công)*\n").trim();
          } catch(e) {
            console.error("OpenAI hallucinated tool error:", e);
          }
        }
      }

      res.json({ success: true, data: { text: aiResponseText, role: 'ai', image_url: finalImageUrl, remainingCoins: req.currentCoins } });
      if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, 'Chat OpenAI GPT-4o-mini', { aiMode: 'openai', message: message?.slice(0, 60) });
      if (req.studentId && message) {
        logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode: 'openai' });
        logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode: 'openai', coinCost: req.coinCost || 0 });
      }
      return;
    }

    // ── Pro mode — Gemini 2.5 Flash text ─────────────────────────────────────
    const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!geminiKey) {
      return res.status(503).json({ success: false, message: 'Google Gemini API Key chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    }
    const genAI = new GoogleGenerativeAI(geminiKey);

    let systemInstruction = dynamicSystemPrompt + "\n\nĐây là phiên bản AI Pro (Trả phí): Hãy phân tích chi tiết, đa chiều và chính xác. Nghiêm cấm dùng emoji.";
    const hits = await searchKnowledge(message, 7, geminiKey);
    if (hits.length > 0) {
      systemInstruction += "\n\n--- GIAO TRINH CHUYEN SAU (PRO) ---\n" + hits.map(h => `[${h.topic}] ${h.text}`).join('\n') + "\n--- HET ---";
    }

    const tools = [{
      functionDeclarations: [{
        name: "create_realistic_illustration",
        description: "Generate a photorealistic and professional technical illustration based on a detailed prompt.",
        parameters: {
          type: "OBJECT",
          properties: {
            prompt: {
              type: "STRING",
              description: "A highly detailed, photorealistic visual prompt mapping the technical or educational concept. Example: 'A photorealistic close-up of a Windows folder on a modern desktop, 8k, precise'."
            }
          },
          required: ["prompt"]
        }
      }]
    }];

    const modelOpts = {
      model: 'gemini-2.5-flash',
      systemInstruction,
      generationConfig: { temperature: 0.4 }
    };
    
    if (!imageBase64) {
      modelOpts.tools = tools;
    }

    const model = genAI.getGenerativeModel(modelOpts);

    const chatHistory = (history || []).map(m => ({
      role: (m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || m.parts }]
    }));

    const chat = model.startChat({ history: chatHistory });

    let msgPayload = message;
    if (imageBase64) {
      const mimeMatch = imageBase64.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      msgPayload = [
        { text: message || "Phân tích ảnh" },
        { inlineData: { data: base64Data, mimeType } }
      ];
    }

    let result;
    let currentChat = chat;
    try {
      result = await currentChat.sendMessage(msgPayload);
    } catch (primaryErr) {
      if (primaryErr.message && (primaryErr.message.includes('503') || primaryErr.message.includes('high demand'))) {
        console.warn('Gemini 2.5 Flash 503 Error. Falling back to gemini-2.5-pro...');
        const fallbackOpts = { ...modelOpts, model: 'gemini-2.5-pro' };
        const fallbackModel = genAI.getGenerativeModel(fallbackOpts);
        currentChat = fallbackModel.startChat({ history: chatHistory });
        result = await currentChat.sendMessage(msgPayload);
      } else {
        throw primaryErr;
      }
    }

    const call = result.response.functionCalls()?.[0];
    let aiResponseText = '';
    let finalImageUrl = null;

    if (call && call.name === "create_realistic_illustration") {
      const args = call.args;
      const genUrl = await generatePhotorealisticImage(args.prompt);
      finalImageUrl = genUrl;

      // Trừ thêm 1 xu vì gọi ảnh
      const extraCost = 1;
      if (req.studentId && req.currentCoins >= extraCost) {
        if (mongoose.Types.ObjectId.isValid(req.studentId)) {
          await Student.findByIdAndUpdate(req.studentId, { $inc: { coins: -extraCost, totalSpent: extraCost } });
        }
        req.currentCoins -= extraCost;
        req.coinCost += extraCost;
      }

      const funcResult = await currentChat.sendMessage([{
        functionResponse: { name: 'create_realistic_illustration', response: { image_url: genUrl, success: true } }
      }]);
      aiResponseText = funcResult.response.text();
    } else {
      aiResponseText = result.response.text();
      // FALLBACK for AI hallucinating function call as text
      const funcMatch = aiResponseText.match(/create_realistic_illustration\(\s*["'](.*?)["']\s*\)/);
      if (funcMatch) {
        const promptArgs = funcMatch[1];
        try {
          finalImageUrl = await generatePhotorealisticImage(promptArgs);
          
          const extraCost = 1;
          if (req.studentId && req.currentCoins >= extraCost) {
            if (mongoose.Types.ObjectId.isValid(req.studentId)) {
              await Student.findByIdAndUpdate(req.studentId, { $inc: { coins: -extraCost, totalSpent: extraCost } });
            }
            req.currentCoins -= extraCost;
            req.coinCost += extraCost;
          }
          
          aiResponseText = aiResponseText.replace(funcMatch[0], "\n*(Đã tạo hình minh hoạ thành công)*\n").trim();
        } catch(e) {
          console.error("Hallucinated Tool Call processing error:", e);
        }
      }
    }

    res.json({ success: true, data: { text: aiResponseText, role: 'ai', image_url: finalImageUrl, remainingCoins: req.currentCoins } });

    if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, 'Chat AI Pro', { aiMode: 'pro', message: message?.slice(0, 60) });
    if (req.studentId && message) {
      logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode: 'pro', imageUrl: imageBase64 ? 'Uploaded Image' : '' });
      logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode: 'pro', coinCost: req.coinCost || 0, imageUrl: finalImageUrl || '' });
    }

  } catch(e) {
    console.error("AI Error:", e.message);
    let errMsg = e.message || "Loi AI Services";
    if (errMsg.includes("429") || errMsg.includes("Quota")) {
      const match   = errMsg.match(/retry in\s+([0-9.]+)s/);
      const seconds = match ? Math.ceil(parseFloat(match[1])) : 30;
      errMsg = `API Google qua tai. Vui long doi ${seconds} giay roi gui lai!`;
    } else if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("Service Unavailable")) {
      errMsg = "He thong AI dang ban. Vui long thu lai sau 15 giay.";
    }
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── POST /api/ai/generate-quiz ───────────────────────────────────────────────
router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, numQuestions, studentId } = req.body;
    const aiCost = getSettings().aiCost;
    let cost = 0;
    if (numQuestions === 10)      cost = aiCost.quiz10 || 5;
    else if (numQuestions === 20) cost = aiCost.quiz20 || 8;
    else if (numQuestions === 30) cost = aiCost.quiz30 || 15;
    else                          cost = Math.ceil(numQuestions / 2);
    if (!studentId) return res.status(400).json({ success: false, message: 'Thieu ID hoc vien' });
    let student = mongoose.Types.ObjectId.isValid(studentId)
      ? await Student.findById(studentId)
      : { _id: studentId, coins: 9999, save: async () => {} };
    if (!student || student.coins < cost) {
      return res.status(402).json({ success: false, message: `Can ${cost} Xu de tao ${numQuestions} cau hoi.` });
    }
    let contextChunks = [];
    const topicKey = (topic || '').toLowerCase();
    if (knowledgeIndex.topics && knowledgeIndex.topics[topicKey]) {
      contextChunks = knowledgeIndex.topics[topicKey].chunks.sort(() => 0.5 - Math.random()).slice(0, 15).map(c => c.text);
    } else {
      contextChunks = (await searchKnowledge(topic, 10)).map(c => c.text);
    }
    const contextReference = contextChunks.length > 0 ? '\n\n[TAI LIEU]:\n' + contextChunks.join('\n---\n') : '';
    const settings  = getSettings();
    const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY || '';
    if (!geminiKey) return res.status(503).json({ success: false, message: 'Chua cau hinh Gemini API Key.' });
    const genAI = new GoogleGenerativeAI(geminiKey);
    const difficulty = req.body.difficulty;
    const diffStr = difficulty && difficulty !== 'Ngẫu nhiên' ? `(Mức độ: ${difficulty}) ` : '';
    const prompt = `Bạn là một giáo viên chuyên môn. Hãy tạo chính xác ${numQuestions || 5} câu hỏi trắc nghiệm ${diffStr}xoay quanh chủ đề "${topic || 'Tin học căn bản'}". Các câu hỏi phải đúng kiến thức thực tế. Tra ve MANG JSON HAP LE:
[{"question":"...","options":["A...","B...","C...","D..."],"correct":0,"difficulty":"De","category":"${topic}","explanation":"..."}]
${contextReference}`;
    const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    let text = '';
    let lastErr;

    for (const modelName of MODEL_CHAIN) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.6, responseMimeType: 'application/json' } });
        const result = await m.generateContent(prompt);
        text = result.response.text().trim();
        console.log(`Quiz OK with ${modelName}`);
        break;
      } catch (err) {
        lastErr = err;
        if ((err.message||'').match(/429|404|quota|RESOURCE_EXHAUSTED/i)) { console.warn(`${modelName} lỗi/het quota`); continue; }
      }
    }

    // Nếu Gemini thất bại toàn bộ, Khởi động lập tức cơ chế dự phòng OpenAI
    if (!text) {
      console.warn('Gemini failed, falling back to OpenAI GPT-4o-mini for Quiz Generator...');
      const openaiKey = (settings.openaiKey || process.env.OPENAI_API_KEY || '').trim();
      if (!openaiKey) throw lastErr || new Error("Cả Gemini và OpenAI đều không khả dụng.");

      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        // Sửa lại prompt báo trả về JSON object có key là 'data' để tránh lỗi openai strict json format
        const oaPrompt = prompt.replace('MANG JSON HAP LE', 'JSON object có dạng {"data": [...array các câu hỏi...]}');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: oaPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.6
        });
        
        const content = completion.choices[0].message.content || '{"data":[]}';
        const parsedNode = JSON.parse(content);
        
        // Trích xuất array câu hỏi từ OpenAI (có thể bọc trong node 'data', 'questions', v.v..)
        const arr = Array.isArray(parsedNode) ? parsedNode : (parsedNode.data || parsedNode.questions || []);
        text = JSON.stringify(arr);
        console.log('Quiz OK with OpenAI (Fallback)');
      } catch (oaErr) {
        console.error('OpenAI Fallback Error:', oaErr.message);
        throw lastErr || oaErr;
      }
    }

    let questions;
    try {
      questions = JSON.parse(text);
      if (!Array.isArray(questions)) throw new Error('Not Array');
    } catch(err) {
      console.error('Lỗi parse JSON sinh đề:', text);
      return res.status(500).json({ success: false, message: 'Lỗi định dạng cấu trúc sinh đề của AI. Vui lòng thử lại!' });
    }

    // Success -> Deduct coins
    student.coins             -= cost;
    student.totalSpent         = (student.totalSpent || 0) + cost;
    student.totalQuizGenerated = (student.totalQuizGenerated || 0) + 1;
    if (student.save) await student.save();

    logTx(student._id, student.name || '', 'spend_quiz', -cost, student.coins, `Tao de trac nghiem AI - ${numQuestions} cau - Mon: ${topic}`, { topic, numQuestions });

    res.json({ success: true, data: questions });
  } catch(e) {
    console.error('Quiz Generator Error:', e.message);
    const raw = e.message || '';
    let errMsg = raw;
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── POST /api/ai/advisor-chat ────────────────────────────────────────────────
// AI tư vấn khóa học — chỉ dùng nội dung admin cấu hình, từ chối câu hỏi khác
router.post('/advisor-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Thiếu nội dung câu hỏi' });

    const settings = getSettings();
    const geminiKey = settings.geminiKey || process.env.GEMINI_API_KEY || '';
    if (!geminiKey) return res.status(503).json({ success: false, message: 'Chưa cấu hình API Key' });

    // Lấy nội dung tư vấn do admin cấu hình
    const advisorContent = settings.advisorContent || '';
    const advisorFallback = `
Trung tâm đào tạo 1 kèm 1 trực tiếp & từ xa hiện có các khóa học:
- MOS Word, Excel, PowerPoint (Chứng chỉ quốc tế Microsoft)
- IC3 (Tin học căn bản quốc tế)
- AI & Công nghệ số
Liên hệ để được tư vấn lộ trình phù hợp.
`.trim();

    const courseContext = advisorContent || advisorFallback;

    const systemPrompt = `Bạn là Trợ lý Tư vấn Học Tập của trung tâm "Thắng Tin Học". Nhiệm vụ DUY NHẤT của bạn là tư vấn về lộ trình học tập, khóa học và chương trình đào tạo của trung tâm.

THÔNG TIN KHÓA HỌC (do quản trị viên cập nhật):
---
${courseContext}
---

QUY TẮC BẮT BUỘC:
1. CHỈ trả lời các câu hỏi liên quan đến: khóa học, lộ trình, học phí, thời gian học, chứng chỉ, đối tượng học viên, phương thức học.
2. Nếu học viên hỏi câu hỏi NGOÀI phạm vi tư vấn (hỏi về kỹ thuật, hỏi đề thi, hỏi nội dung bài học cụ thể), hãy lịch sự từ chối và hướng dẫn họ sử dụng tính năng "Hỏi Đáp AI" trên thanh điều hướng.
3. Văn phong chuyên nghiệp, tận tình. KHÔNG dùng emoji. KHÔNG đặt câu hỏi ngược lại quá nhiều.
4. Luôn kết thúc bằng lời mời học viên liên hệ để được tư vấn trực tiếp nếu cần thêm thông tin.`;

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
    });

    const chatHistory = (history || []).map(m => ({
      role: (m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.text || m.content || '' }]
    })).filter(m => m.parts[0].text);

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ success: true, data: { text: reply } });
  } catch(e) {
    console.error('Advisor Chat Error:', e.message);
    res.status(500).json({ success: false, message: 'Hệ thống tư vấn tạm thời gián đoạn. Vui lòng thử lại sau.' });
  }
});

export default router;
