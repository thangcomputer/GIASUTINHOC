const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());

    console.log('🔄 Restarting Apache để lấy log lỗi chi tiết...');
    const restartRes = await ssh.execCommand('/etc/init.d/httpd restart', { cwd: '/root' });
    console.log(restartRes.stdout);
    if (restartRes.stderr) {
        console.log('STDERR:', restartRes.stderr);
    }
    
    console.log('\n📋 Kiểm tra bằng lệnh test config của Apache:');
    const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t', { cwd: '/root' });
    console.log(testRes.stdout || testRes.stderr);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
