const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect({ host: '103.124.92.238', username: 'root', password: 'O6iogp8j46WHDzua' });
    const res = await ssh.execCommand('pm2 logs giasuai --lines 50 --nostream', { cwd: '/root' });
    console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
