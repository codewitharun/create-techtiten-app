export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

/** Indian short form: 950 -> "950", 12,500 -> "12.5K", 2,50,000 -> "2.5L", 3,40,00,000 -> "3.4Cr". */
export function formatCompactIN(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const fmt = (v: number, unit: string) => `${sign}${Number(v.toFixed(v < 10 ? 1 : 0))}${unit}`;
  if (a >= 1e7) return fmt(a / 1e7, 'Cr');
  if (a >= 1e5) return fmt(a / 1e5, 'L');
  if (a >= 1e3) return fmt(a / 1e3, 'K');
  return `${sign}${Math.round(a)}`;
}

/** 0.256 -> "25.6%" */
export const formatPercent = (ratio: number, digits = 1) => `${Number((ratio * 100).toFixed(digits))}%`;

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** "arun kumar" -> "AK" (avatars) */
export const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

/** "1 item", "3 items" */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
