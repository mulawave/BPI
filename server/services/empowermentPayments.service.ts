// Empowerment Payment Service
// Shared empowerment package finalization logic used by both
// the tRPC activateEmpowerment procedure and webhook handlers.

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { recordRevenue } from "@/server/services/revenue.service";
import { notifyEmpowermentActivation } from "@/server/services/notification.service";

export async function finalizeEmpowermentPackage(params: {
  sponsorId: string;
  beneficiary: { id: string; name: string | null; email: string | null };
  empowermentType: "CHILD_EDUCATION" | "VOCATIONAL_SKILL";
  packageFee: number;
  vat: number;
  totalCost: number;
}) {
  const { sponsorId, beneficiary, empowermentType, packageFee, vat, totalCost } = params;

  // Idempotency guard: prevent duplicate packages for the same sponsor+beneficiary
  // within a short window (e.g. webhook retry)
  const recentCutoff = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  const existingPackage = await prisma.empowermentPackage.findFirst({
    where: {
      sponsorId,
      beneficiaryId: beneficiary.id,
      empowermentType,
      activatedAt: { gte: recentCutoff },
    },
  });
  if (existingPackage) {
    console.warn(
      `[EMPOWERMENT] Duplicate finalization blocked for sponsor=${sponsorId}, beneficiary=${beneficiary.id}, existing=${existingPackage.id}`
    );
    return { maturityDate: existingPackage.maturityDate, empowermentPackage: existingPackage };
  }

  const GROSS_EMPOWERMENT_VALUE = 7250000;
  const GROSS_SPONSOR_REWARD = 1000000;
  const TAX_RATE = 0.075;

  const netEmpowermentValue = GROSS_EMPOWERMENT_VALUE * (1 - TAX_RATE);
  const netSponsorReward = GROSS_SPONSOR_REWARD * (1 - TAX_RATE);

  const activatedAt = new Date();
  const maturityDate = new Date(activatedAt);
  maturityDate.setMonth(maturityDate.getMonth() + 24);

  const empowermentPackage = await prisma.empowermentPackage.create({
    data: {
      id: randomUUID(),
      updatedAt: new Date(),
      sponsorId,
      beneficiaryId: beneficiary.id,
      packageFee,
      vat,
      empowermentType,
      status: "Active - Countdown Running",
      activatedAt,
      maturityDate,
      grossEmpowermentValue: GROSS_EMPOWERMENT_VALUE,
      netEmpowermentValue,
      grossSponsorReward: GROSS_SPONSOR_REWARD,
      netSponsorReward,
      beneficiaryCanView: true,
      beneficiaryCanWithdraw: false,
    },
  });

  await recordRevenue(prisma, {
    source: "OTHER",
    sourceKey: "EMPOWERMENT_PACKAGE_FEE",
    amount: totalCost,
    currency: "NGN",
    sourceId: empowermentPackage.id,
    description: `Empowerment package fee paid by ${sponsorId} for ${beneficiary.name || beneficiary.email || "beneficiary"}`,
    userId: sponsorId,
    programType: "EMPOWERMENT",
    metadata: {
      sponsorId,
      beneficiaryId: beneficiary.id,
      empowermentType,
      packageFee,
      vat,
      totalCost,
    },
  });

  await prisma.user.update({
    where: { id: beneficiary.id },
    data: { sponsorId },
  });

  await prisma.empowermentTransaction.create({
    data: {
      id: randomUUID(),
      empowermentPackageId: empowermentPackage.id,
      transactionType: "ACTIVATION",
      grossAmount: totalCost,
      taxAmount: 0,
      netAmount: totalCost,
      description: `Empowerment package activated by sponsor ${sponsorId} for beneficiary ${beneficiary.name || beneficiary.email || beneficiary.id}`,
      performedBy: sponsorId,
    },
  });

  // Best-effort notification — don't fail the whole finalization
  try {
    await notifyEmpowermentActivation(sponsorId, beneficiary.id, maturityDate);
  } catch (notifError) {
    console.error("[EMPOWERMENT] Notification failed (non-fatal):", notifError);
  }

  return { maturityDate, empowermentPackage };
}
