const { execSync } = require('child_process');

console.log('Starting build via execSync...');

try {
  const out = execSync('npm run build', {
    cwd: 'Z:/bpi/v3/bpi_main',
    stdio: 'pipe',
  });
  console.log('BUILD STDOUT\n' + out.toString());
} catch (err) {
  console.log('BUILD STDOUT\n' + (err.stdout?.toString() ?? ''));
  console.log('BUILD STDERR\n' + (err.stderr?.toString() ?? ''));
  console.log('STATUS', err.status);
  process.exit(err.status || 1);
}
