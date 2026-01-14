import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/server/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
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

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload an image (JPEG/PNG/GIF/WEBP) or PDF",
        },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split(".").pop() || "bin";
    const randomName = randomBytes(16).toString("hex");
    const uniqueFilename = `${randomName}.${fileExtension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-proofs");

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const proofUrl = `/uploads/payment-proofs/${uniqueFilename}`;

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
