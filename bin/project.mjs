// Everything that turns answers into files. Used by `create` and by `add` (which re-runs parts of it).
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { FONTS, THEMES, buildColors } from './presets.mjs';
import { copyTemplate, readJson, secret, TPL, VERSION, writeJson, writeText } from './lib.mjs';

/** Paths and names that follow from the answers. */
export function derive(a) {
  const backend = a.web ? 'next' : a.api && a.api !== 'none' ? a.api : 'none';
  const hasApi = backend !== 'none';
  const scope = `@${a.slug}`;
  const next = backend === 'next';
  return {
    backend,
    hasApi,
    scope,
    db: hasApi ? a.db || 'none' : 'none',
    backendDir: next ? 'apps/web' : 'apps/api',
    serverDir: next ? 'apps/web/src/server' : 'apps/api/src',
    backendWs: `${scope}/${next ? 'web' : 'api'}`,
    envFile: next ? '.env.local' : '.env',
    apiDomain: next ? `${a.slug}.techtiten.com` : hasApi ? `api.${a.slug}.techtiten.com` : '',
  };
}

export const loadProject = (target) => readJson(join(target, 'techtiten.json'));
export function saveProject(target, a) {
  const d = derive(a);
  const keys = ['name', 'package', 'web', 'api', 'db', 'nav', 'state', 'theme', 'brand', 'font', 'notifications', 'ads', 'routes'];
  writeJson(join(target, 'techtiten.json'), {
    $comment: 'Written by create-techtiten-app. `npx create-techtiten-app add ...` reads it. Keep it in git.',
    createdWith: VERSION, slug: a.slug, scope: d.scope, backend: d.backend,
    ...Object.fromEntries(keys.map((k) => [k, a[k]])),
  });
}

export function templateVars(a) {
  const d = derive(a);
  const today = new Date().toISOString().slice(0, 10);
  return {
    APP_SLUG: a.slug, APP_NAME: a.name, PACKAGE_ID: a.package, SCOPE: d.scope, STATE: a.state,
    YEAR: String(new Date().getFullYear()), TODAY: today, THEME_LABEL: THEMES[a.theme].label,
    API_DOMAIN: d.apiDomain, BACKEND: d.backend, DB_ENV: DB_ENV[d.db],
    ENV_FILE: d.envFile, SERVER_DIR: d.serverDir.replace(`${d.backendDir}/`, ''),
    PUSH_TABLE: a.notifications ? PUSH_TABLE : '',
    PUSH_IMPORT: a.notifications && d.backend === 'next' ? "import { PushCard } from './PushCard';\n" : '',
    PUSH_CARD: a.notifications && d.backend === 'next' ? '      <PushCard />' : '',
  };
}

// ---------------------------------------------------------------- database
const DB_ENV = {
  none: '',
  firestore: "  /** Service-account JSON on one line. Not needed on Google Cloud. Never commit the file. */\n  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),\n",
  mongo: "  /** mongodb://127.0.0.1:27017/<name> locally, Atlas connection string in production. */\n  MONGODB_URI: z.string().optional(),\n",
  postgres: "  /** postgres://... (local Docker, Neon, Supabase). */\n  DATABASE_URL: z.string().optional(),\n",
};

const PUSH_TABLE = `
export const pushTokens = pgTable('push_tokens', {
  token: text('token').primaryKey(),
  platform: text('platform').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});
`;

export const DB_PACKAGES = {
  none: { deps: [], dev: [] },
  firestore: { deps: ['firebase-admin'], dev: [] },
  mongo: { deps: ['mongoose'], dev: [] },
  postgres: { deps: ['drizzle-orm', 'postgres'], dev: ['drizzle-kit'] },
};

