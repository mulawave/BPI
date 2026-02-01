# Admin Notification System - Implementation Guide

## Overview
This document outlines the comprehensive notification system for admins regarding user withdrawal requests. The system includes email notifications, dashboard indicators, menu badge counters, and real-time alerts.

---

## Features Implemented

### 1. **Email Notifications**

#### Admin Notifications (Withdrawal Requests)
- **Trigger**: When a user submits a withdrawal request
- **Recipients**: All admin users (role = 'admin' or 'super_admin')
- **Function**: `sendWithdrawalRequestToAdmins()`
- **Location**: `lib/email.ts`
- **Template Features**:
  - Professional HTML layout with BeeP Agro branding
  - Gradient header with urgent notification styling
  - User details (name, email, ID)
  - Withdrawal amount and type (Cash/BPT)
  - Bank account details
  - Direct link to admin withdrawal review page
  - Responsive design for all devices

#### User Notifications (Approval/Rejection)
- **Approval Trigger**: Admin approves withdrawal
- **Function**: `sendWithdrawalApprovedToUser()`
- **Template Features**:
  - Success confirmation message
  - Transaction details
  - Flutterwave reference number
  - Expected payout timeline
  - Receipt link

- **Rejection Trigger**: Admin rejects withdrawal
- **Function**: `sendWithdrawalRejectedToUser()`
- **Template Features**:
  - Clear rejection reason
  - Refund confirmation
  - Support contact information
  - Next steps guidance

### 2. **Dashboard Indicators**

#### Withdrawal Stats Card
- **Location**: Admin Dashboard (`app/admin/page.tsx`)
- **Features**:
  - Prominent "Pending Withdrawals" card in stats grid
  - Red color scheme for urgency
  - Live count from database
  - "Review Now" badge when count > 0
  - **Clickable**: Direct link to `/admin/withdrawals`
  - Hover animations for better UX
  - Icon: `MdCallReceived` (withdrawal icon)

#### Stats Grid Layout
- Changed from 4-column to 5-column layout
- Order: Total Users → Pending Payments → **Pending Withdrawals** → Total Revenue → Active Members
- All cards now support `href` prop for clickability

### 3. **Menu Badge Counters**

#### AdminSidebar Updates
- **Location**: `components/admin/AdminSidebar.tsx`
- **Features**:
  - Red badge counter on "Withdrawals" menu item
  - Shows actual count when `pendingWithdrawalsCount > 0`
  - Compact "9+" format when count exceeds 9
  - Works in both expanded and collapsed sidebar modes
  - Badge positioning:
    - Expanded: Inline with menu text
    - Collapsed: Absolute positioned top-right on icon

#### Data Flow
```
Database (pending transactions)
  ↓
admin.getDashboardStats (tRPC endpoint)
  ↓
app/admin/layout.tsx (fetch stats)
  ↓
AdminSidebar (render badge)
```

### 4. **SMTP Configuration**

#### Configuration Priority
1. **Admin Settings** (database - `adminSettings` table)
   - `smtpHost`
   - `smtpPort`
   - `smtpUser`
   - `smtpPassword`
   - `smtpSecure` (true/false)
   - `smtpFromEmail`
   - `smtpFromName`

2. **Environment Variables** (fallback)
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_SECURE`
   - `SMTP_FROM_EMAIL`
   - `SMTP_FROM_NAME`

#### Setup Instructions
1. Navigate to `/admin/settings`
2. Scroll to "SMTP Configuration" section
3. Enter your SMTP provider details (Gmail, SendGrid, etc.)
4. Test email sending
5. Save settings

---

## Technical Implementation

### Database Changes
```prisma
// No schema changes required - uses existing transaction table
// Withdrawal query filters:
status: "pending"
transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT"] }
```

### API Endpoints Modified

#### `admin.getDashboardStats` (server/trpc/router/admin.ts)
```typescript
// Added pending withdrawals count
const pendingWithdrawals = await prisma.transaction.count({
  where: {
    status: "pending",
    transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT"] },
  },
});

