import { getDevelopmentFallbackUrl } from "@/lib/startupValidation";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

export function getConfiguredEnvUrl() {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  );
}

function getFallbackUrl(envUrl: string) {
  if (envUrl) {
    return envUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return getDevelopmentFallbackUrl();
  }

  throw new Error(
    "APP_URL_CONFIG_ERROR: App base URL is not configured. Set NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, or VERCEL_URL. Production must not rely on admin setting app_base_url."
  );
}

let cachedBaseUrl: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
const isBuild = !!process.env.NEXT_PHASE && process.env.NEXT_PHASE.includes("build");

export async function resolveAppBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedBaseUrl && now - cachedAt < CACHE_TTL_MS) {
    return cachedBaseUrl;
  }

  const envUrl = getConfiguredEnvUrl();

  if (process.env.NODE_ENV === "production") {
    const fallback = getFallbackUrl(envUrl);
    cachedBaseUrl = fallback;
    cachedAt = now;
    return fallback;
  }

  if (isBuild) {
    const fallback = envUrl || getDevelopmentFallbackUrl();
    cachedBaseUrl = fallback;
    cachedAt = now;
    return fallback;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.adminSettings.findFirst({
      where: { settingKey: "app_base_url" },
      select: { settingValue: true },
    });

    const fromSetting = normalizeUrl(setting?.settingValue || "");
    if (fromSetting) {
      cachedBaseUrl = fromSetting;
      cachedAt = now;
      return fromSetting;
    }
  } catch (error) {
    console.error("[resolveAppBaseUrl] Failed to read admin setting:", error);
  }

  const fallback = getFallbackUrl(envUrl);
  cachedBaseUrl = fallback;
  cachedAt = now;
  return fallback;
}
