const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function run() {
  try {
    console.log('Connecting to VPS...');
    await ssh.connect({
      host: '103.124.92.238',
      username: 'root',
      password: 'O6iogp8j46WHDzua'
    });
    console.log('Connected!');

    const remotePath = '/www/wwwroot/giasuai/deploy.tar.gz';
    console.log('Uploading deploy.tar.gz...');
    await ssh.putFile('c:\\Users\\thang\\Desktop\\GIASUAI\\deploy.tar.gz', remotePath);
    console.log('Upload complete.');

    console.log('Extracting archive...');
    const extractCmd = `cd /www/wwwroot/giasuai && tar -xzvf deploy.tar.gz && rm deploy.tar.gz`;
    const resExtract = await ssh.execCommand(extractCmd);
    console.log('Extraction stdout:', resExtract.stdout);
    if (resExtract.stderr) console.error('Extraction stderr:', resExtract.stderr);

    console.log('Installing dependencies...');
    const installCmd = `cd /www/wwwroot/giasuai && npm install --production`;
    const resInstall = await ssh.execCommand(installCmd);
    console.log('Install stdout:', resInstall.stdout);
    if (resInstall.stderr) console.error('Install stderr:', resInstall.stderr);

    console.log('Restarting PM2 process...');
    const restartCmd = `pm2 restart giasuai -y --update-env`;
    const resRestart = await ssh.execCommand(restartCmd);
    console.log('Restart PM2 stdout:', resRestart.stdout);
    if (resRestart.stderr) console.error('Restart PM2 stderr:', resRestart.stderr);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
run();
