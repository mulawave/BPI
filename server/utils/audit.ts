/**
 * Audit logging utilities
 * Creates immutable audit trail for all admin actions
 */

import { prisma } from "../../lib/prisma";
import type { Session } from "next-auth";

export type AuditAction =
  | "MANUAL_ACTIVATION"
  | "PAYMENT_APPROVAL"
  | "PAYMENT_REJECTION"
  | "USER_SUSPEND"
  | "USER_ACTIVATE"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "GATEWAY_CONFIG_UPDATE"
  | "SETTINGS_UPDATE"
  | "WITHDRAWAL_APPROVAL"
  | "WITHDRAWAL_REJECTION"
  | "USER_DELETE"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT";

interface AuditLogData {
  action: AuditAction;
  targetUserId?: string;
  targetType?: string;
  targetId?: string;
  details: Record<string, any>;
}

interface AuditContext {
  session: Session;
  req?: {
    headers: {
      'x-forwarded-for'?: string;
      'user-agent'?: string;
    };
    socket?: {
      remoteAddress?: string;
    };
  };
}

/**
 * Create an audit log entry
 * All admin actions should be logged for compliance and security
 */
export async function createAuditLog(
  ctx: AuditContext,
  data: AuditLogData
) {
  const adminId = ctx.session.user?.id;
  
  // DISABLED - AuditLog model not migrated yet
  // Will be enabled once admin panel database migrations are complete
  console.log('[AUDIT] Skipped:', data.action);
  return null as any;
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs({
  adminId,
  action,
  targetUserId,
  startDate,
  endDate,
  limit = 50,
  offset = 0,
}: {
  adminId?: string;
  action?: AuditAction;
  targetUserId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  // DISABLED - AuditLog model not migrated yet
  console.log('[AUDIT] getAuditLogs called but disabled');
  return [] as any;
  
  /* COMMENTED OUT UNTIL MIGRATION
  return await prisma.auditLog.findMany({
    where: {
      ...(adminId && { adminId }),
      ...(action && { action }),
      ...(targetUserId && { targetUserId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
        },
      }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
  */
}
