// Lightweight shared auth caches. This module is imported by server/auth.ts
// (which holds the real auth logic) and by tRPC routers that need to invalidate
// these caches after mutating users. Keeping it separate avoids pulling the full
// NextAuth bundle into tRPC router bundles and prevents circular imports.

const AUTH_USER_LOOKUP_TTL_MS = 60_000;
const AUTH_DB_CACHE_TTL_MS = 5 * 60 * 1000;

const authUserLookupCache = new Map<string, { value: any; expiresAt: number }>();
const authUserLookupInFlight = new Map<string, Promise<any>>();

const authEnrichmentCache = new Map<
  string,
  {
    value: {
      role: string;
      hasActiveMembership: boolean;
      membershipExpiresAt: string | null;
      membershipDerivedFromActivation: boolean;
      hasActiveEmpowerment: boolean;
      forcePasswordReset: boolean;
    };
    expiresAt: number;
  }
>();
const authEnrichmentInFlight = new Map<string, Promise<any>>();

export function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

export function getAuthUserLookupCache() {
  return { cache: authUserLookupCache, inFlight: authUserLookupInFlight };
}

export function getAuthEnrichmentCache() {
  return { cache: authEnrichmentCache, inFlight: authEnrichmentInFlight };
}

export function invalidateAuthUserLookup(email: string) {
  const key = email.trim().toLowerCase();
  authUserLookupCache.delete(key);
  authUserLookupInFlight.delete(key);
}

export function invalidateAuthEnrichment(userId: string) {
  authEnrichmentCache.delete(userId);
  authEnrichmentInFlight.delete(userId);
}
