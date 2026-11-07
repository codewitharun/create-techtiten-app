import type { ReactNode } from 'react';

/** Force update needs a backend (GET /app-config). Without one, the app always opens. */
export function UpdateGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
