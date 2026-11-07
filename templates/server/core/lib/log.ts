// Tiny structured logger: one JSON line per event in production, readable lines in development.
import { isDev } from '../config/env';

type Fields = Record<string, unknown>;
const write = (level: 'info' | 'warn' | 'error', msg: string, f?: Fields) =>
  isDev ? console[level](`[${level}] ${msg}`, f ?? '') : console[level](JSON.stringify({ level, msg, time: new Date().toISOString(), ...f }));

export const log = {
  info: (msg: string, f?: Fields) => write('info', msg, f),
  warn: (msg: string, f?: Fields) => write('warn', msg, f),
  error: (msg: string, f?: Fields) => write('error', msg, f),
};
