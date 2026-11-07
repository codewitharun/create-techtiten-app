import { useQuery } from '@tanstack/react-query';
import { healthSchema } from '__SCOPE__/shared';

// Your Next.js API. Set EXPO_PUBLIC_API_URL in apps/mobile/.env (e.g. https://myapp.vercel.app).
// On an Android emulator, your Mac's localhost is http://10.0.2.2:3000.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function api<T>(path: string, parse: (data: unknown) => T, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return parse(await r.json());
}

/** Example server query: cached, retried and refetched by TanStack Query. */
export const useHealth = (enabled = true) =>
  useQuery({ queryKey: ['health'], queryFn: () => api('/api/health', (d) => healthSchema.parse(d)), enabled, retry: 1 });
