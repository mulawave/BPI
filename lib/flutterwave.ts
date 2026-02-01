/**
 * Flutterwave API Integration
 * Handles bank verification and account details lookup
 */

interface FlutterwaveBank {
  id: number;
  code: string;
  name: string;
}

interface AccountVerificationResponse {
  status: string;
  message: string;
  data: {
    account_number: string;
    account_name: string;
  };
}

/**
 * Get list of Nigerian banks from Flutterwave
 */
export async function getFlutterwaveBanks(secretKey: string): Promise<FlutterwaveBank[]> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Flutterwave API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    }

    throw new Error(result.message || 'Failed to fetch banks');
  } catch (error) {
    console.error('Error fetching Flutterwave banks:', error);
    throw error;
  }
}

/**
 * Verify bank account details using Flutterwave
 */
export async function verifyBankAccount(
  secretKey: string,
  accountNumber: string,
  bankCode: string
): Promise<{ accountName: string; accountNumber: string }> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_number: accountNumber,
        account_bank: bankCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flutterwave API error: ${response.statusText}`);
    }

    const result: AccountVerificationResponse = await response.json();
    
    if (result.status === 'success') {
      return {
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
      };
    }

    throw new Error(result.message || 'Account verification failed');
  } catch (error) {
    console.error('Error verifying bank account:', error);
    throw error;
  }
}

/**
 * Initiate bank transfer via Flutterwave
 */
export async function initiateBankTransfer(
  secretKey: string,
  params: {
    accountBank: string; // Bank code
    accountNumber: string;
    amount: number;
    narration: string;
    currency?: string;
    reference: string;
    beneficiaryName?: string;
  }
) {
  console.log("🌐 [FLUTTERWAVE-API] Initiating bank transfer...");
  console.log("📋 [FLUTTERWAVE-API] Request params:", {
    bank: params.accountBank,
    account: `****${params.accountNumber.slice(-4)}`,
    amount: params.amount,
    currency: params.currency || 'NGN',
    reference: params.reference,
    beneficiary: params.beneficiaryName
  });
  
  try {
    const requestBody = {
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount,
      narration: params.narration,
      currency: params.currency || 'NGN',
      reference: params.reference,
      beneficiary_name: params.beneficiaryName,
      debit_currency: 'NGN',
    };
    
    console.log("📤 [FLUTTERWAVE-API] Sending request to Flutterwave...");
    console.log("🔑 [FLUTTERWAVE-API] Using secret key:", secretKey ? `${secretKey.substring(0, 15)}...` : 'NOT SET');
    console.log("🔍 [FLUTTERWAVE-API] Full request body (DEBUG):", JSON.stringify({
      ...requestBody,
      account_number: requestBody.account_number, // Full unmasked account number sent to API
    }, null, 2));
    
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 [FLUTTERWAVE-API] Response received. Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [FLUTTERWAVE-API] Request failed:", response.status, errorText);
      throw new Error(`Flutterwave transfer error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("📦 [FLUTTERWAVE-API] Response body:", JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      console.log("✅ [FLUTTERWAVE-API] Transfer successful!");
      console.log("📊 [FLUTTERWAVE-API] Transfer details:", {
        id: result.data?.id,
        reference: result.data?.reference,
        status: result.data?.status,
        amount: result.data?.amount,
        fee: result.data?.fee
      });
      return result.data;
    }

    console.error("❌ [FLUTTERWAVE-API] Transfer failed:", result.message);
    throw new Error(result.message || 'Transfer initiation failed');
  } catch (error) {
    console.error('❌ [FLUTTERWAVE-API] Error initiating transfer:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Initialize Flutterwave payment
 */
export async function initializeFlutterwavePayment(
  secretKey: string,
  params: {
    txRef: string;
    amount: number;
    currency: string;
    redirectUrl: string;
    customer: {
      email: string;
      name?: string;
      phonenumber?: string;
    };
    customizations?: {
      title?: string;
      description?: string;
      logo?: string;
    };
    meta?: Record<string, any>;
  }
) {
  console.log("🌐 [FLUTTERWAVE-API] Initializing payment...");
  console.log("📋 [FLUTTERWAVE-API] Request params:", {
    txRef: params.txRef,
    amount: params.amount,
    currency: params.currency,
    customer: params.customer.email,
  });

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: params.txRef,
        amount: params.amount,
        currency: params.currency,
        redirect_url: params.redirectUrl,
        customer: params.customer,
        customizations: params.customizations,
        meta: params.meta,
        payment_options: 'card,banktransfer,ussd',
      }),
    });

    console.log("📥 [FLUTTERWAVE-API] Response received. Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [FLUTTERWAVE-API] Request failed:", response.status, errorText);
      throw new Error(`Flutterwave payment error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ [FLUTTERWAVE-API] Payment initialized");

    if (result.status === 'success') {
      return {
        paymentLink: result.data.link,
        reference: params.txRef,
      };
    }

    throw new Error(result.message || 'Payment initialization failed');
  } catch (error) {
    console.error('❌ [FLUTTERWAVE-API] Error initializing payment:', error);
    throw error;
  }
}

/**
 * Verify Flutterwave payment
 */
export async function verifyFlutterwavePayment(
  secretKey: string,
  transactionId: string
) {
  console.log("🔍 [FLUTTERWAVE-API] Verifying payment:", transactionId);

  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("📥 [FLUTTERWAVE-API] Response received. Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [FLUTTERWAVE-API] Request failed:", response.status, errorText);
      throw new Error(`Flutterwave verification error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("📦 [FLUTTERWAVE-API] Verification result:", result.data?.status);

    if (result.status === 'success') {
      return result.data;
    }

    throw new Error(result.message || 'Verification failed');
  } catch (error) {
    console.error('❌ [FLUTTERWAVE-API] Error verifying payment:', error);
    throw error;
  }
}
