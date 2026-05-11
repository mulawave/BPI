import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const STARTUP_VALIDATION_MODULE = pathToFileURL(
  path.resolve(process.cwd(), "lib/startupValidation.ts"),
).href;

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_WARN = console.warn;

async function importFreshStartupValidationModule() {
  return import(`${STARTUP_VALIDATION_MODULE}?t=${Date.now()}-${Math.random()}`);
}

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

beforeEach(() => {
  resetEnv();
  process.env.NODE_ENV = "production";
  delete process.env.NEXTAUTH_SECRET;
  delete process.env.AUTH_SECRET;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
  delete process.env.ENCRYPTION_KEY;
  console.warn = ORIGINAL_WARN;
});

afterEach(() => {
  resetEnv();
  console.warn = ORIGINAL_WARN;
});

describe("validateCriticalEnvironment", () => {
  it("fails when auth secret is missing", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

    const { validateCriticalEnvironment } = await importFreshStartupValidationModule();

    assert.throws(
      () => validateCriticalEnvironment(),
      /NEXTAUTH_SECRET or AUTH_SECRET is required/,
    );
  });

  it("fails when the canonical URL is missing", async () => {
    process.env.AUTH_SECRET = "test-secret";
    process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

    const { validateCriticalEnvironment } = await importFreshStartupValidationModule();

    assert.throws(
      () => validateCriticalEnvironment(),
      /Set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL to the canonical application URL/,
    );
  });

  it("warns once and continues when the encryption key is missing", async () => {
    process.env.AUTH_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";

    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((arg) => String(arg)).join(" "));
    };

    const { validateCriticalEnvironment } = await importFreshStartupValidationModule();

    assert.doesNotThrow(() => validateCriticalEnvironment());
    assert.strictEqual(warnings.length, 1);
    assert.match(warnings[0] ?? "", /ENCRYPTION_KEY is not configured/);
  });

  it("does not warn when the encryption key is configured", async () => {
    process.env.AUTH_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

    const warnings: string[] = [];
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((arg) => String(arg)).join(" "));
    };

    const { validateCriticalEnvironment } = await importFreshStartupValidationModule();

    assert.doesNotThrow(() => validateCriticalEnvironment());
    assert.strictEqual(warnings.length, 0);
  });
});
