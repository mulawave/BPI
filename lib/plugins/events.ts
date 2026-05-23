export const PLUGIN_EVENT_SUMMARIES = {
  UPLOADED: "Plugin artifact uploaded",
  VALIDATED: "Plugin artifact validated",
  VALIDATION_FAILED: "Plugin validation failed",
  INSTALLED: "Plugin installed",
  CONFIG_UPDATED: "Plugin configuration updated",
  DISABLED: "Plugin disabled",
  REMOVED: "Plugin removed",
  ERROR_RECORDED: "Plugin error recorded",
} as const;

export type PluginEventType = keyof typeof PLUGIN_EVENT_SUMMARIES;

export function defaultPluginEventSummary(eventType: PluginEventType): string {
  return PLUGIN_EVENT_SUMMARIES[eventType] ?? "Plugin lifecycle event";
}
