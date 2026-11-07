import { connection } from 'next/server';
import { healthSchema } from '__SCOPE__/shared';

// GET /api/health. The response shape is the shared zod schema, so the phone app parses the same type.
export async function GET() {
  await connection(); // run per request (not prerendered at build time)
  return Response.json(healthSchema.parse({ ok: true, app: '__APP_SLUG__', time: new Date().toISOString() }));
}
