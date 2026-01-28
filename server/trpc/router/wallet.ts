import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { notifyDepositStatus, notifyWithdrawalStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { randomUUID } from "crypto";

// Default admin settings (will be overridden by DB settings)
const DEFAULT_CASH_WITHDRAWAL_FEE = 100;
const DEFAULT_BPT_WITHDRAWAL_FEE = 0;
const DEFAULT_MAX_TRANSFER_AMOUNT = 500000;
const DEFAULT_AUTO_WITHDRAWAL_THRESHOLD = 100000;

// Helper function to get admin setting
async function getAdminSetting(key: string, defaultValue: number): Promise<number> {
  const setting = await prisma.adminSettings.findUnique({
    where: { settingKey: key }
  });
  return setting ? parseFloat(setting.settingValue) : defaultValue;
}

export const walletRouter = createTRPCRouter({
  
  // ============================================
  // DEPOSIT ENDPOINT
  // ============================================
  deposit: protectedProcedure
    .input(z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      paymentGateway: z.enum(['paystack', 'flutterwave', 'bank-transfer', 'utility-token', 'crypto', 'mock']),
      reference: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, paymentGateway, reference } = input;
      const txReference = reference || `DEP-${Date.now()}`;

      // Calculate VAT (7.5% added on top)
      const vatRate = 0.075;
      const vatAmount = amount * vatRate;
      const totalAmount = amount + vatAmount;

      // For now, only mock payment is implemented
      if (paymentGateway !== 'mock') {
        throw new Error(`${paymentGateway} integration coming soon! Use mock payment for testing.`);
      }

      // Send pending notification
      await notifyDepositStatus(userId, "pending", amount, txReference);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Send processing notification
      await notifyDepositStatus(userId, "processing", amount, txReference);

      try {
        // Add funds to main wallet
        await prisma.user.update({
          where: { id: userId },
          data: {
            wallet: { increment: amount }
          }
        });

        // Create deposit transaction
        const transaction = await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: amount,
            description: `Wallet deposit via ${paymentGateway}`,
            status: "completed",
            reference: txReference,
            walletType: 'main',
          }
        });

        // Create VAT transaction
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "VAT",
            amount: vatAmount,
            description: `VAT on wallet deposit (7.5%)`,
            status: "completed",
            reference: `VAT-DEP-${Date.now()}`,
            walletType: 'main',
          }
        });

        // Generate receipt link
        const receiptUrl = generateReceiptLink(transaction.id, 'deposit');

        // Send success notification with receipt
        await notifyDepositStatus(userId, "completed", amount, txReference, receiptUrl);

        return {
          success: true,
          message: `Successfully deposited ₦${amount.toLocaleString()}. VAT: ₦${vatAmount.toFixed(2)}`,
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
          receiptUrl,
          transactionId: transaction.id
        };
      } catch (error) {
        // Send failure notification
        await notifyDepositStatus(userId, "failed", amount, txReference);
        throw error;
      }
    }),

  // ============================================
  // WITHDRAWAL ENDPOINT
  // ============================================
  withdraw: protectedProcedure
    .input(z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      withdrawalType: z.enum(['cash', 'bpt']),
      sourceWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business']),
      // Bank details (required for cash withdrawal)
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
      // Crypto details (required for BPT withdrawal)
      bnbWalletAddress: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, withdrawalType, sourceWallet, bankName, accountNumber, accountName, bnbWalletAddress } = input;
      const txReference = `WD-${withdrawalType.toUpperCase()}-${Date.now()}`;

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) throw new Error("User not found");
      if (user.withdrawBan === 1) throw new Error("Your account is banned from withdrawals. Contact support.");

      // EMPOWERMENT GATE: Block education & empowermentSponsorReward withdrawals until final admin confirmation
      if (sourceWallet === 'education' || sourceWallet === 'empowermentSponsorReward') {
        // Check if user has an empowerment package with released funds
        const empowermentPackage = await prisma.empowermentPackage.findFirst({
          where: {
            OR: [
              { beneficiaryId: userId },
              { sponsorId: userId }
            ],
            status: "Empowerment Released (Tax At Withdrawal)"
          },
          orderBy: { releasedAt: 'desc' }
        });

        if (!empowermentPackage) {
          throw new Error(
            sourceWallet === 'education'
              ? "Education funds are not available for withdrawal. Awaiting final admin confirmation."
              : "Empowerment sponsor reward is not available for withdrawal. Awaiting final admin confirmation."
          );
        }
      }

      // Check balance
      const currentBalance = (user as any)[sourceWallet] || 0;
      
      // Get withdrawal fee from admin settings
      const withdrawalFee = withdrawalType === 'cash' 
        ? await getAdminSetting('CASH_WITHDRAWAL_FEE', DEFAULT_CASH_WITHDRAWAL_FEE)
        : await getAdminSetting('BPT_WITHDRAWAL_FEE', DEFAULT_BPT_WITHDRAWAL_FEE);

      // Apply tax for empowerment-related wallets (education, empowermentSponsorReward)
      const taxRate = 0.075; // 7.5%
      const isEmpowermentWallet = sourceWallet === 'education' || sourceWallet === 'empowermentSponsorReward';
      const taxAmount = isEmpowermentWallet ? Math.round(amount * taxRate * 100) / 100 : 0;
      
      const totalDeduction = amount + withdrawalFee + taxAmount;

      if (currentBalance < totalDeduction) {
        const breakdown = isEmpowermentWallet
          ? `₦${amount.toLocaleString()} + ₦${withdrawalFee.toLocaleString()} fee + ₦${taxAmount.toLocaleString()} tax`
          : `₦${amount.toLocaleString()} + ₦${withdrawalFee.toLocaleString()} fee`;
        throw new Error(`Insufficient balance. You need ₦${totalDeduction.toLocaleString()} (${breakdown})`);
      }

      // Validate withdrawal details
      if (withdrawalType === 'cash') {
        if (!bankName || !accountNumber || !accountName) {
          throw new Error("Bank details are required for cash withdrawal. Please provide bank name, account number, and account name.");
        }
      } else {
        // BPT withdrawal
        if (!bnbWalletAddress) {
          throw new Error("BNB wallet address is required for BPT withdrawal. Please provide your BNB wallet address.");
        }
      }

      // Check if withdrawal requires admin approval
      const autoWithdrawalThreshold = await getAdminSetting('AUTO_WITHDRAWAL_THRESHOLD', DEFAULT_AUTO_WITHDRAWAL_THRESHOLD);
      const requiresApproval = amount >= autoWithdrawalThreshold;
      const status = requiresApproval ? "pending" : "processing";

      try {
        // Deduct from source wallet
        await prisma.user.update({
          where: { id: userId },
          data: {
            [sourceWallet]: { decrement: totalDeduction }
          }
        });

        // Create withdrawal transaction
        const transaction = await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: `WITHDRAWAL_${withdrawalType.toUpperCase()}`,
            amount: -amount,
            description: `${withdrawalType === 'cash' ? 'Cash' : 'BPT'} withdrawal from ${sourceWallet} wallet`,
            status,
            reference: txReference
          }
        });

        // Create fee transaction
        if (withdrawalFee > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "WITHDRAWAL_FEE",
              amount: -withdrawalFee,
              description: `Withdrawal fee (${withdrawalType})`,
              status: "completed",
              reference: `FEE-WD-${Date.now()}`
            }
          });
        }

        // Create tax transaction for empowerment wallets
        if (taxAmount > 0) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "TAX_PAYMENT",
              amount: -taxAmount,
              description: `Tax on ${sourceWallet} wallet withdrawal (7.5%)`,
              status: "completed",
              reference: `TAX-WD-${Date.now()}`,
              walletType: sourceWallet
            }
          });
        }

        // Create withdrawal history record
        await prisma.withdrawalHistory.create({
          data: {
            id: randomUUID(),
            userId,
            description: `${withdrawalType === 'cash' ? 'Cash' : 'BPT'} withdrawal - ${sourceWallet} wallet`,
            amount,
            currency: withdrawalType === 'cash' ? 'NGN' : 'BPT',
            status,
            date: new Date()
          }
        });

        // Send appropriate notification based on status
        if (requiresApproval) {
          await notifyWithdrawalStatus(userId, "pending", amount, txReference);
        } else {
          await notifyWithdrawalStatus(userId, "processing", amount, txReference);
          
          // Simulate processing time for auto-approved withdrawals
          setTimeout(async () => {
            // Update transaction status to completed
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: "completed" }
            });

            await prisma.withdrawalHistory.updateMany({
              where: { 
                userId,
                amount,
                status: "processing"
              },
              data: { status: "completed" }
            });

            // Generate receipt link
            const receiptUrl = generateReceiptLink(transaction.id, 'withdrawal');

            // Send completion notification
            await notifyWithdrawalStatus(userId, "completed", amount, txReference, receiptUrl);
          }, 3000); // 3 seconds processing time
        }

        const messageBreakdown = taxAmount > 0
          ? `₦${amount.toLocaleString()} + ₦${withdrawalFee} fee + ₦${taxAmount} tax`
          : `₦${amount.toLocaleString()} + ₦${withdrawalFee} fee`;

        return {
          success: true,
          message: requiresApproval 
            ? `Withdrawal request submitted for admin approval (${messageBreakdown})`
            : `Withdrawal is being processed (${messageBreakdown})`,
          amount,
          fee: withdrawalFee,
          tax: taxAmount,
          totalDeducted: totalDeduction,
          requiresApproval,
          status,
          transactionId: transaction.id
        };
      } catch (error) {
        // Send failure notification
        await notifyWithdrawalStatus(userId, "failed", amount, txReference);
        throw error;
      }
    }),

  // ============================================
  // INTER-WALLET TRANSFER
  // ============================================
  transferInterWallet: protectedProcedure
    .input(z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      fromWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business']),
      toWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business'])
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, fromWallet, toWallet } = input;

      if (fromWallet === toWallet) {
        throw new Error("Cannot transfer to the same wallet");
      }

      // EMPOWERMENT GATE: Block transfers from education & empowermentSponsorReward until final admin confirmation
      if (fromWallet === 'education' || fromWallet === 'empowermentSponsorReward') {
        const empowermentPackage = await prisma.empowermentPackage.findFirst({
          where: {
            OR: [
              { beneficiaryId: userId },
              { sponsorId: userId }
            ],
            status: "Empowerment Released (Tax At Withdrawal)"
          },
          orderBy: { releasedAt: 'desc' }
        });

        if (!empowermentPackage) {
          throw new Error(
            fromWallet === 'education'
              ? "Education funds are locked. Awaiting final admin confirmation before any transfers are allowed."
              : "Empowerment sponsor reward is locked. Awaiting final admin confirmation before any transfers are allowed."
          );
        }
      }

      // Get max transfer limit
      const maxTransferAmount = await getAdminSetting('MAX_TRANSFER_AMOUNT', DEFAULT_MAX_TRANSFER_AMOUNT);
      
      if (amount > maxTransferAmount) {
        throw new Error(`Transfer amount exceeds maximum limit of ₦${maxTransferAmount.toLocaleString()}`);
      }

      // Get user's current balances
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          [fromWallet]: true,
          [toWallet]: true
        }
      });

      if (!user) throw new Error("User not found");

      const sourceBalance = (user as any)[fromWallet] || 0;
      
      if (sourceBalance < amount) {
        throw new Error(`Insufficient balance in ${fromWallet} wallet. Available: ₦${sourceBalance.toLocaleString()}`);
      }

      // Perform atomic transfer
      await prisma.user.update({
        where: { id: userId },
        data: {
          [fromWallet]: { decrement: amount },
          [toWallet]: { increment: amount }
        }
      });

      // Create transaction record - store actual transfer amount for display
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "INTER_WALLET_TRANSFER",
          amount: amount, // Store the actual amount transferred for transaction history
          description: `Transfer from ${fromWallet} to ${toWallet} wallet`,
          status: "completed",
          reference: `IWT-${Date.now()}`
        }
      });

      return {
        success: true,
        message: `Successfully transferred ₦${amount.toLocaleString()} from ${fromWallet} to ${toWallet}`,
        amount,
        fromWallet,
        toWallet
      };
    }),

  // ============================================
  // USER-TO-USER TRANSFER
  // ============================================
  transferToUser: protectedProcedure
    .input(z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      recipientIdentifier: z.string().min(1, "Recipient username or email is required"),
      sourceWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business']),
      note: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, recipientIdentifier, sourceWallet, note } = input;

      // EMPOWERMENT GATE: Block transfers from education & empowermentSponsorReward until final admin confirmation
      if (sourceWallet === 'education' || sourceWallet === 'empowermentSponsorReward') {
        const empowermentPackage = await prisma.empowermentPackage.findFirst({
          where: {
            OR: [
              { beneficiaryId: userId },
              { sponsorId: userId }
            ],
            status: "Empowerment Released (Tax At Withdrawal)"
          },
          orderBy: { releasedAt: 'desc' }
        });

        if (!empowermentPackage) {
          throw new Error(
            sourceWallet === 'education'
              ? "Education funds are locked. Awaiting final admin confirmation before any transfers are allowed."
              : "Empowerment sponsor reward is locked. Awaiting final admin confirmation before any transfers are allowed."
          );
        }
      }

      // Get max transfer limit
      const maxTransferAmount = await getAdminSetting('MAX_TRANSFER_AMOUNT', DEFAULT_MAX_TRANSFER_AMOUNT);
      
      if (amount > maxTransferAmount) {
        throw new Error(`Transfer amount exceeds maximum limit of ₦${maxTransferAmount.toLocaleString()}`);
      }

      // Find recipient by username or email
      const recipient = await prisma.user.findFirst({
        where: {
          OR: [
            { username: recipientIdentifier },
            { email: recipientIdentifier }
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true
        }
      });

      if (!recipient) {
        throw new Error("Recipient not found. Please check the username or email.");
      }

      if (recipient.id === userId) {
        throw new Error("Cannot transfer to yourself. Use inter-wallet transfer instead.");
      }

      // Get sender's balance
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          [sourceWallet]: true,
          name: true
        }
      });

      if (!sender) throw new Error("User not found");

      const sourceBalance = (sender as any)[sourceWallet] || 0;
      
      if (sourceBalance < amount) {
        throw new Error(`Insufficient balance in ${sourceWallet} wallet. Available: ₦${sourceBalance.toLocaleString()}`);
      }

      // Perform atomic transfer (sender -> recipient's main wallet)
      await prisma.$transaction([
        // Deduct from sender
        prisma.user.update({
          where: { id: userId },
          data: {
            [sourceWallet]: { decrement: amount }
          }
        }),
        // Add to recipient's main wallet
        prisma.user.update({
          where: { id: recipient.id },
          data: {
            wallet: { increment: amount }
          }
        })
      ]);

      // Create transaction for sender
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "TRANSFER_SENT",
          amount: -amount,
          description: `Transfer to ${recipient.name || recipient.username}${note ? `: ${note}` : ''}`,
          status: "completed",
          reference: `TXF-SENT-${Date.now()}`
        }
      });

      // Create transaction for recipient
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: recipient.id,
          transactionType: "TRANSFER_RECEIVED",
          amount: amount,
          description: `Transfer from ${sender.name || 'User'}${note ? `: ${note}` : ''}`,
          status: "completed",
          reference: `TXF-RCV-${Date.now()}`
        }
      });

      return {
        success: true,
        message: `Successfully transferred ₦${amount.toLocaleString()} to ${recipient.name || recipient.username}`,
        amount,
        recipient: {
          name: recipient.name,
          username: recipient.username
        }
      };
    }),

  // ============================================
  // GET USER BANK DETAILS
  // ============================================
  getBankDetails: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    return {
      bankName: null,
      accountNumber: null,
      accountName: null,
      bnbWalletAddress: null,
      message: "Bank details fields are not yet added to the schema. Please add them to the User model in schema.prisma."
    };
  }),

  // ============================================
  // UPDATE BANK DETAILS
  // ============================================
  updateBankDetails: protectedProcedure
    .input(z.object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
      bnbWalletAddress: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      // Note: Bank details fields (bankName, accountNumber, accountName, bnbWalletAddress)
      // need to be added to the User model in schema.prisma before this can work
      // For now, we'll just return success without updating

      return {
        success: false,
        message: "Bank details fields are not yet added to the schema. Please add bankName, accountNumber, accountName, and bnbWalletAddress to the User model in schema.prisma, then apply the schema with your standard Prisma migration." 
      };
    })
});
