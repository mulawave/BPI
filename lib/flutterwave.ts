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
  try {
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: params.accountBank,
        account_number: params.accountNumber,
        amount: params.amount,
        narration: params.narration,
        currency: params.currency || 'NGN',
        reference: params.reference,
        beneficiary_name: params.beneficiaryName,
        debit_currency: 'NGN',
      }),
    });

    if (!response.ok) {
      throw new Error(`Flutterwave transfer error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    }

    throw new Error(result.message || 'Transfer initiation failed');
  } catch (error) {
    console.error('Error initiating transfer:', error);
    throw error;
  }
}
