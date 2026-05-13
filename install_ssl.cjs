const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối VPS thành công!\n');

    // ── BƯỚC 1: Kiểm tra certbot có sẵn không ──
    console.log('📋 Bước 1: Kiểm tra Certbot...');
    const certbotCheck = await ssh.execCommand('which certbot 2>/dev/null || pip3 show certbot 2>/dev/null | head -3', { cwd: '/root' });
    console.log(certbotCheck.stdout || 'Certbot chưa được cài');

    // ── BƯỚC 2: Cài Certbot nếu chưa có ──
    console.log('\n📦 Bước 2: Cài Certbot (nếu cần)...');
    const installCertbot = await ssh.execCommand(
      'which certbot 2>/dev/null || (yum install -y certbot python3-certbot-apache 2>&1 || apt-get install -y certbot python3-certbot-apache 2>&1) | tail -5',
      { cwd: '/root' }
    );
    console.log(installCertbot.stdout);
    if (installCertbot.stderr) console.log('stderr:', installCertbot.stderr.slice(0, 200));

    // ── BƯỚC 3: Kiểm tra Apache có chạy không ──
    console.log('\n🌐 Bước 3: Kiểm tra Apache và port 80...');
    const apacheStatus = await ssh.execCommand('ss -tlnp | grep ":80" && curl -s -o /dev/null -w "HTTP=%{http_code}" http://giasutinhoc24h.com/', { cwd: '/root' });
    console.log(apacheStatus.stdout);

    // ── BƯỚC 4: Cấp SSL bằng Certbot (webroot mode) ──
    console.log('\n🔒 Bước 4: Cấp SSL Let\'s Encrypt bằng Certbot...');
    console.log('(Quá trình này mất khoảng 30-60 giây...)');
    
    const certResult = await ssh.execCommand(
      'certbot certonly --webroot -w /www/wwwroot/giasuai -d giasutinhoc24h.com -d www.giasutinhoc24h.com --non-interactive --agree-tos --email admin@giasutinhoc24h.com 2>&1',
      { cwd: '/root' }
    );
    console.log('Certbot output:');
    console.log(certResult.stdout);
    if (certResult.stderr) console.log('stderr:', certResult.stderr.slice(0, 500));

    // ── BƯỚC 5: Kiểm tra cert đã được cấp chưa ──
    console.log('\n📁 Bước 5: Kiểm tra cert files...');
    const certFiles = await ssh.execCommand('ls /etc/letsencrypt/live/giasutinhoc24h.com/ 2>/dev/null || echo "Chưa có cert"', { cwd: '/root' });
    console.log(certFiles.stdout);

    if (certFiles.stdout.includes('fullchain.pem')) {
      console.log('\n✅ SSL cert đã được cấp thành công!');
      
      // ── BƯỚC 6: Cập nhật Apache config với HTTPS ──
      console.log('\n📝 Bước 6: Thêm HTTPS VirtualHost vào Apache config...');
      
      const httpsConfig = `<VirtualHost *:80>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/giasuai"
    ServerName giasutinhoc24h.com
    ServerAlias www.giasutinhoc24h.com

    # Let's Encrypt challenge
    Alias /.well-known /www/wwwroot/giasuai/.well-known
    <Directory /www/wwwroot/giasuai/.well-known>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    # Redirect HTTP -> HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    ErrorLog "/www/wwwlogs/giasutinhoc24h.com-error_log"
    CustomLog "/www/wwwlogs/giasutinhoc24h.com-access_log" combined
</VirtualHost>

<VirtualHost *:443>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/giasuai"
    ServerName giasutinhoc24h.com
    ServerAlias www.giasutinhoc24h.com

    # SSL Config
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/giasutinhoc24h.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/giasutinhoc24h.com/privkey.pem

    # Proxy sang Node.js app
    ProxyRequests Off
    ProxyPreserveHost On
    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPass /.well-known !
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/

    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:5000/$1" [P,L]

    ErrorLog "/www/wwwlogs/giasutinhoc24h.com-ssl-error_log"
    CustomLog "/www/wwwlogs/giasutinhoc24h.com-ssl-access_log" combined
</VirtualHost>`;

      // Ghi config
      const writeCmd = `cat > /www/server/panel/vhost/apache/giasutinhoc24h.com.conf << 'EOF'
${httpsConfig}
EOF`;
      await ssh.execCommand(writeCmd, { cwd: '/root' });
      console.log('✅ Đã ghi HTTPS config');

      // ── BƯỚC 7: Bật SSL module và restart Apache ──
      console.log('\n🔄 Bước 7: Bật SSL module và restart Apache...');
      const enableSSL = await ssh.execCommand('/www/server/apache/bin/httpd -M 2>/dev/null | grep ssl', { cwd: '/root' });
      console.log('SSL module:', enableSSL.stdout || 'Chưa thấy ssl_module');

      const testApache = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
      console.log('Apache test:', testApache.stdout, testApache.stderr);

      const restartApache = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
      console.log('Restart:', restartApache.stdout);

      // ── BƯỚC 8: Test HTTPS ──
      await new Promise(r => setTimeout(r, 3000));
      console.log('\n🔍 Bước 8: Test HTTPS...');
      const httpsTest = await ssh.execCommand('curl -s -o /dev/null -w "HTTPS=%{http_code}" https://giasutinhoc24h.com/ 2>/dev/null', { cwd: '/root' });
      console.log('HTTPS test:', httpsTest.stdout);

    } else {
      console.log('\n⚠️  Certbot chưa cấp được cert. Kiểm tra lỗi ở trên.');
      
      // Thử cách khác: HTTP-01 challenge qua standalone
      console.log('\n🔄 Thử cách khác: dừng Apache tạm, dùng standalone mode...');
      await ssh.execCommand('/etc/init.d/httpd stop 2>&1', { cwd: '/root' });
      await new Promise(r => setTimeout(r, 2000));
      
      const standaloneResult = await ssh.execCommand(
        'certbot certonly --standalone -d giasutinhoc24h.com -d www.giasutinhoc24h.com --non-interactive --agree-tos --email admin@giasutinhoc24h.com 2>&1',
        { cwd: '/root' }
      );
      console.log('Standalone result:', standaloneResult.stdout);
      
      await ssh.execCommand('/etc/init.d/httpd start 2>&1', { cwd: '/root' });
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
