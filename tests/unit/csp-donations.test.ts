import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCspDonationCertificateUrl,
  generateCspDonationCertificatePdf,
  resolveCspDonationBadgeCategory,
} from "@/server/services/csp-donations.service";

const categories = [
  {
    id: "bronze",
    name: "Bronze Donor",
    minAmount: 50000,
    maxAmount: 99999,
    badgeType: "Bronze Time Reduction Badge",
    coolingReductionMonths: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "silver",
    name: "Silver Donor",
    minAmount: 100000,
    maxAmount: 249999,
    badgeType: "Silver Time Reduction Badge",
    coolingReductionMonths: 2,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "legacy",
    name: "Legacy Partner",
    minAmount: 5000000,
    maxAmount: null,
    badgeType: "Legacy Time Reduction Badge",
    coolingReductionMonths: 12,
    isActive: true,
    sortOrder: 7,
  },
];

describe("resolveCspDonationBadgeCategory", () => {
  it("selects the matching active category by amount", () => {
    const resolved = resolveCspDonationBadgeCategory(categories, 125000);

    assert.equal(resolved?.name, "Silver Donor");
    assert.equal(resolved?.coolingReductionMonths, 2);
  });

  it("returns null below the first category", () => {
    const resolved = resolveCspDonationBadgeCategory(categories, 1000);

    assert.equal(resolved, null);
  });

  it("resolves the open-ended legacy tier", () => {
    const resolved = resolveCspDonationBadgeCategory(categories, 9000000);

    assert.equal(resolved?.name, "Legacy Partner");
  });
});

describe("buildCspDonationCertificateUrl", () => {
  it("builds the certificate download route", () => {
    assert.equal(
      buildCspDonationCertificateUrl("donation_123"),
      "/api/certificate/csp/donation_123",
    );
  });
});

describe("generateCspDonationCertificatePdf", () => {
  it("emits a PDF with the donor name and badge info", () => {
    const pdf = generateCspDonationCertificatePdf({
      donation: {
        id: "donation_123",
        donorName: "Ada Example",
        donorEmail: "ada@example.com",
        organization: "Example Org",
        amount: 125000,
        category: "Silver Donor",
        recognitionPref: "public",
        createdAt: new Date("2026-06-29T00:00:00Z"),
      },
      badgeCategory: categories[1],
      issuedAt: new Date("2026-06-29T00:00:00Z"),
    });

    const output = pdf.toString("latin1");
    assert.match(output, /^%PDF-1\.4/m);
    assert.match(output, /Ada Example/);
    assert.match(output, /Silver Time Reduction Badge/);
    assert.match(output, /Time Reduction Badges never expire/);
  });
});
