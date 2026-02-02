import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import crypto from "crypto";

/**
 * Paystack Webhook Handler
 * Handles payment notifications from Paystack
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

      // WEBHOOK UPGRADE VS ACTIVATION DISTINCTION: Handle different payment purposes
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
          
          console.log('✅ [PAYSTACK-WEBHOOK] Membership activated successfully');
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
          
          console.log('✅ [PAYSTACK-WEBHOOK] Membership upgraded successfully');
        } catch (error) {
          console.error('❌ [PAYSTACK-WEBHOOK] Membership upgrade failed:', error);
          throw error;
        }
      } else if (purpose === 'DEPOSIT' || purpose === 'TOPUP') {
        console.log('💰 [PAYSTACK-WEBHOOK] Processing wallet deposit...');

        // Find the transaction
        const transaction = await prisma.transaction.findFirst({
          where: { reference, status: 'pending' },
        });

        if (!transaction) {
          console.warn('⚠️  [PAYSTACK-WEBHOOK] Transaction not found or already processed:', reference);
          return NextResponse.json({ message: 'Transaction not found' }, { status: 200 });
        }

        // Credit user wallet
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            wallet: { increment: transaction.amount },
          },
        });

        // Update transaction status
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'completed' },
        });

        // Update pending payment if exists
        await prisma.pendingPayment.updateMany({
          where: { 
            gatewayReference: reference,
            status: 'pending'
          },
          data: { 
            status: 'approved',
            reviewedAt: new Date(),
            reviewNotes: 'Auto-approved via Paystack webhook'
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

        console.log('✅ [PAYSTACK-WEBHOOK] Deposit processed successfully');
      } else {
        console.warn('⚠️  [PAYSTACK-WEBHOOK] Unknown payment purpose:', purpose);
      }

      console.log('✅ [PAYSTACK-WEBHOOK] Payment processed successfully');
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ [PAYSTACK-WEBHOOK] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
