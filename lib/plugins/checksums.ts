import { createHash } from "crypto";

export function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}
