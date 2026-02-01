import { test, expect } from "@playwright/test";

type ClaimStatus = "NOT_READY" | "CODE_ISSUED" | "VERIFIED" | "COMPLETED";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED";

const claimTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  NOT_READY: ["CODE_ISSUED"],
  CODE_ISSUED: ["VERIFIED"],
  VERIFIED: ["COMPLETED"],
  COMPLETED: [],
};

const verificationAllowedOrderStatuses: OrderStatus[] = ["PAID", "PROCESSING", "DELIVERED"];

const completionAllowedClaimStatuses: ClaimStatus[] = ["VERIFIED"];

const claimCodePattern = /^BPI-[0-9]{6}-PC$/;

test.describe("claim flow guards", () => {
  test("claim status transitions are one-way", () => {
    Object.entries(claimTransitions).forEach(([from, toList]) => {
      toList.forEach((to) => {
        expect(toList).toContain(to);
      });
      // Ensure no reverse transitions are allowed
      Object.keys(claimTransitions).forEach((candidate) => {
        if (candidate === from) return;
        expect(toList).not.toContain(candidate as ClaimStatus);
      });
    });
  });

  test("verification requires allowed order status", () => {
    const allowed = new Set(verificationAllowedOrderStatuses);
    expect(allowed.has("PAID")).toBeTruthy();
    expect(allowed.has("PROCESSING")).toBeTruthy();
    expect(allowed.has("DELIVERED")).toBeTruthy();
    expect(allowed.has("FAILED")).toBeFalsy();
    expect(allowed.has("REFUNDED")).toBeFalsy();
  });

  test("completion requires verified claim", () => {
    const allowed = new Set(completionAllowedClaimStatuses);
    expect(allowed.has("VERIFIED")).toBeTruthy();
    expect(allowed.has("CODE_ISSUED")).toBeFalsy();
    expect(allowed.has("COMPLETED")).toBeFalsy();
  });

  test("claim code format matches enforced pattern", () => {
    expect(claimCodePattern.test("BPI-123456-PC")).toBeTruthy();
    expect(claimCodePattern.test("bpi-123456-pc")).toBeTruthy();
    expect(claimCodePattern.test("BPI-ABCDEF-PC")).toBeFalsy();
    expect(claimCodePattern.test("BPI-12345-PC")).toBeFalsy();
  });
});
