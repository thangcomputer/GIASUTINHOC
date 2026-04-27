const fs = require('fs');
let code = fs.readFileSync('server/server.js', 'utf8');

if (!code.includes('examRoutes')) {
  code = code.replace(
    /import progressRoutes from '\.\/routes\/progressRoutes\.js';/g,
    `import progressRoutes from './routes/progressRoutes.js';\nimport examRoutes from './routes/examRoutes.js';`
  );
  code = code.replace(
    /app\.use\('\/api\/progress', progressRoutes\);/g,
    `app.use('/api/progress', progressRoutes);\napp.use('/api/exams', examRoutes);`
  );
  fs.writeFileSync('server/server.js', code);
  console.log('Registered examRoutes');
}
