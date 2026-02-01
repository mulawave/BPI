/*
  Authenticated probe to verify membership-only gating after login.
  - Logs in via NextAuth Credentials provider using env creds
  - Probes protected routes and prints status + Location

  Usage:
    set BASE_URL=http://localhost:3000
    set CRED_EMAIL=user@example.com
    set CRED_PASSWORD=secret
    npx tsx scripts/probeAuthGating.ts
*/

// Make this file a module to avoid global scope collisions
export {};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}
const EMAIL = parseArg("email") || process.env.CRED_EMAIL;
const PASSWORD = parseArg("password") || process.env.CRED_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.log("Skipping authenticated probe: provide --email and --password or set CRED_EMAIL/CRED_PASSWORD.");
  process.exit(0);
}

async function loginAndGetCookie() {
  // Fetch CSRF token first and capture cookie
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { headers: { Accept: "application/json" }, redirect: "manual" as any });
  const csrfCookie = csrfRes.headers.get("set-cookie") || "";
  let csrfToken = "";
  try {
    const json = await csrfRes.json();
    csrfToken = json?.csrfToken || "";
  } catch {}

  const form = new URLSearchParams();
  form.set("csrfToken", csrfToken);
  form.set("email", EMAIL!);
  form.set("password", PASSWORD!);
  const url = `${BASE_URL}/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(BASE_URL + "/dashboard")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: csrfCookie },
    body: form.toString(),
    redirect: "manual" as any,
  });
  const sessionCookie = res.headers.get("set-cookie") || "";
  if (!sessionCookie) {
    throw new Error(`Login failed: status=${res.status}`);
  }
  // Merge cookies
  const cookieJar = [csrfCookie, sessionCookie].filter(Boolean).join("; ");
  return cookieJar;
}

async function probe(path: string, cookie: string) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers: { cookie }, redirect: "manual" as any });
  const location = res.headers.get("location") || "";
  return { path, status: res.status, location };
}

async function main() {
  console.log(`Authenticated probe against ${BASE_URL} as ${EMAIL}`);
  const cookie = await loginAndGetCookie();
  const targets = ["/dashboard", "/membership", "/settings", "/transactions"]; 
  const results = await Promise.all(targets.map((p) => probe(p, cookie)));
  for (const r of results) {
    console.log(`${r.path.padEnd(16)} status=${r.status} location=${r.location}`);
  }
}

main().catch((e) => {
  console.error("Authenticated probe failed:", e?.message || e);
  process.exit(1);
});
