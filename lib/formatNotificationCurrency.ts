/**
 * Replace hardcoded ₦ + amount patterns in notification messages with the user's
 * selected currency format.  Stored notification messages use NGN amounts, so we
 * parse the raw number and pass it through formatAmount (which converts from NGN
 * to the active currency).
 *
 * Matches patterns like: ₦1,000  ₦25,000.50  ₦100
 */
export function formatNotificationCurrency(
  message: string,
  formatAmount: (amountInNGN: number, decimals?: number) => string,
): string {
  // ₦ followed by digits with optional commas and optional decimal part
  return message.replace(/₦([\d,]+(?:\.\d+)?)/g, (_match, numStr: string) => {
    const num = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(num)) return _match; // leave unchanged if parse fails
    return formatAmount(num);
  });
}
