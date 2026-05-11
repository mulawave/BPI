import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { requireSuperAdmin } from "@/server/utils/adminAuth";

const ORIGINAL_ENV = { ...process.env };
const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function makeSession(role?: "admin" | "super_admin") {
  if (!role) return null;
  return {
    user: {
      id: `user-${role}`,
      email: `${role}@example.com`,
      name: role,
      role,
    },
    expires: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

beforeEach(() => {
  resetEnv();
});

afterEach(() => {
  resetEnv();
});

describe("Admin destructive permission boundaries", () => {
  it("wires createBackup to superAdminProcedure", () => {
    assert.match(adminRouterSource, /createBackup:\s*superAdminProcedure/);
  });

  it("wires wipeNonEssentialData to superAdminProcedure", () => {
    assert.match(adminRouterSource, /wipeNonEssentialData:\s*superAdminProcedure/);
  });

  it("rejects unauthenticated sessions at the super-admin guard", () => {
    assert.throws(
      () => requireSuperAdmin({ session: makeSession(undefined) as any }),
      /UNAUTHORIZED/i,
    );
  });

  it("rejects regular admins at the super-admin guard", () => {
    assert.throws(
      () => requireSuperAdmin({ session: makeSession("admin") as any }),
      /FORBIDDEN/i,
    );
  });

  it("allows super_admin sessions through the super-admin guard", () => {
    const result = requireSuperAdmin({ session: makeSession("super_admin") as any });
    assert.strictEqual(result.role, "super_admin");
  });
});