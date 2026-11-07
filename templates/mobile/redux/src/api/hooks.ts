// Typed data hooks on top of RTK Query. Same API as the TanStack version of this template:
//   const notes = useApiQuery('notesList', { query: { limit: 20 } });
//   const create = useApiMutation('notesCreate', { invalidates: ['notesList'] });
//   await create.mutateAsync({ body: { text } });
import { AppError, type ApiContract, type EndpointInput, type EndpointOutput } from '__SCOPE__/shared';
import { apiSlice } from '@/state/apiSlice';

export type ApiKey = keyof ApiContract & string;
const toAppError = (e: unknown) => (e ? new AppError(((e as { code?: string }).code ?? 'INTERNAL') as never, (e as { message?: string }).message ?? 'Request failed') : null);

export function useApiQuery<K extends ApiKey>(key: K, input?: EndpointInput<ApiContract[K]>, opts?: { enabled?: boolean; staleTime?: number }) {
  // staleTime (ms): refetch when the cached data is older than this (TanStack-style option).
  const q = apiSlice.useCallQuery({ key, input }, { skip: opts?.enabled === false, refetchOnMountOrArgChange: opts?.staleTime ? opts.staleTime / 1000 : false });
  return { data: q.data as EndpointOutput<ApiContract[K]> | undefined, isLoading: q.isLoading, error: toAppError(q.error), refetch: q.refetch };
}

export function useApiMutation<K extends ApiKey>(key: K, opts?: { invalidates?: ApiKey[] }) {
  const [trigger, m] = apiSlice.useSendMutation();
  return {
    mutateAsync: async (input: EndpointInput<ApiContract[K]>) => {
      try { return (await trigger({ key, input, invalidates: opts?.invalidates }).unwrap()) as EndpointOutput<ApiContract[K]>; }
      catch (e) { throw toAppError(e); }
    },
    isPending: m.isLoading,
    error: toAppError(m.error),
  };
}
