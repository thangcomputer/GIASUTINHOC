const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
const lines = content.split('\n');
const states = lines.filter(l => l.includes('useState(') && l.includes('const ['));
console.log(states.join('\n'));
