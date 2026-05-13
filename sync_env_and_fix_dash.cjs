const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();
const fs = require('fs');

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối thành công!\n');

    // ── 1. Gửi file .env lên VPS ──
    console.log('⬆️ Đang tải file .env lên VPS...');
    await ssh.putFile('c:\\Users\\thang\\Desktop\\GIASUAI\\.env', '/www/wwwroot/giasuai/.env');
    await ssh.putFile('c:\\Users\\thang\\Desktop\\GIASUAI\\.env', '/www/wwwroot/quanlycms/.env');
    console.log('✅ Đã tải .env lên cả 2 thư mục giasuai và quanlycms.');

    // ── 2. Reload lại PM2 để nhận biến môi trường ──
    console.log('\n🔄 Đang reload PM2 để nhận Google Client ID mới...');
    await ssh.execCommand('pm2 restart all --update-env', { cwd: '/root' });

    // ── 3. Build lại frontend giasuai trên VPS để VITE_GOOGLE_CLIENT_ID có tác dụng ──
    console.log('\n🏗️ Đang build lại Frontend giasuai trên VPS (chờ khoảng 30s-1p)...');
    const buildRes = await ssh.execCommand('npm run build', { cwd: '/www/wwwroot/giasuai' });
    console.log('Build Frontend GiasuAI:', buildRes.stdout);
    
    console.log('\n🏗️ Đang build lại Frontend dashboard (quanlycms) trên VPS...');
    const buildCmsRes = await ssh.execCommand('cd client && npm install && npm run build', { cwd: '/www/wwwroot/quanlycms' });
    console.log('Build Frontend Dashboard:', buildCmsRes.stdout);

    // ── 4. Fix lỗi 000 của Dashboard SSL ──
    console.log('\n🔧 Kiểm tra lỗi HTTPS Dashboard (000)...');
    
    // Xóa thẻ <IfModule mod_ssl.c> bên ngoài VirtualHost 443 trong file config của dashboard
    // Thẻ IfModule đôi khi khiến cấu hình bị ẩn nếu Apache định nghĩa mod_ssl khác cách aaPanel nhận diện
    const fixSslCmd = `
      sed -i 's/<IfModule mod_ssl.c>//g' /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf
      sed -i 's/<\\/IfModule>//g' /www/server/panel/vhost/apache/dashboard.giasutinhoc24h.com.conf
    `;
    await ssh.execCommand(fixSslCmd, { cwd: '/root' });
    
    console.log('🔄 Restart Apache...');
    await ssh.execCommand('/etc/init.d/httpd restart', { cwd: '/root' });
    await new Promise(r => setTimeout(r, 4000));
    
    const httpsTest = await ssh.execCommand(
      'curl -sk -o /dev/null -w "HTTPS_DASHBOARD=%{http_code}" https://dashboard.giasutinhoc24h.com/',
      { cwd: '/root' }
    );
    console.log('Kết quả kết nối HTTPS dashboard:', httpsTest.stdout);
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
