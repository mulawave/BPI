import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveAuthSecret } from "@/lib/authSecret";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: resolveAuthSecret() ?? undefined });
  const { pathname } = req.nextUrl;

  // ── Maintenance mode ───────────────────────────────────────────────────
  // Controlled from Admin → Settings → General → Site Status toggle.
  // Reads from /api/internal/maintenance which caches the DB value for 30s.
  // Admins bypass automatically. /maintenance itself and all API/static paths
  // are always exempt to prevent redirect loops.
  const isMaintenancePage = pathname === "/maintenance";
  const isStaticOrApi =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".");
  const role = (token as any)?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  if (!isMaintenancePage && !isStaticOrApi && !isAdmin) {
    try {
      const origin = req.nextUrl.origin;
      const res = await fetch(`${origin}/api/internal/maintenance`, {
        // short timeout — if it fails, fail open
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const { enabled } = await res.json();
        if (enabled) {
          return NextResponse.redirect(new URL("/maintenance", req.url));
        }
      }
    } catch {
      // DB unavailable or timeout — fail open, don't block users
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
