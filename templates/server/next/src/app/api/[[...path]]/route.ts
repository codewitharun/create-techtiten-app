// Every /api/* request goes to the shared API router (src/server). Add routes in
// packages/shared/src/routes (contract) + src/server/modules (code), not here.
import { handle } from '@/server/http';

// Dynamic by nature (reads the request), so nothing here is prerendered or cached.

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
