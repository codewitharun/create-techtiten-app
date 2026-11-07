import { z } from 'zod';

// One set of rules for the app's forms and the API's input checks.
export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email');

/** Indian mobile: 10 digits starting 6-9, optional +91 / 91 / 0. Normalised to "+91XXXXXXXXXX". */
export const phoneINSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine((v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number')
  .transform((v) => `+91${v.slice(-10)}`);

/** UPI id like name@okhdfcbank / 9876543210@ybl */
export const upiIdSchema = z.string().trim().regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/, 'Enter a valid UPI id (name@bank)');

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Za-z]/, 'Add a letter')
  .regex(/\d/, 'Add a number');

/** First error message of a failed check, for showing under a form field. */
export function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

/** Compare app versions: "1.2.10" > "1.2.9". Returns -1, 0 or 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
