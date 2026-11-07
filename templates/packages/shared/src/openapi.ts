// OpenAPI 3.1 document built from the contract (zod 4 -> JSON Schema). Served at /openapi.json,
// and rendered as interactive docs at /docs.
import { z } from 'zod';
import type { Endpoint } from './contract';

const schema = (s: z.ZodType, io: 'input' | 'output') => z.toJSONSchema(s, { io, unrepresentable: 'any' }) as Record<string, unknown>;

export function buildOpenApi(contract: Record<string, Endpoint>, info: { title: string; version: string; serverUrl: string }) {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const [id, e] of Object.entries(contract)) {
    const path = e.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const parameters: unknown[] = [];
    for (const where of ['params', 'query'] as const) {
      const s = e[where];
      if (!s) continue;
      const js = schema(s, 'input') as { properties?: Record<string, unknown>; required?: string[] };
      for (const [name, prop] of Object.entries(js.properties ?? {})) {
        parameters.push({ name, in: where === 'params' ? 'path' : 'query', required: where === 'params' || !!js.required?.includes(name), schema: prop });
      }
    }
    (paths[path] ??= {})[e.method.toLowerCase()] = {
      operationId: id,
      summary: e.summary,
      tags: e.tag ? [e.tag] : undefined,
      parameters: parameters.length ? parameters : undefined,
      requestBody: e.body ? { required: true, content: { 'application/json': { schema: schema(e.body, 'input') } } } : undefined,
      security: e.auth === 'admin' ? [{ admin: [] }] : e.auth === 'cron' ? [{ cron: [] }] : undefined,
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: schema(e.response, 'output') } } },
        400: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    };
  }
  return {
    openapi: '3.1.0',
    info: { title: info.title, version: info.version },
    servers: [{ url: info.serverUrl }],
    paths,
    components: {
      securitySchemes: {
        admin: { type: 'http', scheme: 'bearer', description: 'ADMIN_TOKEN' },
        cron: { type: 'apiKey', in: 'header', name: 'x-cron-key', description: 'CRON_API_KEY' },
      },
      schemas: {
        Error: { type: 'object', properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} } } } },
      },
    },
  };
}

/** HTML page that renders the docs with Scalar (interactive "Try it" for every route). */
export const docsHtml = (title: string, specUrl: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} API</title></head>
<body><script id="api-reference" data-url="${specUrl}"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.77.0"></script></body></html>`;
