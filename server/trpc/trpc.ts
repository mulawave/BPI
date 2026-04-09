import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { authLimiter, passwordResetLimiter } from "@/lib/rateLimit";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
      }
    };
  }
});

export type Context = {
  session: Awaited<ReturnType<typeof import("../auth").auth>>;
  prisma: typeof import("@/lib/prisma").prisma;
  clientIp: string;
};

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = ctx.session;
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return next({ ctx: { ...ctx, user: session.user } });
});

/** Rate-limited public procedure for auth endpoints (login, register) */
export const rateLimitedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const result = authLimiter.check(ctx.clientIp);
  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
  return next();
});

/** Stricter rate-limited procedure for password reset */
export const passwordResetProcedure = t.procedure.use(async ({ ctx, next }) => {
  const result = passwordResetLimiter.check(ctx.clientIp);
  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
  return next();
});
