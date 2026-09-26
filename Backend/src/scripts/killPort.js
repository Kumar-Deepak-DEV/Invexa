const { execSync } = require('child_process');

try {
  const output = execSync('netstat -ano | findstr :5000', { encoding: 'utf8' });
  const lines = output.trim().split('\n');
  const pids = new Set();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      pids.add(pid);
    }
  }
  for (const pid of pids) {
    console.log(`Killing PID ${pid}`);
    try {
      execSync(`taskkill /F /PID ${pid}`);
    } catch (e) {
      console.log(`Could not kill ${pid}`);
    }
  }
} catch (e) {
  console.log('No process found on port 5000');
}
