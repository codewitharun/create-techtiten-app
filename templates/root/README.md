# __APP_NAME__

Made with `create-techtiten-app`.

| Folder | What |
|---|---|
| `apps/mobile` | Expo app (Android/iOS), Expo Router, __STATE__ |
| `apps/web` | Next.js: website, `/admin` panel, `/api` backend (if enabled) |
| `packages/theme` | Colors, spacing, radius, font sizes: one source for both apps |
| `packages/shared` | Functions, types and zod schemas used by both apps |

## Run
```
npm install
npm run mobile     # Expo (press a for Android)
npm run web        # Next.js on http://localhost:3000
npm run typecheck  # every workspace
```

## Add a package
- Native/Expo package: `cd apps/mobile && npx expo install <pkg>` (picks the SDK-matched version)
- Anything else: `npm install <pkg> -w __SCOPE__/mobile` (or `__SCOPE__/web`, `__SCOPE__/shared`)
