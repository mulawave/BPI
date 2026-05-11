import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { adminRouter } from "@/server/trpc/router/admin";

type Role = "admin" | "super_admin" | undefined;

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function makeCaller(role: Role) {
  return adminRouter.createCaller({
    session: role
      ? {
          user: {
            id: `user-${role}`,
            email: `${role}@example.com`,
            name: role,
            role,
          },
          expires: new Date(Date.now() + 3_600_000).toISOString(),
        }
      : null,
    prisma: {} as any,
    clientIp: "127.0.0.1",
  } as any);
}

beforeEach(() => {
  resetEnv();
});

afterEach(() => {
  resetEnv();
});

describe("Admin destructive permission boundaries", () => {
  it("rejects unauthenticated callers from createBackup", async () => {
    const caller = makeCaller(undefined);
    await assert.rejects(caller.createBackup(), /logged in|UNAUTHORIZED/i);
  });

  it("rejects regular admins from createBackup", async () => {
    process.env.DATABASE_URL = "";
    const caller = makeCaller("admin");
    await assert.rejects(caller.createBackup(), /super admin/i);
  });

  it("allows super admins past the permission gate on createBackup", async () => {
    process.env.DATABASE_URL = "";
    const caller = makeCaller("super_admin");
    await assert.rejects(caller.createBackup(), /DATABASE_URL is not configured/);
  });

  it("rejects regular admins from wipeNonEssentialData", async () => {
    const caller = makeCaller("admin");
    await assert.rejects(
      caller.wipeNonEssentialData({
        confirmPhrase: "WIPE",
        superAdminEmail: "super@example.com",
        superAdminPassword: "supersecret123",
        superAdminName: "Root Admin",
      }),
      /super admin/i,
    );
  });

  it("allows super admins past the permission gate on wipeNonEssentialData", async () => {
    process.env.ADMIN_RESET_CONFIRM_PHRASE = "NUKE";
    const caller = makeCaller("super_admin");
    await assert.rejects(
      caller.wipeNonEssentialData({
        confirmPhrase: "WIPE",
        superAdminEmail: "super@example.com",
        superAdminPassword: "supersecret123",
        superAdminName: "Root Admin",
      }),
      /Confirmation phrase mismatch/i,
    );
  });
});