// Push notifications through Expo's push service (works for Android FCM and iOS APNs with one API).
// Android needs FCM set up once in EAS: https://docs.expo.dev/push-notifications/fcm-credentials/
import { chunk } from '__SCOPE__/shared';
import { log } from '../../lib/log';
import { pushModel } from './push.model';

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };

export const pushService = {
  register: (token: string, platform: string) => pushModel.save(token, platform),

  /** Sends to every saved device, 100 per request (Expo's limit). Drops tokens of uninstalled apps. */
  async sendToAll(msg: { title: string; body: string; data?: Record<string, string> }) {
    const tokens = await pushModel.all();
    let sent = 0;
    const dead: string[] = [];
    for (const batch of chunk(tokens, 100)) {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
        body: JSON.stringify(batch.map((to) => ({ to, sound: 'default', ...msg }))),
      }).catch((e: unknown) => { log.error('Expo push unreachable', { error: String(e) }); return null; });
      if (!res) continue;
      if (!res.ok) { log.error('Expo push failed', { status: res.status, body: await res.text() }); continue; }
      const { data } = (await res.json()) as { data: Ticket[] };
      data.forEach((t, i) => {
        if (t.status === 'ok') sent++;
        else if (t.details?.error === 'DeviceNotRegistered') dead.push(batch[i]!);
      });
    }
    if (dead.length) await pushModel.removeMany(dead);
    return { sent };
  },
};
