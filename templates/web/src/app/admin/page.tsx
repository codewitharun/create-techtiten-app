import { connection } from 'next/server';
import { app } from '__SCOPE__/config';
import { contract } from '__SCOPE__/shared';
import { env } from '@/server/config/env';
import { JOBS } from '@/server/jobs';
__PUSH_IMPORT__
// Admin dashboard (behind basic auth, src/proxy.ts). Server components can call services directly:
// no fetch to your own API needed.
export default async function AdminHome() {
  await connection(); // always fresh: env values and data, never cached at build time
  const cards = [
    { label: 'API routes', value: String(Object.keys(contract).length), hint: 'see /api/docs' },
    { label: 'Min app version', value: env.MIN_APP_VERSION, hint: 'MIN_APP_VERSION (force update)' },
    { label: 'Latest app version', value: env.LATEST_APP_VERSION, hint: 'LATEST_APP_VERSION' },
  ];
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-sm text-text-muted">{c.label}</div>
            <div className="mt-1 text-3xl font-black">{c.value}</div>
            <div className="mt-2 text-xs text-text-muted">{c.hint}</div>
          </div>
        ))}
      </div>
__PUSH_CARD__
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-bold">Scheduled jobs</h2>
        <p className="mb-3 text-sm text-text-muted">Call <code>POST /api/cron/&lt;job&gt;</code> with header <code>x-cron-key: CRON_API_KEY</code> from cron-job.org or a GitHub Actions schedule.</p>
        <ul className="flex flex-col gap-2 text-sm">
          {Object.entries(JOBS).map(([name, job]) => (
            <li key={name} className="flex justify-between gap-4"><code>/api/cron/{name}</code><span className="text-text-muted">{job.description}</span></li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/api/docs" className="rounded-xl border border-border px-4 py-2 font-bold">API docs</a>
        <a href={app.storeUrl} className="rounded-xl border border-border px-4 py-2 font-bold">Play Store page</a>
      </div>
    </div>
  );
}
