import { NextResponse, type NextRequest } from 'next/server';

// HTTP basic auth for the admin panel and admin APIs. Set ADMIN_USER and ADMIN_PASSWORD
// in Vercel (and in apps/web/.env.local for development). Swap for real auth later if you need it.
export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse('Admin is locked: set ADMIN_USER and ADMIN_PASSWORD.', { status: 503 });

  const header = request.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, ...rest] = atob(encoded).split(':');
    if (same(u, user) && same(rest.join(':'), pass)) return NextResponse.next();
  }
  return new NextResponse('Login required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="admin"' } });
}

// Compare without exiting early, so the time taken doesn't reveal how much matched.
function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
