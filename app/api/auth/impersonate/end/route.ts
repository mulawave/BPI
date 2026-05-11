import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  getImpersonationRestoreTokenName,
  getSessionCookieOptions,
  getSessionTokenName,
} from "@/lib/impersonationSession";

export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    const sessionUser = session?.user as any;

    if (!sessionUser?.id || !sessionUser?.isImpersonation || !sessionUser?.impersonationSessionId) {
      return NextResponse.json({ success: false, error: "No active impersonation session" }, { status: 400 });
    }

    const tokenRecord = await prisma.impersonationToken.findUnique({
      where: { id: sessionUser.impersonationSessionId },
      select: {
        id: true,
        adminId: true,
        targetUserId: true,
        usedAt: true,
        Admin: { select: { email: true } },
        TargetUser: { select: { email: true, name: true } },
      },
    });

    const durationMs = tokenRecord?.usedAt ? Date.now() - tokenRecord.usedAt.getTime() : null;
    const sessionTokenName = getSessionTokenName();
    const restoreTokenName = getImpersonationRestoreTokenName();
    const cookieStore = cookies();
    const restoreToken = cookieStore.get(restoreTokenName)?.value;

    if (!restoreToken) {
      return NextResponse.json(
        { success: false, error: "Original admin session is no longer available" },
        { status: 409 }
      );
    }

    const response = NextResponse.json({ success: true, redirectUrl: "/admin/users" });
    response.cookies.set(sessionTokenName, restoreToken, getSessionCookieOptions(4 * 60 * 60));
    response.cookies.set(restoreTokenName, "", getSessionCookieOptions(0));

    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: tokenRecord?.adminId || sessionUser.impersonatedBy || "system",
        action: "ADMIN_IMPERSONATION_END",
        entity: "ImpersonationToken",
        entityId: sessionUser.impersonationSessionId,
        status: "success",
        metadata: {
          impersonationSessionId: sessionUser.impersonationSessionId,
          targetUserId: tokenRecord?.targetUserId || sessionUser.id,
          targetUserEmail: tokenRecord?.TargetUser?.email || sessionUser.email || null,
          targetUserName: tokenRecord?.TargetUser?.name || sessionUser.name || null,
          impersonatedBy: tokenRecord?.Admin?.email || sessionUser.impersonatedByEmail || null,
          durationMs,
        },
      },
    });

    return response;
  } catch (error) {
    console.error("Failed to audit impersonation end:", error);
    return NextResponse.json({ success: false, error: "Failed to end impersonation session" }, { status: 500 });
  }
}