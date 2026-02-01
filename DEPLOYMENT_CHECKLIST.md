# Production Deployment Checklist - Withdrawal System

**Last Updated:** February 1, 2026  
**System:** Withdrawal Processing & Admin Notifications  
**Status:** Ready for deployment after SMTP configuration

---

## Pre-Deployment Checks

### ✅ Code Quality
- [x] TypeScript compilation passes (no errors)
- [x] ESLint passes (no warnings)
- [x] All functions properly typed
- [x] No console.log statements (only console.error)
- [x] No commented-out code
- [x] No TODO comments remaining

### ✅ Testing
- [x] Automated test script passes
- [x] Email functions verified
- [x] Admin users exist (9 found)
- [x] Dashboard stats working
- [ ] **SMTP configured** ⚠️
- [ ] **End-to-end test completed** ⚠️

### ✅ Documentation
- [x] ADMIN_NOTIFICATION_SYSTEM.md created
- [x] WITHDRAWAL_AUDIT_REPORT.md created
- [x] WITHDRAWAL_EXECUTIVE_SUMMARY.md created
- [x] Test script documented
- [x] Environment variables documented

### ✅ Security
- [x] Authentication enforced
- [x] Authorization verified (admin-only endpoints)
- [x] Input validation with Zod
- [x] SQL injection protected (Prisma)
- [x] Audit logging implemented
- [x] Sensitive data handling verified

---

## Configuration Required

### ⚠️ SMTP Setup (CRITICAL)

