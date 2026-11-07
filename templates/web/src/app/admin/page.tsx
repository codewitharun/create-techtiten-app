import { JOBS } from '@/server/jobs';

const cards = [
  { label: 'Users', value: '—', hint: 'connect your database' },
  { label: 'Active today', value: '—', hint: 'connect your database' },
  { label: 'Scheduled jobs', value: String(Object.keys(JOBS).length), hint: 'src/server/jobs.ts' },
];

export default function AdminHome() {
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
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-bold">Jobs</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {Object.entries(JOBS).map(([name, job]) => (
            <li key={name} className="flex justify-between gap-4"><code>/api/cron/{name}</code><span className="text-text-muted">{job.description}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
