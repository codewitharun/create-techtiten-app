// The API contract: every route described once (method, path, input, output) with zod.
//  - the API validates requests against it (bad input -> clean 400)
//  - the app's client and hooks are typed from it (rename a field -> both sides show the error)
//  - /docs (OpenAPI) is generated from it
// Add a route: `npx create-techtiten-app add route <name>`, or add an entry in contract/*.ts.
import { z } from 'zod';
import { AppError } from './errors';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Endpoint = {
  method: Method;
  /** Express-style path params: /notes/:id */
  path: string;
  summary: string;
  tag?: string;
  /** 'admin' = ADMIN_TOKEN bearer, 'cron' = CRON_API_KEY header, default public. */
  auth?: 'public' | 'admin' | 'cron';
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  response: z.ZodType;
};

/** Declare an endpoint with full type inference. */
export const endpoint = <const E extends Endpoint>(e: E) => e;

type Part<E, K extends string> = E extends { [P in K]: infer S extends z.ZodType } ? { [P in K]: z.input<S> } : { [P in K]?: never };
export type EndpointInput<E> = Part<E, 'params'> & Part<E, 'query'> & Part<E, 'body'>;
export type EndpointOutput<E> = E extends { response: infer R extends z.ZodType } ? z.output<R> : never;
type Parsed<E, K extends string> = E extends { [P in K]: infer S extends z.ZodType } ? z.output<S> : undefined;
export type ParsedInput<E> = { params: Parsed<E, 'params'>; query: Parsed<E, 'query'>; body: Parsed<E, 'body'> };

/** /notes/:id + { id: 'a b' } -> /notes/a%20b */
export function buildPath(path: string, params?: Record<string, unknown>): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, k) => encodeURIComponent(String(params?.[k] ?? '')));
}

/** Validate raw request parts against an endpoint. Throws AppError('BAD_REQUEST') with field details. */
export function parseInput<E extends Endpoint>(e: E, raw: { params?: unknown; query?: unknown; body?: unknown }): ParsedInput<E> {
  const out: Record<string, unknown> = {};
  for (const part of ['params', 'query', 'body'] as const) {
    const schema = e[part];
    if (!schema) { out[part] = undefined; continue; }
    const r = schema.safeParse(raw[part] ?? (part === 'body' ? undefined : {}));
    if (!r.success) {
      throw new AppError('BAD_REQUEST', r.error.issues[0]?.message ?? `Invalid ${part}`, r.error.issues.map((i) => ({ path: [part, ...i.path].join('.'), message: i.message })));
    }
    out[part] = r.data;
  }
  return out as ParsedInput<E>;
}

type Contract = Record<string, Endpoint>;
export type ApiClientOptions = {
  /** Base URL including any prefix, e.g. http://192.168.1.5:4000 or https://myapp.com/api */
  baseUrl: string | (() => string);
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  timeoutMs?: number;
};

/** Typed fetch client for a contract: `await api('notesCreate', { body: { text } })`. */
export function createApiClient<C extends Contract>(contract: C, opts: ApiClientOptions) {
  return async function request<K extends keyof C & string>(key: K, input?: EndpointInput<C[K]>): Promise<EndpointOutput<C[K]>> {
    const e = contract[key]!;
    const inp = (input ?? {}) as { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown };
    const base = typeof opts.baseUrl === 'function' ? opts.baseUrl() : opts.baseUrl;
    const qs = inp.query ? '?' + new URLSearchParams(Object.entries(inp.query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15_000);
    let res: Response;
    try {
      res = await fetch(base + buildPath(e.path, inp.params) + qs, {
        method: e.method,
        signal: ctrl.signal,
        headers: { Accept: 'application/json', ...(inp.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(await opts.headers?.()) },
        body: inp.body !== undefined ? JSON.stringify(inp.body) : undefined,
      });
    } catch {
      throw new AppError('NETWORK', `Can't reach ${base}`);
    } finally {
      clearTimeout(timer);
    }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
      const code = (err?.code && err.code in { BAD_REQUEST: 1, UNAUTHORIZED: 1, FORBIDDEN: 1, NOT_FOUND: 1, CONFLICT: 1, RATE_LIMITED: 1 } ? err.code : 'INTERNAL') as ConstructorParameters<typeof AppError>[0];
      throw new AppError(code, err?.message ?? `Request failed (${res.status})`, err?.details);
    }
    return e.response.parse(data) as EndpointOutput<C[K]>;
  };
}
