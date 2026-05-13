const { NodeSSH } = require('node-ssh');
const { requireVpsSsh } = require('./scripts/vpsSshEnv.cjs');
const path = require('path');
const ssh = new NodeSSH();
async function run() {
  try {
    await ssh.connect(requireVpsSsh());
    await ssh.putFile(path.join(__dirname, '.env'), '/www/wwwroot/giasuai/.env');
    console.log('Successfully uploaded .env to VPS');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
