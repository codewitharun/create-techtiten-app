#!/usr/bin/env node
// create-techtiten-app: scaffolds an npm-workspaces monorepo
//   apps/mobile      Expo (latest SDK, Expo Router, typed)        always
//   apps/web         Next.js (latest): website + /admin + /api    optional
//   packages/theme   colors (preset), spacing, radius, fonts      shared
//   packages/shared  functions, types, zod schemas                shared
// Latest versions every time: the base apps come from create-expo-app / create-next-app,
// and native-aware packages are added with `npx expo install` (SDK-matched). Nothing native
// is committed: android/ and ios/ are generated at build time (CNG).
//
// Every option lives in OPTIONS below: the prompts, the flags and --help are all built from it,
// so a new feature only has to be added once.
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONTS, THEMES, buildColors, isHex } from './presets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TPL = join(ROOT, 'templates');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const choices = (obj) => Object.entries(obj).map(([value, o]) => ({ value, label: o.label, hint: o.hint }));

// ---------------------------------------------------------------- options (single source of truth)
const OPTIONS = [
  { key: 'name', kind: 'text', flag: '--name=<text>', help: 'App display name (under the icon)', def: (a) => titleCase(a.slug), message: 'App display name' },
  {
    key: 'package', kind: 'text', flag: '--package=<id>', help: 'Android package / iOS bundle id (permanent once on Play)',
    def: (a) => `com.techtiten.${a.slug.replace(/-/g, '')}`, message: 'Android package / iOS bundle id',
    validate: (v) => (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(v ?? '') ? undefined : 'Like com.techtiten.myapp (lowercase, dots)'),
  },
  { key: 'web', kind: 'bool', flag: '--web / --no-web', help: 'Next.js app next to the phone app: website + /admin panel + /api backend', def: () => true, message: 'Add a Next.js app (website + admin panel + API)?' },
  {
    key: 'nav', kind: 'select', flag: '--nav=<stack|tabs>', help: 'Navigation layout', def: () => 'stack', message: 'Navigation',
    options: [{ value: 'stack', label: 'Stack', hint: 'screens push on top of each other' }, { value: 'tabs', label: 'Bottom tabs', hint: 'Home + Settings tabs, add more in app/(tabs)' }],
  },
  {
    key: 'state', kind: 'select', flag: '--state=<zustand|redux>', help: 'State management (both come with TanStack Query for API data)', def: () => 'zustand', message: 'State management',
    options: [{ value: 'zustand', label: 'Zustand + TanStack Query', hint: 'recommended: tiny stores' }, { value: 'redux', label: 'Redux Toolkit + TanStack Query', hint: 'more structure, Redux DevTools' }],
  },
  { key: 'theme', kind: 'select', flag: '--theme=<preset>', help: 'Color theme preset (light + dark)', def: () => 'techtiten', message: 'Color theme', options: choices(THEMES) },
  {
    key: 'brand', kind: 'text', flag: '--brand=<#RRGGBB>', help: 'Optional: your own brand color instead of the preset\'s', def: () => '', message: 'Custom brand color? (#RRGGBB, empty = use the preset)',
    validate: (v) => (!v || isHex(v) ? undefined : 'Like #00C389, or leave empty'),
  },
  { key: 'font', kind: 'select', flag: '--font=<font>', help: 'App font (phone app and website)', def: () => 'system', message: 'Font', options: choices(FONTS) },
  { key: 'ads', kind: 'bool', flag: '--ads / --no-ads', help: 'Google AdMob banner (test ads in development)', def: () => false, message: 'Google AdMob ads?' },
];

const TOOL_FLAGS = [
  ['--yes, -y', 'Skip the questions, use defaults (or the flags you pass)'],
  ['--skip-install', 'Only write files, don\'t run npm install'],
  ['--no-git', 'Don\'t run git init / first commit'],
  ['--help, -h', 'Show this help'],
  ['--version, -v', 'Show the version'],
];

