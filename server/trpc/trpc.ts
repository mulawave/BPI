import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

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
};

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = ctx.session;
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return next({ ctx: { ...ctx, user: session.user } });
});
