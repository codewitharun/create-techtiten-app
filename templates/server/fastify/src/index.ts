// Vercel entry (see vercel.json): hands each request to Fastify's server.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';

const ready = createApp().then(async (app) => { await app.ready(); return app; });

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  (await ready).server.emit('request', req, res);
}
