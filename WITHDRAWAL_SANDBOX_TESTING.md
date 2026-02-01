# Withdrawal Sandbox Testing Guide

**Date:** February 1, 2026  
**Purpose:** Test withdrawal flow with Flutterwave sandbox keys and detailed terminal logging

---

## Overview

Comprehensive logging has been added to every step of the withdrawal process. You can now track the entire flow in real-time via terminal output when testing with Flutterwave sandbox keys.

---

## Logging Coverage

### ✅ User Withdrawal Request (`server/trpc/router/wallet.ts`)
- Request initiation
- User verification
- Balance checks
- Fee and tax calculation
- Wallet deduction
- Transaction creation
- Auto-approval determination
- Flutterwave transfer (for auto-approved)
- Admin email notifications (for manual approval)
- Success/failure status

### ✅ Admin Approval (`server/trpc/router/admin.ts`)
- Approval initiation
- Withdrawal validation
- Flutterwave configuration fetch
- Bank details verification
- Flutterwave transfer initiation
- Transaction status update
- User notifications (email + in-app)
- Audit log creation

### ✅ Flutterwave API (`lib/flutterwave.ts`)
- API request details
- Request body logging
- Response status
- Success/failure data
- Error details

---

## Log Format

All logs follow this pattern:
```
🔵 [COMPONENT] Action description
📋 Details: { key: value, ... }
✅ [COMPONENT] Success message
❌ [COMPONENT] Error message
═════════════════════════════════════════════════════════════
```

### Icons Used:
- 🔵 - Information/Start of process
- ✅ - Success
- ❌ - Error/Failure
- 📋 - Details/Data
- 💰 - Balance/Money
- 💸 - Fees
- 📊 - Tax
- 🔢 - Calculations
- ⚙️ - Configuration
- 🤖 - Auto-approval
- ⏳ - Manual approval
- 🔄 - Processing/Updating
- 🌐 - External API call
- 📧 - Email/Notification
- 📄 - Receipt
- 📝 - Audit log
- 🔑 - API keys/secrets
- 📤 - Sending request
- 📥 - Receiving response
- 📦 - Response data

---

## Setup for Sandbox Testing

### 1. Configure Flutterwave Sandbox Keys

**Option A: Via Admin Panel**
1. Login as admin
2. Navigate to `/admin/settings`
3. Find "Payment Gateway Configuration"
4. Select "Flutterwave"
5. Enter sandbox credentials:
   ```
   Public Key: FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Secret Key: FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Environment: Test/Sandbox
   ```
6. Save configuration

**Option B: Via Database**
```sql
INSERT INTO "PaymentGatewayConfig" (
  id,
  "gatewayName",
  "publicKey",
  "secretKey",
  "webhookSecret",
  "isActive",
  "environment",
  "createdAt",
  "updatedAt"
) VALUES (
  'flw-sandbox-001',
  'flutterwave',
  'FLWPUBK_TEST-your-public-key',
  'FLWSECK_TEST-your-secret-key',
  'your-webhook-secret',
  true,
  'sandbox',
  NOW(),
  NOW()
);
```

### 2. Set Auto-Approval Threshold

For testing both auto and manual approval:

```sql
INSERT INTO "AdminSettings" (id, "settingKey", "settingValue", description, "updatedAt")
VALUES ('auto-threshold-001', 'AUTO_WITHDRAWAL_THRESHOLD', '100000', 'Auto-approve withdrawals below this amount (in NGN)', NOW())
ON CONFLICT ("settingKey") DO UPDATE SET "settingValue" = '100000';
```

This means:
- Withdrawals < ₦100,000 → Auto-approved (Flutterwave transfer in 3s)
- Withdrawals ≥ ₦100,000 → Manual approval required

### 3. Add Test Bank Account

Users need a bank account for withdrawals. Add via:

**SQL:**
```sql
INSERT INTO "BankRecord" (
  id,
  "userId",
  "accountNumber",
  "accountName",
  "bankId",
  "isDefault",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'your-user-id',
  '0123456789',
  'Test User',
  'bank-id-from-Bank-table',
  true,
  NOW()
);
```

**Or via UI:**
1. Login as user
2. Navigate to `/settings/bank-accounts`
3. Add bank account
4. Mark as default

---

## Testing Scenarios

### Scenario 1: Small Withdrawal (Auto-Approved)

**Setup:**
- Amount: ₦50,000 (below threshold)
- User has sufficient balance

**Steps:**
1. Start dev server and watch terminal:
   ```bash
   npm run dev
   ```

2. Login as user

3. Navigate to `/dashboard/wallet`

