import { createHash } from "crypto";

export type SignatureContractInput = {
  archiveSha256: string;
  manifestSha256: string;
  keyId?: string;
  algorithm?: string;
  signatureContent?: string;
  publisherPublicKey?: string;
};

export type SignatureVerificationResult = {
  valid: boolean;
  mode: "verified" | "stub" | "failed";
  reason?: string;
  digest?: string;
};

const HEX_SHA256 = /^[A-Fa-f0-9]{64}$/;

export function buildSignatureContractDigest(input: Pick<SignatureContractInput, "archiveSha256" | "manifestSha256" | "keyId" | "algorithm">): string {
  const payload = [
    input.archiveSha256,
    input.manifestSha256,
    input.keyId || "unknown-key",
    input.algorithm || "unknown-algorithm",
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export function verifyPluginSignatureContract(input: SignatureContractInput): SignatureVerificationResult {
  if (!HEX_SHA256.test(input.archiveSha256) || !HEX_SHA256.test(input.manifestSha256)) {
    return {
      valid: false,
      mode: "failed",
      reason: "Archive or manifest checksum is not a valid SHA-256 hex value.",
    };
  }

  const digest = buildSignatureContractDigest(input);

  if (!input.keyId || !input.algorithm) {
    return {
      valid: false,
      mode: "failed",
      reason: "Signature metadata is missing keyId or algorithm.",
      digest,
    };
  }

  // Phase one contract: verification is stubbed unless a trusted key and detached signature are supplied.
  if (!input.publisherPublicKey || !input.signatureContent) {
    return {
      valid: true,
      mode: "stub",
      reason: "Signature verification contract accepted in stub mode for phase one.",
      digest,
    };
  }

  // Phase one does not execute cryptographic verification yet. This path is reserved for Batch 8+.
  return {
    valid: true,
    mode: "stub",
    reason: "Signature payload accepted; cryptographic verify path is deferred.",
    digest,
  };
}
