import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const KEY_PREFIX = "bpi_live_";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Generate a new raw API key. Only the hash is stored; the raw key is shown once. */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const rawKey = `${KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    keyPrefix: rawKey.slice(0, KEY_PREFIX.length + 6),
  };
}

/** Verify a raw API key. Returns the ApiKey record if valid and active, otherwise null. */
export async function verifyApiKey(rawKey: string) {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) return null;
  const keyHash = hashApiKey(rawKey);
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey || !apiKey.isActive || apiKey.revokedAt) return null;
  // Fire-and-forget lastUsedAt update; not critical to request path
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return apiKey;
}

/** DB-based sliding-window rate limit: counts requests in the last 60 seconds. */
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - 60_000);
  const count = await prisma.apiRequestLog.count({
    where: { apiKeyId, createdAt: { gte: windowStart } },
  });
  return { allowed: count < limit, remaining: Math.max(0, limit - count) };
}

/** Record an API request in the audit log. */
export async function logApiRequest(params: {
  apiKeyId: string;
  endpoint: string;
  sscQueried?: string | null;
  matchedUserId?: string | null;
  status: number;
  ipAddress?: string | null;
}) {
  try {
    await prisma.apiRequestLog.create({
      data: {
        apiKeyId: params.apiKeyId,
        endpoint: params.endpoint,
        sscQueried: params.sscQueried ?? null,
        matchedUserId: params.matchedUserId ?? null,
        status: params.status,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("[API] Failed to log request:", e);
  }
}
