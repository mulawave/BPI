import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import {
  generateCspDonationCertificatePdf,
  loadActiveCspDonationBadgeCategories,
  resolveCspDonationBadgeCategory,
  type CspDonationBadgeCategoryRecord,
} from "@/server/services/csp-donations.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { donationId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string; role?: string }).id;
    const userRole = (session.user as { id?: string; role?: string }).role;
    const isAdmin =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "MANAGER";

    const donation = await prisma.cspDonation.findUnique({
      where: { id: params.donationId },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (donation.donorUserId && donation.donorUserId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized access to this certificate" },
        { status: 403 },
      );
    }

    if (!donation.donorUserId && !isAdmin) {
      return NextResponse.json(
        { error: "Certificate available to admins only" },
        { status: 403 },
      );
    }

    const awardedBadge = donation.badgeAwardedId
      ? await prisma.cspTimeReductionBadge.findUnique({
          where: { id: donation.badgeAwardedId },
          include: {
            Category: {
              select: {
                id: true,
                name: true,
                badgeType: true,
                coolingReductionMonths: true,
              },
            },
          },
        })
      : null;

    const activeCategories = await loadActiveCspDonationBadgeCategories(prisma);
    const badgeCategory =
      (awardedBadge?.Category as CspDonationBadgeCategoryRecord | null) ??
      (donation.amount
        ? resolveCspDonationBadgeCategory(activeCategories, donation.amount)
        : null);
    const pdf = generateCspDonationCertificatePdf({
      donation: {
        id: donation.id,
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        organization: donation.organization,
        amount: donation.amount,
        category: donation.category,
        recognitionPref: donation.recognitionPref,
        createdAt: donation.createdAt,
      },
      badgeCategory,
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="csp-certificate-${donation.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[certificate/csp] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
