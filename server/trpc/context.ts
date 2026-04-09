import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import type { Context } from "./trpc";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getClientIp } from "@/lib/rateLimit";

export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const session = await auth();
  const clientIp = getClientIp(opts.req);
  return { session, prisma, clientIp };
}