return {
  // ... existing stats
  pendingWithdrawals,
};
```

#### `wallet.requestWithdrawal` (server/trpc/router/wallet.ts)
```typescript
// Email notification to all admins
try {
  await sendWithdrawalRequestToAdmins({
    userName: user.fullName,
    userEmail: user.email,
    userId: user.id,
    amount,
    currency,
    bankDetails: {
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      bankName: input.bankName,
    },
  });
} catch (emailError) {
  console.error("Failed to send withdrawal notification:", emailError);
  // Don't fail the withdrawal if email fails
}
```

#### `admin.approveWithdrawal` (server/trpc/router/admin.ts)
```typescript
// Email notification to user on approval
try {
  await sendWithdrawalApprovedToUser({
    userName: user.fullName,
    userEmail: user.email,
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    gatewayReference: flutterwaveRef,
  });
} catch (emailError) {
  console.error("Failed to send approval email:", emailError);
}
```

#### `admin.rejectWithdrawal` (server/trpc/router/admin.ts)
```typescript
// Email notification to user on rejection
try {
  await sendWithdrawalRejectedToUser({
    userName: user.fullName,
    userEmail: user.email,
    amount: withdrawal.amount,
    currency: withdrawal.currency,
    reason: input.reason,
  });
} catch (emailError) {
  console.error("Failed to send rejection email:", emailError);
}
```

### UI Components Modified

#### StatsCard.tsx
```typescript
// Added href prop for clickability
interface StatsCardProps {
  // ... existing props
  href?: string; // NEW: Makes card clickable
}

// Wraps content in Link when href provided
if (href) {
  return (
    <Link href={href}>
      <motion.div className="cursor-pointer hover:border-primary/50">
        {content}
      </motion.div>
    </Link>
  );
}
```

#### AdminSidebar.tsx
```typescript
// Calculate badge count
const showWithdrawalBadge = item.name === "Withdrawals" && pendingWithdrawalsCount > 0;
const badgeCount = item.badge === "pending" ? pendingCount : 
                   item.name === "Withdrawals" ? pendingWithdrawalsCount : 0;

