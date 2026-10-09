// Pure helper with no server dependencies: PaystackGateway is bundled into client pages.

/**
 * The amount a Paystack transaction actually paid towards our charge. When
 * fees are passed to the customer, `amount` includes Paystack's fee and
 * `requested_amount` is what we asked for; the fee is not an overpayment.
 * Both values are in kobo; returns naira.
 */
export function paystackPaidNgn(data: { amount?: number | null; requested_amount?: number | null }): number | null {
  const amount = Number(data.amount);
  if (!Number.isFinite(amount)) return null;
  const requested = Number(data.requested_amount);
  const paid = Number.isFinite(requested) && requested > 0 ? Math.min(requested, amount) : amount;
  return paid / 100;
}
