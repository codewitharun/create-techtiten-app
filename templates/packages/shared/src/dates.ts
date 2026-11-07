/** Local calendar day as "yyyy-mm-dd" (good as a database key for daily data). */
export function dayKey(d: Date | number | string = new Date()): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function startOfDay(d: Date | number | string = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const addDays = (d: Date | number | string, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x; };
export const isSameDay = (a: Date | number | string, b: Date | number | string) => dayKey(a) === dayKey(b);

/** Monday-based week start. */
export function startOfWeek(d: Date | number | string = new Date()): Date {
  const x = startOfDay(d);
  const shift = (x.getDay() + 6) % 7;
  return addDays(x, -shift);
}

export function formatDate(d: Date | number | string, locale = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
}

/** "Today", "Yesterday", "Tomorrow", else "7 Nov 2026". */
export function relativeDay(d: Date | number | string, now: Date | number = new Date(), locale = 'en-IN'): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return formatDate(d, locale);
}

/** "just now", "5 min ago", "3 h ago", "2 d ago" */
export function timeAgo(d: Date | number | string, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(d).getTime()) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
