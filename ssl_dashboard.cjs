const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    // ── 1. Kiểm tra Apache config dashboard hiện tại ──
    console.log('📋 Bước 1: Apache config dashboard...');
    const dashConf = await ssh.execCommand(
      'cat /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf 2>/dev/null || echo "FILE NOT FOUND"',
      { cwd: '/root' }
    );
    console.log(dashConf.stdout);

    // ── 2. Kiểm tra DNS dashboard trỏ đúng IP chưa ──
    console.log('\n📋 Bước 2: Kiểm tra DNS dashboard...');
    const dnsCheck = await ssh.execCommand(
      'dig +short dashboard.giasutinhoc24h.com 2>/dev/null || nslookup dashboard.giasutinhoc24h.com | grep "Address" | tail -1',
      { cwd: '/root' }
    );
    console.log('DNS:', dnsCheck.stdout || dnsCheck.stderr);

    // ── 3. Test HTTP dashboard có hoạt động không ──
    console.log('\n📋 Bước 3: Test HTTP dashboard...');
    const httpTest = await ssh.execCommand(
      'curl -s -o /dev/null -w "HTTP=%{http_code}" http://dashboard.giasutinhoc24h.com/ 2>/dev/null',
      { cwd: '/root' }
    );
    console.log('HTTP test:', httpTest.stdout);

    // ── 4. Cấp SSL cho dashboard ──
    console.log('\n🔒 Bước 4: Cấp SSL Let\'s Encrypt cho dashboard.giasutinhoc24h.com...');
    const certResult = await ssh.execCommand(
      'certbot certonly --webroot -w /www/wwwroot/quanlycms -d dashboard.giasutinhoc24h.com --non-interactive --agree-tos --email admin@giasutinhoc24h.com 2>&1',
      { cwd: '/root' }
    );
    console.log('Certbot output:', certResult.stdout);
    if (certResult.stderr) console.log('stderr:', certResult.stderr.slice(0, 300));

    // Thử với webroot khác nếu thất bại
    if (!certResult.stdout.includes('Successfully received')) {
      console.log('\n⚠️ Thử lại với webroot /www/wwwroot/giasuai...');
      const retryResult = await ssh.execCommand(
        'certbot certonly --webroot -w /www/wwwroot/giasuai -d dashboard.giasutinhoc24h.com --non-interactive --agree-tos --email admin@giasutinhoc24h.com 2>&1',
        { cwd: '/root' }
      );
      console.log(retryResult.stdout);
    }

    // ── 5. Kiểm tra cert ──
    console.log('\n📁 Bước 5: Kiểm tra cert...');
    const certFiles = await ssh.execCommand(
      'ls /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/ 2>/dev/null || echo "CHƯA CÓ CERT"',
      { cwd: '/root' }
    );
    console.log(certFiles.stdout);

    if (certFiles.stdout.includes('fullchain.pem')) {
      console.log('\n✅ Cert OK! Cập nhật Apache config...');

      // ── 6. Xem quanlycms chạy trên port nào ──
      const quanlyCmsPort = await ssh.execCommand(
        "cat /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf | grep -o 'http://127.0.0.1:[0-9]*' | head -1",
        { cwd: '/root' }
      );
      const backendPort = quanlyCmsPort.stdout.trim() || 'http://127.0.0.1:3000';
      console.log('QuanlyCMS backend port:', backendPort);

      // ── 7. Ghi Apache config HTTPS cho dashboard ──
      const httpsConfig = `<VirtualHost *:80>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/quanlycms"
    ServerName dashboard.giasutinhoc24h.com

    Alias /.well-known /www/wwwroot/quanlycms/.well-known
    <Directory "/www/wwwroot/quanlycms/.well-known">
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    ErrorLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-error_log"
    CustomLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-access_log" combined
</VirtualHost>

<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/quanlycms"
    ServerName dashboard.giasutinhoc24h.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/privkey.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLHonorCipherOrder on

    ProxyRequests Off
    ProxyPreserveHost On
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPass /.well-known !
    ProxyPass / ${backendPort}/
    ProxyPassReverse / ${backendPort}/

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://${backendPort.replace('http://', '')}/$1" [P,L]

    ErrorLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-ssl-error_log"
    CustomLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-ssl-access_log" combined
</VirtualHost>
</IfModule>`;

      const b64 = Buffer.from(httpsConfig).toString('base64');
      const writeRes = await ssh.execCommand(
        `echo '${b64}' | base64 -d > /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf && echo "WRITE_OK"`,
        { cwd: '/root' }
      );
      console.log('Ghi config:', writeRes.stdout);

      // ── 8. Tạo .well-known cho dashboard ──
      await ssh.execCommand(
        'mkdir -p /www/wwwroot/quanlycms/.well-known/acme-challenge && chmod -R 755 /www/wwwroot/quanlycms/.well-known',
        { cwd: '/root' }
      );

      // ── 9. Test và restart ──
      const testRes = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
      console.log('\nApache test:', testRes.stdout, testRes.stderr);

      const restartRes = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
      console.log('Restart:', restartRes.stdout);

      await new Promise(r => setTimeout(r, 4000));

      // ── 10. Test HTTPS dashboard ──
      const httpsTest = await ssh.execCommand(
        'curl -sk -o /dev/null -w "HTTPS_DASHBOARD=%{http_code}" https://dashboard.giasutinhoc24h.com/ ; curl -s -o /dev/null -w " HTTP_DASHBOARD=%{http_code}" http://dashboard.giasutinhoc24h.com/',
        { cwd: '/root' }
      );
      console.log('\n🌐 Kết quả:', httpsTest.stdout);

    } else {
      console.log('\n❌ Chưa cấp được cert cho dashboard. Kiểm tra DNS và thử lại.');
    }

    console.log('\n🎉 XONG!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
