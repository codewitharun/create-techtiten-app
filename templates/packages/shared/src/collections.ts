export function groupBy<T, K extends PropertyKey>(items: readonly T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const it of items) (out[key(it)] ??= []).push(it);
  return out;
}

export const sumBy = <T>(items: readonly T[], get: (t: T) => number) => items.reduce((s, t) => s + get(t), 0);

export function uniqBy<T>(items: readonly T[], key: (t: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return items.filter((t) => { const k = key(t); if (seen.has(k)) return false; seen.add(k); return true; });
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
