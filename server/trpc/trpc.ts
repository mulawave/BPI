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
  session: Awaited<ReturnType<typeof import("../auth").auth>> | null;
  getSession: () => Promise<Awaited<ReturnType<typeof import("../auth").auth>> | null>;
  prisma: typeof import("@/lib/prisma").prisma;
  clientIp: string;
};

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return next({ ctx: { ...ctx, session, user: session.user } });
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

/** Procedure that requires admin or super_admin role. */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required." });
  }
  return next();
});

/** Procedure that requires super_admin role. */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "super_admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Super admin access required." });
  }
  return next();
});

/** Procedure that allows admin, super_admin, and customer_rep roles. */
export const customerRepProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin" && role !== "customer_rep") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Customer rep access required." });
  }
  return next();
});
