import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const isProd = process.env.NODE_ENV === "production";
const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";
const isServer = typeof window === "undefined";

const PRISMA_BUILD_IDLE_DISCONNECT_MS = 10_000;
const DEFAULT_CONNECTION_LIMIT = 30;
const DEFAULT_POOL_TIMEOUT = 45;
const MIN_RECOMMENDED_CONNECTION_LIMIT = 15;
const MIN_RECOMMENDED_POOL_TIMEOUT = 20;

function normalizeDatabaseUrl(urlValue: string) {
  try {
    const url = new URL(urlValue);
    const connectionLimitRaw = url.searchParams.get("connection_limit");
    const poolTimeoutRaw = url.searchParams.get("pool_timeout");

    const connectionLimit = connectionLimitRaw ? Number(connectionLimitRaw) : null;
    const poolTimeout = poolTimeoutRaw ? Number(poolTimeoutRaw) : null;

    const effectiveConnectionLimit =
      connectionLimit && Number.isFinite(connectionLimit)
        ? Math.max(connectionLimit, DEFAULT_CONNECTION_LIMIT)
        : DEFAULT_CONNECTION_LIMIT;

    const effectivePoolTimeout =
      poolTimeout && Number.isFinite(poolTimeout)
        ? Math.max(poolTimeout, DEFAULT_POOL_TIMEOUT)
        : DEFAULT_POOL_TIMEOUT;

    url.searchParams.set("connection_limit", String(effectiveConnectionLimit));
    url.searchParams.set("pool_timeout", String(effectivePoolTimeout));

    return url.toString();
  } catch {
    return urlValue;
  }
}

function parseDatabasePoolConfig(urlValue: string) {
  try {
    const url = new URL(urlValue);
    const connectionLimitRaw = url.searchParams.get("connection_limit");
    const poolTimeoutRaw = url.searchParams.get("pool_timeout");

    const connectionLimit = connectionLimitRaw ? Number(connectionLimitRaw) : null;
    const poolTimeout = poolTimeoutRaw ? Number(poolTimeoutRaw) : null;

    return {
      connectionLimit,
      poolTimeout,
    };
  } catch {
    return {
      connectionLimit: null,
      poolTimeout: null,
    };
  }
}

function warnOnUnsafePoolConfig() {
  if (!isServer) return;

  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl) return;

  const { connectionLimit, poolTimeout } = parseDatabasePoolConfig(rawDbUrl);

  if (connectionLimit !== null && connectionLimit < MIN_RECOMMENDED_CONNECTION_LIMIT) {
    console.warn(
      `[prisma] DATABASE_URL connection_limit=${connectionLimit} is low for burst traffic. ` +
        `Recommended >= ${MIN_RECOMMENDED_CONNECTION_LIMIT}.`
    );
  }

  if (poolTimeout !== null && poolTimeout < MIN_RECOMMENDED_POOL_TIMEOUT) {
    console.warn(
      `[prisma] DATABASE_URL pool_timeout=${poolTimeout}s may cause avoidable timeout failures under load. ` +
        `Recommended >= ${MIN_RECOMMENDED_POOL_TIMEOUT}s.`
    );
  }

  if (connectionLimit === null || poolTimeout === null) {
    console.warn(
      "[prisma] DATABASE_URL is missing connection_limit and/or pool_timeout. " +
        `Recommended params: connection_limit=${MIN_RECOMMENDED_CONNECTION_LIMIT} and pool_timeout=${MIN_RECOMMENDED_POOL_TIMEOUT}.`
    );
  }
}

function ensureRuntimePoolConfig() {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl) return;

  const normalizedDbUrl = normalizeDatabaseUrl(rawDbUrl);
  if (normalizedDbUrl !== rawDbUrl) {
    process.env.DATABASE_URL = normalizedDbUrl;
  }
}

ensureRuntimePoolConfig();

const createClient = () =>
  new PrismaClient({
    log: isProd ? ["error"] : ["error", "warn"],
  });

const prisma = globalForPrisma.prisma ?? createClient();

if (!isBuild) {
  warnOnUnsafePoolConfig();
}

// During `npm run build`, Next can execute server code while prerendering.
// If Prisma gets initialized, its engine can keep open handles that prevent the
// build process from exiting. We allow Prisma usage but auto-disconnect after an
// idle period so `next build` can terminate cleanly.
if (isBuild && isServer) {
  let idleTimer: NodeJS.Timeout | null = null;
  let disconnecting = false;

  const scheduleIdleDisconnect = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
      if (disconnecting) return;
      disconnecting = true;
      try {
        await prisma.$disconnect();
      } catch {
        // ignore
      } finally {
        disconnecting = false;
      }
    }, PRISMA_BUILD_IDLE_DISCONNECT_MS);
    idleTimer.unref?.();
  };

  prisma.$use(async (params, next) => {
    const result = await next(params);
    scheduleIdleDisconnect();
    return result;
  });

  // Also schedule a disconnect even if Prisma was only imported.
  scheduleIdleDisconnect();
}

if (!isBuild && !isProd) {
  globalForPrisma.prisma = prisma;
}

// Gracefully disconnect on process termination (runtime only)
if (!isBuild && isServer) {
  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

export { prisma };
