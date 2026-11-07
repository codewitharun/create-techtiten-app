import { AppError } from '__SCOPE__/shared';
import { isDev } from '../config/env';
import { log } from './log';

/** Any thrown value -> { status, body } in the shared error format. Hides internals in production. */
export function toErrorResponse(e: unknown, requestId?: string): { status: number; body: unknown } {
  if (e instanceof AppError) return { status: e.status, body: e.toJSON() };
  log.error('Unhandled error', { requestId, error: e instanceof Error ? e.stack : String(e) });
  const message = isDev && e instanceof Error ? e.message : 'Something went wrong';
  return { status: 500, body: { error: { code: 'INTERNAL', message, ...(requestId ? { requestId } : {}) } } };
}
