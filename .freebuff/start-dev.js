const { exec } = require('child_process');
const path = require('path');

const cwd = 'C:\\Users\\haizard\\Desktop\\house-rental';
const logFile = path.join(cwd, '.freebuff', 'preview-ebf6d844-1278-45f8-8f3e-17a69605465c.log');
const logErr = logFile + '.err';

// Use shell option for simpler escaping
const child = exec('npm run dev', {
  cwd,
  detached: true,
  windowsHide: true,
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' },
}, (err) => {
  if (err && err.code !== null) console.error('Process exited:', err.message);
});

const fs = require('fs');
if (child.stdout) child.stdout.pipe(fs.createWriteStream(logFile, { flags: 'a' }));
if (child.stderr) child.stderr.pipe(fs.createWriteStream(logErr, { flags: 'a' }));

child.unref();
console.log('PID:', child.pid);
