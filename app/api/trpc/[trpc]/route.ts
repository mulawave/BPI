import { appRouter } from "@/server/trpc/router/_app";
import { createContext } from "@/server/trpc/context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const dynamic = "force-dynamic";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext
  });

export { handler as GET, handler as POST };
