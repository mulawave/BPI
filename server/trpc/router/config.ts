import { createTRPCRouter, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { FirebaseOptions } from "firebase/app";

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
  getFirebaseConfig: publicProcedure.query(async (): Promise<FirebaseConfigResponse> => {
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

    return {
      config: finalConfig,
      source,
      missing,
    };
  }),
});