/** Local defaults for the dev env file (git-ignored). */
function dbEnvLines(db, slug) {
  if (db === 'mongo') return [`MONGODB_URI=mongodb://127.0.0.1:27017/${slug}`];
  if (db === 'postgres') return [`DATABASE_URL=postgres://postgres@localhost:5432/${slug.replace(/-/g, '_')}`];
  if (db === 'firestore') return ['# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  (one line; or run `gcloud auth application-default login`)'];
  return [];
}

/** Writes apps/api/.env or apps/web/.env.local with random secrets. Git-ignored; never overwritten. */
export function writeDevEnv(target, a) {
  const d = derive(a);
  if (!d.hasApi) return;
  const f = join(target, d.backendDir, d.envFile);
  if (existsSync(f)) return;
  writeText(f, [
    '# Local development only (git-ignored). Set the same names in Vercel for production, with NEW values.',
    `ADMIN_TOKEN=${secret()}`,
    `CRON_API_KEY=${secret()}`,
    'MIN_APP_VERSION=0.0.0',
    'LATEST_APP_VERSION=1.0.0',
    ...dbEnvLines(d.db, a.slug),
    '',
  ].join('\n'));
}

export function writeDockerCompose(target, a) {
  const d = derive(a);
  const name = a.slug.replace(/-/g, '_');
  const svc = d.db === 'mongo'
    ? `  mongo:\n    image: mongo:8\n    ports: ["127.0.0.1:27017:27017"]\n    volumes: [mongo:/data/db]\nvolumes:\n  mongo:\n`
    : d.db === 'postgres'
      ? `  postgres:\n    image: postgres:17\n    environment:\n      POSTGRES_HOST_AUTH_METHOD: trust # local only: no password, port bound to this computer\n      POSTGRES_DB: ${name}\n    ports: ["127.0.0.1:5432:5432"]\n    volumes: [pg:/var/lib/postgresql/data]\nvolumes:\n  pg:\n`
      : null;
  if (svc) writeText(join(target, 'docker-compose.yml'), `# Local database for development only (docker compose up -d). Reachable from this computer only.\nservices:\n${svc}`);
}

// ---------------------------------------------------------------- server code
/** Copies the server core + database + optional push module into the backend. */
export function writeServer(target, a) {
  const d = derive(a);
  if (!d.hasApi) return;
  const vars = templateVars(a);
  const dir = join(target, d.serverDir);
  copyTemplate(join(TPL, 'server/core'), dir, vars);
  copyTemplate(join(TPL, 'server/db', d.db === 'none' ? 'memory' : d.db), dir, vars);
  copyTemplate(join(TPL, 'server/db-root', d.db), join(target, d.backendDir), vars);
  if (a.notifications) {
    copyTemplate(join(TPL, 'server/push'), dir, vars);
    copyTemplate(join(TPL, 'server/push-db', d.db === 'none' ? 'memory' : d.db, 'push.model.ts'), join(dir, 'modules/push/push.model.ts'), vars);
  }
  if (d.backend === 'next') {
    copyTemplate(join(TPL, 'server/next'), join(target, 'apps/web'), vars);
    if (a.notifications) copyTemplate(join(TPL, 'server/next-push-card.tsx'), join(target, 'apps/web/src/app/admin/PushCard.tsx'), vars);
  } else {
    copyTemplate(join(TPL, 'server', d.backend), join(target, 'apps/api'), vars);
    copyTemplate(join(TPL, 'server/api-root'), join(target, 'apps/api'), vars);
  }
  writeRouteIndexes(target, a);
}

