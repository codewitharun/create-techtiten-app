// Model: the only file that knows where notes are stored. Swap the database here, nothing else changes.
import type { Note } from '__SCOPE__/shared';
import { db } from '../../lib/db';

const col = () => db().collection('notes');

export const notesModel = {
  async list(limit: number): Promise<Note[]> {
    const snap = await col().orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Note, 'id'>) }));
  },
  async insert(data: Omit<Note, 'id'>): Promise<Note> {
    const ref = await col().add(data);
    return { id: ref.id, ...data };
  },
  async remove(id: string): Promise<boolean> {
    const ref = col().doc(id);
    if (!(await ref.get()).exists) return false;
    await ref.delete();
    return true;
  },
};
