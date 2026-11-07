// Environment variables, checked once at startup. A missing required value fails fast with a
// clear message instead of breaking later. Local: put them in .env (see README "Environment").
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().optional(),
  /** Bearer token for admin routes (/admin/*) and the docs page in production. */
  ADMIN_TOKEN: z.string().min(16, 'ADMIN_TOKEN: use at least 16 characters').optional(),
  /** Sent as `x-cron-key` by your outside scheduler (cron-job.org, GitHub Actions). */
  CRON_API_KEY: z.string().min(16, 'CRON_API_KEY: use at least 16 characters').optional(),
  /** Force update: app versions below this see the "Update needed" screen. */
  MIN_APP_VERSION: z.string().default('0.0.0'),
  LATEST_APP_VERSION: z.string().default('1.0.0'),
  /** Docs (/docs) are open in development; in production set DOCS_PUBLIC=true or log in with ADMIN_TOKEN. */
  DOCS_PUBLIC: z.enum(['true', 'false']).default('false'),
__DB_ENV__});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:\n' + parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'));
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export const isDev = env.NODE_ENV !== 'production';
