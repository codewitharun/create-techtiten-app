// Written by create-techtiten-app: every route group in this app.
import { coreRoutes } from './core';

export const contract = { ...coreRoutes };
export type ApiContract = typeof contract;
export * from './core';
