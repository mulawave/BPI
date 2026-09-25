import { PaymentStatus } from "./types";

/** The fields needed from a gateway verification (PaymentVerification or PaymentResponse). */
export type VerificationLike = {
  success: boolean;
  status?: PaymentStatus;
  error?: string;
  metadata?: Record<string, any>;
};

export type GatewayOutcome = "success" | "failed" | "pending";

/** Raw gateway statuses that mean the payment can never succeed. */
const DEFINITIVE_FAILURE_STATUSES = new Set(["failed", "reversed", "cancelled", "canceled", "declined"]);

/**
 * How long a payment may sit unpaid (abandoned checkout, transfer never sent,
 * reference unknown to the gateway) before the recovery cron expires it.
 * A signature-verified success webhook can still fulfil it afterwards.
 */
export const UNPAID_EXPIRY_MS = 24 * 60 * 60 * 1000;

function rawGatewayStatus(verification: VerificationLike): string {
  const meta = (verification.metadata ?? {}) as Record<string, any>;
  const raw = meta.status ?? meta.flutterwaveData?.status ?? "";
  return String(raw).trim().toLowerCase();
}

/**
 * Classify a gateway verification result.
 *
 * Only a definitive failure reported by the gateway counts as "failed".
 * Anything else that is not a success — Paystack "abandoned"/"ongoing"/
 * "pending"/"processing"/"queued", crypto "not yet confirmed", reference not
 * found yet, or a network/verification error — is "pending", because the
 * customer may still be completing the payment.
 */
export function classifyGatewayVerification(verification: VerificationLike): GatewayOutcome {
  const successStates = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESSFUL];
  if (verification.success && (!verification.status || successStates.includes(verification.status))) {
    return "success";
  }
  if (verification.error) return "pending";
  if (DEFINITIVE_FAILURE_STATUSES.has(rawGatewayStatus(verification))) return "failed";
  return "pending";
}

/** Recovery-cron decision for a non-successful verification. */
export function recoveryActionForUnpaid(outcome: GatewayOutcome, ageMs: number): "reject" | "expire" | "wait" {
  if (outcome === "failed") return "reject";
  if (outcome === "pending" && ageMs >= UNPAID_EXPIRY_MS) return "expire";
  return "wait";
}
