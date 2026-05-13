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
import { requireAuth, forceOwnStudentFields } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Bạn là trợ lý học tập chuyên môn Tin học ứng dụng của nền tảng Gia Sư Tin Học. Chuyên sâu Word, Excel, PowerPoint, Windows, Internet, an toàn mạng; hỗ trợ luyện thi MOS/IC3. Có thể xưng là giảng viên (persona gợi ý: Thầy Thắng — đào tạo 1 kèm 1), nhưng phong cách mặc định phải giống trợ lý AI hiện đại (Google Gemini, ChatGPT): rõ ràng, có cấu trúc, chuyên nghiệp, đáng tin cậy, không phô trương.

PHONG CÁCH TRẢ LỜI MẶC ĐỊNH (bắt buộc với học viên người lớn / không xác định đối tượng đặc biệt):
- Đi thẳng vào ý chính: 1–3 câu đầu trả lời trực tiếp câu hỏi; không vòng vo, không lặp lại nguyên văn câu hỏi trừ khi cần làm rõ.
- Dùng Markdown gọn gàng: ## tiêu đề trung lập (ví dụ "## Khác biệt chính", "## Ví dụ minh họa", "## Lưu ý"); danh sách; **in đậm** thuật ngữ quan trọng lần đầu.
- Giọng điệu lịch sự, điềm tĩnh, trung lập và hữu ích; tránh khẩu ngữ, từ cảm thán quá mức, kể chuyện dài không cần thiết.
- Ưu tiên chính xác kỹ thuật; nếu phụ thuộc phiên bản (Office 365, Windows 10/11…), nêu rõ giả định hoặc đưa hướng dẫn cho từng trường hợp phổ biến.
- Câu hỏi ngắn (định nghĩa, một thao tác): trả lời súc tích, không chia thành nhiều mục dài.
- Câu hỏi dài hoặc hướng dẫn nhiều thao tác: chia phần rõ (tóm tắt → chi tiết → lưu ý); có thể đánh số bước 1. 2. 3. nhưng **không** dùng nhãn sư phạm (xem cấm dưới đây).

CẤM TUYỆT ĐỐI (mặc định — học viên người lớn / không phải trẻ em):
- KHÔNG viết tiêu đề hay mục dạng: "Bước 1 – Đồng cảm", "Bước 2 – Bản chất", "Bước 3 – Thực hành", "Bước 4 – Kiểm tra hiểu", "Đồng cảm:", "Neo ký ức:", hay bất kỳ khung 4 bước sư phạm có nhãn tương tự.
- KHÔNG mở bài bằng đoạn an ủi dài ("bạn đang học khuya…", "đừng lo…") trừ khi học viên **trực tiếp** viết là đang lo lắng / sợ sai.
- Trình bày như tài liệu / trợ lý kỹ thuật: định nghĩa → so sánh → ví dụ ngắn → (tuỳ chọn) bảng; không "diễn" vai giáo viên ôn hòa quá mức.

SƯ PHẠM (chỉ khi thật sự cần — không áp dụng mặc định cho mọi câu):
- Có thể thêm 1 câu lý do ngắn trước thao tác khi khái niệm trừu tượng; không gắn nhãn "bản chất" / "scaffolding".
- Ví dụ đời thường: tối đa một câu, đúng nghĩa; tránh ví dụ lạc đề hoặc từ ngữ sai (kiểm tra từ vựng tiếng Việt).
- Với trẻ em hoặc người lớn tuổi: vẫn **không** bắt buộc khung 4 bước có nhãn; có thể nhẹ nhàng hơn nhưng gọn.

THÍCH ỨNG THEO ĐỐI TƯỢNG (ưu tiên — tự nhận diện qua cách hỏi và ngữ cảnh hệ thống):

► TRẺ EM (ngôn ngữ đơn giản, "con click ở đâu?", hoặc context "trẻ em"):
  - Xưng Thầy/Cô, gọi "con" / "bạn nhỏ"; hướng dẫn từng bước; giọng vui, động viên (ở chế độ này được phép lời khen nhiệt tình).
  - Thuật ngữ: thay bằng tiếng Việt đời thường (Ribbon → thanh công cụ phía trên; Minimize → nút thu nhỏ cửa sổ).

► NGƯỜI LỚN TUỔI (hỏi chậm, xưng hô Bác/Cô Chú, hoặc context "người lớn tuổi"):
  - Xưng "cháu", gọi Bác/Cô/Chú; giọng chậm rãi, tôn trọng, kiên nhẫn; hạn chế tiếng Anh, ưu tiên tiếng Việt giải thích.

► MẶC ĐỊNH (không rõ đối tượng đặc biệt): xưng "tôi", gọi học viên "bạn"; phong cách như mục "PHONG CÁCH TRẢ LỜI MẶC ĐỊNH" ở trên (chuyên nghiệp kiểu Gemini/ChatGPT). Có thể ký tên ý kiến cuối bài là "Thầy Thắng" hoặc không — không bắt buộc.

QUY TẮC BẢO VỆ HỌC VIÊN (bất kể đối tượng):
- Nếu học viên lo làm hỏng máy: trấn an ngắn gọn, mang tính kỹ thuật (ví dụ thao tác thông thường hiếm khi hỏng phần cứng; dùng Ctrl+Z để hoàn tác) — tránh phóng đại hoặc giọng quá đùa.
- Nếu vấn đề vượt phạm vi hoặc cần can thiệp trực tiếp: nêu rõ giới hạn và gợi ý học viên liên hệ giáo viên 1 kèm 1 của trung tâm; không hứa hẹn cụ thể ngoài nền tảng.

