import { z } from 'zod';
import { endpoint } from '../contract';

export const healthSchema = z.object({ ok: z.boolean(), app: z.string(), time: z.string() });
export type Health = z.infer<typeof healthSchema>;

export const appConfigSchema = z.object({
  /** Versions below this must update (the app shows a blocking screen). */
  minVersion: z.string(),
  latestVersion: z.string(),
  storeUrl: z.string(),
  message: z.string().optional(),
});
export type AppConfig = z.infer<typeof appConfigSchema>;

export const coreRoutes = {
  health: endpoint({ method: 'GET', path: '/health', summary: 'Is the API up?', tag: 'System', response: healthSchema }),
  appConfig: endpoint({ method: 'GET', path: '/app-config', summary: 'Min/latest app version (force update)', tag: 'System', response: appConfigSchema }),
  cronRun: endpoint({
    method: 'POST', path: '/cron/:job', summary: 'Run a scheduled job (called by an outside timer)', tag: 'System', auth: 'cron',
    params: z.object({ job: z.string() }),
    response: z.object({ ok: z.boolean(), job: z.string(), ms: z.number(), result: z.unknown() }),
  }),
};
