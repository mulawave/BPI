import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  convertCurrency,
  getCurrencySymbol,
  getCurrencyName,
  getCurrencyDisplay,
  parseCurrency,
  formatNaira,
  calculatePercentage,
  addVAT,
  calculateTotalWithVAT,
} from "@/lib/currency";

describe("formatCurrency", () => {
  it("formats NGN with symbol by default", () => {
    const result = formatCurrency(1000);
    assert.ok(result.startsWith("₦"));
    assert.ok(result.includes("1,000"));
  });

  it("formats USD with dollar sign", () => {
    const result = formatCurrency(1000, "USD");
    assert.ok(result.startsWith("$"));
  });

  it("formats EUR with euro sign", () => {
    const result = formatCurrency(500, "EUR");
    assert.ok(result.startsWith("€"));
  });

  it("formats GBP with pound sign", () => {
    const result = formatCurrency(250, "GBP");
    assert.ok(result.startsWith("£"));
  });

  it("respects showSymbol=false", () => {
    const result = formatCurrency(1000, "NGN", { showSymbol: false });
    assert.ok(!result.startsWith("₦"));
    assert.ok(result.includes("1,000"));
  });

  it("appends currency code when showCode=true", () => {
    const result = formatCurrency(1000, "USD", { showCode: true });
    assert.ok(result.endsWith("USD"));
  });

  it("respects custom decimal places", () => {
    const result = formatCurrency(1000.5, "NGN", { decimals: 0 });
    assert.ok(!result.includes("."));
  });

  it("handles unknown currency without symbol", () => {
    const result = formatCurrency(100, "XYZ");
    assert.equal(result, "100.00");
  });

  it("handles zero amount", () => {
    const result = formatCurrency(0, "NGN");
    assert.equal(result, "₦0.00");
  });
});

describe("convertCurrency", () => {
  it("converts NGN to USD with default rates", () => {
    const result = convertCurrency(1500, "NGN", "USD");
    assert.equal(result, 1);
  });

  it("converts USD to NGN with default rates", () => {
    const result = convertCurrency(1, "USD", "NGN");
    assert.equal(result, 1500);
  });

  it("converts same currency (identity)", () => {
    const result = convertCurrency(500, "NGN", "NGN");
    assert.equal(result, 500);
  });

  it("uses custom rates when provided", () => {
    const rates = { NGN: 1, USD: 1600 };
    const result = convertCurrency(1, "USD", "NGN", rates);
    assert.equal(result, 1600);
  });

  it("falls back to rate=1 for unknown currencies", () => {
    const result = convertCurrency(100, "XYZ", "NGN");
    assert.equal(result, 100);
  });
});

describe("getCurrencySymbol", () => {
  it("returns ₦ for NGN", () => {
    assert.equal(getCurrencySymbol("NGN"), "₦");
  });

  it("returns the code itself for unknown currency", () => {
    assert.equal(getCurrencySymbol("XYZ"), "XYZ");
  });
});

describe("getCurrencyName", () => {
  it("returns full name for known currencies", () => {
    assert.equal(getCurrencyName("NGN"), "Nigerian Naira");
    assert.equal(getCurrencyName("USD"), "US Dollar");
  });

  it("returns code for unknown currency", () => {
    assert.equal(getCurrencyName("XYZ"), "XYZ");
  });
});

describe("getCurrencyDisplay", () => {
  it("returns symbol + code", () => {
    assert.equal(getCurrencyDisplay("NGN"), "₦ NGN");
    assert.equal(getCurrencyDisplay("USD"), "$ USD");
  });
});

describe("parseCurrency", () => {
  it("parses naira string", () => {
    assert.equal(parseCurrency("₦1,000.00"), 1000);
  });

  it("parses dollar string", () => {
    assert.equal(parseCurrency("$500.50"), 500.5);
  });

  it("returns 0 for non-numeric string", () => {
    assert.equal(parseCurrency("abc"), 0);
  });

  it("handles empty string", () => {
    assert.equal(parseCurrency(""), 0);
  });
});

describe("formatNaira", () => {
  it("formats with 0 decimals by default", () => {
    const result = formatNaira(1000);
    assert.equal(result, "₦1,000");
  });

  it("respects custom decimal count", () => {
    const result = formatNaira(1000.567, 2);
    assert.equal(result, "₦1,000.57");
  });
});

describe("calculatePercentage", () => {
  it("calculates 7.5% of 1000", () => {
    assert.equal(calculatePercentage(1000, 7.5), 75);
  });

  it("calculates 100% of amount", () => {
    assert.equal(calculatePercentage(500, 100), 500);
  });

  it("returns 0 for 0%", () => {
    assert.equal(calculatePercentage(1000, 0), 0);
  });
});

describe("addVAT", () => {
  it("adds 7.5% VAT by default", () => {
    assert.equal(addVAT(1000), 1075);
  });

  it("adds custom VAT rate", () => {
    assert.equal(addVAT(1000, 10), 1100);
  });
});

describe("calculateTotalWithVAT", () => {
  it("returns breakdown with default 7.5% VAT", () => {
    const result = calculateTotalWithVAT(1000);
    assert.equal(result.base, 1000);
    assert.equal(result.vat, 75);
    assert.equal(result.total, 1075);
  });

  it("uses custom VAT rate", () => {
    const result = calculateTotalWithVAT(2000, 10);
    assert.equal(result.base, 2000);
    assert.equal(result.vat, 200);
    assert.equal(result.total, 2200);
  });
});
