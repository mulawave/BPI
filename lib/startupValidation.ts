import { resolveAuthSecret } from "@/lib/authSecret";

const LOCAL_DEV_BASE_URL = "http://localhost:3000";

let validated = false;

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function getConfiguredBaseUrl() {
  return normalizeUrl(
    readEnv("NEXT_PUBLIC_APP_URL") ||
      readEnv("NEXTAUTH_URL") ||
      (readEnv("VERCEL_URL") ? `https://${readEnv("VERCEL_URL")}` : "")
  );
}

function validateCanonicalUrl(url: string, issues: string[]) {
  if (!url) {
    issues.push(
      "Set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL to the canonical application URL. Production must not rely on admin setting app_base_url fallback."
    );
    return;
  }

  try {
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (parsed.protocol !== "https:" && !isLocalhost) {
      issues.push(`Canonical app URL must use https in production. Received: ${url}`);
    }
  } catch {
    issues.push(`Canonical app URL is invalid: ${url}`);
  }
}

function validateRequiredEnv(name: string, issues: string[]) {
  if (!readEnv(name)) {
    issues.push(`${name} is required`);
  }
}

export function validateCriticalEnvironment() {
  if (validated) return;

  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    validated = true;
    return;
  }

  const issues: string[] = [];

  if (!resolveAuthSecret()) {
    issues.push("NEXTAUTH_SECRET or AUTH_SECRET is required");
  }

  validateRequiredEnv("ENCRYPTION_KEY", issues);
  validateCanonicalUrl(getConfiguredBaseUrl(), issues);

  validateRequiredEnv("PAYSTACK_SECRET_KEY", issues);
  validateRequiredEnv("FLUTTERWAVE_PUBLIC_KEY", issues);
  validateRequiredEnv("FLUTTERWAVE_SECRET_KEY", issues);
  validateRequiredEnv("FLUTTERWAVE_ENCRYPTION_KEY", issues);
  validateRequiredEnv("FLUTTERWAVE_WEBHOOK_SECRET", issues);

  const nextAuthUrl = normalizeUrl(readEnv("NEXTAUTH_URL"));
  const publicAppUrl = normalizeUrl(readEnv("NEXT_PUBLIC_APP_URL"));
  if (nextAuthUrl && publicAppUrl) {
    try {
      if (new URL(nextAuthUrl).origin !== new URL(publicAppUrl).origin) {
        issues.push("NEXTAUTH_URL and NEXT_PUBLIC_APP_URL must share the same origin in production");
      }
    } catch {
      issues.push("NEXTAUTH_URL or NEXT_PUBLIC_APP_URL is not a valid URL");
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `STARTUP_ENV_VALIDATION_FAILED:\n- ${issues.join("\n- ")}`
    );
  }

  validated = true;
}

export function getDevelopmentFallbackUrl() {
  return LOCAL_DEV_BASE_URL;
}