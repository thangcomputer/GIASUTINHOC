'use strict';

/**
 * Đồng bộ VPS với GitHub: fetch + reset về origin/<nhánh>, npm install, build, PM2 restart.
 *
 * Trên máy local (.env, không commit):
 *   VPS_SSH_HOST, VPS_SSH_PASSWORD, (tuỳ chọn) VPS_SSH_USER, VPS_APP_DIR, VPS_GIT_BRANCH, VPS_PM2_NAME
 *
 * Chạy: npm run vps:pull   hoặc   node scripts/vps_pull.cjs
 */

const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./vpsSshEnv.cjs');

const ssh = new NodeSSH();

function vpsPaths() {
  const appDir = String(process.env.VPS_APP_DIR || '/www/wwwroot/giasuai').replace(/\/$/, '');
  const branch = String(process.env.VPS_GIT_BRANCH || 'main').trim() || 'main';
  const pm2Name = String(process.env.VPS_PM2_NAME || 'giasuai').trim() || 'giasuai';
  return { appDir, branch, pm2Name };
}

async function runCmd(cwd, label, cmd) {
  console.log(`⏳ ${label}\n   $ ${cmd}`);
  const res = await ssh.execCommand(cmd, { cwd });
  if (res.stdout) console.log(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  const code = res.code;
  if (code != null && code !== 0) {
    throw new Error(`Lệnh thất bại (exit ${code}): ${cmd}`);
  }
}

async function run() {
  let exitCode = 0;
  try {
    const { appDir, branch, pm2Name } = vpsPaths();

    console.log('🔗 Đang kết nối tới VPS...');
    await ssh.connect(requireVpsSsh());
    console.log(`📂 Thư mục app: ${appDir}`);
    console.log(`🌿 Nhánh GitHub: ${branch}`);
    console.log(`⚙️  PM2: ${pm2Name}\n`);

    await runCmd(
      appDir,
      'Đăng ký safe.directory (tránh lỗi “dubious ownership”)',
      `git config --global --add safe.directory ${appDir} || true`,
    );

    await runCmd(appDir, 'Kiểm tra đã là Git repo', 'git rev-parse --is-inside-work-tree');

    await runCmd(appDir, 'Lấy mới từ GitHub', 'git fetch origin');

    await runCmd(
      appDir,
      `Đồng bộ code với origin/${branch}`,
      `git reset --hard origin/${branch}`,
    );

    await runCmd(appDir, 'Cài dependency', 'npm install --legacy-peer-deps');

    await runCmd(appDir, 'Build frontend', 'npm run build');

    console.log(`\n🔄 Khởi động lại PM2 (${pm2Name})...`);
    const pm2 = await ssh.execCommand(`pm2 restart ${pm2Name} --update-env`, { cwd: '/root' });
    if (pm2.stdout) console.log(pm2.stdout);
    if (pm2.stderr) process.stderr.write(pm2.stderr);
    if (pm2.code != null && pm2.code !== 0) {
      throw new Error(`pm2 restart thất bại (exit ${pm2.code}). Kiểm tra tên process: ${pm2Name}`);
    }

    console.log('\n✅ VPS đã đồng bộ với GitHub và build lại xong.');
  } catch (err) {
    exitCode = 1;
    console.error('\n❌ Lỗi đồng bộ VPS:', err.message || err);
    console.error(
      '\nGợi ý: trên VPS chưa clone repo → chạy một lần: node scripts/vps_setup_git.cjs\n' +
        'Hoặc SSH vào VPS: cd thư_mục_app && git clone <url-repo> . && git checkout main',
    );
  } finally {
    process.exit(exitCode);
  }
}

run();
