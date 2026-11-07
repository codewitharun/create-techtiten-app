// Local / long-running server: `npm run dev` (watch) or `npm start` after `npm run build`.
import { app as cfg } from '__SCOPE__/config';
import { createApp } from './app';
import { env } from './config/env';
import { log } from './lib/log';

async function main() {
  const port = env.PORT ?? cfg.ports.api;
  const app = await createApp();
  await app.listen({ port, host: '0.0.0.0' });
  log.info(`${cfg.name} API on http://localhost:${port}  (docs: http://localhost:${port}/docs)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
