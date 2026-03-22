import { appRouter } from "@/server/trpc/router/_app";
import { createContext } from "@/server/trpc/context";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const dynamic = "force-dynamic";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    // CRITICAL: Prevent ANY reverse-proxy, CDN, or browser HTTP cache from
    // caching user-specific tRPC responses. Without this a cached response
    // for User A can be served verbatim to User B on the same server.
    responseMeta() {
      return {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          "Pragma": "no-cache",
          "Surrogate-Control": "no-store",
        },
      };
    },
  });

export { handler as GET, handler as POST };
