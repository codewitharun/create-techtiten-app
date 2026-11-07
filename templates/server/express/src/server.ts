// Local / long-running server: `npm run dev` (watch) or `npm start` after `npm run build`.
import { app as cfg } from '__SCOPE__/config';
import { createApp } from './app';
import { env } from './config/env';
import { log } from './lib/log';

const port = env.PORT ?? cfg.ports.api;
createApp().listen(port, '0.0.0.0', () => log.info(`${cfg.name} API on http://localhost:${port}  (docs: http://localhost:${port}/docs)`));
