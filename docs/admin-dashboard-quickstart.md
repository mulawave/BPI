# Admin Dashboard Quick Start Checklist

> **Last Updated**: January 1, 2026  
> **Purpose**: Immediate implementation checklist before launching real payment gateways

---

## ⚠️ CRITICAL - Must Implement Before Going Live

### 1. Payment Gateway Management

#### API Configuration Interface
- [ ] Create admin settings page `/admin/settings/payment-gateways`
- [ ] Secure form for API key input
  - [ ] Paystack Public Key
  - [ ] Paystack Secret Key
  - [ ] Flutterwave Public Key
  - [ ] Flutterwave Secret Key
  - [ ] Flutterwave Encryption Key
- [ ] Encrypt and store keys in database
- [ ] Test mode / Live mode toggle
- [ ] Enable/disable individual gateways

#### Environment Variable Management
- [ ] Add to `.env.local`:
  ```
  PAYSTACK_PUBLIC_KEY=pk_test_xxx
  PAYSTACK_SECRET_KEY=sk_test_xxx
  FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
  FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
  FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxx
  ```
- [ ] Production keys ready (stored securely)
- [ ] Webhook secrets configured

### 2. Payment Verification Dashboard

#### Bank Transfer Verification Interface
- [ ] Create `/admin/payments/pending` page
- [ ] Table showing:
  - User name & email
  - Package selected
  - Amount paid
  - Upload timestamp
  - Payment proof (image/PDF viewer)
  - Actions (Approve/Reject)
- [ ] Approve action triggers:
  - [ ] Membership activation
  - [ ] Bonus distribution
  - [ ] Transaction records
  - [ ] User notification
- [ ] Reject action:
  - [ ] Reason field (required)
  - [ ] User notification
  - [ ] Flag for follow-up
- [ ] Bulk approve functionality
- [ ] Filter by date range
- [ ] Search by user

#### Failed Payment Management
- [ ] Create `/admin/payments/failed` page
- [ ] Table showing:
  - User details
  - Package
  - Amount
  - Gateway
  - Failure reason
  - Timestamp
  - Actions (Retry/Contact/Refund)
- [ ] Retry payment functionality
- [ ] Initiate refund workflow
- [ ] Send notification to user

### 3. Manual Membership Activation

#### Admin Override Interface
- [ ] Create `/admin/users/[userId]/activate` page
- [ ] Form fields:
  - [ ] User selector (search by email/name)
  - [ ] Package dropdown
  - [ ] Bypass payment checkbox
  - [ ] Trigger bonus distribution checkbox
  - [ ] Reason field (required, min 20 chars)
- [ ] Create tRPC endpoint: `api.admin.manualActivation.useMutation()`
- [ ] Backend logic:
  ```typescript
  - Verify admin role
  - Validate user & package
  - Set membership activation date
  - Set expiry date (1 year)
  - Optionally: distribute referral bonuses
  - Create audit log entry
  - Send notification to user
  ```
- [ ] Audit log viewer: `/admin/audit/manual-activations`

### 4. Basic User Management

#### User Details View
- [ ] Create `/admin/users` (list page)
- [ ] Create `/admin/users/[userId]` (detail page)
- [ ] User detail page sections:
  - [ ] Profile information (editable)
  - [ ] Membership status
  - [ ] Wallet balances (all wallets)
  - [ ] Recent transactions (last 20)
  - [ ] Referral chain
  - [ ] Activity log
- [ ] Actions:
  - [ ] Suspend account (toggle)
  - [ ] Reset password
  - [ ] Manual wallet adjustment (with reason)
  - [ ] View as user (impersonation)
  - [ ] Send notification

#### User Search & Filters
- [ ] Search by: name, email, ID
- [ ] Filter by:
  - [ ] Package level
  - [ ] Account status (active/suspended)
  - [ ] Email verified (yes/no)
  - [ ] Profile complete (yes/no)
  - [ ] Registration date range
- [ ] Pagination (50 per page)
- [ ] Export to CSV

### 5. Financial Reports

