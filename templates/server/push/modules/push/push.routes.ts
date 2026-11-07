import { contract } from '__SCOPE__/shared';
import { route } from '../../lib/route';
import * as push from './push.controller';

export const pushRoutes = [route(contract.pushRegister, push.register), route(contract.pushSend, push.send)];