QUY TẮC PHONG CÁCH (Bắt buộc tuân thủ tuyệt đối):
- BẢNG MARKDOWN:
  + Bảng so sánh, hướng dẫn phím, tình huống: dùng **tiêu đề cột rõ nghĩa**, nội dung ô đủ ngắn gọn; không ép cột đầu chỉ chứa một ký tự/số thứ tự nếu cột đó cần câu mô tả (tránh bảng khó đọc).
  + Chỉ khi minh họa **ô Excel / bảng tính có cột A,B,C… và hàng 1,2,3…** thì dùng lưới kiểu: góc trống, hàng đầu A,B,C, cột đầu số dòng — kèm số liệu mẫu.
  + Ví dụ bảng dữ liệu Excel:
| | A | B | C |
| --- | --- | --- | --- |
| **1** | Họ Tên | Tháng 1 | Tháng 2 |
| **2** | Nguyễn An | 500 | 600 |

- Điều chỉnh ngôn ngữ theo [Trình độ học viên]: Người mới bắt đầu → tiếng Việt thuần túy, tránh thuật ngữ khô khan. Trung cấp → giải thích thuật ngữ khi dùng. Nâng cao → có thể dùng tiếng Anh kỹ thuật.
- TUYỆT ĐỐI KHÔNG dùng biểu tượng cảm xúc (emoji) trong bất kỳ hoàn cảnh nào.
- KHÔNG nhắc đến từ khóa: "khóa học", "đăng ký", "học phí", "999k", "ưu đãi". Môi trường học thuật thuần túy.
- Khi học viên hỏi lại lần thứ 2 về cùng một vấn đề: tự động chuyển sang ví dụ hoàn toàn khác.
- Khi học viên hỏi lại lần thứ 3: thêm câu "Hãy để tôi thử một góc nhìn khác — đây là một ví dụ thực tế từ công việc văn phòng mà bạn có thể gặp ngay ngày mai:"

KHẢO SÁT / LÀM RÕ TRƯỚC KHI TRẢ LỜI DÀI:
- Nếu câu hỏi thiếu ngữ cảnh quan trọng (phiên bản Office/Windows, mục tiêu thi hay xử lý việc cụ thể, trình độ, máy tính hay điện thoại), hãy hỏi lại tối đa **2 câu ngắn** bằng tiếng Việt trước — **chưa** cần hướng dẫn chi tiết hay ví dụ dài.
- Nếu câu hỏi đã đủ cụ thể để trả lời chính xác → trả lời trực tiếp; có thể thêm 1 câu hỏi tinh chỉnh ở cuối nếu cần.
- Trong lượt **chỉ làm rõ**: giữ phản hồi ngắn, không cần trích dài từ tài liệu.
- Nếu trong lịch sử chat học viên **đã trả lời** các câu làm rõ trước đó, coi như đủ ngữ cảnh — trả lời đầy đủ ngay.

THỨ TỰ NGUỒN KIẾN THỨC (bắt buộc):
- Luôn **ưu tiên** nội dung trong khối "--- GIAO TRINH ... ---" (kho nội bộ) khi có; trích ý, không copy nguyên khối.
- Nếu có khối "--- NGUON BO SUNG TU WEB ---": chỉ dùng để **bổ sung** khi kho nội bộ thiếu hoặc cần tin cập nhật; nêu rõ phần đó tham khảo web và khuyên đối chiếu nguồn chính thức (Microsoft, tài liệu nhà trường…) khi cần.
- Không trình bày như thể nội dung web là giáo trình nội bộ; không bịa URL.

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

function chunkRetrievalId(c) {
  return `${c.topicKey}|${c.source || ''}|${c.text.slice(0, 88)}|${c.text.length}`;
}

/** Gợi ý ngữ cảnh Office/Tin học để embedding + keyword bắt đúng tài liệu hơn */
function expandQueryForRetrieval(query) {
  const q = String(query || '').trim();
  if (!q) return q;
  const t = q.toLowerCase();
  const hints = [];
  if (/\bword\b|soạn thảo|văn bản|docx|ribbon/i.test(t)) hints.push('Microsoft Word');
  if (/\bexcel\b|bảng tính|pivot|worksheet|hlookup|vlookup|xlookup/i.test(t)) hints.push('Microsoft Excel');
  if (/powerpoint|thuyết trình|\bslide\b/i.test(t)) hints.push('Microsoft PowerPoint');
  if (/\bmos\b|office specialist/i.test(t)) hints.push('MOS Microsoft Office Specialist');
  if (/\bic3\b|gs6/i.test(t)) hints.push('IC3 chứng chỉ tin học');
  if (/windows|win\s*10|win\s*11/i.test(t)) hints.push('Windows hệ điều hành');
  if (/outlook|onenote|access|zalo/i.test(t)) hints.push(t.match(/outlook|onenote|access|zalo/i)[0]);
  if (/excel|word|powerpoint|office/i.test(t)) hints.push('Microsoft Office');
  const uniq = [...new Set(hints)];
  const out = uniq.length ? `${q}\n(${uniq.join('. ')})` : q;
  return out.slice(0, 1200);
}

