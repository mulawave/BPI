import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import crypto from "crypto";

/**
 * Paystack Webhook Handler
 * Auto-approves all successful Paystack payments (only bank transfers require admin approval)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');

    if (hash !== signature) {
      console.error('❌ [PAYSTACK-WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
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

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
            },
          });

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
          console.error('❌ [PAYSTACK-WEBHOOK] Membership activation failed:', error);
          throw error;
        }
      } else if (purpose === 'UPGRADE' && packageId && currentPackageId && userId) {
        console.log('📦 [PAYSTACK-WEBHOOK] Processing MEMBERSHIP upgrade...');
        
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

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
            },
          });

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
          console.error('❌ [PAYSTACK-WEBHOOK] Membership upgrade failed:', error);
          throw error;
        }
      } else if (purpose === 'EMPOWERMENT' && userId) {
        console.log('📦 [PAYSTACK-WEBHOOK] Processing EMPOWERMENT payment...');

        // Auto-approve PendingPayment so admin doesn't need to review
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
            reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
          },
        });

        // Mark pending transaction as completed
        await prisma.transaction.updateMany({
          where: { reference, userId, status: 'pending' },
          data: { status: 'completed' },
        });

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

        // Find the transaction
        const transaction = await prisma.transaction.findFirst({
          where: { reference, status: 'pending' },
        });

        if (transaction) {
          // Credit user wallet
          await prisma.user.update({
            where: { id: transaction.userId },
            data: { wallet: { increment: transaction.amount } },
          });

          // Update transaction status
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'completed' },
          });

          // Auto-approve PendingPayment
          await prisma.pendingPayment.updateMany({
            where: { gatewayReference: reference, status: 'pending' },
            data: {
              status: 'approved',
              reviewedAt: new Date(),
              reviewNotes: 'Auto-approved via Paystack webhook (payment verified)',
            },
          });

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
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Transaction not found or already processed:', reference);
        }
      } else {
        console.warn('⚠️  [PAYSTACK-WEBHOOK] Unknown payment purpose:', purpose);

        // Even for unknown purposes, auto-approve if payment is successful
        await prisma.pendingPayment.updateMany({
          where: { gatewayReference: reference, status: { in: ['pending', 'processing'] } },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
            reviewNotes: `Auto-approved via Paystack webhook (unknown purpose: ${purpose})`,
          },
        });
      }

      console.log('✅ [PAYSTACK-WEBHOOK] Payment processed successfully');
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ [PAYSTACK-WEBHOOK] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
