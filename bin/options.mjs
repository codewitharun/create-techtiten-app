// Every option lives here: the prompts, the flags and --help are all built from this list,
// so a new feature only has to be added once. `when` hides an option that doesn't apply.
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { FONTS, THEMES, isHex } from './presets.mjs';
import { cancel, fail, titleCase, VERSION } from './lib.mjs';

const choices = (obj) => Object.entries(obj).map(([value, o]) => ({ value, label: o.label, hint: o.hint }));

export const DBS = {
  none: { label: 'None for now', hint: 'in-memory example data, add a database later' },
  firestore: { label: 'Firestore', hint: 'firebase-admin, no server to run' },
  mongo: { label: 'MongoDB', hint: 'mongoose (Atlas in production)' },
  postgres: { label: 'Postgres', hint: 'Drizzle ORM (Neon / Supabase in production)' },
};

export const OPTIONS = [
  { key: 'name', kind: 'text', flag: '--name=<text>', help: 'App display name (under the icon)', def: (a) => titleCase(a.slug), message: 'App display name' },
  {
    key: 'package', kind: 'text', flag: '--package=<id>', help: 'Android package / iOS bundle id (permanent once on Play)',
    def: (a) => `com.techtiten.${a.slug.replace(/-/g, '')}`, message: 'Android package / iOS bundle id',
    validate: (v) => (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(v ?? '') ? undefined : 'Like com.techtiten.myapp (lowercase, dots)'),
  },
  { key: 'web', kind: 'bool', flag: '--web / --no-web', help: 'Next.js app: website + /admin panel + API under /api', def: () => true, message: 'Add a Next.js app (website + admin panel + API)?' },
  {
    key: 'api', kind: 'select', flag: '--api=<none|express|fastify>', help: 'Without --web: a standalone API in apps/api', def: () => 'none', message: 'Add an API (backend)?',
    when: (a) => !a.web,
    options: [
      { value: 'none', label: 'No API', hint: 'offline / on-device app' },
      { value: 'express', label: 'Express', hint: 'most popular, huge ecosystem' },
      { value: 'fastify', label: 'Fastify', hint: 'faster, built-in schema support' },
    ],
  },
  {
    key: 'db', kind: 'select', flag: '--db=<none|firestore|mongo|postgres>', help: 'Database for the API', def: () => 'none', message: 'Database',
    when: (a) => a.web || (a.api && a.api !== 'none'), options: choices(DBS),
  },
  {
    key: 'nav', kind: 'select', flag: '--nav=<stack|tabs>', help: 'Navigation layout', def: () => 'stack', message: 'Navigation',
    options: [{ value: 'stack', label: 'Stack', hint: 'screens push on top of each other' }, { value: 'tabs', label: 'Tabs', hint: 'bottom tabs on phones, side bar on wide screens' }],
  },
  {
    key: 'state', kind: 'select', flag: '--state=<zustand|redux>', help: 'State + API data layer', def: () => 'zustand', message: 'State management',
    options: [{ value: 'zustand', label: 'Zustand + TanStack Query', hint: 'recommended: tiny stores, best data caching' }, { value: 'redux', label: 'Redux Toolkit + RTK Query', hint: 'one store for everything, Redux DevTools' }],
  },
  { key: 'theme', kind: 'select', flag: '--theme=<preset>', help: 'Color theme preset (light + dark)', def: () => 'techtiten', message: 'Color theme', options: choices(THEMES) },
  {
    key: 'brand', kind: 'text', flag: '--brand=<#RRGGBB>', help: 'Optional: your own brand color instead of the preset\'s', def: () => '', message: 'Custom brand color? (#RRGGBB, empty = use the preset)',
    validate: (v) => (!v || isHex(v) ? undefined : 'Like #00C389, or leave empty'),
  },
  { key: 'font', kind: 'select', flag: '--font=<font>', help: 'App font (phone app and website)', def: () => 'system', message: 'Font', options: choices(FONTS) },
  { key: 'notifications', kind: 'bool', flag: '--notifications', help: 'Daily local reminder + push (push needs an API)', def: () => false, message: 'Notifications (reminders + push)?' },
  { key: 'ads', kind: 'bool', flag: '--ads / --no-ads', help: 'Google AdMob banner (test ads in development)', def: () => false, message: 'Google AdMob ads?' },
];

