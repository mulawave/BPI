import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { notifyDepositStatus, notifyWithdrawalStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { randomUUID } from "crypto";
import { initiateBankTransfer, initializeFlutterwavePayment, verifyFlutterwavePayment } from "@/lib/flutterwave";
import { initializePaystackPayment, verifyPaystackPayment } from "@/lib/paystack";
import { sendWithdrawalRequestToAdmins } from "@/lib/email";
import { recordRevenue } from "@/server/services/revenue.service";
import { initiateBasqetUsdtPayout } from "@/server/services/payment/BasqetClient";

// Default admin settings (will be overridden by DB settings)
const DEFAULT_CASH_WITHDRAWAL_FEE = 100;
const DEFAULT_BPT_WITHDRAWAL_FEE = 0;
const DEFAULT_USD_WITHDRAWAL_FEE = 2;       // $2 USD processing fee for USDT withdrawals
const DEFAULT_USD_DEPOSIT_FEE = 2;          // $2 USD processing fee for USDT deposits
const DEFAULT_USD_MIN_WITHDRAWAL = 10;      // $10 USD minimum withdrawal threshold
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
      reference: z.string().optional(),
      proofOfPayment: z.string().optional(), // Base64 image for bank transfer
      originalAmount: z.number().positive().optional(), // Pre-conversion amount in user's selected currency
      originalCurrency: z.string().optional(), // User's selected currency symbol (e.g. "USD")
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstname: true, lastname: true, name: true, mobile: true },
      });

      if (!user?.email) throw new Error("User email not found");

      const { amount, paymentGateway, reference, proofOfPayment, originalAmount, originalCurrency } = input;

      if (paymentGateway === 'mock' && process.env.NODE_ENV === 'production') {
        throw new Error("Mock deposits are disabled in production. Please select a live gateway.");
      }
      const txReference = reference || `DEP-${Date.now()}`;

      // Calculate VAT (7.5% added on top)
      const vatRate = 0.075;
      const vatAmount = amount * vatRate;
      const totalAmount = amount + vatAmount;

      const userName = [user.firstname, user.lastname].filter(Boolean).join(" ") || user.name || "User";
      
      // Use NEXTAUTH_URL from env, fallback to production domain if not set
      const baseUrl = process.env.NEXTAUTH_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://beepagro.com' : 'http://localhost:3000');
      const callbackUrl = `${baseUrl}/dashboard?payment=success`;

      // Handle Paystack payments
      if (paymentGateway === 'paystack') {
        const gateway = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'paystack', isActive: true },
        });

        if (!gateway?.secretKey) {
          throw new Error("Paystack is not configured. Please contact admin.");
        }

        // Initialize Paystack payment
        const paymentResult = await initializePaystackPayment(gateway.secretKey, {
          email: user.email,
          amount: Math.round(totalAmount * 100), // Convert to kobo
          reference: txReference,
          callbackUrl,
          metadata: {
            userId,
            depositAmount: amount,
            vatAmount,
            purpose: 'DEPOSIT',
          },
        });

        // Create pending transaction
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: amount,
            description: `Wallet deposit via Paystack`,
            status: "pending",
            reference: txReference,
            walletType: 'main',
          },
        });

        // Create pending payment record for admin tracking
        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: totalAmount,
            currency: "NGN",
            paymentMethod: "paystack",
            gatewayReference: txReference,
            status: "pending",
            metadata: {
              depositAmount: amount,
              vatAmount,
              purpose: 'DEPOSIT'
            },
            updatedAt: new Date(),
          },
        });

        await notifyDepositStatus(userId, "pending", amount, txReference);

        return {
          success: true,
          paymentUrl: paymentResult.data.authorization_url,
          reference: txReference,
          message: "Payment initialized. Please complete payment.",
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
        };
      }

      // Handle Flutterwave payments
      if (paymentGateway === 'flutterwave') {
        const gateway = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'flutterwave', isActive: true },
        });

        if (!gateway?.secretKey) {
          throw new Error("Flutterwave is not configured. Please contact admin.");
        }

        // Initialize Flutterwave payment
        const paymentResult = await initializeFlutterwavePayment(gateway.secretKey, {
          txRef: txReference,
          amount: totalAmount,
          currency: 'NGN',
          redirectUrl: callbackUrl,
          customer: {
            email: user.email,
            name: userName,
            phonenumber: user.mobile || undefined,
          },
          customizations: {
            title: 'BPI Wallet Deposit',
            description: 'Wallet top-up',
            logo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/img/logo.png`,
          },
          meta: {
            userId,
            depositAmount: amount,
            vatAmount,
            purpose: 'DEPOSIT',
          },
        });

        // Create pending transaction
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: amount,
            description: `Wallet deposit via Flutterwave`,
            status: "pending",
            reference: txReference,
            walletType: 'main',
          },
        });

        // Create pending payment record for admin tracking
        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: totalAmount,
            currency: "NGN",
            paymentMethod: "flutterwave",
            gatewayReference: txReference,
            status: "pending",
            metadata: {
              depositAmount: amount,
              vatAmount,
              purpose: 'DEPOSIT'
            },
            updatedAt: new Date(),
          },
        });

        await notifyDepositStatus(userId, "pending", amount, txReference);

        return {
          success: true,
          paymentUrl: paymentResult.paymentLink,
          reference: txReference,
          message: "Payment initialized. Please complete payment.",
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
        };
      }

      // Handle Bank Transfer deposits
      // Two modes: automated (Paystack bank_transfer channel) and manual (proof upload)
      if (paymentGateway === 'bank-transfer') {
        // --- MANUAL MODE: proof of payment provided → admin approval ---
        if (proofOfPayment) {
          await prisma.transaction.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "DEPOSIT",
              amount: amount,
              description: `Bank transfer deposit - Pending admin approval`,
              status: "pending",
              reference: txReference,
              walletType: 'main',
            },
          });

          await prisma.pendingPayment.create({
            data: {
              id: randomUUID(),
              userId,
              transactionType: "DEPOSIT",
              amount: totalAmount,
              currency: "NGN",
              paymentMethod: "bank-transfer",
              gatewayReference: txReference,
              status: "pending",
              proofOfPayment,
              metadata: {
                depositAmount: amount,
                vatAmount,
                purpose: 'DEPOSIT'
              },
              updatedAt: new Date(),
            },
          });

          await notifyDepositStatus(userId, "pending", amount, txReference);

          return {
            success: true,
            reference: txReference,
            message: "Bank transfer submitted for admin approval. You will be notified once approved.",
            depositedAmount: amount,
            vatAmount,
            totalPaid: totalAmount,
          };
        }

        // --- AUTOMATED MODE: Paystack bank transfer channel ---
        const paystackGw = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'paystack', isActive: true },
        });

        if (!paystackGw?.secretKey) {
          throw new Error("Automated bank transfer is not configured. Please use manual transfer with proof upload.");
        }

        const bankPayment = await initializePaystackPayment(paystackGw.secretKey, {
          email: user.email,
          amount: Math.round(totalAmount * 100),
          reference: txReference,
          callbackUrl,
          channels: ["bank_transfer"],
          metadata: {
            userId,
            depositAmount: amount,
            vatAmount,
            purpose: 'DEPOSIT',
            gateway: 'bank_transfer',
          },
        });

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: amount,
            description: `Wallet deposit via automated bank transfer`,
            status: "pending",
            reference: txReference,
            walletType: 'main',
          },
        });

        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: totalAmount,
            currency: "NGN",
            paymentMethod: "bank-transfer",
            gatewayReference: txReference,
            status: "pending",
            metadata: {
              depositAmount: amount,
              vatAmount,
              purpose: 'DEPOSIT',
              automated: true,
            },
            updatedAt: new Date(),
          },
        });

        await notifyDepositStatus(userId, "pending", amount, txReference);

        return {
          success: true,
          paymentUrl: bankPayment.data.authorization_url,
          reference: txReference,
          message: "Bank transfer initiated. Complete the transfer on the Paystack page.",
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
        };
      }

      // Handle Crypto deposits
      if (paymentGateway === 'crypto') {
        const cryptoGw = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'crypto', isActive: true },
        });

        if (!cryptoGw) {
          throw new Error("Cryptocurrency payments are not configured. Please contact admin.");
        }

        const apiKey = cryptoGw.cryptoPublicKey || cryptoGw.publicKey;
        if (!apiKey) {
          throw new Error("Crypto provider API key not configured. Please contact admin.");
        }

        // Load processing fee from admin settings (never hardcoded)
        const processingFeeUsd = await getAdminSetting('USD_DEPOSIT_FEE', DEFAULT_USD_DEPOSIT_FEE);

        // Import and use the CryptoGateway via the service layer
        const { CryptoGateway } = await import("@/server/services/payment/CryptoGateway");
        const gateway = new CryptoGateway();
        await gateway.initialize({
          enabled: true,
          publicKey: apiKey,
          secretKey: cryptoGw.cryptoSecretKey || cryptoGw.secretKey || undefined,
        });

        const result = await gateway.initializePayment({
          amount: totalAmount,
          userId,
          packageId: "",
          email: user.email,
          name: userName,
          paymentMethod: "crypto",
          currency: "NGN",
          purpose: "DEPOSIT",
          metadata: {
            callbackUrl,
            depositAmount: amount,
            vatAmount,
            // Pass original currency amount so Basqet can use USD directly.
            // Total = base + VAT + processing fee — this is what Basqet invoices.
            originalAmount: originalAmount ? originalAmount + (originalAmount * vatRate) + processingFeeUsd : undefined,
            originalCurrency: originalCurrency,
          },
        });

        if (!result.success) {
          throw new Error(result.error || "Crypto payment initialization failed");
        }

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: amount,
            description: `Wallet deposit via cryptocurrency`,
            status: "pending",
            reference: result.reference || txReference,
            walletType: 'main',
          },
        });

        await prisma.pendingPayment.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "DEPOSIT",
            amount: totalAmount,
            currency: "NGN",
            paymentMethod: "crypto",
            gatewayReference: result.reference || txReference,
            status: "pending",
            metadata: {
              depositAmount: amount,
              vatAmount,
              processingFeeAmount: processingFeeUsd,
              purpose: 'DEPOSIT',
              provider: result.metadata?.provider,
              cryptoCurrency: result.metadata?.cryptoCurrency,
              amountCrypto: result.metadata?.amountCrypto,
              exchangeRate: result.metadata?.exchangeRate,
              basqetAudit: result.metadata?.basqetAudit,
            },
            updatedAt: new Date(),
          },
        });

        await notifyDepositStatus(userId, "pending", amount, result.reference || txReference);

        return {
          success: true,
          paymentUrl: result.paymentUrl,
          reference: result.reference || txReference,
          message: result.message || "Crypto payment created. Complete the payment.",
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
          cryptoDetails: result.metadata,
        };
      }

      // Handle Utility Token (PACT) deposits
      if (paymentGateway === 'utility-token') {
        const { UtilityTokenGateway } = await import("@/server/services/payment/UtilityTokenGateway");
        const gateway = new UtilityTokenGateway();
        await gateway.initialize({ enabled: true });

        const result = await gateway.initializePayment({
          amount,
          userId,
          packageId: "",
          email: user.email,
          name: userName,
          paymentMethod: "utility_token",
          currency: "NGN",
          purpose: "DEPOSIT",
        });

        if (!result.success) {
          throw new Error(result.error || "Token payment failed");
        }

        // VAT transaction for token payments
        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: "VAT",
            amount: vatAmount,
            description: `VAT on token deposit (7.5%)`,
            status: "completed",
            reference: `VAT-${result.reference || txReference}`,
            walletType: 'main',
          },
        });

        await notifyDepositStatus(userId, "completed", amount, result.reference || txReference);

        return {
          success: true,
          message: result.message,
          depositedAmount: amount,
          vatAmount,
          totalPaid: totalAmount,
          tokenDetails: result.metadata,
          transactionId: result.transactionId,
        };
      }

      // Mock payment (for testing)
      if (paymentGateway === 'mock') {
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
      }

      // Other payment gateways not implemented yet
      throw new Error(`${paymentGateway} integration coming soon!`);
    }),

  // ============================================
  // WITHDRAWAL ENDPOINT
  // ============================================
  withdraw: protectedProcedure
    .input(z.object({
      amount: z.number().positive("Amount must be greater than 0"),
      withdrawalType: z.enum(['cash', 'bpt', 'usdt']),
      sourceWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business', 'shelter']),
      // Security validation
      pin: z.string().length(4, "PIN must be 4 digits"),
      // Bank details (required for cash withdrawal)
      bankCode: z.string().optional(), // Flutterwave bank code
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
      // Crypto details (required for BPT withdrawal)
      bnbWalletAddress: z.string().optional(),
      // USDT TRC-20 details (required for usdt withdrawal)
      usdtAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, withdrawalType, sourceWallet, pin, bankCode, accountNumber, accountName, bnbWalletAddress, usdtAddress } = input;

      // USDT withdrawal: non-Nigerian check + country requirement
      if (withdrawalType === 'usdt') {
        const userCountry = await prisma.user.findUnique({
          where: { id: userId },
          select: { country: true, countryRelation: { select: { name: true } } }
        });
        const countryName = userCountry?.countryRelation?.name || userCountry?.country || null;
        if (!countryName) {
          throw new Error("Please set your country in profile settings before requesting a USDT withdrawal.");
        }
        if (countryName.toLowerCase() === 'nigeria') {
          throw new Error("USDT withdrawal is not available for Nigerian users. Please use cash withdrawal to your bank account.");
        }
      }

      // CTO policy: Cashback Wallet is for store spending/transfers-to-cashback only;
      // users cannot withdraw cashback externally.
      if (sourceWallet === 'cashback') {
        throw new Error("Cashback wallet cannot be withdrawn. Fund main wallet separately for withdrawals.");
      }
      const txReference = `WD-${withdrawalType.toUpperCase()}-${Date.now()}`;

      console.log("\n🔵 [WITHDRAWAL] Request initiated");
      console.log("📋 Details:", {
        userId,
        amount,
        type: withdrawalType,
        sourceWallet,
        bankCode: bankCode || 'N/A',
        accountNumber: accountNumber ? `****${accountNumber.slice(-4)}` : 'N/A',
        reference: txReference
      });

      // SECURITY: Verify PIN before processing withdrawal
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          userProfilePin: true, 
          withdrawBan: true, 
          name: true, 
          email: true,
          walletFrozen: true,
          walletFrozenReason: true
        }
      });

      if (!user) {
        console.error("❌ [WITHDRAWAL] User not found:", userId);
        throw new Error("User not found");
      }

      if (!user.userProfilePin) {
        throw new Error("Please set up a PIN in your security settings before making withdrawals");
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const isPinValid = await bcrypt.compare(pin, user.userProfilePin);
      if (!isPinValid) {
        console.error("❌ [WITHDRAWAL] Invalid PIN attempt for user:", userId);
        throw new Error("Invalid PIN. Please try again.");
      }

      console.log("✅ [WITHDRAWAL] PIN verified for user:", user.name || user.email);

      // WALLET FREEZE CHECK: Block withdrawals if wallet is frozen
      if (user.walletFrozen) {
        console.error("❌ [WITHDRAWAL] Wallet is frozen:", userId);
        throw new Error(
          `Your wallet is currently frozen and withdrawals are not permitted. ` +
          `Reason: ${user.walletFrozenReason || 'Administrative hold'}. ` +
          `Please contact support for assistance.`
        );
      }

      if (user.withdrawBan === 1) {
        console.error("❌ [WITHDRAWAL] User is banned from withdrawals:", userId);
        throw new Error("Your account has been restricted from making withdrawals by administration. Please contact support for assistance.");
      }
      
      console.log("✅ [WITHDRAWAL] PIN verified for user:", user.name || user.email);

      // RATE LIMIT: Max withdrawals per day (admin-configurable, default 10)
      const maxWithdrawalsPerDay = await getAdminSetting('MAX_WITHDRAWALS_PER_DAY', 10);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const withdrawalsToday = await prisma.transaction.count({
        where: {
          userId,
          transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT", "WITHDRAWAL_USDT"] },
          createdAt: { gte: todayStart },
        },
      });
      if (withdrawalsToday >= maxWithdrawalsPerDay) {
        console.error("❌ [WITHDRAWAL] Rate limit exceeded for user:", userId, "Count:", withdrawalsToday);
        throw new Error(`You have reached the maximum of ${maxWithdrawalsPerDay} withdrawal requests per day. Please try again tomorrow.`);
      }
      
      // Fetch full user data for balance checks
      const fullUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!fullUser) throw new Error("User data not found");

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
      const currentBalance = (fullUser as any)[sourceWallet] || 0;
      console.log("💰 [WITHDRAWAL] Current balance:", currentBalance, "NGN in", sourceWallet);
      
      // THRESHOLD VALIDATION: Check minimum withdrawal amount
      const MIN_CASH_WITHDRAWAL = await getAdminSetting('MIN_CASH_WITHDRAWAL', 1000);
      const MIN_BPT_WITHDRAWAL = await getAdminSetting('MIN_BPT_WITHDRAWAL', 100);
      const USD_MIN_WITHDRAWAL_USD = await getAdminSetting('USD_MIN_WITHDRAWAL', DEFAULT_USD_MIN_WITHDRAWAL);

      if (withdrawalType === 'usdt') {
        // For USDT: validate against USD threshold, converting NGN amount to USD for comparison
        const usdRate = await prisma.currencyManagement.findFirst({ where: { symbol: 'USD' } });
        const ngnRate = await prisma.currencyManagement.findFirst({ where: { symbol: 'NGN' } });
        const amountInUsd = usdRate && ngnRate ? (amount / (ngnRate.rate || 1)) * (usdRate.rate || 1) : amount;
        if (amountInUsd < USD_MIN_WITHDRAWAL_USD) {
          throw new Error(`Minimum USDT withdrawal is $${USD_MIN_WITHDRAWAL_USD.toLocaleString()} USD. Your amount: $${amountInUsd.toFixed(2)} USD`);
        }
      } else {
        const minWithdrawal = withdrawalType === 'cash' ? MIN_CASH_WITHDRAWAL : MIN_BPT_WITHDRAWAL;
        if (amount < minWithdrawal) {
          throw new Error(`Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}. Requested: ₦${amount.toLocaleString()}`);
        }
      }
      
      // Get withdrawal fee from admin settings
      let withdrawalFee: number;
      if (withdrawalType === 'usdt') {
        // USD fee is stored in USD — convert to NGN for deduction
        const usdFeeUsd = await getAdminSetting('USD_WITHDRAWAL_FEE', DEFAULT_USD_WITHDRAWAL_FEE);
        const usdRate = await prisma.currencyManagement.findFirst({ where: { symbol: 'USD' } });
        const ngnRate = await prisma.currencyManagement.findFirst({ where: { symbol: 'NGN' } });
        withdrawalFee = usdRate && ngnRate && usdRate.rate && ngnRate.rate
          ? (usdFeeUsd / (usdRate.rate || 1)) * (ngnRate.rate || 1)
          : usdFeeUsd * 1538; // Fallback approximate conversion
      } else {
        withdrawalFee = withdrawalType === 'cash'
          ? await getAdminSetting('CASH_WITHDRAWAL_FEE', DEFAULT_CASH_WITHDRAWAL_FEE)
          : await getAdminSetting('BPT_WITHDRAWAL_FEE', DEFAULT_BPT_WITHDRAWAL_FEE);
      }
      console.log("💸 [WITHDRAWAL] Withdrawal fee:", withdrawalFee);

      // Apply tax for empowerment-related wallets (education, empowermentSponsorReward)
      const taxRate = 0.075; // 7.5%
      const isEmpowermentWallet = sourceWallet === 'education' || sourceWallet === 'empowermentSponsorReward';
      const taxAmount = isEmpowermentWallet ? Math.round(amount * taxRate * 100) / 100 : 0;
      if (taxAmount > 0) {
        console.log("📊 [WITHDRAWAL] Tax amount (7.5%):", taxAmount);
      }
      
      const totalDeduction = amount + withdrawalFee + taxAmount;
      console.log("🔢 [WITHDRAWAL] Total deduction:", totalDeduction, "(amount:", amount, "+ fee:", withdrawalFee, "+ tax:", taxAmount, ")");

      if (currentBalance < totalDeduction) {
        const breakdown = isEmpowermentWallet
          ? `₦${amount.toLocaleString()} + ₦${withdrawalFee.toLocaleString()} fee + ₦${taxAmount.toLocaleString()} tax`
          : `₦${amount.toLocaleString()} + ₦${withdrawalFee.toLocaleString()} fee`;
        console.error("❌ [WITHDRAWAL] Insufficient balance. Need:", totalDeduction, "Have:", currentBalance);
        throw new Error(`Insufficient balance. You need ₦${totalDeduction.toLocaleString()} (${breakdown})`);
      }
      
      console.log("✅ [WITHDRAWAL] Balance check passed");

      // Validate withdrawal details
      if (withdrawalType === 'cash') {
        if (!bankCode || !accountNumber || !accountName) {
          throw new Error("Bank details are required for cash withdrawal. Please provide bank code, account number, and account name.");
        }
      } else if (withdrawalType === 'usdt') {
        if (!usdtAddress || !usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
          throw new Error("A valid USDT TRC-20 wallet address is required (must start with T, 34 characters).");
        }
      } else {
        // BPT withdrawal
        if (!bnbWalletAddress) {
          throw new Error("BNB wallet address is required for BPT withdrawal. Please provide your BNB wallet address.");
        }
      }

      // Crypto provider mode for USDT withdrawals
      const activeCryptoGateway = withdrawalType === 'usdt'
        ? await prisma.paymentGatewayConfig.findFirst({
            where: { gatewayName: 'crypto', isActive: true },
            select: {
              apiProvider: true,
              publicKey: true,
              secretKey: true,
              cryptoPublicKey: true,
              cryptoSecretKey: true,
            },
          })
        : null;
      const activeCryptoProvider = (activeCryptoGateway?.apiProvider || '').toLowerCase();
      const basqetPublicKey = activeCryptoGateway?.cryptoPublicKey || activeCryptoGateway?.publicKey || undefined;
      const basqetSecretKey = activeCryptoGateway?.cryptoSecretKey || activeCryptoGateway?.secretKey || undefined;
      const basqetPayoutEnabled = process.env.BASQET_USDT_PAYOUT_ENABLED !== 'false';
      const isBasqetUsdtAuto = withdrawalType === 'usdt'
        && activeCryptoProvider === 'basqet'
        && basqetPayoutEnabled
        && !!basqetSecretKey;

      // USDT defaults to manual approval unless Basqet auto payout is active
      const autoWithdrawalThreshold = await getAdminSetting('AUTO_WITHDRAWAL_THRESHOLD', DEFAULT_AUTO_WITHDRAWAL_THRESHOLD);
      const requiresApproval = withdrawalType === 'usdt'
        ? !isBasqetUsdtAuto
        : amount >= autoWithdrawalThreshold;
      const status = requiresApproval ? "pending" : "processing";
      
      console.log("⚙️  [WITHDRAWAL] Auto-approval threshold:", autoWithdrawalThreshold);
      console.log("🤖 [WITHDRAWAL] Auto-approve:", !requiresApproval ? "YES" : "NO (requires manual approval)");
      console.log("📌 [WITHDRAWAL] Initial status:", status);

      try {
        // Deduct from source wallet
        console.log("🔄 [WITHDRAWAL] Deducting from wallet...");
        await prisma.user.update({
          where: { id: userId },
          data: {
            [sourceWallet]: { decrement: totalDeduction }
          }
        });
        console.log("✅ [WITHDRAWAL] Wallet deducted successfully");

        // Create withdrawal transaction
        console.log("🔄 [WITHDRAWAL] Creating transaction record...");
        const usdtMetadata = withdrawalType === 'usdt' ? JSON.stringify({
          usdtAddress,
          network: 'TRC-20',
          amountUSD: amount,
          provider: isBasqetUsdtAuto ? 'basqet' : 'manual',
          providerMode: isBasqetUsdtAuto ? 'auto' : 'manual',
          providerReference: txReference,
        }) : undefined;
        const transaction = await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId,
            transactionType: `WITHDRAWAL_${withdrawalType.toUpperCase()}`,
            amount: -amount,
            description: withdrawalType === 'usdt'
              ? `USDT TRC-20 withdrawal from ${sourceWallet} wallet`
              : `${withdrawalType === 'cash' ? 'Cash' : 'BPT'} withdrawal from ${sourceWallet} wallet`,
            status,
            reference: txReference,
            ...(usdtMetadata && { metadata: usdtMetadata }),
          }
        });
        console.log("✅ [WITHDRAWAL] Transaction created:", transaction.id);

        // Create fee transaction
        if (withdrawalFee > 0) {
          const feeTransaction = await prisma.transaction.create({
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

          // Record withdrawal fee as revenue
          await recordRevenue(prisma, {
            source: "WITHDRAWAL_FEE",
            amount: withdrawalFee,
            currency: "NGN",
            sourceId: feeTransaction.id,
            description: `Withdrawal fee from ${sourceWallet} wallet (${withdrawalType})`,
            userId,
            programType: "WITHDRAWAL",
            country: (fullUser as any).country ?? undefined,
            state: (fullUser as any).state ?? undefined,
            region: (fullUser as any).region ?? undefined,
            metadata: {
              withdrawalType,
              sourceWallet,
              txReference,
              amount,
              withdrawalFee,
              taxAmount,
              totalDeduction,
            },
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
            description: `${withdrawalType === 'cash' ? 'Cash' : withdrawalType === 'usdt' ? 'USDT' : 'BPT'} withdrawal - ${sourceWallet} wallet`,
            amount,
            currency: withdrawalType === 'cash' ? 'NGN' : withdrawalType === 'usdt' ? 'USDT' : 'BPT',
            status,
            date: new Date()
          }
        });

        // Send appropriate notification based on status
        if (requiresApproval) {
          console.log("⏳ [WITHDRAWAL] Manual approval required - notifying admins...");
          await notifyWithdrawalStatus(userId, "pending", amount, txReference);
          
          // Send email notification to all admins
          try {
            console.log("📧 [EMAIL] Sending admin notifications...");
            await sendWithdrawalRequestToAdmins(
              user.name || user.email || 'User',
              user.email || '',
              amount,
              withdrawalType,
              txReference
            );
            console.log("✅ [EMAIL] Admin notifications sent successfully");
          } catch (emailError) {
            console.error('❌ [EMAIL] Failed to send admin email notification:', emailError);
            // Don't fail the withdrawal if email fails
          }
        } else {
          console.log("🤖 [WITHDRAWAL] Auto-approved - initiating Flutterwave transfer in 3s...");
          await notifyWithdrawalStatus(userId, "processing", amount, txReference);
          
          // Process auto-approved withdrawal with Flutterwave
          setTimeout(async () => {
            try {
              console.log("\n🌐 [FLUTTERWAVE] Fetching gateway configuration...");
              // Get Flutterwave credentials from admin settings
              const flutterwaveGateway = await prisma.paymentGatewayConfig.findFirst({
                where: { gatewayName: 'flutterwave', isActive: true }
              });

              if (!flutterwaveGateway?.secretKey) {
                console.error("❌ [FLUTTERWAVE] Not configured in admin settings");
                throw new Error('Flutterwave is not configured. Please configure in admin settings.');
              }
              console.log("✅ [FLUTTERWAVE] Configuration found");

              // Initiate bank transfer via Flutterwave (only for cash withdrawals)
              if (withdrawalType === 'cash' && bankCode && accountNumber) {
                console.log("🌐 [FLUTTERWAVE] Initiating bank transfer...");
                console.log("📋 Transfer details:", {
                  bank: bankCode,
                  account: `****${accountNumber.slice(-4)}`,
                  amount,
                  reference: txReference
                });
                
                const transferResult = await initiateBankTransfer(
                  flutterwaveGateway.secretKey,
                  {
                    accountBank: bankCode,
                    accountNumber: accountNumber,
                    amount: amount,
                    narration: `Withdrawal - ${txReference}`,
                    currency: 'NGN',
                    reference: txReference,
                    beneficiaryName: accountName
                  }
                );

                console.log("✅ [FLUTTERWAVE] Transfer successful:", {
                  reference: transferResult.reference || transferResult.id,
                  id: transferResult.id
                });

                // Update transaction with Flutterwave reference
                console.log("🔄 [WITHDRAWAL] Updating transaction with Flutterwave reference...");
                await prisma.transaction.update({
                  where: { id: transaction.id },
                  data: {
                    status: "completed",
                  }
                });
                console.log("✅ [WITHDRAWAL] Transaction updated to completed");
              } else if (withdrawalType === 'usdt' && isBasqetUsdtAuto) {
                if (!basqetSecretKey || !usdtAddress) {
                  throw new Error('Basqet USDT payout is not properly configured.');
                }

                const payoutIdempotencyKey = `usdt:${transaction.id}:${txReference}`;

                console.log("🌐 [BASQET] Initiating automated USDT payout...");
                const payout = await initiateBasqetUsdtPayout({
                  secretKey: basqetSecretKey,
                  publicKey: basqetPublicKey,
                  reference: txReference,
                  amount,
                  currency: 'USDT',
                  recipientAddress: usdtAddress,
                  network: 'TRC-20',
                  idempotencyKey: payoutIdempotencyKey,
                  metadata: {
                    userId,
                    sourceWallet,
                    withdrawalTransactionId: transaction.id,
                    idempotencyKey: payoutIdempotencyKey,
                  },
                });

                if (!payout.accepted) {
                  throw new Error(`Basqet payout rejected with status: ${payout.status}`);
                }

                const isCompleted = ['completed', 'success', 'successful', 'paid'].includes((payout.status || '').toLowerCase());
                let meta: Record<string, any> = {};
                try {
                  meta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
                } catch {
                  meta = {};
                }

                meta.basqet = {
                  status: payout.status,
                  providerRef: payout.providerRef,
                  payoutId: payout.payoutId,
                  txHash: payout.txHash,
                  idempotencyKey: payoutIdempotencyKey,
                  updatedAt: new Date().toISOString(),
                };
                if (payout.txHash) {
                  meta.adminTxHash = payout.txHash;
                }

                await prisma.transaction.update({
                  where: { id: transaction.id },
                  data: {
                    status: isCompleted ? 'completed' : 'processing',
                    metadata: JSON.stringify(meta),
                  }
                });

                await prisma.withdrawalHistory.updateMany({
                  where: {
                    userId,
                    amount,
                    status: 'processing'
                  },
                  data: { status: isCompleted ? 'completed' : 'processing' }
                });

                if (isCompleted) {
                  const receiptUrl = generateReceiptLink(transaction.id, 'withdrawal');
                  await notifyWithdrawalStatus(userId, 'completed', amount, txReference, receiptUrl);
                } else {
                  await notifyWithdrawalStatus(userId, 'processing', amount, txReference);
                }

                console.log("✅ [BASQET] USDT payout accepted", {
                  status: payout.status,
                  providerRef: payout.providerRef,
                  payoutId: payout.payoutId,
                });
              } else {
                // For BPT withdrawal, just mark as completed (manual crypto transfer needed)
                console.log("🔄 [WITHDRAWAL] BPT withdrawal - marking as completed (manual crypto transfer)");
                await prisma.transaction.update({
                  where: { id: transaction.id },
                  data: { status: "completed" }
                });
                console.log("✅ [WITHDRAWAL] Transaction marked as completed");
              }

              // Update withdrawal history
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
              console.log("📧 [NOTIFICATION] Sending completion notification to user...");
              await notifyWithdrawalStatus(userId, "completed", amount, txReference, receiptUrl);
              console.log("✅ [NOTIFICATION] User notified of completion");
              
              console.log("\n✅ [WITHDRAWAL] Auto-approved withdrawal completed successfully");
              console.log("═".repeat(60) + "\n");
            } catch (error) {
              console.error('\n❌ [WITHDRAWAL] Processing error:', error);
              console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

              // Basqet USDT fallback: preserve deducted ledger and route to manual admin approval
              if (withdrawalType === 'usdt' && isBasqetUsdtAuto) {
                let meta: Record<string, any> = {};
                try {
                  meta = transaction.metadata ? JSON.parse(transaction.metadata) : {};
                } catch {
                  meta = {};
                }

                meta.basqet = {
                  status: 'fallback_to_manual',
                  fallbackAt: new Date().toISOString(),
                  error: error instanceof Error ? error.message : 'Unknown Basqet payout error',
                };
                meta.provider = 'manual';
                meta.providerMode = 'manual_fallback';

                await prisma.transaction.update({
                  where: { id: transaction.id },
                  data: {
                    status: 'pending',
                    metadata: JSON.stringify(meta),
                  }
                });

                await prisma.withdrawalHistory.updateMany({
                  where: {
                    userId,
                    amount,
                    status: 'processing'
                  },
                  data: { status: 'pending' }
                });

                await notifyWithdrawalStatus(userId, 'pending', amount, txReference);

                try {
                  await sendWithdrawalRequestToAdmins(
                    user.name || user.email || 'User',
                    user.email || '',
                    amount,
                    'usdt',
                    txReference
                  );
                } catch (emailError) {
                  console.error('❌ [EMAIL] Failed to send fallback admin email:', emailError);
                }

                console.log('↩️ [WITHDRAWAL] Basqet payout fallback activated, routed to manual approval');
                return;
              }
              
              console.log("🔄 [WITHDRAWAL] Initiating refund...");
              // Mark as failed and refund user
              await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "failed" }
              });

              await prisma.withdrawalHistory.updateMany({
                where: { 
                  userId,
                  amount,
                  status: "processing"
                },
                data: { status: "failed" }
              });

              // Refund the complete deducted amount (withdrawal + fees + tax)
              console.log("💰 [REFUND] Refunding complete amount:", {
                withdrawalAmount: amount,
                withdrawalFee: withdrawalFee,
                taxAmount: taxAmount,
                totalRefund: totalDeduction,
                breakdown: `₦${amount} + ₦${withdrawalFee} fee + ₦${taxAmount} tax = ₦${totalDeduction}`
              });
              await prisma.user.update({
                where: { id: userId },
                data: {
                  [sourceWallet]: { increment: totalDeduction }
                }
              });
              console.log("✅ [WITHDRAWAL] User refunded ₦" + totalDeduction + " successfully (includes all fees and taxes)");

              // Send failure notification
              await notifyWithdrawalStatus(userId, "failed", amount, txReference);
              console.log("📧 [NOTIFICATION] User notified of failure");
              console.log("═".repeat(60) + "\n");
            }
          }, 3000); // 3 seconds processing time
        }

        console.log("\n✅ [WITHDRAWAL] Request completed successfully");
        console.log("📊 Final Status:", {
          transactionId: transaction.id,
          status,
          requiresApproval,
          totalDeducted: totalDeduction
        });
        console.log("═".repeat(60) + "\n");

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
      fromWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business', 'shelter']),
      toWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business', 'shelter']),
      pin: z.string().length(4, "PIN must be 4 digits"),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, fromWallet, toWallet, pin, reason } = input;

      if (fromWallet === toWallet) {
        throw new Error("Cannot transfer to the same wallet");
      }

      // CTO policy: users cannot transfer funds *out* of Cashback Wallet to other internal wallets.
      // Cashback Wallet is the store fiat spending wallet and may be funded from Main Wallet.
      if (fromWallet === 'cashback') {
        throw new Error("Transfers out of Cashback Wallet are not allowed.");
      }

      // SECURITY: Verify PIN before processing transfer
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          userProfilePin: true, 
          name: true, 
          email: true,
          walletFrozen: true,
          walletFrozenReason: true,
          wallet: true,
          spendable: true,
          shareholder: true,
          community: true,
          bpiTokenWallet: true,
          cashback: true,
          palliative: true,
          education: true,
          empowermentSponsorReward: true,
          car: true,
          land: true,
          business: true,
          solar: true,
          socialMedia: true,
          retirement: true,
          travelTour: true,
          shelter: true,
        }
      });

      if (!user) throw new Error("User not found");

      const userEmail = user.email;
      const userName = user.name;

      if (!user.userProfilePin) {
        throw new Error("Please set up a PIN in your security settings before making transfers");
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const isPinValid = await bcrypt.compare(pin, user.userProfilePin);
      if (!isPinValid) {
        throw new Error("Invalid PIN. Please try again.");
      }

      // WALLET FREEZE CHECK: Block transfers if wallet is frozen
      if (user.walletFrozen) {
        throw new Error(
          `Your wallet is currently frozen and transfers are not permitted. ` +
          `Reason: ${user.walletFrozenReason || 'Administrative hold'}. ` +
          `Please contact support for assistance.`
        );
      }

      // EMPOWERMENT GATE: Block transfers from education & empowermentSponsorReward until final admin confirmation
      // CSP WAIVER EXCEPTION: Allow education → community/wallet transfers for decline beneficiaries with active waiver
      if (fromWallet === 'education' || fromWallet === 'empowermentSponsorReward') {
        // Check for active CSP waiver (decline outcome only)
        const waiverPackage = fromWallet === 'education'
          ? await prisma.empowermentPackage.findFirst({
              where: {
                beneficiaryId: userId,
                cspWaiverEnabled: true,
                cspWaiverUsed: false,
              },
              orderBy: { outcomeSetAt: 'desc' },
            })
          : null;

        if (waiverPackage && fromWallet === 'education') {
          // Waiver active: only allow transfers to community or wallet (cash) for CSP contribution
          const allowedTargets = ['community', 'wallet'];
          if (!allowedTargets.includes(toWallet)) {
            throw new Error(
              "CSP Waiver transfers from your education wallet may only go to your Community Wallet or Cash Wallet for CSP contribution purposes."
            );
          }
          // Mark waiver as used after this transfer (done post-transfer below)
        } else {
          // No waiver — apply standard empowerment gate
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
            // Also allow Full Approval Completed packages
            const fullyReleased = await prisma.empowermentPackage.findFirst({
              where: {
                OR: [{ beneficiaryId: userId }, { sponsorId: userId }],
                status: { contains: "Full Approval" },
              },
            });
            if (!fullyReleased) {
              throw new Error(
                fromWallet === 'education'
                  ? "Education funds are locked. Awaiting final admin confirmation before any transfers are allowed."
                  : "Empowerment sponsor reward is locked. Awaiting final admin confirmation before any transfers are allowed."
              );
            }
          }
        }
        // Store waiver package reference for post-transfer update
        if (waiverPackage) {
          // Will be marked used after successful transfer (handled after the transfer block)
          (input as any).__waiverPackageId = waiverPackage.id;
        }
      }

      // Get max transfer limit
      const maxTransferAmount = await getAdminSetting('MAX_TRANSFER_AMOUNT', DEFAULT_MAX_TRANSFER_AMOUNT);
      
      if (amount > maxTransferAmount) {
        throw new Error(`Transfer amount exceeds maximum limit of ₦${maxTransferAmount.toLocaleString()}`);
      }

      // Check user's current balance (already fetched above)
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
      const txReference = `IWT-${Date.now()}`;
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "INTER_WALLET_TRANSFER",
          amount: amount, // Store the actual amount transferred for transaction history
          description: `Transfer from ${fromWallet} to ${toWallet} wallet`,
          status: "completed",
          reference: txReference
        }
      });

      // CSP WAIVER: Mark waiver as used after successful education → community/wallet transfer
      const waiverPkgId = (input as any).__waiverPackageId as string | undefined;
      if (waiverPkgId) {
        await prisma.empowermentPackage.update({
          where: { id: waiverPkgId },
          data: { cspWaiverUsed: true },
        }).catch(() => {});
        // Audit log for CSP waiver-triggered transfer
        await prisma.empowermentTransaction.create({
          data: {
            id: randomUUID(),
            empowermentPackageId: waiverPkgId,
            transactionType: "CSP_WAIVER_TRANSFER",
            grossAmount: amount,
            taxAmount: 0,
            netAmount: amount,
            description: `CSP waiver education→${toWallet} transfer (₦${amount.toLocaleString()})`,
            performedBy: userId,
          },
        }).catch(() => {});
      }

      // EMAIL NOTIFICATION: Send transfer confirmation to user
      try {
        const { sendTransferConfirmationToUser } = await import('@/lib/email');
        await sendTransferConfirmationToUser(
          userEmail || '',
          userName || 'User',
          amount,
          fromWallet,
          toWallet,
          txReference
        );
      } catch (emailError) {
        console.error('❌ Failed to send inter-wallet transfer email:', emailError);
        // Don't fail the transfer if email fails
      }

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
      sourceWallet: z.enum(['wallet', 'spendable', 'shareholder', 'cashback', 'community', 'education', 'empowermentSponsorReward', 'car', 'business', 'shelter']),
      note: z.string().optional(),
      pin: z.string().length(4, "PIN must be 4 digits")
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { amount, recipientIdentifier, sourceWallet, note, pin } = input;

      // SECURITY: Verify PIN before processing transfer
      const sender = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          userProfilePin: true, 
          name: true, 
          email: true, 
          username: true,
          walletFrozen: true,
          walletFrozenReason: true,
          wallet: true,
          spendable: true,
          shareholder: true,
          cashback: true,
          community: true,
          education: true,
          empowermentSponsorReward: true,
          car: true,
          business: true,
          shelter: true,
        }
      });

      if (!sender) throw new Error("User not found");

      const senderEmail = sender.email;
      const senderName = sender.name;

      if (!sender.userProfilePin) {
        throw new Error("Please set up a PIN in your security settings before making transfers");
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const isPinValid = await bcrypt.compare(pin, sender.userProfilePin);
      if (!isPinValid) {
        throw new Error("Invalid PIN. Please try again.");
      }

      // WALLET FREEZE CHECK: Block transfers if wallet is frozen
      if (sender.walletFrozen) {
        throw new Error(
          `Your wallet is currently frozen and transfers are not permitted. ` +
          `Reason: ${sender.walletFrozenReason || 'Administrative hold'}. ` +
          `Please contact support for assistance.`
        );
      }

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

      // Check sender's balance (already fetched above)
      const sourceBalance = (sender as any)[sourceWallet] || 0;
      
      if (sourceBalance < amount) {
        throw new Error(`Insufficient balance in ${sourceWallet} wallet. Available: ₦${sourceBalance.toLocaleString()}`);
      }

      const recipientWalletField = sourceWallet === 'cashback' ? 'cashback' : 'wallet';

      // Perform atomic transfer (sender -> recipient)
      await prisma.$transaction([
        // Deduct from sender
        prisma.user.update({
          where: { id: userId },
          data: {
            [sourceWallet]: { decrement: amount }
          }
        }),
        // Add to recipient's wallet (cashback->cashback, otherwise main wallet)
        prisma.user.update({
          where: { id: recipient.id },
          data: {
            [recipientWalletField]: { increment: amount }
          }
        })
      ]);

      // Create transaction for sender
      const senderTxReference = `TXF-SENT-${Date.now()}`;
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "TRANSFER_SENT",
          amount: -amount,
          description: `Transfer to ${recipient.name || recipient.username}${note ? `: ${note}` : ''}`,
          status: "completed",
          reference: senderTxReference
        }
      });

      // Create transaction for recipient
      const receiverTxReference = `TXF-RCV-${Date.now()}`;
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: recipient.id,
          transactionType: "TRANSFER_RECEIVED",
          amount: amount,
          description: `Transfer from ${sender.name || 'User'}${note ? `: ${note}` : ''}`,
          status: "completed",
          reference: receiverTxReference
        }
      });

      // EMAIL NOTIFICATIONS: Send to both sender and receiver
      try {
        const { sendTransferToUserConfirmation } = await import('@/lib/email');
        
        // Send to sender
        await sendTransferToUserConfirmation(
          senderEmail || '',
          senderName || 'User',
          recipient.name || recipient.username || 'User',
          amount,
          senderTxReference,
          true // isSender = true
        );
        
        // Send to receiver
        await sendTransferToUserConfirmation(
          recipient.email || '',
          recipient.name || recipient.username || 'User',
          senderName || 'User',
          amount,
          receiverTxReference,
          false // isSender = false
        );
      } catch (emailError) {
        console.error('❌ Failed to send user-to-user transfer emails:', emailError);
        // Don't fail the transfer if email fails
      }

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
  // VERIFY PAYMENT
  // ============================================
  verifyPayment: protectedProcedure
    .input(z.object({
      reference: z.string(),
      gateway: z.enum(['paystack', 'flutterwave']),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("UNAUTHORIZED");

      const { reference, gateway } = input;

      // Find the pending transaction
      const transaction = await prisma.transaction.findFirst({
        where: {
          reference,
          userId,
          status: "pending",
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found or already processed");
      }

      let verificationResult: any;
      let paymentStatus: string;
      let amountPaid: number;

      // Verify with appropriate gateway
      if (gateway === 'paystack') {
        const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'paystack', isActive: true },
        });

        if (!gatewayConfig?.secretKey) {
          throw new Error("Paystack configuration not found");
        }

        verificationResult = await verifyPaystackPayment(gatewayConfig.secretKey, reference);
        paymentStatus = verificationResult.data.status;
        amountPaid = verificationResult.data.amount / 100; // Convert from kobo
      } else if (gateway === 'flutterwave') {
        const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'flutterwave', isActive: true },
        });

        if (!gatewayConfig?.secretKey) {
          throw new Error("Flutterwave configuration not found");
        }

        verificationResult = await verifyFlutterwavePayment(gatewayConfig.secretKey, reference);
        paymentStatus = verificationResult.status;
        amountPaid = verificationResult.amount;
      } else {
        throw new Error("Unsupported gateway");
      }

      // Check if payment was successful
      if (paymentStatus !== 'success' && paymentStatus !== 'successful') {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "failed" },
        });

        await notifyDepositStatus(userId, "failed", transaction.amount, reference);

        throw new Error(`Payment ${paymentStatus}. Please try again.`);
      }

      // Credit user wallet
      await prisma.user.update({
        where: { id: userId },
        data: {
          wallet: { increment: transaction.amount },
        },
      });

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "completed" },
      });

      // Generate receipt
      const receiptUrl = generateReceiptLink(transaction.id, 'deposit');

      // Send success notification
      await notifyDepositStatus(userId, "completed", transaction.amount, reference, receiptUrl);

      return {
        success: true,
        message: `Deposit of ₦${transaction.amount.toLocaleString()} successful!`,
        amountDeposited: transaction.amount,
        receiptUrl,
        transactionId: transaction.id,
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
    }),

  // ============================================
  // USDT WITHDRAWAL STATUS (user-facing)
  // ============================================
  getMyUsdtWithdrawals: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("UNAUTHORIZED");

    const withdrawals = await prisma.transaction.findMany({
      where: {
        userId,
        transactionType: "WITHDRAWAL_USDT",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return withdrawals.map((w) => {
      let meta: any = {};
      try { meta = JSON.parse(w.metadata || "{}"); } catch {}
      return {
        id: w.id,
        amount: Math.abs(w.amount),
        status: w.status,
        reference: w.reference,
        createdAt: w.createdAt,
        usdtAddress: meta.usdtAddress || "",
        network: meta.network || "TRC-20",
        adminTxHash: meta.adminTxHash || null,
        approvedAt: meta.approvedAt || null,
      };
    });
  }),

  // Check if user is eligible for USDT withdrawal (non-Nigerian)
  canWithdrawUsdt: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session?.user as any)?.id;
    if (!userId) throw new Error("UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true, countryRelation: { select: { name: true } } },
    });

    const countryName = user?.countryRelation?.name || user?.country || null;
    if (!countryName) return { eligible: false, country: '' };
    const isNigerian = countryName.toLowerCase() === 'nigeria';

    return { eligible: !isNigerian, country: countryName };
  }),

  // Get USD withdrawal configuration (fee + threshold) for client-side display
  getUsdWithdrawalConfig: protectedProcedure.query(async () => {
    const fee = await getAdminSetting('USD_WITHDRAWAL_FEE', DEFAULT_USD_WITHDRAWAL_FEE);
    const minWithdrawal = await getAdminSetting('USD_MIN_WITHDRAWAL', DEFAULT_USD_MIN_WITHDRAWAL);
    return { feeUsd: fee, minWithdrawalUsd: minWithdrawal };
  }),
});
