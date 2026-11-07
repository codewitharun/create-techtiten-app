import { NextResponse, type NextRequest } from 'next/server';

// HTTP basic auth for the admin panel: any user name, password = ADMIN_TOKEN (same secret as the
// admin API routes). Set it in Vercel and in apps/web/.env.local. Swap for real auth later if needed.
// (Admin API routes under /api/admin/* check the token themselves: Authorization: Bearer ADMIN_TOKEN.)
export function proxy(request: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return new NextResponse('Admin is locked: set ADMIN_TOKEN.', { status: 503 });

  const [scheme, encoded] = (request.headers.get('authorization') ?? '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const pass = atob(encoded).split(':').slice(1).join(':');
    if (same(pass, token)) return NextResponse.next();
  }
  return new NextResponse('Login required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="admin (password = ADMIN_TOKEN)"' } });
}

// Compare without exiting early, so the time taken doesn't reveal how much matched.
function same(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = { matcher: ['/admin/:path*'] };
