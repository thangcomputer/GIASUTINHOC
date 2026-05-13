const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    // ── 1. Xem httpd.conf phần Listen và SSL Include ──
    const httpConf = await ssh.execCommand(
      'grep -n "Listen\\|ssl\\|SSL\\|Include.*extra" /www/server/apache/conf/httpd.conf | grep -v "^[[:space:]]*#" | head -20',
      { cwd: '/root' }
    );
    console.log('httpd.conf hiện tại:\n', httpConf.stdout);

    // ── 2. Xem httpd-ssl.conf có những gì ──
    const sslConf = await ssh.execCommand(
      'head -20 /www/server/apache/conf/extra/httpd-ssl.conf 2>/dev/null',
      { cwd: '/root' }
    );
    console.log('\nhttpd-ssl.conf:\n', sslConf.stdout);

    // ── 3. Thêm Listen 443 trực tiếp bằng echo ──
    console.log('\n🔧 Thêm Listen 443 vào httpd.conf...');
    // Kiểm tra chính xác
    const checkListen = await ssh.execCommand(
      "grep -n 'Listen 443' /www/server/apache/conf/httpd.conf",
      { cwd: '/root' }
    );
    console.log('Current Listen 443:', checkListen.stdout || '(none)');

    if (!checkListen.stdout.trim()) {
      // Thêm Listen 443 sau dòng Listen 80
      await ssh.execCommand(
        "sed -i '/^Listen 80$/a Listen 443' /www/server/apache/conf/httpd.conf",
        { cwd: '/root' }
      );
      // Verify
      const verifyListen = await ssh.execCommand(
        "grep -n 'Listen' /www/server/apache/conf/httpd.conf | grep -v '#'",
        { cwd: '/root' }
      );
      console.log('After adding:\n', verifyListen.stdout);
    } else {
      console.log('✅ Listen 443 đã có rồi');
    }

    // ── 4. Bật httpd-ssl.conf (Include nếu chưa có) ──
    console.log('\n🔧 Kiểm tra Include httpd-ssl.conf...');
    const checkInclude = await ssh.execCommand(
      "grep -n 'httpd-ssl' /www/server/apache/conf/httpd.conf",
      { cwd: '/root' }
    );
    console.log('Include httpd-ssl:', checkInclude.stdout || '(none)');

    if (!checkInclude.stdout.trim()) {
      // Thêm Include
      await ssh.execCommand(
        "echo 'Include conf/extra/httpd-ssl.conf' >> /www/server/apache/conf/httpd.conf",
        { cwd: '/root' }
      );
      console.log('✅ Đã thêm Include httpd-ssl.conf');
    }

    // ── 5. Kiểm tra/sửa httpd-ssl.conf ──
    console.log('\n📝 Xem và sửa httpd-ssl.conf...');
    const fullSslConf = await ssh.execCommand(
      'cat /www/server/apache/conf/extra/httpd-ssl.conf 2>/dev/null | head -30',
      { cwd: '/root' }
    );
    console.log(fullSslConf.stdout);

    // ── 6. Tạo file ssl.conf riêng cho giasutinhoc24h.com ──
    console.log('\n📝 Tạo SSL VirtualHost config hoàn chỉnh...');
    
    // Backup config cũ
    await ssh.execCommand(
      'cp /www/server/panel/vhost/apache/giasutinhoc24h.com.conf /www/server/panel/vhost/apache/giasutinhoc24h.com.conf.bak2',
      { cwd: '/root' }
    );

    const fullConfig = `<VirtualHost *:80>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/giasuai"
    ServerName giasutinhoc24h.com
    ServerAlias www.giasutinhoc24h.com

    Alias /.well-known /www/wwwroot/giasuai/.well-known
    <Directory "/www/wwwroot/giasuai/.well-known">
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    ErrorLog "/www/wwwlogs/giasutinhoc24h.com-error_log"
    CustomLog "/www/wwwlogs/giasutinhoc24h.com-access_log" combined
</VirtualHost>

<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/giasuai"
    ServerName giasutinhoc24h.com
    ServerAlias www.giasutinhoc24h.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/giasutinhoc24h.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/giasutinhoc24h.com/privkey.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLHonorCipherOrder on

    ProxyRequests Off
    ProxyPreserveHost On
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPass /.well-known !
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:5000/$1" [P,L]

    ErrorLog "/www/wwwlogs/giasutinhoc24h.com-ssl-error_log"
    CustomLog "/www/wwwlogs/giasutinhoc24h.com-ssl-access_log" combined
</VirtualHost>
</IfModule>`;

    // Dùng python3 để ghi file tránh heredoc encoding issues
    const writeScript = `python3 -c "
import sys
content = '''${fullConfig.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'''
with open('/www/server/panel/vhost/apache/giasutinhoc24h.com.conf', 'w') as f:
    f.write(content)
print('OK')
"`;
    
    // Dùng cách khác - ghi qua SSH exec với escape đúng
    // Ghi file bằng base64 để tránh ký tự đặc biệt
    const b64 = Buffer.from(fullConfig).toString('base64');
    
    const writeRes = await ssh.execCommand(
      `echo '${b64}' | base64 -d > /www/server/panel/vhost/apache/giasutinhoc24h.com.conf && echo "WRITE_OK"`,
      { cwd: '/root' }
    );
    console.log('Ghi file:', writeRes.stdout, writeRes.stderr);

    // ── 7. Test Apache config ──
    console.log('\n🔄 Test Apache config...');
    const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log(testRes.stdout, testRes.stderr);

    if (testRes.stdout.includes('Syntax OK') || testRes.stderr.includes('Syntax OK')) {
      // ── 8. Restart Apache ──
      console.log('\n🔄 Restart Apache...');
      const restartRes = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
      console.log(restartRes.stdout);

      await new Promise(r => setTimeout(r, 4000));

      // ── 9. Kiểm tra port ──
      const portsRes = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
      console.log('\nPorts:', portsRes.stdout || 'Không có gì');

      // ── 10. Test HTTPS ──
      const httpsRes = await ssh.execCommand(
        'curl -sk -o /dev/null -w "HTTPS=%{http_code}" https://giasutinhoc24h.com/ && curl -s -o /dev/null -w " HTTP=%{http_code}" http://giasutinhoc24h.com/',
        { cwd: '/root' }
      );
      console.log('\nTest:', httpsRes.stdout);
    } else {
      console.log('⚠️ Apache config lỗi, xem lại!');
      // Khôi phục backup
      await ssh.execCommand(
        'cp /www/server/panel/vhost/apache/giasutinhoc24h.com.conf.bak2 /www/server/panel/vhost/apache/giasutinhoc24h.com.conf',
        { cwd: '/root' }
      );
    }

    // ── 11. Xem Apache error log ──
    console.log('\n📋 Apache error log:');
    const errLog = await ssh.execCommand(
      'tail -10 /www/wwwlogs/giasutinhoc24h.com-ssl-error_log 2>/dev/null || echo "(no ssl error log yet)"',
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
