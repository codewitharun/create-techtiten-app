import { contract } from '__SCOPE__/shared';
import { route } from '../../lib/route';
import { appConfig, health, runCron } from './system.controller';

export const systemRoutes = [
  route(contract.health, health),
  route(contract.appConfig, appConfig),
  route(contract.cronRun, runCron),
];
