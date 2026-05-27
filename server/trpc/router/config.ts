import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { FirebaseOptions } from "firebase/app";

const CONFIG_CACHE_TTL_MS = 45_000;

let featureTogglesCache: { value: Record<string, boolean>; expiresAt: number } | null = null;
let featureTogglesInFlight: Promise<Record<string, boolean>> | null = null;

let publicSettingsCache: { value: Record<string, any>; expiresAt: number } | null = null;
let publicSettingsInFlight: Promise<Record<string, any>> | null = null;

let firebaseConfigCache: { value: FirebaseConfigResponse; expiresAt: number } | null = null;
let firebaseConfigInFlight: Promise<FirebaseConfigResponse> | null = null;

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

const firebaseSettingKeys = {
  apiKey: "firebase_api_key",
  authDomain: "firebase_auth_domain",
  projectId: "firebase_project_id",
  storageBucket: "firebase_storage_bucket",
  messagingSenderId: "firebase_messaging_sender_id",
  appId: "firebase_app_id",
  measurementId: "firebase_measurement_id",
} as const;

type FirebaseKey = keyof typeof firebaseSettingKeys;

type FirebaseConfigResponse = {
  config: FirebaseOptions;
  source: "db" | "env" | "mixed";
  missing: FirebaseKey[];
};

export const configRouter = createTRPCRouter({
  getFeatureToggles: publicProcedure.query(async () => {
    if (featureTogglesCache && isFresh(featureTogglesCache.expiresAt)) {
      return {
        enableEpcEpp: featureTogglesCache.value.enableEpcEpp ?? false,
        enableSolarAssessment: featureTogglesCache.value.enableSolarAssessment ?? false,
        enableBestDeals: featureTogglesCache.value.enableBestDeals ?? false,
        enableBpiCalculator: featureTogglesCache.value.enableBpiCalculator ?? true,
        enableDigitalFarm: featureTogglesCache.value.enableDigitalFarm ?? false,
        enableTrainingCenter: featureTogglesCache.value.enableTrainingCenter ?? true,
        enablePromotionalMaterials: featureTogglesCache.value.enablePromotionalMaterials ?? true,
        enableLatestUpdates: featureTogglesCache.value.enableLatestUpdates ?? true,
      };
    }

    if (!featureTogglesInFlight) {
      featureTogglesInFlight = (async () => {
    const toggleKeys = [
      "enableEpcEpp",
      "enableSolarAssessment",
      "enableBestDeals",
      "enableBpiCalculator",
      "enableDigitalFarm",
      "enableTrainingCenter",
      "enablePromotionalMaterials",
      "enableLatestUpdates",
    ];

    const settings = await prisma.adminSettings.findMany({
      where: { settingKey: { in: toggleKeys } },
      select: { settingKey: true, settingValue: true },
    });

    const settingsMap = settings.reduce((acc: Record<string, boolean>, setting) => {
      acc[setting.settingKey] = setting.settingValue === "true";
      return acc;
    }, {});

        featureTogglesCache = {
          value: settingsMap,
          expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
        };

        return settingsMap;
      })().finally(() => {
        featureTogglesInFlight = null;
      });
    }

    const settingsMap = await featureTogglesInFlight;

    return {
      enableEpcEpp: settingsMap.enableEpcEpp ?? false,
      enableSolarAssessment: settingsMap.enableSolarAssessment ?? false,
      enableBestDeals: settingsMap.enableBestDeals ?? false,
      enableBpiCalculator: settingsMap.enableBpiCalculator ?? true,
      enableDigitalFarm: settingsMap.enableDigitalFarm ?? false,
      enableTrainingCenter: settingsMap.enableTrainingCenter ?? true,
      enablePromotionalMaterials: settingsMap.enablePromotionalMaterials ?? true,
      enableLatestUpdates: settingsMap.enableLatestUpdates ?? true,
    };
  }),
  getPublicSettings: publicProcedure.query(async () => {
    if (publicSettingsCache && isFresh(publicSettingsCache.expiresAt)) {
      return publicSettingsCache.value;
    }

    if (!publicSettingsInFlight) {
      publicSettingsInFlight = (async () => {
    const publicSettingKeys = [
      "bank_name",
      "bank_account_number",
      "bank_account_name",
      "company_address",
      "company_email",
      "company_phone",
      "social_facebook",
      "social_twitter",
      "social_instagram",
      "social_linkedin",
      "social_youtube",
    ];

    const settings = await prisma.adminSettings.findMany({
      where: { settingKey: { in: publicSettingKeys } },
      orderBy: { settingKey: "asc" },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsMap[setting.settingKey] = {
        value: setting.settingValue,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
    });

        publicSettingsCache = {
          value: settingsMap,
          expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
        };

        return settingsMap;
      })().finally(() => {
        publicSettingsInFlight = null;
      });
    }

    return publicSettingsInFlight;
  }),
  getFirebaseConfig: publicProcedure.query(async (): Promise<FirebaseConfigResponse> => {
    if (firebaseConfigCache && isFresh(firebaseConfigCache.expiresAt)) {
      return firebaseConfigCache.value;
    }

    if (!firebaseConfigInFlight) {
      firebaseConfigInFlight = (async (): Promise<FirebaseConfigResponse> => {
    const settingKeys = Object.values(firebaseSettingKeys);

    const settings = await prisma.adminSettings.findMany({
      where: { settingKey: { in: settingKeys } },
    });

    const dbValues: Partial<Record<FirebaseKey, string | null>> = {};
    settings.forEach((setting) => {
      const key = (Object.entries(firebaseSettingKeys).find(([, v]) => v === setting.settingKey)?.[0] ?? null) as
        | FirebaseKey
        | null;
      if (!key) return;
      dbValues[key] = setting.settingValue;
    });

    const envValues: Record<FirebaseKey, string | undefined> = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const finalConfig: FirebaseOptions = {};
    let source: FirebaseConfigResponse["source"] = "env";

    (Object.keys(firebaseSettingKeys) as FirebaseKey[]).forEach((key) => {
      const dbVal = dbValues[key];
      const envVal = envValues[key];
      const value = (dbVal ?? envVal ?? "").trim();
      (finalConfig as any)[key] = value || undefined;
      if (dbVal) {
        source = source === "env" ? "db" : "mixed";
      } else if (envVal && source === "env") {
        source = "env";
      }
    });

    const requiredKeys = (Object.keys(firebaseSettingKeys) as FirebaseKey[]).filter(
      (key) => key !== "measurementId"
    );
    const missing = requiredKeys.filter((key) => !finalConfig[key]);

        const response = {
      config: finalConfig,
      source,
      missing,
    };

        firebaseConfigCache = {
          value: response,
          expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
        };

        return response;
      })().finally(() => {
        firebaseConfigInFlight = null;
      });
    }

    return firebaseConfigInFlight;
  }),
});
