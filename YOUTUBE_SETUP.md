# YouTube Subscription-to-Earn System - Setup Guide

## Overview
Complete implementation of YouTube subscription-to-earn system with draft/resume, auto-verification, and earnings distribution.

## Architecture
- **Draft System**: Payment deducted immediately, but progress saved as draft
- **Auto-save**: Form auto-saves every 1 second
- **Resume**: Users can close modal and resume later
- **Verification**: YouTube API verifies channels automatically
- **Earnings**: ₦40 to subscriber, ₦10 to referrer, auto-credited

## Database Schema
All tables created and synced:
- `YoutubePlan` - Subscription plans (4 seeded)
- `YoutubeProvider` - User's active plan and remaining slots
- `YoutubeChannel` - Channel submissions with draft/verified status
- `ChannelSubscription` - Subscriber tracking
- `UserEarning` - Earnings ledger

## Implementation Checklist

### ✅ Completed Tasks

#### 1. UI Draft/Resume System
- [x] `checkDraftStatus` query added to detect incomplete submissions
- [x] Auto-load draft data on modal open
- [x] Auto-save with 1-second debounce
- [x] Resume navigation to appropriate step
- [x] Preserve data when closing modal
- File: `components/community/SubmitChannelModal.tsx`

#### 2. YouTube API Integration
- [x] Created `lib/youtubeApi.ts` with:
  - `extractChannelId()` - Parse various URL formats
  - `getChannelDetails()` - Fetch channel info via API
  - `verifyChannelCode()` - Check verification code in description
- [x] Updated `retryVerification` endpoint to use real API
- [x] Auto-fetch channel logo and name on verification

#### 3. Background Job Scheduler
- [x] Created `server/jobs/youtubeScheduler.ts` (node-cron)
- [x] Created `app/api/cron/verify-youtube/route.ts` (Vercel cron)
- [x] Created `ecosystem.config.json` (PM2 config)
- [x] Added npm scripts: `youtube:verify` and `youtube:scheduler`
- [x] Installed node-cron package

#### 4. Admin Endpoints
- [x] `adminGetPendingChannels` - View channels awaiting approval
- [x] `adminApproveChannel` - Manually approve channel
- [x] `adminRejectChannel` - Reject and remove channel
- [x] `adminGetPendingSubscriptions` - View pending subs
- [x] `adminProcessSubscription` - Manually process payment
- [x] `adminBanUser` - Ban user from YouTube program
- [x] `adminGetStats` - Dashboard stats (channels, subs, earnings)

#### 5. Upgrade Plan Endpoint
- [x] `upgradePlan` mutation
- [x] Calculates cost difference
- [x] Deducts from wallet
- [x] Adds additional subscription slots
- [x] Creates transaction record

#### 6. Provider Stats Endpoint
- [x] `getMyProviderStats` query
- [x] Returns plan details (slots used/remaining)
- [x] Returns channel info and status
- [x] Returns total subscriptions
- [x] Returns total earnings

## Setup Instructions

### 1. Environment Variables
Add to `.env.local`:
```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Cron Security (for Vercel)
CRON_SECRET=your_random_secret_here
```

### 2. Get YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials → API Key
5. Restrict key (optional): YouTube Data API v3 only
6. Copy key to `YOUTUBE_API_KEY`

### 3. Database Migration
Already done, but if needed:
```bash
npx prisma db push
npx prisma generate
npx tsx prisma/seedYoutubePlans.ts
```

### 4. Run Background Jobs

#### Option A: Development (Node-Cron)
```bash
npm run youtube:scheduler
```
This runs every 5 minutes automatically.

#### Option B: Production (PM2)
```bash
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

#### Option C: Vercel Deployment
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/verify-youtube",
    "schedule": "*/5 * * * *"
  }]
}
```
Set `CRON_SECRET` in Vercel environment variables.

### 5. Manual Testing

#### Test Draft System:
1. Go to Community page
2. Click "Submit Channel"
3. Select a plan (need ₦5000+ in wallet)
4. Start filling form
5. Close modal mid-way
6. Reopen modal → should resume where you left off

#### Test Auto-Save:
1. Fill channel name field
2. Wait 1 second
3. Check database: `SELECT * FROM "YoutubeChannel" WHERE status = 'DRAFT';`
4. Should see saved data

