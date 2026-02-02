# Newsletter System Implementation

## Overview
Complete email campaign system with user targeting, split-screen editor, live preview, and analytics.

## Features

### 1. User Targeting & Filtering
- **All Users**: Send to everyone in the database
- **Activated Users Only**: Filter by activation status
- **Non-Activated Users**: Target unactivated accounts
- **By Membership Package**: Filter by specific membership plan

### 2. Split-Screen Editor
- **Left Panel (Composer)**:
  - Recipient filter with visual selection
  - Email configuration (from, reply-to, subject)
  - Rich text message body
  - Image embedding with drag-drop
  - File attachments (PDF, JPG, JPEG, PNG)
  - Send rate limiting configuration

- **Right Panel (Live Preview)**:
  - Real-time email preview
  - Responsive view toggle (Desktop, Tablet, Mobile)
  - Professional email template with:
    - BPI branding and logo
    - Auto-greeting: "Hello [FirstName],"
    - Company footer with dynamic contact info
    - Social media links
    - Unsubscribe disclaimer

### 3. Email Template
- Responsive HTML email template
- Company branding from admin settings
- Dynamic footer matching dashboard footer
- Professional gradients and styling
- Mobile-optimized layout

### 4. Rate-Limited Sending
- Configurable batch size (emails per batch)
- Configurable interval (minutes between batches)
- Recommended: 50 emails every 10 minutes to avoid SMTP throttling
- Progress tracking during send

### 5. Analytics & Reporting
- Recipient count display
- Real-time progress bar during sending
- Success/failure statistics
- Completion summary with breakdown:
  - Total recipients
  - Successfully sent
  - Failed sends

### 6. Audit Logging
- All newsletter sends logged to audit table
- Tracks: userId, action (NEWSLETTER_SEND), targetUserId, subject
- Full audit trail for compliance

## Technical Implementation

### Files Created/Modified

1. **app/admin/newsletter/page.tsx** (NEW)
   - Complete newsletter UI with split-screen layout
   - State management for compose → sending → complete flow
   - File upload handlers for attachments and images
   - Live preview component with responsive modes

2. **server/trpc/router/admin.ts** (MODIFIED)
   - Added `getNewsletterRecipientCount` query
   - Added `sendNewsletter` mutation with batch processing
   - Added `buildNewsletterEmail` helper function
   - Integrated company settings into email template

3. **components/admin/AdminSidebar.tsx** (MODIFIED)
   - Added "Newsletter" menu item with Mail icon
   - Positioned between "Community" and "Blog & News"

4. **app/admin/settings/page.tsx** (MODIFIED - Previous Work)
   - Added Company Information section with 8 fields
   - Fields: address, phone, email, 5 social media URLs

5. **components/Footer.tsx** (MODIFIED - Previous Work)
   - Updated to fetch company info from settings
   - Dynamic social links and contact information

### tRPC Routes

#### `admin.getNewsletterRecipientCount`
**Input:**
```typescript
{
  filter: 'all' | 'activated' | 'non-activated' | 'membership',
  membershipPackage?: string
}
```
**Output:**
```typescript
{ count: number }
```

#### `admin.sendNewsletter`
**Input:**
```typescript
{
  filter: 'all' | 'activated' | 'non-activated' | 'membership',
  membershipPackage?: string,
  fromEmail?: string,
  replyToEmail?: string,
  subject: string,
  body: string,
  attachments?: Array<{ filename: string, content: string }>,
  embeddedImages?: Array<{ id: string, content: string, position: number }>,
  sendRate: { emails: number, interval: number }
}
```
**Output:**
```typescript
{ sent: number, failed: number, total: number }
```

### Database Schema
No new tables required. Uses existing:
- `User` - recipient selection
- `AdminSettings` - company info for footer
- `AuditLog` - tracks all newsletter sends

## Usage Guide

### Step 1: Configure Company Information
1. Navigate to Admin → Settings
2. Scroll to "Company Information" section
3. Fill in: address, phone, email, social media URLs
4. Save each field (these appear in email footer)

### Step 2: Compose Newsletter
1. Navigate to Admin → Newsletter
2. Select recipient filter:
   - All Users
   - Activated Only
   - Non-Activated
   - By Membership (select package)
