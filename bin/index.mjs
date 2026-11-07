#!/usr/bin/env node
// create-techtiten-app: scaffolds an npm-workspaces monorepo
//   apps/mobile  Expo (latest SDK, Expo Router, typed)        always
//   apps/web     Next.js (latest): website + /admin + /api   optional
//   packages/theme   colors, spacing, radius, fonts          shared
//   packages/shared  functions, types, zod schemas           shared
// Latest versions every time: the base apps come from create-expo-app / create-next-app,
// and native-aware packages are added with `npx expo install` (SDK-matched). Nothing native
// is committed: android/ and ios/ are generated at build time (CNG).
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TPL = resolve(dirname(fileURLToPath(import.meta.url)), '../templates');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const positional = argv.find((a) => !a.startsWith('--'));
const YES = flag('yes') || flag('y');

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const cancel = (v) => { if (p.isCancel(v)) { p.cancel('Cancelled.'); process.exit(0); } return v; };

function run(cmd, args, cwd, { quiet = false, env = {} } = {}) {
  const r = spawnSync(cmd, args, { cwd, stdio: quiet ? 'pipe' : 'inherit', shell: process.platform === 'win32', env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', NEXT_TELEMETRY_DISABLED: '1', ...env } });
  if (r.status !== 0) {
    if (quiet) process.stderr.write(String(r.stderr ?? '') + String(r.stdout ?? ''));
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (in ${cwd})`);
  }
  return String(r.stdout ?? '');
}

// Copy a template folder, replacing __TOKENS__ in text files. Files named *.tpl lose the suffix;
// "_gitignore" becomes ".gitignore" (npm strips real .gitignore files from published packages).
function copyTemplate(from, to, vars) {
  if (!existsSync(from)) return;
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    let outName = name.replace(/\.tpl$/, '');
    if (outName === '_gitignore') outName = '.gitignore';
    if (outName === '_github') outName = '.github';
    const dest = join(to, outName);
    if (statSync(src).isDirectory()) { mkdirSync(dest, { recursive: true }); copyTemplate(src, dest, vars); continue; }
    mkdirSync(dirname(dest), { recursive: true });
    const buf = readFileSync(src);
    const isText = !/\.(png|jpg|jpeg|gif|ttf|otf|woff2?|ico)$/i.test(name);
    writeFileSync(dest, isText ? buf.toString('utf8').replace(/__([A-Z_]+)__/g, (m, k) => (k in vars ? vars[k] : m)) : buf);
  }
}

const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const writeJson = (f, o) => writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

async function main() {
  console.log();
  p.intro(pc.bgGreen(pc.black(' create-techtiten-app ')));

  const dirName = positional ?? (YES ? 'my-app' : cancel(await p.text({ message: 'Project folder name', placeholder: 'my-app', validate: (v) => (slugify(v || '') ? undefined : 'Required') })));
  const slug = slugify(dirName);
  const target = resolve(process.cwd(), dirName);
  if (existsSync(target) && readdirSync(target).length) { p.cancel(`${dirName} already exists and isn't empty.`); process.exit(1); }

  const displayName = opt('name') ?? (YES ? titleCase(slug) : cancel(await p.text({ message: 'App display name', initialValue: titleCase(slug) })));
  const packageId = opt('package') ?? (YES ? `com.techtiten.${slug.replace(/-/g, '')}` : cancel(await p.text({
    message: 'Android package / iOS bundle id', initialValue: `com.techtiten.${slug.replace(/-/g, '')}`,
    validate: (v) => (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(v) ? undefined : 'Like com.techtiten.myapp (lowercase, dots)'),
  })));
  const web = flag('web') ? true : flag('no-web') ? false : YES ? true : cancel(await p.confirm({ message: 'Add a Next.js app (website + admin panel + API) next to the mobile app?', initialValue: true }));
  const state = opt('state') ?? (YES ? 'zustand' : cancel(await p.select({
    message: 'State management',
    options: [
      { value: 'zustand', label: 'Zustand + TanStack Query', hint: 'recommended: tiny stores, server data cached' },
      { value: 'redux', label: 'Redux Toolkit + TanStack Query', hint: 'more structure, Redux DevTools' },
    ],
  })));
  const ads = flag('ads') ? true : flag('no-ads') ? false : YES ? false : cancel(await p.confirm({ message: 'Google AdMob ads (banner component, test ads in dev)?', initialValue: false }));
  const install = !flag('skip-install');

  const scope = `@${slug}`;
  const vars = { APP_SLUG: slug, APP_NAME: displayName, PACKAGE_ID: packageId, SCOPE: scope, STATE: state, YEAR: String(new Date().getFullYear()), WEB_ENABLED: web ? 'true' : 'false' };
  const s = p.spinner();

  // 1. Root + shared packages
  mkdirSync(target, { recursive: true });
  copyTemplate(join(TPL, 'root'), target, vars);
  copyTemplate(join(TPL, 'packages'), join(target, 'packages'), vars);
  if (!web) rmSync(join(target, '.github/workflows/web-check.yml'), { force: true });
  const rootPkg = readJson(join(target, 'package.json'));
  if (!web) { delete rootPkg.scripts.web; delete rootPkg.scripts['build:web']; }
  writeJson(join(target, 'package.json'), rootPkg);

  // 2. Mobile: latest Expo blank TypeScript app, then our layer on top
  s.start('Creating the Expo app (latest SDK)');
  mkdirSync(join(target, 'apps'), { recursive: true });
  run('npx', ['--yes', 'create-expo-app@latest', 'mobile', '--template', 'blank-typescript', '--no-install'], join(target, 'apps'), { quiet: true });
  const m = join(target, 'apps/mobile');
  // Keep the SDK template's own app.json values (icons, splash, platform defaults) as config/base.json.
  const sdkBase = existsSync(join(m, 'app.json')) ? readJson(join(m, 'app.json')).expo ?? {} : {};
  for (const k of ['name', 'slug', 'plugins']) delete sdkBase[k];
  for (const f of ['App.tsx', 'index.ts', 'app.json', '.gitignore', 'LICENSE']) rmSync(join(m, f), { force: true });
  rmSync(join(m, '.git'), { recursive: true, force: true });
  copyTemplate(join(TPL, 'mobile/common'), m, vars);
  writeJson(join(m, 'config/base.json'), sdkBase);
  copyTemplate(join(TPL, `mobile/${state}`), m, vars);
  copyTemplate(join(TPL, ads ? 'mobile/ads' : 'mobile/noads'), m, vars);
  const mp = readJson(join(m, 'package.json'));
  mp.name = `${scope}/mobile`;
  mp.main = 'expo-router/entry';
  mp.scripts = { ...mp.scripts, start: 'expo start', android: 'expo run:android', ios: 'expo run:ios', web: 'expo start --web', prebuild: 'expo prebuild --clean', typecheck: 'tsc --noEmit' };
  mp.dependencies = { ...mp.dependencies, [`${scope}/theme`]: '*', [`${scope}/shared`]: '*' };
  writeJson(join(m, 'package.json'), mp);
  s.stop('Expo app created');

  // 3. Web: latest Next.js (App Router, TS, Tailwind, src/), then our layer
  if (web) {
    s.start('Creating the Next.js app (latest)');
    run('npx', ['--yes', 'create-next-app@latest', 'web', '--ts', '--app', '--eslint', '--tailwind', '--src-dir', '--import-alias', '@/*', '--use-npm', '--skip-install', '--disable-git', '--yes'], join(target, 'apps'), { quiet: true });
    const w = join(target, 'apps/web');
    rmSync(join(w, '.gitignore'), { force: true });
    rmSync(join(w, 'README.md'), { force: true });
    rmSync(join(w, 'src/app/page.tsx'), { force: true }); // replaced by src/app/(site)/page.tsx
    copyTemplate(join(TPL, 'web'), w, vars);
    // Keep Next's own generated next.config.ts (it changes between versions) and only add
    // transpilePackages so the shared TypeScript packages compile.
    const nc = join(w, 'next.config.ts');
    const tp = `transpilePackages: ['${scope}/theme', '${scope}/shared'],`;
    if (existsSync(nc) && /const nextConfig: NextConfig = \{/.test(readFileSync(nc, 'utf8'))) {
      writeFileSync(nc, readFileSync(nc, 'utf8').replace(/const nextConfig: NextConfig = \{/, (m) => `${m}\n  ${tp}`));
    } else {
      writeFileSync(nc, `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {\n  ${tp}\n};\n\nexport default nextConfig;\n`);
    }
    const wp = readJson(join(w, 'package.json'));
    wp.name = `${scope}/web`;
    wp.scripts = { ...wp.scripts, typecheck: 'next typegen && tsc --noEmit' }; // typegen writes LayoutProps/RouteContext types
    wp.dependencies = { ...wp.dependencies, [`${scope}/theme`]: '*', [`${scope}/shared`]: '*' };
    writeJson(join(w, 'package.json'), wp);
    s.stop('Next.js app created');
  }

  // 4. Install: one root install, then SDK-matched native packages via expo install
  if (install) {
    s.start('Installing (one install for all workspaces)');
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    s.message('Adding Expo packages matched to this SDK');
    const expoPkgs = ['expo-router', 'expo-linking', 'expo-constants', 'expo-status-bar', 'expo-haptics', 'expo-system-ui', 'react-native-safe-area-context', 'react-native-screens', '@react-native-async-storage/async-storage', 'react-dom', 'react-native-web'];
    if (ads) expoPkgs.push('react-native-google-mobile-ads');
    const expoArgs = ['expo', 'install', ...expoPkgs, '--', '--no-audit', '--no-fund', '--loglevel=error'];
    // expo install adds config plugins itself, but can't edit app.config.ts. Give it a temporary
    // app.json, then copy the plugins it added into config/plugins.json (read by app.config.ts).
    renameSync(join(m, 'app.config.ts'), join(m, 'app.config.ts.tmp'));
    writeJson(join(m, 'app.json'), { expo: { name: displayName, slug, plugins: [] } });
    try {
      run('npx', expoArgs, m, { quiet: true });
    } catch {
      // Expo's version API unreachable (proxy/offline): use the versions bundled with the installed SDK.
      s.message('Expo API unreachable, using the SDK\'s bundled version list');
      run('npx', expoArgs, m, { quiet: true, env: { EXPO_OFFLINE: '1' } });
    }
    const added = (readJson(join(m, 'app.json')).expo.plugins ?? []).map((x) => (Array.isArray(x) ? x[0] : x));
    rmSync(join(m, 'app.json'));
    renameSync(join(m, 'app.config.ts.tmp'), join(m, 'app.config.ts'));
    const statePkgs = state === 'redux' ? ['@reduxjs/toolkit', 'react-redux', '@tanstack/react-query'] : ['zustand', '@tanstack/react-query'];
    run('npm', ['install', ...statePkgs, '-w', `${scope}/mobile`, '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    run('npm', ['install', 'zod', '-w', `${scope}/shared`, '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    // Now that the packages exist, turn their config plugins on.
    writeJson(join(m, 'config/plugins.json'), [...new Set(['expo-router', ...added, ...(ads ? ['react-native-google-mobile-ads'] : []), './plugins/withSigning.js'])]);
    if (web) {
      // One React for the whole repo: pin web's react/react-dom to the version Expo installed,
      // otherwise npm can install two Reacts and hooks break ("Invalid hook call").
      const rv = readJson(join(m, 'package.json')).dependencies.react;
      const w = join(target, 'apps/web');
      const wp = readJson(join(w, 'package.json'));
      wp.dependencies.react = rv;
      wp.dependencies['react-dom'] = rv;
      writeJson(join(w, 'package.json'), wp);
      const rootPkg2 = readJson(join(target, 'package.json'));
      rootPkg2.overrides = { ...(rootPkg2.overrides ?? {}), react: rv, 'react-dom': rv };
      writeJson(join(target, 'package.json'), rootPkg2);
      run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    }
    s.stop('Installed');
  }

  if (!install) writeJson(join(m, 'config/plugins.json'), ['expo-router', './plugins/withSigning.js', ...(ads ? ['react-native-google-mobile-ads'] : [])]);

  // 5. Git
  if (!flag('no-git')) {
    try {
      run('git', ['init', '-b', 'main'], target, { quiet: true });
      run('git', ['add', '-A'], target, { quiet: true });
      run('git', ['-c', 'user.name=create-techtiten-app', '-c', 'user.email=noreply@techtiten.com', 'commit', '-m', 'Initial commit from create-techtiten-app', '--no-verify'], target, { quiet: true });
    } catch { p.log.warn('git init skipped (git missing or commit failed). Run git init yourself.'); }
  }

  const rel = relative(process.cwd(), target) || '.';
  p.note([
    `cd ${rel}`,
    'npm run mobile        # Expo dev server (press a for Android)',
    web ? 'npm run web           # Next.js on http://localhost:3000 (/admin, /api/health)' : null,
    'npm run typecheck     # all workspaces',
    ads ? 'Ads need a dev build (npm run android), not Expo Go.' : null,
  ].filter(Boolean).join('\n'), 'Next steps');
  p.outro(`${pc.green('Done.')} ${displayName} is ready in ${pc.cyan(rel)}`);
}

main().catch((e) => { p.cancel(e.message); process.exit(1); });
