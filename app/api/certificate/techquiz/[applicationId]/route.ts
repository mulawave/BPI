import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { generateTechQuizCertificateHTML } from "@/server/services/techquizCertificate.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role as string | undefined;
    const isAdmin =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "MANAGER";

    const application = await prisma.techQuizApplication.findUnique({
      where: { id: params.applicationId },
      include: {
        childBeneficiary: true,
        event: true,
        school: true,
        result: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify ownership or admin access
    if (application.parentUserId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized access to this certificate" },
        { status: 403 }
      );
    }

    const result = application.result;
    if (!result || result.finalRank === null || !result.finalPublished) {
      return NextResponse.json(
        { error: "Certificate not available — final results have not been published yet" },
        { status: 404 }
      );
    }

    const html = generateTechQuizCertificateHTML({
      childName: application.childBeneficiary.childName,
      schoolName: application.school.name,
      state: application.school.state,
      eventTitle: application.event.title,
      finalRank: result.finalRank,
      awardBracket: result.awardBracket ?? "Participant Award",
      certifiedAt: new Date(),
      applicationId: application.id,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[certificate/techquiz] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
