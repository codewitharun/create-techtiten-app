import { db } from '../../lib/db';

const col = () => db().collection('pushTokens');

export const pushModel = {
  async save(token: string, platform: string) {
    await col().doc(encodeURIComponent(token)).set({ token, platform, updatedAt: new Date().toISOString() });
  },
  async all(): Promise<string[]> {
    return (await col().select('token').get()).docs.map((d) => d.get('token') as string);
  },
  async removeMany(tokens: string[]) {
    const batch = db().batch();
    tokens.forEach((t) => batch.delete(col().doc(encodeURIComponent(t))));
    await batch.commit();
  },
};
