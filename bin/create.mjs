// `npx create-techtiten-app <folder>`: asks the questions, then builds the monorepo.
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { FONTS, THEMES } from './presets.mjs';
import { cancel, copyTemplate, editJson, fail, npmAdd, npmInstall, readJson, run, slugify, TPL, VERSION, writeJson } from './lib.mjs';
import { ask, DBS, OPTIONS } from './options.mjs';
import {
  DB_PACKAGES, derive, mobileExpoPackages, pluginList, saveProject, statePackages, templateVars, writeDevEnv, writeDockerCompose,
  writeMobileFeatures, writeReadme, writeRootScripts, writeRouteIndexes, writeServer, writeThemeAndFonts,
} from './project.mjs';

export async function create(args) {
  console.log();
  p.intro(pc.bgGreen(pc.black(` create-techtiten-app v${VERSION} `)));

  const dirName = args.positional[0] ?? (args.yes ? 'my-app' : cancel(await p.text({ message: 'Project folder name', placeholder: 'my-app', validate: (v) => (slugify(v || '') ? undefined : 'Required') })));
  const slug = slugify(dirName);
  const target = resolve(process.cwd(), dirName);
  if (existsSync(target) && readdirSync(target).length) fail(`${dirName} already exists and isn't empty.`);

  const a = { slug, routes: [] };
  for (const o of OPTIONS) a[o.key] = await ask(o, a, args);
  if (a.brand && !a.brand.startsWith('#')) a.brand = `#${a.brand}`;
  const d = derive(a);

  if (!args.yes) {
    p.note([
      `Name       ${a.name}  (${a.package})`,
      `Apps       mobile (+ web build)${a.web ? ' + Next.js (site, admin, API)' : d.hasApi ? ` + ${d.backend} API` : ''}`,
      `Database   ${d.hasApi ? DBS[d.db].label : '-'}`,
      `Navigation ${a.nav}    State ${a.state}`,
      `Theme      ${THEMES[a.theme].label}${a.brand ? ` with brand ${a.brand}` : ''}    Font ${FONTS[a.font].label}`,
      `Extras     ${[a.notifications && 'notifications', a.ads && 'AdMob'].filter(Boolean).join(', ') || 'none'}`,
    ].join('\n'), 'Summary');
    if (!cancel(await p.confirm({ message: 'Create it?', initialValue: true }))) fail('Cancelled.');
  }

  const install = !args.has('--skip-install');
  const vars = templateVars(a);
  const { scope } = d;
  // The timer shows elapsed seconds, so a long install never looks frozen.
  const s = p.spinner({ indicator: 'timer' });
  const steps = 1 + (a.web ? 1 : 0) + (install ? 1 : 0) + (args.has('--no-git') ? 0 : 1);
  let step = 0;
  const label = (text) => `[${++step}/${steps}] ${text}`;

  // 1. Root + shared packages
  mkdirSync(target, { recursive: true });
  copyTemplate(join(TPL, 'root'), target, vars);
  copyTemplate(join(TPL, 'packages'), join(target, 'packages'), vars);
  if (!a.web) rmSync(join(target, '.github/workflows/web-check.yml'), { force: true });
  writeRootScripts(target, a);
  saveProject(target, a);

  // 2. Mobile: latest Expo blank TypeScript app, then our layer on top
  s.start(label('Creating the Expo app (latest SDK, ~30s)'));
  mkdirSync(join(target, 'apps'), { recursive: true });
  await run('npx', ['--yes', 'create-expo-app@latest', 'mobile', '--template', 'blank-typescript', '--no-install'], join(target, 'apps'), { quiet: true });
  const m = join(target, 'apps/mobile');
  // Keep the SDK template's own app.json values (icons, splash, platform defaults) as config/base.json.
  const sdkBase = existsSync(join(m, 'app.json')) ? readJson(join(m, 'app.json')).expo ?? {} : {};
  for (const k of ['name', 'slug', 'plugins']) delete sdkBase[k];
  for (const f of ['App.tsx', 'index.ts', 'app.json', '.gitignore', 'LICENSE']) rmSync(join(m, f), { force: true });
  rmSync(join(m, '.git'), { recursive: true, force: true });
  copyTemplate(join(TPL, 'mobile/common'), m, vars);
  writeJson(join(m, 'config/base.json'), sdkBase);
  copyTemplate(join(TPL, `mobile/nav-${a.nav}`), m, vars);
  copyTemplate(join(TPL, `mobile/${a.state}`), m, vars);
  writeMobileFeatures(target, a);
  editJson(join(m, 'package.json'), (mp) => {
    mp.name = `${scope}/mobile`;
    mp.main = 'expo-router/entry';
    mp.scripts = { ...mp.scripts, start: 'expo start', android: 'expo run:android', ios: 'expo run:ios', web: 'expo start --web', 'build:web': 'expo export --platform web', prebuild: 'expo prebuild --clean', typecheck: 'tsc --noEmit' };
    mp.dependencies = { ...mp.dependencies, [`${scope}/config`]: '*', [`${scope}/theme`]: '*', [`${scope}/shared`]: '*' };
  });
  s.stop('Expo app created');

  // 3. Web: latest Next.js (App Router, TS, Tailwind, src/), then our layer
  if (a.web) {
    s.start(label('Creating the Next.js app (latest, ~30s)'));
    await run('npx', ['--yes', 'create-next-app@latest', 'web', '--ts', '--app', '--eslint', '--tailwind', '--src-dir', '--import-alias', '@/*', '--use-npm', '--skip-install', '--disable-git', '--yes'], join(target, 'apps'), { quiet: true });
    const w = join(target, 'apps/web');
    for (const f of ['.gitignore', 'README.md', 'src/app/page.tsx']) rmSync(join(w, f), { force: true }); // page.tsx -> src/app/(site)/page.tsx
    copyTemplate(join(TPL, 'web'), w, vars);
    // Keep Next's own generated next.config.ts (it changes between versions) and only add
    // transpilePackages so the shared TypeScript packages compile.
    const nc = join(w, 'next.config.ts');
    const tp = `transpilePackages: ['${scope}/config', '${scope}/theme', '${scope}/shared'],`;
    if (existsSync(nc) && /const nextConfig: NextConfig = \{/.test(readFileSync(nc, 'utf8'))) {
      writeFileSync(nc, readFileSync(nc, 'utf8').replace(/const nextConfig: NextConfig = \{/, (x) => `${x}\n  ${tp}`));
    } else {
      writeFileSync(nc, `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {\n  ${tp}\n};\n\nexport default nextConfig;\n`);
    }
    editJson(join(w, 'package.json'), (wp) => {
      wp.name = `${scope}/web`;
      wp.scripts = { ...wp.scripts, typecheck: 'next typegen && tsc --noEmit' }; // typegen writes LayoutProps/RouteContext types
      if (d.db === 'postgres') Object.assign(wp.scripts, { 'db:push': 'drizzle-kit push', 'db:studio': 'drizzle-kit studio' });
      wp.dependencies = { ...wp.dependencies, [`${scope}/config`]: '*', [`${scope}/theme`]: '*', [`${scope}/shared`]: '*' };
    });
    s.stop('Next.js app created');
  }

  // 4. API (Express / Fastify in apps/api, or inside Next.js)
  if (d.hasApi && d.backend !== 'next') mkdirSync(join(target, 'apps/api'), { recursive: true });
  writeServer(target, a);
  writeRouteIndexes(target, a);
  if (d.backend === 'express' || d.backend === 'fastify') {
    editJson(join(target, 'apps/api/package.json'), (ap) => {
      ap.dependencies = { [`${scope}/config`]: '*', [`${scope}/shared`]: '*' };
      if (d.db === 'postgres') Object.assign(ap.scripts, { 'db:push': 'drizzle-kit push', 'db:studio': 'drizzle-kit studio' });
    });
  }
  writeDevEnv(target, a);
  writeDockerCompose(target, a);
  writeThemeAndFonts(target, a);
  writeReadme(target, a);

  // 5. Install: one root install, then SDK-matched native packages via expo install
  if (install) {
    p.log.info(pc.dim('Installing takes 2-5 minutes the first time. The timer keeps counting while it works.'));
    s.start(label('Installing packages (all workspaces at once)'));
    await npmInstall(target);
    s.message(`[${step}/${steps}] Adding Expo packages matched to this SDK`);
    const added = await expoInstall(m, a, mobileExpoPackages(a));
    writeJson(join(m, 'config/plugins.json'), pluginList(a, added));
    s.message(`[${step}/${steps}] Adding ${d.hasApi ? 'API, database and ' : ''}state packages`);
    await npmAdd(target, `${scope}/mobile`, statePackages(a.state));
    await npmAdd(target, `${scope}/shared`, ['zod']);
    await npmAdd(target, `${scope}/shared`, ['vitest'], { dev: true });
    await npmAdd(target, null, ['prettier', 'typescript'], { dev: true });
    const db = DB_PACKAGES[d.db];
    if (d.backend === 'express') {
      await npmAdd(target, `${scope}/api`, ['express', 'cors', 'helmet', 'express-rate-limit', 'zod', 'tsx', ...db.deps]);
      await npmAdd(target, `${scope}/api`, ['typescript', '@types/node', '@types/express', '@types/cors', ...db.dev], { dev: true });
    } else if (d.backend === 'fastify') {
      await npmAdd(target, `${scope}/api`, ['fastify', '@fastify/cors', '@fastify/helmet', '@fastify/rate-limit', 'zod', 'tsx', ...db.deps]);
      await npmAdd(target, `${scope}/api`, ['typescript', '@types/node', ...db.dev], { dev: true });
    } else if (d.backend === 'next') {
      await npmAdd(target, `${scope}/web`, ['zod', ...db.deps]);
      await npmAdd(target, `${scope}/web`, db.dev, { dev: true });
    }
    if (a.web) { s.message(`[${step}/${steps}] Using one React version for phone and web`); await pinReact(target, m); }
    s.stop('Packages installed');
  } else {
    writeJson(join(m, 'config/plugins.json'), pluginList(a));
  }

  // 6. Git (uses your git name/email; falls back to a neutral author if none is set)
  if (!args.has('--no-git')) { s.start(label('First git commit')); await gitInit(target); s.stop('Git ready'); }

  const rel = relative(process.cwd(), target) || '.';
  p.note([
    `cd ${rel}`,
    ...(d.db === 'mongo' || d.db === 'postgres' ? [`npm run db:up         # local ${d.db === 'mongo' ? 'MongoDB' : 'Postgres'} with Docker (or: brew services start ${d.db === 'mongo' ? 'mongodb-community' : 'postgresql@17'})`] : []),
    ...(d.db === 'postgres' ? ['npm run db:push       # create the tables'] : []),
    d.hasApi ? 'npm run dev           # API + Expo together (a = Android, w = web)' : 'npm run dev           # Expo (a = Android, w = web)',
    d.hasApi ? `API docs              ${d.backend === 'next' ? 'http://localhost:3000/api/docs' : 'http://localhost:4000/docs'}` : null,
    a.web ? 'npm run web           # Next.js on http://localhost:3000 (/admin, /legal)' : null,
    'npm run typecheck     # all workspaces',
    a.ads || a.notifications ? 'Ads and push notifications need a dev build (npm run android), not Expo Go.' : null,
  ].filter(Boolean).join('\n'), 'Next steps');
  p.outro(`${pc.green('Done.')} ${a.name} is ready in ${pc.cyan(rel)}`);
}

/**
 * `npx expo install` adds config plugins itself, but can't edit app.config.ts. Give it a temporary
 * app.json, then return the plugins it added (they go into config/plugins.json, read by app.config.ts).
 */
export async function expoInstall(m, a, pkgs) {
  const args = ['expo', 'install', ...pkgs, '--', '--no-audit', '--no-fund', '--loglevel=error'];
  renameSync(join(m, 'app.config.ts'), join(m, 'app.config.ts.tmp'));
  writeJson(join(m, 'app.json'), { expo: { name: a.name, slug: a.slug, plugins: [] } });
  try {
    try {
      await run('npx', args, m, { quiet: true });
    } catch {
      // Expo's version API unreachable (proxy/offline): use the versions bundled with the installed SDK.
      await run('npx', args, m, { quiet: true, env: { EXPO_OFFLINE: '1' } });
    }
    return (readJson(join(m, 'app.json')).expo.plugins ?? []).map((x) => (Array.isArray(x) ? x[0] : x));
  } finally {
    rmSync(join(m, 'app.json'), { force: true });
    renameSync(join(m, 'app.config.ts.tmp'), join(m, 'app.config.ts'));
  }
}

// One React for the whole repo: pin web's react/react-dom to the version Expo installed,
// otherwise npm can install two Reacts and hooks break ("Invalid hook call").
async function pinReact(target, m) {
  const rv = readJson(join(m, 'package.json')).dependencies.react;
  editJson(join(target, 'apps/web/package.json'), (wp) => { wp.dependencies.react = rv; wp.dependencies['react-dom'] = rv; });
  editJson(join(target, 'package.json'), (rp) => { rp.overrides = { ...(rp.overrides ?? {}), react: rv, 'react-dom': rv }; });
  await npmInstall(target);
}

async function gitInit(target) {
  try {
    await run('git', ['init', '-b', 'main'], target, { quiet: true });
    await run('git', ['add', '-A'], target, { quiet: true });
    try { await run('git', ['commit', '-m', 'Initial commit from create-techtiten-app', '--no-verify'], target, { quiet: true }); }
    catch { await run('git', ['-c', 'user.name=create-techtiten-app', '-c', 'user.email=noreply@techtiten.com', 'commit', '-m', 'Initial commit from create-techtiten-app', '--no-verify'], target, { quiet: true }); }
  } catch { p.log.warn('git init skipped (git missing or commit failed). Run git init yourself.'); }
}