const TOOL_FLAGS = [
  ['--yes, -y', 'Skip the questions, use defaults (or the flags you pass)'],
  ['--skip-install', 'Only write files, don\'t run npm install'],
  ['--no-git', 'Don\'t run git init / first commit'],
  ['--help, -h', 'Show this help'],
  ['--version, -v', 'Show the version'],
];

export function printHelp() {
  const line = (a, b) => `  ${pc.cyan(a.padEnd(36))} ${b}`;
  console.log(`
${pc.bold('create-techtiten-app')} v${VERSION}
Expo app (phone + web, responsive) with optional Next.js or Express/Fastify API, shared
theme, shared logic and a typed API contract. Always the latest Expo SDK and Next.js.

${pc.bold('Usage')}
  npx create-techtiten-app ${pc.dim('<folder>')} ${pc.dim('[options]')}
  npx create-techtiten-app add ${pc.dim('<what>')} ${pc.dim('[args]')}      ${pc.dim('(inside a project)')}

${pc.bold('Options')}
${OPTIONS.map((o) => line(o.flag, o.help)).join('\n')}

${pc.bold('Choices')}
${line('themes', Object.keys(THEMES).join(', '))}
${line('fonts', Object.keys(FONTS).join(', '))}
${line('databases', Object.keys(DBS).join(', '))}

${pc.bold('Add to an existing project')}
${line('add route <name>', 'New API feature: contract + routes/controller/service/model')}
${line('add notifications', 'Daily reminder + push')}
${line('add ads', 'AdMob banner')}
${line('add theme <preset> [--brand=#hex]', 'Switch the color theme')}
${line('add font <font>', 'Switch the font')}

${pc.bold('Other')}
${TOOL_FLAGS.map(([a, b]) => line(a, b)).join('\n')}

${pc.bold('Examples')}
  npx create-techtiten-app my-app
  npx create-techtiten-app shop --yes --web --db=postgres --theme=sunset --font=poppins --state=redux
  npx create-techtiten-app tracker --yes --no-web --api=fastify --db=mongo --notifications
  npx create-techtiten-app retro-games --yes --no-web --ads --theme=retro --font=pixel --nav=tabs
`);
}

// ---------------------------------------------------------------- args
export function parseArgs(argv) {
  const has = (...names) => names.some((n) => argv.includes(n));
  const val = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const positional = argv.filter((a) => !a.startsWith('-'));
  return { has, val, positional, yes: has('--yes', '-y') };
}

function fromFlags(o, args) {
  if (o.kind === 'bool') return args.has(`--${o.key}`) ? true : args.has(`--no-${o.key}`) ? false : undefined;
  return args.val(o.key);
}

export function checkValue(o, v) {
  if (v === undefined) return;
  if (o.kind === 'select' && !o.options.some((x) => x.value === v)) fail(`--${o.key}=${v} isn't valid. Choose: ${o.options.map((x) => x.value).join(', ')}`);
  const err = o.validate?.(v);
  if (err) fail(`--${o.key}: ${err}`);
}

export async function ask(o, answers, args) {
  const def = o.def(answers);
  if (o.when && !o.when(answers)) return o.kind === 'bool' ? false : 'none';
  const given = fromFlags(o, args);
  checkValue(o, given);
  if (given !== undefined) return given;
  if (args.yes) return def;
  if (o.kind === 'bool') return cancel(await p.confirm({ message: o.message, initialValue: def }));
  if (o.kind === 'select') return cancel(await p.select({ message: o.message, options: o.options, initialValue: def }));
  return cancel(await p.text({ message: o.message, initialValue: def, placeholder: def || undefined, validate: o.validate }));
}
