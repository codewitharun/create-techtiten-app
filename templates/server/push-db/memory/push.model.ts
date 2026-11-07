import { table } from '../../lib/db';

type Device = { token: string; platform: string; updatedAt: string };
const devices = () => table<Device>('pushTokens');

export const pushModel = {
  async save(token: string, platform: string) { devices().set(token, { token, platform, updatedAt: new Date().toISOString() }); },
  async all(): Promise<string[]> { return [...devices().keys()]; },
  async removeMany(tokens: string[]) { tokens.forEach((t) => devices().delete(t)); },
};
