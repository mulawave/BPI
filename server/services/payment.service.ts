import { prisma } from "../../lib/prisma";
import { randomUUID } from "crypto";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  balanceAfter?: number;
}

/**
 * Process membership package payment from user's wallet
 * @param userId - The user making the payment
 * @param packageId - The membership package being purchased
 * @param amount - Total amount to charge (including VAT)
 * @param description - Payment description
 * @returns PaymentResult with success status and details
 */
export async function processWalletPayment(
  userId: string,
  packageId: string,
  amount: number,
  description: string
): Promise<PaymentResult> {
  try {
    // Get current user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wallet: true, name: true, email: true }
    });

    if (!user) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Check if user has sufficient balance
    if (user.wallet < amount) {
      return {
        success: false,
        error: `Insufficient balance. You have ₦${user.wallet.toLocaleString()} but need ₦${amount.toLocaleString()}`
      };
    }

    // Deduct amount from wallet
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wallet: { decrement: amount }
      },
      select: { wallet: true }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "DEBIT",
        amount,
        description,
        status: "SUCCESS",
        reference: `MEM-${packageId}-${Date.now()}`
      }
    });

    return {
      success: true,
      transactionId: transaction.id,
      balanceAfter: updatedUser.wallet
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    return {
      success: false,
      error: "Payment processing failed. Please try again."
    };
  }
}

/**
 * Process renewal payment from user's wallet
 * @param userId - The user making the renewal payment
 * @param packageId - The membership package being renewed
 * @param renewalFee - Renewal fee (including VAT)
 * @returns PaymentResult with success status and details
 */
export async function processRenewalPayment(
  userId: string,
  packageId: string,
  renewalFee: number
): Promise<PaymentResult> {
  return processWalletPayment(
    userId,
    packageId,
    renewalFee,
    `Membership Renewal - Package ${packageId}`
  );
}

/**
 * Process empowerment package payment
 * @param userId - The sponsor making the payment
 * @param beneficiaryId - The beneficiary ID
 * @param totalCost - Total package cost (including VAT)
 * @returns PaymentResult with success status and details
 */
export async function processEmpowermentPayment(
  userId: string,
  beneficiaryId: string,
  totalCost: number
): Promise<PaymentResult> {
  return processWalletPayment(
    userId,
    beneficiaryId,
    totalCost,
    `Empowerment Package Activation - Beneficiary ${beneficiaryId}`
  );
}

/**
 * Refund a payment (in case of errors during activation)
 * @param userId - User to refund
 * @param amount - Amount to refund
 * @param reason - Refund reason
 * @returns PaymentResult with success status
 */
export async function refundPayment(
  userId: string,
  amount: number,
  reason: string
): Promise<PaymentResult> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        wallet: { increment: amount }
      },
      select: { wallet: true }
    });

    // Create refund transaction record
    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        userId,
        transactionType: "CREDIT",
        amount,
        description: `Refund: ${reason}`,
        status: "SUCCESS",
        reference: `REFUND-${Date.now()}`
      }
    });

    return {
      success: true,
      balanceAfter: updatedUser.wallet
    };
  } catch (error) {
    console.error("Refund processing error:", error);
    return {
      success: false,
      error: "Refund processing failed"
    };
  }
}
