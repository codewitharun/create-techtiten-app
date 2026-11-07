// `npm run dev`: starts the API and the Expo app together.
// Expo keeps your terminal (QR code, press a / i / w); API logs are printed with an [api] prefix.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(new URL('../techtiten.json', import.meta.url), 'utf8'));
const apiWs = cfg.backend === 'next' ? `${cfg.scope}/web` : `${cfg.scope}/api`;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const color = (s) => `\x1b[36m${s}\x1b[0m`;

const api = spawn(npm, ['run', 'dev', '-w', apiWs], { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', env: { ...process.env, FORCE_COLOR: '1' } });
const prefix = (stream, out) => {
  let buf = '';
  stream.on('data', (d) => {
    buf += d;
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const l of lines) out.write(`${color('[api]')} ${l}\n`);
  });
};
prefix(api.stdout, process.stdout);
prefix(api.stderr, process.stderr);
api.on('exit', (code) => { if (code) console.error(color('[api]') + ` stopped (exit ${code}). Fix the error above; the app keeps running.`); });

const app = spawn(npm, ['run', 'start', '-w', `${cfg.scope}/mobile`], { stdio: 'inherit', shell: process.platform === 'win32' });
const stop = () => { api.kill(); app.kill(); };
app.on('exit', (code) => { api.kill(); process.exit(code ?? 0); });
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