4. Click "Withdraw"

5. Fill form:
   - Amount: 50000
   - Type: Cash
   - Source Wallet: Main Wallet
   - Bank Account: Select default

6. Submit

**Expected Terminal Output:**
```
🔵 [WITHDRAWAL] Request initiated
📋 Details: { userId: '...', amount: 50000, type: 'cash', ... }
✅ [WITHDRAWAL] User verified: Test User
💰 [WITHDRAWAL] Current balance: 100000 NGN in wallet
💸 [WITHDRAWAL] Withdrawal fee: 100
🔢 [WITHDRAWAL] Total deduction: 50100 (amount: 50000 + fee: 100 + tax: 0 )
✅ [WITHDRAWAL] Balance check passed
⚙️  [WITHDRAWAL] Auto-approval threshold: 100000
🤖 [WITHDRAWAL] Auto-approve: YES
📌 [WITHDRAWAL] Initial status: processing
🔄 [WITHDRAWAL] Deducting from wallet...
✅ [WITHDRAWAL] Wallet deducted successfully
🔄 [WITHDRAWAL] Creating transaction record...
✅ [WITHDRAWAL] Transaction created: txn-id-here
🤖 [WITHDRAWAL] Auto-approved - initiating Flutterwave transfer in 3s...

[After 3 seconds...]

🌐 [FLUTTERWAVE] Fetching gateway configuration...
✅ [FLUTTERWAVE] Configuration found
🌐 [FLUTTERWAVE] Initiating bank transfer...
📋 Transfer details: { bank: '058', account: '****6789', amount: 50000, reference: 'WD-CASH-...' }
🌐 [FLUTTERWAVE-API] Initiating bank transfer...
📋 [FLUTTERWAVE-API] Request params: { ... }
📤 [FLUTTERWAVE-API] Sending request to Flutterwave...
🔑 [FLUTTERWAVE-API] Using secret key: FLWSECK_TEST-...
📥 [FLUTTERWAVE-API] Response received. Status: 200 OK
📦 [FLUTTERWAVE-API] Response body: { ... }
✅ [FLUTTERWAVE-API] Transfer successful!
📊 [FLUTTERWAVE-API] Transfer details: { id: '12345', reference: 'FLW-...' }
✅ [FLUTTERWAVE] Transfer successful: { reference: 'FLW-...', id: '12345' }
🔄 [WITHDRAWAL] Updating transaction with Flutterwave reference...
✅ [WITHDRAWAL] Transaction updated to completed
📧 [NOTIFICATION] Sending completion notification to user...
✅ [NOTIFICATION] User notified of completion

✅ [WITHDRAWAL] Auto-approved withdrawal completed successfully
═══════════════════════════════════════════════════════════════

✅ [WITHDRAWAL] Request completed successfully
📊 Final Status: { transactionId: '...', status: 'processing', requiresApproval: false, totalDeducted: 50100 }
═══════════════════════════════════════════════════════════════
```

---

### Scenario 2: Large Withdrawal (Manual Approval)

**Setup:**
- Amount: ₦150,000 (above threshold)
- User has sufficient balance

**Steps:**
1. Watch terminal: `npm run dev`

2. Login as user, go to `/dashboard/wallet`, withdraw ₦150,000

**Expected Terminal Output (User Side):**
```
🔵 [WITHDRAWAL] Request initiated
📋 Details: { userId: '...', amount: 150000, type: 'cash', ... }
✅ [WITHDRAWAL] User verified: Test User
💰 [WITHDRAWAL] Current balance: 200000 NGN in wallet
💸 [WITHDRAWAL] Withdrawal fee: 100
🔢 [WITHDRAWAL] Total deduction: 150100
✅ [WITHDRAWAL] Balance check passed
⚙️  [WITHDRAWAL] Auto-approval threshold: 100000
🤖 [WITHDRAWAL] Auto-approve: NO (requires manual approval)
📌 [WITHDRAWAL] Initial status: pending
🔄 [WITHDRAWAL] Deducting from wallet...
✅ [WITHDRAWAL] Wallet deducted successfully
🔄 [WITHDRAWAL] Creating transaction record...
✅ [WITHDRAWAL] Transaction created: txn-id-here
⏳ [WITHDRAWAL] Manual approval required - notifying admins...
📧 [EMAIL] Sending admin notifications...
✅ [EMAIL] Admin notifications sent successfully

✅ [WITHDRAWAL] Request completed successfully
📊 Final Status: { transactionId: '...', status: 'pending', requiresApproval: true, totalDeducted: 150100 }
═══════════════════════════════════════════════════════════════
```

