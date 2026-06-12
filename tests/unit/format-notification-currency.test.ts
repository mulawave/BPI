import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatNotificationCurrency } from "@/lib/formatNotificationCurrency";

describe("formatNotificationCurrency", () => {
  const identity = (n: number) => `$${n.toFixed(2)}`;

  it("replaces a simple ₦ amount", () => {
    const result = formatNotificationCurrency("You earned ₦1000", identity);
    assert.equal(result, "You earned $1000.00");
  });

  it("replaces ₦ amount with commas", () => {
    const result = formatNotificationCurrency("Paid ₦25,000 today", identity);
    assert.equal(result, "Paid $25000.00 today");
  });

  it("replaces ₦ amount with decimals", () => {
    const result = formatNotificationCurrency("Balance: ₦100.50", identity);
    assert.equal(result, "Balance: $100.50");
  });

  it("replaces multiple ₦ amounts in one message", () => {
    const result = formatNotificationCurrency(
      "Sent ₦5,000 and received ₦10,000",
      identity,
    );
    assert.equal(result, "Sent $5000.00 and received $10000.00");
  });

  it("leaves message unchanged if no ₦ pattern is found", () => {
    const msg = "No currency here";
    const result = formatNotificationCurrency(msg, identity);
    assert.equal(result, msg);
  });

  it("passes parsed amount to formatAmount callback", () => {
    const calls: number[] = [];
    formatNotificationCurrency("₦1,500", (n) => {
      calls.push(n);
      return String(n);
    });
    assert.deepStrictEqual(calls, [1500]);
  });
});
