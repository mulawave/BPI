import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveAuthSecret } from "@/lib/authSecret";
import { getCachedMaintenanceState, type MaintenanceState } from "@/lib/maintenance";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: resolveAuthSecret() ?? undefined });
  const { pathname } = req.nextUrl;

  // ── Maintenance mode ───────────────────────────────────────────────────
  // Controlled from Admin → Settings → General → Site Status toggle.
  // Reads from a shared in-memory global cache (populated by /api/internal/maintenance).
  // Admins bypass automatically. /maintenance itself and all API/static paths
  // are always exempt to prevent redirect loops.
  //
  // Previous approach used fetch() to own API route, which failed under PM2
  // due to self-referencing loops / timeouts. The shared global works because
  // middleware and API routes run in the same Node.js process under `next start`.
  const isMaintenancePage = pathname === "/maintenance";
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".");
  const role = (token as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isMaintenancePage && !isStaticOrApi && !isAdmin) {
    let maintenanceState: MaintenanceState | null = getCachedMaintenanceState();

    // On cold start the cache is empty. Warm it via a one-time fetch to the
    // internal API route. Once populated, subsequent requests use the cache
    // without any network call.
    if (!maintenanceState) {
      try {
        const res = await fetch(new URL("/api/internal/maintenance", req.url), {
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });
        if (res.ok) {
          const data = await res.json();
          maintenanceState = { enabled: data.enabled, until: data.until, ts: Date.now() };
        }
      } catch {
        // Cold-start fetch failed — fail open, next request will retry
      }
    }

    if (maintenanceState?.enabled) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Allow admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Check if user has admin role from token (avoid DB in middleware)
    const role = (token as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    if (!isAdmin) {
      // Not an admin, redirect to user dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Admin authenticated, allow access
    return NextResponse.next();
  }

  const publicRoutes = new Set([
    "/",
    "/login",
    "/logout",
    "/register",
    "/forgot-password",
    "/set-new-password",
    "/tokenomics",
    "/about",
    "/blog",
    "/coming-soon",
    "/terms",
    "/privacy",
    "/help",
    "/store",
    "/checkout",
    "/csp",
    "/empowerment",
    "/maintenance",
  ]);

  const publicRoutePrefixes = [
    "/blog/",
    "/help/",
    "/store/",
    "/checkout/",
    "/csp/",
    "/empowerment/",
  ];

  const isResetRoute = /^\/(forgot-password|set-new-password|reset|reset-password|password-reset)(\/|$)/.test(
    pathname,
  );

  // Allow requests for API, auth, static files, and public pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // e.g., favicon.ico
    publicRoutes.has(pathname) ||
    publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    isResetRoute
  ) {
    return NextResponse.next();
  }

  if (!token) {
    // If user is not authenticated, redirect to login page
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Enforce membership gating for authenticated users (no DB calls in middleware)
  // Admins and super admins do not require membership plans
  if (token) {
    const role = (token as any)?.role;
    const isAdmin = role === "admin" || role === "super_admin";
    const isImpersonation = (token as any)?.isImpersonation === true;

    if (!isAdmin && !isImpersonation) {
      const hasActiveMembership = (token as any)?.hasActiveMembership === true;
      const isMembershipRoute = pathname === "/membership" || pathname.startsWith("/membership/");

      if (!hasActiveMembership && !isMembershipRoute) {
        return NextResponse.redirect(new URL("/membership", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except Next internals and API
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
