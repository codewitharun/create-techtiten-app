// A route = a contract endpoint + a handler. Handlers get validated, typed input and return the
// typed output; the framework adapter (Express / Fastify / Next.js) does HTTP, auth and errors.
import type { Endpoint, EndpointOutput, ParsedInput } from '__SCOPE__/shared';

export type Ctx = { requestId: string; ip?: string };
export type Handler<E extends Endpoint> = (input: ParsedInput<E>, ctx: Ctx) => Promise<EndpointOutput<E>> | EndpointOutput<E>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Route = { endpoint: Endpoint; handler: Handler<any> };

export const route = <E extends Endpoint>(endpoint: E, handler: Handler<E>): Route => ({ endpoint, handler });
