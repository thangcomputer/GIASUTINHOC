const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    console.log('✅ Kết nối VPS thành công!\n');

    // ── BƯỚC 1: Set NODE_ENV=production và restart PM2 ──
    console.log('🔧 Bước 1: Khởi động lại PM2 giasuai với NODE_ENV=production...');
    
    const restartRes = await ssh.execCommand(
      'cd /www/wwwroot/giasuai && NODE_ENV=production pm2 restart giasuai --update-env -- --env production 2>&1 || pm2 delete giasuai 2>/dev/null; NODE_ENV=production pm2 start server/server.js --name giasuai --env production 2>&1',
      { cwd: '/www/wwwroot/giasuai' }
    );
    console.log(restartRes.stdout);
    if (restartRes.stderr) console.log('stderr:', restartRes.stderr);

    await new Promise(r => setTimeout(r, 3000));

    // ── BƯỚC 2: Kiểm tra PM2 env ──
    console.log('\n📋 Bước 2: Kiểm tra PM2 env...');
    const pmEnv = await ssh.execCommand('pm2 env 1 2>/dev/null | grep -E "NODE_ENV|status" | head -5', { cwd: '/root' });
    console.log(pmEnv.stdout || pmEnv.stderr);

    // ── BƯỚC 3: Test lại curl ──
    console.log('\n🌐 Bước 3: Test curl localhost:5000...');
    const curlTest = await ssh.execCommand(
      'curl -s -o /dev/null -w "STATUS=%{http_code}" http://localhost:5000/',
      { cwd: '/root' }
    );
    console.log('Curl:', curlTest.stdout);

    // ── BƯỚC 4: Nếu vẫn 404, thử cách khác ──
    if (curlTest.stdout.includes('404') || curlTest.stdout.includes('=0')) {
      console.log('\n⚠️  Vẫn lỗi - thử xóa PM2 và start lại...');
      
      // Xóa hoàn toàn và start lại với env đúng
      const killRes = await ssh.execCommand(
        'pm2 delete giasuai 2>/dev/null; cd /www/wwwroot/giasuai && NODE_ENV=production node -e "process.env.NODE_ENV=\'production\'; import(\'./server/server.js\')" &',
        { cwd: '/www/wwwroot/giasuai' }
      );
      console.log(killRes.stdout);
      
      await new Promise(r => setTimeout(r, 2000));
      
      // Start lại đúng cách
      const startRes = await ssh.execCommand(
        'cd /www/wwwroot/giasuai && pm2 start server/server.js --name giasuai --env production',
        { cwd: '/www/wwwroot/giasuai' }
      );
      console.log(startRes.stdout, startRes.stderr);
    }

    // ── BƯỚC 5: Kiểm tra PM2 ecosystem hoặc package.json ──
    console.log('\n📋 Bước 5: Kiểm tra package.json start script...');
    const pkgRes = await ssh.execCommand(
      'cat /www/wwwroot/giasuai/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get(\'scripts\',{}), indent=2))"',
      { cwd: '/root' }
    );
    console.log(pkgRes.stdout);

    // ── BƯỚC 6: Test cuối cùng từ domain thật ──
    await new Promise(r => setTimeout(r, 3000));
    console.log('\n🌐 Bước 6: Test domain giasutinhoc24h.com...');
    const domainTest = await ssh.execCommand(
      'curl -s -o /dev/null -w "HTTP=%{http_code}" http://giasutinhoc24h.com/',
      { cwd: '/root' }
    );
    console.log('Domain test:', domainTest.stdout);

    const localTest = await ssh.execCommand(
      'curl -s -o /dev/null -w "LOCAL=%{http_code}" http://localhost:5000/',
      { cwd: '/root' }
    );
    console.log('Local app:', localTest.stdout);

    // ── BƯỚC 7: PM2 logs để xem lỗi ──
    console.log('\n📋 Bước 7: PM2 logs 10 dòng cuối...');
    const logs = await ssh.execCommand(
      'pm2 logs giasuai --lines 10 --nostream 2>/dev/null | tail -15',
      { cwd: '/root' }
    );
    console.log(logs.stdout);

    console.log('\n✅ HOÀN THÀNH!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    ssh.dispose();
    process.exit(0);
  }
}
run();
