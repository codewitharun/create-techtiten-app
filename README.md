# create-techtiten-app

One command for a new app, with the same structure every time:

```
npx create-techtiten-app my-app
```

![What you get: the starter phone screens, website and admin panel](https://raw.githubusercontent.com/codewitharun/create-techtiten-app/main/docs/screens.png)

```
my-app/
├─ apps/mobile        Expo (latest SDK), Expo Router, TypeScript
├─ apps/web           Next.js (latest): website + /admin panel + /api backend   (optional)
├─ packages/theme     colors, spacing, radius, font sizes, shared by both apps
├─ packages/shared    functions, types, zod schemas, shared by both apps
├─ .github/workflows  Android build → Google Play (only when mobile changes) + web check
└─ AGENTS.md, STATUS.md, .gitignore (secrets blocked)
```

## Options
Run `npx create-techtiten-app --help` any time to see them all. It asks these questions, or you pass them as flags:

| Question | Flag | Choices |
|---|---|---|
| Display name | `--name="My App"` | anything |
| Package id | `--package=com.techtiten.myapp` | permanent once on Play |
| Web app | `--web` / `--no-web` | Next.js: website + `/admin` + `/api` |
| Navigation | `--nav=stack` / `--nav=tabs` | stack, bottom tabs |
| State | `--state=zustand` / `--state=redux` | both with TanStack Query |
| Color theme | `--theme=<preset>` | `techtiten`, `ocean`, `sunset`, `royal`, `mono`, `retro` (green LCD) |
| Brand color | `--brand=#FF3366` | optional, replaces the preset's brand color |
| Font | `--font=<font>` | `system`, `inter`, `poppins`, `space-grotesk`, `pixel` (Press Start 2P) |
| Ads | `--ads` / `--no-ads` | AdMob banner, test ads in development |

Other flags: `--yes` (no questions), `--skip-install`, `--no-git`, `--help`, `--version`.

### Defaults (what you get if you just press Enter, or pass `--yes`)
| Option | Default |
|---|---|
| Display name | folder name in Title Case (`my-app` → `My App`) |
| Package id | `com.techtiten.` + folder name without dashes (`com.techtiten.myapp`) |
| Web app | yes |
| Navigation | stack |
| State | Zustand + TanStack Query |
| Theme | `techtiten` (light + dark, follows the phone's setting) |
| Brand color | from the theme |
| Font | system |
| Ads | no |

### Color themes
![Color theme presets in light and dark](https://raw.githubusercontent.com/codewitharun/create-techtiten-app/main/docs/themes.png)

Your colors end up in `packages/theme/src/colors.ts`: one file, used by the phone app and the website. Change any value there later.

### Fonts
![Font options](https://raw.githubusercontent.com/codewitharun/create-techtiten-app/main/docs/fonts.png)


```
npx create-techtiten-app retro-games --yes --no-web --ads --theme=retro --font=pixel --nav=tabs
npx create-techtiten-app shop --yes --web --theme=sunset --brand=#FF3366 --font=poppins --state=redux
```

Every generated project also has `npm run format` (Prettier), `npm run upgrade:mobile` (latest Expo SDK) and `npm run upgrade:web` (latest Next.js).

## Add an option to this CLI
All options live in one list (`OPTIONS` in `bin/index.mjs`). Theme presets and fonts are in `bin/presets.mjs`. Add an entry and it appears in the questions, the flags and `--help`.

## Always the latest
- The base apps come from `create-expo-app@latest` and `create-next-app@latest`, so a new project starts on the newest Expo SDK and Next.js.
- Native packages are added with `npx expo install`, which picks the versions that match that SDK. Nothing is pinned in this package.
- No `android/` or `ios/` folders are stored: they are generated at build time (`expo prebuild`), so the native side always matches the SDK.
- The Expo template's own `app.json` values (icons, splash, defaults) are kept in `apps/mobile/config/base.json`; your settings go on top in `app.config.ts`.
- One React version for the whole repo (web is pinned to the version Expo installed), so hooks never break.

## What you get
**Mobile:** Reanimated 4 + Worklets + Gesture Handler (SDK-matched, root view already wrapped), theme provider (system/light/dark, saved), UI primitives (Screen, Card, Text, Button with haptics), state demo, API client + TanStack Query hook, release signing plugin (CI secrets or `credentials/signing.properties`), optional AdMob banner.

**Web:** landing page using the same theme colors, `/admin` dashboard behind `ADMIN_USER`/`ADMIN_PASSWORD` (`src/proxy.ts`), `GET /api/health` (shared zod schema), `POST /api/cron/[job]` protected by `CRON_API_KEY` for outside schedulers (Vercel functions are short-lived).

**CI:** `android.yml` builds a signed AAB and uploads to Play (internal track by default). Secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_SERVICE_ACCOUNT_JSON`.

## Develop this package
```
npm install
node bin/index.mjs test-app --yes        # try it
npm publish                              # first time: npm login
```
