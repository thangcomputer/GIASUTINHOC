import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';
import { WELCOME_COINS, LOW_CREDIT_WARN_THRESHOLD } from '../constants/credits.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SETTINGS_FILE = path.join(__dirname, '..', 'config', 'settings.json');

if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
}

function formatVndPrice(ms) {
  const n = Math.round(Number(ms) || 0);
  return `${n.toLocaleString('vi-VN')}₫`;
}

export const getSettings = () => {
  let settings = {
    geminiKey: '',
    openaiKey: '',
    tavilyApiKey: '',
    coinPackages: [
      { id: '1', label: 'Gói Khởi Động', price: '50.000₫', coins: 50, bonus: '0%', color: '#3b82f6', priceMs: 50000 },
      { id: '2', label: 'Gói Tiêu Chuẩn', price: '100.000₫', coins: 110, bonus: '+10%', color: '#6366f1', priceMs: 100000 },
      { id: '3', label: 'Gói Nâng Cao', price: '200.000₫', coins: 230, bonus: '+15%', color: '#10b981', priceMs: 200000 },
      { id: '4', label: 'Gói Chuyên Gia', price: '500.000₫', coins: 600, bonus: '+20%', color: '#f59e0b', priceMs: 500000 },
    ],
    aiCost: {
      chatPro: 1, chatFree: 0, chatOpenAI: 2, image: 2, grade: 3, quiz10: 5, quiz20: 8, quiz30: 15
    }
  };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const userSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      settings = { ...settings, ...userSettings };
    }
  } catch (e) {
    console.error('Lỗi đọc settings:', e.message);
  }

  const pkgs = settings.coinPackages || [];
  const hasYearTier = pkgs.some((p) => p.billingCycle === 'year');
  const hasSynthYearId = pkgs.some((p) => /^y\d/.test(String(p.id || '')));
  const monthBase = pkgs.filter(
    (p) => (p.billingCycle || 'month') !== 'year' && !String(p.id || '').startsWith('y'),
  );
  if (!hasYearTier && !hasSynthYearId && monthBase.length > 0 && monthBase.length <= 6) {
    const monthSource = monthBase.map((p) => ({
      ...p,
      billingCycle: 'month',
    }));
    const yearAppend = monthSource.map((p, idx) => {
      const baseId = String(p.id ?? idx + 1);
      const priceMs = Math.max(1000, Math.round(Number(p.priceMs || 0) * 12 * 0.83));
      const coins = Math.max(1, Math.round(Number(p.coins || 0) * 12 * 1.08));
      return {
        ...p,
        id: `y${baseId}`,
        billingCycle: 'year',
        priceMs,
        coins,
        price: formatVndPrice(priceMs),
        bonus: 'Tiết kiệm ~17% so với 12 tháng lẻ',
      };
    });
    settings = {
      ...settings,
      coinPackages: [...monthSource, ...yearAppend],
    };
  }

  return settings;
};

/** Không lộ API key ra client */
export function toPublicSettings(full) {
  const { geminiKey, openaiKey, tavilyApiKey, ...rest } = full;
  return {
    ...rest,
    hasGeminiKey: !!(geminiKey && String(geminiKey).trim()),
    hasOpenaiKey: !!(openaiKey && String(openaiKey).trim()),
    hasTavilyKey: !!(tavilyApiKey && String(tavilyApiKey).trim()),
  };
}

// GET /api/settings/public — gói nạp, giá AI (ẩn key)
router.get('/public', (req, res) => {
  res.json({
    success: true,
    data: {
      ...toPublicSettings(getSettings()),
      welcomeBonusCoins: WELCOME_COINS,
      lowCreditWarnThreshold: LOW_CREDIT_WARN_THRESHOLD,
    },
  });
});

// GET /api/settings — đầy đủ (chỉ admin)
router.get('/', requireAdmin, (req, res) => {
  res.json({ success: true, data: getSettings() });
});

// POST /api/settings — lưu (chỉ admin)
router.post('/', requireAdmin, (req, res) => {
  try {
    const current = getSettings();
    const newSettings = { ...current, ...req.body };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
    res.json({ success: true, message: 'Đã lưu cấu hình API thành công', data: newSettings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
