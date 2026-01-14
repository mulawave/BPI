import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import type { Session } from "next-auth";

export async function requireAdmin(): Promise<Session> {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    throw new Error("Unauthorized: No active session");
  }

  const userRole = (session.user as any).role;
  const allowedRoles = ["admin", "super_admin"];
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error(
      `Forbidden: Insufficient permissions. Required: ${allowedRoles.join(" or ")}`
    );
  }

  return session;
}

export async function requireSuperAdmin(): Promise<Session> {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    throw new Error("Unauthorized: No active session");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "super_admin") {
    throw new Error("Forbidden: Super admin access required");
  }

  return session;
}

export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  isSuperAdmin: boolean;
  session: Session | null;
}> {
  const session = await getServerSession(authConfig);

  if (!session || !session.user) {
    return { isAdmin: false, isSuperAdmin: false, session: null };
  }

  const userRole = (session.user as any).role;
  const isAdmin = ["admin", "super_admin"].includes(userRole || "");
  const isSuperAdmin = userRole === "super_admin";

  return { isAdmin, isSuperAdmin, session };
}

// Helper to log admin actions
export async function logAdminAction(
  action: string,
  entity: string,
  entityId?: string,
  changes?: Record<string, unknown>,
  metadata?: Record<string, unknown>
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) return;

    // This will be used by the audit log tRPC endpoint
    return {
      userId: session.user.id,
      action,
      entity,
      entityId,
      changes,
      metadata,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
