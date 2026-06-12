/**
 * Shared file-upload utilities for API routes.
 *
 * Consolidates the repeated validation → buffer → unique-name → mkdir → write
 * pipeline that was copy-pasted across avatar, KYC, payment-proof, and generic
 * upload routes.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export interface FileValidationOptions {
  /** MIME types to accept (e.g. `["image/jpeg", "image/png"]`). */
  allowedTypes: string[];
  /** Maximum file size in bytes. */
  maxSizeBytes: number;
  /** Human-readable label shown in error messages (e.g. "10 MB"). */
  maxSizeLabel: string;
}

export type FileValidationResult = {
  ok: true;
  buffer: Buffer;
} | {
  ok: false;
  error: string;
};

/**
 * Validate a `File` from `FormData` against type and size constraints and
 * convert it to a `Buffer`.
 */
export async function validateFile(
  file: File,
  opts: FileValidationOptions,
): Promise<FileValidationResult> {
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      ok: false,
      error: `Invalid file type. Allowed: ${opts.allowedTypes.map((t) => t.split("/")[1]?.toUpperCase()).join(", ")}`,
    };
  }

  if (file.size > opts.maxSizeBytes) {
    return {
      ok: false,
      error: `File too large. Maximum size is ${opts.maxSizeLabel}`,
    };
  }

  const bytes = await file.arrayBuffer();
  return { ok: true, buffer: Buffer.from(bytes) };
}

export interface SaveFileOptions {
  /** Sub-directory under `public/uploads/` (e.g. `"avatars"`, `"kyc"`). */
  subDir: string;
  /** Optional prefix prepended to the random filename (e.g. `"front_"`). */
  filenamePrefix?: string;
}

export interface SaveFileResult {
  /** Public URL path (e.g. `/uploads/avatars/abc123.png`). */
  url: string;
  /** Just the filename portion. */
  filename: string;
}

/**
 * Save a validated buffer to `public/uploads/<subDir>/` with a unique name.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string,
  opts: SaveFileOptions,
): Promise<SaveFileResult> {
  const ext = originalName.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const randomName = randomBytes(16).toString("hex");
  const filename = `${opts.filenamePrefix ?? ""}${randomName}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", opts.subDir);
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${opts.subDir}/${filename}`,
    filename,
  };
}

/** Common image MIME types accepted across most upload endpoints. */
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/** Image + PDF MIME types (used by KYC, payment proofs, generic uploads). */
export const IMAGE_AND_PDF_TYPES = [...IMAGE_TYPES, "application/pdf"];
