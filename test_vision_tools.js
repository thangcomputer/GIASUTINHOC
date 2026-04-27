import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);

async function test() {
  try {
    const tools = [{
      functionDeclarations: [{
        name: "create_realistic_illustration",
        description: "Generate a photorealistic and professional technical illustration based on a detailed prompt.",
        parameters: { type: "OBJECT", properties: { prompt: { type: "STRING" } }, required: ["prompt"] }
      }]
    }];

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: tools
    });
    
    const chat = model.startChat({ history: [] });

    // We will create a fake tiny base64 image (1x1 transparent png)
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
    const msgPayload = [
      "Bạn có thấy hình ảnh tôi vừa gửi là một chấm nhỏ không?",
      { inlineData: { data: base64Data, mimeType: 'image/png' } }
    ];

    console.log("Sending payload...");
    const result = await chat.sendMessage(msgPayload);
    console.log("Response:", result.response.text());
  } catch (e) {
    console.error(e);
  }
}

test();
