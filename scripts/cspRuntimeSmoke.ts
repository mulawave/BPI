/*
  CSP runtime smoke (server-side):
  - Seeds an admin and a normal user with active membership
  - Creates a CSP support request for the user via Prisma
  - Calls selected CSP router procedures with mocked tRPC context

  Usage:
    npx tsx scripts/cspRuntimeSmoke.ts
*/

import { prisma } from '@/lib/prisma';
import { cspRouter } from '@/server/trpc/router/csp';
import { randomUUID } from 'crypto';

// Create a minimal session object that satisfies protectedProcedure
function createSessionForUser(userId: string, role: string = 'user') {
  return {
    user: { id: userId, role } as any,
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  } as any;
}

async function ensureUser(email: string, role: string, activeMembership: boolean) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return await prisma.user.update({
      where: { id: existing.id },
      data: {
        role,
        activeMembershipPackageId: activeMembership ? (existing.activeMembershipPackageId ?? 'pkg_test') : null,
      },
      select: { id: true },
    });
  }
  const id = randomUUID();
  const u = await prisma.user.create({
    data: {
      id,
      email,
      role,
      activeMembershipPackageId: activeMembership ? 'pkg_test' : null,
    },
    select: { id: true },
  });
  return u;
}

async function main() {
  // Seed users
  const admin = await ensureUser('admin+csp-smoke@example.com', 'superadmin', true);
  const user = await ensureUser('user+csp-smoke@example.com', 'user', true);

  // Create a request for user if none
  const existingReq = await prisma.cspSupportRequest.findFirst({ where: { userId: user.id, status: 'pending' } });
  const req = existingReq || await prisma.cspSupportRequest.create({
    data: {
      userId: user.id,
      category: 'national',
      status: 'pending',
      amount: 10000,
      purpose: 'Test support',
      thresholdAmount: 10000,
    },
  });

  // Build mocked contexts
  const userSession = createSessionForUser(user.id, 'user');
  const adminSession = createSessionForUser(admin.id, 'superadmin');

  // Create tRPC callers
  const userCaller = cspRouter.createCaller({ session: userSession, prisma } as any);
  const adminCaller = cspRouter.createCaller({ session: adminSession, prisma } as any);

  // Call router procedures
  const eligibility = await userCaller.getEligibility();
  const listForAdmin = await adminCaller.adminListRequests({ page: 1, pageSize: 10 });

  console.log('Eligibility:', eligibility);
  console.log('Admin list total:', listForAdmin.total, 'items:', listForAdmin.items?.length ?? 0);
}

main().catch((e) => {
  console.error('CSP runtime smoke failed:', e);
  process.exit(1);
});
