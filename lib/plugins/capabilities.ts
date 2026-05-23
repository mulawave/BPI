import {
  PLUGIN_CAPABILITIES,
  type PluginCapability,
  type PluginCapabilityDefinition,
} from "@/types/plugin-capabilities";

const DEFINITIONS: Record<PluginCapability, PluginCapabilityDefinition> = {
  "register-admin-nav-item": {
    id: "register-admin-nav-item",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Registers one admin navigation entry under host-controlled plugin areas.",
  },
  "register-admin-page": {
    id: "register-admin-page",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Registers one host-rendered declarative admin page.",
  },
  "register-admin-settings-section": {
    id: "register-admin-settings-section",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Registers one host-rendered plugin settings section.",
  },
  "read-users-summary": {
    id: "read-users-summary",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Requests access to host-provided user summary aggregates.",
  },
  "read-referrals-summary": {
    id: "read-referrals-summary",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Requests access to host-provided referral summary aggregates.",
  },
  "read-payments-summary": {
    id: "read-payments-summary",
    riskLevel: "HIGH",
    approvalRequired: true,
    auditRequired: true,
    summary: "Requests access to host-provided payment summary aggregates.",
  },
  "read-analytics-summary": {
    id: "read-analytics-summary",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Requests access to host-provided analytics summary aggregates.",
  },
  "read-plugin-settings": {
    id: "read-plugin-settings",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Reads plugin-scoped settings within host boundaries.",
  },
  "write-plugin-settings": {
    id: "write-plugin-settings",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Writes plugin-scoped settings within host boundaries.",
  },
  "access-third-party-api": {
    id: "access-third-party-api",
    riskLevel: "HIGH",
    approvalRequired: true,
    auditRequired: true,
    summary: "Declares intent to call approved third-party APIs.",
  },
  "declare-webhook-endpoint": {
    id: "declare-webhook-endpoint",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Declares webhook metadata for host-managed integration.",
  },
  "declare-background-job": {
    id: "declare-background-job",
    riskLevel: "MEDIUM",
    approvalRequired: true,
    auditRequired: true,
    summary: "Declares background job metadata (storage only in phase one).",
  },
  "emit-plugin-health": {
    id: "emit-plugin-health",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Declares health/readiness reporting metadata.",
  },
  "write-plugin-audit-log": {
    id: "write-plugin-audit-log",
    riskLevel: "LOW",
    approvalRequired: true,
    auditRequired: true,
    summary: "Declares plugin-scoped audit event metadata.",
  },
};

export function getPluginCapabilityCatalog(): PluginCapabilityDefinition[] {
  return PLUGIN_CAPABILITIES.map((capability) => DEFINITIONS[capability]);
}

export function isKnownPluginCapability(value: string): value is PluginCapability {
  return (PLUGIN_CAPABILITIES as readonly string[]).includes(value);
}
