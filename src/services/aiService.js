/**
 * aiService.js
 * Giao tiếp với API Backend Node.js chạy nội bộ (Fullstack Monolithic)
 */

import { studentJsonAuthHeaders } from '../lib/authFetch';
import { getApiBaseUrl } from '../lib/apiBase';
import { promptInsufficientCredits } from '../lib/insufficientCredits.js';

const API_URL = getApiBaseUrl();

/** JWT middleware ghi đè studentId, nhưng gửi đúng id giúp log rõ; ưu tiên giasu_user (đồng bộ với phần còn của app). */
function readStoredStudentId() {
  try {
    const g = JSON.parse(localStorage.getItem('giasu_user') || '{}');
    if (g._id) return g._id;
  } catch { /* noop */ }
  const uis = localStorage.getItem('user_info');
  if (!uis) return null;
  try {
    const u = JSON.parse(uis);
    return u._id || u.id || null;
  } catch {
    return null;
  }
}

function persistCoinsToStorage(remainingCoins) {
  if (remainingCoins === undefined || remainingCoins === null) return;
  try {
    const uis = localStorage.getItem('user_info');
    if (uis) {
      const uo = JSON.parse(uis);
      uo.coins = remainingCoins;
      localStorage.setItem('user_info', JSON.stringify(uo));
    }
  } catch { /* noop */ }
  try {
    const gs = localStorage.getItem('giasu_user');
    if (gs) {
      const gu = JSON.parse(gs);
      gu.coins = remainingCoins;
      localStorage.setItem('giasu_user', JSON.stringify(gu));
    }
  } catch { /* noop */ }
  window.dispatchEvent(new Event('storage'));
}

export async function sendMessageToAI(userMessage, conversationHistory = [], requireImage = false, aiMode = 'pro', imageBase64 = null) {
  try {
    const studentId = readStoredStudentId();

    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: studentJsonAuthHeaders(),
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory,
        type: requireImage ? 'image' : 'text',
        aiMode: aiMode,
        studentId: studentId,
        imageBase64: imageBase64
      })
    });

    let result = {};
    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (response.status === 402) {
      await promptInsufficientCredits(result.message);
      return {
        text: '[HỆ THỐNG]: Số dư xu không đủ. Bạn có thể nạp thêm xu hoặc xem bảng giá.',
        image_url: null,
      };
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lỗi kết nối đến máy chủ AI');
    }

    // Kết quả trả về cấu trúc: { data: { text, role, remainingCoins } }
    const { text, remainingCoins } = result.data;
    
    // Bóc tách kết quả JSON trả về từ mô hình (ví dụ bộ khung MOS, IC3) nếu có
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/i);
    if (jsonMatch) {
      const jsonString = jsonMatch[1];
      Promise.resolve().then(() => {
        try {
          const parsedData = JSON.parse(jsonString);
          const existingData = JSON.parse(localStorage.getItem('ai_curriculums') || '[]');
          existingData.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: parsedData
          });
          localStorage.setItem('ai_curriculums', JSON.stringify(existingData));
        } catch (e) {
          console.error("Lỗi trích xuất JSON:", e);
        }
      });
    }

    if (remainingCoins !== undefined) {
      persistCoinsToStorage(remainingCoins);
    }

    return {
      text: text,
      image_url: result.data.image_url || null
    };
    
  } catch (error) {
    console.error('API Connect Error:', error);
    return {
      text: `[HỆ THỐNG]: ${error.message}`,
      image_url: null
    };
  }
}

/**
 * Stream chat (NDJSON). OpenAI + ảnh đính kèm: server gom bản đầy đủ rồi trả theo chunk (không dùng tool).
 */
export async function sendMessageStreamToAI(userMessage, conversationHistory = [], aiMode = 'pro', imageBase64 = null, {
  onMeta,
  onTextChunk,
  onDone,
  onError,
} = {}) {
  const studentId = readStoredStudentId();

  let response;
  try {
    response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: studentJsonAuthHeaders(),
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory,
        type: 'text',
        aiMode,
        studentId,
        imageBase64,
        stream: true,
      }),
    });
  } catch (e) {
    onError?.(e);
    throw e;
  }

  let result = {};
  if (response.status === 402) {
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    await promptInsufficientCredits(result.message);
    const err = new Error(result.message || 'Số dư xu không đủ');
    onError?.(err);
    throw err;
  }

  if (!response.ok) {
    try {
      result = await response.json();
    } catch {
      result = {};
    }
    const err = new Error(result.message || response.statusText || `Lỗi ${response.status}`);
    onError?.(err);
    throw err;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const err = new Error('Trình duyệt không hỗ trợ đọc stream');
    onError?.(err);
    throw err;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let imageUrl = null;
  let remainingCoins;
  let streamDoneReceived = false;

  const handleEvent = (evt) => {
    if (evt.type === 'meta') {
      remainingCoins = evt.remainingCoins;
      onMeta?.(evt);
    }
    if (evt.type === 'text' && evt.text) {
      fullText += evt.text;
      onTextChunk?.(evt.text, fullText);
    }
    if (evt.type === 'done') {
      streamDoneReceived = true;
      remainingCoins = evt.remainingCoins ?? remainingCoins;
      imageUrl = evt.image_url || null;
      onDone?.({ fullText, image_url: imageUrl, remainingCoins });
    }
    if (evt.type === 'error') {
      const err = new Error(evt.message || 'Lỗi stream');
      onError?.(err);
      throw err;
    }
  };

  const processLine = (line) => {
    const t = line.trim();
    if (!t) return;
    let evt;
    try {
      evt = JSON.parse(t);
    } catch {
      return;
    }
    handleEvent(evt);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      // Phải decode chunk cuối TRƯỚC khi thoát: done=true vẫn có thể kèm value (dòng `done` NDJSON).
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      }
      if (done) {
        buffer += decoder.decode();
      }

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        processLine(line);
      }

      if (done) {
        if (buffer.trim()) {
          processLine(buffer);
          buffer = '';
        }
        break;
      }
    }
  } finally {
    reader.releaseLock?.();
  }

  const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/i);
  if (jsonMatch) {
    Promise.resolve().then(() => {
      try {
        const parsedData = JSON.parse(jsonMatch[1]);
        const existingData = JSON.parse(localStorage.getItem('ai_curriculums') || '[]');
        existingData.push({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          data: parsedData,
        });
        localStorage.setItem('ai_curriculums', JSON.stringify(existingData));
      } catch (e) {
        console.error('Lỗi trích xuất JSON:', e);
      }
    });
  }

  if (remainingCoins !== undefined) {
    persistCoinsToStorage(remainingCoins);
  }

  if (!streamDoneReceived) {
    const err = new Error('Kết nối stream kết thúc bất thường (không nhận được phản hồi hoàn chỉnh). Vui lòng thử lại.');
    onError?.(err);
    throw err;
  }

  return { text: fullText, image_url: imageUrl, remainingCoins };
}

