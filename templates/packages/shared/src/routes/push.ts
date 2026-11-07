import { z } from 'zod';
import { endpoint } from '../contract';

export const pushRegisterSchema = z.object({ token: z.string().min(10), platform: z.enum(['android', 'ios', 'web']) });
export const pushSendSchema = z.object({ title: z.string().min(1).max(80), body: z.string().min(1).max(240), data: z.record(z.string(), z.string()).optional() });

export const pushRoutes = {
  pushRegister: endpoint({ method: 'POST', path: '/push/register', summary: 'Save this device\'s push token', tag: 'Notifications', body: pushRegisterSchema, response: z.object({ ok: z.boolean() }) }),
  pushSend: endpoint({ method: 'POST', path: '/admin/push/send', summary: 'Send a push to every device', tag: 'Notifications', auth: 'admin', body: pushSendSchema, response: z.object({ ok: z.boolean(), sent: z.number() }) }),
};
