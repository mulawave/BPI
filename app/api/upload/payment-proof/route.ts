import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { authLimiter, applyRateLimit } from "@/lib/rateLimit";
import { validateFile, saveUploadedFile, IMAGE_AND_PDF_TYPES } from "@/lib/upload";

export async function POST(request: NextRequest) {
  // Rate limit: 10 uploads per minute per IP
  const blocked = applyRateLimit(request, authLimiter);
  if (blocked) return blocked;

  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("proof") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validation = await validateFile(file, {
      allowedTypes: IMAGE_AND_PDF_TYPES,
      maxSizeBytes: 10 * 1024 * 1024,
      maxSizeLabel: "10MB",
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { url: proofUrl } = await saveUploadedFile(
      validation.buffer,
      file.name,
      { subDir: "payment-proofs" },
    );

    return NextResponse.json({
      success: true,
      proofUrl,
      message: "Payment proof uploaded successfully",
    });
  } catch (error) {
    console.error("Payment proof upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload payment proof" },
      { status: 500 },
    );
  }
}
