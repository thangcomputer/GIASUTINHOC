const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối SSH thành công!\n');

    // ── BƯỚC 1: Kiểm tra Apache có chạy không ──
    console.log('\n📋 Bước 1: Kiểm tra Apache và Nginx...');
    const apacheStatus = await ssh.execCommand('systemctl status httpd --no-pager | head -5', { cwd: '/root' });
    console.log('Apache status:', apacheStatus.stdout);

    // ── BƯỚC 2: Dừng Apache, khởi động Nginx ──
    console.log('\n🔧 Bước 2: Dừng Apache, khởi động Nginx...');
    
    const steps = [
      { label: 'Dừng Apache',               cmd: 'systemctl stop httpd 2>/dev/null; systemctl disable httpd 2>/dev/null; echo "Done"' },
      { label: 'Kiểm tra Nginx binary',      cmd: 'which nginx 2>/dev/null || ls /www/server/nginx/sbin/nginx 2>/dev/null || echo "Nginx not found in PATH"' },
      { label: 'Khởi động Nginx via aaPanel',cmd: '/www/server/panel/pyenv/bin/python3 /www/server/panel/BT/panel.py nginx start 2>/dev/null || /etc/init.d/nginx start 2>/dev/null || /www/server/nginx/sbin/nginx 2>/dev/null || echo "Try systemctl"' },
      { label: 'Kiểm tra nginx path',        cmd: 'find /www/server -name "nginx" -type f 2>/dev/null | head -5' },
    ];

    for (const { label, cmd } of steps) {
      console.log(`\n⏳ ${label}...`);
      const res = await ssh.execCommand(cmd, { cwd: '/root' });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr && res.stderr.trim()) console.log('stderr:', res.stderr);
    }

    // ── BƯỚC 3: Kiểm tra port sau khi dừng Apache ──
    console.log('\n🔍 Bước 3: Kiểm tra port 80 và 443...');
    const ports = await ssh.execCommand('ss -tlnp | grep -E ":80|:443"', { cwd: '/root' });
    console.log('Ports:', ports.stdout || 'Không có gì đang lắng nghe trên 80/443');

    // ── BƯỚC 4: Cập nhật Nginx config để bật HTTPS ──
    console.log('\n📝 Bước 4: Cập nhật Nginx config với HTTPS...');
    
    const nginxConfig = `server {
    listen 80;
    server_name giasutinhoc24h.com www.giasutinhoc24h.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /www/wwwroot/giasuai;
    }
    
    # Chuyển hướng sang HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name giasutinhoc24h.com www.giasutinhoc24h.com;
    
    # SSL sẽ được aaPanel cấu hình, tạm thời comment lại
    # ssl_certificate     /www/server/panel/vhost/cert/giasutinhoc24h.com/fullchain.pem;
    # ssl_certificate_key /www/server/panel/vhost/cert/giasutinhoc24h.com/privkey.pem;
    
    location /.well-known/ {
        root /www/wwwroot/giasuai;
    }
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 100m;
    }
}`;

    // Tạm thời chỉ dùng HTTP config (cho đến khi có SSL cert)
    const nginxConfigHttp = `server {
    listen 80;
    server_name giasutinhoc24h.com www.giasutinhoc24h.com;
    
    # Let's Encrypt challenge (aaPanel dùng đường dẫn này)
    location /.well-known/acme-challenge/ {
        root /www/wwwroot/giasuai;
    }
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        client_max_body_size 100m;
    }
}`;

    // Ghi config
    await ssh.execCommand(`cat > /www/server/panel/vhost/nginx/giasutinhoc24h.com.conf << 'NGINX_EOF'
${nginxConfigHttp}
NGINX_EOF`, { cwd: '/root' });
    console.log('✅ Đã ghi Nginx config');

    // ── BƯỚC 5: Test và reload Nginx ──
    console.log('\n🔄 Bước 5: Test và reload Nginx...');
    const nginxBin = await ssh.execCommand('find /www/server -name "nginx" -type f 2>/dev/null | head -1', { cwd: '/root' });
    const nginxPath = nginxBin.stdout.trim() || 'nginx';
    console.log('Nginx binary:', nginxPath);
    
    const testNginx = await ssh.execCommand(`${nginxPath} -t 2>&1`, { cwd: '/root' });
    console.log('Nginx test:', testNginx.stdout, testNginx.stderr);
    
    const reloadNginx = await ssh.execCommand(`${nginxPath} -s reload 2>&1 || systemctl reload nginx 2>&1`, { cwd: '/root' });
    console.log('Nginx reload:', reloadNginx.stdout, reloadNginx.stderr);

    // ── BƯỚC 6: Tạo thư mục .well-known cho Let's Encrypt ──
    console.log('\n📁 Bước 6: Tạo thư mục .well-known...');
    await ssh.execCommand('mkdir -p /www/wwwroot/giasuai/.well-known/acme-challenge && chmod -R 755 /www/wwwroot/giasuai/.well-known', { cwd: '/root' });
    console.log('✅ Đã tạo .well-known directory');

    // ── BƯỚC 7: Kiểm tra PM2 logs lỗi ──
    console.log('\n📋 Bước 7: Kiểm tra lỗi PM2 giasuai...');
    const pm2Err = await ssh.execCommand('pm2 logs giasuai --lines 5 --nostream --err 2>/dev/null | tail -10', { cwd: '/root' });
    console.log('PM2 errors:', pm2Err.stdout);

    // ── BƯỚC 8: Kiểm tra kết quả cuối ──
    console.log('\n📋 Bước 8: Kiểm tra trạng thái cuối...');
    const finalPorts = await ssh.execCommand('ss -tlnp | grep -E ":80|:443|:5000"', { cwd: '/root' });
    console.log('Ports sau khi sửa:', finalPorts.stdout || 'Không có gì');
    
    const pm2Status = await ssh.execCommand('pm2 list', { cwd: '/root' });
    console.log('PM2 status:', pm2Status.stdout);

    console.log('\n✅ HOÀN THÀNH CHẨN ĐOÁN VÀ SỬA LỖI!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}

run();
