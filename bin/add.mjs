// `npx create-techtiten-app add <what>`: changes an existing project (reads techtiten.json).
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FONTS, THEMES, isHex } from './presets.mjs';
import { copyTemplate, fail, readJson, run, TPL, writeJson, writeText } from './lib.mjs';
import { expoInstall } from './create.mjs';
import { derive, loadProject, pluginList, saveProject, templateVars, writeMobileFeatures, writeReadme, writeRouteIndexes, writeThemeAndFonts } from './project.mjs';

const WHAT = ['route', 'notifications', 'ads', 'theme', 'font'];

export async function add(args) {
  const [, what, arg] = args.positional;
  const target = findProject(process.cwd());
  if (!target) fail('Run this inside a project made with create-techtiten-app (no techtiten.json found).');
  if (!WHAT.includes(what)) fail(`What should I add? One of: ${WHAT.join(', ')}. Example: npx create-techtiten-app add route tasks`);
  const a = loadProject(target);
  a.routes ??= [];
  p.intro(pc.bgGreen(pc.black(` add ${what} `)));
  const m = join(target, 'apps/mobile');

  if (what === 'route') addRoute(target, a, arg);

  if (what === 'theme') {
    if (!THEMES[arg]) fail(`Theme? One of: ${Object.keys(THEMES).join(', ')}`);
    const brand = args.val('brand') ?? '';
    if (brand && !isHex(brand)) fail('--brand: like #00C389');
    a.theme = arg; a.brand = brand && !brand.startsWith('#') ? `#${brand}` : brand;
    writeThemeAndFonts(target, a);
    p.log.success(`Theme is now ${THEMES[arg].label}. Edit packages/theme/src/colors.ts to fine-tune.`);
  }

  if (what === 'font') {
    if (!FONTS[arg]) fail(`Font? One of: ${Object.keys(FONTS).join(', ')}`);
    const old = FONTS[a.font];
    a.font = arg;
    writeThemeAndFonts(target, a);
    if (FONTS[arg].pkg) await expoInstall(m, a, [FONTS[arg].pkg]);
    if (old.pkg && old.pkg !== FONTS[arg].pkg) await run('npm', ['uninstall', old.pkg, '-w', `${a.scope}/mobile`], target, { quiet: true });
    p.log.success(`Font is now ${FONTS[arg].label}.`);
  }

  if (what === 'ads' || what === 'notifications') {
    if (a[what]) fail(`${what} is already on in this project.`);
    a[what] = true;
    writeMobileFeatures(target, a);
    const added = await expoInstall(m, a, what === 'ads' ? ['react-native-google-mobile-ads'] : ['expo-notifications']);
    const current = readJson(join(m, 'config/plugins.json')).map((x) => (Array.isArray(x) ? x[0] : x));
    writeJson(join(m, 'config/plugins.json'), pluginList(a, [...current, ...added].filter((x) => x !== './plugins/withSigning.js' && x !== 'expo-router')));
    if (what === 'notifications' && derive(a).hasApi) addPushServer(target, a);
    p.log.success(what === 'ads'
      ? 'AdMob is on: <Banner /> from @/ads/Banner. Set your real app ids in apps/mobile/app.config.ts before release. Needs a new store build.'
      : 'Notifications are on: Settings has a daily reminder switch. Needs a new store build (and `npx eas init` in apps/mobile for push).');
  }

  saveProject(target, a);
  writeReadme(target, a);
  p.outro(`${pc.green('Done.')} Run ${pc.cyan('npm run typecheck')} to check everything.`);
}

function findProject(dir) {
  for (let d = resolve(dir); ; d = resolve(d, '..')) {
    if (existsSync(join(d, 'techtiten.json'))) return d;
    if (resolve(d, '..') === d) return null;
  }
}

// ---------------------------------------------------------------- add route
const words = (name) => {
  const parts = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-');
  const last = parts.pop();
  // "tasks" or "task" -> task / tasks; "categories" or "category" -> category / categories
  const isPlural = /[^s]s$/.test(last);
  const one = !isPlural ? last : last.endsWith('ies') ? `${last.slice(0, -3)}y` : /(x|ch|sh|ss)es$/.test(last) ? last.slice(0, -2) : last.slice(0, -1);
  const many = isPlural ? last : /[^aeiou]y$/.test(last) ? `${last.slice(0, -1)}ies` : /(s|x|ch|sh)$/.test(last) ? `${last}es` : `${last}s`;
  const camel = (w) => w.map((x, i) => (i ? x[0].toUpperCase() + x.slice(1) : x)).join('');
  const pascal = (w) => w.map((x) => x[0].toUpperCase() + x.slice(1)).join('');
  const S = [...parts, one], M = [...parts, many];
  return { kebab: M.join('-'), snake: M.join('_'), one: camel(S), One: pascal(S), many: camel(M), Many: pascal(M) };
};

