// Server-only jobs, called by /api/cron/[job]. Add yours here.
type Job = { description: string; handler: () => Promise<unknown> };

export const JOBS: Record<string, Job> = {
  'daily-summary': {
    description: 'Example job: replace with your own (reminders, cleanup, reports).',
    handler: async () => ({ processed: 0 }),
  },
};
