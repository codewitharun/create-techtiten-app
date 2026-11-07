// Typed data hooks on top of TanStack Query. Keys and input/output types come from the contract.
//   const notes = useApiQuery('notesList', { query: { limit: 20 } });
//   const create = useApiMutation('notesCreate', { invalidates: ['notesList'] });
//   await create.mutateAsync({ body: { text } });
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppError, type ApiContract, type EndpointInput, type EndpointOutput } from '__SCOPE__/shared';
import { api } from './client';

export type ApiKey = keyof ApiContract & string;

export function useApiQuery<K extends ApiKey>(key: K, input?: EndpointInput<ApiContract[K]>, opts?: { enabled?: boolean; staleTime?: number }) {
  const q = useQuery({ queryKey: [key, input ?? null], queryFn: () => api(key, input), ...opts });
  return { data: q.data as EndpointOutput<ApiContract[K]> | undefined, isLoading: q.isLoading, error: (q.error as AppError | null) ?? null, refetch: q.refetch };
}

export function useApiMutation<K extends ApiKey>(key: K, opts?: { invalidates?: ApiKey[] }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (input: EndpointInput<ApiContract[K]>) => api(key, input),
    onSuccess: () => opts?.invalidates?.forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });
  return { mutateAsync: m.mutateAsync, isPending: m.isPending, error: (m.error as AppError | null) ?? null };
}
