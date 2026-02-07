import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const isServer = typeof window === "undefined";

const createClient = () =>
  new PrismaClient({
    log: isProd ? ["error"] : ["error", "warn"],
  });

// During `next build` we never want to open a DB handle. Return a proxy that
// throws if anything tries to touch Prisma while prerendering.
const prisma = isBuild
  ? (new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          "Prisma access during build is not allowed. Move DB calls out of build-time code.",
        );
      },
    }) as PrismaClient)
  : globalForPrisma.prisma ?? createClient();

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
