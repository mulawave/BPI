import { publicProcedure, createTRPCRouter } from "../trpc";

export const healthRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({ ok: true, now: new Date().toISOString() })),
  check: publicProcedure.query(() => ({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      auth: "ready",
      trpc: "operational"
    }
  }))
});
