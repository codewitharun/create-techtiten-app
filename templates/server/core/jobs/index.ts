// Scheduled jobs, run by POST /cron/:job with header x-cron-key: CRON_API_KEY.
// Vercel functions are short-lived: keep each run short; for big work, do batches and save where you stopped.
type Job = { description: string; run: () => Promise<unknown> };

export const JOBS: Record<string, Job> = {
  'daily-summary': {
    description: 'Example job: replace with your own (reminders, cleanup, reports).',
    run: async () => ({ processed: 0 }),
  },
};
