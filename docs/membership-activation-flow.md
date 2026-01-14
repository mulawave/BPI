# Membership Activation Flow Documentation

## Overview
Complete implementation of the BPI membership activation system with payment gateway integration and automatic bonus distribution.

## User Flow

### 1. Select Membership Package
- **Location:** `/membership`
- User browses available membership packages (Regular, Regular Plus, Gold Plus, etc.)
- Each package displays:
  - Base price
  - VAT amount
  - Total cost
  - Referral rewards (L1-L4)
  - Features and benefits
- User clicks "Activate Now" button

### 2. Payment Gateway Selection
- **Location:** `/membership/activate/[packageId]`
- User is redirected to payment gateway selection page
- Displays order summary with package details and pricing
- Available payment options:

#### For Nigerian Users:
- **Paystack** - Cards, bank transfer, USSD (Coming Soon)
- **Bank Transfer** - Manual verification (Coming Soon)
- **Utility Tokens** - Approved tokens (Coming Soon)

#### For Foreign Users:
- **Flutterwave** - International payments with currency conversion (Coming Soon)
- **Cryptocurrency** - Bitcoin, USDT, supported crypto (Coming Soon)

#### For Testing:
- **Mock Payment** - Simulates successful payment (Active)

### 3. Payment Processing
When user selects a payment method and clicks "Complete Payment":

#### Mock Payment (Testing):
1. Shows processing animation (1.5 second delay)
2. Activates membership automatically
3. Distributes all bonuses to referrers
4. Creates transaction records
5. Updates dashboard wallets
6. Sends notifications
7. Redirects to dashboard

#### Real Payment Gateways (Future):
- Will integrate with Paystack/Flutterwave APIs
- Handle payment callbacks
- Verify payment status
- Activate membership on successful payment

### 4. Automatic Distribution
Upon successful payment, the system automatically:

#### User Activation:
- Sets `activeMembershipPackageId`
- Sets `membershipActivatedAt` to current date
- Sets `membershipExpiresAt` to 1 year from activation
- Sets `activated` to `true`

#### Referral Rewards Distribution:
For each referrer in the chain (L1 to L4):
- **Cash Wallet** - Increment by `cash_l{level}` amount
- **Palliative Wallet** - Increment by `palliative_l{level}` amount
- **Cashback Wallet** - Increment by `cashback_l{level}` amount
- **BPT Wallet** - Distribute using 50/50 split (50% liquid, 50% locked)

#### Transaction Records:
- Creates transaction record for activation payment
- Creates individual transaction records for each referrer reward
- All transactions have status "completed" and unique references

#### Notifications:
- Activation notification sent to new member
- Reward notifications sent to all referrers
- Shows level, amount, and source member name

### 5. Dashboard Confirmation
- User redirected to `/dashboard`
- Dashboard displays updated wallet balances
- Transaction history shows all distributions
- Membership status displays as "Active"
- Membership expiry date visible

## Technical Implementation

### Frontend Components

#### `/app/membership/page.tsx`
- Displays all available membership packages
- "Activate Now" button navigates to payment page
- Uses tRPC `api.package.getPackages` query

#### `/app/membership/activate/[packageId]/page.tsx`
- Payment gateway selection interface
- Order summary sidebar
- Payment method options with icons and descriptions
- Error handling and success screens
- Uses tRPC `api.package.processMockPayment` mutation

### Backend Endpoints

#### `server/trpc/router/package.ts`

**`getPackages`** (Public)
- Returns all available membership packages
- No authentication required

**`processMockPayment`** (Protected)
- Accepts `packageId` as input
- Simulates 1.5 second payment processing
- Retrieves referral chain (4 levels)
- Distributes rewards to all referrers
- Creates transaction records
- Sends notifications
- Activates membership
- Returns success with distribution summary

### Database Updates

#### User Table:
```prisma
activeMembershipPackageId: String (set to packageId)
membershipActivatedAt: DateTime (set to now)
membershipExpiresAt: DateTime (set to now + 365 days)
activated: Boolean (set to true)
wallet: Float (incremented for referrers)
palliative: Float (incremented for referrers)
cashback: Float (incremented for referrers)
bpiTokenWallet: Float (incremented for referrers - 50%)
lockedBpiToken: Float (incremented for referrers - 50%)
```

#### Transaction Table:
```prisma
userId: String (new member or referrer)
transactionType: String ("MEMBERSHIP_ACTIVATION" or "REFERRAL_REWARD_L{level}")
amount: Float (negative for payment, positive for rewards)
description: String (detailed description)
status: String ("completed")
reference: String (unique reference number)
createdAt: DateTime (auto-generated)
```

## Testing the Flow

### Using Mock Payment Gateway:

1. **Register a new account** (or use deleteUser script to reset)
   ```bash
   npx tsx scripts/deleteUser.ts your-email@example.com
   ```

2. **Login and access membership page**
   - Dashboard shows activation modal
   - Click "Activate a Plan" or navigate to `/membership`

3. **Select a package** (e.g., Regular Plus - ₦21,500)
   - Click "Activate Now"

4. **Select Mock Payment**
   - Choose "Mock Payment (Testing)" option
   - Click "Complete Payment"

