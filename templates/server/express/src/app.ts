// Express app: security middleware, CORS, rate limit, docs, then every route from src/routes.ts.
// Routes don't touch req/res: the loop below validates input (zod contract), checks auth and sends JSON.
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { allowedOrigins, app as cfg } from '__SCOPE__/config';
import { AppError, docsHtml, parseInput } from '__SCOPE__/shared';
import { isDev } from './config/env';
import { openApiSpec } from './docs/openapi';
import { checkAuth, docsAllowed } from './lib/auth';
import { DOCS_CSP, DOCS_LOGIN_HEADERS } from './lib/docs';
import { toErrorResponse } from './lib/errors';
import { routes } from './routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const id = req.header('x-request-id') ?? randomUUID();
    res.locals.requestId = id;
    res.setHeader('x-request-id', id);
    next();
  });
  app.use(helmet());
  app.use(cors({ origin: isDev ? true : allowedOrigins(false) }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => { res.status(429).json(new AppError('RATE_LIMITED', 'Too many requests, slow down').toJSON()); },
  }));

  app.get('/', (_req, res) => { res.json({ name: `${cfg.name} API`, docs: '/docs', health: '/health' }); });

  // API docs: open in development; in production DOCS_PUBLIC=true or log in (password = ADMIN_TOKEN).
  app.get(['/docs', '/openapi.json'], (req, res) => {
    if (!docsAllowed(req.header('authorization'), isDev)) { res.status(401).set(DOCS_LOGIN_HEADERS).send('Login required'); return; }
    if (req.path === '/openapi.json') { res.json(openApiSpec(`${req.protocol}://${req.get('host')}`)); return; }
    res.set('Content-Security-Policy', DOCS_CSP).type('html').send(docsHtml(cfg.name, '/openapi.json'));
  });

  for (const r of routes) {
    const method = r.endpoint.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    app[method](r.endpoint.path, async (req, res) => {
      checkAuth(r.endpoint, (name) => req.header(name));
      const input = parseInput(r.endpoint, { params: req.params, query: req.query, body: req.body });
      res.json(await r.handler(input, { requestId: res.locals.requestId, ip: req.ip }));
    });
  }

  app.use((req, _res, next) => next(new AppError('NOT_FOUND', `No route for ${req.method} ${req.path}`)));
  const onError: ErrorRequestHandler = (e, _req, res, _next) => {
    // Bad JSON / body too large from express.json()
    if (!(e instanceof AppError) && typeof e?.status === 'number' && e.status < 500) e = new AppError('BAD_REQUEST', e.status === 413 ? 'Body is too large' : 'Body must be valid JSON');
    const { status, body } = toErrorResponse(e, res.locals.requestId);
    res.status(status).json(body);
  };
  app.use(onError);
  return app;
}
