import { describe, it } from "node:test";
import assert from "node:assert";

import {
  describeProviderAddress,
  detectCryptoAddressKind,
} from "@/server/services/payment/cryptoAddress";

describe("crypto address classification", () => {
  it("classifies TRON addresses as tron/TRC20", () => {
    const address = "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";

    assert.strictEqual(detectCryptoAddressKind(address), "tron");

    const details = describeProviderAddress(address);
    assert.strictEqual(details.displayNetwork, "TRC20");
    assert.strictEqual(details.exactNetwork, true);
    assert.strictEqual(details.networkInstruction, undefined);
  });

  it("classifies 0x addresses as provider-generated and not manual TRC20", () => {
    const address = "0x25869e3c14314497c5DB429E34CBb59787d2D4F9";

    assert.strictEqual(detectCryptoAddressKind(address), "evm");

    const details = describeProviderAddress(address);
    assert.strictEqual(details.displayNetwork, "Provider-generated 0x address");
    assert.strictEqual(details.exactNetwork, false);
    assert.ok(details.networkInstruction?.includes("manual TRC20"));
  });
});