/** Route groups in this project (core is always there). */
export const routeGroups = (a) => {
  const d = derive(a);
  if (!d.hasApi) return [];
  return [...new Set(['notes', ...(a.notifications ? ['push'] : []), ...(a.routes ?? [])])];
};

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** packages/shared/src/routes/index.ts and the server's routes.ts, from the route groups. */
export function writeRouteIndexes(target, a) {
  const d = derive(a);
  const groups = routeGroups(a);
  writeText(join(target, 'packages/shared/src/routes/index.ts'), [
    '// Written by create-techtiten-app (regenerated by `add route`): every route group in this app.',
    "import { coreRoutes } from './core';",
    ...groups.map((g) => `import { ${camel(g)}Routes } from './${g}';`),
    '',
    `export const contract = { ...coreRoutes${groups.map((g) => `, ...${camel(g)}Routes`).join('')} };`,
    'export type ApiContract = typeof contract;',
    "export * from './core';",
    ...groups.map((g) => `export * from './${g}';`),
    '',
  ].join('\n'));
  // Shared route files not used by this project would only add dead endpoints: remove them.
  for (const g of ['notes', 'push']) if (!groups.includes(g)) rmSync(join(target, `packages/shared/src/routes/${g}.ts`), { force: true });
  if (!d.hasApi) return;
  writeText(join(target, d.serverDir, 'routes.ts'), [
    '// Written by create-techtiten-app (regenerated by `add route`): every route the API serves.',
    "import type { Route } from './lib/route';",
    "import { systemRoutes } from './modules/system/system.routes';",
    ...groups.map((g) => `import { ${camel(g)}Routes } from './modules/${g}/${g}.routes';`),
    '',
    `export const routes: Route[] = [...systemRoutes${groups.map((g) => `, ...${camel(g)}Routes`).join('')}];`,
    '',
  ].join('\n'));
}

// ---------------------------------------------------------------- mobile features
/** Copies the on/off variant of each optional mobile feature. */
export function writeMobileFeatures(target, a) {
  const d = derive(a);
  const m = join(target, 'apps/mobile');
  const vars = templateVars(a);
  const feat = (name) => copyTemplate(join(TPL, 'mobile/feat', name), m, vars);
  feat(d.hasApi ? 'backend' : 'nobackend');
  feat(a.ads ? 'ads' : 'noads');
  if (a.notifications) { feat('notifications'); if (d.hasApi) feat('notifications-backend'); }
  else feat('nonotifications');
}

export function mobileExpoPackages(a) {
  const pkgs = ['expo-router', 'expo-linking', 'expo-constants', 'expo-status-bar', 'expo-haptics', 'expo-system-ui', 'expo-font', 'expo-store-review', '@expo/vector-icons',
    'react-native-safe-area-context', 'react-native-screens', 'react-native-reanimated', 'react-native-worklets', 'react-native-gesture-handler',
    '@react-native-async-storage/async-storage', 'react-dom', 'react-native-web'];
  if (a.ads) pkgs.push('react-native-google-mobile-ads');
  if (a.notifications) pkgs.push('expo-notifications');
  if (FONTS[a.font].pkg) pkgs.push(FONTS[a.font].pkg);
  return pkgs;
}

export const statePackages = (state) => (state === 'redux' ? ['@reduxjs/toolkit', 'react-redux'] : ['zustand', '@tanstack/react-query']);

export const pluginList = (a, added = []) => [...new Set(['expo-router', ...added, ...(a.ads ? ['react-native-google-mobile-ads'] : []), ...(a.notifications ? ['expo-notifications'] : []), './plugins/withSigning.js'])];

