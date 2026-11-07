import { model, models, Schema, type Model } from 'mongoose';
import { connectDb } from '../../lib/db';

type Device = { token: string; platform: string; updatedAt: Date };
const PushToken = (models.PushToken as Model<Device>) ?? model<Device>('PushToken', new Schema<Device>({ token: { type: String, required: true, unique: true }, platform: String, updatedAt: Date }));

export const pushModel = {
  async save(token: string, platform: string) {
    await connectDb();
    await PushToken.updateOne({ token }, { token, platform, updatedAt: new Date() }, { upsert: true });
  },
  async all(): Promise<string[]> {
    await connectDb();
    return (await PushToken.find({}, { token: 1 }).lean()).map((d) => d.token);
  },
  async removeMany(tokens: string[]) {
    await connectDb();
    await PushToken.deleteMany({ token: { $in: tokens } });
  },
};
