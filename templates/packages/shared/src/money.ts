/**
 * Split an amount (in paise/cents, an integer) into `parts` shares that add up exactly.
 * splitEvenly(1000, 3) -> [334, 333, 333]
 */
export function splitEvenly(total: number, parts: number): number[] {
  if (!Number.isInteger(total) || !Number.isInteger(parts) || parts <= 0) throw new Error('splitEvenly: integers only, parts > 0');
  const base = Math.floor(total / parts);
  const extra = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < extra ? 1 : 0));
}

/** Rupees -> paise (store money as integers to avoid 0.1 + 0.2 problems). */
export const toMinor = (amount: number) => Math.round(amount * 100);
export const fromMinor = (minor: number) => minor / 100;
