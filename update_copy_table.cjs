const fs = require('fs');

// 1. Inject DOM injection logic to ChatPage.jsx
let jsxCode = fs.readFileSync('src/pages/ChatPage.jsx', 'utf8');

const injectionLogic = `
  /* ── auto scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ── ADD COPY BUTTON TO TABLES ── */
  useEffect(() => {
    const tables = document.querySelectorAll('.markdown-body table');
    tables.forEach(table => {
      // Bỏ qua nếu đã được wrap
      if (table.parentElement?.classList.contains('copyable-table-wrapper')) return;

      // Tạo wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'copyable-table-wrapper';
      wrapper.style.position = 'relative';

      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      // Tạo nút Copy
      const btn = document.createElement('button');
      btn.className = 'copy-table-btn';
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="tooltip">Sao chép bảng</span>';
      
      btn.onclick = () => {
        let tsv = '';
        table.querySelectorAll('tr').forEach(tr => {
          const rowDetails = [];
          tr.querySelectorAll('td, th').forEach(cell => rowDetails.push(cell.innerText));
          tsv += rowDetails.join('\\t') + '\\n';
        });
        navigator.clipboard.writeText(tsv);

        const tooltip = btn.querySelector('.tooltip');
        tooltip.innerText = 'Đã chép!';
        setTimeout(() => tooltip.innerText = 'Sao chép bảng', 2000);
      };

      wrapper.appendChild(btn);
    });
  }, [messages]);
`;

if (!jsxCode.includes('copyable-table-wrapper')) {
  jsxCode = jsxCode.replace(/\/\* ── auto scroll ── \*\/\r?\n\s*useEffect\(\(\) => \{\r?\n\s*messagesEndRef\.current\?\.scrollIntoView\(\{ behavior: 'smooth' \}\)\r?\n\s*\}, \[messages, loading\]\)/, injectionLogic);
  fs.writeFileSync('src/pages/ChatPage.jsx', jsxCode);
  console.log('ChatPage.jsx DOM script injected.');
}

// 2. Inject CSS
let cssCode = fs.readFileSync('src/pages/ChatPage.css', 'utf8');

if (!cssCode.includes('.copy-table-btn')) {
  cssCode += `

/* ─── COPY TABLE BUTTON ─── */
.copyable-table-wrapper {
  position: relative;
  margin: 16px 0;
}
.copyable-table-wrapper table {
  margin: 0 !important;
}
.copyable-table-wrapper:hover .copy-table-btn {
  opacity: 1;
  visibility: visible;
}
.copy-table-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  z-index: 10;
}
.copy-table-btn:hover {
  background: rgba(99, 102, 241, 0.9);
  color: #fff;
  border-color: rgba(99, 102, 241, 0.5);
}
.copy-table-btn .tooltip {
  position: absolute;
  right: 120%;
  top: 50%;
  transform: translateY(-50%);
  background: #1e293b;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.copy-table-btn:hover .tooltip {
  opacity: 1;
  visibility: visible;
}
`;
  fs.writeFileSync('src/pages/ChatPage.css', cssCode);
  console.log('ChatPage.css updated with copy button styles.');
}
