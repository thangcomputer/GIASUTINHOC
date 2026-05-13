const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Đã kết nối VPS!\n');

    // 1. Kiểm tra trạng thái Apache
    console.log('📋 Kiểm tra Apache:');
    const apacheStatus = await ssh.execCommand('/etc/init.d/httpd status 2>&1', { cwd: '/root' });
    console.log(apacheStatus.stdout || apacheStatus.stderr);

    // 2. Kiểm tra log lỗi Apache
    console.log('\n📋 Log lỗi Apache:');
    const apacheErr = await ssh.execCommand('tail -n 10 /www/wwwlogs/giasutinhoc24h.com-ssl-error_log 2>/dev/null || echo "No SSL error log"', { cwd: '/root' });
    console.log(apacheErr.stdout);

    // 3. Kiểm tra PM2
    console.log('\n📋 Trạng thái PM2:');
    const pm2Status = await ssh.execCommand('pm2 list', { cwd: '/root' });
    console.log(pm2Status.stdout);

    // 4. Kiểm tra thư mục dist (React build)
    console.log('\n📋 Kiểm tra thư mục dist:');
    const distCheck = await ssh.execCommand('ls -la /www/wwwroot/giasuai/dist | head -n 10', { cwd: '/root' });
    console.log(distCheck.stdout || distCheck.stderr);

    // 5. Thử truy cập cục bộ
    console.log('\n🌐 Truy cập cục bộ vào backend (Cổng 5000):');
    const curlBackend = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/homepage', { cwd: '/root' });
    console.log('Backend HTTP Code:', curlBackend.stdout);

    // 6. Thử truy cập cục bộ qua HTTPS
    console.log('\n🌐 Truy cập cục bộ qua HTTPS:');
    const curlHttps = await ssh.execCommand('curl -sk -o /dev/null -w "%{http_code}" https://giasutinhoc24h.com', { cwd: '/root' });
    console.log('HTTPS HTTP Code:', curlHttps.stdout);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
