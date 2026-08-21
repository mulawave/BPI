import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import {
  activateMembershipAfterExternalPayment,
  upgradeMembershipAfterExternalPayment,
} from "@/server/services/membershipPayments.service";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import {
  claimPendingPayment,
  markPendingPaymentReviewed,
} from "@/server/services/payment/pendingPaymentFulfillment";

type PaymentUser = {
  email?: string | null;
  name?: string | null;
  country?: string | null;
  state?: string | null;
};

export type AdminReviewPaymentRecord = {
  id: string;
  userId: string;
  status: string | null;
  transactionType: string | null;
  amount: number;
  paymentMethod: string | null;
  gatewayReference: string | null;
  proofOfPayment?: string | null;
  metadata?: Record<string, unknown> | null;
  User?: PaymentUser | null;
};

type EmailJob = {
  to: string;
  subject: string;
  html: string;
};

type DepositNotification = {
  status: "completed" | "failed";
  amount: number;
  reference: string;
  receiptUrl?: string;
};

type ReviewAction = "approve" | "reject";

type ReviewDeps = {
  claimPendingPayment: typeof claimPendingPayment;
  markPendingPaymentReviewed: typeof markPendingPaymentReviewed;
  activateMembershipAfterExternalPayment: typeof activateMembershipAfterExternalPayment;
  upgradeMembershipAfterExternalPayment: typeof upgradeMembershipAfterExternalPayment;
  recordRevenue: typeof recordRevenue;
  generateReceiptLink: typeof generateReceiptLink;
  notifyDepositStatus: typeof notifyDepositStatus;
  sendEmail: (job: EmailJob) => Promise<unknown>;
};

