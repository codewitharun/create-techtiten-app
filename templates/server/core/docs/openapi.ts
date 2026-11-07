import { app } from '__SCOPE__/config';
import { buildOpenApi, contract } from '__SCOPE__/shared';

/** OpenAPI document for the whole contract (served at /openapi.json, rendered at /docs). */
export const openApiSpec = (serverUrl: string) => buildOpenApi(contract, { title: `${app.name} API`, version: '1.0.0', serverUrl });