**Option A: Environment Variables**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=true
SMTP_FROM_EMAIL=noreply@bpiagrobase.com
SMTP_FROM_NAME=BeeP Agro Platform
```

**Option B: Admin Settings UI**
1. Go to `/admin/settings`
2. Navigate to SMTP Configuration section
3. Enter credentials
4. Test connection
5. Save

**To Get Gmail App Password:**
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords → Generate
4. Copy password to SMTP_PASS

**Verification:**
```bash
npx tsx scripts/testWithdrawalNotifications.ts
# Should show: ✅ SMTP configured
```

### ✅ Flutterwave (Already Configured)
- [x] FLUTTERWAVE_PUBLIC_KEY set
- [x] FLUTTERWAVE_SECRET_KEY set
- [x] Webhook URL configured: `/api/webhooks/flutterwave`
- [x] Callback URL configured: `/api/webhooks/flutterwave/callback`

### ✅ Database (Already Configured)
- [x] DATABASE_URL set
- [x] Prisma migrations applied
- [x] Connection verified

---

## End-to-End Testing

### Test Scenario 1: User Withdrawal (Small Amount - Auto Approve)

**Setup:**
- Amount: ₦50,000 (below ₦100,000 threshold)
- User: Any authenticated user with sufficient balance

**Steps:**
1. [ ] Login as user
2. [ ] Navigate to `/dashboard/wallet`
3. [ ] Click "Withdraw" button
4. [ ] Fill withdrawal form:
   - Amount: 50000
   - Currency: NGN
   - Bank details (valid)
5. [ ] Submit form
6. [ ] Verify wallet deducted immediately
7. [ ] Wait 3 seconds (auto-approval delay)
8. [ ] Check user email for confirmation ✉️
9. [ ] Verify Flutterwave reference in email
10. [ ] Check transaction status: "completed"

**Expected Admin Notifications:**
- [ ] All admins receive email alert
- [ ] Email contains user details, amount, bank info
- [ ] Email has link to `/admin/withdrawals`

**Expected User Notifications:**
- [ ] User receives approval email
- [ ] Email contains Flutterwave reference
- [ ] Email has expected timeline

**Success Criteria:**
- ✅ Wallet deducted correctly
- ✅ Auto-approval triggered
- ✅ Admin emails sent (check 2+ admin inboxes)
- ✅ User email sent
- ✅ Transaction status = "completed"

---

### Test Scenario 2: User Withdrawal (Large Amount - Manual Approve)

**Setup:**
- Amount: ₦150,000 (above ₦100,000 threshold)
- User: Any authenticated user with sufficient balance

**Steps:**
1. [ ] Login as user
2. [ ] Navigate to `/dashboard/wallet`
3. [ ] Submit withdrawal for ₦150,000
4. [ ] Verify wallet deducted immediately
5. [ ] Check transaction status: "pending"
6. [ ] Check admin emails sent ✉️

**Admin Approval:**
7. [ ] Login as admin
8. [ ] Check sidebar "Withdrawals" menu has badge (count = 1)
9. [ ] Check dashboard "Pending Withdrawals" card shows 1
10. [ ] Click card to go to `/admin/withdrawals`
11. [ ] Find pending withdrawal in list
12. [ ] Click "View Details"
13. [ ] Click "Approve"
14. [ ] Verify Flutterwave transfer initiated
15. [ ] Check user email for approval ✉️
16. [ ] Verify badge count decrements to 0

**Success Criteria:**
- ✅ Manual approval required
- ✅ Badge appears on sidebar
- ✅ Dashboard card shows count
- ✅ Admin can approve successfully
- ✅ Flutterwave transfer called
- ✅ User receives approval email
- ✅ Badge updates in real-time

---

### Test Scenario 3: Admin Rejection

**Setup:**
- Amount: ₦75,000
- User: Any authenticated user

**Steps:**
1. [ ] User submits withdrawal
2. [ ] Admin navigates to `/admin/withdrawals`
3. [ ] Click "View Details" on withdrawal
4. [ ] Click "Reject"
5. [ ] Enter rejection reason: "Invalid bank details"
6. [ ] Submit rejection
7. [ ] Verify user wallet refunded
8. [ ] Check user email for rejection notice ✉️
9. [ ] Verify email contains reason
10. [ ] Verify email confirms refund

**Success Criteria:**
- ✅ User wallet refunded in full
- ✅ User receives rejection email
- ✅ Email contains clear reason
- ✅ Transaction status = "rejected"
- ✅ Audit log created

---

## Post-Deployment Monitoring

### First 24 Hours

**Monitor:**
- [ ] Email delivery rates (target 95%+)
- [ ] Withdrawal success rates (target 99%+)
- [ ] Flutterwave API errors (target <1%)
- [ ] Average admin response time (target <2 hours)
- [ ] User complaints/support tickets

**Alerts to Set Up:**
- [ ] Failed Flutterwave transfers
- [ ] Email sending failures (>10% fail rate)
- [ ] Withdrawals pending >24 hours
- [ ] Unusual withdrawal patterns

### First Week

**Review:**
- [ ] Total withdrawals processed
- [ ] Auto vs manual approval ratio
- [ ] Average processing time
- [ ] Email open rates (admin alerts)
- [ ] Admin feedback on UI/UX

**Optimization:**
- [ ] Adjust auto-approval threshold if needed
- [ ] Tune email templates based on feedback
- [ ] Improve admin workflow if bottlenecks found

---

## Rollback Plan

### If Issues Arise

**Quick Rollback:**
```bash
git revert <commit-hash>
git push
```

**Safe Because:**
- [x] No database migrations required
- [x] No breaking schema changes
- [x] Feature is additive (not replacing existing code)

**Partial Rollback Options:**
1. **Disable emails only:** Comment out email calls, keep UI
2. **Disable auto-approval:** Set threshold to ₦0 (all manual)
3. **Full rollback:** Revert all 7 modified files

---

## Production Environment Variables

### Required (Add to Vercel/Hosting)

```env
# Database (Already Set)
DATABASE_URL="postgresql://..."

# Auth (Already Set)
AUTH_SECRET="..."
NEXTAUTH_URL="https://bpiagrobase.com"

# Flutterwave (Already Set)
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-..."
FLUTTERWAVE_SECRET_KEY="FLWSECK-..."

# SMTP (NEW - REQUIRED) ⚠️
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@bpiagrobase.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_SECURE="true"
SMTP_FROM_EMAIL="noreply@bpiagrobase.com"
SMTP_FROM_NAME="BeeP Agro Platform"
```

### Optional (Recommended)

```env
# Email Configuration
SMTP_REPLY_TO="support@bpiagrobase.com"

