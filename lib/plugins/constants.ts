import type { PluginCategory } from "@/types/plugin-manifest";

export const PLUGIN_SCHEMA_VERSION = "1.0" as const;

export const PLUGIN_ALLOWED_CATEGORIES: PluginCategory[] = [
  "integration",
  "reporting",
  "admin-tools",
  "automation",
  "content",
  "analytics",
];

export const PLUGIN_ALLOWED_NAV_ICONS = [
  "plug",
  "workflow",
  "settings",
  "shield",
  "bar-chart",
  "database",
  "globe",
  "file-text",
] as const;

export const PLUGIN_ALLOWED_NAV_PLACEMENTS = [
  "plugins",
  "integrations",
  "analytics",
  "settings",
] as const;

export const PLUGIN_ALLOWED_PAGE_BLOCKS = [
  "hero",
  "stat-grid",
  "info-panel",
  "config-form",
  "table",
  "alert",
  "empty-state",
  "external-link-card",
] as const;