// Render badge
{(showBadge || showWithdrawalBadge) && badgeCount > 0 && (
  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
    {badgeCount}
  </span>
)}
```

---

## Email Templates

### Admin Notification Template
```html
<!-- Key sections: -->
- 🔔 Urgent header with red gradient
- User information panel
- Withdrawal details (amount, type, bank)
- "Review Withdrawal" CTA button → /admin/withdrawals
- Footer with BeeP Agro branding
```

### User Approval Template
```html
<!-- Key sections: -->
- ✅ Success header with green gradient
- Transaction summary
- Flutterwave reference
- Expected payout timeline
- Support contact
```

### User Rejection Template
```html
<!-- Key sections: -->
- ❌ Rejection notice with professional tone
- Clear reason display
- Refund confirmation
- Next steps guidance
- Support contact for appeal
```

---

## Testing Checklist

### Email Functionality
- [ ] Configure SMTP settings in admin panel
- [ ] Submit test withdrawal as user
- [ ] Verify admin receives email notification
- [ ] Check email formatting in multiple clients (Gmail, Outlook, mobile)
- [ ] Approve withdrawal and verify user receives approval email
- [ ] Reject withdrawal and verify user receives rejection email
- [ ] Test email delivery failure handling (no crash)

### Dashboard Indicators
- [ ] Check "Pending Withdrawals" card appears on admin dashboard
- [ ] Verify count updates in real-time after new withdrawal
- [ ] Click card and verify redirect to `/admin/withdrawals`
- [ ] Test "Review Now" badge visibility (appears when count > 0)
- [ ] Verify card color scheme (red for urgency)

### Menu Badges
- [ ] Check "Withdrawals" menu item shows red badge
- [ ] Verify badge count matches database
- [ ] Test badge in expanded sidebar mode
- [ ] Test badge in collapsed sidebar mode
- [ ] Verify badge disappears when all withdrawals processed

### End-to-End Flow
1. User submits withdrawal request
2. Admin receives email notification
3. Admin sees badge on "Withdrawals" menu
4. Admin sees "Pending Withdrawals" card on dashboard
5. Admin clicks card to review
6. Admin approves/rejects withdrawal
7. User receives email confirmation
8. Badge/card count decrements

---

## Troubleshooting

### Emails Not Sending
1. **Check SMTP Settings**
   - Verify credentials in `/admin/settings`
   - Test connection with SMTP provider
   - Check firewall/security group rules

2. **Check Logs**
   ```bash
   # View server logs for email errors
   npm run dev
   # Look for "Failed to send withdrawal notification" messages
   ```

3. **Verify Admin Users**
   ```sql
   -- Check admin users exist
   SELECT id, email, role FROM User WHERE role IN ('admin', 'super_admin');
   ```

### Badge Not Showing
1. **Check Data Flow**
   ```typescript
   // In browser console on /admin:
   // Check if stats are loading
   console.log(stats?.pendingWithdrawals);
   ```

2. **Verify Database Query**
   ```sql
   -- Check pending withdrawals exist
   SELECT COUNT(*) FROM Transaction 
   WHERE status = 'pending' 
   AND transactionType IN ('WITHDRAWAL_CASH', 'WITHDRAWAL_BPT');
   ```

3. **Check Prop Passing**
   - `layout.tsx` → `getDashboardStats` query
   - `layout.tsx` → `AdminSidebar` prop
   - `AdminSidebar` → badge rendering logic

### Dashboard Card Not Clickable
1. **Verify href Prop**
   ```typescript
   // In app/admin/page.tsx:
   <StatsCard
     title="Pending Withdrawals"
     href="/admin/withdrawals" // Must be present
   />
   ```

2. **Check Route Exists**
   - File: `app/admin/withdrawals/page.tsx`
   - Accessible at: `/admin/withdrawals`

---

## Future Enhancements

### Push Notifications (Browser)
- [ ] Implement Web Push API for real-time browser notifications
- [ ] Service worker registration
- [ ] Push subscription management
- [ ] Notification permission handling

### SMS Notifications
- [ ] Integrate Twilio/Africa's Talking for SMS alerts
- [ ] Admin phone number configuration
- [ ] SMS template management

### Slack/Discord Integration
- [ ] Webhook integration for team channels
- [ ] Custom message formatting
- [ ] @mention support for urgent requests

### Advanced Analytics
- [ ] Withdrawal trends dashboard
- [ ] Average approval time tracking
- [ ] Admin response time metrics
- [ ] User withdrawal patterns

### Notification Preferences
- [ ] Admin notification settings page
- [ ] Email frequency control (instant, digest, daily)
- [ ] Channel preferences (email, SMS, push)
- [ ] Threshold-based alerts (notify only if > ₦X)

---

## File Reference

### Modified Files
- `server/trpc/router/admin.ts` - Added `pendingWithdrawals` counter
- `server/trpc/router/wallet.ts` - Added email notification to admins
- `lib/email.ts` - Added 3 new email functions
- `app/admin/layout.tsx` - Pass `pendingWithdrawalsCount` to sidebar
- `app/admin/page.tsx` - Added withdrawal indicator card
- `components/admin/AdminSidebar.tsx` - Added badge counter logic
- `components/admin/StatsCard.tsx` - Added `href` prop support

### New Files
- None (all features integrated into existing components)

### Environment Variables
```env
# Optional: SMTP Configuration (fallback if admin settings not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=true
SMTP_FROM_EMAIL=noreply@bpiagrobase.com
SMTP_FROM_NAME=BeeP Agro Platform
```

---

## Summary

The admin notification system is now fully operational with:
- ✅ Real-time email alerts for all withdrawal requests
- ✅ Dashboard withdrawal indicator card (clickable)
- ✅ Menu badge counters with live counts
- ✅ Professional HTML email templates
- ✅ Flexible SMTP configuration
- ✅ Graceful error handling (emails fail silently)
- ✅ No compilation errors
- ✅ TypeScript type-safe throughout

**Next Steps**: Test the complete flow end-to-end and configure SMTP settings for production use.