3. Login as admin, go to `/admin/withdrawals`, approve the withdrawal

**Expected Terminal Output (Admin Side):**
```
🔵 [ADMIN-APPROVAL] Withdrawal approval initiated
📋 Details: { withdrawalId: '...', notes: 'Approved via admin panel' }
✅ [ADMIN-APPROVAL] Withdrawal found: { user: 'Test User', amount: -150000, type: 'WITHDRAWAL_CASH', status: 'pending' }
⚙️  [ADMIN-APPROVAL] Processing: { amount: 150000, reference: 'WD-CASH-...', cashWithdrawal: true, reviewerId: 'admin-id' }
🔄 [ADMIN-APPROVAL] Fetching Flutterwave configuration...
✅ [ADMIN-APPROVAL] Flutterwave configuration found
📋 [ADMIN-APPROVAL] Bank details: { bankCode: '058', bankName: 'GTBank', account: '****6789', accountName: 'Test User' }
🌐 [ADMIN-APPROVAL] Initiating Flutterwave transfer...
🌐 [FLUTTERWAVE-API] Initiating bank transfer...
📋 [FLUTTERWAVE-API] Request params: { bank: '058', account: '****6789', amount: 150000, ... }
📤 [FLUTTERWAVE-API] Sending request to Flutterwave...
🔑 [FLUTTERWAVE-API] Using secret key: FLWSECK_TEST-...
📥 [FLUTTERWAVE-API] Response received. Status: 200 OK
📦 [FLUTTERWAVE-API] Response body: { status: 'success', data: { ... } }
✅ [FLUTTERWAVE-API] Transfer successful!
📊 [FLUTTERWAVE-API] Transfer details: { id: '67890', reference: 'FLW-...' }
✅ [ADMIN-APPROVAL] Flutterwave transfer successful. Reference: FLW-...
🔄 [ADMIN-APPROVAL] Updating transaction status to completed...
✅ [ADMIN-APPROVAL] Transaction updated successfully
📄 [ADMIN-APPROVAL] Receipt generated: /receipts/...
📧 [ADMIN-APPROVAL] Sending notification to user...
📧 [EMAIL] Sending approval email to user...
✅ [EMAIL] Approval email sent successfully
📝 [ADMIN-APPROVAL] Creating audit log...
✅ [ADMIN-APPROVAL] Audit log created

✅ [ADMIN-APPROVAL] Withdrawal approval completed successfully
═══════════════════════════════════════════════════════════════
```

---

### Scenario 3: Flutterwave Error (Sandbox)

**Purpose:** Test error handling when Flutterwave fails

**Steps:**
1. Use invalid bank code or account number
2. Submit withdrawal (auto-approved amount)

**Expected Terminal Output:**
```
[... initial steps same as Scenario 1 ...]

🌐 [FLUTTERWAVE-API] Initiating bank transfer...
📤 [FLUTTERWAVE-API] Sending request to Flutterwave...
📥 [FLUTTERWAVE-API] Response received. Status: 400 Bad Request
❌ [FLUTTERWAVE-API] Request failed: 400 {error details}
❌ [FLUTTERWAVE-API] Error initiating transfer: Error: Flutterwave transfer error: Bad Request - {details}

❌ [WITHDRAWAL] Processing error: Error: Flutterwave transfer error: Bad Request
Error details: Flutterwave transfer error: Bad Request - Invalid account number
🔄 [WITHDRAWAL] Initiating refund...
✅ [WITHDRAWAL] User refunded successfully
📧 [NOTIFICATION] User notified of failure
═══════════════════════════════════════════════════════════════
```

**Verification:**
- User wallet refunded
- Transaction status = "failed"
- User receives failure notification

---

## Troubleshooting

### Issue: No Logs Appearing

**Check:**
1. Server is running in development mode (`npm run dev`)
2. Not running in production mode (logs may be suppressed)
3. Terminal/console is visible and not hidden

### Issue: Flutterwave Transfer Fails

**Common Causes:**
1. **Invalid Secret Key**
   - Log shows: `🔑 [FLUTTERWAVE-API] Using secret key: undefined`
   - Fix: Set secret key in admin panel or PaymentGatewayConfig table

2. **Wrong Environment**
   - Using live key in sandbox or vice versa
   - Fix: Ensure `FLWSECK_TEST-` prefix for sandbox

3. **Invalid Bank Code**
   - Log shows: `400 Bad Request - Invalid bank code`
   - Fix: Use valid Flutterwave bank codes (e.g., '058' for GTBank)

4. **Invalid Account Number**
   - Log shows: `Could not resolve account`
   - Fix: In sandbox, use test account numbers provided by Flutterwave