function printHelp() {
  const line = (a, b) => `  ${pc.cyan(a.padEnd(28))} ${b}`;
  console.log(`
${pc.bold('create-techtiten-app')} v${VERSION}
Scaffold an Expo app (+ optional Next.js web/admin/API) with a shared theme and shared logic.
Always uses the latest Expo SDK and Next.js.

${pc.bold('Usage')}
  npx create-techtiten-app ${pc.dim('<folder>')} ${pc.dim('[options]')}

${pc.bold('Options')}
${OPTIONS.map((o) => line(o.flag, `${o.help}${o.options ? '' : ''}`)).join('\n')}

${pc.bold('Choices')}
${line('themes', Object.entries(THEMES).map(([k, t]) => `${k} (${t.label})`).join(', '))}
${line('fonts', Object.keys(FONTS).join(', '))}

${pc.bold('Other')}
${TOOL_FLAGS.map(([a, b]) => line(a, b)).join('\n')}

${pc.bold('Examples')}
  npx create-techtiten-app my-app
  npx create-techtiten-app retro-games --yes --no-web --ads --theme=retro --font=pixel --nav=tabs
  npx create-techtiten-app shop --yes --web --theme=sunset --brand=#FF3366 --font=poppins --state=redux
`);
}

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const has = (...names) => names.some((n) => argv.includes(n));
const val = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const positional = argv.find((a) => !a.startsWith('-'));
const YES = has('--yes', '-y');

function fromFlags(o) {
  if (o.kind === 'bool') return has(`--${o.key}`) ? true : has(`--no-${o.key}`) ? false : undefined;
  return val(o.key);
}

function checkFlag(o, v) {
  if (v === undefined) return;
  if (o.kind === 'select' && !o.options.some((x) => x.value === v)) fail(`--${o.key}=${v} isn't valid. Choose: ${o.options.map((x) => x.value).join(', ')}`);
  const err = o.validate?.(v);
  if (err) fail(`--${o.key}: ${err}`);
}

function fail(msg) { p.cancel(msg); process.exit(1); }
const cancel = (v) => { if (p.isCancel(v)) fail('Cancelled.'); return v; };

async function ask(o, answers) {
  const given = fromFlags(o);
  checkFlag(o, given);
  if (given !== undefined) return given;
  const def = o.def(answers);
  if (YES) return def;
  if (o.kind === 'bool') return cancel(await p.confirm({ message: o.message, initialValue: def }));
  if (o.kind === 'select') return cancel(await p.select({ message: o.message, options: o.options, initialValue: def }));
  return cancel(await p.text({ message: o.message, initialValue: def, placeholder: def || undefined, validate: o.validate }));
}

