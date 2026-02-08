import { prisma } from "@/lib/prisma";

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

export async function resolveAppBaseUrl(): Promise<string> {
  try {
    const setting = await prisma.adminSettings.findFirst({
      where: { settingKey: "app_base_url" },
      select: { settingValue: true },
    });

    const fromSetting = normalizeUrl(setting?.settingValue || "");
    if (fromSetting) return fromSetting;
  } catch (error) {
    console.error("[resolveAppBaseUrl] Failed to read admin setting:", error);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://beepagro.com";
}
