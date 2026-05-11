export const PAYMENT_FULFILLMENT_TYPES = {
  MEMBERSHIP: "MEMBERSHIP",
  MEMBERSHIP_UPGRADE: "MEMBERSHIP_UPGRADE",
  EMPOWERMENT: "EMPOWERMENT",
  DEPOSIT: "DEPOSIT",
  STORE_PURCHASE: "STORE_PURCHASE",
} as const;

export type PaymentFulfillmentType =
  (typeof PAYMENT_FULFILLMENT_TYPES)[keyof typeof PAYMENT_FULFILLMENT_TYPES];

export function resolvePaymentFulfillmentType(
  rawPurpose?: string | null,
  fallbackTransactionType?: string | null
): PaymentFulfillmentType | null {
  const normalized = (rawPurpose || fallbackTransactionType || "").trim().toUpperCase();

  switch (normalized) {
    case "MEMBERSHIP":
    case "MEMBERSHIP_PAYMENT":
      return PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP;
    case "UPGRADE":
    case "MEMBERSHIP_UPGRADE":
      return PAYMENT_FULFILLMENT_TYPES.MEMBERSHIP_UPGRADE;
    case "EMPOWERMENT":
    case "EMPOWERMENT_PACKAGE_FEE":
      return PAYMENT_FULFILLMENT_TYPES.EMPOWERMENT;
    case "DEPOSIT":
    case "TOPUP":
      return PAYMENT_FULFILLMENT_TYPES.DEPOSIT;
    case "STORE_PURCHASE":
      return PAYMENT_FULFILLMENT_TYPES.STORE_PURCHASE;
    default:
      return null;
  }
}