function scoreKeywordMatch(expandedQuery, chunkText) {
  const keywords = expandedQuery.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\u0080-\uFFFF]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
  if (!keywords.length) return 0;
  const lowerText = chunkText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let s = 0;
  for (const kw of keywords) {
    if (kw.length < 2) continue;
    let matches = 0;
    let pos = 0;
    while ((pos = lowerText.indexOf(kw, pos)) !== -1) {
      matches++;
      pos += kw.length;
    }
    s += matches * (1 + Math.log(kw.length + 1));
  }
  return s;
}

/** Reciprocal Rank Fusion — kết hợp xếp hạng vector + từ khóa như các RAG hiện đại */
function rrfFuse(lists, k = 55, topN = 8) {
  const scores = new Map();
  const store = new Map();
  for (const list of lists) {
    list.forEach((item, rank) => {
      const id = chunkRetrievalId(item);
      scores.set(id, (scores.get(id) || 0) + 1 / (k + rank + 1));
      if (!store.has(id)) store.set(id, { ...item });
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, rrf]) => ({ ...store.get(id), score: rrf }));
}

// ─── Smart Search: Hybrid Vector + Keyword (RRF) ─────────────────────────────
async function searchKnowledge(query, topK = 5, apiKey = null) {
  if (!knowledgeIndex.topics) return [];
  const allChunks = [];

  for (const [key, topic] of Object.entries(knowledgeIndex.topics)) {
    for (const chunk of topic.chunks) {
      allChunks.push({
        topic: topic.label,
        topicKey: key,
        source: chunk.source || '',
        text: chunk.text,
        vector: chunk.vector || null,
      });
    }
  }
  if (!allChunks.length) return [];

  const expanded = expandQueryForRetrieval(query);
  const pool = 28;

  const kwRanked = allChunks
    .map(c => ({ ...c, kwScore: scoreKeywordMatch(expanded, c.text) }))
    .filter(c => c.kwScore > 0)
    .sort((a, b) => b.kwScore - a.kwScore)
    .slice(0, pool)
    .map(({ kwScore, ...c }) => c);

  if (knowledgeIndex.hasVectors && apiKey) {
    try {
      const queryVec = await embedQuery(expanded, apiKey);
      if (queryVec) {
        const vecRanked = allChunks
          .filter(c => c.vector)
          .map(c => {
            const cosine = cosineSimilarity(queryVec, c.vector);
            return { ...c, cosine };
          })
          .filter(c => c.cosine > 0.26)
          .sort((a, b) => b.cosine - a.cosine)
          .slice(0, pool);

        if (vecRanked.length > 0) {
          const fused = rrfFuse([vecRanked, kwRanked], 55, topK);
          const cosMap = new Map(vecRanked.map(c => [chunkRetrievalId(c), c.cosine]));
          return fused.map(h => {
            const id = chunkRetrievalId(h);
            const { cosine, score: rrf, ...base } = h;
            return {
              topic: base.topic,
              topicKey: base.topicKey,
              source: base.source,
              text: base.text,
              vector: base.vector,
              score: rrf,
              vectorSim: cosMap.get(id) ?? cosine,
            };
          });
        }
      }
    } catch { /* keyword only */ }
  }

  if (!kwRanked.length) return [];

  const results = kwRanked.slice(0, topK).map(c => ({
    ...c,
    score: scoreKeywordMatch(expanded, c.text),
  }));
  return results.sort((a, b) => b.score - a.score);
}

/** Kho nội bộ coi là chưa đủ → được phép gọi tìm kiếm web (Tavily) */
function knowledgeLooksWeak(hits) {
  if (!hits || hits.length === 0) return true;
  const top = hits[0];
  const vs = top.vectorSim;
  if (typeof vs === 'number') {
    if (vs < 0.3) return true;
    if (hits.length < 2 && vs < 0.4) return true;
    return false;
  }
  if (knowledgeIndex.hasVectors && typeof top.score === 'number') {
    return top.score < 0.02 || (hits.length < 2 && top.score < 0.026);
  }
  if (!knowledgeIndex.hasVectors && typeof top.score === 'number') {
    return hits.length < 2 && top.score < 2;
  }
  return false;
}

/** Tavily Search API — cần tavilyApiKey (Admin) hoặc biến môi trường TAVILY_API_KEY */
async function fetchTavilyContext(query, apiKey) {
  const q = String(query || '').trim().slice(0, 400);
  if (!q || !apiKey) return '';
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: q,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
  });
  if (!res.ok) {
    console.warn('[Tavily] HTTP', res.status);
    return '';
  }
  const data = await res.json();
  const lines = [];
  if (data.answer) lines.push('Tóm tắt: ' + String(data.answer).slice(0, 800));
  for (const r of (data.results || []).slice(0, 5)) {
    const title = r.title || '';
    const content = (r.content || '').slice(0, 450);
    const url = r.url || '';
    if (title || content) lines.push(`- ${title}: ${content}${url ? ` (${url})` : ''}`);
  }
  return lines.join('\n');
}

/**
 * RAG + (tuỳ chọn) web. blockTitle: tiêu đề khối giáo trình (Pro dùng tên khác).
 */