#### Test Verification:
1. Complete channel submission
2. Add verification code to your YouTube channel description
3. Click "Retry Verification"
4. Should auto-verify and fetch channel logo

#### Test Earnings Distribution:
Run manually:
```bash
npm run youtube:verify
```
Or wait for cron job (5 minutes).

## API Endpoints Reference

### User Endpoints
- `youtube.getPlans` - Get available plans
- `youtube.checkDraftStatus` - Check for incomplete submissions
- `youtube.purchasePlan` - Buy plan (creates draft)
- `youtube.saveDraft` - Auto-save progress
- `youtube.submitChannel` - Final submission
- `youtube.retryVerification` - Verify channel via YouTube API
- `youtube.subscribeToChannel` - Subscribe to channel
- `youtube.getMyEarnings` - View earnings
- `youtube.upgradePlan` - Upgrade to higher tier
- `youtube.getMyProviderStats` - Dashboard stats

### Admin Endpoints
- `youtube.adminGetPendingChannels` - View pending approvals
- `youtube.adminApproveChannel` - Approve channel
- `youtube.adminRejectChannel` - Reject channel
- `youtube.adminGetPendingSubscriptions` - View pending subs
- `youtube.adminProcessSubscription` - Process payment manually
- `youtube.adminBanUser` - Ban user
- `youtube.adminGetStats` - System stats

## Flow Diagrams

### Purchase Flow
```
User selects plan
    ↓
Payment deducted (amount + VAT)
    ↓
YoutubeProvider created (balance = totalSub)
    ↓
Draft YoutubeChannel created (status: DRAFT)
    ↓
Return draftId + verificationCode
    ↓
User fills form (auto-save every 1s)
    ↓
User submits (status: SUBMITTED)
    ↓
YouTube API verification
    ↓
Status: VERIFIED, channel active
```

### Subscription Flow
```
User subscribes to channel
    ↓
ChannelSubscription created (status: pending)
    ↓
Background job runs (every 5 min)
    ↓
Check if 24 hours passed (or verify via API)
    ↓
Credit ₦40 to subscriber
    ↓
Credit ₦10 to referrer (if exists)
    ↓
Decrement channel owner's balance
    ↓
Update subscription (status: paid)
```

### Draft Resume Flow
```
User opens SubmitChannelModal
    ↓
checkDraftStatus query runs
    ↓
If hasDraft = true:
    ↓
  Load draft data into form
    ↓
  Navigate to appropriate step
    ↓
User continues from where they left off
```

## Troubleshooting

### Draft not saving?
- Check console for errors
- Verify `saveDraft` mutation is called (debounce 1s)
- Check database: `SELECT * FROM "YoutubeChannel" WHERE status = 'DRAFT';`

### Verification failing?
- Verify `YOUTUBE_API_KEY` is set
- Check YouTube API quota (10,000 units/day)
- Ensure verification code is in channel description
- Check console logs in `retryVerification` endpoint

### Earnings not credited?
- Run manual verification: `npm run youtube:verify`
- Check if 24 hours passed since subscription
- Verify background job is running: `ps aux | grep youtubeScheduler`
- Check logs in terminal where scheduler is running

### Admin endpoints not working?
- TODO: Add `isAdmin` check to endpoints
- For now, any logged-in user can access (update later)

## Next Steps

### Optional Enhancements:
1. **YouTube OAuth**: Use `checkUserSubscription()` for real-time sub verification
2. **Admin UI**: Create admin panel in `/app/admin/youtube`
3. **Email Notifications**: Notify users on verification, earnings
4. **Withdrawal System**: Allow users to withdraw earnings
5. **Analytics Dashboard**: Charts for earnings, subscriptions over time
6. **Rate Limiting**: Prevent abuse (1 channel per user, etc.)

### Security Improvements:
1. Add `isAdmin` field to User model
2. Add admin middleware to protect admin endpoints
3. Add rate limiting to API routes
4. Validate YouTube URLs more strictly
5. Add captcha to subscription endpoint

## Support
For issues, check:
- [server/trpc/router/youtube.ts](server/trpc/router/youtube.ts) - All endpoints
- [lib/youtubeApi.ts](lib/youtubeApi.ts) - YouTube integration
- [components/community/SubmitChannelModal.tsx](components/community/SubmitChannelModal.tsx) - UI
- [scripts/verifyYoutubeSubscriptions.ts](scripts/verifyYoutubeSubscriptions.ts) - Background job
