const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối thành công!\n');

    // ── BƯỚC 1: Kiểm tra Apache config hiện tại ──
    console.log('📋 Bước 1: Xem Apache vhost config...');
    const apacheConf = await ssh.execCommand(
      'ls /www/server/panel/vhost/apache/ && echo "---" && cat /www/server/panel/vhost/apache/giasutinhoc24h.com.conf 2>/dev/null || echo "No apache config found"',
      { cwd: '/root' }
    );
    console.log(apacheConf.stdout);

    // ── BƯỚC 2: Kiểm tra Apache có bật mod_proxy không ──
    console.log('\n📋 Bước 2: Kiểm tra Apache modules...');
    const apacheMods = await ssh.execCommand(
      '/www/server/apache/bin/httpd -M 2>/dev/null | grep -E "proxy|rewrite"',
      { cwd: '/root' }
    );
    console.log(apacheMods.stdout || apacheMods.stderr);

    // ── BƯỚC 3: Xem apache config hiện tại ──
    console.log('\n📋 Bước 3: Apache config giasuai...');
    const conf = await ssh.execCommand(
      'cat /www/server/panel/vhost/apache/giasutinhoc24h.com.conf 2>/dev/null || echo "FILE NOT FOUND"',
      { cwd: '/root' }
    );
    console.log(conf.stdout);

    // ── BƯỚC 4: Tạo Apache VHost config với proxy ──
    console.log('\n📝 Bước 4: Cập nhật Apache VHost config...');
    
    const apacheVhostConfig = `<VirtualHost *:80>
    ServerName giasutinhoc24h.com
    ServerAlias www.giasutinhoc24h.com
    
    # Let's Encrypt challenge
    Alias /.well-known /www/wwwroot/giasuai/.well-known
    <Directory /www/wwwroot/giasuai/.well-known>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    # Proxy sang Node.js app
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /.well-known !
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:5000/$1" [P,L]

    ErrorLog /www/wwwlogs/giasutinhoc24h.com.error.log
    CustomLog /www/wwwlogs/giasutinhoc24h.com.access.log combined
</VirtualHost>`;

    // Kiểm tra thư mục apache vhost
    const checkDir = await ssh.execCommand('ls /www/server/panel/vhost/apache/ 2>/dev/null | head -10', { cwd: '/root' });
    console.log('Apache vhost dir:', checkDir.stdout || 'EMPTY');

    // Ghi config
    const writeRes = await ssh.execCommand(
      `cat > /www/server/panel/vhost/apache/giasutinhoc24h.com.conf << 'APACHE_EOF'\n${apacheVhostConfig}\nAPACHE_EOF`,
      { cwd: '/root' }
    );
    console.log('Write result:', writeRes.stdout, writeRes.stderr);

    // ── BƯỚC 5: Tạo thư mục .well-known ──
    console.log('\n📁 Bước 5: Tạo .well-known directory...');
    await ssh.execCommand(
      'mkdir -p /www/wwwroot/giasuai/.well-known/acme-challenge && chmod -R 755 /www/wwwroot/giasuai/.well-known',
      { cwd: '/root' }
    );
    console.log('✅ Done');

    // ── BƯỚC 6: Test và restart Apache ──
    console.log('\n🔄 Bước 6: Test Apache config...');
    const apacheTest = await ssh.execCommand('/www/server/apache/bin/httpd -t 2>&1', { cwd: '/root' });
    console.log('Test:', apacheTest.stdout, apacheTest.stderr);

    console.log('\n🔄 Restart Apache...');
    const restart = await ssh.execCommand('/etc/init.d/httpd restart 2>&1', { cwd: '/root' });
    console.log('Restart:', restart.stdout, restart.stderr);

    // ── BƯỚC 7: Kiểm tra kết quả ──
    await new Promise(r => setTimeout(r, 3000));
    console.log('\n✅ Bước 7: Kiểm tra http://giasutinhoc24h.com...');
    const curlRes = await ssh.execCommand(
      'curl -s -o /dev/null -w "HTTP_CODE=%{http_code}" http://giasutinhoc24h.com 2>/dev/null',
      { cwd: '/root' }
    );
    console.log('Curl result:', curlRes.stdout);

    console.log('\n🎉 HOÀN THÀNH! Giờ hãy vào aaPanel để bật SSL Let\'s Encrypt.');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}

run();
