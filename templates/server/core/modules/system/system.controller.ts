import { app } from '__SCOPE__/config';
import { AppError, contract } from '__SCOPE__/shared';
import { env } from '../../config/env';
import { JOBS } from '../../jobs';
import type { Handler } from '../../lib/route';

export const health: Handler<typeof contract.health> = () => ({ ok: true, app: app.slug, time: new Date().toISOString() });

export const appConfig: Handler<typeof contract.appConfig> = () => ({
  minVersion: env.MIN_APP_VERSION,
  latestVersion: env.LATEST_APP_VERSION,
  storeUrl: app.storeUrl,
});

export const runCron: Handler<typeof contract.cronRun> = async ({ params }) => {
  const job = JOBS[params.job];
  if (!job) throw new AppError('NOT_FOUND', `Unknown job: ${params.job}`);
  const started = Date.now();
  const result = await job.run();
  return { ok: true, job: params.job, ms: Date.now() - started, result };
};
