import { describe, it } from "node:test";
import assert from "node:assert";
import { derivePluginStatusFromReadiness, evaluatePluginReadiness } from "@/lib/plugins/readiness";
import { assertPluginLifecycleAccess } from "@/lib/adminAuth";

describe("plugin install lifecycle authorization", () => {
  it("allows install action for admin role", () => {
    assert.doesNotThrow(() => {
      assertPluginLifecycleAccess({ user: { role: "admin" }, action: "install" });
    });
  });

  it("allows install action for super admin role", () => {
    assert.doesNotThrow(() => {
      assertPluginLifecycleAccess({ user: { role: "super_admin" }, action: "install" });
    });
  });

  it("allows disable action for admin role", () => {
    assert.doesNotThrow(() => {
      assertPluginLifecycleAccess({ user: { role: "admin" }, action: "disable" });
    });
  });

  it("allows uninstall action for admin role", () => {
    assert.doesNotThrow(() => {
      assertPluginLifecycleAccess({ user: { role: "admin" }, action: "uninstall" });
    });
  });

  it("allows remove action for admin role", () => {
    assert.doesNotThrow(() => {
      assertPluginLifecycleAccess({ user: { role: "admin" }, action: "remove" });
    });
  });
});

describe("plugin lifecycle readiness", () => {
  it("returns CONFIG_REQUIRED when required secret is missing", () => {
    const report = evaluatePluginReadiness({
      status: "CONFIG_REQUIRED",
      installedVersionId: "version-1",
      requestedCapabilities: ["register-admin-page"],
      approvedCapabilities: ["register-admin-page"],
      manifestSnapshot: {
        settings: {
          requiredSecrets: ["CRM_API_KEY"],
        },
      },
      settings: [{ key: "apiKeyRef", valueJson: "secret://CRM_API_KEY", isSecretRef: true }],
      secrets: [],
    });

    assert.strictEqual(report.ready, false);
    assert.strictEqual(report.state, "CONFIG_REQUIRED");
    assert.ok(report.reasons.some((reason) => reason.includes("Missing required secrets")));
  });

  it("returns READY when required settings and approvals are complete", () => {
    const report = evaluatePluginReadiness({
      status: "INSTALLED",
      installedVersionId: "version-1",
      requestedCapabilities: ["register-admin-page", "write-plugin-settings"],
      approvedCapabilities: ["register-admin-page", "write-plugin-settings"],
      manifestSnapshot: {
        settings: {
          requiredSecrets: ["CRM_API_KEY"],
        },
      },
      settings: [{ key: "apiKeyRef", valueJson: "secret://CRM_API_KEY", isSecretRef: true }],
      secrets: [{ secretKey: "CRM_API_KEY" }],
    });

    assert.strictEqual(report.ready, true);
    assert.strictEqual(report.state, "READY");
    assert.deepStrictEqual(report.reasons, []);
  });

  it("recovers from CONFIG_REQUIRED once missing secrets are supplied", () => {
    const report = evaluatePluginReadiness({
      status: "CONFIG_REQUIRED",
      installedVersionId: "version-1",
      requestedCapabilities: ["register-admin-page"],
      approvedCapabilities: ["register-admin-page"],
      manifestSnapshot: {
        settings: {
          requiredSecrets: ["CRM_API_KEY"],
        },
      },
      settings: [{ key: "apiKeyRef", valueJson: "secret://CRM_API_KEY", isSecretRef: true }],
      secrets: [{ secretKey: "CRM_API_KEY" }],
    });

    assert.strictEqual(report.ready, true);
    assert.strictEqual(report.state, "READY");
  });

  it("derives CONFIG_REQUIRED only when readiness still needs configuration", () => {
    const blocked = derivePluginStatusFromReadiness({
      currentStatus: "INSTALLED",
      installedVersionId: "version-1",
      readiness: {
        ready: false,
        state: "CONFIG_REQUIRED",
        reasons: ["Missing required secrets from manifest: CRM_API_KEY."],
        checks: {
          hasInstalledVersion: true,
          hasCapabilityApprovals: true,
          hasRequiredSecrets: false,
          hasNoBlockingStatus: true,
        },
      },
    });

    const ready = derivePluginStatusFromReadiness({
      currentStatus: "CONFIG_REQUIRED",
      installedVersionId: "version-1",
      readiness: {
        ready: true,
        state: "READY",
        reasons: [],
        checks: {
          hasInstalledVersion: true,
          hasCapabilityApprovals: true,
          hasRequiredSecrets: true,
          hasNoBlockingStatus: true,
        },
      },
    });

    assert.strictEqual(blocked, "CONFIG_REQUIRED");
    assert.strictEqual(ready, "INSTALLED");
  });
});
