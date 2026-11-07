#!/usr/bin/env node
// create-techtiten-app: scaffolds an npm-workspaces monorepo
//   apps/mobile       Expo (latest SDK, Expo Router): Android, iOS and responsive web   always
//   apps/web          Next.js (latest): website + /admin + API under /api               --web
//   apps/api          Express or Fastify API                                            --api (without --web)
//   packages/config   name, ids, domains, ports, deep links, CORS                       shared
//   packages/theme    colors (preset), spacing, radius, fonts                           shared
//   packages/shared   functions, zod schemas, typed API contract, legal pages           shared
// Latest versions every time: the base apps come from create-expo-app / create-next-app,
// and native-aware packages are added with `npx expo install` (SDK-matched). Nothing native
// is committed: android/ and ios/ are generated at build time (CNG).
import { add } from './add.mjs';
import { create } from './create.mjs';
import { fail, VERSION } from './lib.mjs';
import { parseArgs, printHelp } from './options.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.has('--help', '-h')) printHelp();
else if (args.has('--version', '-v')) console.log(VERSION);
else (args.positional[0] === 'add' ? add(args) : create(args)).catch((e) => fail(e.message));
