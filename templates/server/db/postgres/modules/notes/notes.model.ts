// Model: the only file that knows where notes are stored. Swap the database here, nothing else changes.
import { desc, eq } from 'drizzle-orm';
import type { Note } from '__SCOPE__/shared';
import { db, schema } from '../../lib/db';

const { notes } = schema;
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const toNote = (r: typeof notes.$inferSelect): Note => ({ id: r.id, text: r.text, createdAt: new Date(r.createdAt).toISOString() });

export const notesModel = {
  async list(limit: number): Promise<Note[]> {
    return (await db().select().from(notes).orderBy(desc(notes.createdAt)).limit(limit)).map(toNote);
  },
  async insert(data: Omit<Note, 'id'>): Promise<Note> {
    const [row] = await db().insert(notes).values(data).returning();
    return toNote(row!);
  },
  async remove(id: string): Promise<boolean> {
    if (!isUuid(id)) return false;
    return (await db().delete(notes).where(eq(notes.id, id)).returning({ id: notes.id })).length === 1;
  },
};
