import { contract, createApiClient } from '__SCOPE__/shared';
import { apiBaseUrl } from './baseUrl';

/**
 * Typed API client generated from the shared contract:
 *   const notes = await api('notesList', { query: { limit: 20 } });
 * In components prefer the hooks in ./hooks (caching, loading state, refetch).
 */
export const api = createApiClient(contract, {
  baseUrl: apiBaseUrl,
  // headers: async () => ({ Authorization: `Bearer ${await getToken()}` }),
});