3. Check recipient count in stats card
4. Configure email settings:
   - From Email (defaults to company_email)
   - Reply-To Email (defaults to support_email)
   - Subject (required)
5. Write message body (greeting auto-added)
6. (Optional) Embed images with "Embed Image" button
7. (Optional) Add attachments via drag-drop
8. Configure send rate (default: 50 emails/10 min)

### Step 3: Review Live Preview
1. Check preview on right panel
2. Toggle between Desktop/Tablet/Mobile views
3. Verify company footer displays correctly
4. Check social links work properly

### Step 4: Send Campaign
1. Click "Send Newsletter to X Recipients"
2. Watch progress bar during sending
3. View completion summary:
   - Successfully sent count
   - Failed count
   - Success rate percentage

## Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Responsive CSS for mobile/tablet/desktop */
  </style>
</head>
<body>
  <!-- Header: BPI Logo + Tagline -->
  <div class="header">
    <img src="logo.png" />
    <div>Powering Palliative Through Technology</div>
  </div>

  <!-- Content: Subject + Greeting + Body -->
  <div class="content">
    <h2>[Subject]</h2>
    <p>Hello [FirstName],</p>
    <div>[Body with embedded images]</div>
  </div>

  <!-- Footer: Company Info + Social Links + Disclaimer -->
  <div class="footer">
    <div>[Logo + Company Name]</div>
    <p>[Address]</p>
    <p>[Phone]</p>
    <p>[Email]</p>
    <div>[Social Media Links]</div>
    <div>[Unsubscribe + Copyright]</div>
  </div>
</body>
</html>
```

## Best Practices

### Avoiding SMTP Throttling
- Use default 50 emails/10 minutes
- Monitor your SMTP provider's limits
- Adjust batch size/interval if failures occur

### Content Guidelines
- Keep subject line under 50 characters
- Use clear, concise body copy
- Include call-to-action
- Test email on mobile preview before sending

### Image Optimization
- Compress images before embedding
- Use JPG for photos, PNG for graphics
- Keep total email size under 1MB

### Compliance
- Include unsubscribe link (auto-added to footer)
- Only send to users who signed up
- Review audit logs regularly

## Security Features

1. **Admin-Only Access**: `adminProcedure` middleware
2. **Audit Logging**: All sends tracked with userId, timestamp
3. **Rate Limiting**: Prevents SMTP abuse
4. **Input Validation**: Zod schemas on all inputs
5. **Email Sanitization**: HTML encoding for user input

## Performance Optimizations

1. **Batch Processing**: Sends in configurable batches
2. **Async Operations**: Non-blocking email sends
3. **Database Queries**: Efficient user filtering with indexes
4. **Settings Cache**: `refetchOnWindowFocus: false` on settings

## Troubleshooting

### No Recipients Selected
- Check filter configuration
- Verify users exist with selected criteria
- Review membership package selection

### Emails Failing
- Check SMTP credentials in .env
- Verify `sendEmail` function in lib/email.ts
- Review send rate limits
- Check SMTP provider dashboard for blocks

### Preview Not Updating
- Check browser console for errors
- Verify company settings are saved
- Clear browser cache and refresh

### Images Not Displaying
- Ensure images are JPG/PNG format
- Check image file size (under 500KB recommended)
- Verify base64 encoding is correct

## Future Enhancements

- [ ] Email templates library (pre-designed layouts)
- [ ] A/B testing support
- [ ] Scheduled sends (date/time picker)
- [ ] Email click tracking
- [ ] Bounce rate monitoring
- [ ] Segmentation tags for users
- [ ] Draft saving functionality
- [ ] Email history view with resend option
- [ ] CSV export of recipient list
- [ ] Personalization variables ({{username}}, {{membershipLevel}})

## Conclusion

The newsletter system provides a professional, scalable solution for email campaigns with:
- ✅ Sophisticated UI matching NotificationsModal quality standards
- ✅ Full user targeting and filtering
- ✅ Real-time preview with responsive modes
- ✅ Rate-limited batch sending
- ✅ Comprehensive analytics and reporting
- ✅ Audit logging for compliance
- ✅ Dynamic company branding from admin settings

All code follows BPI monorepo patterns with tRPC, Prisma, and Next.js App Router.
