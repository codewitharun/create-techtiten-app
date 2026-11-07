// Controller: takes the validated request input, calls the service, returns the response.
// No business rules here, so the service stays easy to test and reuse (jobs, admin, scripts).
import type { contract } from '__SCOPE__/shared';
import type { Handler } from '../../lib/route';
import { notesService } from './notes.service';

export const list: Handler<typeof contract.notesList> = ({ query }) => notesService.list(query.limit);
export const create: Handler<typeof contract.notesCreate> = ({ body }) => notesService.create(body.text);
export const remove: Handler<typeof contract.notesDelete> = async ({ params }) => {
  await notesService.remove(params.id);
  return { ok: true };
};
