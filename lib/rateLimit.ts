/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });
 *   // Inside a route handler:
 *   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *   const { success, remaining, retryAfterMs } = limiter.check(ip);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60 000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests allowed within the window (default: 10) */
  max?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Milliseconds until the oldest request in the window expires (0 if not rate-limited) */
  retryAfterMs: number;
}

export function createRateLimiter(opts: RateLimiterOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 10;
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks (every 5 minutes)
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const cutoff = now - windowMs;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    cleanup();

    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= max) {
      const oldest = entry.timestamps[0]!;
      const retryAfterMs = oldest + windowMs - now;
      return {
        success: false,
        remaining: 0,
        retryAfterMs: Math.max(retryAfterMs, 0),
      };
    }

    // Record this request
    entry.timestamps.push(now);

    return {
      success: true,
      remaining: max - entry.timestamps.length,
      retryAfterMs: 0,
    };
  }

  /** Reset the limiter for a specific key (useful in tests). */
  function reset(key: string) {
    store.delete(key);
  }

  return { check, reset };
}

// ─── Pre-configured limiters for sensitive endpoints ────────────────────────

/** Auth endpoints: 10 attempts per minute */
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** Forgot-password / reset: 5 attempts per 15 minutes */
export const passwordResetLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5 });

/** Webhook endpoints: 60 per minute (legitimate gateways retry) */
export const webhookLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

/** Admin-only seed/migration endpoints: 3 per minute */
export const adminSeedLimiter = createRateLimiter({ windowMs: 60_000, max: 3 });

// ─── Helper to extract client IP from NextRequest ───────────────────────────

export function getClientIp(req: Request): string {
  const headers = req.headers;
  // x-forwarded-for may contain a comma-separated list; take the first (client) IP
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * Convenience: returns a 429 JSON Response if rate-limited, or null if allowed.
 * Usage:
 *   const blocked = applyRateLimit(req, authLimiter);
 *   if (blocked) return blocked;
 */
export function applyRateLimit(
  req: Request,
  limiter: ReturnType<typeof createRateLimiter>
): Response | null {
  const ip = getClientIp(req);
  const result = limiter.check(ip);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
        },
      }
    );
  }
  return null;
}
