/**
 * scripts/build_knowledge.cjs
 * Chạy: node scripts/build_knowledge.cjs
 *
 * Quét PDF/DOCX/TXT từ data/knowledge/
 * → Tạo embedding vector (Gemini text-embedding-004) cho từng đoạn
 * → Xuất src/data/knowledge/knowledgeIndex.json
 */

const fs       = require('fs');
const path     = require('path');
const mammoth  = require('mammoth');
const https    = require('https');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) { /* dotenv optional */ }

const INPUT_DIR   = path.join(__dirname, '..', 'data', 'knowledge');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'knowledge', 'knowledgeIndex.json');

// Lấy Gemini API key từ .env
function loadEnvKey() {
  const fromEnv = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*(.+)/);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch { return ''; }
}

const TOPIC_MAP = {
  excel:       'Excel & Phân Tích Dữ Liệu',
  word:        'Microsoft Word',
  powerpoint:  'Microsoft PowerPoint',
  networking:  'Mạng Máy Tính & An Toàn Thông Tin',
  ic3:         'Luyện Thi IC3 GS6',
  mos:         'Chứng Chỉ MOS (Microsoft Office Specialist)',
  windows:     'Hệ Điều Hành Windows',
  python:      'Lập Trình Python',
  c:           'Lập Trình C/C++',
  database:    'Cơ Sở Dữ Liệu',
  zalo:        'Hướng Dẫn Sử Dụng Zalo',
  other:       'Kiến Thức Tổng Hợp',
};

/* ── Trích xuất text từ PDF bằng pdfjs-dist ─────────────── */
async function extractPdf(filePath) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc  = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page    = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(it => it.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

/* ── Trích xuất text ─────────────────────────────────────── */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf')  { return await extractPdf(filePath); }
  if (ext === '.docx') { const r = await mammoth.extractRawText({ path: filePath }); return r.value; }
  if (ext === '.txt')  { return fs.readFileSync(filePath, 'utf-8'); }
  return null;
}


/* ── Làm sạch text ───────────────────────────────────────── */
function cleanText(raw) {
  return raw.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Chia đoạn: ưu tiên đoạn văn (\\n\\n), sau đó câu — ngữ cảnh dài hơn giúp embedding/RAG giống trợ lý đọc tài liệu.
 */
function chunkText(text, maxLen = 900, overlap = 140) {
  const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const units = [];
  for (const p of paras) {
    if (p.length <= maxLen) {
      units.push(p);
      continue;
    }
    const sentences = p.split(/(?<=[.!?\u3002\uFF01\uFF1F\n])\s+/);
    let current = '';
    for (const s of sentences) {
      const part = s.trim();
      if (!part) continue;
      if ((current + ' ' + part).length > maxLen && current) {
        units.push(current.trim());
        const words = current.split(/\s+/);
        const keep = Math.max(8, Math.floor(overlap / 5));
        current = words.slice(-keep).join(' ') + ' ' + part;
      } else {
        current += (current ? ' ' : '') + part;
      }
    }
    if (current.trim()) units.push(current.trim());
  }
  const merged = [];
  let buf = '';
  for (const u of units) {
    if ((buf + '\n\n' + u).length <= maxLen || !buf) {
      buf = buf ? `${buf}\n\n${u}` : u;
    } else {
      if (buf.length > 40) merged.push(buf);
      buf = u;
    }
  }
  if (buf.length > 40) merged.push(buf);
  return merged.filter(c => c.length > 35);
}

/** Tiền tố chủ đề + file giúp vector & keyword trùng khớp câu hỏi tốt hơn */
function enrichChunkForIndex(label, fileName, body) {
  const head = `[Chủ đề: ${label}] [Tài liệu: ${fileName}]`;
  return `${head}\n${body.trim()}`;
}

/* ── Gọi Gemini Embedding API ────────────────────────────── */
async function getEmbedding(text, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text: text.slice(0, 2000) }] }
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };

    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.embedding?.values || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/* ── Delay helper ────────────────────────────────────────── */
const delay = ms => new Promise(r => setTimeout(r, ms));

/* ── Main ─────────────────────────────────────────────────── */
async function main() {
  console.log('='.repeat(56));
  console.log('  GIASUAI — AI Knowledge Builder (Semantic Embedding)');
  console.log('='.repeat(56));

  const apiKey = loadEnvKey();
  const useEmbedding = !!apiKey;

  if (useEmbedding) {
    console.log('  ✅ Gemini API Key found — Semantic Vector Search ENABLED');
  } else {
    console.log('  ⚠️  No API Key — Falling back to keyword-only indexing');
  }
  console.log('');

  const index = {
    builtAt:   new Date().toISOString(),
    hasVectors: useEmbedding,
    topics:    {},
    stats:     { totalFiles: 0, totalChunks: 0, skipped: 0 },
  };

  const folders = fs.readdirSync(INPUT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let totalEmbedded = 0;
  let totalFailed   = 0;

  for (const folder of folders) {
    const key   = folder.toLowerCase();
    const label = TOPIC_MAP[key] || folder;
    const dir   = path.join(INPUT_DIR, folder);
    const files = fs.readdirSync(dir).filter(f =>
      ['.pdf', '.docx', '.txt'].includes(path.extname(f).toLowerCase())
    );

    if (!index.topics[key]) index.topics[key] = { label, chunks: [] };

    for (const file of files) {
      try {
        const raw = await extractText(path.join(dir, file));
        if (!raw) { index.stats.skipped++; continue; }

        const chunks = chunkText(cleanText(raw));
        console.log(`  [READ] ${folder}/${file} — ${chunks.length} đoạn`);

        for (let i = 0; i < chunks.length; i++) {
          const enriched = enrichChunkForIndex(label, file, chunks[i]);
          const chunkData = { source: file, text: enriched, vector: null };

          if (useEmbedding) {
            try {
              // Rate limit: tối đa ~1500 req/phút → 40ms/req
              if (i > 0 && i % 10 === 0) await delay(500);
              const vector = await getEmbedding(enriched, apiKey);
              chunkData.vector = vector;
              if (vector) totalEmbedded++;
              else totalFailed++;

              process.stdout.write(`\r    Embedding chunk ${i + 1}/${chunks.length}...`);
            } catch (embErr) {
              console.error(`\n    [EMBED ERR] ${embErr.message}`);
              totalFailed++;
            }
          }

          index.topics[key].chunks.push(chunkData);
        }
        if (useEmbedding) process.stdout.write('\n');

        index.stats.totalFiles++;
        console.log(`  [OK] ${folder}/${file} — ${chunks.length} chunks indexed`);
      } catch (err) {
        console.error(`  [ERR] ${folder}/${file}: ${err.message}`);
        index.stats.skipped++;
      }
    }
    index.stats.totalChunks += index.topics[key].chunks.length;
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf-8');

  console.log('');
  console.log('  ═══════════════════════════════════════════════════');
  console.log(`  Files          : ${index.stats.totalFiles}`);
  console.log(`  Total Chunks   : ${index.stats.totalChunks}`);
  if (useEmbedding) {
    console.log(`  Embedded OK    : ${totalEmbedded}`);
    console.log(`  Embed Failed   : ${totalFailed}`);
    console.log(`  Search Mode    : SEMANTIC (Vector + Keyword fallback)`);
  } else {
    console.log(`  Search Mode    : KEYWORD ONLY`);
  }
  console.log(`  Output         : src/data/knowledge/knowledgeIndex.json`);
  console.log('  ═══════════════════════════════════════════════════');
}

main().catch(err => { console.error('[FATAL]', err.message); process.exit(1); });
