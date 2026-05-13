const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    const cmds = [
      { label: 'NODE_ENV của PM2 giasuai',  cmd: 'pm2 env 1 2>/dev/null | grep -E "NODE_ENV|PORT" | head -10' },
      { label: 'PM2 ecosystem file',         cmd: 'cat /www/wwwroot/giasuai/ecosystem.config.cjs 2>/dev/null || cat /www/wwwroot/giasuai/ecosystem.config.js 2>/dev/null || echo "No ecosystem file"' },
      { label: 'Thư mục dist có tồn tại?',  cmd: 'ls /www/wwwroot/giasuai/dist/ 2>/dev/null | head -5 || echo "NO DIST FOLDER"' },
      { label: 'Curl localhost:5000/',       cmd: 'curl -sv http://localhost:5000/ 2>&1 | tail -20' },
      { label: 'Curl localhost:5000/api/homepage', cmd: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/homepage' },
      { label: '.env của giasuai',           cmd: 'cat /www/wwwroot/giasuai/.env 2>/dev/null | grep -v PASSWORD | grep -v SECRET | grep -v KEY | head -10' },
      { label: 'Apache error log',           cmd: 'tail -20 /www/wwwlogs/giasutinhoc24h.com-error_log 2>/dev/null || echo "No error log"' },
    ];

    for (const { label, cmd } of cmds) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📌 ${label}`);
      const res = await ssh.execCommand(cmd, { cwd: '/root' });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr && res.stderr.trim()) console.log('stderr:', res.stderr.trim());
    }

  } catch (err) {
    console.error('❌', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
