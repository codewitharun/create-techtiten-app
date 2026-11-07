import { timingSafeEqual } from 'node:crypto';
import { AppError, type Endpoint } from '__SCOPE__/shared';
import { env } from '../config/env';

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Checks the endpoint's `auth` rule: 'admin' = Authorization: Bearer ADMIN_TOKEN, 'cron' = x-cron-key: CRON_API_KEY. */
export function checkAuth(e: Endpoint, header: (name: string) => string | undefined) {
  if (!e.auth || e.auth === 'public') return;
  const secret = e.auth === 'admin' ? env.ADMIN_TOKEN : env.CRON_API_KEY;
  if (!secret) throw new AppError('FORBIDDEN', `${e.auth === 'admin' ? 'ADMIN_TOKEN' : 'CRON_API_KEY'} is not set on the server`);
  const given = e.auth === 'admin' ? header('authorization')?.replace(/^Bearer\s+/i, '') : header('x-cron-key');
  if (!given || !same(given, secret)) throw new AppError('UNAUTHORIZED', 'Not allowed');
}

/** Basic-auth check for the docs page in production (any user name, password = ADMIN_TOKEN). */
export function docsAllowed(authorization: string | undefined, dev: boolean): boolean {
  if (dev || env.DOCS_PUBLIC === 'true') return true;
  if (!env.ADMIN_TOKEN || !authorization?.startsWith('Basic ')) return false;
  const pass = Buffer.from(authorization.slice(6), 'base64').toString().split(':').slice(1).join(':');
  return same(pass, env.ADMIN_TOKEN);
}
