/**
 * Cron Endpoint Fail-Closed Pattern Tests
 *
 * Tests the authorization logic used by all cron mutation endpoints:
 *   - /api/cron/pool-distribution
 *   - /api/cron/elite-club-reminder
 *   - /api/cron/elite-club-deadline
 *
 * Validates fail-closed behavior when CRON_SECRET is missing and
 * proper Bearer-token validation.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Cron Auth Logic
// Mirrors: app/api/cron/*/route.ts authorization pattern
// ---------------------------------------------------------------------------

function validateCronAuth(
  cronSecret: string | undefined,
  authorizationHeader: string | null
): { status: number; error?: string } {
  // Fail closed: if secret is not configured, reject with 503
  if (!cronSecret) {
    return { status: 503, error: "CRON_SECRET is not configured" };
  }

  // Validate Bearer token
  if (!authorizationHeader || authorizationHeader !== `Bearer ${cronSecret}`) {
    return { status: 401, error: "Unauthorized" };
  }

  return { status: 200 };
}

describe("Cron endpoint authorization", () => {
  const CRON_SECRET = "test-cron-secret-abc123";

  describe("success cases", () => {
    it("accepts valid Bearer token", () => {
      const result = validateCronAuth(CRON_SECRET, `Bearer ${CRON_SECRET}`);
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.error, undefined);
    });
  });

  describe("fail-closed: missing CRON_SECRET", () => {
    it("returns 503 when CRON_SECRET is undefined", () => {
      const result = validateCronAuth(undefined, "Bearer anything");
      assert.strictEqual(result.status, 503);
      assert.ok(result.error?.includes("not configured"));
    });

    it("returns 503 when CRON_SECRET is empty string", () => {
      const result = validateCronAuth("", "Bearer anything");
      assert.strictEqual(result.status, 503);
    });
  });

  describe("invalid tokens", () => {
    it("rejects missing Authorization header", () => {
      const result = validateCronAuth(CRON_SECRET, null);
      assert.strictEqual(result.status, 401);
      assert.strictEqual(result.error, "Unauthorized");
    });

    it("rejects empty Authorization header", () => {
      const result = validateCronAuth(CRON_SECRET, "");
      assert.strictEqual(result.status, 401);
    });

    it("rejects wrong token", () => {
      const result = validateCronAuth(CRON_SECRET, "Bearer wrong-token");
      assert.strictEqual(result.status, 401);
    });

    it("rejects token without Bearer prefix", () => {
      const result = validateCronAuth(CRON_SECRET, CRON_SECRET);
      assert.strictEqual(result.status, 401);
    });

    it("rejects Basic auth scheme", () => {
      const result = validateCronAuth(CRON_SECRET, `Basic ${CRON_SECRET}`);
      assert.strictEqual(result.status, 401);
    });

    it("rejects Bearer with extra whitespace", () => {
      const result = validateCronAuth(CRON_SECRET, `Bearer  ${CRON_SECRET}`);
      assert.strictEqual(result.status, 401);
    });
  });
});

// ---------------------------------------------------------------------------
// Upload Route Validation Logic
// Mirrors: app/api/upload/route.ts
// ---------------------------------------------------------------------------

const ALLOWED_FOLDERS = new Set([
  "products",
  "pickup-centers",
  "third-party-platforms",
  "uploads",
]);

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function validateUpload(
  userRole: string | undefined,
  folder: string,
  fileType: string,
  fileSize: number
): { valid: boolean; status: number; error?: string } {
  // 1. Admin session required
  if (userRole !== "admin" && userRole !== "super_admin") {
    return { valid: false, status: 403, error: "Admin access required" };
  }

  // 2. Folder allowlist
  if (!ALLOWED_FOLDERS.has(folder)) {
    return { valid: false, status: 400, error: "Invalid upload folder" };
  }

  // 3. File type validation
  if (!ALLOWED_TYPES.has(fileType)) {
    return { valid: false, status: 400, error: "File type not allowed" };
  }

  // 4. File size limit
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, status: 400, error: "File too large" };
  }

  return { valid: true, status: 200 };
}

describe("Upload route validation", () => {
  describe("role enforcement", () => {
    it("allows admin role", () => {
      const result = validateUpload("admin", "products", "image/png", 1000);
      assert.strictEqual(result.valid, true);
    });

    it("allows super_admin role", () => {
      const result = validateUpload("super_admin", "products", "image/png", 1000);
      assert.strictEqual(result.valid, true);
    });

    it("rejects user role", () => {
      const result = validateUpload("user", "products", "image/png", 1000);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.status, 403);
    });

    it("rejects undefined role", () => {
      const result = validateUpload(undefined, "products", "image/png", 1000);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.status, 403);
    });
  });

  describe("folder allowlist", () => {
    for (const folder of ALLOWED_FOLDERS) {
      it(`allows folder: ${folder}`, () => {
        const result = validateUpload("admin", folder, "image/png", 1000);
        assert.strictEqual(result.valid, true);
      });
    }

    it("rejects arbitrary folder", () => {
      const result = validateUpload("admin", "../../etc/passwd", "image/png", 1000);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.status, 400);
    });

    it("rejects empty folder", () => {
      const result = validateUpload("admin", "", "image/png", 1000);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("file type validation", () => {
    for (const type of ALLOWED_TYPES) {
      it(`allows type: ${type}`, () => {
        const result = validateUpload("admin", "products", type, 1000);
        assert.strictEqual(result.valid, true);
      });
    }

    it("rejects executable", () => {
      const result = validateUpload("admin", "products", "application/x-executable", 1000);
      assert.strictEqual(result.valid, false);
    });

    it("rejects javascript", () => {
      const result = validateUpload("admin", "products", "application/javascript", 1000);
      assert.strictEqual(result.valid, false);
    });

    it("rejects HTML", () => {
      const result = validateUpload("admin", "products", "text/html", 1000);
      assert.strictEqual(result.valid, false);
    });
  });

  describe("file size limit", () => {
    it("allows files under 10 MB", () => {
      const result = validateUpload("admin", "products", "image/png", 5 * 1024 * 1024);
      assert.strictEqual(result.valid, true);
    });

    it("allows exactly 10 MB", () => {
      const result = validateUpload("admin", "products", "image/png", MAX_FILE_SIZE);
      assert.strictEqual(result.valid, true);
    });

    it("rejects files over 10 MB", () => {
      const result = validateUpload("admin", "products", "image/png", MAX_FILE_SIZE + 1);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes("too large"));
    });
  });
});
