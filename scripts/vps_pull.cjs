const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    
    console.log('⬇️ Đang kéo mã nguồn mới nhất từ GitHub xuống VPS...');
    const cmds = [
      'git fetch',
      'git reset --hard origin/main',
      'npm install --legacy-peer-deps',
      'npm run build'
    ];
    
    for (const cmd of cmds) {
        console.log(`⏳ Đang chạy: ${cmd}`);
        const res = await ssh.execCommand(cmd, { cwd: '/www/wwwroot/giasuai' });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(res.stderr);
    }
    
    console.log('🔄 Đang khởi động lại PM2 Server...');
    await ssh.execCommand('pm2 restart giasuai --update-env', { cwd: '/root' });
    console.log('✅ HOÀN TẤT! Web, GitHub và VPS đã đồng bộ.');
  } catch (err) {
    console.error('Lỗi khi đồng bộ VPS:', err);
  } finally {
    process.exit(0);
  }
}
run();
