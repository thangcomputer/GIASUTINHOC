const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    // ── Kiểm tra Apache có lắng nghe port 443 không ──
    console.log('📋 Port hiện tại:');
    const ports = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log(ports.stdout || 'Không có gì');

    // ── Kiểm tra Apache httpd.conf có Listen 443 không ──
    console.log('\n📋 Kiểm tra Listen trong Apache config:');
    const listenCheck = await ssh.execCommand(
      'grep -rn "Listen" /www/server/apache/conf/httpd.conf 2>/dev/null | head -10',
      { cwd: '/root' }
    );
    console.log(listenCheck.stdout || 'Không tìm thấy');

    // ── Thêm Listen 443 và bật SSL module nếu cần ──
    console.log('\n🔧 Kiểm tra và thêm Listen 443...');
    const hasListen443 = await ssh.execCommand(
      'grep -c "Listen 443" /www/server/apache/conf/httpd.conf 2>/dev/null || echo "0"',
      { cwd: '/root' }
    );
    console.log('Listen 443 count:', hasListen443.stdout.trim());

    if (hasListen443.stdout.trim() === '0') {
      console.log('→ Thêm Listen 443...');
      await ssh.execCommand(
        'sed -i "/Listen 80/a Listen 443" /www/server/apache/conf/httpd.conf',
        { cwd: '/root' }
      );
      console.log('✅ Đã thêm Listen 443');
    } else {
      console.log('✅ Đã có Listen 443 rồi');
    }

    // ── Kiểm tra SSL module trong httpd.conf ──
    console.log('\n📋 Kiểm tra SSL module được load:');
    const sslModLoad = await ssh.execCommand(
      'grep -n "mod_ssl" /www/server/apache/conf/httpd.conf 2>/dev/null | head -5',
      { cwd: '/root' }
    );
    console.log(sslModLoad.stdout || 'Không tìm thấy mod_ssl trong httpd.conf');

    // Bật mod_ssl nếu bị comment
    await ssh.execCommand(
      'sed -i "s/#LoadModule ssl_module/LoadModule ssl_module/" /www/server/apache/conf/httpd.conf',
      { cwd: '/root' }
    );

    // ── Kiểm tra file ssl.conf tồn tại không ──
    console.log('\n📋 Kiểm tra ssl.conf extra:');
    const sslConf = await ssh.execCommand(
      'find /www/server/apache -name "ssl.conf" -o -name "*ssl*" 2>/dev/null | head -5',
      { cwd: '/root' }
    );
    console.log(sslConf.stdout || 'Không có ssl.conf');

    // ── Kiểm tra aaPanel Apache có thư mục conf.d không ──
    const confd = await ssh.execCommand(
      'ls /www/server/apache/conf/extra/ 2>/dev/null | head -10',
      { cwd: '/root' }
    );
    console.log('\nApache conf extra:', confd.stdout);

    // ── Test Apache config ──
    console.log('\n🔄 Test Apache config:');
    const test = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log(test.stdout, test.stderr);

    // ── Restart Apache ──
    console.log('\n🔄 Restart Apache...');
    const restart = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
    console.log(restart.stdout);

    await new Promise(r => setTimeout(r, 3000));

    // ── Kiểm tra port sau restart ──
    console.log('\n📋 Port sau restart:');
    const portsAfter = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log(portsAfter.stdout || 'Không có gì');

    // ── Test HTTPS ──
    console.log('\n🌐 Test HTTPS:');
    const httpsTest = await ssh.execCommand(
      'curl -sk -o /dev/null -w "HTTPS=%{http_code}" https://giasutinhoc24h.com/ 2>/dev/null',
      { cwd: '/root' }
    );
    console.log(httpsTest.stdout);

    const httpTest = await ssh.execCommand(
      'curl -s -o /dev/null -w "HTTP=%{http_code}" http://giasutinhoc24h.com/ 2>/dev/null',
      { cwd: '/root' }
    );
    console.log(httpTest.stdout);

    // ── Xem Apache error log ──
    console.log('\n📋 Apache error log (5 dòng cuối):');
    const errLog = await ssh.execCommand(
      'tail -5 /www/wwwlogs/giasutinhoc24h.com-ssl-error_log 2>/dev/null || tail -5 /var/log/apache2/error.log 2>/dev/null || echo "No log"',
      { cwd: '/root' }
    );
    console.log(errLog.stdout);

    console.log('\n✅ XONG!');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
