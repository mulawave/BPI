import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import type { Prisma } from "@prisma/client";
import { SignJWT } from "jose";
import { requireAuthSecret } from "@/lib/authSecret";
import { getClientIp, impersonationGlobalRouteLimiter, impersonationRouteLimiter } from "@/lib/rateLimit";
import {
  getImpersonationRestoreTokenName,
  getSessionCookieOptions,
  getSessionTokenName,
} from "@/lib/impersonationSession";

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderImpersonationPage(input: {
  title: string;
  message: string;
  detail?: string;
  redirectUrl?: string;
  autoClose?: boolean;
}) {
  const title = escapeHtml(input.title);
  const message = escapeHtml(input.message);
  const detail = input.detail ? escapeHtml(input.detail) : null;
  const redirectScript = input.redirectUrl
    ? `setTimeout(() => { window.location.href = ${JSON.stringify(input.redirectUrl)}; }, 1000);`
    : input.autoClose
      ? `setTimeout(() => { window.close(); }, 1500);`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${input.redirectUrl ? `<meta http-equiv="refresh" content="1;url=${escapeHtml(input.redirectUrl)}">` : ""}
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0d3b29 0%, #173f35 55%, #274b63 100%);
      color: #f4f3ef;
    }
    .container {
      width: min(92vw, 460px);
      padding: 2rem;
      border-radius: 1.25rem;
      background: rgba(12, 22, 20, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(14px);
    }
    h1 {
      margin: 0 0 0.75rem;
      font-size: 1.35rem;
    }
    p {
      margin: 0;
      line-height: 1.55;
      color: rgba(244, 243, 239, 0.86);
    }
    .detail {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 0.9rem;
      background: rgba(255, 255, 255, 0.08);
      font-size: 0.92rem;
      color: rgba(244, 243, 239, 0.92);
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    ${detail ? `<div class="detail">${detail}</div>` : ""}
  </div>
  <script>${redirectScript}</script>
</body>
</html>`;
}

function jsonError(error: string, status: number, retryAfterSeconds?: number) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    }
  );
}

function htmlError(message: string, detail?: string, status = 400) {
  return new NextResponse(renderImpersonationPage({
    title: "Impersonation unavailable",
    message,
    detail,
    autoClose: true,
  }), {
    status,
    headers: HTML_HEADERS,
  });
}

function toAuditMetadata(metadata: Record<string, unknown>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonObject;
}

type ImpersonationRequestFailure =
  | {
      ok: false;
      code: "rate_limited";
      message: string;
      retryAfterMs: number;
    }
  | {
      ok: false;
      code: "invalid_token" | "unauthorized" | "target_blocked" | "used" | "expired";
      message: string;
    };

type ImpersonationRequestSuccess = {
  ok: true;
  impToken: any;
  jwtToken: string;
};

type ImpersonationRequestResult = ImpersonationRequestFailure | ImpersonationRequestSuccess;

async function recordImpersonationAudit(input: {
  userId?: string;
  action: string;
  entity?: string;
  entityId: string;
  status: string;
  metadata: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: input.userId || "system",
        action: input.action,
        entity: input.entity || "ImpersonationToken",
        entityId: input.entityId,
        status: input.status,
        metadata: toAuditMetadata(input.metadata),
      },
    });
  } catch (error) {
    console.error("Failed to write impersonation audit log:", error);
  }
}

function buildImpersonationSessionPayload(impToken: any) {
  return {
    id: impToken.TargetUser.id,
    email: impToken.TargetUser.email,
    name:
      impToken.TargetUser.name ||
      [impToken.TargetUser.firstname, impToken.TargetUser.lastname].filter(Boolean).join(" "),
    role: impToken.TargetUser.role,
    impersonatedBy: impToken.Admin.id,
    impersonatedByEmail: impToken.Admin.email,
    impersonationSessionId: impToken.id,
    isImpersonation: true,
    hasActiveMembership: false,
    hasActiveEmpowerment: false,
  };
}

async function resolveImpersonationRequest(
  req: NextRequest,
  token: string
): Promise<ImpersonationRequestResult> {
  const ip = getClientIp(req);
  const globalRateLimit = impersonationGlobalRouteLimiter.check(ip);
  if (!globalRateLimit.success) {
    await recordImpersonationAudit({
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: token,
      status: "warning",
      metadata: {
        reason: "global_rate_limited",
        ip,
        method: req.method,
        retryAfterMs: globalRateLimit.retryAfterMs,
      },
    });

    return {
      ok: false as const,
      code: "rate_limited",
      message: "Too many impersonation attempts. Please wait and try again.",
      retryAfterMs: globalRateLimit.retryAfterMs,
    };
  }

  const limiterKey = `${ip}:${token}`;
  const rateLimit = impersonationRouteLimiter.check(limiterKey);

  if (!rateLimit.success) {
    await recordImpersonationAudit({
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: token,
      status: "warning",
      metadata: {
        reason: "rate_limited",
        ip,
        method: req.method,
        retryAfterMs: rateLimit.retryAfterMs,
      },
    });

    return {
      ok: false as const,
      code: "rate_limited",
      message: "Too many impersonation attempts. Please wait and try again.",
      retryAfterMs: rateLimit.retryAfterMs,
    };
  }

  const impToken = await prisma.impersonationToken.findUnique({
    where: { token },
    include: {
      Admin: { select: { id: true, email: true, role: true } },
      TargetUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          firstname: true,
          lastname: true,
        },
      },
    },
  });

  if (!impToken) {
    await recordImpersonationAudit({
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: token,
      status: "warning",
      metadata: {
        reason: "invalid_token",
        ip,
        method: req.method,
      },
    });

    return {
      ok: false as const,
      code: "invalid_token",
      message: "This impersonation link is invalid.",
    };
  }

  const session = await getServerSession(authConfig);
  const sessionUser = session?.user as any;

  if (
    !sessionUser ||
    sessionUser.id !== impToken.adminId ||
    impToken.Admin.role !== "super_admin"
  ) {
    await recordImpersonationAudit({
      userId: sessionUser?.id,
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: impToken.id,
      status: "warning",
      metadata: {
        reason: "unauthorized_session",
        ip,
        method: req.method,
        tokenAdminId: impToken.adminId,
        sessionUserId: sessionUser?.id ?? null,
        sessionRole: sessionUser?.role ?? null,
      },
    });

    return {
      ok: false as const,
      code: "unauthorized",
      message: "You are not authorized to use this impersonation link.",
    };
  }

  if (impToken.TargetUser.role === "admin" || impToken.TargetUser.role === "super_admin") {
    await recordImpersonationAudit({
      userId: impToken.adminId,
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: impToken.id,
      status: "warning",
      metadata: {
        reason: "target_role_blocked",
        ip,
        method: req.method,
        targetUserId: impToken.targetUserId,
        targetRole: impToken.TargetUser.role,
      },
    });

    return {
      ok: false as const,
      code: "target_blocked",
      message: "Admin accounts cannot be impersonated.",
    };
  }

  const now = new Date();
  if (impToken.used) {
    await recordImpersonationAudit({
      userId: impToken.adminId,
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: impToken.id,
      status: "warning",
      metadata: {
        reason: "token_already_used",
        ip,
        method: req.method,
        usedAt: impToken.usedAt?.toISOString() ?? null,
      },
    });

    return {
      ok: false as const,
      code: "used",
      message: "This impersonation link has already been used.",
    };
  }

  if (now > impToken.expiresAt) {
    await recordImpersonationAudit({
      userId: impToken.adminId,
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: impToken.id,
      status: "warning",
      metadata: {
        reason: "token_expired",
        ip,
        method: req.method,
        expiresAt: impToken.expiresAt.toISOString(),
      },
    });

    return {
      ok: false as const,
      code: "expired",
      message: "This impersonation link has expired.",
    };
  }

  const tokenConsumed = await prisma.impersonationToken.updateMany({
    where: {
      id: impToken.id,
      used: false,
      expiresAt: { gt: now },
    },
    data: {
      used: true,
      usedAt: now,
    },
  });

  if (tokenConsumed.count !== 1) {
    await recordImpersonationAudit({
      userId: impToken.adminId,
      action: "ADMIN_IMPERSONATION_BLOCKED",
      entityId: impToken.id,
      status: "warning",
      metadata: {
        reason: "token_race_lost",
        ip,
        method: req.method,
      },
    });

    return {
      ok: false as const,
      code: "used",
      message: "This impersonation link is no longer available.",
    };
  }

  const secret = new TextEncoder().encode(requireAuthSecret());
  const jwtToken = await new SignJWT(buildImpersonationSessionPayload(impToken))
    .setProtectedHeader({ alg: "HS256" })
    .setJti(impToken.id)
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secret);

  await recordImpersonationAudit({
    userId: impToken.adminId,
    action: "ADMIN_IMPERSONATION_LOGIN",
    entityId: impToken.id,
    status: "success",
    metadata: {
      ip,
      method: req.method,
      tokenId: impToken.id,
      targetUserId: impToken.targetUserId,
      targetUserEmail: impToken.TargetUser.email,
      targetUserName: impToken.TargetUser.name,
      impersonatedBy: impToken.Admin.email,
    },
  });

  return {
    ok: true as const,
    impToken,
    jwtToken,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return htmlError("This impersonation link is invalid.");
    }

    const result = await resolveImpersonationRequest(req, token);
    if (!result.ok) {
      if (result.code === "rate_limited") {
        return new NextResponse(
          renderImpersonationPage({
            title: "Too many impersonation attempts",
            message: result.message,
            detail: "Wait a moment before trying again.",
            autoClose: true,
          }),
          {
            status: 429,
            headers: {
              ...HTML_HEADERS,
              "Retry-After": String(Math.ceil((result.retryAfterMs ?? 0) / 1000)),
            },
          }
        );
      }

      return htmlError(result.message);
    }

    const { impToken, jwtToken } = result;
    const sessionTokenName = getSessionTokenName();
    const restoreTokenName = getImpersonationRestoreTokenName();
    const existingSessionToken = req.cookies.get(sessionTokenName)?.value;

    if (!existingSessionToken) {
      await recordImpersonationAudit({
        userId: impToken.adminId,
        action: "ADMIN_IMPERSONATION_BLOCKED",
        entityId: impToken.id,
        status: "warning",
        metadata: {
          reason: "missing_source_session",
          ip: getClientIp(req),
          method: req.method,
        },
      });

      return htmlError(
        "Your admin session could not be restored safely.",
        "Return to the admin dashboard and start impersonation again.",
        401
      );
    }

    const maxAge = 4 * 60 * 60; // 4 hours

    const dashboardUrl = new URL("/dashboard", req.url);

    const response = new NextResponse(
      renderImpersonationPage({
        title: "Starting impersonation session",
        message: `You are being logged in as ${impToken.TargetUser.email}.`,
        detail: "Your admin session is preserved and will be restored when you end impersonation.",
        redirectUrl: dashboardUrl.toString(),
      }),
      { headers: HTML_HEADERS }
    );

    response.cookies.set(restoreTokenName, existingSessionToken, getSessionCookieOptions(maxAge));
    response.cookies.set(sessionTokenName, jwtToken, getSessionCookieOptions(maxAge));

    return response;
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return htmlError("Failed to start impersonation.", "Please close this window and try again.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const result = await resolveImpersonationRequest(req, token);
    if (!result.ok) {
      if (result.code === "rate_limited") {
        return jsonError(result.message, 429, Math.ceil((result.retryAfterMs ?? 0) / 1000));
      }

      const status = result.code === "invalid_token" ? 401 : result.code === "unauthorized" ? 403 : 401;
      return jsonError(result.message, status);
    }

    const { impToken, jwtToken: impersonationToken } = result;

    return NextResponse.json({
      success: true,
      impersonationToken,
      redirectUrl: `/api/auth/impersonate?token=${token}`,
      targetUser: {
        id: impToken.TargetUser.id,
        email: impToken.TargetUser.email,
        name: impToken.TargetUser.name,
      },
    });
  } catch (error: any) {
    console.error("Impersonation error:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}
