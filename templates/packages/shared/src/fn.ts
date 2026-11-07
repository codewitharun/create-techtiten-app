export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...a: A) => { if (t) clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  wrapped.cancel = () => t && clearTimeout(t);
  return wrapped;
}

export function throttle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let last = 0;
  return (...a: A) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } };
}

/** Retry an async call with exponential backoff: 300ms, 600ms, 1.2s… */
export async function retry<T>(fn: () => Promise<T>, { tries = 3, baseMs = 300 }: { tries?: number; baseMs?: number } = {}): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; if (i < tries - 1) await sleep(baseMs * 2 ** i); }
  }
  throw lastErr;
}
