# Payment System Fixes - Implementation Summary

## Issues Identified

### 1. Paystack/Flutterwave showing as PENDING in admin panel
**Root Cause**: Webhooks update `Transaction` table but not `PendingPayment` table

**Fix Applied**:
- ✅ Updated `app/api/webhooks/flutterwave/route.ts` to update `PendingPayment` status to 'approved'
- ✅ Updated `app/api/webhooks/paystack/route.ts` to update `PendingPayment` status to 'approved'  
- ✅ Added `PendingPayment` record creation in `server/trpc/router/wallet.ts` for both gateways

### 2. Bank Transfer Not Wired
**Root Cause**: No implementation for bank transfer flow

**Required Implementation**:
1. Create bank account details step in DepositModal
2. Add proof of payment upload functionality
3. Wire backend to handle bank transfer deposits
4. Ensure admin can approve/reject with proof viewing

## Files Modified

### 1. app/api/webhooks/flutterwave/route.ts
```typescript
// Added after transaction status update:
await prisma.pendingPayment.updateMany({
  where: { 
    gatewayReference: tx_ref,
    status: 'pending'
  },
  data: { 
    status: 'approved',
    reviewedAt: new Date(),
    reviewNotes: 'Auto-approved via Flutterwave webhook'
  },
});
```

### 2. app/api/webhooks/paystack/route.ts
```typescript
// Added after transaction status update:
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
```

### 3. server/trpc/router/wallet.ts
**Paystack Section**:
```typescript
// Added after transaction creation:
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
      purpose: 'wallet_deposit'
    },
    updatedAt: new Date(),
  },
});
```

**Flutterwave Section**:
```typescript
// Added after transaction creation:
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
      purpose: 'wallet_deposit'
    },
    updatedAt: new Date(),
  },
});
```

## Remaining Work: Bank Transfer Implementation

### Step 1: Update DepositModal.tsx
Add new step between 'summary' and 'processing' for bank transfer:

```typescript
type Step = 'amount' | 'gateway' | 'summary' | 'bank-details' | 'processing' | 'success' | 'error';

// In handleConfirm():
if (selectedGateway === 'bank-transfer') {
  setCurrentStep('bank-details');
  return;
}

// Add bank-details step UI:
{currentStep === 'bank-details' && (
  <div className="space-y-6">
    {/* Display company bank account details */}
    <BankDetailsDisplay />
    
    {/* Upload proof of payment */}
    <ProofOfPaymentUpload 
      onUpload={(file) => setProofFile(file)}
    />
    
    {/* Submit button */}
    <Button onClick={handleBankTransferSubmit}>
      Submit for Admin Approval
    </Button>
  </div>
)}
```

### Step 2: Add Bank Transfer Handler in wallet.ts
```typescript
// In deposit mutation:
if (paymentGateway === 'bank-transfer') {
  // Get bank account details from admin settings
  const bankSettings = await prisma.paymentGatewayConfig.findFirst({
    where: { gatewayName: 'bank-transfer', isActive: true },
  });

  if (!bankSettings) {
    throw new Error("Bank transfer is not configured.");
  }

  const bankDetails = JSON.parse(bankSettings.metadata || '{}');

  // Create pending payment with proof
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
      proofOfPayment: proofImageUrl, // uploaded to storage
      metadata: {
        depositAmount: amount,
        vatAmount,
        bankDetails
      },
      updatedAt: new Date(),
    },
  });

  // Create pending transaction (not completed yet)
  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      userId,
      transactionType: "DEPOSIT",
      amount: amount,
      description: `Bank transfer deposit - Pending approval`,
      status: "pending",
      reference: txReference,
      walletType: 'main',
    },
  });

  return {
    success: true,
    message: "Bank transfer submitted for admin approval",
    bankDetails,
    reference: txReference,
  };
}
```

### Step 3: Update Admin Payment Approval
In `server/trpc/router/admin.ts`, the `reviewPayment` mutation should:

1. Check if it's a bank transfer
2. If approved:
   - Credit user wallet with amount (minus fees if applicable)
   - Create VAT transaction for tax tracking
   - Update transaction status to 'completed'
   - Send notification to user
3. If rejected:
   - Update pendingPayment status to 'rejected'
   - Send notification with reason

```typescript
reviewPayment: adminProcedure
  .input(z.object({
    paymentId: z.string(),
    action: z.enum(['approve', 'reject']),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { paymentId, action, notes } = input;
    
    const payment = await prisma.pendingPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new Error("Payment not found");

    if (action === 'approve') {
      // Extract amounts from metadata
      const meta = payment.metadata as any;
      const depositAmount = meta.depositAmount || payment.amount;
      const vatAmount = meta.vatAmount || 0;

      // Credit user wallet
      await prisma.user.update({
        where: { id: payment.userId },
        data: { wallet: { increment: depositAmount } },
      });

      // Update transaction to completed
      await prisma.transaction.updateMany({
        where: { 
          reference: payment.gatewayReference,
          userId: payment.userId 
        },
        data: { status: 'completed' },
      });

      // Create VAT transaction for tax tracking
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: payment.userId,
          transactionType: "VAT",
          amount: vatAmount,
          description: `VAT on wallet deposit (7.5%)`,
          status: "completed",
          reference: `VAT-${payment.gatewayReference}`,
          walletType: 'main',
        },
      });

      // Update pending payment
      await prisma.pendingPayment.update({
        where: { id: paymentId },
        data: {
          status: 'approved',
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
          updatedAt: new Date(),
        },
      });

      // Send notification
      await notifyDepositStatus(
        payment.userId,
        'completed',
        depositAmount,
        payment.gatewayReference
      );

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id!,
          action: 'PAYMENT_APPROVED',
          targetUserId: payment.userId,
          details: `Approved ${payment.paymentMethod} deposit of ₦${depositAmount}`,
          ipAddress: 'system',
        },
      });
    } else {
      // Reject - update status only
      await prisma.pendingPayment.update({
        where: { id: paymentId },
        data: {
          status: 'rejected',
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
          updatedAt: new Date(),
        },
      });

      // Update transaction to failed
      await prisma.transaction.updateMany({
        where: { 
          reference: payment.gatewayReference,
          userId: payment.userId 
        },
        data: { status: 'failed' },
      });

      // Send notification
      await notifyDepositStatus(
        payment.userId,
        'failed',
        payment.amount,
        payment.gatewayReference
      );
    }

    return { success: true };
  }),
```

### Step 4: Update PaymentReviewModal Component
Ensure the modal displays:
- Proof of payment image (for bank transfers)
- Bank details used
- Approve/Reject buttons
- Reason for rejection field

## Testing Checklist

- [ ] Test Paystack deposit - verify PendingPayment is created and updated by webhook
- [ ] Test Flutterwave deposit - verify PendingPayment is created and updated by webhook
- [ ] Test Bank Transfer flow:
  - [ ] User sees bank account details
  - [ ] User can upload proof of payment
  - [ ] Submission creates PendingPayment with proof
  - [ ] Admin can view proof in payment review modal
  - [ ] Admin approval credits wallet and creates VAT transaction
  - [ ] Admin rejection updates status and notifies user
- [ ] Verify all payments show correct status in admin panel
- [ ] Verify user receives notifications for all status changes

## Next Steps

1. Implement bank transfer UI in DepositModal
2. Add proof of payment upload handler
3. Update wallet router with bank transfer logic
4. Test end-to-end flow
5. Deploy to production

## Notes

- All fixes maintain existing tax calculation logic (7.5% VAT)
- Audit logging is preserved
- Notifications are sent for all status changes
- Company bank account details come from PaymentGatewayConfig table
