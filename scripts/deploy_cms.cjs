const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('🔗 Connecting to VPS...');
    await ssh.connect(requireVpsSsh());
    
    const projectPath = '/www/wwwroot/dashboard.giasutinhoc24h.com';
    const backupEnv = '/tmp/.env_cms_backup';
    const repoUrl = 'https://github.com/thangcomputer/QUANLYCMS.git';

    console.log('📦 Backing up .env...');
    await ssh.execCommand(`cp .env ${backupEnv} || true`, { cwd: projectPath });

    console.log('🗑️ Cleaning and Cloning...');
    const tempPath = '/tmp/cms_clone_temp';
    await ssh.execCommand(`rm -rf ${tempPath}`);
    const cloneRes = await ssh.execCommand(`git clone ${repoUrl} ${tempPath}`);
    if (cloneRes.stderr) console.error('Git Clone Stderr:', cloneRes.stderr);
    
    console.log('🚚 Moving files to webroot...');
    // Clear webroot as much as possible, ignoring immutable files
    await ssh.execCommand('rm -rf * .git .github .gitignore', { cwd: projectPath });
    // Move files from temp to project path
    await ssh.execCommand(`cp -rf ${tempPath}/* ${projectPath}/`);
    await ssh.execCommand(`cp -rf ${tempPath}/.[!.]* ${projectPath}/ || true`); // Move hidden files

    console.log('🔑 Restoring .env...');
    await ssh.execCommand(`cp ${backupEnv} .env`, { cwd: projectPath });

    console.log('⚙️ Installing dependencies...');
    const installRes = await ssh.execCommand('npm install --legacy-peer-deps', { cwd: projectPath });
    console.log(installRes.stdout || installRes.stderr);

    console.log('♻️ Restarting application...');
    // The user didn't have PM2 processes, but maybe it should be started?
    // Let's try starting it with PM2 as 'quanlycms'
    await ssh.execCommand('pm2 stop quanlycms || true', { cwd: projectPath });
    await ssh.execCommand('pm2 delete quanlycms || true', { cwd: projectPath });
    await ssh.execCommand('pm2 start server.js --name "quanlycms"', { cwd: projectPath });
    await ssh.execCommand('pm2 save', { cwd: projectPath });

    console.log('✅ DEPLOYMENT COMPLETED!');
  } catch (err) {
    console.error('❌ Error during deployment:', err);
  } finally {
    process.exit(0);
  }
}

deploy();
