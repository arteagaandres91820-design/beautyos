const { spawn } = require('child_process');
const path = require('path');
process.chdir(path.join(__dirname, 'apps', 'consumer'));
const vite = spawn('node', [path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5175'], {
  stdio: 'inherit', shell: false,
});
vite.on('exit', code => process.exit(code ?? 0));