/** Turns the notes example into a new feature (same files, renamed). */
function renameNotes(text, w) {
  return text
    .replaceAll("'/notes", `'/${w.kebab}`)
    .replaceAll('./notes.', `./${w.kebab}.`)
    .replaceAll("pgTable('notes'", `pgTable('${w.snake}'`)
    .replaceAll('Notes', w.Many).replaceAll('notes', w.many)
    .replaceAll('Note', w.One).replaceAll('note', w.one);
}

function addRoute(target, a, name) {
  const d = derive(a);
  if (!d.hasApi) fail('This project has no API. Create one with --web or --api=express|fastify.');
  if (!name || !/^[a-z][a-z0-9-]*$/i.test(name)) fail('Name the feature, like: add route tasks  (letters, numbers, dashes)');
  const w = words(name);
  if (['notes', 'push', 'core', 'system'].includes(w.kebab) || a.routes.includes(w.kebab)) fail(`${w.kebab} already exists.`);
  const db = d.db === 'none' ? 'memory' : d.db;
  const vars = templateVars(a);
  const tpl = (f) => renameNotes(readFileSync(join(TPL, f), 'utf8'), w).replace(/__([A-Z_]+)__/g, (x, k) => vars[k] ?? x);

  writeText(join(target, `packages/shared/src/routes/${w.kebab}.ts`),
    tpl('packages/shared/src/routes/notes.ts').replace(/\/\/ Example feature[\s\S]*?Replace it with your own\.\n/, `// ${w.Many}: edit the schema and endpoints, then the API module in ${d.serverDir}/modules/${w.kebab}.\n`));
  const mod = join(target, d.serverDir, 'modules', w.kebab);
  for (const part of ['routes', 'controller', 'service']) writeText(join(mod, `${w.kebab}.${part}.ts`), tpl(`server/core/modules/notes/notes.${part}.ts`));
  writeText(join(mod, `${w.kebab}.model.ts`), tpl(`server/db/${db}/modules/notes/notes.model.ts`));
  if (db === 'postgres') {
    const table = readFileSync(join(TPL, 'server/db/postgres/db/schema.ts'), 'utf8').match(/export const notes = pgTable\([\s\S]*?\n\}\);\n/)[0];
    const schema = join(target, d.serverDir, 'db/schema.ts');
    writeText(schema, readFileSync(schema, 'utf8').trimEnd() + '\n\n' + renameNotes(table, w));
  }
  a.routes.push(w.kebab);
  writeRouteIndexes(target, a);
  p.log.success([
    `Contract  packages/shared/src/routes/${w.kebab}.ts  (${w.many}List, ${w.many}Create, ${w.many}Delete)`,
    `API       ${d.serverDir}/modules/${w.kebab}/`,
    db === 'postgres' ? 'Database  table added to db/schema.ts: run npm run db:push' : null,
    `App       useApiQuery('${w.many}List', { query: { limit: 20 } })`,
  ].filter(Boolean).join('\n'));
}

function addPushServer(target, a) {
  const d = derive(a);
  const vars = templateVars(a);
  copyTemplate(join(TPL, 'server/push'), join(target, d.serverDir), vars);
  copyTemplate(join(TPL, 'server/push-db', d.db === 'none' ? 'memory' : d.db, 'push.model.ts'), join(target, d.serverDir, 'modules/push/push.model.ts'), vars);
  copyTemplate(join(TPL, 'packages/shared/src/routes/push.ts'), join(target, 'packages/shared/src/routes/push.ts'), vars);
  if (d.db === 'postgres') {
    const schema = join(target, d.serverDir, 'db/schema.ts');
    writeText(schema, readFileSync(schema, 'utf8').trimEnd() + '\n' + vars.PUSH_TABLE);
  }
  writeRouteIndexes(target, a);
  if (d.backend === 'next') {
    copyTemplate(join(TPL, 'server/next-push-card.tsx'), join(target, 'apps/web/src/app/admin/PushCard.tsx'), vars);
    const page = join(target, 'apps/web/src/app/admin/page.tsx');
    const src = readFileSync(page, 'utf8');
    const marker = '      <div className="rounded-2xl border border-border bg-surface p-5">\n        <h2 className="mb-3 font-bold">Scheduled jobs</h2>';
    if (src.includes(marker)) writeText(page, src.replace("import { JOBS } from '@/server/jobs';", "import { JOBS } from '@/server/jobs';\nimport { PushCard } from './PushCard';").replace(marker, `      <PushCard />\n${marker}`));
    else p.log.info('Admin push form: add <PushCard /> (./PushCard) to apps/web/src/app/admin/page.tsx.');
  }
}
