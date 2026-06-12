/**
 * Shared maintenance-mode state (Edge-compatible — no Node.js APIs).
 *
 * This module uses only `globalThis` so it can be safely imported by Next.js
 * middleware (which is bundled for Edge runtime during `next build`).
 *
 * The state is populated by:
 * - `instrumentation.ts` at server startup (reads DB → sets globalThis)
 * - `/api/internal/maintenance` POST handler on admin toggle
 *
 * Under `next start` (PM2), middleware and API routes share the same Node process,
 * so the globalThis value is consistent within a single PM2 instance.
 */

export interface MaintenanceState {
  enabled: boolean;
  until: string | null;
  ts: number;
}

// No strict TTL — the cache is populated at server start (instrumentation.ts)
// and refreshed on admin toggle (POST /api/internal/maintenance). Using a very
// long TTL as a safety net; in practice, invalidation is event-driven.
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (effectively "never expires")

const globalKey = "__bpi_maintenance_cache__" as const;

declare global {
  // eslint-disable-next-line no-var
  var __bpi_maintenance_cache__: MaintenanceState | null | undefined;
}

/**
 * Get the cached maintenance state if fresh (< 30s old).
 * Returns `null` if cache is stale or empty.
 */
export function getCachedMaintenanceState(): MaintenanceState | null {
  const cached = (globalThis as any)[globalKey] as MaintenanceState | null | undefined;
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL) return null;
  return cached;
}

/**
 * Update the shared maintenance cache. Called from the API route after DB read
 * and from instrumentation.ts at server startup.
 */
export function updateMaintenanceCache(enabled: boolean, until: string | null): void {
  (globalThis as any)[globalKey] = { enabled, until, ts: Date.now() } as MaintenanceState;
}

/**
 * Invalidate the cache immediately (called on admin toggle before re-reading DB).
 */
export function invalidateMaintenanceCache(): void {
  (globalThis as any)[globalKey] = null;
}
