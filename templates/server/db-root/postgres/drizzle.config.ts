import { defineConfig } from 'drizzle-kit';

try { process.loadEnvFile('__ENV_FILE__'); } catch { /* no env file: use the shell's environment */ }

export default defineConfig({
  dialect: 'postgresql',
  schema: './__SERVER_DIR__/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