# Monitoring
SENTRY_DSN="https://..."
VERCEL_ANALYTICS="true"

# Feature Flags (Future)
ENABLE_AUTO_APPROVAL="true"
AUTO_APPROVAL_THRESHOLD="100000"
```

---

## Success Metrics

### Immediate (Day 1)
- [ ] 0 critical errors
- [ ] >90% email delivery rate
- [ ] >95% withdrawal success rate
- [ ] <5 minute average auto-approval time
- [ ] All admin users received test notification

### Short-term (Week 1)
- [ ] >95% email delivery rate
- [ ] >98% withdrawal success rate
- [ ] <2 hour average manual approval time
- [ ] 0 security incidents
- [ ] Positive admin feedback

### Long-term (Month 1)
- [ ] >99% email delivery rate
- [ ] >99% withdrawal success rate
- [ ] <1 hour average manual approval time
- [ ] <0.1% fraud/abuse rate
- [ ] User satisfaction >4.5/5

---

## Support Contacts

### Technical Issues
- **Developer:** [Your Name/Team]
- **DevOps:** [DevOps Contact]
- **Database:** [DBA Contact]

### Business Issues
- **Product Owner:** [PO Contact]
- **Finance Team:** [Finance Contact]
- **Customer Support:** support@bpiagrobase.com

### External Services
- **Flutterwave Support:** developers@flutterwavego.com
- **Email Provider:** [Your SMTP provider support]

---

## Final Sign-Off

### Development Team
- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Security verified

**Developer:** _________________ Date: _______

### QA Team
- [ ] Test scenarios executed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] User acceptance criteria met

**QA Lead:** _________________ Date: _______

### Product Owner
- [ ] Features meet requirements
- [ ] User experience approved
- [ ] Business value confirmed
- [ ] Ready for production

**Product Owner:** _________________ Date: _______

### DevOps/Infrastructure
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Rollback plan tested

**DevOps:** _________________ Date: _______

---

## Deployment Steps

### 1. Pre-Deployment (30 minutes before)
```bash
# 1. Pull latest code
git pull origin main

# 2. Run tests
npx tsx scripts/testWithdrawalNotifications.ts

# 3. Build locally
npm run build

# 4. Verify no errors
npm run lint
```

### 2. Deployment (5 minutes)
```bash
# Already on main branch, just deploy
# Vercel auto-deploys on push to main

# OR manually trigger:
vercel --prod
```

### 3. Post-Deployment (10 minutes)
```bash
# 1. Verify production build
curl https://bpiagrobase.com/health

# 2. Check admin dashboard loads
# Visit: https://bpiagrobase.com/admin

# 3. Run smoke test
# Submit test withdrawal with ₦100
```

### 4. Monitoring (First Hour)
- [ ] Watch error logs (Vercel/Sentry)
- [ ] Monitor email delivery (SMTP dashboard)
- [ ] Check Flutterwave dashboard
- [ ] Verify no user complaints

---

## Quick Reference

### Important URLs
- **Admin Dashboard:** `/admin`
- **Withdrawals Page:** `/admin/withdrawals`
- **Admin Settings:** `/admin/settings`
- **User Wallet:** `/dashboard/wallet`

### Important Commands
```bash
# Test system
npx tsx scripts/testWithdrawalNotifications.ts

# Check logs
vercel logs

# Database query pending withdrawals
npx prisma studio
# Then: Transaction → Filter: status="pending", type="WITHDRAWAL_CASH"
```

### Important Files
- `ADMIN_NOTIFICATION_SYSTEM.md` - Full documentation
- `WITHDRAWAL_AUDIT_REPORT.md` - Audit details
- `WITHDRAWAL_EXECUTIVE_SUMMARY.md` - Quick overview
- `scripts/testWithdrawalNotifications.ts` - Test script

---

**Status:** ⚠️ **2 items pending** (SMTP config + E2E test)  
**Timeline:** ~1 hour to production ready  
**Risk Level:** 🟢 LOW

---

*Update this checklist as you complete each item. Good luck with deployment! 🚀*