#### Daily Payment Summary
- [ ] Create `/admin/reports/daily-payments` page
- [ ] Metrics to display:
  - [ ] Total payments today
  - [ ] Total volume (NGN)
  - [ ] Successful transactions
  - [ ] Failed transactions
  - [ ] Pending verifications
  - [ ] Gateway breakdown
  - [ ] Package breakdown
- [ ] Date range selector
- [ ] Export to Excel/CSV

#### Transaction Export
- [ ] Create `/admin/reports/transactions` page
- [ ] Filters:
  - [ ] Date range (from-to)
  - [ ] Gateway (all/specific)
  - [ ] Status (all/success/failed/pending)
  - [ ] Package type
  - [ ] User (optional search)
- [ ] Export includes:
  - [ ] Transaction ID
  - [ ] User details
  - [ ] Package name
  - [ ] Amount
  - [ ] Gateway
  - [ ] Status
  - [ ] Timestamp
  - [ ] Reference number
- [ ] Export format: Excel (.xlsx) or CSV

---

## 🔐 Security Implementation Checklist

### Admin Authentication
- [ ] Create admin user model with role field
- [ ] Implement admin login page
- [ ] Add role check to all admin endpoints:
  ```typescript
  if (!ctx.session?.user || ctx.session.user.role !== 'admin') {
    throw new Error("UNAUTHORIZED");
  }
  ```
- [ ] Admin session timeout (30 minutes)
- [ ] Two-factor authentication (Google Authenticator)

### API Key Security
- [ ] Use encryption for storing API keys
- [ ] Never expose keys in frontend
- [ ] Use environment variables
- [ ] Implement key rotation mechanism
- [ ] Log all key access attempts

### Audit Logging
- [ ] Create AuditLog model:
  ```prisma
  model AuditLog {
    id          String   @id @default(cuid())
    adminId     String
    action      String   // "MANUAL_ACTIVATION", "USER_SUSPEND", etc.
    targetUserId String?
    details     Json     // Flexible field for action-specific data
    ipAddress   String?
    userAgent   String?
    createdAt   DateTime @default(now())
    admin       User     @relation(fields: [adminId], references: [id])
  }
  ```
- [ ] Log all sensitive operations:
  - Manual membership activation
  - Payment approval/rejection
  - User suspension
  - Wallet adjustments
  - API key changes
- [ ] Audit log viewer: `/admin/audit/logs`

### Access Control
- [ ] IP whitelist for admin panel (optional)
- [ ] Rate limiting on admin endpoints
- [ ] Failed login attempt tracking
- [ ] Account lockout after 5 failed attempts
- [ ] Admin notification on suspicious activity

---

## 📊 Minimum Viable Admin Dashboard (Week 1 Priority)

### Day 1-2: Authentication & Layout
- [ ] Admin login page
- [ ] Admin layout with sidebar
- [ ] Dashboard homepage with placeholder metrics
- [ ] Basic navigation

### Day 3-4: Payment Gateway Config
- [ ] Payment gateway settings page
- [ ] API key input and storage
- [ ] Test connection to Paystack/Flutterwave
- [ ] Enable/disable gateway toggles

### Day 5-6: Payment Verification
- [ ] Pending payments page
- [ ] Approve/reject functionality
- [ ] Payment proof viewer
- [ ] Notification on action

### Day 7: User Management Basics
- [ ] User list page
- [ ] User details page
- [ ] Search functionality
- [ ] Suspend/activate toggle

### Day 8-9: Manual Activation
- [ ] Manual activation form
- [ ] Backend endpoint implementation
- [ ] Audit logging
- [ ] Testing

### Day 10: Reports & Testing
- [ ] Daily payment summary
- [ ] Transaction export
- [ ] End-to-end testing
- [ ] Security audit

---

## 🧪 Testing Checklist Before Production

### Payment Flow Testing
- [ ] Mock payment → Activation → Bonus distribution → Dashboard update
- [ ] Paystack test mode → Successful payment
- [ ] Paystack test mode → Failed payment
- [ ] Flutterwave test mode → Successful payment
- [ ] Flutterwave test mode → Currency conversion
- [ ] Bank transfer → Upload proof → Admin approval → Activation
- [ ] Crypto payment → Address generation → Payment detection

