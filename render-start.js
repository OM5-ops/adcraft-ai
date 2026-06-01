/* Minimal robust start wrapper for Render
   Locates Nitro output and starts the server in multiple possible paths.
*/
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const candidates = [
  '.output/server/index.mjs',
  'dist/server/index.mjs',
  '.output/server/server.mjs',
  '.output/server/index.js',
  'dist/server/index.js',
];

const entry = candidates.find((p) => existsSync(p));
if (!entry) {
  console.error('Nitro server entry not found. Tried:', candidates.join(', '));
  process.exit(127);
}

console.log('Starting Nitro server using entry:', entry);
const nodeArgs = [entry];
const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('Failed to start Nitro server:', err);
  process.exit(127);
});
