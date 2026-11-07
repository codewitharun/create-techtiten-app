import { inArray } from 'drizzle-orm';
import { db, schema } from '../../lib/db';

const { pushTokens } = schema;

export const pushModel = {
  async save(token: string, platform: string) {
    await db().insert(pushTokens).values({ token, platform }).onConflictDoUpdate({ target: pushTokens.token, set: { platform, updatedAt: new Date().toISOString() } });
  },
  async all(): Promise<string[]> {
    return (await db().select({ token: pushTokens.token }).from(pushTokens)).map((r) => r.token);
  },
  async removeMany(tokens: string[]) {
    if (tokens.length) await db().delete(pushTokens).where(inArray(pushTokens.token, tokens));
  },
};
