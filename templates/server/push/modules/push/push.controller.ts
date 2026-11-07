import type { contract } from '__SCOPE__/shared';
import type { Handler } from '../../lib/route';
import { pushService } from './push.service';

export const register: Handler<typeof contract.pushRegister> = async ({ body }) => {
  await pushService.register(body.token, body.platform);
  return { ok: true };
};
export const send: Handler<typeof contract.pushSend> = async ({ body }) => ({ ok: true, ...(await pushService.sendToAll(body)) });