5. **Insufficient Flutterwave Balance**
   - Log shows: `Insufficient balance`
   - Fix: Sandbox accounts have virtual balance, contact Flutterwave support

### Issue: User Not Receiving Emails

**Check:**
1. SMTP configured (see ADMIN_NOTIFICATION_SYSTEM.md)
2. Email logs show success:
   ```
   ✅ [EMAIL] Admin notifications sent successfully
   ```
3. Check spam folder
4. Verify email address in user profile

### Issue: Withdrawal Not Showing in Admin Panel

**Check:**
1. Transaction status is "pending"
2. Transaction type is "WITHDRAWAL_CASH" or "WITHDRAWAL_BPT"
3. Admin panel badge count updates (refresh page)
4. Check database directly:
   ```sql
   SELECT * FROM "Transaction" 
   WHERE status = 'pending' 
   AND "transactionType" IN ('WITHDRAWAL_CASH', 'WITHDRAWAL_BPT')
   ORDER BY "createdAt" DESC;
   ```

---

## Sandbox-Specific Notes

### Flutterwave Sandbox Behavior

1. **No Real Money:** All transactions are simulated
2. **Instant Processing:** Transfers complete immediately (no bank delays)
3. **Test Accounts:** Use Flutterwave-provided test account numbers
4. **Virtual Balance:** Sandbox accounts have unlimited virtual balance
5. **No Verification Required:** Sandbox may skip certain verifications
6. **Webhooks:** Webhooks may not fire in sandbox (test manually)

### Test Bank Codes (Nigeria)
```
058 - GTBank (Guaranty Trust Bank)
033 - United Bank for Africa
011 - First Bank of Nigeria
044 - Access Bank
057 - Zenith Bank
214 - First City Monument Bank
215 - Unity Bank
032 - Union Bank
```

### Test Account Numbers
Flutterwave provides test accounts for each bank. Contact Flutterwave support or check their documentation for current test account numbers.

---

## Verifying Successful Withdrawals

### 1. Check Terminal Logs
Look for final success message:
```
✅ [WITHDRAWAL] Auto-approved withdrawal completed successfully
```
or
```
✅ [ADMIN-APPROVAL] Withdrawal approval completed successfully
```

### 2. Check Database
```sql
-- Verify transaction status
SELECT id, "userId", amount, status, "gatewayReference", "transactionType", "createdAt"
FROM "Transaction"
WHERE reference = 'WD-CASH-1738425600000'
ORDER BY "createdAt" DESC;

-- Verify wallet deduction
SELECT wallet FROM "User" WHERE id = 'user-id';

-- Verify withdrawal history
SELECT * FROM "WithdrawalHistory"
WHERE "userId" = 'user-id'
ORDER BY date DESC
LIMIT 5;
```

### 3. Check Flutterwave Dashboard
1. Login to Flutterwave sandbox dashboard
2. Navigate to Transfers
3. Find transfer by reference
4. Verify status, amount, beneficiary

---

## Log Filtering Tips

### Filter by Component
```bash
# Only Flutterwave logs
npm run dev | grep "FLUTTERWAVE"

# Only admin approval logs
npm run dev | grep "ADMIN-APPROVAL"

# Only email logs
npm run dev | grep "EMAIL"
```

### Filter by Status
```bash
# Only errors
npm run dev | grep "❌"

# Only successes
npm run dev | grep "✅"
```

### Save Logs to File
```bash
# Save all logs
npm run dev > withdrawal-test.log 2>&1

# Save only Flutterwave logs
npm run dev 2>&1 | grep "FLUTTERWAVE" > flutterwave.log
```

---

## Next Steps After Testing

### 1. Switch to Production
Once sandbox testing is successful:

1. Get production credentials from Flutterwave
2. Update PaymentGatewayConfig with live keys
3. Set environment to "production"
4. Test with small real amount first
5. Monitor logs for 24 hours

### 2. Configure Webhooks
1. Set webhook URL in Flutterwave dashboard:
   ```
   https://yourdomain.com/api/webhooks/flutterwave
   ```
2. Set webhook secret
3. Test webhook delivery

### 3. Monitor Production
- Set up error alerts (Sentry, LogRocket)
- Monitor Flutterwave dashboard daily
- Review audit logs weekly
- Track withdrawal success rates

---

## Support

**Issues:** Create ticket with terminal logs
**Documentation:** See ADMIN_NOTIFICATION_SYSTEM.md
**Flutterwave:** https://developer.flutterwave.com/docs/transfers

---

**Last Updated:** February 1, 2026
