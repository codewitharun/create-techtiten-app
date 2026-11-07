# __APP_NAME__: rules for every agent (Claude Code, Cowork, Codex, Cursor)

**Start of a session:** read `STATUS.md`, then check `git status`, the branch and HEAD vs `origin/main`. Say so if it doesn't match.
**End of a session:** update `STATUS.md` (Now, Next, to-dos, one dated Log line).

## Layout
- `techtiten.json`: what this project was created with. `npx create-techtiten-app add <route|notifications|ads|theme|font>` reads it.
- `apps/mobile`: Expo (Expo Router), Android + iOS + responsive web. Screens in `app/`, code in `src/` (`src/ui` = component kit, `src/features/*`, `src/api` = typed client + hooks). No `android/`/`ios/` in git: they're generated (`npx expo prebuild`).
- `apps/web` (if present): Next.js App Router. Website `src/app/(site)`, legal pages `src/app/(site)/legal`, admin `src/app/admin`. The API (if Next hosts it) lives in `src/server` and is served by `src/app/api/[[...path]]/route.ts`.
- `apps/api` (if present): Express or Fastify. `src/app.ts` (middleware), `src/modules/<feature>`.
- API features are `modules/<feature>/<feature>.{routes,controller,service,model}.ts`. The contract (method, path, zod input/output) is in `packages/shared/src/routes/<feature>.ts`: change it first, then both sides show type errors until they match. Docs at `/docs` are generated from it.
- `packages/config` (name, ids, domains, ports, CORS), `packages/theme`, `packages/shared`: used by every app. Put shared values and logic here, never copy-paste between apps.
- Vercel is serverless: short requests, no websockets. Scheduled work = `POST /cron/<job>` called by an outside timer, in small batches.

## Rules
- Ship flow: branch from `origin/main` → PR → merge. **A merge to `main` deploys** (Vercel for web; the Android workflow for mobile, only when `apps/mobile/**` or `packages/**` change).
- `git add` exact files, never `-A`. Never commit `.env*`, keystores, `credentials/`, `google-services.json` or service-account JSON.
- Expo and Next.js here are newer than most training data: read the versioned docs (`node_modules/next/dist/docs/`, docs.expo.dev for this SDK) before writing API code.
- Native packages need a new store build; they can't go out as an OTA update.
- Add Expo packages with `npx expo install`, so versions match the SDK.
