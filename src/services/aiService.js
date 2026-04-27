/**
 * aiService.js
 * Giao tiếp với API Backend Node.js chạy nội bộ (Fullstack Monolithic)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function sendMessageToAI(userMessage, conversationHistory = [], requireImage = false, aiMode = 'pro', imageBase64 = null) {
  try {
    const userInfoStr = localStorage.getItem('user_info');
    let studentId = null;
    if (userInfoStr) {
      try {
        const userObj = JSON.parse(userInfoStr);
        studentId = userObj._id || userObj.id;
      } catch(e) {}
    }

    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory,
        type: requireImage ? 'image' : 'text',
        aiMode: aiMode,
        studentId: studentId,
        imageBase64: imageBase64
      })
    });

    const result = await response.json();

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

    // Update LocalStorage coins for quick UI sync (or rely on UI fetching it)
    if (remainingCoins !== undefined && userInfoStr) {
       try {
         const userObj = JSON.parse(userInfoStr);
         userObj.coins = remainingCoins;
         localStorage.setItem('user_info', JSON.stringify(userObj));
         // Dispatch an event to update header UI
         window.dispatchEvent(new Event('storage')); 
       } catch(e) {}
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

