// Runs the API inside Next.js: src/app/api/[[...path]]/route.ts sends every /api/* request here.
// Same routes, contract, auth and error format as an Express/Fastify API, using fetch Request/Response.
import { randomUUID } from 'node:crypto';
import { allowedOrigins, app as cfg } from '__SCOPE__/config';
import { AppError, docsHtml, parseInput } from '__SCOPE__/shared';
import { isDev } from './config/env';
import { openApiSpec } from './docs/openapi';
import { checkAuth, docsAllowed } from './lib/auth';
import { DOCS_CSP, DOCS_LOGIN_HEADERS } from './lib/docs';
import { toErrorResponse } from './lib/errors';
import { routes } from './routes';

const PREFIX = '/api';
const table = routes.map((r) => ({
  r,
  re: new RegExp('^' + r.endpoint.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z0-9_]+)/g, '(?<$1>[^/]+)') + '/?$'),
}));

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin || !(isDev || allowedOrigins(false).includes(origin))) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': req.headers.get('access-control-request-headers') ?? 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export async function handle(req: Request): Promise<Response> {
  const requestId = req.headers.get('x-request-id') ?? randomUUID();
  const url = new URL(req.url);
  const path = url.pathname.slice(PREFIX.length) || '/';
  const base = { ...corsHeaders(req), 'x-request-id': requestId, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers: base });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: base });

  try {
    if (req.method === 'GET' && path === '/') return json({ name: `${cfg.name} API`, docs: `${PREFIX}/docs`, health: `${PREFIX}/health` });
    if (req.method === 'GET' && (path === '/docs' || path === '/openapi.json')) {
      if (!docsAllowed(req.headers.get('authorization') ?? undefined, isDev)) return new Response('Login required', { status: 401, headers: { ...base, ...DOCS_LOGIN_HEADERS } });
      if (path === '/openapi.json') return json(openApiSpec(`${url.origin}${PREFIX}`));
      return new Response(docsHtml(cfg.name, `${PREFIX}/openapi.json`), { headers: { ...base, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': DOCS_CSP } });
    }

    let pathMatched = false;
    for (const { r, re } of table) {
      const m = re.exec(path);
      if (!m) continue;
      pathMatched = true;
      if (r.endpoint.method !== req.method) continue;
      checkAuth(r.endpoint, (name) => req.headers.get(name) ?? undefined);
      let body: unknown;
      if (r.endpoint.body) {
        const text = await req.text();
        try { body = text ? JSON.parse(text) : undefined; } catch { throw new AppError('BAD_REQUEST', 'Body must be valid JSON'); }
      }
      const params = Object.fromEntries(Object.entries(m.groups ?? {}).map(([k, v]) => [k, decodeURIComponent(v)]));
      const input = parseInput(r.endpoint, { params, query: Object.fromEntries(url.searchParams), body });
      return json(await r.handler(input, { requestId, ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() }));
    }
    throw new AppError('NOT_FOUND', pathMatched ? `${req.method} is not allowed on ${path}` : `No route for ${req.method} ${path}`);
  } catch (e) {
    const { status, body } = toErrorResponse(e, requestId);
    return json(body, status);
  }
}
