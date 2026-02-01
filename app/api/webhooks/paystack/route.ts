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
      const { reference, amount, status, customer } = event.data;

      console.log('💳 [PAYSTACK-WEBHOOK] Payment successful:', {
        reference,
        amount: amount / 100,
        status,
      });

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

      console.log('✅ [PAYSTACK-WEBHOOK] Payment processed successfully');
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ [PAYSTACK-WEBHOOK] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
