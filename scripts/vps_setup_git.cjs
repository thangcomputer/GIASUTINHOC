const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./vpsSshEnv.cjs');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect(requireVpsSsh());
    
    console.log('Cleaning up accidental /root/.git...');
    await ssh.execCommand('rm -rf /root/.git');
    
    console.log('Setting up Git on the VPS...');
    const cmds = [
      'git config --global --add safe.directory /www/wwwroot/giasuai',
      'git init',
      'git remote remove origin || true',
      'git remote add origin https://github.com/thangcomputer/GIASUTINHOC.git',
      'git fetch',
      'git branch -m master main || true',
      'git reset --hard origin/main',
      'npm install --legacy-peer-deps',
      'npm run build'
    ];
    
    for (const cmd of cmds) {
        console.log(`Running: ${cmd}`);
        const res = await ssh.execCommand(cmd, { cwd: '/www/wwwroot/giasuai' });
        if (res.stdout) console.log(res.stdout);
        if (res.stderr) console.error(res.stderr);
    }
    
    console.log('Restarting PM2...');
    await ssh.execCommand('pm2 restart giasuai --update-env', { cwd: '/root' });
    console.log('VPS Git setup complete!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
