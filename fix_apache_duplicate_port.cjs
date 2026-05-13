const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());

    console.log('🔧 Đang xóa dòng Listen 443 thừa trong httpd.conf...');
    await ssh.execCommand('sed -i "/^Listen 443$/d" /www/server/apache/conf/httpd.conf', { cwd: '/root' });

    console.log('🔄 Restarting Apache...');
    const restartRes = await ssh.execCommand('/etc/init.d/httpd restart', { cwd: '/root' });
    console.log(restartRes.stdout || restartRes.stderr);

    console.log('\n📋 Kiểm tra các cổng đang lắng nghe:');
    const ports = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log(ports.stdout || '(trống)');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
