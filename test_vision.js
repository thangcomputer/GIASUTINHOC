import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat({ history: [] });

    // We will create a fake tiny base64 image (1x1 transparent png)
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
    const msgPayload = [
      { text: "Bạn có thấy hình ảnh tôi vừa gửi là một chấm nhỏ không?" },
      { inlineData: { data: base64Data, mimeType: 'image/png' } }
    ];

    console.log("Sending payload:", msgPayload);
    const result = await chat.sendMessage(msgPayload);
    console.log("Response:", result.response.text());
  } catch (e) {
    console.error(e);
  }
}

test();
