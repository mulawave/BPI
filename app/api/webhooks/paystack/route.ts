import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { webhookLimiter, applyRateLimit } from "@/lib/rateLimit";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import crypto from "crypto";

type PendingPaymentClaim =
  | { status: "claimed"; paymentId: string; userId: string }
  | { status: "already_processed" | "in_progress" | "missing" };

async function claimPendingPayment(reference: string, purpose: string, expectedUserId?: string): Promise<PendingPaymentClaim> {
  const pendingPayment = await prisma.pendingPayment.findFirst({
    where: {
      gatewayReference: reference,
      ...(expectedUserId ? { userId: expectedUserId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!pendingPayment) {
    const completedTransaction = await prisma.transaction.findFirst({
      where: {
        reference,
        ...(expectedUserId ? { userId: expectedUserId } : {}),
        status: "completed",
      },
    });

    return completedTransaction ? { status: "already_processed" } : { status: "missing" };
  }

  if (pendingPayment.status === "approved" || pendingPayment.status === "completed") {
    return { status: "already_processed" };
  }

  if (pendingPayment.status === "processing") {
    return { status: "in_progress" };
  }

  const claimed = await prisma.pendingPayment.updateMany({
    where: {
      id: pendingPayment.id,
      status: "pending",
    },
    data: {
      status: "processing",
      reviewNotes: `Paystack webhook claimed payment for ${purpose} processing at ${new Date().toISOString()}`,
    },
  });

  if (claimed.count === 0) {
    const refreshed = await prisma.pendingPayment.findUnique({ where: { id: pendingPayment.id } });
    if (refreshed?.status === "approved" || refreshed?.status === "completed") {
      return { status: "already_processed" };
    }
    return { status: "in_progress" };
  }

  return {
    status: "claimed",
    paymentId: pendingPayment.id,
    userId: pendingPayment.userId,
  };
}

async function markPaymentApproved(paymentId: string, note: string) {
  await prisma.pendingPayment.update({
    where: { id: paymentId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
      reviewNotes: note,
    },
  });
}

async function markPaymentNeedsReview(paymentId: string, note: string) {
  await prisma.pendingPayment.updateMany({
    where: { id: paymentId, status: "processing" },
    data: { reviewNotes: note },
  });
}

async function writeProcessingWarning(reference: string, purpose: string, amount: number, reason: string) {
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: "system",
      action: "PAYMENT_WEBHOOK_REVIEW_REQUIRED",
      entity: "PendingPayment",
      entityId: reference,
      changes: JSON.stringify({ purpose, amount, gateway: "paystack", reason }),
      status: "warning",
      createdAt: new Date(),
    },
  });
}

/** Verify that the webhook amount matches the stored pending payment amount. Returns true if OK or no record to compare. */
async function verifyPaymentAmount(paymentId: string, receivedAmountNgn: number, reference: string, purpose: string): Promise<boolean> {
  const pending = await prisma.pendingPayment.findUnique({ where: { id: paymentId }, select: { amount: true } });
  if (!pending || !pending.amount || pending.amount <= 0) return true; // no stored amount to compare
  if (Math.abs(receivedAmountNgn - pending.amount) <= 1) return true; // ₦1 tolerance for rounding
  await markPaymentNeedsReview(
    paymentId,
    `Amount mismatch: received ₦${receivedAmountNgn}, expected ₦${pending.amount}. Requires manual review.`,
  );
  await writeProcessingWarning(reference, purpose, receivedAmountNgn, `Amount mismatch: received ₦${receivedAmountNgn}, expected ₦${pending.amount}`);
  return false;
}

/**
 * Paystack Webhook Handler
 * Auto-approves all successful Paystack payments (only bank transfers require admin approval)
 */
export async function POST(req: NextRequest) {
  // Rate limit: 60 requests per minute per IP
  const blocked = applyRateLimit(req, webhookLimiter);
  if (blocked) return blocked;

  let parsedReference: string | undefined;
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error('❌ [PAYSTACK-WEBHOOK] Paystack secret is not configured');
      return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
    }

    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');

    if (hash !== signature) {
      console.error('❌ [PAYSTACK-WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    parsedReference = event?.data?.reference;
    console.log('📥 [PAYSTACK-WEBHOOK] Event received:', event.event);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, amount, status, customer, metadata } = event.data;

      console.log('💳 [PAYSTACK-WEBHOOK] Payment successful:', {
        reference,
        amount: amount / 100,
        status,
        metadata,
      });

      // Extract metadata for payment purpose
      const purpose = (metadata?.purpose || '').toUpperCase();
      const userId = metadata?.userId;
      const packageId = metadata?.packageId;
      const currentPackageId = metadata?.currentPackageId;

      // AUTO-APPROVE: Handle different payment purposes
      if (purpose === 'MEMBERSHIP' && packageId && userId) {
        console.log('📦 [PAYSTACK-WEBHOOK] Processing MEMBERSHIP activation...');

        const claim = await claimPendingPayment(reference, purpose, userId);
        if (claim.status !== 'claimed') {
          if (claim.status === 'missing') {
            await writeProcessingWarning(reference, purpose, amount / 100, 'No pending payment record was available to claim.');
          }
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Skipping duplicate or untracked membership payment:', reference, claim.status);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount / 100, reference, purpose)) {
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Amount mismatch for membership payment:', reference);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }
        
        try {
          const { activateMembershipAfterExternalPayment } = await import('@/server/services/membershipPayments.service');
          
          await activateMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            selectedPalliative: metadata?.selectedPalliative,
            paymentReference: reference,
            paymentMethodLabel: 'Paystack',
            activatorName: customer?.email || 'Member'
          });

          // Mark pending transaction as completed
          await prisma.transaction.updateMany({
            where: { reference, userId, status: 'pending' },
            data: { status: 'completed' },
          });

          await markPaymentApproved(claim.paymentId, 'Auto-approved via Paystack webhook (payment verified)');

          // Record revenue
          const membershipPackage = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
          if (membershipPackage) {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { country: true, state: true },
            });
            try {
              await recordRevenue(prisma, {
                source: 'MEMBERSHIP_REGISTRATION',
                amount: membershipPackage.price,
                currency: 'NGN',
                sourceId: `MEMBERSHIP_REGISTRATION:${reference}`,
                description: `Membership purchase: ${membershipPackage.name} (Paystack auto-approved)`,
                userId,
                packageId,
                programType: 'MEMBERSHIP',
                country: user?.country ?? undefined,
                state: user?.state ?? undefined,
                region: getNigerianRegion(user?.state),
                metadata: {
                  paymentRef: reference,
                  paymentAmount: amount / 100,
                  basePrice: membershipPackage.price,
                  vat: membershipPackage.vat,
                  packageName: membershipPackage.name,
                  selectedPalliative: metadata?.selectedPalliative ?? null,
                  paymentMethod: 'PAYSTACK',
                  autoApproved: true,
                },
              });
            } catch (err: any) {
              if (err?.code !== 'P2002') throw err;
            }
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: 'system',
              action: 'PAYMENT_AUTO_APPROVE',
              entity: 'PendingPayment',
              entityId: reference,
              changes: JSON.stringify({ purpose: 'MEMBERSHIP', amount: amount / 100, userId, gateway: 'paystack' }),
              status: 'success',
              createdAt: new Date(),
            },
          });
          
          console.log('✅ [PAYSTACK-WEBHOOK] Membership activated & auto-approved');
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Paystack membership webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          console.error('❌ [PAYSTACK-WEBHOOK] Membership activation failed:', error);
          throw error;
        }
      } else if (purpose === 'UPGRADE' && packageId && currentPackageId && userId) {
        console.log('📦 [PAYSTACK-WEBHOOK] Processing MEMBERSHIP upgrade...');

        const claim = await claimPendingPayment(reference, purpose, userId);
        if (claim.status !== 'claimed') {
          if (claim.status === 'missing') {
            await writeProcessingWarning(reference, purpose, amount / 100, 'No pending payment record was available to claim.');
          }
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Skipping duplicate or untracked upgrade payment:', reference, claim.status);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount / 100, reference, purpose)) {
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Amount mismatch for upgrade payment:', reference);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }
        
        try {
          const { upgradeMembershipAfterExternalPayment } = await import('@/server/services/membershipPayments.service');
          
          await upgradeMembershipAfterExternalPayment({
            prisma,
            userId,
            packageId,
            currentPackageId,
            selectedPalliative: metadata?.selectedPalliative,
            paymentReference: reference,
            paymentMethodLabel: 'Paystack'
          });

          // Mark pending transaction as completed
          await prisma.transaction.updateMany({
            where: { reference, userId, status: 'pending' },
            data: { status: 'completed' },
          });

          await markPaymentApproved(claim.paymentId, 'Auto-approved via Paystack webhook (payment verified)');

          // Record revenue for upgrade
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { country: true, state: true },
          });
          try {
            await recordRevenue(prisma, {
              source: 'MEMBERSHIP_REGISTRATION',
              amount: amount / 100,
              currency: 'NGN',
              sourceId: `MEMBERSHIP_UPGRADE:${reference}`,
              description: `Membership upgrade: From ${currentPackageId} to ${packageId} (Paystack auto-approved)`,
              userId,
              packageId,
              programType: 'MEMBERSHIP_UPGRADE',
              country: user?.country ?? undefined,
              state: user?.state ?? undefined,
              region: getNigerianRegion(user?.state),
              metadata: {
                paymentRef: reference,
                paymentAmount: amount / 100,
                fromPackageId: currentPackageId,
                toPackageId: packageId,
                selectedPalliative: metadata?.selectedPalliative ?? null,
                paymentMethod: 'PAYSTACK',
                autoApproved: true,
              },
            });
          } catch (err: any) {
            if (err?.code !== 'P2002') throw err;
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: 'system',
              action: 'PAYMENT_AUTO_APPROVE',
              entity: 'PendingPayment',
              entityId: reference,
              changes: JSON.stringify({ purpose: 'UPGRADE', amount: amount / 100, userId, gateway: 'paystack' }),
              status: 'success',
              createdAt: new Date(),
            },
          });
          
          console.log('✅ [PAYSTACK-WEBHOOK] Membership upgraded & auto-approved');
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Paystack upgrade webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          console.error('❌ [PAYSTACK-WEBHOOK] Membership upgrade failed:', error);
          throw error;
        }
      } else if (purpose === 'EMPOWERMENT' && userId) {
        console.log('📦 [PAYSTACK-WEBHOOK] Processing EMPOWERMENT payment...');

        const claim = await claimPendingPayment(reference, purpose, userId);
        if (claim.status !== 'claimed') {
          if (claim.status === 'missing') {
            await writeProcessingWarning(reference, purpose, amount / 100, 'No pending payment record was available to claim.');
          }
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Skipping duplicate or untracked empowerment payment:', reference, claim.status);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount / 100, reference, purpose)) {
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Amount mismatch for empowerment payment:', reference);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        try {
          await prisma.$transaction([
            prisma.transaction.updateMany({
              where: { reference, userId, status: 'pending' },
              data: { status: 'completed' },
            }),
            prisma.pendingPayment.update({
              where: { id: claim.paymentId },
              data: {
                status: 'approved',
                reviewedAt: new Date(),
                reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
              },
            }),
          ]);

          // Finalize empowerment package creation from PendingPayment metadata
          const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { id: claim.paymentId },
            select: { metadata: true },
          });
          const meta = (pendingPayment?.metadata as any) || {};
          if (meta.beneficiaryId && meta.empowermentType) {
            const beneficiary = await prisma.user.findUnique({
              where: { id: meta.beneficiaryId },
              select: { id: true, name: true, email: true },
            });
            if (beneficiary) {
              const { finalizeEmpowermentPackage } = await import('@/server/services/empowermentPayments.service');
              await finalizeEmpowermentPackage({
                sponsorId: userId,
                beneficiary,
                empowermentType: meta.empowermentType,
                packageFee: meta.packageFee ?? 330000,
                vat: meta.vat ?? 24750,
                totalCost: meta.totalCost ?? (meta.packageFee ?? 330000) + (meta.vat ?? 24750),
              });
              console.log('✅ [PAYSTACK-WEBHOOK] Empowerment package finalized for beneficiary:', beneficiary.id);
            } else {
              console.error('❌ [PAYSTACK-WEBHOOK] Beneficiary not found for empowerment finalization:', meta.beneficiaryId);
              await markPaymentNeedsReview(claim.paymentId, `Payment approved but beneficiary ${meta.beneficiaryId} not found for package creation`);
            }
          } else {
            console.error('❌ [PAYSTACK-WEBHOOK] Missing empowerment metadata in PendingPayment:', claim.paymentId);
            await markPaymentNeedsReview(claim.paymentId, 'Payment approved but empowerment metadata missing — package not created');
          }
        } catch (error) {
          await markPaymentNeedsReview(
            claim.paymentId,
            `Paystack empowerment webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          throw error;
        }

        // Audit log
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: 'system',
            action: 'PAYMENT_AUTO_APPROVE',
            entity: 'PendingPayment',
            entityId: reference,
            changes: JSON.stringify({ purpose: 'EMPOWERMENT', amount: amount / 100, userId, gateway: 'paystack' }),
            status: 'success',
            createdAt: new Date(),
          },
        });

        console.log('✅ [PAYSTACK-WEBHOOK] Empowerment payment auto-approved');
      } else if (purpose === 'DEPOSIT' || purpose === 'TOPUP') {
        console.log('💰 [PAYSTACK-WEBHOOK] Processing wallet deposit...');

        const claim = await claimPendingPayment(reference, purpose);
        if (claim.status !== 'claimed') {
          if (claim.status === 'missing') {
            await writeProcessingWarning(reference, purpose, amount / 100, 'No pending payment record was available to claim.');
          }
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Skipping duplicate or untracked deposit payment:', reference, claim.status);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        if (!await verifyPaymentAmount(claim.paymentId, amount / 100, reference, purpose)) {
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Amount mismatch for deposit payment:', reference);
          return NextResponse.json({ message: 'Webhook acknowledged' }, { status: 200 });
        }

        // Find the transaction
        const transaction = await prisma.transaction.findFirst({
          where: { reference, userId: claim.userId, status: 'pending', transactionType: 'DEPOSIT' },
        });

        if (transaction) {
          try {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: transaction.userId },
                data: { wallet: { increment: transaction.amount } },
              }),
              prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'completed' },
              }),
              prisma.pendingPayment.update({
                where: { id: claim.paymentId },
                data: {
                  status: 'approved',
                  reviewedAt: new Date(),
                  reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
                },
              }),
            ]);
          } catch (error) {
            await markPaymentNeedsReview(
              claim.paymentId,
              `Paystack deposit webhook failed after claim and needs manual review: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            throw error;
          }

          // Generate receipt
          const receiptUrl = generateReceiptLink(transaction.id, 'deposit');

          // Send success notification
          await notifyDepositStatus(
            transaction.userId,
            'completed',
            transaction.amount,
            reference,
            receiptUrl
          );

          console.log('✅ [PAYSTACK-WEBHOOK] Deposit processed & auto-approved');
        } else {
          await markPaymentNeedsReview(
            claim.paymentId,
            'Paystack deposit webhook claimed a payment but no pending deposit transaction was found. Manual review required.'
          );
          await writeProcessingWarning(reference, purpose, amount / 100, 'Claimed payment had no matching pending deposit transaction.');
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Transaction not found or already processed:', reference);
        }
      } else {
        // Purpose unknown from metadata — attempt recovery from PendingPayment record
        console.warn('⚠️  [PAYSTACK-WEBHOOK] Unknown payment purpose from metadata:', purpose, '— attempting PendingPayment lookup');

        const fallbackPending = await prisma.pendingPayment.findFirst({
          where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
          select: { id: true, transactionType: true, userId: true, metadata: true },
          orderBy: { createdAt: 'desc' },
        });

        if (fallbackPending?.transactionType) {
          const recoveredPurpose = fallbackPending.transactionType.toUpperCase();
          const recoveredUserId = fallbackPending.userId;
          const recoveredMeta = (fallbackPending.metadata as Record<string, any>) || {};
          const recoveredPackageId = recoveredMeta.packageId;
          const recoveredCurrentPackageId = recoveredMeta.currentPackageId;

          console.log('🔄 [PAYSTACK-WEBHOOK] Recovered purpose from PendingPayment:', recoveredPurpose, 'userId:', recoveredUserId);

          if ((recoveredPurpose === 'MEMBERSHIP' || recoveredPurpose === 'MEMBERSHIP_PAYMENT') && recoveredPackageId && recoveredUserId) {
            const claim = await claimPendingPayment(reference, 'MEMBERSHIP', recoveredUserId);
            if (claim.status === 'claimed') {
              if (await verifyPaymentAmount(claim.paymentId, amount / 100, reference, 'MEMBERSHIP')) {
                try {
                  const { activateMembershipAfterExternalPayment } = await import('@/server/services/membershipPayments.service');
                  await activateMembershipAfterExternalPayment({
                    prisma,
                    userId: recoveredUserId,
                    packageId: recoveredPackageId,
                    selectedPalliative: recoveredMeta.selectedPalliative,
                    paymentReference: reference,
                    paymentMethodLabel: 'Paystack',
                    activatorName: customer?.email || 'Member',
                  });
                  await prisma.transaction.updateMany({
                    where: { reference, userId: recoveredUserId, status: 'pending' },
                    data: { status: 'completed' },
                  });
                  await markPaymentApproved(claim.paymentId, 'Auto-approved via Paystack webhook (purpose recovered from PendingPayment record)');
                  console.log('✅ [PAYSTACK-WEBHOOK] Membership activated via fallback recovery');
                } catch (error) {
                  await markPaymentNeedsReview(claim.paymentId, `Paystack fallback membership activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  console.error('❌ [PAYSTACK-WEBHOOK] Fallback membership activation failed:', error);
                }
              }
            } else {
              console.log('⚠️  [PAYSTACK-WEBHOOK] Fallback claim status:', claim.status);
            }
          } else if ((recoveredPurpose === 'UPGRADE' || recoveredPurpose === 'MEMBERSHIP_UPGRADE') && recoveredPackageId && recoveredCurrentPackageId && recoveredUserId) {
            const claim = await claimPendingPayment(reference, 'UPGRADE', recoveredUserId);
            if (claim.status === 'claimed') {
              if (await verifyPaymentAmount(claim.paymentId, amount / 100, reference, 'UPGRADE')) {
                try {
                  const { upgradeMembershipAfterExternalPayment } = await import('@/server/services/membershipPayments.service');
                  await upgradeMembershipAfterExternalPayment({
                    prisma,
                    userId: recoveredUserId,
                    packageId: recoveredPackageId,
                    currentPackageId: recoveredCurrentPackageId,
                    selectedPalliative: recoveredMeta.selectedPalliative,
                    paymentReference: reference,
                    paymentMethodLabel: 'Paystack',
                  });
                  await prisma.transaction.updateMany({
                    where: { reference, userId: recoveredUserId, status: 'pending' },
                    data: { status: 'completed' },
                  });
                  await markPaymentApproved(claim.paymentId, 'Auto-approved via Paystack webhook (upgrade purpose recovered from PendingPayment record)');
                  console.log('✅ [PAYSTACK-WEBHOOK] Upgrade activated via fallback recovery');
                } catch (error) {
                  await markPaymentNeedsReview(claim.paymentId, `Paystack fallback upgrade activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  console.error('❌ [PAYSTACK-WEBHOOK] Fallback upgrade activation failed:', error);
                }
              }
            }
          } else {
            // Recovered purpose but missing required fields — still needs review
            console.warn('⚠️  [PAYSTACK-WEBHOOK] Recovered purpose but missing required fields:', { recoveredPurpose, recoveredPackageId, recoveredUserId });
            await prisma.pendingPayment.updateMany({
              where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
              data: {
                reviewNotes: `Paystack webhook: metadata purpose missing, recovered transactionType=${recoveredPurpose} but required fields incomplete. Manual review needed.`,
              },
            });
          }
        } else {
          // No PendingPayment found at all — log for manual review
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
            data: {
              reviewNotes: `Successful Paystack webhook requires manual review because payment purpose was unknown: ${purpose || 'missing'} and no PendingPayment record found.`,
            },
          });

          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: 'system',
              action: 'PAYMENT_UNKNOWN_PURPOSE_REVIEW_REQUIRED',
              entity: 'PendingPayment',
              entityId: reference,
              changes: JSON.stringify({ purpose, amount: amount / 100, gateway: 'paystack' }),
              status: 'warning',
              createdAt: new Date(),
            },
          });
        }
      }

      console.log('✅ [PAYSTACK-WEBHOOK] Payment processed successfully');
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ [PAYSTACK-WEBHOOK] Error:', error);

    // Best-effort: release any payment stuck in "processing" so it can be reviewed
    try {
      if (parsedReference) {
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: parsedReference, status: "processing" },
          data: { reviewNotes: `Paystack webhook handler crashed: ${error?.message ?? 'Unknown error'}. Payment needs manual review.` },
        });
      }
    } catch { /* swallow – primary error is already logged */ }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
