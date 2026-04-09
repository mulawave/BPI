/**
 * Admin Auth & Role Enforcement Tests
 *
 * Tests the role-checking utilities used by 20+ routers and API routes.
 * Validates: isAdmin, isSuperAdmin, requireAdmin, requireSuperAdmin, getUserRole
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isAdmin,
  isSuperAdmin,
  requireAdmin,
  requireSuperAdmin,
  getUserRole,
} from "@/server/utils/adminAuth";

// ---------------------------------------------------------------------------
// Helpers – build session objects that match the runtime shape
// ---------------------------------------------------------------------------

function makeSession(role?: string, id = "user-1", email = "u@test.com") {
  if (!role) return null;
  return {
    user: { id, email, name: "Test", role },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// isAdmin
// ---------------------------------------------------------------------------

describe("isAdmin", () => {
  it("returns true for admin role", () => {
    assert.strictEqual(isAdmin({ id: "1", email: "a@b.com", role: "admin" }), true);
  });

  it("returns true for super_admin role", () => {
    assert.strictEqual(isAdmin({ id: "1", email: "a@b.com", role: "super_admin" }), true);
  });

  it("returns false for regular user role", () => {
    assert.strictEqual(isAdmin({ id: "1", email: "a@b.com", role: "user" }), false);
  });

  it("returns false for null user", () => {
    assert.strictEqual(isAdmin(null), false);
  });

  it("returns false for undefined user", () => {
    assert.strictEqual(isAdmin(undefined), false);
  });

  it("returns false when role is missing", () => {
    assert.strictEqual(isAdmin({ id: "1", email: "a@b.com" }), false);
  });
});

// ---------------------------------------------------------------------------
// isSuperAdmin
// ---------------------------------------------------------------------------

describe("isSuperAdmin", () => {
  it("returns true for super_admin role", () => {
    assert.strictEqual(isSuperAdmin({ id: "1", email: "a@b.com", role: "super_admin" }), true);
  });

  it("returns false for admin role", () => {
    assert.strictEqual(isSuperAdmin({ id: "1", email: "a@b.com", role: "admin" }), false);
  });

  it("returns false for user role", () => {
    assert.strictEqual(isSuperAdmin({ id: "1", email: "a@b.com", role: "user" }), false);
  });

  it("returns false for null", () => {
    assert.strictEqual(isSuperAdmin(null), false);
  });
});

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------

describe("requireAdmin", () => {
  it("returns user when admin", () => {
    const session = makeSession("admin");
    const result = requireAdmin({ session });
    assert.strictEqual(result.role, "admin");
  });

  it("returns user when super_admin", () => {
    const session = makeSession("super_admin");
    const result = requireAdmin({ session });
    assert.strictEqual(result.role, "super_admin");
  });

  it("throws UNAUTHORIZED when session is null", () => {
    assert.throws(
      () => requireAdmin({ session: null }),
      (err: Error) => err.message.includes("UNAUTHORIZED")
    );
  });

  it("throws FORBIDDEN for regular user", () => {
    const session = makeSession("user");
    assert.throws(
      () => requireAdmin({ session }),
      (err: Error) => err.message.includes("FORBIDDEN")
    );
  });

  it("throws FORBIDDEN for unknown role", () => {
    const session = makeSession("editor");
    assert.throws(
      () => requireAdmin({ session }),
      (err: Error) => err.message.includes("FORBIDDEN")
    );
  });
});

// ---------------------------------------------------------------------------
// requireSuperAdmin
// ---------------------------------------------------------------------------

describe("requireSuperAdmin", () => {
  it("returns user when super_admin", () => {
    const session = makeSession("super_admin");
    const result = requireSuperAdmin({ session });
    assert.strictEqual(result.role, "super_admin");
  });

  it("throws FORBIDDEN for admin (not super)", () => {
    const session = makeSession("admin");
    assert.throws(
      () => requireSuperAdmin({ session }),
      (err: Error) => err.message.includes("FORBIDDEN")
    );
  });

  it("throws UNAUTHORIZED when no session", () => {
    assert.throws(
      () => requireSuperAdmin({ session: null }),
      (err: Error) => err.message.includes("UNAUTHORIZED")
    );
  });
});

// ---------------------------------------------------------------------------
// getUserRole
// ---------------------------------------------------------------------------

describe("getUserRole", () => {
  it('returns "user" for null session', () => {
    assert.strictEqual(getUserRole(null), "user");
  });

  it('returns "admin" for admin session', () => {
    assert.strictEqual(getUserRole(makeSession("admin") as any), "admin");
  });

  it('returns "super_admin" for super_admin session', () => {
    assert.strictEqual(getUserRole(makeSession("super_admin") as any), "super_admin");
  });

  it('returns "user" for session with no role', () => {
    const session = { user: { id: "1", email: "a@b.com" }, expires: "" };
    assert.strictEqual(getUserRole(session as any), "user");
  });
});
