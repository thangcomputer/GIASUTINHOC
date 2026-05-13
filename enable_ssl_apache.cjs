const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    // ── 1. Bỏ comment #Include conf/extra/httpd-ssl.conf ──
    console.log('🔧 Bỏ comment httpd-ssl.conf Include...');
    await ssh.execCommand(
      "sed -i 's|#Include conf/extra/httpd-ssl.conf|Include conf/extra/httpd-ssl.conf|g' /www/server/apache/conf/httpd.conf",
      { cwd: '/root' }
    );
    
    // Verify
    const check = await ssh.execCommand(
      "grep -n 'httpd-ssl' /www/server/apache/conf/httpd.conf",
      { cwd: '/root' }
    );
    console.log('httpd-ssl include:', check.stdout);

    // ── 2. Kiểm tra Listen 443 đã được thêm chưa ──
    const listenCheck = await ssh.execCommand(
      "grep -n 'Listen' /www/server/apache/conf/httpd.conf | grep -v '#'",
      { cwd: '/root' }
    );
    console.log('\nListen directives:', listenCheck.stdout);

    // ── 3. Xem httpd-ssl.conf có Listen 443 chưa ──
    const sslListen = await ssh.execCommand(
      "grep -n 'Listen\\|VirtualHost\\|SSLRandomSeed' /www/server/apache/conf/extra/httpd-ssl.conf | head -15",
      { cwd: '/root' }
    );
    console.log('\nhttpd-ssl.conf key lines:', sslListen.stdout);

    // ── 4. Thêm SSLRandomSeed nếu cần (điều kiện để ssl.conf hoạt động) ──
    console.log('\n🔧 Bỏ comment SSLRandomSeed trong httpd-ssl.conf...');
    await ssh.execCommand(
      "sed -i 's|#SSLRandomSeed startup file:/dev/urandom|SSLRandomSeed startup file:/dev/urandom|; s|#SSLRandomSeed connect file:/dev/urandom|SSLRandomSeed connect file:/dev/urandom|' /www/server/apache/conf/extra/httpd-ssl.conf",
      { cwd: '/root' }
    );

    // ── 5. Test config ──
    console.log('\n🔄 Test Apache config...');
    const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log(testRes.stdout, testRes.stderr);

    if (testRes.stderr && testRes.stderr.includes('error')) {
      console.log('\n⚠️ Config có lỗi. Xem chi tiết:');
      const errDetail = await ssh.execCommand('/www/server/apache/bin/httpd -t -D SSL 2>&1', { cwd: '/root' });
      console.log(errDetail.stdout, errDetail.stderr);
    }

    // ── 6. Restart Apache ──
    console.log('\n🔄 Restart Apache...');
    const restartRes = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
    console.log(restartRes.stdout, restartRes.stderr);

    await new Promise(r => setTimeout(r, 4000));

    // ── 7. Kiểm tra port ──
    console.log('\n📋 Ports sau restart:');
    const portsRes = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log(portsRes.stdout || '(trống)');

    // ── 8. Test HTTPS ──
    console.log('\n🌐 Test kết nối:');
    const tests = await ssh.execCommand(
      'curl -sk -o /dev/null -w "HTTPS=%{http_code}\\n" https://giasutinhoc24h.com/ ; curl -s -o /dev/null -w "HTTP=%{http_code}\\n" http://giasutinhoc24h.com/',
      { cwd: '/root' }
    );
    console.log(tests.stdout);

    // ── 9. Apache error log ──
    console.log('\n📋 Apache error log:');
    const errLog = await ssh.execCommand(
      'tail -15 /www/wwwlogs/giasutinhoc24h.com-ssl-error_log 2>/dev/null || tail -15 /www/wwwlogs/giasutinhoc24h.com-error_log 2>/dev/null || echo "(no log)"',
      { cwd: '/root' }
    );
    console.log(errLog.stdout);

    console.log('\n🎉 XONG!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
