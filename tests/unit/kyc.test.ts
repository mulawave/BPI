/**
 * KYC System Unit Tests
 *
 * Validates KYC submission logic, status transitions, document types,
 * expiry detection, admin operations, and data validation patterns.
 */
import { describe, it } from "node:test";
import assert from "node:assert";

// ---------------------------------------------------------------------------
// Helpers – mirror the KYC domain constants/enums
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["pending", "under_review", "approved", "rejected", "expired"] as const;
type KycStatus = (typeof VALID_STATUSES)[number];

const VALID_DOC_TYPES = ["national_id", "passport", "drivers_license", "voters_card"] as const;
type DocType = (typeof VALID_DOC_TYPES)[number];

const VALID_GENDERS = ["male", "female"] as const;

const PROOF_OF_ADDRESS_TYPES = [
  "utility_bill",
  "bank_statement",
  "tax_document",
  "government_letter",
] as const;

/** Validates a BVN (Bank Verification Number) – 11 digits */
function isValidBvn(bvn: string): boolean {
  return /^\d{11}$/.test(bvn);
}

/** Validates a NIN (National Identification Number) – 11 digits */
function isValidNin(nin: string): boolean {
  return /^\d{11}$/.test(nin);
}

/** Checks if a user is at least the minimum age (18) */
function isOldEnough(dob: string, minAge = 18): boolean {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= minAge;
}

/** Is the document expired? */
function isDocExpired(expiryDate: string | Date): boolean {
  return new Date(expiryDate) < new Date();
}

/** Checks if submission can transition from current → target status */
function canTransition(current: KycStatus, target: KycStatus): boolean {
  const allowed: Record<KycStatus, KycStatus[]> = {
    pending: ["under_review", "approved", "rejected"],
    under_review: ["approved", "rejected"],
    approved: ["expired"],
    rejected: [], // user resubmits as a new submission
    expired: [],  // user resubmits as a new submission
  };
  return (allowed[current] || []).includes(target);
}

/** File extension check */
function isAllowedFileType(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext || "");
}

/** File size check (max 10MB) */
function isWithinSizeLimit(bytes: number, maxMb = 10): boolean {
  return bytes <= maxMb * 1024 * 1024;
}

// ---------------------------------------------------------------------------
// KYC Status validation
// ---------------------------------------------------------------------------

describe("KYC status values", () => {
  it("should recognise all valid statuses", () => {
    for (const s of VALID_STATUSES) {
      assert.ok(VALID_STATUSES.includes(s), `${s} should be valid`);
    }
  });

  it("should reject invalid statuses", () => {
    const invalid = ["active", "completed", "verified", "banned", ""];
    for (const s of invalid) {
      assert.ok(!(VALID_STATUSES as readonly string[]).includes(s), `${s} should be invalid`);
    }
  });
});

// ---------------------------------------------------------------------------
// Document type validation
// ---------------------------------------------------------------------------

describe("KYC document types", () => {
  it("should accept national_id", () => {
    assert.ok(VALID_DOC_TYPES.includes("national_id"));
  });

  it("should accept passport", () => {
    assert.ok(VALID_DOC_TYPES.includes("passport"));
  });

  it("should accept drivers_license", () => {
    assert.ok(VALID_DOC_TYPES.includes("drivers_license"));
  });

  it("should accept voters_card", () => {
    assert.ok(VALID_DOC_TYPES.includes("voters_card"));
  });

  it("should reject invalid document type", () => {
    assert.ok(!(VALID_DOC_TYPES as readonly string[]).includes("library_card"));
    assert.ok(!(VALID_DOC_TYPES as readonly string[]).includes("student_id"));
  });
});

// ---------------------------------------------------------------------------
// BVN / NIN validation
// ---------------------------------------------------------------------------

describe("BVN validation", () => {
  it("accepts valid 11-digit BVN", () => {
    assert.strictEqual(isValidBvn("12345678901"), true);
  });

  it("rejects BVN shorter than 11 digits", () => {
    assert.strictEqual(isValidBvn("1234567890"), false);
  });

  it("rejects BVN longer than 11 digits", () => {
    assert.strictEqual(isValidBvn("123456789012"), false);
  });

  it("rejects BVN with letters", () => {
    assert.strictEqual(isValidBvn("1234567890a"), false);
  });

  it("rejects empty BVN", () => {
    assert.strictEqual(isValidBvn(""), false);
  });
});

describe("NIN validation", () => {
  it("accepts valid 11-digit NIN", () => {
    assert.strictEqual(isValidNin("98765432109"), true);
  });

  it("rejects NIN shorter than 11 digits", () => {
    assert.strictEqual(isValidNin("9876543"), false);
  });

  it("rejects NIN with special characters", () => {
    assert.strictEqual(isValidNin("987-654-321"), false);
  });
});

// ---------------------------------------------------------------------------
// Age verification
// ---------------------------------------------------------------------------

describe("age verification", () => {
  it("accepts adult (18+)", () => {
    assert.strictEqual(isOldEnough("1990-06-15"), true);
  });

  it("rejects minor (under 18)", () => {
    const recent = new Date();
    recent.setFullYear(recent.getFullYear() - 10);
    assert.strictEqual(isOldEnough(recent.toISOString().split("T")[0]), false);
  });

  it("handles exact 18th birthday", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 18);
    assert.strictEqual(isOldEnough(dob.toISOString().split("T")[0]), true);
  });

  it("rejects someone turning 18 tomorrow", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 18);
    dob.setDate(dob.getDate() + 1);
    assert.strictEqual(isOldEnough(dob.toISOString().split("T")[0]), false);
  });
});

