// Model: the only file that knows where notes are stored. Swap the database here, nothing else changes.
import { randomUUID } from 'node:crypto';
import type { Note } from '__SCOPE__/shared';
import { table } from '../../lib/db';

const notes = () => table<Note>('notes');

export const notesModel = {
  async list(limit: number): Promise<Note[]> {
    return [...notes().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
  async insert(data: Omit<Note, 'id'>): Promise<Note> {
    const note = { id: randomUUID(), ...data };
    notes().set(note.id, note);
    return note;
  },
  async remove(id: string): Promise<boolean> {
    return notes().delete(id);
  },
};