// ---------------------------------------------------------------- helpers
function run(cmd, args, cwd, { quiet = false, env = {} } = {}) {
  const r = spawnSync(cmd, args, { cwd, stdio: quiet ? 'pipe' : 'inherit', shell: process.platform === 'win32', env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1', NEXT_TELEMETRY_DISABLED: '1', ...env } });
  if (r.status !== 0) {
    if (quiet) process.stderr.write(String(r.stderr ?? '') + String(r.stdout ?? ''));
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (in ${cwd})`);
  }
  return String(r.stdout ?? '');
}

// Copy a template folder, replacing __TOKENS__ in text files. "_gitignore" -> ".gitignore",
// "_github" -> ".github" (npm drops real dot-files like .gitignore from published packages).
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

// Generated files for the theme preset and the font (phone + web).
function writeThemeAndFonts(target, a) {
  const colors = buildColors(a.theme, a.brand);
  writeFileSync(join(target, 'packages/theme/src/colors.ts'),
    `// ${THEMES[a.theme].label} preset${a.brand ? `, brand ${a.brand}` : ''} (create-techtiten-app). Edit freely.\nexport const colors = ${JSON.stringify(colors, null, 2)} as const;\n`);

  const f = FONTS[a.font];
  const m = join(target, 'apps/mobile/src/theme/fonts.ts');
  if (!f.pkg) {
    writeFileSync(m, `// System font (San Francisco / Roboto): nothing to load.\nexport const fonts: Record<'regular' | 'medium' | 'bold' | 'black', string | undefined> = { regular: undefined, medium: undefined, bold: undefined, black: undefined };\nexport const useAppFonts = () => true;\n`);
  } else {
    const names = [...new Set(Object.values(f.weights))];
    writeFileSync(m, `// ${f.label} from ${f.pkg}. Text/Button pick the family per weight.\nimport { useFonts, ${names.join(', ')} } from '${f.pkg}';\n\nexport const fonts: Record<'regular' | 'medium' | 'bold' | 'black', string | undefined> = ${JSON.stringify(f.weights)};\n\n/** true once the font files are loaded (the root layout waits for it). */\nexport function useAppFonts() {\n  const [loaded, error] = useFonts({ ${names.join(', ')} });\n  return loaded || !!error;\n}\n`);
  }
  if (a.web) {
    const w = join(target, 'apps/web/src/app/fonts.ts');
    if (!f.next) writeFileSync(w, `// System font.\nexport const appFontClass = '';\n`);
    else {
      const opts = { subsets: ['latin'], variable: '--font-app', display: 'swap', ...(f.nextWeights ? { weight: f.nextWeights } : {}) };
      // next/font reads these options at build time and needs a plain object literal (unquoted keys).
      const literal = '{ ' + Object.entries(opts).map(([k, v]) => `${k}: ${JSON.stringify(v).replace(/"/g, "'")}`).join(', ') + ' }';
      writeFileSync(w, `// ${f.label} via next/font (self-hosted at build time, no layout shift).\nimport { ${f.next} } from 'next/font/google';\n\nconst font = ${f.next}(${literal});\nexport const appFontClass = font.variable;\n`);
    }
  }
}

// ---------------------------------------------------------------- main
async function main() {
  if (has('--help', '-h')) return printHelp();
  if (has('--version', '-v')) return console.log(VERSION);

  console.log();
  p.intro(pc.bgGreen(pc.black(` create-techtiten-app v${VERSION} `)));

  const dirName = positional ?? (YES ? 'my-app' : cancel(await p.text({ message: 'Project folder name', placeholder: 'my-app', validate: (v) => (slugify(v || '') ? undefined : 'Required') })));
  const slug = slugify(dirName);
  const target = resolve(process.cwd(), dirName);
  if (existsSync(target) && readdirSync(target).length) fail(`${dirName} already exists and isn't empty.`);

  const a = { slug };
  for (const o of OPTIONS) a[o.key] = await ask(o, a);
  if (a.brand && !a.brand.startsWith('#')) a.brand = `#${a.brand}`;

  if (!YES) {
    p.note([
      `Name       ${a.name}  (${a.package})`,
      `Apps       mobile${a.web ? ' + web (site, admin, API)' : ''}`,
      `Navigation ${a.nav}    State ${a.state}`,
      `Theme      ${THEMES[a.theme].label}${a.brand ? ` with brand ${a.brand}` : ''}    Font ${FONTS[a.font].label}`,
      `Ads        ${a.ads ? 'AdMob' : 'none'}`,
    ].join('\n'), 'Summary');
    if (!cancel(await p.confirm({ message: 'Create it?', initialValue: true }))) fail('Cancelled.');
  }

  const install = !has('--skip-install');
  const { name: displayName, package: packageId, web, state, ads } = a;
  const scope = `@${slug}`;
  const vars = { APP_SLUG: slug, APP_NAME: displayName, PACKAGE_ID: packageId, SCOPE: scope, STATE: state, YEAR: String(new Date().getFullYear()), WEB_ENABLED: web ? 'true' : 'false', THEME_LABEL: THEMES[a.theme].label };
  const s = p.spinner();

  // 1. Root + shared packages
  mkdirSync(target, { recursive: true });
  copyTemplate(join(TPL, 'root'), target, vars);
  copyTemplate(join(TPL, 'packages'), join(target, 'packages'), vars);
  if (!web) rmSync(join(target, '.github/workflows/web-check.yml'), { force: true });
  const rootPkg = readJson(join(target, 'package.json'));
  if (!web) { delete rootPkg.scripts.web; delete rootPkg.scripts['build:web']; delete rootPkg.scripts['upgrade:web']; }
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
  copyTemplate(join(TPL, `mobile/nav-${a.nav}`), m, vars);
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
      writeFileSync(nc, readFileSync(nc, 'utf8').replace(/const nextConfig: NextConfig = \{/, (x) => `${x}\n  ${tp}`));
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

  writeThemeAndFonts(target, a);
  const pluginList = (added = []) => [...new Set(['expo-router', ...added, ...(ads ? ['react-native-google-mobile-ads'] : []), './plugins/withSigning.js'])];

  // 4. Install: one root install, then SDK-matched native packages via expo install
  if (install) {
    s.start('Installing (one install for all workspaces)');
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    s.message('Adding Expo packages matched to this SDK');
    const expoPkgs = ['expo-router', 'expo-linking', 'expo-constants', 'expo-status-bar', 'expo-haptics', 'expo-system-ui', 'expo-font', '@expo/vector-icons', 'react-native-safe-area-context', 'react-native-screens', '@react-native-async-storage/async-storage', 'react-dom', 'react-native-web'];
    if (ads) expoPkgs.push('react-native-google-mobile-ads');
    if (FONTS[a.font].pkg) expoPkgs.push(FONTS[a.font].pkg);
    const expoArgs = ['expo', 'install', ...expoPkgs, '--', '--no-audit', '--no-fund', '--loglevel=error'];
    // expo install adds config plugins itself, but can't edit app.config.ts. Give it a temporary
    // app.json, then copy the plugins it added into config/plugins.json (read by app.config.ts).
    renameSync(join(m, 'app.config.ts'), join(m, 'app.config.ts.tmp'));
    writeJson(join(m, 'app.json'), { expo: { name: displayName, slug, plugins: [] } });
    try {
      run('npx', expoArgs, m, { quiet: true });
    } catch {
      // Expo's version API unreachable (proxy/offline): use the versions bundled with the installed SDK.
      s.message("Expo API unreachable, using the SDK's bundled version list");
      run('npx', expoArgs, m, { quiet: true, env: { EXPO_OFFLINE: '1' } });
    }
    const added = (readJson(join(m, 'app.json')).expo.plugins ?? []).map((x) => (Array.isArray(x) ? x[0] : x));
    rmSync(join(m, 'app.json'));
    renameSync(join(m, 'app.config.ts.tmp'), join(m, 'app.config.ts'));
    const statePkgs = state === 'redux' ? ['@reduxjs/toolkit', 'react-redux', '@tanstack/react-query'] : ['zustand', '@tanstack/react-query'];
    run('npm', ['install', ...statePkgs, '-w', `${scope}/mobile`, '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    run('npm', ['install', 'zod', '-w', `${scope}/shared`, '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    run('npm', ['install', '-D', 'prettier', '--no-audit', '--no-fund', '--loglevel=error'], target, { quiet: true });
    // Now that the packages exist, turn their config plugins on.
    writeJson(join(m, 'config/plugins.json'), pluginList(added));
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
  } else {
    writeJson(join(m, 'config/plugins.json'), pluginList());
  }

  // 5. Git (uses your git name/email; falls back to a neutral author if none is set)
  if (!has('--no-git')) {
    try {
      run('git', ['init', '-b', 'main'], target, { quiet: true });
      run('git', ['add', '-A'], target, { quiet: true });
      try { run('git', ['commit', '-m', 'Initial commit from create-techtiten-app', '--no-verify'], target, { quiet: true }); }
      catch { run('git', ['-c', 'user.name=create-techtiten-app', '-c', 'user.email=noreply@techtiten.com', 'commit', '-m', 'Initial commit from create-techtiten-app', '--no-verify'], target, { quiet: true }); }
    } catch { p.log.warn('git init skipped (git missing or commit failed). Run git init yourself.'); }
  }

  const rel = relative(process.cwd(), target) || '.';
  p.note([
    `cd ${rel}`,
    'npm run mobile        # Expo dev server (press a for Android)',
    web ? 'npm run web           # Next.js on http://localhost:3000 (/admin, /api/health)' : null,
    'npm run typecheck     # all workspaces',
    'npm run format        # prettier',
    ads ? 'Ads need a dev build (npm run android), not Expo Go.' : null,
  ].filter(Boolean).join('\n'), 'Next steps');
  p.outro(`${pc.green('Done.')} ${displayName} is ready in ${pc.cyan(rel)}`);
}

main().catch((e) => fail(e.message));
