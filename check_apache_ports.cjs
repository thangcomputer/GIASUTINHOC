const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());

    console.log('📋 Kiểm tra các cổng đang lắng nghe:');
    const ports = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log(ports.stdout || '(trống)');

    console.log('\n📋 Kiểm tra file cấu hình SSL cho giasutinhoc24h.com:');
    const conf = await ssh.execCommand('cat /www/server/panel/vhost/apache/giasutinhoc24h.com.conf', { cwd: '/root' });
    console.log(conf.stdout);

    console.log('\n📋 Kiểm tra file httpd.conf:');
    const httpdConf = await ssh.execCommand('grep -E "Listen 443|httpd-ssl" /www/server/apache/conf/httpd.conf', { cwd: '/root' });
    console.log(httpdConf.stdout);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
