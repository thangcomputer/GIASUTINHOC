const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());

    console.log('🔧 Đang loại bỏ khối VirtualHost mặc định trong httpd-ssl.conf...');
    // Dùng sed để xóa toàn bộ từ <VirtualHost _default_:443> đến </VirtualHost>
    await ssh.execCommand(
      'sed -i "/<VirtualHost _default_:443>/,/<\\/VirtualHost>/d" /www/server/apache/conf/extra/httpd-ssl.conf',
      { cwd: '/root' }
    );

    console.log('\n📋 Kiểm tra cấu hình Apache:');
    const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log(testRes.stdout || testRes.stderr);

    if (testRes.stdout && testRes.stdout.includes('Syntax OK')) {
        console.log('\n🔄 Restarting Apache...');
        const restartRes = await ssh.execCommand('/etc/init.d/httpd restart', { cwd: '/root' });
        console.log(restartRes.stdout || restartRes.stderr);
        
        console.log('\n📋 Kiểm tra các cổng đang lắng nghe:');
        const ports = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
        console.log(ports.stdout || '(trống)');
    }

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
