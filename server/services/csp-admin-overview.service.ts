import { prisma } from "@/lib/prisma";

export async function getCspAdminOverview(auditPage: number, auditLimit: number) {
  const [totalDonatedAgg, ongoingBroadcasts, totalRequests, releasedRequests, topContributorsRaw] = await Promise.all([
    prisma.cspContribution.aggregate({ _sum: { amount: true } }),
    prisma.cspSupportRequest.findMany({
      where: { status: "broadcasting", isActive: true },
      select: { id: true, raisedAmount: true, thresholdAmount: true, requestedAmount: true, category: true, User: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.cspSupportRequest.count(),
    prisma.cspSupportRequest.count({ where: { status: "released" } }),
    prisma.cspContribution.groupBy({
      by: ["contributorId"],
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    }),
  ]);

  const topContributorIds = topContributorsRaw.map((c) => c.contributorId);
  const [topContributorUsers, autoDebitSettings, autoContributeSettings] = await Promise.all([
    topContributorIds.length > 0 ? prisma.user.findMany({
      where: { id: { in: topContributorIds } },
      select: { id: true, name: true, email: true, image: true, wallet: true, community: true, activated: true, activeMembershipPackageId: true },
    }) : Promise.resolve([]),
    prisma.walletAutoDebitSetting.findMany({ where: { userId: { in: topContributorIds } }, select: { userId: true, isEnabled: true } }),
    prisma.cspAutoContributeSetting.findMany({ where: { userId: { in: topContributorIds } }, select: { userId: true, isEnabled: true } }),
  ]);

  const membershipPackageIds = topContributorUsers.map((u) => u.activeMembershipPackageId).filter((id): id is string => id != null);
  const membershipPackages = membershipPackageIds.length > 0
    ? await prisma.membershipPackage.findMany({ where: { id: { in: membershipPackageIds } }, select: { id: true, name: true } })
    : [];
  const membershipMap = new Map(membershipPackages.map((p) => [p.id, p.name]));
  const autoDebitMap = new Map(autoDebitSettings.map((s) => [s.userId, s.isEnabled]));
  const autoContributeMap = new Map(autoContributeSettings.map((s) => [s.userId, s.isEnabled]));
  const userMap = new Map(topContributorUsers.map((u) => [u.id, u]));

  const topDonators = topContributorsRaw.map((c) => {
    const user = userMap.get(c.contributorId);
    return {
      userId: c.contributorId,
      name: user?.name ?? "Unknown",
      email: user?.email ?? "—",
      avatar: user?.image ?? null,
      cashWalletBalance: user?.wallet ?? 0,
      communityWalletBalance: user?.community ?? 0,
      isAutoContribute: autoContributeMap.get(c.contributorId) ?? false,
      isAutoDebit: autoDebitMap.get(c.contributorId) ?? false,
      activated: user?.activated ?? false,
      membershipPlan: user?.activeMembershipPackageId ? (membershipMap.get(user.activeMembershipPackageId) ?? "Unknown") : "None",
      totalDonated: c._sum.amount ?? 0,
      contributionCount: c._count.id,
    };
  });

  const ongoingTotalRaised = ongoingBroadcasts.reduce((sum, b) => sum + b.raisedAmount, 0);
  const ongoingTotalTarget = ongoingBroadcasts.reduce((sum, b) => sum + b.thresholdAmount, 0);

  const [auditLogs, auditTotal] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: "CSP_RELEASE_FUNDS" },
      orderBy: { createdAt: "desc" },
      skip: (auditPage - 1) * auditLimit,
      take: auditLimit,
      include: { User: { select: { id: true, name: true, email: true, image: true } } },
    }),
    prisma.auditLog.count({ where: { action: "CSP_RELEASE_FUNDS" } }),
  ]);

  const auditRequestIds = auditLogs.map((a) => a.entityId).filter((id): id is string => id != null);
  const auditRequests = auditRequestIds.length > 0
    ? await prisma.cspSupportRequest.findMany({
        where: { id: { in: auditRequestIds } },
        select: { id: true, userId: true, category: true, amount: true, requestedAmount: true, thresholdAmount: true, raisedAmount: true, status: true, createdAt: true, releasedAt: true, User: { select: { id: true, name: true, email: true, image: true } } },
      })
    : [];
  const auditRequestMap = new Map(auditRequests.map((r) => [r.id, r]));

  const auditTrail = auditLogs.map((a) => {
    const req = a.entityId ? auditRequestMap.get(a.entityId) : null;
    const meta = (a.metadata as any) ?? {};
    return {
      auditLogId: a.id,
      requestId: a.entityId ?? null,
      adminName: a.User?.name ?? "Unknown",
      adminEmail: a.User?.email ?? "—",
      action: a.action,
      status: a.status,
      errorMessage: a.errorMessage,
      createdAt: a.createdAt,
      request: req ? {
        requestId: req.id,
        beneficiaryName: req.User?.name ?? "Unknown",
        beneficiaryEmail: req.User?.email ?? "—",
        beneficiaryAvatar: req.User?.image ?? null,
        category: req.category,
        broadcastAmount: req.amount,
        requestedAmount: req.requestedAmount,
        thresholdAmount: req.thresholdAmount,
        raisedAmount: req.raisedAmount,
        status: req.status,
        createdAt: req.createdAt,
        releasedAt: req.releasedAt,
      } : null,
      distribution: meta.shares ?? null,
      totalReleased: meta.totalReleased ?? null,
      fullyFunded: meta.fullyFunded ?? null,
    };
  });

  return {
    stats: {
      totalDonated: totalDonatedAgg._sum.amount ?? 0,
      totalRequests,
      releasedRequests,
      ongoingBroadcastsCount: ongoingBroadcasts.length,
      ongoingTotalRaised,
      ongoingTotalTarget,
    },
    ongoingBroadcasts: ongoingBroadcasts.map((b) => ({
      requestId: b.id,
      category: b.category,
      raisedAmount: b.raisedAmount,
      thresholdAmount: b.thresholdAmount,
      requestedAmount: b.requestedAmount,
      beneficiaryName: b.User?.name ?? "Unknown",
      beneficiaryEmail: b.User?.email ?? "—",
    })),
    topDonators,
    auditTrail,
    auditPagination: { page: auditPage, limit: auditLimit, total: auditTotal, totalPages: Math.ceil(auditTotal / auditLimit) },
  };
}
