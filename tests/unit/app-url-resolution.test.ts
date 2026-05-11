import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP_URL_MODULE = pathToFileURL(path.resolve(process.cwd(), "lib/appUrl.ts")).href;
const CLIENT_APP_URL_MODULE = pathToFileURL(path.resolve(process.cwd(), "lib/clientAppUrl.ts")).href;

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_WINDOW = globalThis.window;
const ORIGINAL_DOCUMENT = globalThis.document;

async function importFreshAppUrlModule() {
  return import(`${APP_URL_MODULE}?t=${Date.now()}-${Math.random()}`);
}

async function importFreshClientAppUrlModule() {
  return import(`${CLIENT_APP_URL_MODULE}?t=${Date.now()}-${Math.random()}`);
}

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function clearBrowserGlobals() {
  if (ORIGINAL_WINDOW === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = ORIGINAL_WINDOW;
  }

  if (ORIGINAL_DOCUMENT === undefined) {
    delete (globalThis as any).document;
  } else {
    (globalThis as any).document = ORIGINAL_DOCUMENT;
  }
}

beforeEach(() => {
  resetEnv();
  clearBrowserGlobals();
});

afterEach(() => {
  resetEnv();
  clearBrowserGlobals();
});

describe("app URL environment resolution", () => {
  it("prefers NEXT_PUBLIC_APP_URL over NEXTAUTH_URL and VERCEL_URL", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://public.example.com";
    process.env.NEXTAUTH_URL = "https://auth.example.com";
    process.env.VERCEL_URL = "preview.example.vercel.app";

    const { getConfiguredEnvUrl } = await importFreshAppUrlModule();
    assert.strictEqual(getConfiguredEnvUrl(), "https://public.example.com");
  });

  it("normalizes NEXTAUTH_URL when protocol is omitted", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXTAUTH_URL = "auth.example.com";
    delete process.env.VERCEL_URL;

    const { getConfiguredEnvUrl } = await importFreshAppUrlModule();
    assert.strictEqual(getConfiguredEnvUrl(), "https://auth.example.com");
  });

  it("falls back to VERCEL_URL when canonical env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    process.env.VERCEL_URL = "deploy-preview.example.vercel.app";

    const { getConfiguredEnvUrl } = await importFreshAppUrlModule();
    assert.strictEqual(getConfiguredEnvUrl(), "https://deploy-preview.example.vercel.app");
  });

  it("uses configured canonical URL in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "https://prod.example.com";
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const { resolveAppBaseUrl } = await importFreshAppUrlModule();
    assert.strictEqual(await resolveAppBaseUrl(), "https://prod.example.com");
  });

  it("throws in production when no canonical URL is configured", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const { resolveAppBaseUrl } = await importFreshAppUrlModule();
    await assert.rejects(resolveAppBaseUrl(), /APP_URL_CONFIG_ERROR/);
  });

  it("uses localhost fallback during build outside production", async () => {
    process.env.NODE_ENV = "test";
    process.env.NEXT_PHASE = "phase-production-build";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const { resolveAppBaseUrl } = await importFreshAppUrlModule();
    assert.strictEqual(await resolveAppBaseUrl(), "http://localhost:3000");
  });
});

describe("client app URL resolution", () => {
  it("prefers body dataset app URL in the browser", async () => {
    (globalThis as any).document = {
      body: { dataset: { appBaseUrl: "https://body.example.com" } },
    };
    (globalThis as any).window = {
      __APP_BASE_URL__: "https://window.example.com",
      location: { origin: "https://origin.example.com" },
    };

    const { resolveClientBaseUrl } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveClientBaseUrl(), "https://body.example.com");
  });

  it("falls back to window override and then location origin in the browser", async () => {
    (globalThis as any).document = { body: { dataset: {} } };
    (globalThis as any).window = {
      __APP_BASE_URL__: "https://window.example.com",
      location: { origin: "https://origin.example.com" },
    };

    const { resolveClientBaseUrl } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveClientBaseUrl(), "https://window.example.com");

    (globalThis as any).window = { location: { origin: "https://origin.example.com" } };
    const { resolveClientBaseUrl: resolveWithoutWindowOverride } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveWithoutWindowOverride(), "https://origin.example.com");
  });

  it("uses NEXT_PUBLIC_APP_URL on the server when available", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://client.example.com";
    delete (globalThis as any).window;
    delete (globalThis as any).document;

    const { resolveClientBaseUrl } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveClientBaseUrl(), "https://client.example.com");
  });

  it("falls back to localhost on the server outside production", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete (globalThis as any).window;
    delete (globalThis as any).document;

    const { resolveClientBaseUrl } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveClientBaseUrl(), "http://localhost:3000");
  });

  it("returns empty string in production when no client base URL is available", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete (globalThis as any).window;
    delete (globalThis as any).document;

    const { resolveClientBaseUrl } = await importFreshClientAppUrlModule();
    assert.strictEqual(resolveClientBaseUrl(), "");
  });
});