// Service: business rules. No HTTP here (no req/res), so jobs, admin pages and tests can call it too.
import { AppError, type Note } from '__SCOPE__/shared';
import { notesModel } from './notes.model';

export const notesService = {
  list: (limit: number): Promise<Note[]> => notesModel.list(limit),
  async create(text: string): Promise<Note> {
    if (/https?:\/\//i.test(text)) throw new AppError('BAD_REQUEST', 'Links are not allowed in notes'); // example rule
    return notesModel.insert({ text, createdAt: new Date().toISOString() });
  },
  async remove(id: string) {
    const ok = await notesModel.remove(id);
    if (!ok) throw new AppError('NOT_FOUND', 'Note not found');
  },
};
