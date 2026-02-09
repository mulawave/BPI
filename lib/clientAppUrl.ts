export function resolveClientBaseUrl() {
  if (typeof window !== "undefined") {
    const fromBody = document?.body?.dataset?.appBaseUrl;
    const fromWindow = (window as any).__APP_BASE_URL__ as string | undefined;
    const resolved = (fromBody || fromWindow || "").trim();
    if (resolved) return resolved;
    if (window.location?.origin) return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "https://beepagro.com";
}
