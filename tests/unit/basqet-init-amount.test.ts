import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { initializeBasqetPayin } from "@/server/services/payment/BasqetClient";

type FetchType = typeof globalThis.fetch;

describe("Basqet initialize payin amount handling", () => {
  const originalFetch: FetchType = globalThis.fetch;

  beforeEach(() => {
    // @ts-ignore override
    globalThis.fetch = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends the exact USD amount provided (no conversion) in initBody.amount", async () => {
    let capturedInitBody: any = null;

    // first call: POST /transaction (initialize)
    // second call: POST /transaction/:id/pay (initiate)
    globalThis.fetch = (async (url: any, opts: any) => {
      if (url.endsWith('/transaction') && opts.method === 'POST') {
        capturedInitBody = JSON.parse(opts.body);
        return {
          ok: true,
          text: async () => JSON.stringify({ status: 'success', data: { id: 'tx-1', reference: 'REF-1', status: 'INITIATED' } }),
        } as any;
      }

      // pay endpoint
      return {
        ok: true,
        text: async () => JSON.stringify({ status: 'success', data: { id: 'tx-1', reference: 'REF-1', payment_address: 'TADDR', payment_amount: 5, payment_currency: 'USDT', status: 'PENDING' } }),
      } as any;
    }) as FetchType;

    const res = await initializeBasqetPayin({
      secretKey: 'sk_test',
      publicKey: 'pk_test',
      reference: 'REF-1',
      amount: 5, // USD — caller-provided exact total
      currency: 'USD',
      customer: { name: 'Test', email: 'test@example.com' },
      currencyId: 3,
    });

    assert.ok(capturedInitBody, 'initBody must be captured');
    // BasqetClient uses String(input.amount) when building initBody
    assert.strictEqual(capturedInitBody.amount, '5');
    assert.strictEqual(res.paymentAmount, 5);
  });
});
