const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());

    console.log('📋 Kiểm tra lỗi cấu hình Apache:');
    const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log(testRes.stdout || testRes.stderr);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