// ---------------------------------------------------------------- theme + fonts
export function writeThemeAndFonts(target, a) {
  const colors = buildColors(a.theme, a.brand);
  writeText(join(target, 'packages/theme/src/colors.ts'),
    `// ${THEMES[a.theme].label} preset${a.brand ? `, brand ${a.brand}` : ''} (create-techtiten-app). Edit freely.\nexport const colors = ${JSON.stringify(colors, null, 2)} as const;\n`);

  const f = FONTS[a.font];
  const m = join(target, 'apps/mobile/src/theme/fonts.ts');
  if (!f.pkg) {
    writeText(m, `// System font (San Francisco / Roboto): nothing to load.\nexport const fonts: Record<'regular' | 'medium' | 'bold' | 'black', string | undefined> = { regular: undefined, medium: undefined, bold: undefined, black: undefined };\nexport const useAppFonts = () => true;\n/** Multiplies every font size (wide fonts like pixel ones need smaller text). */\nexport const fontScale = 1;\n`);
  } else {
    const names = [...new Set(Object.values(f.weights))];
    writeText(m, `// ${f.label} from ${f.pkg}. Text/Button pick the family per weight.\nimport { useFonts, ${names.join(', ')} } from '${f.pkg}';\n\nexport const fonts: Record<'regular' | 'medium' | 'bold' | 'black', string | undefined> = ${JSON.stringify(f.weights)};\n\n/** true once the font files are loaded (the root layout waits for it). */\nexport function useAppFonts() {\n  const [loaded, error] = useFonts({ ${names.join(', ')} });\n  return loaded || !!error;\n}\n\n/** Multiplies every font size (wide fonts like pixel ones need smaller text). */\nexport const fontScale = ${f.scale ?? 1};\n`);
  }
  if (a.web) {
    const w = join(target, 'apps/web/src/app/fonts.ts');
    if (!f.next) writeText(w, `// System font.\nexport const appFontClass = '';\n`);
    else {
      const opts = { subsets: ['latin'], variable: '--font-app', display: 'swap', ...(f.nextWeights ? { weight: f.nextWeights } : {}) };
      // next/font reads these options at build time and needs a plain object literal (unquoted keys).
      const literal = '{ ' + Object.entries(opts).map(([k, v]) => `${k}: ${JSON.stringify(v).replace(/"/g, "'")}`).join(', ') + ' }';
      writeText(w, `// ${f.label} via next/font (self-hosted at build time, no layout shift).\nimport { ${f.next} } from 'next/font/google';\n\nconst font = ${f.next}(${literal});\nexport const appFontClass = font.variable;\n`);
    }
  }
}

// ---------------------------------------------------------------- root scripts + README
export function writeRootScripts(target, a) {
  const d = derive(a);
  const pkg = readJson(join(target, 'package.json'));
  const s = {
    dev: d.hasApi ? 'node scripts/dev.mjs' : `npm run start -w ${d.scope}/mobile`,
    mobile: `npm run start -w ${d.scope}/mobile`,
    android: `npm run android -w ${d.scope}/mobile`,
    ...(a.web ? { web: `npm run dev -w ${d.scope}/web`, 'build:web': `npm run build -w ${d.scope}/web` } : {}),
    ...(d.backend === 'express' || d.backend === 'fastify' ? { api: `npm run dev -w ${d.scope}/api` } : {}),
    ...(d.db === 'postgres' ? { 'db:push': `npm run db:push -w ${d.backendWs}`, 'db:studio': `npm run db:studio -w ${d.backendWs}` } : {}),
    ...(d.db === 'mongo' || d.db === 'postgres' ? { 'db:up': 'docker compose up -d' } : {}),
    typecheck: 'npm run typecheck --workspaces --if-present',
    test: 'npm run test --workspaces --if-present',
    format: 'prettier --write .',
    'upgrade:mobile': 'cd apps/mobile && npx expo install expo@latest && npx expo install --fix',
    ...(a.web ? { 'upgrade:web': `npm install next@latest eslint-config-next@latest -w ${d.scope}/web` } : {}),
  };
  pkg.scripts = s;
  writeJson(join(target, 'package.json'), pkg);
  if (!d.hasApi) rmSync(join(target, 'scripts/dev.mjs'), { force: true });
}

