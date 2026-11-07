// One error format for the API and the app. The API sends { error: { code, message } };
// the app turns it back into an AppError so screens can check `e.code`.
export const ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  NETWORK: 0,
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
  get status() { return ERROR_CODES[this.code]; }
  toJSON() { return { error: { code: this.code, message: this.message, ...(this.details ? { details: this.details } : {}) } }; }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;

/** Friendly text for any error (for alerts/toasts). */
export function errorMessage(e: unknown): string {
  if (e instanceof AppError) return e.code === 'NETWORK' ? "Can't reach the server. Check your internet." : e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}
