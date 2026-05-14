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

/** 4 gói tháng chuẩn — id cố định để client / thanh toán đồng bộ */
const DEFAULT_COIN_PACKAGES_MONTH = [
  { id: 'free', label: 'Gói Miễn Phí', price: '0₫', coins: 0, bonus: 'Khởi đầu', color: '#64748b', priceMs: 0, billingCycle: 'month' },
  { id: 'standard', label: 'Gói Tiêu Chuẩn', price: '199.000₫', coins: 220, bonus: '+10%', color: '#6366f1', priceMs: 199000, billingCycle: 'month' },
  { id: 'pro', label: 'Gói Pro', price: '499.000₫', coins: 600, bonus: '+20%', color: '#10b981', priceMs: 499000, billingCycle: 'month' },
  { id: 'vip', label: 'Gói VIP', price: '999.000₫', coins: 1400, bonus: '+40%', color: '#f59e0b', priceMs: 999000, billingCycle: 'month' },
];

const CANON_IDS = ['free', 'standard', 'pro', 'vip'];

function isYearPack(p) {
  return String(p.billingCycle || 'month') === 'year';
}

function yearVariantFromMonthRow(p) {
  const srcPrice = Number(p.priceMs || 0);
  const priceMs =
    srcPrice <= 0 ? 0 : Math.max(1000, Math.round(srcPrice * 12 * 0.83));
  const srcCoins = Number(p.coins || 0);
  const coins =
    srcCoins <= 0 ? 0 : Math.max(1, Math.round(srcCoins * 12 * 1.08));
  const baseId = String(p.id || '').trim();
  return {
    ...p,
    id: `y${baseId}`,
    billingCycle: 'year',
    priceMs,
    coins,
    price: formatVndPrice(priceMs),
    bonus: 'Tiết kiệm ~17% so với 12 tháng lẻ',
  };
}

/** Gói miễn phí (id free / yfree) luôn theo mặc định hệ thống — không chỉnh qua API/admin. */
function applyImmutableFreeCoinPackages(pkgs) {
  if (!Array.isArray(pkgs)) return pkgs;
  const defFree = { ...DEFAULT_COIN_PACKAGES_MONTH[0] };
  const defYFree = yearVariantFromMonthRow(defFree);
  return pkgs.map((p) => {
    const id = String(p.id || '').toLowerCase();
    if (id === 'free') return { ...defFree };
    if (id === 'yfree') return { ...defYFree };
    return p;
  });
}

/**
 * Luôn trả về đúng 8 phần tử: 4 tháng + 4 năm (yfree…yvip).
 * Gộp cấu hình cũ (id 1,2, y1…) về id chuẩn để trang nạp / API thanh toán khớp.
 */
export function normalizeCoinPackages(pkgs) {
  const raw = Array.isArray(pkgs) && pkgs.length > 0 ? pkgs : DEFAULT_COIN_PACKAGES_MONTH;
  const monthRows = raw.filter((p) => !isYearPack(p));

  const hasAllCanon =
    CANON_IDS.every((id) =>
      monthRows.some((p) => String(p.id || '').toLowerCase() === id),
    );

  let fourMonth;
  if (hasAllCanon) {
    fourMonth = CANON_IDS.map((id) => {
      const found = monthRows.find((p) => String(p.id || '').toLowerCase() === id);
      if (found) {
        return {
          ...found,
          id,
          billingCycle: 'month',
          price: found.price || formatVndPrice(Number(found.priceMs) || 0),
        };
      }
      const def = DEFAULT_COIN_PACKAGES_MONTH.find((d) => d.id === id);
      return { ...(def || DEFAULT_COIN_PACKAGES_MONTH[0]) };
    });
  } else {
    const candidates = monthRows.filter(
      (p) => !/^y\d+$/i.test(String(p.id || '').trim()),
    );
    const sorted = [...candidates].sort(
      (a, b) => (Number(a.priceMs) || 0) - (Number(b.priceMs) || 0),
    );
    const freeRow =
      sorted.find((p) => Number(p.priceMs) <= 0) ||
      DEFAULT_COIN_PACKAGES_MONTH[0];
    const paid = sorted.filter((p) => Number(p.priceMs) > 0);
    let standardP;
    let proP;
    let vipP;
    if (paid.length >= 3) {
      standardP = paid[paid.length - 3];
      proP = paid[paid.length - 2];
      vipP = paid[paid.length - 1];
    } else if (paid.length === 2) {
      standardP = paid[0];
      proP = paid[1];
      vipP = DEFAULT_COIN_PACKAGES_MONTH[3];
    } else if (paid.length === 1) {
      standardP = paid[0];
      proP = DEFAULT_COIN_PACKAGES_MONTH[2];
      vipP = DEFAULT_COIN_PACKAGES_MONTH[3];
    } else {
      standardP = DEFAULT_COIN_PACKAGES_MONTH[1];
      proP = DEFAULT_COIN_PACKAGES_MONTH[2];
      vipP = DEFAULT_COIN_PACKAGES_MONTH[3];
    }
    fourMonth = [
      {
        ...freeRow,
        id: 'free',
        billingCycle: 'month',
        bonus: freeRow.bonus || 'Khởi đầu',
        price: freeRow.price || formatVndPrice(Number(freeRow.priceMs) || 0),
      },
      {
        ...standardP,
        id: 'standard',
        billingCycle: 'month',
        price: standardP.price || formatVndPrice(Number(standardP.priceMs) || 0),
      },
      {
        ...proP,
        id: 'pro',
        billingCycle: 'month',
        price: proP.price || formatVndPrice(Number(proP.priceMs) || 0),
      },
      {
        ...vipP,
        id: 'vip',
        billingCycle: 'month',
        price: vipP.price || formatVndPrice(Number(vipP.priceMs) || 0),
      },
    ];
  }

  const fourYear = fourMonth.map((p) => yearVariantFromMonthRow(p));
  return applyImmutableFreeCoinPackages([...fourMonth, ...fourYear]);
}

export const getSettings = () => {
  let settings = {
    geminiKey: '',
    openaiKey: '',
    tavilyApiKey: '',
    coinPackages: [...DEFAULT_COIN_PACKAGES_MONTH],
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

  settings.coinPackages = normalizeCoinPackages(settings.coinPackages);

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
    if (Array.isArray(newSettings.coinPackages)) {
      newSettings.coinPackages = normalizeCoinPackages(newSettings.coinPackages);
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
    res.json({ success: true, message: 'Đã lưu cấu hình API thành công', data: getSettings() });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
