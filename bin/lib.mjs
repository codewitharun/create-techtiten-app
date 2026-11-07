// Small helpers shared by `create` and `add`.
import * as p from '@clack/prompts';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const TPL = join(ROOT, 'templates');
export const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

export const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const secret = () => randomBytes(24).toString('base64url');

export function fail(msg) { p.cancel(msg); process.exit(1); }
export const cancel = (v) => { if (p.isCancel(v)) fail('Cancelled.'); return v; };

/**
 * Runs a command without blocking, so the spinner keeps animating (spawnSync froze it,
 * which made long installs look stuck). Quiet mode keeps the output and prints it only on failure.
 */
export function run(cmd, args, cwd, { quiet = false, env = {} } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', shell: process.platform === 'win32', env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', NEXT_TELEMETRY_DISABLED: '1', ...env } });
    let out = '';
    child.stdout?.on('data', (d) => { out += d; });
    child.stderr?.on('data', (d) => { out += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) return resolvePromise(out);
      if (quiet) process.stderr.write('\n' + out.slice(-4000));
      reject(new Error(`Command failed: ${cmd} ${args.join(' ')} (in ${cwd})`));
    });
  });
}

const NPM_QUIET = ['--no-audit', '--no-fund', '--loglevel=error'];
/** npm install into one workspace (or the root when ws is null). */
export async function npmAdd(target, ws, pkgs, { dev = false } = {}) {
  if (!pkgs.length) return;
  await run('npm', ['install', ...(dev ? ['-D'] : []), ...pkgs, ...(ws ? ['-w', ws] : []), ...NPM_QUIET], target, { quiet: true });
}
export const npmInstall = (target) => run('npm', ['install', ...NPM_QUIET], target, { quiet: true });

const replaceTokens = (text, vars) => text.replace(/__([A-Z_]+)__/g, (m, k) => (k in vars ? vars[k] : m));

// Copy a template folder, replacing __TOKENS__ in text files. "_gitignore" -> ".gitignore",
// "_github" -> ".github" (npm drops real dot-files like .gitignore from published packages).
export function copyTemplate(from, to, vars) {
  if (!existsSync(from)) return;
  if (statSync(from).isFile()) { writeText(to, replaceTokens(readFileSync(from, 'utf8'), vars)); return; }
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    let outName = name;
    if (outName === '_gitignore') outName = '.gitignore';
    if (outName === '_github') outName = '.github';
    const dest = join(to, outName);
    if (statSync(src).isDirectory()) { mkdirSync(dest, { recursive: true }); copyTemplate(src, dest, vars); continue; }
    mkdirSync(dirname(dest), { recursive: true });
    const buf = readFileSync(src);
    const isText = !/\.(png|jpg|jpeg|gif|ttf|otf|woff2?|ico)$/i.test(name);
    writeFileSync(dest, isText ? replaceTokens(buf.toString('utf8'), vars) : buf);
  }
}

export const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
export const writeJson = (f, o) => writeText(f, JSON.stringify(o, null, 2) + '\n');
export function writeText(f, s) { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); }
export const editJson = (f, fn) => { const o = readJson(f); fn(o); writeJson(f, o); };