export function writeReadme(target, a) {
  const d = derive(a);
  const api = d.backend === 'next' ? 'http://localhost:3000/api' : 'http://localhost:4000';
  const rows = [
    ['apps/mobile', `Expo app: Android, iOS and web (responsive). Expo Router (${a.nav}), ${a.state === 'redux' ? 'Redux Toolkit + RTK Query' : 'Zustand + TanStack Query'}`],
    ...(a.web ? [['apps/web', 'Next.js: website, /admin panel, /legal pages' + (d.backend === 'next' ? ', the API under /api (src/server)' : '')]] : []),
    ...(d.backend === 'express' || d.backend === 'fastify' ? [['apps/api', `${d.backend === 'express' ? 'Express' : 'Fastify'} API (src/modules/<feature>)`]] : []),
    ['packages/config', 'Name, package id, domains, ports, deep links, CORS: one place for everything'],
    ['packages/theme', 'Colors, spacing, radius, font sizes'],
    ['packages/shared', 'Functions, zod schemas, the API contract (src/routes), legal page text'],
  ];
  const lines = [
    `# ${a.name}`, '', 'Made with [`create-techtiten-app`](https://www.npmjs.com/package/create-techtiten-app).', '',
    '| Folder | What |', '|---|---|', ...rows.map(([f, w]) => `| \`${f}\` | ${w} |`), '',
    '## Run', '```',
    'npm install',
    ...(d.db === 'mongo' || d.db === 'postgres' ? ['npm run db:up       # local database (Docker)'] : []),
    ...(d.db === 'postgres' ? ['npm run db:push     # create the tables'] : []),
    d.hasApi ? 'npm run dev         # API + Expo together (press a for Android, w for web)' : 'npm run dev         # Expo (press a for Android, w for web)',
    ...(a.web ? ['npm run web         # Next.js on http://localhost:3000'] : []),
    'npm run typecheck   # every workspace',
    'npm test            # shared tests',
    '```',
  ];
  if (d.hasApi) lines.push('',
    '## API', `- Docs with "Try it" for every route: **${api}/docs** (open in development; in production log in with password = \`ADMIN_TOKEN\`, or set \`DOCS_PUBLIC=true\`).`,
    '- Add a feature: `npx create-techtiten-app add route <name>` (contract in `packages/shared/src/routes`, code in `' + d.serverDir + '/modules/<name>`).',
    '- Structure per feature: `*.routes.ts` (URL -> controller), `*.controller.ts` (input -> service), `*.service.ts` (rules), `*.model.ts` (database).',
    `- The phone finds the API by itself in development (same Wi-Fi). Override with \`EXPO_PUBLIC_API_URL\` in \`apps/mobile/.env\`.`,
    `- Secrets live in \`${d.backendDir}/${d.envFile}\` (created for you, git-ignored). In production set the same names on Vercel with new values.`,
    '', '### Deploy', d.backend === 'next'
      ? '- Vercel: import the repo, Root Directory `apps/web`. Add the env vars. Done.'
      : '- Vercel: import the repo, Root Directory `apps/api` (vercel.json is ready). Or any Node host: `npm start -w ' + d.scope + '/api`.',
    '- Scheduled jobs: an outside timer (cron-job.org / GitHub Actions) calls `POST /cron/<job>` with header `x-cron-key`.',
  );
  lines.push('',
    '## Play Store pages', a.web ? '- Privacy, terms, delete-account and support pages: `/legal/privacy`, `/legal/terms`, `/legal/delete-account`, `/legal/support` on the website, and in the app under Settings.' : '- Privacy, terms, delete-account and support are in the app under Settings (`/legal/<page>`). Host them on a website for the Play Console links.',
    '- Text is in `packages/shared/src/legal.ts`. Read it and fix what your app really collects.',
    '', '## Add a package',
    '- Native/Expo package: `cd apps/mobile && npx expo install <pkg>` (SDK-matched version)',
    `- Anything else: \`npm install <pkg> -w ${d.scope}/mobile\``,
    '', '## Upgrade later', '```', 'npm run upgrade:mobile   # latest Expo SDK', ...(a.web ? ['npm run upgrade:web      # latest Next.js'] : []), 'npm run typecheck', '```',
    'Read the Expo SDK and Next.js release notes first: big versions can need small code changes.', '');
  writeText(join(target, 'README.md'), lines.join('\n'));
}

export const readText = (f) => readFileSync(f, 'utf8');
