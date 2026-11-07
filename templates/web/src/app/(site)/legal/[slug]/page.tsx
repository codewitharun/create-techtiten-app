import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { app } from '__SCOPE__/config';
import { legalPages } from '__SCOPE__/shared';

// Privacy policy, terms, delete-account and support pages for the Play Store listing.
// Same text as the phone app (packages/shared/src/legal.ts). Links: /legal/privacy, /legal/terms, ...
const pages = legalPages({ appName: app.name, company: app.support.company, email: app.support.email });

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  return { title: page ? `${page.title} · ${app.name}` : app.name };
}

export default async function LegalPage({ params }: PageProps<'/legal/[slug]'>) {
  const { slug } = await params;
  const page = pages.find((p) => p.slug === slug);
  if (!page) notFound();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/" className="text-sm text-text-muted hover:underline">← {app.name}</Link>
      <div>
        <h1 className="text-4xl font-black tracking-tight">{page.title}</h1>
        <p className="mt-2 text-sm text-text-muted">Updated {page.updated}</p>
      </div>
      {page.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{s.heading}</h2>
          <p className="leading-relaxed text-text-muted">{s.body}</p>
        </section>
      ))}
      <nav className="mt-6 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
        {pages.map((p) => <Link key={p.slug} href={`/legal/${p.slug}`} className="text-text-muted hover:underline">{p.title}</Link>)}
      </nav>
    </main>
  );
}
