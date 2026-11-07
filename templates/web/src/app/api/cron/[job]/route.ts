import { JOBS } from '@/server/jobs';

// Scheduled jobs. Vercel functions are short-lived, so an outside timer calls this:
//   cron-job.org or a GitHub Actions schedule ->
//   POST https://<your-app>/api/cron/<job>   header  x-cron-key: <CRON_API_KEY>
// Keep each run short; for big work, do it in batches and save where you stopped.
export async function POST(request: Request, ctx: RouteContext<'/api/cron/[job]'>) {
  const key = process.env.CRON_API_KEY;
  if (!key) return Response.json({ error: 'CRON_API_KEY is not set' }, { status: 503 });
  if (request.headers.get('x-cron-key') !== key) return Response.json({ error: 'Not allowed' }, { status: 401 });
  const { job } = await ctx.params;
  const run = JOBS[job];
  if (!run) return Response.json({ error: `Unknown job: ${job}` }, { status: 404 });
  const started = Date.now();
  const result = await run.handler();
  return Response.json({ ok: true, job, ms: Date.now() - started, result });
}