### Admin Operations Testing
- [ ] Manual activation → Bonuses distributed → User notified
- [ ] Payment approval → Activation triggered → Wallets updated
- [ ] Payment rejection → User notified → Follow-up process
- [ ] User suspension → Login blocked → Dashboard access denied
- [ ] Wallet adjustment → Transaction created → User notified

### Security Testing
- [ ] Non-admin cannot access `/admin/*`
- [ ] Admin session expires after inactivity
- [ ] API keys encrypted in database
- [ ] Webhook signatures verified
- [ ] Rate limiting functional
- [ ] Audit logs created for all sensitive actions

### Error Handling Testing
- [ ] Gateway API down → Graceful error message
- [ ] Webhook signature invalid → Reject and log
- [ ] Duplicate payment → Idempotency check
- [ ] Invalid payment amount → Reject with reason
- [ ] User already activated → Prevent duplicate activation

---

## 📞 Support Escalation Process

### Customer Support Workflow
1. **Customer contacts support** (email/phone/chat)
2. **Support agent verifies identity**
3. **Agent checks payment status** in admin panel
4. **If payment confirmed externally**:
   - Admin manually verifies payment
   - Admin approves in pending payments queue
   - System auto-activates membership
   - User receives notification
5. **If payment failed**:
   - Admin initiates refund
   - User receives refund notification
   - Provide alternative payment method
6. **If technical issue**:
   - Escalate to technical team
   - Log issue in ticketing system
   - Follow up with user

### Common Support Scenarios
- [ ] "I paid but account not activated"
  - Check pending payments queue
  - Verify payment proof
  - Approve if valid
- [ ] "Payment failed but money deducted"
  - Check gateway dashboard
  - Verify transaction status
  - Initiate refund if needed
- [ ] "Wrong package activated"
  - Check transaction history
  - Admin can upgrade/downgrade
  - Adjust wallet balance if overpaid
- [ ] "Referral bonuses not received"
  - Check referral chain
  - Verify transaction records
  - Manual bonus adjustment if needed

---

## 🚀 Launch Day Checklist

### Pre-Launch (1 week before)
- [ ] All admin features tested
- [ ] Payment gateways in test mode verified
- [ ] Support team trained on admin panel
- [ ] Escalation process documented
- [ ] Backup and recovery tested
- [ ] Monitoring and alerts configured

### Launch Day
- [ ] Switch Paystack to live mode
- [ ] Switch Flutterwave to live mode
- [ ] Disable mock payment gateway (or restrict to admins)
- [ ] Monitor payment dashboard closely
- [ ] Support team on standby
- [ ] CEO/Technical lead available for escalations

### Post-Launch (First 24 hours)
- [ ] Monitor all payments in real-time
- [ ] Respond to support tickets within 1 hour
- [ ] Check webhook delivery success rate
- [ ] Verify bonus distributions are correct
- [ ] Review any failed payments immediately
- [ ] Daily reconciliation report

### Post-Launch (First Week)
- [ ] Daily payment summary review
- [ ] Gateway performance analysis
- [ ] User feedback collection
- [ ] Bug fix prioritization
- [ ] Feature enhancement requests

---

## 📚 Documentation for Support Team

### Required Documentation
- [ ] Admin panel user guide
- [ ] Payment verification SOP
- [ ] Manual activation SOP
- [ ] Refund processing SOP
- [ ] Common issues troubleshooting guide
- [ ] Escalation matrix
- [ ] Contact list (technical team, gateway support)

### Training Materials
- [ ] Video walkthrough of admin panel
- [ ] Payment gateway overview
- [ ] Customer communication templates
- [ ] FAQ document

---

**Status**: Ready to begin Phase 1 implementation  
**Timeline**: 10 working days for MVP admin dashboard  
**Next Steps**: Start with authentication and payment gateway configuration
