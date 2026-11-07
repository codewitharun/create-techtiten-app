// One config for the whole repo, kept in app.json (plain JSON so Expo's app.config.ts can read it too).
// The phone app (name, package id, scheme, deep links), the API (CORS, port) and the website all
// read it, so nothing is typed twice. Put your real domains in app.json once you have them.
import data from './app.json';

export type Backend = 'next' | 'express' | 'fastify' | 'none';
export type AppConfig = {
  name: string;
  slug: string;
  packageId: string;
  /** Deep link scheme: <scheme>://path */
  scheme: string;
  /** Production domains. `web` also hosts https deep links (/.well-known files). */
  domains: { web: string; api: string };
  /** Local development ports. */
  ports: { api: number; web: number; expo: number };
  /** Where the API lives: 'next' (apps/web, under /api), 'express' / 'fastify' (apps/api), or 'none'. */
  backend: Backend;
  support: { email: string; company: string };
  /** Play Store link, used by the force-update screen and the rate prompt. */
  storeUrl: string;
};

export const app = data as AppConfig;

/** Path prefix of API routes: Next.js serves them under /api, apps/api at the root. */
export const apiPrefix = app.backend === 'next' ? '/api' : '';

/** Origins allowed to call the API from a browser (CORS). Phones don't send an Origin. */
export function allowedOrigins(dev: boolean): string[] {
  const prod = [`https://${app.domains.web}`, `https://www.${app.domains.web}`];
  if (!dev) return prod;
  return [
    ...prod,
    ...[app.ports.web, app.ports.expo].flatMap((p) => [`http://localhost:${p}`, `http://127.0.0.1:${p}`]),
  ];
}
