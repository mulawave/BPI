import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { validateFile, saveUploadedFile, IMAGE_AND_PDF_TYPES } from "@/lib/upload";

const ALLOWED_FOLDERS = new Set(["products", "pickup-centers", "third-party-platforms", "uploads"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    const validation = await validateFile(file, {
      allowedTypes: IMAGE_AND_PDF_TYPES,
      maxSizeBytes: 10 * 1024 * 1024,
      maxSizeLabel: "10 MB",
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { url, filename } = await saveUploadedFile(
      validation.buffer,
      file.name,
      { subDir: folder },
    );

    return NextResponse.json({ success: true, url, filename });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
