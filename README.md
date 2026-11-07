# create-techtiten-app

One command for a new app, with the same structure every time:

```
npx create-techtiten-app my-app
```

```
my-app/
├─ apps/mobile        Expo (latest SDK), Expo Router, TypeScript
├─ apps/web           Next.js (latest): website + /admin panel + /api backend   (optional)
├─ packages/theme     colors, spacing, radius, font sizes, shared by both apps
├─ packages/shared    functions, types, zod schemas, shared by both apps
├─ .github/workflows  Android build → Google Play (only when mobile changes) + web check
└─ AGENTS.md, STATUS.md, .gitignore (secrets blocked)
```

## It asks
| Question | Options |
|---|---|
| Display name, package id | e.g. `Retro Games`, `com.techtiten.retrogames` |
| Web | Next.js app for website + admin (basic auth) + API (health, cron jobs) |
| State | Zustand + TanStack Query (default) or Redux Toolkit + TanStack Query |
| Ads | AdMob banner (test ads in dev) |

Skip the questions: `npx create-techtiten-app my-app --yes --web --state=zustand --ads --name="My App" --package=com.techtiten.myapp`
Other flags: `--no-web`, `--no-ads`, `--skip-install`, `--no-git`.

## Always the latest
- The base apps come from `create-expo-app@latest` and `create-next-app@latest`, so a new project starts on the newest Expo SDK and Next.js.
- Native packages are added with `npx expo install`, which picks the versions that match that SDK. Nothing is pinned in this package.
- No `android/` or `ios/` folders are stored: they are generated at build time (`expo prebuild`), so the native side always matches the SDK.
- The Expo template's own `app.json` values (icons, splash, defaults) are kept in `apps/mobile/config/base.json`; your settings go on top in `app.config.ts`.
- One React version for the whole repo (web is pinned to the version Expo installed), so hooks never break.

## What you get
**Mobile:** theme provider (system/light/dark, saved), UI primitives (Screen, Card, Text, Button with haptics), state demo, API client + TanStack Query hook, release signing plugin (CI secrets or `credentials/signing.properties`), optional AdMob banner.

**Web:** landing page using the same theme colors, `/admin` dashboard behind `ADMIN_USER`/`ADMIN_PASSWORD` (`src/proxy.ts`), `GET /api/health` (shared zod schema), `POST /api/cron/[job]` protected by `CRON_API_KEY` for outside schedulers (Vercel functions are short-lived).

**CI:** `android.yml` builds a signed AAB and uploads to Play (internal track by default). Secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, `ANDROID_SERVICE_ACCOUNT_JSON`.

## Develop this package
```
npm install
node bin/index.mjs test-app --yes        # try it
npm publish                              # first time: npm login
```