type ReviewPrismaClient = {
  $transaction: <T>(
    callback: (tx: any) => Promise<T>,
    options?: { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ) => Promise<T>;
};

const defaultDeps: ReviewDeps = {
  claimPendingPayment,
  markPendingPaymentReviewed,
  activateMembershipAfterExternalPayment,
  upgradeMembershipAfterExternalPayment,
  recordRevenue,
  generateReceiptLink,
  notifyDepositStatus,
  async sendEmail(job) {
    const { sendEmail } = await import("@/lib/email");
    await sendEmail(job);
  },
};

function normalizePercent(maybePercent: number, fallback: number) {
  if (!Number.isFinite(maybePercent)) return fallback;
  if (maybePercent < 0) return fallback;
  return maybePercent > 1 ? maybePercent / 100 : maybePercent;
}

function computeProfitFiat(params: {
  profitMode: "PERCENT" | "FIXED" | "HYBRID";
  profitPercent: number;
  profitFixedAmountFiat: number;
  baseFiat: number;
}) {
  const percent = normalizePercent(params.profitPercent, 0);
  const fixed = Number(params.profitFixedAmountFiat ?? 0);
  const base = Number(params.baseFiat ?? 0);

  let profit = 0;
  if (params.profitMode === "PERCENT") profit = base * percent;
  else if (params.profitMode === "FIXED") profit = fixed;
  else profit = base * percent + fixed;

  return Math.min(Math.max(profit, 0), base);
}

export async function executeAdminPaymentReview(params: {
  prisma: ReviewPrismaClient;
  payment: AdminReviewPaymentRecord;
  action: ReviewAction;
  notes?: string;
  reviewerId?: string;
  reviewTime?: Date;
  deps?: Partial<ReviewDeps>;
}) {
  const {
    prisma,
    payment,
    action,
    notes,
    reviewerId,
    reviewTime = new Date(),
    deps,
  } = params;
  const services = { ...defaultDeps, ...deps };
  const newStatus = action === "approve" ? "approved" : "rejected";

  const reviewResult = await prisma.$transaction(async (tx) => {
    const claimResult = await services.claimPendingPayment(tx, {
      pendingPaymentId: payment.id,
      expectedUserId: payment.userId,
      purpose: payment.transactionType || "ADMIN_REVIEW",
      actor: "Admin review",
      claimableStatuses: [payment.status || "pending"],
      claimedNote: notes,
      reviewedBy: reviewerId,
    });

    if (claimResult.status !== "claimed") {
      throw new Error("Payment is already being reviewed or has already been processed");
    }

    const emailJobs: EmailJob[] = [];
    let depositNotification: DepositNotification | null = null;

    if (action === "approve") {
      const purpose = (payment.transactionType || "").toUpperCase();
      const metadata = (payment.metadata ?? {}) as Record<string, any>;
      const paymentRef = payment.gatewayReference || payment.id;
      const isCrypto = (payment.paymentMethod || "").toLowerCase() === "crypto";
      const paymentMethodLabel = isCrypto ? "Crypto Transfer" : "Bank Transfer";
      const sourceKey = isCrypto ? "CRYPTO" : "BANK_TRANSFER";

      if (purpose === "MEMBERSHIP") {
        const pkgId = metadata.packageId as string | undefined;
        if (!pkgId) {
          throw new Error(
            `Missing packageId in payment metadata for MEMBERSHIP activation. Payment ID: ${payment.id}, User: ${payment.User?.email || payment.userId}. Please check the payment record and ensure packageId is present.`
          );
        }

        const membershipPackage = await tx.membershipPackage.findUnique({ where: { id: pkgId } });
        if (!membershipPackage) throw new Error(`Membership package not found: ${pkgId}`);

        const membershipProfitFiat = computeProfitFiat({
          profitMode: ((membershipPackage.profitMode ?? "PERCENT") as any) as "PERCENT" | "FIXED" | "HYBRID",
          profitPercent: Number(membershipPackage.profitPercent ?? 1),
          profitFixedAmountFiat: Number(membershipPackage.profitFixedAmountFiat ?? 0),
          baseFiat: Number(membershipPackage.price ?? 0),
        });

        await services.activateMembershipAfterExternalPayment({
          prisma: tx,
          userId: payment.userId,
          packageId: pkgId,
          selectedPalliative: metadata.selectedPalliative,
          paymentReference: paymentRef,
          paymentMethodLabel,
          activatorName: payment.User?.name || payment.User?.email || "New Member",
        });

        await services.recordRevenue(tx as any, {
          source: "MEMBERSHIP_REGISTRATION",
          amount: membershipProfitFiat,
          currency: "NGN",
          sourceId: payment.id,
          description: `Membership purchase: Package ${pkgId}`,
          sourceKey,
          userId: payment.userId,
          packageId: pkgId,
          programType: "MEMBERSHIP",
          country: payment.User?.country ?? undefined,
          state: payment.User?.state ?? undefined,
          region: getNigerianRegion(payment.User?.state),
          metadata: {
            paymentRef,
            paymentAmount: payment.amount,
            basePrice: membershipPackage.price,
            vat: membershipPackage.vat,
            packageName: membershipPackage.name,
            selectedPalliative: metadata.selectedPalliative ?? null,
            paymentMethod: sourceKey,
          },
        });
      } else if (purpose === "STORE_PURCHASE") {
        const orderId = metadata.orderId as string | undefined;
        if (!orderId) {
          throw new Error(
            `Missing orderId in payment metadata for STORE_PURCHASE. Payment ID: ${payment.id}, User: ${payment.User?.email || payment.userId}.`
          );
        }

        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            product: { include: { pickupCenter: true } },
            user: true,
            pickupCenter: true,
          },
        });

        if (!order) {
          throw new Error(`Store order not found: ${orderId}`);
        }

        if (order.userId !== payment.userId) {
          throw new Error(
            `Order user mismatch for STORE_PURCHASE. Order ${order.id} belongs to ${order.userId} but payment is for ${payment.userId}.`
          );
        }

        const generateClaimCode = async (): Promise<string> => {
          let claimCode = "";
          let exists = true;
          while (exists) {
            const rand = Math.floor(100000 + Math.random() * 900000);
            claimCode = `BPI-${rand}-PC`;
            const found = await tx.order.findFirst({ where: { claimCode } });
            exists = Boolean(found);
          }
          return claimCode;
        };

        if (order.status === "PENDING") {
          const claimCode = await generateClaimCode();
          const nowIso = new Date().toISOString();
          const existingBreakdown = (order.paymentBreakdown ?? {}) as any;
          const externalTokenExisting = existingBreakdown?.external_token ?? {};
          const txHash = payment.proofOfPayment || (metadata.txHash as string | undefined) || null;

          const paymentBreakdown = {
            ...existingBreakdown,
            payment_mode: "EXTERNAL_TOKEN",
            confirmed_at: nowIso,
            external_token: {
              ...externalTokenExisting,
              gateway_reference: paymentRef,
              tx_hash: txHash,
              token_symbol:
                (metadata.tokenSymbol as string | undefined) ?? externalTokenExisting?.symbol ?? null,
              expected_amount:
                (metadata.expectedTokenAmount as number | undefined) ??
                externalTokenExisting?.expected_amount ??
                null,
              expected_fiat:
                (metadata.totalFiat as number | undefined) ?? externalTokenExisting?.expected_fiat ?? null,
              deposit_address:
                (metadata.depositAddress as string | undefined) ??
                externalTokenExisting?.deposit_address ??
                null,
            },
          };

          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PROCESSING",
              claimStatus: "CODE_ISSUED",
              claimCode,
              paymentBreakdown,
            },
            include: { product: true, user: true, pickupCenter: true },
          });

          if (updatedOrder.user?.email) {
            emailJobs.push({
              to: updatedOrder.user.email,
              subject: "Your BPI pickup claim code",
              html: `<p>Hello ${updatedOrder.user.name ?? ""},</p><p>Your order for <strong>${updatedOrder.product?.name ?? "your item"}</strong> is confirmed.</p><p><strong>Claim Code:</strong> ${claimCode}</p><p>Please present this code and a valid ID at the pickup center to receive your item.</p>`,
            });
          }

          const pickupEmail = updatedOrder.pickupCenter?.contactEmail;
          if (pickupEmail) {
            emailJobs.push({
              to: pickupEmail,
              subject: "New pickup order assigned",
              html: `<p>A new order has been assigned to your pickup center.</p><p>Product: ${updatedOrder.product?.name ?? "Item"}</p><p>Claim Code: ${claimCode}</p>`,
            });
          }

          const profitFiat = Number((updatedOrder.pricingSnapshot as any)?.profit_fiat ?? 0);
          const totalFiat = Number((updatedOrder.pricingSnapshot as any)?.total_fiat ?? payment.amount ?? 0);
          const amountForPools = profitFiat > 0 ? profitFiat : totalFiat;

          if (amountForPools > 0) {
            try {
              await services.recordRevenue(tx as any, {
                source: "STORE_PURCHASE",
                amount: amountForPools,
                currency: "NGN",
                sourceId: updatedOrder.id,
                description: `Store purchase profit: ${updatedOrder.product?.name || "Product"}`,
                sourceKey: "EXTERNAL_TOKEN",
                userId: updatedOrder.userId,
                orderId: updatedOrder.id,
                productId: updatedOrder.productId,
                programType: "STORE",
                country: updatedOrder.user?.country ?? undefined,
                state: updatedOrder.user?.state ?? undefined,
                region: getNigerianRegion(updatedOrder.user?.state),
                tokenSymbol:
                  (metadata.tokenSymbol as string | undefined) ??
                  (updatedOrder.pricingSnapshot as any)?.token_symbol ??
                  (updatedOrder.paymentBreakdown as any)?.external_token?.symbol ??
                  undefined,
                metadata: {
                  pendingPaymentId: payment.id,
                  paymentRef,
                  txHash,
                  quantity: updatedOrder.quantity,
                  profitFiat,
                  totalFiat,
                  pricingSnapshot: updatedOrder.pricingSnapshot ?? null,
                  paymentBreakdown: updatedOrder.paymentBreakdown ?? null,
                },
              });
            } catch (error: any) {
              const code = error?.code || error?.name;
              if (code !== "P2002") {
                throw error;
              }
            }
          }
        }
      } else if (purpose === "UPGRADE") {
        const pkgId = metadata.packageId as string | undefined;
        const fromId = metadata.fromPackageId as string | undefined;
        if (!pkgId || !fromId) {
          throw new Error(
            `Missing required metadata for UPGRADE payment. Payment ID: ${payment.id}, User: ${payment.User?.email || payment.userId}. Required: packageId${!pkgId ? " (missing)" : ""}, fromPackageId${!fromId ? " (missing)" : ""}. Please verify the upgrade payment record.`
          );
        }

        await services.upgradeMembershipAfterExternalPayment({
          prisma: tx,
          userId: payment.userId,
          packageId: pkgId,
          currentPackageId: fromId,
          selectedPalliative: metadata.selectedPalliative,
          paymentReference: paymentRef,
          paymentMethodLabel,
        });

        await services.recordRevenue(tx as any, {
          source: "MEMBERSHIP_REGISTRATION",
          amount: payment.amount,
          currency: "NGN",
          sourceId: payment.id,
          description: `Membership upgrade: From ${fromId} to ${pkgId}`,
          sourceKey,
          userId: payment.userId,
          packageId: pkgId,
          programType: "MEMBERSHIP_UPGRADE",
          country: payment.User?.country ?? undefined,
          state: payment.User?.state ?? undefined,
          region: getNigerianRegion(payment.User?.state),
          metadata: {
            paymentRef,
            paymentAmount: payment.amount,
            fromPackageId: fromId,
            toPackageId: pkgId,
            selectedPalliative: metadata.selectedPalliative ?? null,
            paymentMethod: sourceKey,
          },
        });
      } else if (purpose === "TOPUP" || purpose === "DEPOSIT") {
        const depositAmount = Number(metadata.depositAmount || payment.amount);
        const vatAmount = Number(metadata.vatAmount || 0);
        const processingFeeAmount = Number(metadata.processingFeeAmount || 0);

        const existingCompletedDeposit = await tx.transaction.findFirst({
          where: {
            reference: paymentRef,
            userId: payment.userId,
            status: "completed",
            transactionType: "DEPOSIT",
          },
        });

        if (existingCompletedDeposit) {
          throw new Error(`Deposit with reference ${paymentRef} has already been processed`);
        }

        await tx.user.update({
          where: { id: payment.userId },
          data: {
            wallet: { increment: depositAmount },
          },
        });

        await tx.transaction.updateMany({
          where: {
            reference: paymentRef,
            userId: payment.userId,
            status: "pending",
          },
          data: {
            status: "completed",
            description: `Wallet deposit approved by admin - ${payment.paymentMethod}`,
          },
        });

        if (vatAmount > 0) {
          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: payment.userId,
              transactionType: "VAT",
              amount: vatAmount,
              description: "VAT on wallet deposit (7.5%)",
              status: "completed",
              reference: `VAT-${paymentRef}`,
              walletType: "main",
            },
          });
        }

        if (processingFeeAmount > 0) {
          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: payment.userId,
              transactionType: "USDT_DEPOSIT_FEE",
              amount: processingFeeAmount,
              description: "Processing fee on USDT deposit",
              status: "completed",
              reference: `FEE-DEP-${paymentRef}`,
              walletType: "main",
            },
          });

          await services.recordRevenue(tx as any, {
            source: "DEPOSIT_FEE",
            amount: processingFeeAmount,
            currency: "USD",
            sourceId: paymentRef,
            userId: payment.userId,
            description: `USDT deposit processing fee (admin approved) — ref ${paymentRef}`,
          });
        }

        const receiptUrl = services.generateReceiptLink(paymentRef, "deposit");
        depositNotification = {
          status: "completed",
          amount: depositAmount,
          reference: paymentRef,
          receiptUrl,
        };
      } else if (purpose === "CSP_CONTRIBUTION") {
        const cspRequestId = metadata.cspRequestId as string | undefined;
        if (cspRequestId) {
          const cspRequest = await tx.cspSupportRequest.findUnique({ where: { id: cspRequestId } });
          if (cspRequest) {
            const newRaised = cspRequest.raisedAmount + payment.amount;
            const nextCspStatus =
              newRaised >= cspRequest.thresholdAmount ? "ready_for_release" : cspRequest.status;

            await tx.cspSupportRequest.update({
              where: { id: cspRequestId },
              data: {
                raisedAmount: { increment: payment.amount },
                contributorsCount: { increment: 1 },
                status: nextCspStatus,
              },
            });

            await tx.cspContribution.create({
              data: {
                requestId: cspRequestId,
                contributorId: payment.userId,
                amount: payment.amount,
                walletType: "wallet",
              },
            });

            await tx.transaction.create({
              data: {
                id: randomUUID(),
                userId: payment.userId,
                transactionType: "CSP_CONTRIBUTION",
                amount: -payment.amount,
                description: `CSP crypto contribution to request ${cspRequestId} (admin verified)`,
                status: "completed",
                reference: paymentRef,
                walletType: "main",
              },
            });
          }
        }
      } else if (purpose === "STORE_PURCHASE") {
        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: payment.userId,
            transactionType: "STORE_PURCHASE",
            amount: -payment.amount,
            description: "Store purchase via crypto (admin verified)",
            status: "completed",
            reference: paymentRef,
            walletType: "main",
          },
        });
      } else {
        await tx.user.update({
          where: { id: payment.userId },
          data: {
            wallet: { increment: payment.amount },
          },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: payment.userId,
            transactionType: "DEPOSIT",
            amount: payment.amount,
            description: `Payment approved (admin verified) - ${payment.paymentMethod}`,
            status: "completed",
            reference: paymentRef,
            walletType: "main",
          },
        });
      }
    } else {
      const paymentRef = payment.gatewayReference || payment.id;

      await tx.transaction.updateMany({
        where: {
          reference: paymentRef,
          userId: payment.userId,
          status: "pending",
        },
        data: {
          status: "failed",
          description: `Payment rejected by admin: ${notes || "No reason provided"}`,
        },
      });

      depositNotification = {
        status: "failed",
        amount: payment.amount,
        reference: paymentRef,
      };
    }

    const updated = await services.markPendingPaymentReviewed(tx, {
      paymentId: payment.id,
      status: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: reviewTime,
      note: notes,
    });

    if (!updated) {
      throw new Error("Unable to finalize payment review state");
    }

    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        userId: reviewerId || "system",
        action: `PAYMENT_${action.toUpperCase()}`,
        entity: "PendingPayment",
        entityId: payment.id,
        changes: JSON.stringify({ action, amount: payment.amount, userId: payment.userId }),
        status: "success",
        createdAt: reviewTime,
      },
    });

    return { updated, depositNotification, emailJobs };
  }, {
    timeout: 30_000,
    isolationLevel: "Serializable",
  });

  if (reviewResult.emailJobs.length > 0) {
    try {
      for (const emailJob of reviewResult.emailJobs) {
        await services.sendEmail(emailJob);
      }
    } catch {
      // Email failures should not block approval after commit.
    }
  }

  if (reviewResult.depositNotification) {
    await services.notifyDepositStatus(
      payment.userId,
      reviewResult.depositNotification.status,
      reviewResult.depositNotification.amount,
      reviewResult.depositNotification.reference,
      reviewResult.depositNotification.receiptUrl
    );
  }

  return reviewResult.updated;
}