5. **Verify successful activation**
   - Success screen appears
   - Automatic redirect to dashboard
   - Dashboard shows active membership
   - Wallets display updated balances

6. **Check referrer wallets** (if you were referred)
   - Referrers see increased wallet balances
   - Transaction history shows reward entries
   - Notifications display reward details

### Expected Results:

#### For New Member:
- Membership: Active
- Expiry: 1 year from activation
- Transaction history: -₦21,500 (activation payment)

#### For L1 Referrer (Regular Plus example):
- Cash Wallet: +₦7,500
- Palliative Wallet: +₦3,000
- BPT Wallet (Liquid): +₦1,500
- BPT Wallet (Locked): +₦1,500
- Transaction history: +₦13,500 (L1 referral reward)
- Notification: "L1 referral reward earned"

#### For L2 Referrer:
- Cash Wallet: +₦1,500
- Palliative Wallet: +₦1,000
- BPT Wallet (Liquid): +₦500
- BPT Wallet (Locked): +₦500
- Transaction history: +₦3,500 (L2 referral reward)

#### For L3 Referrer:
- Cash Wallet: +₦1,500
- Palliative Wallet: +₦500
- BPT Wallet (Liquid): +₦500
- BPT Wallet (Locked): +₦500
- Transaction history: +₦3,000 (L3 referral reward)

#### For L4 Referrer:
- Palliative Wallet: +₦500
- BPT Wallet (Liquid): +₦500
- BPT Wallet (Locked): +₦500
- Transaction history: +₦1,500 (L4 referral reward)

## Future Enhancements

### Payment Gateway Integration:

#### Paystack (Nigerian Users):
```typescript
// Initialize Paystack payment
const paystackConfig = {
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  email: user.email,
  amount: totalCost * 100, // Convert to kobo
  reference: `PAY-${packageId}-${Date.now()}`,
  callback: '/api/webhooks/paystack',
};
```

#### Flutterwave (International):
```typescript
// Initialize Flutterwave payment
const flutterwaveConfig = {
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  customer: { email: user.email, name: user.name },
  amount: totalCost,
  currency: userCountry === 'NG' ? 'NGN' : 'USD',
  txRef: `FLW-${packageId}-${Date.now()}`,
  redirectUrl: '/api/webhooks/flutterwave',
};
```

#### Bank Transfer:
- Generate unique account number for user
- Monitor webhook for payment confirmation
- Auto-activate on payment received
- Send confirmation email

#### Cryptocurrency:
- Generate wallet address for payment
- Monitor blockchain for transaction
- Verify payment amount
- Auto-activate on confirmation

#### Utility Tokens:
- Integrate with token smart contracts
- Verify token balance and approval
- Execute token transfer
- Auto-activate on success

### Webhook Handlers:
Create webhook endpoints at:
- `/api/webhooks/paystack` - Verify Paystack payments
- `/api/webhooks/flutterwave` - Verify Flutterwave payments
- `/api/webhooks/crypto` - Monitor crypto transactions

### Admin Dashboard:
- View all membership activations
- Manual activation for bank transfers
- Payment reconciliation reports
- Failed payment retry management

## Security Considerations

1. **Payment Verification**
   - Always verify payments on server-side
   - Never trust client-side payment confirmations
   - Use webhook signatures to verify authenticity

2. **Idempotency**
   - Prevent duplicate activations
   - Use unique transaction references
   - Check existing activation before processing

3. **Rate Limiting**
   - Limit activation attempts per user
   - Prevent abuse of mock payment gateway
   - Implement CAPTCHA for production

4. **Audit Trail**
   - Log all activation attempts
   - Record payment gateway responses
   - Track failed payments for analysis

## Support & Troubleshooting

### Common Issues:

**Issue:** Payment page not loading
- **Solution:** Check packageId is valid
- **Solution:** Verify user is authenticated

**Issue:** Mock payment not activating
- **Solution:** Check server logs for errors
- **Solution:** Verify referral chain is set up correctly

**Issue:** Wallets not updating
- **Solution:** Check transaction records in database
- **Solution:** Verify distribution logic in `processMockPayment`

**Issue:** No notifications received
- **Solution:** Check notification service is running
- **Solution:** Verify email/push notification settings

### Debugging Commands:

```bash
# Check user activation status
npx prisma studio
# Navigate to User model, search by email

# View transaction history
# Navigate to Transaction model, filter by userId

# Delete user for fresh test
npx tsx scripts/deleteUser.ts user@example.com

# Check server logs
# View terminal running dev server
```

## Summary

The complete membership activation flow is now fully functional:
✅ Payment gateway selection page created
✅ Mock payment gateway implemented and working
✅ Automatic membership activation on payment
✅ Referral chain bonus distribution (4 levels)
✅ Transaction record creation
✅ Notification system integration
✅ Dashboard wallet updates
✅ Real-time balance reflection
✅ Placeholders for future payment gateways

Users can now:
1. Browse membership packages
2. Select a plan
3. Choose payment method
4. Complete payment (mock for testing)
5. See automatic activation
6. View updated wallets and transactions
7. Access full dashboard features

The system is production-ready for mock payments and structured for easy integration of real payment gateways.
