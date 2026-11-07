// Postgres through Drizzle ORM + postgres.js. DATABASE_URL: local `postgres://postgres@localhost:5432/<name>`
// (docker compose up -d) or Neon / Supabase / any Postgres in production.
// Tables live in src/db/schema.ts; `npm run db:push` creates/updates them.
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { AppError } from '__SCOPE__/shared';
import { env } from '../config/env';
import * as schema from '../db/schema';

let cached: PostgresJsDatabase<typeof schema> | undefined;

export function db() {
  if (cached) return cached;
  if (!env.DATABASE_URL) throw new AppError('INTERNAL', 'DATABASE_URL is not set');
  // prepare: false keeps it working behind poolers (Neon, Supabase, PgBouncer).
  cached = drizzle(postgres(env.DATABASE_URL, { max: 5, prepare: false }), { schema });
  return cached;
}
export { schema };
