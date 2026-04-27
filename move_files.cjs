const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = 'data/knowledge';
const OTHER_DIR = path.join(KNOWLEDGE_DIR, 'other');

const mapping = {
  'ppt-': 'powerpoint',
  'zoom-slide': 'powerpoint',
  'word-': 'word',
  'reference-index': 'word',
  'Tab ': 'excel',
};

if (fs.existsSync(OTHER_DIR)) {
  const files = fs.readdirSync(OTHER_DIR);
  for (const file of files) {
    if (!file.endsWith('.pdf')) continue;
    let targetTopic = null;
    for (const [prefix, topic] of Object.entries(mapping)) {
      if (file.toLowerCase().startsWith(prefix.toLowerCase())) {
        targetTopic = topic;
        break;
      }
    }
    
    if (targetTopic) {
      const sourcePath = path.join(OTHER_DIR, file);
      const targetDir = path.join(KNOWLEDGE_DIR, targetTopic);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.renameSync(sourcePath, path.join(targetDir, file));
      console.log(`Moved ${file} -> ${targetTopic}`);
    }
  }
}
console.log('Done moving files.');
