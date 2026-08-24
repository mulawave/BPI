/**
 * SSC Verification API
 *
 * External applications call this endpoint with an admin-issued API key
 * to verify a member's SSC code and fetch their account details.
 *
 * POST /api/v1/ssc/verify
 * Headers: Authorization: Bearer <api_key>
 * Body: { "ssc": "ABC-1234-XYZ" }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey, checkRateLimit, logApiRequest } from "@/server/services/api-key.service";

const ENDPOINT = "/api/v1/ssc/verify";
const SSC_REGEX = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/;

function errorResponse(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json(
    { verified: false, error: { code, message } },
    { status, headers },
  );
}

function toAbsoluteUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  if (!base) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // ── 1. Authenticate API key ──────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const rawKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const apiKey = await verifyApiKey(rawKey);
  if (!apiKey) {
    return errorResponse(401, "UNAUTHORIZED", "Invalid or revoked API key.");
  }

  // ── 2. Rate limit ────────────────────────────────────────
  const rate = await checkRateLimit(apiKey.id, apiKey.rateLimit);
  if (!rate.allowed) {
    await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, status: 429, ipAddress });
    return errorResponse(429, "RATE_LIMITED", "Rate limit exceeded. Try again shortly.", { "Retry-After": "60" });
  }

  // ── 3. Validate input ────────────────────────────────────
  let ssc = "";
  try {
    const body = await req.json();
    ssc = String(body?.ssc ?? "").trim().toUpperCase();
  } catch {
    await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, status: 400, ipAddress });
    return errorResponse(400, "INVALID_BODY", "Request body must be JSON with an 'ssc' field.");
  }

  if (!SSC_REGEX.test(ssc)) {
    await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, sscQueried: ssc || null, status: 400, ipAddress });
    return errorResponse(400, "INVALID_SSC_FORMAT", "SSC must match the format XXX-XXXX-XXX.");
  }

  try {
    // ── 4. Look up the member ──────────────────────────────
    const user = await prisma.user.findFirst({
      where: { ssc },
      select: {
        id: true,
        ssc: true,
        firstname: true,
        lastname: true,
        name: true,
        username: true,
        gender: true,
        mobile: true,
        email: true,
        profilePic: true,
        image: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        country: true,
        rank: true,
        activated: true,
        verified: true,
        kyc: true,
        createdAt: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        activeMembershipPackageId: true,
        bpiTokenWallet: true,
      },
    });

    if (!user) {
      await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, sscQueried: ssc, status: 404, ipAddress });
      return errorResponse(404, "NOT_FOUND", "No account matches the provided SSC.");
    }

    // ── 5. Resolve membership plan name ────────────────────
    const membershipPackage = user.activeMembershipPackageId
      ? await prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: { name: true },
        })
      : null;

    // ── 6. Resolve KYC status (live-expiry aware) ──────────
    const latestKyc = await prisma.kycSubmission.findFirst({
      where: { userId: user.id },
      orderBy: { submittedAt: "desc" },
      select: { status: true, reviewedAt: true, expiresAt: true },
    });

    let kycStatus: string = latestKyc?.status ?? user.kyc ?? "none";
    if (
      latestKyc?.status === "approved" &&
      latestKyc.expiresAt &&
      new Date(latestKyc.expiresAt) < new Date()
    ) {
      kycStatus = "expired";
    }
    const kycVerified = kycStatus === "approved";

    // ── 7. Build response ──────────────────────────────────
    const fullName =
      [user.firstname, user.lastname].filter(Boolean).join(" ") || user.name || null;

    await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, sscQueried: ssc, matchedUserId: user.id, status: 200, ipAddress });

    return NextResponse.json({
      verified: true,
      member: {
        ssc: user.ssc,
        photo: toAbsoluteUrl(user.profilePic ?? user.image),
        firstname: user.firstname,
        lastname: user.lastname,
        fullName,
        username: user.username,
        gender: user.gender,
        phone: user.mobile,
        email: user.email,
        address: {
          address: user.address,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
        },
        rank: user.rank,
        memberSince: user.createdAt,
        accountActivated: user.activated,
        membership: {
          planName: membershipPackage?.name ?? null,
          activatedAt: user.membershipActivatedAt,
          expiresAt: user.membershipExpiresAt,
        },
        kyc: {
          status: kycStatus,
          verified: kycVerified,
          verifiedAt: kycVerified ? latestKyc?.reviewedAt ?? null : null,
          expiresAt: latestKyc?.expiresAt ?? null,
        },
        wallets: {
          bpiToken: user.bpiTokenWallet,
        },
      },
    });
  } catch (error) {
    console.error("[SSC Verify API] Error:", error);
    await logApiRequest({ apiKeyId: apiKey.id, endpoint: ENDPOINT, sscQueried: ssc, status: 500, ipAddress });
    return errorResponse(500, "INTERNAL", "An internal error occurred. Please try again.");
  }
}
