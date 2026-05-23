export const PLUGIN_PAGE_BLOCK_TYPES = [
  "hero",
  "stat-grid",
  "section",
  "info-panel",
  "config-form",
  "table",
  "alert",
  "empty-state",
  "external-link-card",
] as const;

export type PluginPageBlockType = (typeof PLUGIN_PAGE_BLOCK_TYPES)[number];

export type PluginPageBlock = {
  type: PluginPageBlockType;
  [key: string]: unknown;
};

export type PluginPageSchema = {
  schemaVersion?: string;
  title?: string;
  blocks: PluginPageBlock[];
};
