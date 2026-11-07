import Link from 'next/link';

// Everything under /admin is behind HTTP basic auth (src/proxy.ts, ADMIN_USER / ADMIN_PASSWORD).
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-56 shrink-0 border-r border-border bg-surface p-5">
        <div className="mb-6 text-lg font-black">__APP_NAME__ <span className="text-text-muted font-medium">admin</span></div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-surface-alt">Dashboard</Link>
          <Link href="/" className="rounded-lg px-3 py-2 hover:bg-surface-alt">View site</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
