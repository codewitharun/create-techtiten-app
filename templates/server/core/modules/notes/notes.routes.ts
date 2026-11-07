// URL -> controller. The contract (packages/shared/src/routes/notes.ts) defines method, path and types.
import { contract } from '__SCOPE__/shared';
import { route } from '../../lib/route';
import * as notes from './notes.controller';

export const notesRoutes = [
  route(contract.notesList, notes.list),
  route(contract.notesCreate, notes.create),
  route(contract.notesDelete, notes.remove),
];
