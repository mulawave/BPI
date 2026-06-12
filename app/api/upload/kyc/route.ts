import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const VALID_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = formData.get("type") as string; // front, back, selfie, proof_of_address

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const validDocTypes = ["front", "back", "selfie", "proof_of_address"];
    if (!docType || !validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const SAFE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
    const rawExt = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileExtension = SAFE_EXTENSIONS.has(rawExt) ? rawExt : "bin";
    const randomName = randomBytes(16).toString("hex");
    const uniqueFilename = `${docType}_${randomName}.${fileExtension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "kyc");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/kyc/${uniqueFilename}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("KYC upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
