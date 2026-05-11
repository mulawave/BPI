const SAFE_ENV_VALUES = new Set(["development", "dev", "test", "local"]);
const UNSAFE_ENV_VALUES = new Set(["production", "prod", "preview", "staging", "stage", "live"]);

function normalizeEnv(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function hasExplicitOptIn() {
  return (
    process.env.ENABLE_MOCK_PAYMENTS === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS === "true"
  );
}

function isLocalHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname.toLowerCase());
}

function isSafeServerEnvironment() {
  const nodeEnv = normalizeEnv(process.env.NODE_ENV);
  const appEnv = normalizeEnv(process.env.APP_ENV);
  const vercelEnv = normalizeEnv(process.env.VERCEL_ENV);

  if ([nodeEnv, appEnv, vercelEnv].some((value) => UNSAFE_ENV_VALUES.has(value))) {
    return false;
  }

  return [nodeEnv, appEnv, vercelEnv].some((value) => SAFE_ENV_VALUES.has(value));
}

export function areMockPaymentsAllowed() {
  if (!hasExplicitOptIn()) {
    return false;
  }

  if (typeof window !== "undefined") {
    return isLocalHostname(window.location.hostname);
  }

  return isSafeServerEnvironment();
}

export function assertMockPaymentsAllowed(
  message = "Mock payments are not enabled in this environment."
) {
  if (!areMockPaymentsAllowed()) {
    throw new Error(message);
  }
}

export {};