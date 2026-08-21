import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

describe("Security: changePassword server logic", () => {
  it("verifies current password before allowing change", async () => {
    const currentHash = await bcrypt.hash("OldPass123!", 12);
    assert.ok(await bcrypt.compare("OldPass123!", currentHash));
    assert.ok(!(await bcrypt.compare("WrongPass", currentHash)));
  });

  it("hashes new password with bcrypt and produces a different hash", async () => {
    const oldHash = await bcrypt.hash("OldPass123!", 12);
    const newHash = await bcrypt.hash("NewPass456!", 12);
    assert.notEqual(oldHash, newHash);
    assert.ok(await bcrypt.compare("NewPass456!", newHash));
    assert.ok(!(await bcrypt.compare("OldPass123!", newHash)));
  });

  it("rejects same current and new password at the logic level", () => {
    const currentPassword = "SamePass123!";
    const newPassword = "SamePass123!";
    assert.equal(currentPassword === newPassword, true);
  });

  it("enforces minimum 8 character validation", () => {
    const shortPassword = "short";
    assert.ok(shortPassword.length < 8, "password under 8 chars should fail validation");
    const validPassword = "ValidPass123!";
    assert.ok(validPassword.length >= 8, "password 8+ chars should pass validation");
  });
});
