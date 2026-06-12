import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { validateFile, saveUploadedFile, IMAGE_AND_PDF_TYPES } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = formData.get("type") as string;

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

    const validDocTypes = ["front", "back", "selfie", "proof_of_address"];
    if (!docType || !validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 },
      );
    }

    const { url: imageUrl } = await saveUploadedFile(
      validation.buffer,
      file.name,
      { subDir: "kyc", filenamePrefix: `${docType}_` },
    );

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("KYC upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