// ---------------------------------------------------------------------------
// Document expiry
// ---------------------------------------------------------------------------

describe("document expiry detection", () => {
  it("marks past date as expired", () => {
    assert.strictEqual(isDocExpired("2020-01-01"), true);
  });

  it("marks future date as not expired", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    assert.strictEqual(isDocExpired(future.toISOString()), false);
  });

  it("marks yesterday as expired", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    assert.strictEqual(isDocExpired(yesterday.toISOString()), true);
  });
});

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

describe("KYC status transitions", () => {
  it("pending → under_review is allowed", () => {
    assert.strictEqual(canTransition("pending", "under_review"), true);
  });

  it("pending → approved is allowed", () => {
    assert.strictEqual(canTransition("pending", "approved"), true);
  });

  it("pending → rejected is allowed", () => {
    assert.strictEqual(canTransition("pending", "rejected"), true);
  });

  it("under_review → approved is allowed", () => {
    assert.strictEqual(canTransition("under_review", "approved"), true);
  });

  it("under_review → rejected is allowed", () => {
    assert.strictEqual(canTransition("under_review", "rejected"), true);
  });

  it("approved → expired is allowed", () => {
    assert.strictEqual(canTransition("approved", "expired"), true);
  });

  it("rejected → approved is NOT allowed (must resubmit)", () => {
    assert.strictEqual(canTransition("rejected", "approved"), false);
  });

  it("expired → approved is NOT allowed (must resubmit)", () => {
    assert.strictEqual(canTransition("expired", "approved"), false);
  });

  it("approved → rejected is NOT allowed", () => {
    assert.strictEqual(canTransition("approved", "rejected"), false);
  });

  it("pending → expired is NOT allowed directly", () => {
    assert.strictEqual(canTransition("pending", "expired"), false);
  });

  it("expired → pending is NOT allowed", () => {
    assert.strictEqual(canTransition("expired", "pending"), false);
  });
});

// ---------------------------------------------------------------------------
// File upload validation
// ---------------------------------------------------------------------------

describe("KYC file upload validation", () => {
  it("accepts .jpg files", () => {
    assert.strictEqual(isAllowedFileType("document.jpg"), true);
  });

  it("accepts .jpeg files", () => {
    assert.strictEqual(isAllowedFileType("document.jpeg"), true);
  });

  it("accepts .png files", () => {
    assert.strictEqual(isAllowedFileType("scan.png"), true);
  });

  it("accepts .webp files", () => {
    assert.strictEqual(isAllowedFileType("photo.webp"), true);
  });

  it("accepts .pdf files", () => {
    assert.strictEqual(isAllowedFileType("proof.pdf"), true);
  });

  it("rejects .exe files", () => {
    assert.strictEqual(isAllowedFileType("virus.exe"), false);
  });

  it("rejects .svg files", () => {
    assert.strictEqual(isAllowedFileType("image.svg"), false);
  });

  it("rejects .zip files", () => {
    assert.strictEqual(isAllowedFileType("archive.zip"), false);
  });

  it("rejects files without extension", () => {
    assert.strictEqual(isAllowedFileType("noext"), false);
  });
});

describe("KYC file size validation", () => {
  it("accepts files under 10MB", () => {
    assert.strictEqual(isWithinSizeLimit(5 * 1024 * 1024), true);
  });

  it("accepts exactly 10MB", () => {
    assert.strictEqual(isWithinSizeLimit(10 * 1024 * 1024), true);
  });

  it("rejects files over 10MB", () => {
    assert.strictEqual(isWithinSizeLimit(15 * 1024 * 1024), false);
  });

  it("accepts 1 byte file", () => {
    assert.strictEqual(isWithinSizeLimit(1), true);
  });

  it("rejects 11MB file", () => {
    assert.strictEqual(isWithinSizeLimit(11 * 1024 * 1024), false);
  });
});

// ---------------------------------------------------------------------------
// Gender validation
// ---------------------------------------------------------------------------

describe("KYC gender values", () => {
  it("accepts male", () => {
    assert.ok(VALID_GENDERS.includes("male"));
  });

  it("accepts female", () => {
    assert.ok(VALID_GENDERS.includes("female"));
  });

  it("rejects unknown values", () => {
    assert.ok(!(VALID_GENDERS as readonly string[]).includes("other"));
    assert.ok(!(VALID_GENDERS as readonly string[]).includes(""));
  });
});

// ---------------------------------------------------------------------------
// Proof of address types
// ---------------------------------------------------------------------------

describe("proof of address types", () => {
  for (const t of PROOF_OF_ADDRESS_TYPES) {
    it(`accepts ${t}`, () => {
      assert.ok(PROOF_OF_ADDRESS_TYPES.includes(t));
    });
  }

  it("rejects invalid proof type", () => {
    assert.ok(!(PROOF_OF_ADDRESS_TYPES as readonly string[]).includes("selfie"));
    assert.ok(!(PROOF_OF_ADDRESS_TYPES as readonly string[]).includes("random_photo"));
  });
});