async function buildCurriculumContext(message, topK, embeddingApiKey, { useWeb = true, blockTitle = 'GIAO TRINH THAM KHAO' } = {}) {
  const hits = await searchKnowledge(message, topK, embeddingApiKey);
  let webSection = '';
  const tavily = (getSettings().tavilyApiKey || process.env.TAVILY_API_KEY || '').trim();
  if (useWeb && tavily && knowledgeLooksWeak(hits)) {
    try {
      webSection = await fetchTavilyContext(message, tavily);
    } catch (e) {
      console.warn('[Tavily]', e.message);
    }
  }
  let ctx = '';
  if (hits.length > 0) {
    ctx += `\n\n--- ${blockTitle} ---\n${hits.map(h => {
      const src = h.source ? ` | ${h.source}` : '';
      return `[${h.topic}${src}] ${h.text}`;
    }).join('\n')}\n--- HET ---`;
  }
  if (webSection) {
    ctx += `\n\n--- NGUON BO SUNG TU WEB (tham khao, uu tien giao trinh noi bo) ---\n${webSection}\n--- HET ---`;
  }
  return ctx;
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

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: 'Thiếu hoặc không hợp lệ ID học viên' });
  }

  const aiCost = getSettings().aiCost;
  let cost = aiCost.chatPro || 1;
  if (req.body.type === 'grade')    cost = aiCost.grade      || 3;
  if (aiMode === 'free')            cost = aiCost.chatFree   || 0;
  if (aiMode === 'openai')          cost = aiCost.chatOpenAI || 2;
  // Câu hỏi kèm ảnh: 2 Xu (tất cả mode Pro/OpenAI)
  if (req.body.imageBase64 && aiMode !== 'free') cost = Math.max(cost, aiCost.image || 2);

  try {
    const student = await Student.findById(studentId);

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

async function buildDynamicSystemPrompt(req) {
  const currentTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const hour = new Date().getHours();
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
[YÊU CẦU]: Khi trả lời, ưu tiên liên hệ với chủ đề học viên còn yếu (nếu câu hỏi liên quan). Một câu khích lệ ngắn, lịch sự và gợi ý ôn tập cụ thể — giữ phong cách chuyên nghiệp.`;
      }
    } catch { /* non-blocking */ }
  }

  return SYSTEM_PROMPT +
    `\n\n[DỮ LIỆU NGỮ CẢNH]\n` +
    `- Trình độ học viên: ${req.currentLevel || 'Mới bắt đầu'}\n` +
    `- Mục tiêu học tập: ${req.learningGoals || 'Nắm vững tin học cơ bản'}\n` +
    `- Thời gian: ${currentTime}\n` +
    (hour >= 23 || hour < 4 ? '- LƯU Ý: Học viên đang học đêm muộn. Cuối câu trả lời, nhắc nhẹ nhàng về tầm quan trọng của giấc ngủ với việc ghi nhớ kiến thức.\n' : '') +
    studentMemoryBlock +
    `\n[QUY TẮC BỔ SUNG]\n- Nếu học viên hỏi lại 3 lần về cùng một vấn đề, tự động đổi sang ví dụ thực tế hoàn toàn mới.`;
}

/** Ghép vào system prompt khi client gửi từ trang bài học */
function formatLessonContext(raw) {
  if (raw == null) return '';
  const s = String(raw)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  if (!s) return '';
  const t = s.length > 2800 ? `${s.slice(0, 2797)}...` : s;
  return `\n\n[NGỮ CẢNH BÀI HỌC — ưu tiên khi liên quan]\nHọc viên đang mở trang bài học trên Gia Sư Tin Học. Dùng thông tin dưới để gợi ý sát module, thao tác và thuật ngữ đúng phạm vi (không bịa nội dung không có trong ngữ cảnh).\n${t}\n`;
}

function ndjsonWrite(res, obj) {
  if (!res.writableEnded) res.write(`${JSON.stringify(obj)}\n`);
}

/** Gemini lỗi key/403/permission → thử OpenAI (Pro) */
function shouldFallbackGeminiToOpenAi(err) {
  const m = String(err?.message || err || '');
  return /403|401|400|404|API[_ ]?key|leaked|PERMISSION_DENIED|API_KEY|invalid[_ ]key|GenerateContent|generativelanguage\.googleapis|User location is not supported|not supported for the API use|billing has not been enabled/i.test(m);
}

function humanizeAiErrorForClient(raw) {
  const m = String(raw || 'Lỗi không xác định');
  if (/leaked|\[403 Forbidden\]|API key was reported as leaked|has been blocked/i.test(m)) {
    return 'Google đã chặn API key Gemini (thường do key bị lộ công khai). Tạo key mới tại https://aistudio.google.com/apikey và cập nhật trong Admin. Nếu đã cấu hình OpenAI, gửi lại tin nhắn ở chế độ Pro — hệ thống sẽ tự trả lời bằng OpenAI.';
  }
  if (/invalid_api_key|Incorrect API key provided/i.test(m)) {
    return 'OpenAI từ chối API key. Kiểm tra key trong Admin hoặc biến môi trường OPENAI_API_KEY.';
  }
  return m.length > 480 ? `${m.slice(0, 480)}…` : m;
}

/** Khi một model Gemini chat lỗi (404 tên model, quá tải, v.v.) → thử model kế tiếp */
const GEMINI_CHAT_MODEL_TRY_ORDER = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

function isGeminiChatModelRetryableError(err) {
  const m = String(err?.message || err || '');
  if (/API[_ ]?key|PERMISSION_DENIED|leaked|invalid[_ ]key|billing has not been enabled|User location is not supported/i.test(m)) {
    return false;
  }
  return /404|NOT_FOUND|not found|not supported|Invalid[^\n]*model|MODEL_NOT_FOUND|UNIMPLEMENTED|503|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED|Decommissioned|no longer available|Temporary|Service Unavailable/i.test(m);
}

function geminiStreamChunkText(chunk) {
  try {
    if (typeof chunk?.text === 'function') return chunk.text();
    return chunk?.text || '';
  } catch {
    return '';
  }
}

/** Stream chat as NDJSON lines: meta, text*, done | error */
async function streamAiChat(req, res) {
  const { message, history, aiMode = 'pro', imageBase64 } = req.body;
  const sEmail = req.body.studentEmail || '';

  let dynamicSystemPrompt;
  try {
    dynamicSystemPrompt = (await buildDynamicSystemPrompt(req)) + formatLessonContext(req.body?.lessonContext);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Lỗi build prompt' });
  }

  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  ndjsonWrite(res, { type: 'meta', remainingCoins: req.currentCoins });

  const finish = (aiResponseText, finalImageUrl, logLabel) => {
    ndjsonWrite(res, { type: 'done', remainingCoins: req.currentCoins, image_url: finalImageUrl || null });
    res.end();
    if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, logLabel, { aiMode, message: message?.slice(0, 60), stream: true });
    if (req.studentId && message) {
      logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode, imageUrl: imageBase64 ? 'Uploaded Image' : '' });
      logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode, coinCost: req.coinCost || 0, imageUrl: finalImageUrl || '' });
    }
  };

  const chunkTextOut = (full, chunkSize = 56) => {
    for (let i = 0; i < full.length; i += chunkSize) {
      ndjsonWrite(res, { type: 'text', text: full.slice(i, i + chunkSize) });
    }
  };

  const streamViaOpenAI = async (introNote, logLabel) => {
    const openaiKey = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
    if (!openaiKey) throw new Error('OpenAI API Key chưa được cấu hình.');
    const openai = new OpenAI({ apiKey: openaiKey });
    const _geminiKeyForSearch = (getSettings().geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    const ctx = await buildCurriculumContext(message, 5, _geminiKeyForSearch, { useWeb: true });
    let currentUserMsgContent = message?.trim() ? message : '[Bắt đầu trò chuyện]';
    if (imageBase64) {
      currentUserMsgContent = [
        { type: 'text', text: message?.trim() ? message : 'Phân tích ảnh:' },
        { type: 'image_url', image_url: { url: imageBase64 } }
      ];
    }
    const oaMessages = [
      { role: 'system', content: dynamicSystemPrompt + '\n\n[OpenAI GPT-4o-mini — trả phí] Trực tiếp như ChatGPT; Markdown gọn; không khung Bước Đồng cảm/Bản chất/Thực hành/Kiểm tra hiểu. Không emoji.' + ctx },
      ...(history || []).map(m => ({
        role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
        content: m.content?.trim() ? m.content : '[Ảnh/File đính kèm hoặc tin nhắn trống]'
      })),
      { role: 'user', content: currentUserMsgContent }
    ];
    if (introNote) ndjsonWrite(res, { type: 'text', text: introNote });
    if (imageBase64) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: oaMessages,
        max_tokens: 1500,
        temperature: 0.4,
      });
      const aiResponseText = completion.choices[0].message.content || '';
      chunkTextOut(aiResponseText);
      finish(aiResponseText, null, logLabel);
      return;
    }
    const oaStream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: oaMessages,
      stream: true,
      max_tokens: 1500,
      temperature: 0.4,
    });
    let fullText = '';
    for await (const part of oaStream) {
      const delta = part?.choices?.[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        ndjsonWrite(res, { type: 'text', text: delta });
      }
    }
    finish(fullText, null, logLabel);
  };

  try {
    if (aiMode === 'free') {
      const freeSys = dynamicSystemPrompt + "\n\n[CHẾ ĐỘ MIỄN PHÍ — 0 Xu] Trả lời súc tích, đúng trọng tâm, kiểu trợ lý AI hiện đại; không khung Bước Đồng cảm/Bản chất/Thực hành. Tối đa ~600 từ. Không emoji.";
      const ctx = await buildCurriculumContext(message, 3, null, { useWeb: false });
      const pollHistory = (history || []).map(m => ({
        role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
        content: m.content || m.parts
      }));
      const pollRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: freeSys + ctx }, ...pollHistory, { role: 'user', content: message }] })
      });
      let finalText = await pollRes.text();
      const imageKeywords = ['giao diện', 'minh họa', 'hình ảnh', 'hình vẽ', 'sơ đồ', 'ảnh minh', 'cho xem', 'trông như thế nào', 'màn hình', 'screenshot', 'ribbon', 'toolbar', 'chart look', 'như thế nào', 'nhìn như', 'hình dạng', 'cách hiển thị', 'ví dụ hình'];
      if (imageKeywords.some(kw => message.toLowerCase().includes(kw))) {
        try {
          const msg = message.toLowerCase();
          let softwareCtx = 'Microsoft Office';
          if (msg.includes('word') || msg.includes('văn bản') || msg.includes('soạn thảo')) softwareCtx = 'Microsoft Word 365';
          else if (msg.includes('powerpoint') || msg.includes('slide') || msg.includes('thuyết trình')) softwareCtx = 'Microsoft PowerPoint 365';
          else if (msg.includes('excel') || msg.includes('bảng tính') || msg.includes('pivot') || msg.includes('hàm')) softwareCtx = 'Microsoft Excel 365';
          else if (msg.includes('zalo')) softwareCtx = 'Zalo app on Vietnamese Windows';
          const imgPrompt = `Professional ${softwareCtx} tutorial screenshot, showing ${message.slice(0, 100)}, clean modern UI, Vietnamese Windows environment, high quality educational material`;
          const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?nologo=true&width=960&height=540&seed=${Date.now()}&model=flux`;
          finalText = finalText + `\n\n**Hình minh họa:**\n![Minh họa ${softwareCtx}](${imgUrl})`;
        } catch { /* noop */ }
      }
      chunkTextOut(finalText);
      finish(finalText, null, 'Chat AI Free');
      return;
    }

    if (aiMode === 'openai') {
      try {
        await streamViaOpenAI('', 'Chat OpenAI GPT-4o-mini');
      } catch (oaErr) {
        ndjsonWrite(res, { type: 'error', message: humanizeAiErrorForClient(oaErr.message) });
        res.end();
      }
      return;
    }

    try {
    const geminiKey = getSettings().geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!geminiKey) {
      const oaOnly = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
      if (aiMode === 'pro' && oaOnly) {
        try {
          await streamViaOpenAI('*[Chưa cấu hình Gemini — đang dùng OpenAI.]*\n\n', 'Chat AI Pro (OpenAI only)');
          return;
        } catch (e) {
          ndjsonWrite(res, { type: 'error', message: humanizeAiErrorForClient(e.message) });
          res.end();
          return;
        }
      }
      ndjsonWrite(res, { type: 'error', message: 'Google Gemini API Key chưa được cấu hình.' });
      res.end();
      return;
    }
    const genAI = new GoogleGenerativeAI(geminiKey);
    let systemInstruction = dynamicSystemPrompt + "\n\n[Gemini Flash — trả phí] Phân tích chi tiết khi cần; Markdown gọn (## tiêu đề trung lập, danh sách). Giọng như Google Gemini: trực tiếp, không khung 'Bước … – Đồng cảm/Bản chất/Thực hành/Kiểm tra hiểu'. Nghiêm cấm emoji.";
    systemInstruction += await buildCurriculumContext(message, 7, geminiKey, { useWeb: true, blockTitle: 'GIAO TRINH CHUYEN SAU (PRO)' });
    const tools = [{
      functionDeclarations: [{
        name: "create_realistic_illustration",
        description: "Generate a photorealistic and professional technical illustration based on a detailed prompt.",
        parameters: {
          type: "OBJECT",
          properties: {
            prompt: {
              type: "STRING",
              description: "A highly detailed, photorealistic visual prompt mapping the technical or educational concept."
            }
          },
          required: ["prompt"]
        }
      }]
    }];
    const chatHistory = (history || []).map(m => ({
      role: (m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || m.parts }]
    }));
    let msgPayload = message;
    if (imageBase64) {
      const mimeMatch = imageBase64.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      msgPayload = [{ text: message || "Phân tích ảnh" }, { inlineData: { data: base64Data, mimeType } }];
    }

    const buildGeminiChatModelOpts = (modelId) => {
      const o = {
        model: modelId,
        systemInstruction,
        generationConfig: { temperature: 0.4 },
      };
      if (!imageBase64) o.tools = tools;
      return o;
    };

    let streamResult;
    let currentChatForTools = null;
    let lastModelErr;
    for (const modelId of GEMINI_CHAT_MODEL_TRY_ORDER) {
      try {
        const model = genAI.getGenerativeModel(buildGeminiChatModelOpts(modelId));
        currentChatForTools = model.startChat({ history: chatHistory });
        streamResult = await currentChatForTools.sendMessageStream(msgPayload);
        if (modelId !== GEMINI_CHAT_MODEL_TRY_ORDER[0]) {
          console.warn(`Gemini chat stream: switched to model ${modelId}`);
        }
        lastModelErr = null;
        break;
      } catch (e) {
        lastModelErr = e;
        const lastInChain = modelId === GEMINI_CHAT_MODEL_TRY_ORDER[GEMINI_CHAT_MODEL_TRY_ORDER.length - 1];
        if (!isGeminiChatModelRetryableError(e) || lastInChain) {
          throw e;
        }
        console.warn(`Gemini chat stream: model ${modelId} failed, retry:`, String(e.message || e).slice(0, 200));
      }
    }
    if (!streamResult || !currentChatForTools) throw lastModelErr || new Error('Gemini stream: no model succeeded');

    let aiFull = '';
    for await (const chunk of streamResult.stream) {
      const piece = geminiStreamChunkText(chunk);
      if (piece) {
        aiFull += piece;
        ndjsonWrite(res, { type: 'text', text: piece });
      }
    }
    let resultResponse = await streamResult.response;
    let call = resultResponse.functionCalls()?.[0];
    let finalImageUrl = null;

    if (call && call.name === "create_realistic_illustration") {
      const genUrl = await generatePhotorealisticImage(call.args.prompt);
      finalImageUrl = genUrl;
      const extraCost = 1;
      if (req.studentId && req.currentCoins >= extraCost) {
        if (mongoose.Types.ObjectId.isValid(req.studentId)) {
          await Student.findByIdAndUpdate(req.studentId, { $inc: { coins: -extraCost, totalSpent: extraCost } });
        }
        req.currentCoins -= extraCost;
        req.coinCost += extraCost;
      }
      const funcStream = await currentChatForTools.sendMessageStream([{
        functionResponse: { name: 'create_realistic_illustration', response: { image_url: genUrl, success: true } }
      }]);
      for await (const chunk of funcStream.stream) {
        const piece = geminiStreamChunkText(chunk);
        if (piece) {
          aiFull += piece;
          ndjsonWrite(res, { type: 'text', text: piece });
        }
      }
    } else {
      const funcMatch = aiFull.match(/create_realistic_illustration\(\s*["'](.*?)["']\s*\)/);
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
          aiFull = aiFull.replace(funcMatch[0], "\n*(Đã tạo hình minh hoạ thành công)*\n").trim();
        } catch (e) {
          console.error("Stream hallucinated tool error:", e);
        }
      }
    }

    finish(aiFull, finalImageUrl, 'Chat AI Pro');
    } catch (gemErr) {
      if (aiMode === 'pro' && shouldFallbackGeminiToOpenAi(gemErr)) {
        const oa = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
        if (oa) {
          console.warn('Stream Pro: Gemini failed, OpenAI fallback:', String(gemErr.message || '').slice(0, 220));
          try {
            await streamViaOpenAI(
              '*Gemini không khả dụng — đang trả lời bằng OpenAI (GPT-4o-mini).*\n\n',
              'Chat AI Pro → OpenAI fallback'
            );
            return;
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        }
      }
      throw gemErr;
    }
  } catch (e) {
    console.error("AI Stream Error:", e.message);
    let errMsg = e.message || "Lỗi AI";
    if (errMsg.includes("429") || errMsg.includes("Quota")) {
      const match = errMsg.match(/retry in\s+([0-9.]+)s/);
      const seconds = match ? Math.ceil(parseFloat(match[1])) : 30;
      errMsg = `API Google quá tải. Vui lòng đợi ${seconds} giây rồi gửi lại.`;
    } else if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("Service Unavailable")) {
      errMsg = "Hệ thống AI đang bận. Vui lòng thử lại sau 15 giây.";
    } else {
      errMsg = humanizeAiErrorForClient(errMsg);
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: errMsg });
      return;
    }
    ndjsonWrite(res, { type: 'error', message: errMsg });
    res.end();
  }
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', requireAuth, forceOwnStudentFields(['studentId']), checkAndDeductCoins, async (req, res) => {
  try {
    if (req.body.stream === true) {
      return streamAiChat(req, res);
    }

    const settings  = getSettings();
    const { message, history, aiMode = 'pro', imageBase64 } = req.body;
    const sEmail = req.body.studentEmail || '';

    const dynamicSystemPrompt = (await buildDynamicSystemPrompt(req)) + formatLessonContext(req.body?.lessonContext);

    // ── Free mode — dùng Pollinations ────────────────────────────────────────
    if (aiMode === 'free') {
      const freeSys = dynamicSystemPrompt + "\n\n[CHẾ ĐỘ MIỄN PHÍ — 0 Xu] Trả lời súc tích, đúng trọng tâm, kiểu trợ lý AI hiện đại; không khung Bước Đồng cảm/Bản chất/Thực hành. Tối đa ~600 từ. Không emoji.";
      const ctx     = await buildCurriculumContext(message, 3, null, { useWeb: false });

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
      const ctx    = await buildCurriculumContext(message, 5, _geminiKeyForSearch, { useWeb: true });

      let currentUserMsgContent = message?.trim() ? message : '[Bắt đầu trò chuyện]';
      if (imageBase64) {
        currentUserMsgContent = [
          { type: 'text', text: message?.trim() ? message : 'Phân tích ảnh:' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ];
      }

      const oaMessages = [
        { role: 'system', content: dynamicSystemPrompt + '\n\n[OpenAI GPT-4o-mini — trả phí] Trực tiếp như ChatGPT; Markdown gọn; không khung Bước Đồng cảm/Bản chất/Thực hành/Kiểm tra hiểu. Không emoji.' + ctx },
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
      const oaOnly = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
      if (oaOnly) {
        const openai = new OpenAI({ apiKey: oaOnly });
        const ctx = await buildCurriculumContext(message, 5, '', { useWeb: true });
        const oaMessages = [
          { role: 'system', content: dynamicSystemPrompt + '\n\n[OpenAI GPT-4o-mini — chưa cấu hình Gemini] Markdown gọn. Không emoji.' + ctx },
          ...(history || []).map(m => ({
            role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
            content: m.content?.trim() ? m.content : '[Ảnh/File đính kèm hoặc tin nhắn trống]'
          })),
          { role: 'user', content: message?.trim() ? message : '[Bắt đầu trò chuyện]' }
        ];
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: oaMessages,
          max_tokens: 1500,
          temperature: 0.4,
        });
        let aiResponseText = completion.choices[0].message.content || '';
        aiResponseText = '*[Chưa cấu hình Gemini — trả lời bằng OpenAI.]*\n\n' + aiResponseText;
        res.json({ success: true, data: { text: aiResponseText, role: 'ai', image_url: null, remainingCoins: req.currentCoins } });
        if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, 'Chat AI Pro (OpenAI only)', { aiMode: 'pro', message: message?.slice(0, 60) });
        if (req.studentId && message) {
          logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode: 'pro' });
          logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode: 'pro', coinCost: req.coinCost || 0 });
        }
        return;
      }
      return res.status(503).json({ success: false, message: 'Google Gemini API Key chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    }
    const genAI = new GoogleGenerativeAI(geminiKey);

    let systemInstruction = dynamicSystemPrompt + "\n\n[Gemini Flash — trả phí] Phân tích chi tiết khi cần; Markdown gọn (## tiêu đề trung lập, danh sách). Giọng như Google Gemini: trực tiếp, không khung 'Bước … – Đồng cảm/Bản chất/Thực hành/Kiểm tra hiểu'. Nghiêm cấm emoji.";
    systemInstruction += await buildCurriculumContext(message, 7, geminiKey, { useWeb: true, blockTitle: 'GIAO TRINH CHUYEN SAU (PRO)' });

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

    const chatHistory = (history || []).map(m => ({
      role: (m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || m.parts }]
    }));

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

    const buildGeminiSyncModelOpts = (modelId) => {
      const o = {
        model: modelId,
        systemInstruction,
        generationConfig: { temperature: 0.4 },
      };
      if (!imageBase64) o.tools = tools;
      return o;
    };

    let result;
    let currentChat = null;
    let lastErr;
    for (const modelId of GEMINI_CHAT_MODEL_TRY_ORDER) {
      try {
        const model = genAI.getGenerativeModel(buildGeminiSyncModelOpts(modelId));
        currentChat = model.startChat({ history: chatHistory });
        result = await currentChat.sendMessage(msgPayload);
        if (modelId !== GEMINI_CHAT_MODEL_TRY_ORDER[0]) {
          console.warn(`Gemini chat sync: switched to model ${modelId}`);
        }
        lastErr = null;
        break;
      } catch (primaryErr) {
        lastErr = primaryErr;
        const lastInChain = modelId === GEMINI_CHAT_MODEL_TRY_ORDER[GEMINI_CHAT_MODEL_TRY_ORDER.length - 1];
        if (isGeminiChatModelRetryableError(primaryErr) && !lastInChain) {
          console.warn(`Gemini chat sync: model ${modelId} failed, retry:`, String(primaryErr.message || primaryErr).slice(0, 200));
          continue;
        }
        break;
      }
    }

    if (!result) {
      if (lastErr && shouldFallbackGeminiToOpenAi(lastErr)) {
        const openaiKey = (getSettings().openaiKey || process.env.OPENAI_API_KEY || '').trim();
        if (openaiKey) {
          console.warn('Pro sync: Gemini failed, OpenAI fallback:', String(lastErr.message || '').slice(0, 220));
          const openai = new OpenAI({ apiKey: openaiKey });
          const _gk = (getSettings().geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
          const ctx = await buildCurriculumContext(message, 5, _gk, { useWeb: true });
          let currentUserMsgContent = message?.trim() ? message : '[Bắt đầu trò chuyện]';
          if (imageBase64) {
            currentUserMsgContent = [
              { type: 'text', text: message?.trim() ? message : 'Phân tích ảnh:' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ];
          }
          const oaMessages = [
            { role: 'system', content: dynamicSystemPrompt + '\n\n[OpenAI GPT-4o-mini — dự phòng khi Gemini lỗi] Trực tiếp như ChatGPT; Markdown gọn. Không emoji.' + ctx },
            ...(history || []).map(m => ({
              role: (m.role === 'ai' || m.role === 'model') ? 'assistant' : 'user',
              content: m.content?.trim() ? m.content : '[Ảnh/File đính kèm hoặc tin nhắn trống]'
            })),
            { role: 'user', content: currentUserMsgContent }
          ];
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: oaMessages,
            max_tokens: 1500,
            temperature: 0.4,
          });
          let aiResponseText = completion.choices[0]?.message?.content || '';
          aiResponseText = '*[Gemini không khả dụng — trả lời bằng OpenAI.]*\n\n' + aiResponseText;
          res.json({ success: true, data: { text: aiResponseText, role: 'ai', image_url: null, remainingCoins: req.currentCoins } });
          if (req.coinCost > 0) logTx(req.studentId, req.studentName, 'spend_chat', -req.coinCost, req.currentCoins, 'Chat AI Pro → OpenAI fallback', { aiMode: 'pro', message: message?.slice(0, 60) });
          if (req.studentId && message) {
            logChat(req.studentId, req.studentName, sEmail, 'user', message, { aiMode: 'pro', imageUrl: imageBase64 ? 'Uploaded Image' : '' });
            logChat(req.studentId, req.studentName, sEmail, 'ai', aiResponseText, { aiMode: 'pro', coinCost: req.coinCost || 0, imageUrl: '' });
          }
          return;
        }
      }
      throw lastErr || new Error('Gemini chat sync failed');
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
    } else {
      errMsg = humanizeAiErrorForClient(errMsg);
    }
    res.status(500).json({ success: false, message: errMsg });
  }
});

// ─── POST /api/ai/generate-quiz ───────────────────────────────────────────────
router.post('/generate-quiz', requireAuth, forceOwnStudentFields(['studentId']), async (req, res) => {
  try {
    const { topic, numQuestions, studentId } = req.body;
    const aiCost = getSettings().aiCost;
    let cost = 0;
    if (numQuestions === 10)      cost = aiCost.quiz10 || 5;
    else if (numQuestions === 20) cost = aiCost.quiz20 || 8;
    else if (numQuestions === 30) cost = aiCost.quiz30 || 15;
    else                          cost = Math.ceil(numQuestions / 2);
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Thieu ID hoc vien' });
    }
    const student = await Student.findById(studentId);
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

    const systemPrompt = `Bạn là Trợ lý Tư vấn Học Tập của trung tâm "Gia Sư Tin Học". Nhiệm vụ DUY NHẤT của bạn là tư vấn về lộ trình học tập, khóa học và chương trình đào tạo của trung tâm.

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
