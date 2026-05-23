import { z } from "zod";
import { PLUGIN_CAPABILITIES } from "@/types/plugin-capabilities";
import {
  PLUGIN_ALLOWED_CATEGORIES,
  PLUGIN_ALLOWED_NAV_ICONS,
  PLUGIN_ALLOWED_NAV_PLACEMENTS,
  PLUGIN_SCHEMA_VERSION,
} from "@/lib/plugins/constants";
import type { PluginManifest } from "@/types/plugin-manifest";

const pluginManifestSchema = z.object({
  $schemaVersion: z.literal(PLUGIN_SCHEMA_VERSION),
  pluginId: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(120),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/),
  description: z.string().min(1).max(1000),
  category: z
    .string()
    .refine((value) => PLUGIN_ALLOWED_CATEGORIES.includes(value as (typeof PLUGIN_ALLOWED_CATEGORIES)[number]), {
      message: "Unsupported plugin category",
    }),
  author: z.object({
    name: z.string().min(1).max(120),
    website: z.string().url().optional(),
    email: z.string().email().optional(),
  }),
  support: z
    .object({
      url: z.string().url().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  compatibility: z.object({
    minAppVersion: z.string().min(1),
    maxAppVersion: z.string().min(1),
    pluginSdkVersion: z.string().min(1),
  }),
  capabilities: z
    .array(
      z.string().refine(
        (value) => (PLUGIN_CAPABILITIES as readonly string[]).includes(value),
        "Unsupported capability",
      ),
    )
    .min(1),
  ui: z
    .object({
      adminNav: z
        .object({
          label: z.string().min(1).max(80),
          icon: z
            .string()
            .refine(
              (value) => (PLUGIN_ALLOWED_NAV_ICONS as readonly string[]).includes(value),
              "Unsupported admin navigation icon",
            ),
          placement: z
            .string()
            .refine(
              (value) => (PLUGIN_ALLOWED_NAV_PLACEMENTS as readonly string[]).includes(value),
              "Unsupported admin navigation placement",
            ),
        })
        .optional(),
      adminPage: z
        .object({
          title: z.string().min(1).max(120),
          schemaPath: z.string().regex(/^[A-Za-z0-9._/-]+\.json$/),
        })
        .optional(),
    })
    .optional(),
  settings: z
    .object({
      schemaPath: z.string().regex(/^[A-Za-z0-9._/-]+\.json$/),
      requiredSecrets: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).optional(),
    })
    .optional(),
  integrations: z
    .object({
      outboundHttp: z.boolean().optional(),
      webhooks: z
        .array(
          z.object({
            key: z.string().min(1),
            direction: z.enum(["inbound", "outbound"]),
            pathOrUrl: z.string().min(1),
            signatureMode: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  health: z
    .object({
      type: z.enum(["config-only", "config-and-connectivity"]).optional(),
    })
    .optional(),
  dependencies: z
    .array(
      z.object({
        pluginId: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/),
        versionRange: z.string().min(1),
      }),
    )
    .optional(),
  checksums: z.object({
    manifestSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
    archiveSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
  }),
  signature: z
    .object({
      algorithm: z.literal("ed25519"),
      keyId: z.string().min(1),
      signaturePath: z.string().regex(/^[A-Za-z0-9._/-]+\.json$/),
    })
    .optional(),
});

export type PluginManifestSchema = z.infer<typeof pluginManifestSchema>;

export function parsePluginManifest(input: unknown): {
  success: true;
  manifest: PluginManifest;
} | {
  success: false;
  errors: string[];
} {
  const parsed = pluginManifestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`),
    };
  }

  return { success: true, manifest: parsed.data as PluginManifest };
}
