import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/server/auth';
import { generateDepositReceiptHTML, generateWithdrawalReceiptHTML } from '@/server/services/receipt.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; transactionId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { type, transactionId } = params;

    // Fetch transaction with user details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            firstname: true,
            lastname: true,
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user owns this transaction
    if (transaction.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to this receipt' }, { status: 403 });
    }

    const userName = transaction.User.name || 
             `${transaction.User.firstname || ''} ${transaction.User.lastname || ''}`.trim() || 
                     'Valued Customer';
    const userEmail = transaction.User.email || 'N/A';

    let receiptHTML = '';

    if (type === 'deposit') {
      // Find associated VAT transaction
      const vatTransaction = await prisma.transaction.findFirst({
        where: {
          userId,
          transactionType: 'VAT',
          reference: { startsWith: 'VAT-DEP' },
          createdAt: {
            gte: new Date(transaction.createdAt.getTime() - 5000),
            lte: new Date(transaction.createdAt.getTime() + 5000)
          }
        }
      });

      const vatAmount = vatTransaction?.amount || (transaction.amount * 0.075);
      const totalPaid = transaction.amount + vatAmount;

      receiptHTML = generateDepositReceiptHTML({
        transactionId: transaction.id,
        userId: transaction.userId,
        userName,
        userEmail,
        amount: transaction.amount,
        vatAmount,
        totalPaid,
        reference: transaction.reference || '',
        paymentMethod: transaction.description.includes('mock') ? 'mock' : 'payment-gateway',
        transactionDate: transaction.createdAt
      });
    } else if (type === 'withdrawal') {
      // Find associated fee transaction
      const feeTransaction = await prisma.transaction.findFirst({
        where: {
          userId,
          transactionType: 'WITHDRAWAL_FEE',
          createdAt: {
            gte: new Date(transaction.createdAt.getTime() - 5000),
            lte: new Date(transaction.createdAt.getTime() + 5000)
          }
        }
      });

      const fee = Math.abs(feeTransaction?.amount || 0);
      const amount = Math.abs(transaction.amount);
      const netAmount = amount; // Net amount is the withdrawal amount (fee already deducted separately)

      const withdrawalType = transaction.transactionType.includes('CASH') ? 'cash' : 'bpt';

      // Get user's bank/wallet details
      const userDetails = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          bankName: true,
          accountNumber: true,
          accountName: true,
          bnbWalletAddress: true
        }
      });

      receiptHTML = generateWithdrawalReceiptHTML({
        transactionId: transaction.id,
        userId: transaction.userId,
        userName,
        userEmail,
        amount,
        fee,
        netAmount,
        reference: transaction.reference || '',
        withdrawalType,
        bankName: userDetails?.bankName || undefined,
        accountNumber: userDetails?.accountNumber || undefined,
        accountName: userDetails?.accountName || undefined,
        bnbWalletAddress: userDetails?.bnbWalletAddress || undefined,
        transactionDate: transaction.createdAt,
        status: transaction.status
      });
    } else {
      return NextResponse.json({ error: 'Invalid receipt type' }, { status: 400 });
    }

    // Return HTML receipt
    return new NextResponse(receiptHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
