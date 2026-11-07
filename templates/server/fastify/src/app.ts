// Fastify app: security plugins, CORS, rate limit, docs, then every route from src/routes.ts.
// Routes don't touch req/reply: the loop below validates input (zod contract), checks auth and sends JSON.
import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError } from 'fastify';
import { allowedOrigins, app as cfg } from '__SCOPE__/config';
import { AppError, docsHtml, parseInput } from '__SCOPE__/shared';
import { isDev } from './config/env';
import { openApiSpec } from './docs/openapi';
import { checkAuth, docsAllowed } from './lib/auth';
import { DOCS_CSP, DOCS_LOGIN_HEADERS } from './lib/docs';
import { toErrorResponse } from './lib/errors';
import { routes } from './routes';

export async function createApp() {
  const app = Fastify({
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  await app.register(helmet);
  await app.register(cors, { origin: isDev ? true : allowedOrigins(false) });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: () => Object.assign(new AppError('RATE_LIMITED', 'Too many requests, slow down'), { statusCode: 429 }),
  });

  app.addHook('onSend', async (req, reply) => { reply.header('x-request-id', req.id); });

  app.get('/', async () => ({ name: `${cfg.name} API`, docs: '/docs', health: '/health' }));

  // API docs: open in development; in production DOCS_PUBLIC=true or log in (password = ADMIN_TOKEN).
  for (const url of ['/docs', '/openapi.json']) {
    app.get(url, async (req, reply) => {
      if (!docsAllowed(req.headers.authorization, isDev)) return reply.code(401).headers(DOCS_LOGIN_HEADERS).send('Login required');
      if (url === '/openapi.json') return openApiSpec(`${req.protocol}://${req.host}`);
      return reply.header('content-security-policy', DOCS_CSP).type('text/html').send(docsHtml(cfg.name, '/openapi.json'));
    });
  }

  for (const r of routes) {
    app.route({
      method: r.endpoint.method,
      url: r.endpoint.path,
      handler: async (req) => {
        checkAuth(r.endpoint, (name) => req.headers[name] as string | undefined);
        const input = parseInput(r.endpoint, { params: req.params, query: req.query, body: req.body });
        return r.handler(input, { requestId: req.id, ip: req.ip });
      },
    });
  }

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send(new AppError('NOT_FOUND', `No route for ${req.method} ${req.url.split('?')[0]}`).toJSON());
  });
  app.setErrorHandler((e: FastifyError | AppError, req, reply) => {
    // Fastify's own 4xx errors (bad JSON, body too large, empty body) -> BAD_REQUEST in our format.
    const err = !(e instanceof AppError) && typeof e.statusCode === 'number' && e.statusCode < 500 ? new AppError('BAD_REQUEST', e.message) : e;
    const { status, body } = toErrorResponse(err, req.id);
    reply.code(status).send(body);
  });
  return app;
}
