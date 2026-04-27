const fs = require('fs');

let content = fs.readFileSync('src/data/lessons.js', 'utf8');

// Regex to remove most emojis
const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

content = content.replace(emojiRegex, '');

// Save changes
fs.writeFileSync('src/data/lessons.js', content, 'utf8');
console.log('Removed all emojis from lessons.js');
