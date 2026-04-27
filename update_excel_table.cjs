const fs = require('fs');

// 1. Cập nhật AI System Prompt
let aiCode = fs.readFileSync('server/routes/aiRoutes.js', 'utf8');

const excelRule = `
- QUY TẮC HIỂN THỊ BẢNG EXCEL MINH HỌA: BẤT CỨ KHI NÀO giải thích hoặc làm ví dụ về số liệu Excel, BẠN BẮT BUỘC PHẢI VẼ BẢNG MARKDOWN TABLE VỚI GIAO DIỆN CHUẨN:
   + Cột đầu tiên (ngoài cùng bên trái) PHẢI là số thứ tự hàng: 1, 2, 3...
   + Hàng đầu tiên (trên cùng) PHẢI có ô trống ở góc trái, sau đó là tên cột: A, B, C, D...
   + Luôn luôn điền SỐ LIỆU thực tế vào trong bảng.
   + Ví dụ định dạng:
| | A | B | C |
| --- | --- | --- | --- |
| **1** | Họ Tên | Tháng 1 | Tháng 2 |
| **2** | Nguyễn An | 500 | 600 |
`;

if (!aiCode.includes('EXCEL MINH HỌA')) {
  aiCode = aiCode.replace(
    /QUY TẮC PHONG CÁCH \(Bắt buộc tuân thủ tuyệt đối\):/g,
    `QUY TẮC PHONG CÁCH (Bắt buộc tuân thủ tuyệt đối):${excelRule}`
  );
  fs.writeFileSync('server/routes/aiRoutes.js', aiCode);
  console.log('AI System prompt updated.');
}

// 2. Chèn CSS Excel Table
let cssCode = fs.readFileSync('src/pages/ChatPage.css', 'utf8');

if (!cssCode.includes('excel-like')) {
  cssCode += `

/* ─── EXCEL-LIKE DATA GRID FOR MARKDOWN TABLES ─── */
.chat-bubble-ai .markdown-body table /* excel-like */ {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.chat-bubble-ai .markdown-body th {
  background: #1e293b !important;
  color: #38bdf8 !important;
  border: 1px solid #334155 !important;
  text-align: center !important;
}
.chat-bubble-ai .markdown-body tr td:first-child {
  background: #1e293b;
  color: #fca5a5;
  font-weight: 800;
  text-align: center;
  border-right: 2px solid #334155;
  width: 40px;
}
.chat-bubble-ai .markdown-body td {
  border: 1px solid #334155;
  color: #f1f5f9;
}
.chat-bubble-ai .markdown-body tr:hover td {
  background: rgba(255,255,255,0.02);
}
`;
  fs.writeFileSync('src/pages/ChatPage.css', cssCode);
  console.log('ChatPage.css updated.');
}
