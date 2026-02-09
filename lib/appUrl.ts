import { prisma } from "@/lib/prisma";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

let cachedBaseUrl: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function resolveAppBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedBaseUrl && now - cachedAt < CACHE_TTL_MS) {
    return cachedBaseUrl;
  }

  try {
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

  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const fallback = envUrl || "https://beepagro.com";
  cachedBaseUrl = fallback;
  cachedAt = now;
  return fallback;
}
