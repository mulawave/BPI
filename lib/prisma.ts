import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const isProd = process.env.NODE_ENV === "production";
const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";
const isServer = typeof window === "undefined";

const PRISMA_BUILD_IDLE_DISCONNECT_MS = 10_000;

const createClient = () =>
  new PrismaClient({
    log: isProd ? ["error"] : ["error", "warn"],
  });

const prisma = globalForPrisma.prisma ?? createClient();

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
