/**
 * Currency utility functions for the BPI platform
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const CURRENCY_NAMES: Record<string, string> = {
  NGN: "Nigerian Naira",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
};

/**
 * Format a number as currency with the appropriate symbol
 * @param amount - The amount to format
 * @param currency - Currency code (default: NGN)
 * @param options - Formatting options
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN",
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    showCode?: boolean;
  }
): string {
  const {
    showSymbol = true,
    decimals = 2,
    showCode = false,
  } = options || {};

  const symbol = CURRENCY_SYMBOLS[currency] || "";
  const formattedAmount = amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let result = formattedAmount;

  if (showSymbol && symbol) {
    result = `${symbol}${formattedAmount}`;
  }

  if (showCode) {
    result = `${result} ${currency}`;
  }

  return result;
}

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @param rates - Exchange rates object (base: NGN)
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates?: Record<string, number>
): number {
  // Default exchange rates (NGN base)
  const defaultRates: Record<string, number> = {
    NGN: 1,
    USD: 1500,
    EUR: 1650,
    GBP: 1900,
  };

  const exchangeRates = rates || defaultRates;

  const fromRate = exchangeRates[from] || 1;
  const toRate = exchangeRates[to] || 1;

  // Convert to base currency (NGN), then to target currency
  const baseAmount = amount * fromRate;
  const convertedAmount = baseAmount / toRate;

  return convertedAmount;
}

/**
 * Get the currency symbol for a currency code
 * @param currency - Currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get the currency name for a currency code
 * @param currency - Currency code
 */
export function getCurrencyName(currency: string): string {
  return CURRENCY_NAMES[currency] || currency;
}

/**
 * Get display string for currency (symbol and code)
 * @param currency - Currency code
 */
export function getCurrencyDisplay(currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol} ${currency}`;
}

/**
 * Parse a currency string to a number
 * @param value - Currency string (e.g., "₦1,000.00")
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[₦$€£,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

/**
 * Format a number as Nigerian Naira (shorthand)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatNaira(amount: number, decimals: number = 0): string {
  return formatCurrency(amount, "NGN", { decimals });
}

/**
 * Calculate percentage of an amount
 * @param amount - Base amount
 * @param percentage - Percentage value (e.g., 7.5 for 7.5%)
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Add VAT to an amount (7.5% for Nigeria)
 * @param amount - Base amount
 * @param vatRate - VAT rate (default: 7.5)
 */
export function addVAT(amount: number, vatRate: number = 7.5): number {
  return amount + calculatePercentage(amount, vatRate);
}

/**
 * Calculate total cost including VAT
 * @param baseAmount - Base amount before VAT
 * @param vatRate - VAT rate (default: 7.5)
 */
export function calculateTotalWithVAT(
  baseAmount: number,
  vatRate: number = 7.5
): {
  base: number;
  vat: number;
  total: number;
} {
  const vat = calculatePercentage(baseAmount, vatRate);
  const total = baseAmount + vat;

  return { base: baseAmount, vat, total };
}
