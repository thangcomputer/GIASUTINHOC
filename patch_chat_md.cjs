const fs = require('fs');
const filePath = 'src/components/VirtualExamRoom.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldLine = `                           <div dangerouslySetInnerHTML={{ __html: marked(m.content || '') }} />`;
const newLine = `                           <div className="chat-inline-md" dangerouslySetInnerHTML={{ __html: marked(m.content || '') }} />`;

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Thành công! Đã thêm className chat-inline-md');
} else {
  console.log('❌ Vẫn không tìm thấy! Kiểm tra ký tự đặc biệt...');
  const idx = content.indexOf("dangerouslySetInnerHTML={{ __html: marked(m.content");
  if (idx !== -1) {
    console.log('Đoạn tìm thấy tại index:', idx);
    console.log('Nội dung:', JSON.stringify(content.substring(idx-30, idx+80)));
  }
}
