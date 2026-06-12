/**
 * Shared maintenance-mode state.
 *
 * Next.js middleware runs on the Edge runtime and cannot:
 * - import Prisma (Node.js only)
 * - reliably fetch its own API routes (self-referencing loop / timeout under PM2)
 *
 * Instead, we use a module-level cache that is populated by the API route
 * (`/api/internal/maintenance`) on first load and invalidated on admin toggle.
 * Under `next start` (PM2), middleware and API routes share the same Node process,
 * so this in-memory value is consistent.
 *
 * For multi-instance deployments, each instance has at most a 30s stale window
 * (the same as the previous fetch-based approach, but without the self-fetch risk).
 */

export interface MaintenanceState {
  enabled: boolean;
  until: string | null;
  ts: number;
}

const CACHE_TTL = 30_000; // 30 seconds

// Shared global to survive HMR in dev and work across modules in production
const globalKey = "__bpi_maintenance_cache__" as const;

declare global {
  // eslint-disable-next-line no-var
  var __bpi_maintenance_cache__: MaintenanceState | null | undefined;
}

function getCache(): MaintenanceState | null {
  return (globalThis as any)[globalKey] ?? null;
}

function setCache(state: MaintenanceState): void {
  (globalThis as any)[globalKey] = state;
}

/**
 * Get the cached maintenance state if fresh (< 30s old).
 * Returns `null` if cache is stale or empty.
 */
export function getCachedMaintenanceState(): MaintenanceState | null {
  const cached = getCache();
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL) return null;
  return cached;
}

/**
 * Update the shared maintenance cache. Called from the API route after DB read.
 */
export function updateMaintenanceCache(enabled: boolean, until: string | null): void {
  setCache({ enabled, until, ts: Date.now() });
}

/**
 * Invalidate the cache immediately (called after admin toggle).
 */
export function invalidateMaintenanceCache(): void {
  (globalThis as any)[globalKey] = null;
}
