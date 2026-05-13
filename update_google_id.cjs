const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối thành công!\n');

    // ── 1. Hoàn tác cấu hình SSL cho Dashboard ──
    console.log('🧹 Bước 1: Xóa cấu hình SSL của Dashboard (giữ lại HTTP)...');
    
    // Lấy port hiện tại của backend quanlycms
    const quanlyCmsPort = await ssh.execCommand(
      "cat /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf | grep -o 'http://127.0.0.1:[0-9]*' | head -1",
      { cwd: '/root' }
    );
    const backendPort = quanlyCmsPort.stdout.trim() || 'http://127.0.0.1:3000';

    const httpOnlyConfig = `<VirtualHost *:80>
    ServerAdmin webmaster@example.com
    DocumentRoot "/www/wwwroot/quanlycms/client/dist"
    ServerName dashboard.giasutinhoc24h.com

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
        RewriteRule ^index\\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteCond %{REQUEST_URI} !^/socket.io/
        RewriteCond %{REQUEST_URI} !^/uploads/
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-error_log"
    CustomLog "/www/wwwlogs/dashboard.giasutinhoc24h.com-access_log" combined
</VirtualHost>`;

    const b64 = Buffer.from(httpOnlyConfig).toString('base64');
    await ssh.execCommand(
      `echo '${b64}' | base64 -d > /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf`,
      { cwd: '/root' }
    );
    
    await ssh.execCommand('/etc/init.d/httpd restart', { cwd: '/root' });
    console.log('✅ Đã khôi phục dashboard về HTTP thuần!');

    // ── 2. Cập nhật Google Client ID ──
    console.log('\n⬆️ Bước 2: Đang tải file .env chứa Google Client ID lên VPS...');
    await ssh.putFile('c:\\Users\\thang\\Desktop\\GIASUAI\\.env', '/www/wwwroot/giasuai/.env');
    await ssh.putFile('c:\\Users\\thang\\Desktop\\GIASUAI\\.env', '/www/wwwroot/quanlycms/.env');

    console.log('🔄 Reload PM2 server để nhận môi trường mới...');
    await ssh.execCommand('pm2 restart all --update-env', { cwd: '/root' });

    // ── 3. Build lại Frontend để áp dụng VITE_GOOGLE_CLIENT_ID ──
    console.log('\n🏗️ Bước 3: Đang build lại giao diện web giasutinhoc24h.com (chờ khoảng 30s-1p)...');
    
    const buildRes = await ssh.execCommand('npm run build', { cwd: '/www/wwwroot/giasuai' });
    console.log('Kết quả build Frontend:', buildRes.stdout.substring(0, 500) + '... (đã cắt bớt)');

    console.log('\n🎉 Hoàn thành! Hệ thống đăng nhập Google đã được cập nhật Client ID mới nhất!');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
