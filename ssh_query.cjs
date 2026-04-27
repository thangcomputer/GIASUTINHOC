const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting...');
    await ssh.connect({
      host: '103.124.92.238',
      username: 'root',
      password: 'O6iogp8j46WHDzua'
    });
    console.log('Installing dependencies...');
    const installCmd = `cd /www/wwwroot/giasuai && npm install --legacy-peer-deps`;
    const resInstall = await ssh.execCommand(installCmd);
    console.log('Install stdout:', resInstall.stdout);
    if (resInstall.stderr) console.error('Install stderr:', resInstall.stderr);

    console.log('Restarting PM2...');
    const resRestart = await ssh.execCommand('pm2 restart giasuai --update-env');
    console.log('PM2 stdout:', resRestart.stdout);
    if (resRestart.stderr) console.error('PM2 stderr:', resRestart.stderr);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
