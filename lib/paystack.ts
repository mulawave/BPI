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
  }
): Promise<PaystackInitializeResponse> {
  console.log("🔷 [PAYSTACK-API] Initializing payment...");
  console.log("📋 [PAYSTACK-API] Request params:", {
    email: params.email,
    amount: params.amount / 100, // Show in naira
    reference: params.reference,
  });

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
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
