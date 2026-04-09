const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

let cachedBaseUrl: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
const isBuild = !!process.env.NEXT_PHASE && process.env.NEXT_PHASE.includes("build");

export async function resolveAppBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedBaseUrl && now - cachedAt < CACHE_TTL_MS) {
    return cachedBaseUrl;
  }

  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (isBuild) {
    const fallback = envUrl || "https://beepagro.com";
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

  const fallback = envUrl || "https://beepagro.com";
  cachedBaseUrl = fallback;
  cachedAt = now;
  return fallback;
}
