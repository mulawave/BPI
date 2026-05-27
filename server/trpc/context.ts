import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import type { Context } from "./trpc";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getClientIp } from "@/lib/rateLimit";

export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  let sessionResolved = false;

  const getSession = async () => {
    if (!sessionResolved) {
      session = await auth();
      sessionResolved = true;
    }
    return session;
  };

  const clientIp = getClientIp(opts.req);
  return { session, getSession, prisma, clientIp };
}
