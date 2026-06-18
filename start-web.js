// Helper: start vite from the correct working directory
const { spawn } = require('child_process');
const path = require('path');

process.chdir(path.join(__dirname, 'apps', 'web'));
const vite = spawn('node', [path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')], {
  stdio: 'inherit',
  shell: false,
});
vite.on('exit', code => process.exit(code ?? 0));
