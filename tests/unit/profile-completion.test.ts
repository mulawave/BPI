import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkProfileCompletion,
  getCompletionMessage,
} from "@/lib/profile-completion";

describe("checkProfileCompletion", () => {
  it("returns 100% for a fully complete profile", () => {
    const result = checkProfileCompletion({
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      mobile: "+2341234567890",
      address: "123 Main St",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      gender: "Male",
      image: "https://example.com/photo.jpg",
    });
    assert.equal(result.isComplete, true);
    assert.equal(result.completionPercentage, 100);
    assert.equal(result.missingFields.length, 0);
  });

  it("returns 0% for an empty profile", () => {
    const result = checkProfileCompletion({});
    assert.equal(result.isComplete, false);
    assert.equal(result.completionPercentage, 0);
    assert.equal(result.missingFields.length, result.requiredFieldsCount);
  });

  it("counts null fields as incomplete", () => {
    const result = checkProfileCompletion({
      firstname: "John",
      lastname: null,
      email: "john@example.com",
    });
    assert.ok(result.missingFields.includes("Last Name"));
  });

  it("counts empty strings as incomplete", () => {
    const result = checkProfileCompletion({
      firstname: "",
    });
    assert.ok(result.missingFields.includes("First Name"));
  });

  it("counts 'not set' as incomplete", () => {
    const result = checkProfileCompletion({
      firstname: "not set",
    });
    assert.ok(result.missingFields.includes("First Name"));
  });

  it("counts whitespace-only as incomplete", () => {
    const result = checkProfileCompletion({
      firstname: "   ",
    });
    assert.ok(result.missingFields.includes("First Name"));
  });

  it("calculates correct percentage for partial completion", () => {
    const result = checkProfileCompletion({
      firstname: "John",
      lastname: "Doe",
      email: "john@example.com",
      mobile: "+2341234567890",
      address: "123 Main St",
    });
    assert.equal(result.completedFieldsCount, 5);
    assert.equal(result.completionPercentage, 50);
  });
});

describe("getCompletionMessage", () => {
  it("returns success message for complete profile", () => {
    const msg = getCompletionMessage({
      isComplete: true,
      completionPercentage: 100,
      missingFields: [],
      requiredFieldsCount: 10,
      completedFieldsCount: 10,
    });
    assert.ok(msg.includes("100%"));
  });

  it("returns singular message for 1 missing field", () => {
    const msg = getCompletionMessage({
      isComplete: false,
      completionPercentage: 90,
      missingFields: ["Profile Picture"],
      requiredFieldsCount: 10,
      completedFieldsCount: 9,
    });
    assert.ok(msg.includes("1 field left"));
    assert.ok(msg.includes("Profile Picture"));
  });

  it("returns plural message for multiple missing fields", () => {
    const msg = getCompletionMessage({
      isComplete: false,
      completionPercentage: 50,
      missingFields: ["Phone", "Address", "City", "State", "Country"],
      requiredFieldsCount: 10,
      completedFieldsCount: 5,
    });
    assert.ok(msg.includes("5 more fields"));
  });
});
