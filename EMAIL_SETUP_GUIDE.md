# 🚀 Quick Email Setup Guide

**For:** Production Server Administrators  
**Time Required:** 5 minutes  
**Status:** Ready to Configure

---

## Step 1: Access Admin Settings

1. Log in to admin panel
2. Navigate to: **Settings** → **Integrations** tab
3. Scroll to "Email Configuration (SMTP)" section

---

## Step 2: Configure Brevo SMTP

### Get Your Brevo Credentials

1. Log in to [Brevo](https://app.brevo.com)
2. Go to **Settings** → **SMTP & API**
3. Copy your SMTP credentials:

### Enter in BPI Admin Panel

| Field | Value | Example |
|-------|-------|---------|
| **SMTP Host** | `smtp-relay.brevo.com` | smtp-relay.brevo.com |
| **SMTP Port** | `587` | 587 |
| **SMTP Username** | Your Brevo email | admin@yourdomain.com |
| **SMTP Password** | Your SMTP API Key | xsmtpsib-a1b2c3d4... |
| **From Email** | Verified sender | noreply@yourdomain.com |
| **From Name** | Your company name | BPI Team |
| **Use TLS/SSL** | ✅ Checked | On |

> **⚠️ IMPORTANT:** Use your **SMTP API Key** as password, NOT your Brevo login password!

---

## Step 3: Test Configuration

1. Scroll down to **"Test SMTP Configuration"** section
2. Enter your email address in the test field
3. Click **"Send Test Email"**
4. Check your inbox within 60 seconds
5. Look for email: **"✅ SMTP Test Email - Configuration Successful"**

### ✅ If Test Succeeds

Your email system is **fully operational**! You can now:
- Send newsletters
- Send password resets
- Send withdrawal notifications
- All system emails will work

### ❌ If Test Fails

1. Check error message in red toast notification
2. Review [Troubleshooting Guide](#troubleshooting)
3. Verify credentials in Brevo dashboard
4. Contact support if issue persists

---

## Troubleshooting

### "SMTP Connection Failed: EAUTH"
**Cause:** Invalid credentials  
**Fix:** 
- Verify you're using SMTP API key, not login password
- Generate new SMTP key in Brevo if needed
- Double-check username matches Brevo account email

### "SMTP Connection Failed: ETIMEDOUT"
**Cause:** Wrong host or port  
**Fix:**
- Use `smtp-relay.brevo.com` as host
- Use port `587` (not 465 or 25)
- Check server firewall allows outbound SMTP

### "SMTP host is not configured"
**Cause:** Missing configuration  
**Fix:**
- Fill in all SMTP fields in admin panel
- Click save button next to each field
- Refresh page and try again

### "Invalid sender email"
**Cause:** Email not verified in Brevo  
**Fix:**
- Go to Brevo → Senders & IP
- Verify your sender email address
- Complete DNS verification if required

---

## Production Checklist

Before sending to users:

- [ ] All SMTP fields configured
- [ ] Test email sent successfully
- [ ] Test email received in inbox (check spam)
- [ ] Sender email verified in Brevo
- [ ] DNS records configured (SPF, DKIM)
- [ ] Send test newsletter to yourself
- [ ] Verify unsubscribe link works
- [ ] Check Brevo sending limits

---

## Quick Reference

### Where to Find Things

| What | Where |
|------|-------|
| SMTP Settings | Admin → Settings → Integrations |
| Test Email | Admin → Settings → Integrations (bottom) |
| Newsletter | Admin → Newsletter |
| Email Logs | Admin → Logs (filter: SMTP_TEST) |
| Audit Trail | Admin → Audit (filter: email actions) |

### Brevo Resources

- Dashboard: https://app.brevo.com
- SMTP Settings: Settings → SMTP & API
- Sender Verification: Senders & IP
- Email Stats: Statistics → Email
- Support: Help → Contact Support

---

## Support

If you encounter issues:

1. **Check Audit Logs:**
   - Admin → Logs
   - Look for SMTP_TEST_FAILED entries
   - Review error messages

2. **Review Documentation:**
   - Read `EMAIL_SYSTEM_AUDIT.md` for detailed info
   - Check troubleshooting section above

3. **Test Again:**
   - Fix identified issues
   - Send another test email
   - Verify changes worked

4. **Contact Developer:**
   - Provide error message from test
   - Share screenshot of SMTP settings (hide password)
   - Include timestamp of failed test

---

**Last Updated:** February 4, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
