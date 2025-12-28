import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "./lib/prisma";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

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

  if (token) {
    // If user is authenticated, check for active subscription
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { empowermentPackages: true },
    });

    const hasActiveStandardPackage = !!user?.activeMembershipPackageId;
    const hasActiveEmpowermentPackage = user?.empowermentPackages.some((p) =>
      p.status.startsWith("Active")
    );

    if (
      !hasActiveStandardPackage &&
      !hasActiveEmpowermentPackage &&
      pathname !== "/membership" &&
      pathname !== "/empowerment"
    ) {
      // If no active package, redirect to membership page
      return NextResponse.redirect(new URL("/membership", req.url));
    }
  } else {
    // If user is not authenticated, redirect to login page
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Add protected routes here when needed
    // "/dashboard/:path*"
  ],
};
