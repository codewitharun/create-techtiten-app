// RTK Query: one generic query + one generic mutation that call the typed contract client.
// Caching is per route key; mutations invalidate the route keys you pass.
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { AppError } from '__SCOPE__/shared';
import { api } from '@/api/client';

type Call = { key: string; input?: unknown };
const plain = (e: unknown) => ({ code: e instanceof AppError ? e.code : 'INTERNAL', message: e instanceof Error ? e.message : 'Request failed' });

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<{ code: string; message: string }>(),
  tagTypes: ['Route'],
  endpoints: (b) => ({
    call: b.query<unknown, Call>({
      queryFn: async ({ key, input }) => { try { return { data: await api(key as never, input as never) }; } catch (e) { return { error: plain(e) }; } },
      providesTags: (_r, _e, arg) => [{ type: 'Route', id: arg.key }],
    }),
    send: b.mutation<unknown, Call & { invalidates?: string[] }>({
      queryFn: async ({ key, input }) => { try { return { data: await api(key as never, input as never) }; } catch (e) { return { error: plain(e) }; } },
      invalidatesTags: (_r, _e, arg) => (arg.invalidates ?? []).map((id) => ({ type: 'Route' as const, id })),
    }),
  }),
});
