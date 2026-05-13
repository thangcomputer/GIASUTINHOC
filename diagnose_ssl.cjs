const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối SSH thành công!\n');

    const cmds = [
      { label: '📋 PM2 Status', cmd: 'pm2 list' },
      { label: '🌐 Nginx Status', cmd: 'systemctl status nginx --no-pager | head -20' },
      { label: '📁 Nginx Sites Available', cmd: 'ls /www/server/panel/vhost/nginx/' },
      { label: '🔒 Nginx Config giasutinhoc24h', cmd: 'cat /www/server/panel/vhost/nginx/giasutinhoc24h.com.conf 2>/dev/null || echo "File not found"' },
      { label: '🔒 SSL Certs Check', cmd: 'ls /www/server/panel/vhost/cert/ 2>/dev/null || echo "No certs dir"' },
      { label: '🌍 DNS Check giasutinhoc24h.com', cmd: 'dig +short giasutinhoc24h.com 2>/dev/null || nslookup giasutinhoc24h.com | grep Address' },
      { label: '🔥 Port 80 listening', cmd: 'ss -tlnp | grep -E ":80|:443"' },
      { label: '📝 PM2 App Logs (last 30 lines)', cmd: 'pm2 logs giasuai --lines 30 --nostream 2>/dev/null || pm2 logs --lines 30 --nostream 2>/dev/null | tail -30' },
    ];

    for (const { label, cmd } of cmds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(label);
      console.log('='.repeat(60));
      const res = await ssh.execCommand(cmd, { cwd: '/root' });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr && res.stderr.trim()) console.error('STDERR:', res.stderr);
    }

    console.log('\n\n🎯 CHẨN ĐOÁN XONG!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}

run();
