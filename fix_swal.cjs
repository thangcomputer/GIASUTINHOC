const fs = require('fs');
let code = fs.readFileSync('src/pages/LessonDetailPage.jsx', 'utf8');

// Remove all sweetalert2 imports
code = code.replace(/import Swal from ['"]sweetalert2['"];?\r?\n/g, '');

// Prepend exactly 1 import at the top
code = `import Swal from 'sweetalert2';\n` + code;

fs.writeFileSync('src/pages/LessonDetailPage.jsx', code);
console.log('Fixed duplications.');
