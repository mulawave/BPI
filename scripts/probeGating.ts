/*
  Lightweight probe to verify membership-only gating via middleware.
  - Unauthenticated requests should redirect protected pages to /login
  - Public pages should be accessible or redirect per sequence
  Usage: BASE_URL=http://localhost:3000 npx tsx scripts/probeGating.ts
*/

// Make this file a module to avoid global scope collisions
export {};

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function probe(path: string) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" as any });
    const location = res.headers.get("location") || "";
    return { path, status: res.status, location };
  } catch (e: any) {
    return { path, status: -1, location: "", error: e?.message || String(e) };
  }
}

async function main() {
  const targets = [
    "/",
    "/dashboard",
    "/membership",
    "/login",
    "/register",
    "/forgot-password",
  ];

  console.log(`Probing gating (unauthenticated) against ${BASE_URL}...`);
  const results = await Promise.all(targets.map(probe));
  for (const r of results) {
    const expect = (() => {
      if (r.path === "/") return "200 or 304";
      if (r.path === "/dashboard") return "302 -> /login";
      if (r.path === "/membership") return "302 -> /login"; // requires login, then gating sends to /membership post-auth
      if (r.path === "/login") return "200";
      if (r.path === "/register") return "200";
      if (r.path === "/forgot-password") return "200";
      return "unknown";
    })();
    console.log(
      `${r.path.padEnd(18)} status=${r.status} location=${r.location || ""} (expected: ${expect})`
    );
  }
}

main().catch((e) => {
  console.error("Probe failed:", e);
  process.exit(1);
});
