// Database tables. After changing this file run `npm run db:push` (dev) to update the database.
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});
__PUSH_TABLE__
