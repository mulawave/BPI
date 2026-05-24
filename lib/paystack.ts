/**
 * Paystack API Integration
 * Handles payment initialization and verification
 */

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    paid_at: string;
    channel: string;
    customer: {
      email: string;
      customer_code: string;
    };
  };
}

/**
 * Initialize a Paystack payment
 */
export async function initializePaystackPayment(
  secretKey: string,
  params: {
    email: string;
    amount: number; // In kobo (multiply naira by 100)
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, any>;
    channels?: string[]; // e.g. ["bank_transfer"], ["card"], ["ussd"]
  }
): Promise<PaystackInitializeResponse> {
  console.log("🔷 [PAYSTACK-API] Initializing payment...");
  console.log("📋 [PAYSTACK-API] Request params:", {
    email: params.email,
    amount: params.amount / 100, // Show in naira
    reference: params.reference,
    channels: params.channels,
  });

  try {
    const body: Record<string, unknown> = {
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    };
    if (params.channels?.length) {
      body.channels = params.channels;
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log("📥 [PAYSTACK-API] Response received. Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [PAYSTACK-API] Request failed:", response.status, errorText);
      throw new Error(`Paystack initialization error: ${response.statusText}`);
    }

    const result: PaystackInitializeResponse = await response.json();
    console.log("✅ [PAYSTACK-API] Payment initialized:", result.data.authorization_url);

    return result;
  } catch (error) {
    console.error('❌ [PAYSTACK-API] Error initializing payment:', error);
    throw error;
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPaystackPayment(
  secretKey: string,
  reference: string
): Promise<PaystackVerifyResponse> {
  console.log("🔍 [PAYSTACK-API] Verifying payment:", reference);

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("📥 [PAYSTACK-API] Response received. Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [PAYSTACK-API] Request failed:", response.status, errorText);
      throw new Error(`Paystack verification error: ${response.statusText}`);
    }

    const result: PaystackVerifyResponse = await response.json();
    console.log("📦 [PAYSTACK-API] Verification result:", result.data.status);

    return result;
  } catch (error) {
    console.error('❌ [PAYSTACK-API] Error verifying payment:', error);
    throw error;
  }
}

// ─── DVA (Dedicated Virtual Account) helpers ─────────────────────────

export interface PaystackDVAResponse {
  status: boolean;
  message: string;
  data: {
    bank: { name: string; id: number; slug: string };
    account_name: string;
    account_number: string;
    assigned: boolean;
    currency: string;
    active: boolean;
    id: number;
    customer: { customer_code: string; email: string };
  };
}

/**
 * Create a Paystack customer (required before creating a DVA)
 */
export async function createPaystackCustomer(
  secretKey: string,
  params: { email: string; first_name?: string; last_name?: string; phone?: string }
): Promise<{ customer_code: string }> {
  const response = await fetch("https://api.paystack.co/customer", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Paystack create customer failed: ${err}`);
  }
  const result = await response.json();
  return { customer_code: result.data.customer_code };
}

// ─── Bank List ───────────────────────────────────────────────────────

export interface PaystackBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  type: string;
  active: boolean;
  country: string;
  currency: string;
}

/**
 * Fetch list of Nigerian banks from Paystack
 */
export async function getPaystackBanks(secretKey: string): Promise<PaystackBank[]> {
  const response = await fetch(
    'https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=200&type=nuban',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Paystack bank list failed: ${err}`);
  }

  const result = await response.json();

  if (!result.status) {
    throw new Error(result.message || 'Paystack bank list returned an error');
  }

  return (result.data ?? []) as PaystackBank[];
}

/**
 * Create a Dedicated Virtual Account for a customer
 */
export async function createPaystackDVA(
  secretKey: string,
  params: { customer: string; preferred_bank?: string }
): Promise<PaystackDVAResponse> {
  const response = await fetch("https://api.paystack.co/dedicated_account", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Paystack DVA creation failed: ${err}`);
  }
  return response.json();
}
