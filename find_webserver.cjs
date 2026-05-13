const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối!\n');

    const cmds = [
      // Tìm toàn bộ web server có trong VPS
      { label: 'Tìm web server binaries',  cmd: 'find /www/server -maxdepth 4 -name "nginx" -o -name "httpd" -o -name "lsws" -o -name "apache2" 2>/dev/null | head -20' },
      { label: 'Tìm service aaPanel',       cmd: 'ls /etc/init.d/ | grep -E "nginx|httpd|apache|lsws|openresty"' },
      { label: 'Services systemctl web',    cmd: 'systemctl list-units --type=service | grep -E "nginx|httpd|apache|lsws|openresty"' },
      { label: 'aaPanel web server info',   cmd: 'cat /www/server/panel/data/config.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get(\'webserver\',\'unknown\'))" 2>/dev/null || echo "Cant read config"' },
      { label: 'List /www/server/ dirs',    cmd: 'ls /www/server/' },
      { label: 'Check OpenResty/Nginx',     cmd: 'ls /www/server/nginx/ 2>/dev/null || echo "No nginx dir"' },
      { label: 'Check OpenLiteSpeed',       cmd: 'ls /www/server/lsws/ 2>/dev/null || echo "No lsws dir"' },
      { label: 'aaPanel nginx start cmd',   cmd: '/etc/init.d/nginx start 2>&1 | head -5' },
      { label: 'aaPanel httpd start cmd',   cmd: '/etc/init.d/httpd start 2>&1 | head -5' },
      { label: 'Port 80 sau khi start',     cmd: 'sleep 2 && ss -tlnp | grep ":80"' },
      // Thử curl local để xem app có hoạt động không
      { label: 'Curl localhost:5000',       cmd: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null' },
      { label: 'Curl localhost:80',         cmd: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null' },
    ];

    for (const { label, cmd } of cmds) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📌 ${label}`);
      const res = await ssh.execCommand(cmd, { cwd: '/root' });
      if (res.stdout) console.log(res.stdout);
      if (res.stderr && res.stderr.trim()) console.log('stderr:', res.stderr.trim());
    }

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}

run();
