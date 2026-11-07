import { z } from 'zod';

/** GET /api/health response. Used by the API (to build it) and the app (to parse it). */
export const healthSchema = z.object({
  ok: z.boolean(),
  app: z.string(),
  time: z.string(),
});
export type Health = z.infer<typeof healthSchema>;
