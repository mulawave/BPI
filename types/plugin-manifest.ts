import type { PluginCapability } from "@/types/plugin-capabilities";

export type PluginCategory =
  | "integration"
  | "reporting"
  | "admin-tools"
  | "automation"
  | "content"
  | "analytics";

export type PluginManifest = {
  $schemaVersion: "1.0";
  pluginId: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  author: PluginContact;
  support?: PluginSupport;
  compatibility: {
    minAppVersion: string;
    maxAppVersion: string;
    pluginSdkVersion: string;
  };
  capabilities: PluginCapability[];
  ui?: {
    adminNav?: {
      label: string;
      icon: string;
      placement: string;
    };
    adminPage?: {
      title: string;
      schemaPath: string;
    };
  };
  settings?: {
    schemaPath: string;
    requiredSecrets?: string[];
  };
  integrations?: {
    outboundHttp?: boolean;
    webhooks?: Array<{
      key: string;
      direction: "inbound" | "outbound";
      pathOrUrl: string;
      signatureMode?: string;
    }>;
  };
  health?: {
    type?: "config-only" | "config-and-connectivity";
  };
  dependencies?: Array<{
    pluginId: string;
    versionRange: string;
  }>;
  checksums: {
    manifestSha256: string;
    archiveSha256: string;
  };
  signature?: {
    algorithm: "ed25519";
    keyId: string;
    signaturePath: string;
  };
};

export type PluginContact = {
  name: string;
  website?: string;
  email?: string;
};

export type PluginSupport = {
  url?: string;
  email?: string;
};
