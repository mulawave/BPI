import { describe, it } from "node:test";
import assert from "node:assert";

import {
  describeProviderAddress,
  detectCryptoAddressKind,
} from "@/server/services/payment/cryptoAddress";
import { resolveCryptoPaymentNetworkDetails } from "@/server/services/payment/cryptoPaymentDetails";
import { normalizeCryptoNetwork } from "@/server/services/payment/cryptoNetwork";

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

  it("resolves provider-hinted 0x addresses to BEP20", () => {
    const address = "0x25869e3c14314497c5DB429E34CBb59787d2D4F9";

    const details = describeProviderAddress(address, { providerNetworkHint: "USDT_BEP20" });

    assert.strictEqual(details.displayNetwork, "BEP20");
    assert.strictEqual(details.exactNetwork, true);
    assert.ok(details.networkInstruction?.includes("BEP20"));
  });

  it("normalizes payment_currency values into network labels", () => {
    assert.strictEqual(normalizeCryptoNetwork("USDT_BEP20"), "BEP20");
    assert.strictEqual(normalizeCryptoNetwork("USDT_TRON"), "TRC20");
    assert.strictEqual(normalizeCryptoNetwork("USDT_ERC20"), "ERC20");
  });

  it("prefers provider payment_currency over stale stored network metadata", () => {
    const resolved = resolveCryptoPaymentNetworkDetails({
      cryptoNetwork: "TRC20",
      paymentCurrency: "USDT_BEP20",
      address: "0x25869e3c14314497c5DB429E34CBb59787d2D4F9",
      networkInstruction: "Old instruction",
      providerNetworkExact: false,
    });

    assert.strictEqual(resolved.cryptoNetwork, "BEP20");
    assert.strictEqual(resolved.providerNetworkExact, true);
    assert.ok(resolved.networkInstruction?.includes("BEP20"));
    assert.strictEqual(resolved.addressFormat, "evm");
  });
});