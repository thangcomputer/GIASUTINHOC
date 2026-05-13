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

export const getSettings = () => {
  let settings = {
    geminiKey: '',
    openaiKey: '',
    tavilyApiKey: '',
    coinPackages: [
      { id: '1', label: 'Gói Khởi Động', price: '50.000₫',  coins: 50,  bonus: '0%',   color: '#3b82f6', priceMs: 50000  },
      { id: '2', label: 'Gói Tiêu Chuẩn', price: '100.000₫', coins: 110, bonus: '+10%', color: '#6366f1', priceMs: 100000 },
      { id: '3', label: 'Gói Nâng Cao',   price: '200.000₫', coins: 230, bonus: '+15%', color: '#10b981', priceMs: 200000 },
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
