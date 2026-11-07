// Model: the only file that knows where notes are stored. Swap the database here, nothing else changes.
import { isValidObjectId, model, models, Schema, type Model } from 'mongoose';
import type { Note } from '__SCOPE__/shared';
import { connectDb } from '../../lib/db';

type NoteDoc = Omit<Note, 'id'>;
const NoteModel = (models.Note as Model<NoteDoc>) ?? model<NoteDoc>('Note', new Schema<NoteDoc>({ text: { type: String, required: true }, createdAt: { type: String, required: true, index: true } }));

const toNote = (d: NoteDoc & { _id: unknown }): Note => ({ id: String(d._id), text: d.text, createdAt: d.createdAt });

export const notesModel = {
  async list(limit: number): Promise<Note[]> {
    await connectDb();
    return (await NoteModel.find().sort({ createdAt: -1 }).limit(limit).lean()).map(toNote);
  },
  async insert(data: NoteDoc): Promise<Note> {
    await connectDb();
    return toNote((await NoteModel.create(data)).toObject());
  },
  async remove(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    await connectDb();
    return (await NoteModel.deleteOne({ _id: id })).deletedCount === 1;
  },
};
