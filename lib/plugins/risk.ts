import { getPluginCapabilityCatalog } from "@/lib/plugins/capabilities";
import type { PluginCapability, PluginCapabilityRiskLevel } from "@/types/plugin-capabilities";

const CAPABILITY_RISK_MAP = new Map<PluginCapability, PluginCapabilityRiskLevel>(
  getPluginCapabilityCatalog().map((item) => [item.id, item.riskLevel]),
);

export function getCapabilityRiskLevel(capability: PluginCapability): PluginCapabilityRiskLevel {
  return CAPABILITY_RISK_MAP.get(capability) ?? "MEDIUM";
}
