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

const INPUT_DIR   = path.join(__dirname, '..', 'data', 'knowledge');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'knowledge', 'knowledgeIndex.json');

// Lấy Gemini API key từ .env
function loadEnvKey() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/(?:GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*(.+)/);
    return match ? match[1].trim() : '';
  } catch { return ''; }
}

const TOPIC_MAP = {
  excel:       'Excel & Phân Tích Dữ Liệu',
  word:        'Microsoft Word',
  powerpoint:  'Microsoft PowerPoint',
  networking:  'Mạng Máy Tính & An Toàn Thông Tin',
  ic3:         'Luyện Thi IC3 GS6',
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

/* ── Chia đoạn ~600 ký tự (overlap 100) ─────────────────── */
function chunkText(text, maxLen = 600, overlap = 100) {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim());
      // Overlap: giữ lại ~overlap ký tự cuối
      const words = current.split(' ');
      current = words.slice(-Math.floor(overlap / 6)).join(' ') + ' ' + s;
    } else {
      current += (current ? ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 30);
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
          const chunkData = { source: file, text: chunks[i], vector: null };

          if (useEmbedding) {
            try {
              // Rate limit: tối đa ~1500 req/phút → 40ms/req
              if (i > 0 && i % 10 === 0) await delay(500);
              const vector = await getEmbedding(chunks[i], apiKey);
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
