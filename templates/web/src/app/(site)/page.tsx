import Link from 'next/link';

// The public website / web version of the app. Shares colors with the phone app (packages/theme).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-surface-alt px-3 py-1 text-sm text-text-muted">by Techtiten</span>
        <h1 className="text-5xl font-black tracking-tight">__APP_NAME__</h1>
        <p className="text-lg text-text-muted">This is the website. Edit <code>src/app/(site)/page.tsx</code>. The admin panel is at <code>/admin</code> and the API at <code>/api</code>.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin" className="rounded-xl bg-brand px-5 py-3 font-bold text-on-brand">Open admin</Link>
        <a href="/api/health" className="rounded-xl border border-border px-5 py-3 font-bold">API health</a>
      </div>
    </main>
  );
}
