import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

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

  // Allow requests for API, auth, static files, and public pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") || // e.g., favicon.ico
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/tokenomics" // Allow access to tokenomics page
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
  if (token) {
    const hasActiveMembership = (token as any)?.hasActiveMembership === true;
    const isMembershipRoute = pathname === "/membership" || pathname.startsWith("/membership/");

    if (!hasActiveMembership && !isMembershipRoute) {
      return NextResponse.redirect(new URL("/membership", req.url));
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
