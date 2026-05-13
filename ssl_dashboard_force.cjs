const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối thành công!\n');

    console.log('🛑 Bước 1: Dừng Apache và giải phóng port 80...');
    await ssh.execCommand('/etc/init.d/httpd stop 2>&1', { cwd: '/root' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Tìm và kill bất kỳ tiến trình nào đang dùng port 80
    const port80Procs = await ssh.execCommand('fuser -k 80/tcp', { cwd: '/root' });
    console.log('Killed port 80 processes:', port80Procs.stdout, port80Procs.stderr);
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n🔒 Bước 2: Cấp SSL Let\'s Encrypt (chế độ standalone)...');
    const certResult = await ssh.execCommand(
      'certbot certonly --standalone -d dashboard.giasutinhoc24h.com --non-interactive --agree-tos --email admin@giasutinhoc24h.com 2>&1',
      { cwd: '/root' }
    );
    console.log('Certbot output:', certResult.stdout);
    
    console.log('\n▶️ Khởi động lại Apache...');
    await ssh.execCommand('/etc/init.d/httpd start 2>&1', { cwd: '/root' });

    // Kiểm tra cert
    const certFiles = await ssh.execCommand(
      'ls /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/ 2>/dev/null || echo "CHƯA CÓ CERT"',
      { cwd: '/root' }
    );
    
    if (certFiles.stdout.includes('fullchain.pem')) {
      console.log('\n✅ Cert OK! Tiến hành cập nhật Apache config...');

      const quanlyCmsPort = await ssh.execCommand(
        "cat /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf | grep -o 'http://127.0.0.1:[0-9]*' | head -1",
        { cwd: '/root' }
      );
      const backendPort = quanlyCmsPort.stdout.trim() || 'http://127.0.0.1:3000';

      const httpsConfig = `<VirtualHost *:80>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/quanlycms/client/dist"
    ServerName dashboard.giasutinhoc24h.com

    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    ErrorLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-error_log"
    CustomLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-access_log" combined
</VirtualHost>

<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/quanlycms/client/dist"
    ServerName dashboard.giasutinhoc24h.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/dashboard.giasutinhoc24h.com/privkey.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLHonorCipherOrder on

    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteCond %{HTTP:Upgrade} websocket [NC]
        RewriteCond %{HTTP:Connection} upgrade [NC]
        RewriteRule ^/socket.io/(.*) ws://${backendPort.replace('http://', '')}/socket.io/$1 [P,L]
    </IfModule>

    <IfModule mod_proxy.c>
        ProxyRequests Off
        ProxyPreserveHost On

        ProxyPass /api/ ${backendPort}/api/
        ProxyPassReverse /api/ ${backendPort}/api/

        ProxyPass /socket.io/ ${backendPort}/socket.io/
        ProxyPassReverse /socket.io/ ${backendPort}/socket.io/

        ProxyPass /uploads/ ${backendPort}/uploads/
        ProxyPassReverse /uploads/ ${backendPort}/uploads/
    </IfModule>

    <Directory "/www/wwwroot/quanlycms/client/dist">
        Options FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.html

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteCond %{REQUEST_URI} !^/socket.io/
        RewriteCond %{REQUEST_URI} !^/uploads/
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-ssl-error_log"
    CustomLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-ssl-access_log" combined
</VirtualHost>
</IfModule>`;

      const b64 = Buffer.from(httpsConfig).toString('base64');
      const writeRes = await ssh.execCommand(
        `echo '${b64}' | base64 -d > /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf`,
        { cwd: '/root' }
      );
      
      console.log('\n🔄 Restart Apache...');
      await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
      await new Promise(r => setTimeout(r, 4000));

      const httpsTest = await ssh.execCommand(
        'curl -sk -o /dev/null -w "HTTPS_DASHBOARD=%{http_code}" https://dashboard.giasutinhoc24h.com/',
        { cwd: '/root' }
      );
      console.log('\n🌐 Kết quả HTTPS:', httpsTest.stdout);

    } else {
      console.log('\n❌ Lỗi cấp cert cho dashboard. Vui lòng kiểm tra lại cấu hình.');
    }
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
