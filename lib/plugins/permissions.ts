import { isKnownPluginCapability } from "@/lib/plugins/capabilities";
import { getCapabilityRiskLevel } from "@/lib/plugins/risk";
import type { PluginCapability } from "@/types/plugin-capabilities";

export type PluginPermissionGrantDraft = {
  capability: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  approved: boolean;
};

export function normalizeRequestedCapabilities(capabilities: string[]): PluginCapability[] {
  const deduped = Array.from(new Set(capabilities));
  return deduped.filter((capability): capability is PluginCapability => isKnownPluginCapability(capability));
}

export function buildPermissionGrantDrafts(input: {
  requestedCapabilities: string[];
  approvedCapabilities: string[];
}): PluginPermissionGrantDraft[] {
  const requested = normalizeRequestedCapabilities(input.requestedCapabilities);
  const approvedSet = new Set(input.approvedCapabilities);

  return requested.map((capability) => ({
    capability,
    riskLevel: getCapabilityRiskLevel(capability),
    approved: approvedSet.has(capability),
  }));
}
