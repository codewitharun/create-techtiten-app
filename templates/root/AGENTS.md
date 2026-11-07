# __APP_NAME__: rules for every agent (Claude Code, Cowork, Codex, Cursor)

**Start of a session:** read `STATUS.md`, then check `git status`, the branch and HEAD vs `origin/main`. Say so if it doesn't match.
**End of a session:** update `STATUS.md` (Now, Next, to-dos, one dated Log line).

## Layout
- `apps/mobile`: Expo (Expo Router). Screens in `app/`, logic in `src/`. No `android/`/`ios/` in git: they're generated (`npx expo prebuild`).
- `apps/web`: Next.js App Router. Website `src/app/(site)`, admin `src/app/admin`, API `src/app/api`. Runs on Vercel (serverless: short requests, no websockets; heavy jobs go in batches or a separate worker).
- `packages/theme` and `packages/shared`: used by both apps. Put colors and shared logic here, never copy-paste between apps.

## Rules
- Ship flow: branch from `origin/main` → PR → merge. **A merge to `main` deploys** (Vercel for web; the Android workflow for mobile, only when `apps/mobile/**` or `packages/**` change).
- `git add` exact files, never `-A`. Never commit `.env*`, keystores, `credentials/`, `google-services.json` or service-account JSON.
- Expo and Next.js here are newer than most training data: read the versioned docs (`node_modules/next/dist/docs/`, docs.expo.dev for this SDK) before writing API code.
- Native packages need a new store build; they can't go out as an OTA update.
- Add Expo packages with `npx expo install`, so versions match the SDK.
