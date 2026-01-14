// Type extensions for Prisma models that may not be recognized due to cache issues
// These models exist in schema.prisma - run `npx prisma generate` if you see errors

import type { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    auditLog: any;
    pendingPayment: any;
    paymentGatewayConfig: any;
    adminNotificationSettings: any;
  }
}
