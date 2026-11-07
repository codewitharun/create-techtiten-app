import { z } from 'zod';
import { endpoint } from '../contract';

// Example feature: a tiny notes list. It shows the whole path: contract -> API module
// (routes/controller/service/model) -> typed hooks in the app. Replace it with your own.
export const noteSchema = z.object({ id: z.string(), text: z.string(), createdAt: z.string() });
export const noteInputSchema = z.object({ text: z.string().trim().min(1, 'Write something').max(500) });
export type Note = z.infer<typeof noteSchema>;
export type NoteInput = z.infer<typeof noteInputSchema>;

export const notesRoutes = {
  notesList: endpoint({ method: 'GET', path: '/notes', summary: 'List notes', tag: 'Notes', query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }), response: z.array(noteSchema) }),
  notesCreate: endpoint({ method: 'POST', path: '/notes', summary: 'Create a note', tag: 'Notes', body: noteInputSchema, response: noteSchema }),
  notesDelete: endpoint({ method: 'DELETE', path: '/notes/:id', summary: 'Delete a note', tag: 'Notes', params: z.object({ id: z.string() }), response: z.object({ ok: z.boolean() }) }),
};
