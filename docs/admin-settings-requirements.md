# Admin Panel Settings Requirements

> **Note**: This document tracks all admin control settings needed for the BPI dashboard. Update this file as new requirements are identified during development.

---

## 🎯 Dashboard Column Controls

### Left Column (User Profile & Referral)

#### User Profile Card
- **Disable User Profile Card**: `yes/no`
- **Force Profile Completion**: `yes/no`
  - When enabled, blocks dashboard access until profile is 100% complete
  - Shows overlay with profile completion form

#### Account Statistics Card
- **Disable Account Statistics Card**: `yes/no`

#### Membership Status Card
- **Disable Membership Status Card**: `yes/no`

#### Referral Tools Card (Auto Inviter)
- **Auto Inviter Cost Per Email**: `currently 0.5 BPT`
  - Configurable float value
  - Deducted from user's BPT wallet per sent invite
- **Auto Inviter Daily Limit**: `currently 10`
  - Configurable integer
  - Resets daily at midnight
- **Disable Referral Tools Card**: `yes/no`

#### Share Link Card
- **Disable Share Link Card**: `yes/no`

#### Recent Referrals Card
- **Number of Referrals to Display**: `default 5`
  - Configurable integer (1-20 recommended)
- **Disable Recent Referrals Card**: `yes/no`

#### Community Blog Card
- **Number of Blog Posts to Display**: `default 2`
  - Configurable integer (1-10 recommended)
- **Disable Community Blog Card**: `yes/no`

---

### Center Column
- **Disable Center Column**: `yes/no`
  - Hides entire center dashboard content
  - Used for maintenance or restricted access scenarios

---

## 🔐 Security & Verification

### Email Verification
- **Force Email Verification Modal**: `yes/no`
  - When enabled, shows verification modal on login if email not verified
  - Blocks certain features until verified

### Profile Completion
- **Profile Completion Threshold**: `0-100%`
  - Minimum profile completion percentage required
  - Default: 100% (all fields required)
  - Configurable to allow partial completion (e.g., 80%)

### Two-Factor Authentication
- **Enable 2FA Requirement**: `yes/no`
  - Force users to set up 2FA
  - Block dashboard access until enabled

---

## 📢 Announcement System

### Announcement Banner
- **Enable Announcement**: `yes/no`
- **Announcement Message**: `rich text/HTML`
- **Announcement Type**: `info/warning/success/error`
- **Auto-Dismiss After X Days**: `integer`
  - 0 = requires manual dismiss
  - 1-30 = auto-dismiss after X days
- **Show Close Button**: `yes/no`

---

## 💰 Wallet & Financial Settings

### Wallet Display
- **Default Wallet View**: `expanded/collapsed`
  - Controls whether "View More Wallets" section is open by default
- **Show/Hide Specific Wallets**: `array of wallet types`
  - Palliative, Shelter, Community, BPT Token, etc.
  - Allows selective hiding of wallet types

### BPT Settings
- **Minimum BPT Balance Warning**: `float`
  - Shows warning when user's BPT falls below threshold
  - Default: 0.5 BPT
- **Enable BPT Withdrawal**: `yes/no`
- **BPT Withdrawal Fee**: `percentage or fixed amount`

---

## 🛠️ Service Controls

### YouTube Channel Features
- **Enable YouTube Channel Submission**: `yes/no`
- **Enable YouTube Channel Exploration**: `yes/no`

### BPI Services
- **Enable BPI Calculator**: `yes/no`
- **Enable Leadership Pool**: `yes/no`
- **Enable EPC & EPP**: `yes/no`
- **Enable Solar Assessment**: `yes/no`
- **Enable Digital Farm**: `yes/no`
- **Enable Training Center**: `yes/no`

### Membership Features
- **Enable Membership Purchase**: `yes/no`
- **Enable Package Upgrades**: `yes/no`
- **Enable Package Renewals**: `yes/no`

---

## 📧 Email & Communication

### Invite System
- **Daily Invite Email Limit (Global)**: `integer`
  - System-wide limit per user
  - Default: 10
- **Cost Per Invite Email**: `float (BPT)`
  - Default: 0.5 BPT
- **Enable Auto-Inviter**: `yes/no`
  - Master switch for entire auto-invite feature
- **Email Template Customization**: `HTML/rich text`
  - Custom invite email template
  - Variables: {userName}, {referralLink}, {senderName}

### Notification Settings
- **Enable Email Notifications**: `yes/no`
- **Enable Push Notifications**: `yes/no`
- **Enable SMS Notifications**: `yes/no`

---

## 🎨 UI Customization

### Display Settings
- **Recent Referrals Display Count**: `integer (1-20)`
  - Default: 5
- **Blog Posts Display Count**: `integer (1-10)`
  - Default: 2
- **Transaction History Display Count**: `integer`
  - Default: 5

### Theme Settings
- **Enable Dark Mode Toggle**: `yes/no`
- **Force Dark Mode**: `yes/no`
- **Force Light Mode**: `yes/no`
- **Custom Brand Colors**: `hex codes`
  - Primary color
  - Secondary color
  - Accent color

### Navigation
- **Show Navigation Sidebar**: `yes/no`
- **Enable Intel (Admin) Section**: `yes/no`
  - Shows admin access button for authorized users

---

## 🎁 Promotional & Marketing

### Promotional Materials
- **Enable Promotional Downloads**: `yes/no`
- **Available Marketing Materials**: `array of file types`
  - Banners, flyers, social media templates

### Leadership Pool Challenge
- **Enable Leadership Pool**: `yes/no`
- **Challenge Start Date**: `datetime`
- **Challenge End Date**: `datetime`
- **Minimum Qualifications**: `object`
  - Referral count, team size, etc.

---

## 🔧 System Maintenance

### Maintenance Mode
- **Enable Maintenance Mode**: `yes/no`
- **Maintenance Message**: `rich text`
- **Allow Admin Access During Maintenance**: `yes/no`
- **Estimated Completion Time**: `datetime`

### Feature Flags
- **Enable Beta Features**: `yes/no`
- **Beta Features List**: `array`
  - List of experimental features to show/hide

---

## 📊 Analytics & Reporting

### Dashboard Analytics
- **Track User Activity**: `yes/no`
- **Track Referral Clicks**: `yes/no`
- **Track Wallet Transactions**: `yes/no`

### Reporting
- **Enable Admin Reports**: `yes/no`
- **Report Types**: `array`
  - Daily activity, referral performance, financial summary

---

## 🚀 Performance & Optimization

### Caching
- **Enable Dashboard Caching**: `yes/no`
- **Cache Duration**: `integer (seconds)`
- **Cache Refresh Interval**: `integer (seconds)`

### Rate Limiting
- **API Rate Limit**: `requests per minute`
- **Email Rate Limit**: `emails per hour`
- **Login Attempt Limit**: `attempts per hour`

---

## 📝 Content Management

### Blog System
- **Enable Blog**: `yes/no`
- **Blog Posts Display Count**: `integer`
- **Allow User Comments**: `yes/no`
- **Require Comment Moderation**: `yes/no`

### Support System
- **Enable Support Tickets**: `yes/no`
- **Enable Live Chat**: `yes/no`
- **Support Hours**: `time range`

---

## 🔒 Access Control

### Role-Based Access
- **Admin Roles**: `array`
  - Super Admin, Content Manager, Support Staff, etc.
- **Member Tiers**: `array`
  - Free, Basic, Premium, VIP
- **Permission Matrix**: `object`
  - Define what each role can access

### Dashboard Restrictions
- **Minimum Membership Level for Dashboard**: `tier level`
- **Require Active Membership**: `yes/no`
- **Require Email Verification**: `yes/no`

---

## 📱 Mobile & Responsive

### Mobile Settings
- **Enable Mobile App**: `yes/no`
- **Mobile Layout Optimizations**: `yes/no`
- **Show/Hide Features on Mobile**: `array`

---

## 🌍 Localization

### Multi-Language Support
- **Enable Multi-Language**: `yes/no`
- **Available Languages**: `array`
  - English, Spanish, French, etc.
- **Default Language**: `language code`
- **Allow User Language Selection**: `yes/no`

### Currency Settings
- **Default Currency**: `NGN/USD/EUR`
- **Enable Multi-Currency**: `yes/no`
- **Exchange Rate Source**: `API endpoint`

---

## 📅 Timeline & Scheduling

### Content Scheduling
- **Enable Scheduled Announcements**: `yes/no`
- **Enable Scheduled Maintenance**: `yes/no`
- **Enable Auto-Publish Blog Posts**: `yes/no`

---

## 💳 Wallet Management & Financial Controls

### Wallet Visibility Controls
- **Global Wallet Visibility Toggle**: `yes/no`
  - Master switch to show/hide all wallet balances across platform
  - Affects all users when disabled
- **Per-User Wallet Visibility Override**: `user-specific toggle`
  - Admin can force show/hide balances for specific users
  - Overrides user's personal show/hide preference
- **Wallet Type Visibility**: `array of wallet types`
  - BPI Token Wallet
  - Main Wallet
  - Locked Capital Wallet
  - Rewards Wallet (Total, Referral, Package, Leadership)
  - Operational Wallets (Spendable, Palliative, Cashback, Shelter)
  - Investment Wallets (Agro, Business, Tech, Property)
  - Community Wallets (Community Support, Education Fund, Withdrawal)
  - Each can be individually shown/hidden per user or globally

### Wallet Transaction Controls

#### Debit Operations
- **Manual Wallet Debit**: `admin action`
  - Wallet selector (dropdown of all wallet types)
  - User selector (search/select user)
  - Amount: `float`
  - Reason/Description: `required text field`
  - Transaction reference: `auto-generated UUID`
  - Confirmation required: `yes (two-step verification)`
  - Audit log: `automatic recording of admin, timestamp, IP`
  - Email notification to user: `yes/no toggle`
  - SMS notification to user: `yes/no toggle`
  
#### Credit Operations
- **Manual Wallet Credit**: `admin action`
  - Wallet selector (dropdown of all wallet types)
  - User selector (search/select user)
  - Amount: `float`
  - Source/Description: `required text field`
  - Transaction reference: `auto-generated UUID`
  - Confirmation required: `yes (two-step verification)`
  - Audit log: `automatic recording of admin, timestamp, IP`
  - Email notification to user: `yes/no toggle`
  - SMS notification to user: `yes/no toggle`

#### Bulk Operations
- **Bulk Credit**: `admin action`
  - Upload CSV: `user_id, wallet_type, amount, description`
  - Preview before execution
  - Confirmation required: `yes`
  - Progress tracking: `real-time status`
  - Error handling: `skip failed, log errors, continue`
  - Final report: `success count, failure count, error log`
  
- **Bulk Debit**: `admin action`
  - Upload CSV: `user_id, wallet_type, amount, description`
  - Preview before execution
  - Confirmation required: `yes`
  - Progress tracking: `real-time status`
  - Error handling: `skip failed, log errors, continue`
  - Final report: `success count, failure count, error log`

### Wallet Suspension & Reactivation

#### Suspension Controls
- **Suspend Wallet**: `admin action`
  - User selector
  - Wallet type selector (specific wallet or all wallets)
  - Suspension reason: `required dropdown + text`
    - Suspicious activity
    - Fraud investigation
    - User request
    - Legal requirement
    - Payment dispute
    - Account verification pending
    - Other (specify)
  - Suspension duration: `permanent/temporary`
  - Auto-reactivation date: `datetime (if temporary)`
  - Block withdrawals only: `yes/no`
  - Block deposits: `yes/no`
  - Block transfers: `yes/no`
  - Email notification: `yes/no`
  - SMS notification: `yes/no`
  
- **Bulk Wallet Suspension**: `admin action`
  - Upload CSV or select multiple users
  - Apply same suspension rules to all
  - Confirmation required

#### Reactivation Controls
- **Reactivate Wallet**: `admin action`
  - User selector
  - Wallet type selector (specific wallet or all wallets)
  - Reactivation reason: `required text field`
  - Restore full access: `yes/no`
  - Conditional reactivation: `set limits/restrictions`
  - Email notification: `yes/no`
  - SMS notification: `yes/no`
  - Audit log: `automatic`
  
- **Auto-Reactivation Queue**: `admin view`
  - List of wallets scheduled for auto-reactivation
  - Ability to cancel auto-reactivation
  - Ability to manually reactivate early

### Wallet Transaction Approvals

#### Pending Transactions
- **Withdrawal Approval Queue**: `admin dashboard section`
  - List all pending withdrawal requests
  - Filter by: wallet type, amount range, user, date
  - Sort by: amount, date, user, status
  - Batch actions: approve selected, reject selected
  
- **Approve Withdrawal**: `admin action`
  - Transaction details view
  - User verification check
  - Fraud check status
  - Approve button
  - Approval reason: `optional text`
  - Processing method: `automatic/manual`
  - Email notification: `automatic`
  
- **Reject Withdrawal**: `admin action`
  - Transaction details view
  - Rejection reason: `required dropdown + text`
    - Insufficient verification
    - Suspicious activity
    - Incorrect details
    - Policy violation
    - System error
    - Other (specify)
  - Refund to wallet: `automatic`
  - Email notification with reason: `automatic`
  - User notification: `in-app + email`

#### Transfer Approvals
- **Enable Transfer Approval Requirement**: `yes/no`
  - Require admin approval for transfers above threshold
  - Threshold amount: `configurable float`
  - Specific wallet types requiring approval: `array`
  
- **Approve Transfer**: `same controls as withdrawal approval`
- **Reject Transfer**: `same controls as withdrawal rejection`

### Wallet Limits & Restrictions

#### Transaction Limits
- **Minimum Withdrawal Amount**: `per wallet type`
  - BPI Token: `float`
  - Main Wallet: `float`
  - Rewards: `float`
  - etc.
  
- **Maximum Withdrawal Amount**: `per wallet type`
  - Daily limit: `float`
  - Weekly limit: `float`
  - Monthly limit: `float`
  - Per-transaction limit: `float`
  
- **Maximum Deposit Amount**: `per wallet type`
  - Daily limit: `float`
  - Weekly limit: `float`
  - Monthly limit: `float`
  - Per-transaction limit: `float`
  
- **Transfer Limits**: `per wallet type`
  - Daily transfer limit: `float`
  - Weekly transfer limit: `float`
  - Monthly transfer limit: `float`
  - Per-transaction limit: `float`

#### User-Specific Limits
- **Custom User Limits**: `admin action`
  - Override global limits for specific users
  - VIP/special treatment options
  - Restricted user lower limits
  - Temporary limit adjustments

### Wallet Freeze & Lock

#### Freeze Operations
- **Freeze Wallet Balance**: `admin action`
  - Locks specific amount in wallet
  - User can't withdraw frozen amount
  - Visible as "frozen" in user's dashboard
  - Freeze reason: `required text`
  - Auto-unfreeze date: `optional datetime`
  - Partial freeze: `specific amount` or Full freeze: `entire balance`
  
- **Unfreeze Wallet Balance**: `admin action`
  - Select frozen wallet
  - Unfreeze reason: `required text`
  - Email notification: `yes/no`

#### Emergency Lock
- **Emergency Account Lock**: `admin action`
  - Immediately locks all wallets for user
  - Blocks all transactions (deposits, withdrawals, transfers)
  - Reason: `required - security/fraud/investigation`
  - Notification: `email + SMS immediate`
  - Requires super admin to unlock

### Wallet Adjustments & Corrections

#### Balance Adjustments
- **Adjust Wallet Balance**: `admin action`
  - Used for corrections, refunds, compensations
  - Adjustment type: `credit/debit`
  - Amount: `float`
  - Adjustment reason: `required dropdown`
    - System error correction
    - Refund
    - Compensation
    - Promotional credit
    - Manual correction
    - Migration adjustment
    - Other (specify)
  - Affects portfolio total: `yes/no`
  - Transaction history visibility: `show to user/hide from user`
  - Audit trail: `automatic and immutable`

#### Reverse Transaction
- **Reverse Transaction**: `admin action`
  - Search transaction by ID/reference
  - View full transaction details
  - Reversal reason: `required text`
  - Reversal method: `automatic/manual`
  - Creates reverse transaction record
  - Updates both sender and receiver balances
  - Email notifications: `automatic to all parties`
  - Cannot be reversed again: `one-time action`

### Wallet Health Monitoring

#### Health Checks
- **Low Balance Alerts**: `automatic system`
  - BPI Token below threshold: `configurable float`
  - Main Wallet below threshold: `configurable float`
  - Alert admin: `yes/no`
  - Alert user: `yes/no`
  - Alert frequency: `once/daily/weekly`
  
- **Negative Balance Detection**: `automatic monitoring`
  - Alert on negative balances (should never happen)
  - Auto-freeze wallet if negative
  - Immediate admin notification
  - Investigation required flag

- **Suspicious Activity Monitoring**: `automatic AI/rule-based`
  - Unusual withdrawal patterns
  - Rapid balance changes
  - Large transactions
  - Multiple failed transactions
  - Auto-flag for admin review
  - Auto-suspend option: `yes/no`

### Wallet Reporting & Analytics

#### Admin Reports
- **Wallet Overview Report**: `admin dashboard`
  - Total value across all wallets
  - Total users with wallets
  - Average wallet balance per type
  - Wallet distribution charts
  
- **Transaction Volume Report**: `admin dashboard`
  - Daily/weekly/monthly transaction counts
  - Transaction value totals
  - Transaction types breakdown
  - Peak transaction times
  
- **Suspended Wallets Report**: `admin dashboard`
  - Count of suspended wallets
  - Suspension reasons breakdown
  - Average suspension duration
  - Pending reactivations
  
- **Pending Approvals Report**: `admin dashboard`
  - Count of pending withdrawals
  - Total value of pending transactions
  - Oldest pending transaction
  - Average approval time

#### Export Capabilities
- **Export Wallet Data**: `admin action`
  - Export format: `CSV/Excel/JSON/PDF`
  - Date range selector
  - Wallet type filter
  - User filter
  - Include/exclude: `suspended/active/all`
  - Transaction history: `yes/no`
  - Compliance report format: `yes/no`

### Wallet Configuration

#### Wallet Type Management
- **Enable/Disable Wallet Types**: `admin setting`
  - Toggle individual wallet types on/off globally
  - Hide from new users but keep for existing
  - Deprecate wallet type (migrate to new)
  
- **Wallet Type Properties**: `admin configuration`
  - Display name: `text`
  - Display order: `integer`
  - Icon/color: `selection`
  - Description: `text`
  - Currency: `NGN/BPT/USD`
  - Allow deposits: `yes/no`
  - Allow withdrawals: `yes/no`
  - Allow transfers: `yes/no`
  - Require approval for transactions: `yes/no`

#### Exchange Rates
- **BPT to NGN Exchange Rate**: `admin configurable`
  - Current rate: `float (default 2.5)`
  - Rate history tracking
  - Auto-update from external API: `yes/no`
  - Manual override: `yes/no`
  - Rate change notification to users: `yes/no`
  
- **Multi-Currency Support**: `future feature`
  - NGN/USD/EUR exchange rates
  - Real-time rate updates
  - Historical rate tracking

### Wallet Migration & Maintenance

#### Data Migration
- **Migrate Wallet Balances**: `admin action`
  - Source wallet type
  - Destination wallet type
  - Apply to: `all users/selected users`
  - Transfer percentage: `0-100%`
  - Preview before execution
  - Confirmation required
  - Rollback capability: `yes/no`
  
- **Merge Wallet Types**: `admin action`
  - Combine two wallet types into one
  - Reassign all balances
  - Update transaction history
  - Archive old wallet type

#### Maintenance Mode
- **Wallet Maintenance Mode**: `admin toggle`
  - Temporarily disable all wallet transactions
  - Show maintenance message to users
  - Admin override: `allow admin transactions`
  - Scheduled maintenance: `start/end datetime`
  - Auto-enable after maintenance: `yes/no`

### Fraud Prevention & Security

#### Security Rules
- **Enable Fraud Detection**: `yes/no`
  - AI-based transaction monitoring
  - Rule-based alert system
  - Auto-flag suspicious transactions
  - Auto-suspend on fraud detection: `yes/no`
  
- **Transaction Velocity Limits**: `admin configurable`
  - Max transactions per hour: `integer`
  - Max transactions per day: `integer`
  - Cooldown period between large transactions: `minutes`
  - Different limits for verified/unverified users
  
- **Withdrawal Verification Requirements**: `admin configurable`
  - Email verification: `yes/no`
  - SMS verification: `yes/no`
  - 2FA required: `yes/no`
  - Admin approval required: `yes/no`
  - Withdrawal address whitelist: `yes/no`

#### IP & Device Tracking
- **Track Transaction IPs**: `yes/no`
  - Log IP address for all transactions
  - Flag transactions from new IPs
  - Flag transactions from blacklisted countries
  - Auto-block suspicious IPs: `yes/no`
  
- **Device Fingerprinting**: `yes/no`
  - Track devices used for transactions
  - Alert on new device transactions
  - Require verification for new devices

### Compliance & Audit

#### Audit Trails
- **Transaction Audit Log**: `automatic & immutable`
  - All wallet transactions logged
  - Admin actions logged (who, what, when, why)
  - IP addresses logged
  - Cannot be deleted or modified
  - Exportable for compliance
  
- **Wallet Status Change Log**: `automatic`
  - All suspension/reactivation events
  - Freeze/unfreeze events
  - Limit changes
  - Configuration changes
  
- **Admin Action Log**: `automatic`
  - Every manual credit/debit
  - Every approval/rejection
  - Every configuration change
  - Timestamped with admin user ID

#### Compliance Reports
- **Generate Compliance Report**: `admin action`
  - Date range selector
  - Report type: `AML/KYC/Tax/Audit`
  - Include transaction details: `yes/no`
  - Include user details: `yes/no (anonymize option)`
  - Export format: `PDF/CSV/Excel`
  - Encrypted export: `yes/no`

---

## 👥 User Management & Account Controls

### User Account Actions

#### Account Status
- **Suspend User Account**: `admin action`
  - Suspends entire account (not just wallets)
  - Blocks login access
  - Suspension reason: `required dropdown + text`
    - Policy violation
    - Fraud/suspicious activity
    - User request
    - Payment issues
    - Under investigation
    - Legal requirement
    - Other (specify)
  - Suspension duration: `permanent/temporary`
  - Auto-reactivation date: `datetime`
  - Email notification: `yes/no`
  - SMS notification: `yes/no`
  
- **Reactivate User Account**: `admin action`
  - Reactivation reason: `required text`
  - Restore full access: `yes/no`
  - Require password reset: `yes/no`
  - Require re-verification: `yes/no`
  - Email notification: `automatic`

#### Account Deletion
- **Delete User Account**: `admin action (super admin only)`
  - Soft delete (archive): `default`
  - Hard delete (permanent): `requires confirmation + reason`
  - Wallet balance handling:
    - Must be zero before deletion
    - Or transfer to admin wallet
    - Or refund to user external account
  - Data retention policy: `30/60/90 days`
  - GDPR compliance: `right to be forgotten`
  - Cannot be undone warning

#### Account Verification
- **Manually Verify User**: `admin action`
  - Email verification: `mark as verified`
  - Phone verification: `mark as verified`
  - Identity verification: `KYC approval`
  - Document upload verification
  - Override automatic verification
  
- **Revoke Verification**: `admin action`
  - Reason required
  - Limits access to certain features
  - Notification to user

### User Profile Management

#### Profile Editing
- **Edit User Profile**: `admin action`
  - Full access to all user fields
  - Name, email, phone, address, etc.
  - Profile completion percentage: `manual override`
  - Profile image: `upload/remove`
  - Audit trail of changes
  
- **Force Profile Completion**: `admin toggle per user`
  - Override global setting for specific user
  - Block dashboard access until complete
  - Set required fields per user

#### Membership Management
- **Grant Membership Package**: `admin action`
  - Package type: `dropdown`
  - Package value: `float`
  - Activation date: `datetime`
  - Expiration date: `datetime`
  - Auto-renew: `yes/no`
  - Reason/note: `text field`
  - Email notification: `yes/no`
  
- **Revoke Membership Package**: `admin action`
  - Revocation reason: `required`
  - Refund amount: `float`
  - Refund to wallet: `select wallet type`
  - Email notification: `yes/no`
  
- **Extend Membership**: `admin action`
  - Extension period: `days/months`
  - Reason: `text field`
  - Email notification: `yes/no`

### Referral Management

#### Referral Controls
- **View User Referral Tree**: `admin view`
  - Visual tree display
  - Level 1, Level 2, Level 3+ referrals
  - Referral status (active/inactive)
  - Total team size
  - Export tree: `CSV/PDF`
  
- **Manually Add Referral**: `admin action`
  - Select parent user
  - Select referred user
  - Referral level: `1/2/3+`
  - Backdate referral: `datetime`
  - Reason: `text field`
  
- **Remove Referral Link**: `admin action`
  - Select referral relationship
  - Removal reason: `required`
  - Adjust commissions: `yes/no`
  - Email notification: `yes/no`
  
- **Adjust Referral Commissions**: `admin action`
  - User selector
  - Commission type: `Level 1/Level 2/Level 3+`
  - New commission percentage: `float`
  - Apply retroactively: `yes/no`
  - Reason: `text field`

### User Permissions & Roles

#### Role Assignment
- **Assign User Role**: `admin action`
  - Role selector: `Member/VIP/Admin/Support Staff/Super Admin`
  - Effective date: `datetime`
  - Expiration date: `optional datetime`
  - Reason: `text field`
  - Email notification: `yes/no`
  
- **Revoke User Role**: `admin action`
  - Reason: `required`
  - Demote to: `role selector`
  - Email notification: `yes/no`

#### Custom Permissions
- **Set Custom User Permissions**: `admin action`
  - Override default role permissions
  - Enable/disable specific features
  - Set custom limits (withdrawals, referrals, etc.)
  - Temporary permissions: `start/end datetime`

### User Search & Filtering

#### Advanced Search
- **Search Users**: `admin tool`
  - Search by: name, email, phone, user ID, referral code
  - Filter by: role, status, membership type, verification status
  - Sort by: registration date, last login, wallet balance, referral count
  - Bulk actions on search results
  
- **User Segments**: `admin tool`
  - Create custom user segments
  - Save filter combinations
  - Export segment to CSV
  - Bulk actions on segment

### Bulk User Operations

#### Bulk Actions
- **Bulk User Update**: `admin action`
  - Upload CSV or select from list
  - Update fields: role, status, limits, etc.
  - Preview before execution
  - Progress tracking
  - Error log
  
- **Bulk Notification**: `admin action`
  - Select users by segment/filter
  - Notification type: `email/SMS/in-app`
  - Message template: `rich text`
  - Schedule send: `immediate/scheduled`
  - Track delivery status

---

## 📦 Package & Membership Controls

### Package Management

#### Package Configuration
- **Create New Package**: `admin action`
  - Package name: `text`
  - Package value: `float`
  - ROI percentage: `float`
  - Duration: `days/months`
  - Min investment: `float`
  - Max investment: `float`
  - Availability: `limited/unlimited`
  - Auto-renewal: `enabled/disabled`
  - Description: `rich text`
  
- **Edit Package**: `admin action`
  - All configuration fields editable
  - Apply to existing packages: `yes/no`
  - Version tracking: `automatic`
  
- **Disable/Archive Package**: `admin action`
  - Hide from new purchases
  - Maintain for existing holders
  - Reason: `text field`

#### Package Purchases
- **Approve Package Purchase**: `admin action`
  - If manual approval required
  - View purchase details
  - Verify payment
  - Approve/reject
  - Reason for rejection
  
- **Manually Assign Package**: `admin action`
  - User selector
  - Package selector
  - Purchase amount: `float`
  - Activation date: `datetime`
  - Maturity date: `auto-calculated or manual`
  - Reason/note: `text field`
  - Email notification: `yes/no`

#### Package Monitoring
- **View Active Packages**: `admin dashboard`
  - Total active packages
  - Total locked capital
  - Average package value
  - Maturity schedule (upcoming maturities)
  - Filter by: user, package type, status, date range
  
- **Mature Package Manually**: `admin action`
  - For early maturity or corrections
  - Package selector
  - Reason: `required text`
  - Release funds to: `wallet selector`
  - Include rewards: `yes/no`
  - Email notification: `yes/no`
  
- **Cancel Package**: `admin action`
  - Reason: `required dropdown`
  - Refund amount: `full/partial/none`
  - Refund to wallet: `select wallet`
  - Email notification: `automatic`

---

## 🌟 Community Features Administration

### Community Updates Management

#### Update Creation & Publishing
- **Create Community Update**: `admin action`
  - Title: `required, max 200 chars`
  - Content: `rich text editor`
  - Category: `dropdown (announcement, promotion, news, event, policy, success)`
  - Priority: `dropdown (HIGH, MEDIUM, LOW)`
  - Image upload: `optional, max 5MB`
  - CTA button text: `optional`
  - CTA button link: `optional URL`
  - Publish immediately: `yes/no`
  - Schedule publish date: `datetime picker`
  - Expiration date: `optional datetime picker`
  - Targeting options:
    * Target specific packages: `multi-select checkboxes`
    * Target specific ranks: `multi-select checkboxes`
    * Target specific regions: `multi-select checkboxes`
  - Email notification: `yes/no`
  - SMS notification: `yes/no` (for HIGH priority only)

- **Edit Existing Update**: `admin action`
  - All fields editable except creation timestamp
  - Version history tracking
  - Option to resend notifications

- **Delete Update**: `admin action`
  - Soft delete (archive)
  - Confirmation required
  - View count preserved in analytics

- **Pin Update**: `admin action`
  - Pin to top of feed
  - Maximum 3 pinned updates at a time
  - Auto-unpin after expiration

#### Update Analytics
- **View Update Statistics**: `read-only dashboard`
  - Total views
  - Unique viewers
  - CTA click-through rate
  - Average read time
  - Completion rate
  - Engagement by user segment (package, rank, region)
  - Export to CSV/Excel

- **Track User Engagement**: `analytics view`
  - Who read each update
  - Who clicked CTA
  - Time to read
  - Device/platform used

#### Bulk Operations
- **Bulk Delete Updates**: `admin action`
  - Filter by date range
  - Filter by category
  - Filter by priority
  - Preview before delete

- **Bulk Update Category/Priority**: `admin action`
  - Select multiple updates
  - Change category or priority
  - Audit trail maintained

---

### BPI Calculator Administration

#### Calculator Configuration
- **Commission Rates**: `editable percentages`
  - Direct referral rate: `default 10%`
  - Generation 2 rate: `default 5%`
  - Generation 3 rate: `default 3%`
  - Generation 4 rate: `default 2%`

- **Maturity Settings**: `editable values`
  - Maturity rate multiplier: `default 1.5 (150%)`
  - Maturity period (months): `default 12`
  - Enable compound interest: `yes/no`

- **Display Settings**: `toggles`
  - Show ROI calculation: `yes/no`
  - Show break-even analysis: `yes/no`
  - Show comparison charts: `yes/no`
  - Disclaimer text: `editable text area`

#### Calculator Analytics
- **View Calculator Usage**: `analytics dashboard`
  - Total calculations performed
  - Average investment amount calculated
  - Most common time periods
  - Conversion rate (calculations → package purchases)
  - Export user calculations: `CSV/Excel`

- **Calculation History Per User**: `searchable list`
  - User ID/name
  - Calculation date
  - Input parameters
  - Results calculated
  - Whether user upgraded after calculation

#### Calculator Restrictions
- **Daily Usage Limit Per User**: `integer, default unlimited`
- **Minimum Investment Amount**: `currency value`
- **Maximum Investment Amount**: `currency value`
- **Disable Calculator Globally**: `yes/no`

---

### Best Deals Management

#### Deal Creation
- **Create New Deal**: `admin action`
  - Title: `required`
  - Description: `rich text`
  - Deal type: `dropdown (package_discount, referral_bonus, bundle, loyalty, seasonal)`
  - Discount type: `percentage/fixed_amount`
  - Discount value: `number`
  - Original price: `currency`
  - Discounted price: `auto-calculated or manual override`
  - Start date: `datetime picker`
  - End date: `datetime picker`
  - Image upload: `optional`
  - Featured deal: `yes/no` (highlighted in UI)
  
  **Usage Limits**:
  - Total usage limit: `integer or unlimited`
  - Usage per user: `integer, default 1`
  
  **Eligibility Rules**:
  - Eligible packages: `multi-select`
  - Eligible ranks: `multi-select`
  - Minimum purchase amount: `currency`
  - New users only: `yes/no`
  - Existing users only: `yes/no`
  
  **Actions**:
  - Save as draft: `yes/no`
  - Publish immediately: `yes/no`
  - Send notification: `yes/no`

- **Edit Deal**: `admin action`
  - All fields editable
  - Cannot change if users have already claimed
  - Can extend end date

- **Clone Deal**: `admin action`
  - Duplicate existing deal
  - Edit before publishing

- **Delete/Archive Deal**: `admin action`
  - Soft delete
  - Claims preserved for audit

#### Deal Management
- **Pause Deal**: `admin action`
  - Temporarily disable without deleting
  - Resume later

- **Extend Deal Duration**: `admin action`
  - Change end date
  - Notify users who showed interest

- **Adjust Usage Limits**: `admin action`
  - Increase/decrease total limit
  - Increase per-user limit

#### Deal Analytics
- **Deal Performance Dashboard**: `analytics view`
  - Total claims
  - Unique users claimed
  - Revenue generated
  - Discount amount given
  - Conversion rate
  - Claims over time (chart)
  - Claims by user segment
  - Export to CSV/Excel

- **User Claims List**: `searchable table`
  - User details
  - Claim date
  - Discount amount
  - Deal used: `yes/no`
  - Revenue generated from claim

#### Deal Approvals (Optional)
- **Require Manual Approval**: `toggle per deal`
  - Admin reviews each claim
  - Approve/reject with reason
  - Bulk approve option
  - Notification to user on decision

---

### Promotional Materials Management

#### Material Upload
- **Upload Material**: `admin action`
  - Title: `required`
  - Description: `optional`
  - Type: `dropdown (IMAGE, VIDEO, PDF, LINK, TEMPLATE)`
  - Category: `dropdown (social, presentation, flyer, email, whatsapp)`
  - File upload: `drag-and-drop or browse`
    * Max file size: `configurable, default 50MB`
    * Allowed formats: `configurable list`
  - Thumbnail upload: `optional, auto-generate for images/videos`
  
  **Access Control**:
  - Minimum package level: `dropdown or "All"`
  - Minimum rank: `dropdown or "All"`
  - Target audience: `JSON rules (advanced)`
  
  **Settings**:
  - Active: `yes/no`
  - Featured: `yes/no`
  - Allow download: `yes/no`
  - Watermark with user info: `yes/no`
  - Track shares: `yes/no`

- **Bulk Upload Materials**: `admin action`
  - ZIP file upload
  - Batch metadata assignment
  - Progress indicator

- **Edit Material**: `admin action`
  - Update metadata
  - Replace file
  - Change access control

- **Delete Material**: `admin action`
  - Soft delete (archive)
  - Download history preserved

#### Material Organization
- **Create/Edit Categories**: `admin action`
  - Add new category
  - Rename category
  - Merge categories
  - Delete category (reassign materials first)

- **Create Tags**: `admin action`
  - Tag materials for better filtering
  - Bulk tag assignment

#### Material Analytics
- **Material Performance Dashboard**: `analytics view`
  - Total downloads
  - Unique downloaders
  - Share count
  - Most popular materials
  - Downloads over time
  - Downloads by user segment
  - Conversion tracking (shares → new sign-ups)
  - Export analytics: `CSV/Excel`

- **User Download History**: `searchable list`
  - User details
  - Material downloaded
  - Download date
  - Share count by user

#### Material Versioning
- **Upload New Version**: `admin action`
  - Keep old versions accessible
  - Version history
  - Notify users who downloaded previous version

---

### Leadership Pool Administration

#### Qualification Settings
- **Option 1 Criteria**: `editable`
  - Required package: `dropdown (currently Regular Plus)`
  - Total Regular Plus sponsors required: `integer, default 70`

- **Option 2 Criteria**: `editable`
  - Required package: `dropdown (currently Regular Plus)`
  - First generation required: `integer, default 50`
  - Second generation required: `integer, default 50`

- **Qualification Frequency**: `dropdown`
  - Real-time (on every referral)
  - Daily (midnight check)
  - Weekly (Sunday midnight)
  - Manual only

- **Auto-Activation**: `yes/no`
  - Automatically grant access when qualified
  - Send notification email/SMS

#### Manual Overrides
- **Manually Qualify User**: `admin action`
  - Override automatic qualification
  - Reason: `required text field`
  - Expiration date: `optional`
  - Audit trail maintained

- **Disqualify User**: `admin action`
  - Remove qualification
  - Reason: `required`
  - Block from re-qualifying: `yes/no`
  - Send notification: `yes/no`

#### Tier Management
- **Create/Edit Tiers**: `admin action`
  - Tier name: `Bronze, Silver, Gold, Platinum, Diamond`
  - Qualification requirements: `custom rules`
  - Pool share percentage: `editable %`
  - Benefits: `text list`
  - Badge icon: `image upload`

- **Assign Tier to User**: `admin action`
  - Override automatic tier assignment
  - Set expiration

#### Pool Distribution Settings
- **Pool Funding Source**: `dropdown`
  - Percentage of package sales: `editable %`
  - Fixed monthly amount: `currency`
  - Custom formula: `advanced`

- **Distribution Frequency**: `dropdown`
  - Monthly
  - Quarterly
  - Annually

- **Distribution Method**: `dropdown`
  - Equal split among qualified users
  - Weighted by tier
  - Performance-based
  - Custom formula

#### Leadership Pool Analytics
- **Qualification Dashboard**: `analytics view`
  - Total qualified users
  - Qualified per tier
  - Qualification trend (chart)
  - Average time to qualify
  - Option 1 vs Option 2 success rate
  - Pool fund balance
  - Distribution history
  - Export: `CSV/Excel`

- **User Progress Tracking**: `searchable table`
  - User details
  - Current progress (%)
  - Option 1 progress: `X of 70`
  - Option 2 progress: `First gen: X/50, Second gen: Y/50`
  - Qualification status
  - Estimated qualification date
  - Last updated

#### Notifications & Communication
- **Milestone Notifications**: `toggles`
  - 25% progress: `email/SMS/in-app`
  - 50% progress: `email/SMS/in-app`
  - 75% progress: `email/SMS/in-app`
  - 90% progress (close to qualifying): `email/SMS/in-app`
  - Qualified: `email/SMS/in-app`

- **Custom Message Templates**: `text editors`
  - Milestone messages
  - Qualification message
  - Disqualification message
  - Pool distribution notification

---

### EPC & EPP (Global Promotion) Administration

#### Rank Configuration
- **Create/Edit Ranks**: `admin action`
  - Rank name: `Starter, Bronze, Silver, Gold, Platinum, Diamond`
  - Rank level: `integer (1-10)`
  - Points required: `integer`
  - Rank badge icon: `image upload`
  - Rank color: `color picker`
  - Benefits description: `rich text`

- **Point Values Configuration**: `editable table`
  - Package purchase (self): `points per currency amount`
  - Package purchase (team): `points per currency amount`
  - Referral (direct): `points per referral`
  - Referral (indirect): `points per generation`
  - Training course completed: `points per course`
  - Community engagement (post, comment): `points per action`
  - Custom point events: `add/edit/delete`

#### Point Management
- **Manual Point Adjustment**: `admin action`
  - User search
  - Add/subtract points
  - Reason: `required`
  - Category: `dropdown`
  - Audit trail

- **Bulk Point Award**: `admin action`
  - Filter users by rank/package/region
  - Points to award: `integer`
  - Reason: `required`
  - Send notification: `yes/no`

- **Point Expiration**: `settings`
  - Enable point expiration: `yes/no`
  - Expiration period: `months`
  - Expiration warning: `days before`

#### Ranking & Leaderboards
- **Leaderboard Settings**: `configuration`
  - Global leaderboard: `enable/disable`
  - Regional leaderboards: `enable/disable`
  - Ranking period: `monthly/quarterly/annual/all-time`
  - Display top: `integer, default 100`
  - Anonymize bottom performers: `yes/no`
  - Reset rankings: `manual button with confirmation`

- **Regional Configuration**: `admin action`
  - Define regions: `add/edit/delete`
  - Assign users to regions: `auto by country or manual`

#### Promotion Management
- **Auto-Promotion**: `toggle`
  - Automatically promote when points reached
  - Send congratulations: `yes/no`
  - Reward on promotion: `currency/BPT amount`

- **Manual Promotion**: `admin action`
  - Promote user to specific rank
  - Reason: `required`
  - Skip point requirement: `yes/no`

- **Demote User**: `admin action`
  - Reduce rank
  - Reason: `required`
  - Audit trail

#### Achievements & Badges
- **Create Achievement**: `admin action`
  - Achievement name: `required`
  - Description: `rich text`
  - Icon: `image upload`
  - Unlock criteria: `JSON rules or wizard`
  - Points awarded: `integer`
  - One-time or repeatable: `dropdown`

- **Award Achievement**: `admin action`
  - User search
  - Select achievement
  - Reason: `optional`

#### EPC/EPP Analytics
- **Ranking Analytics Dashboard**: `analytics view`
  - Distribution by rank (chart)
  - Average points per user
  - Points earned over time (chart)
  - Promotion velocity (time to rank up)
  - Most active point earners
  - Leaderboard history
  - Export: `CSV/Excel`

- **Point Activity Log**: `searchable table`
  - User
  - Points change
  - Category
  - Reason
  - Date
  - Admin who made change (if manual)

---

### Training Center Administration

#### Course Management
- **Create Course**: `admin action`
  - Title: `required`
  - Description: `rich text`
  - Category: `dropdown (basics, referral, finance, leadership, solar, agriculture, marketing)`
  - Difficulty: `dropdown (beginner, intermediate, advanced)`
  - Estimated hours: `decimal`
  - Thumbnail: `image upload`
  - Is mandatory: `yes/no`
  - Display order: `integer`
  
  **Access Control**:
  - Minimum package level: `dropdown or "All"`
  - Minimum rank: `dropdown or "All"`
  - Prerequisite courses: `multi-select`
  
  **Settings**:
  - Active: `yes/no`
  - Featured: `yes/no`
  - Allow skip lessons: `yes/no`
  - Require quiz completion: `yes/no`
  - Passing quiz score: `percentage`

- **Edit Course**: `admin action`
  - Update all course fields
  - Reorder lessons
  - Version control

- **Delete Course**: `admin action`
  - Soft delete
  - Enrollments preserved
  - Can restore

#### Lesson Management
- **Create Lesson**: `admin action within course`
  - Title: `required`
  - Content: `rich text editor`
  - Video URL: `optional (YouTube, Vimeo, or upload)`
  - Document upload: `optional PDF/DOCX`
  - Estimated minutes: `integer`
  - Lesson order: `integer (auto or manual)`
  
  **Quiz Questions** (optional):
  - Add multiple choice questions
  - Add true/false questions
  - Add fill-in-the-blank
  - Set correct answers
  - Explanation for each answer

- **Edit Lesson**: `admin action`
  - Update content
  - Reorder within course
  - Edit quiz questions

- **Bulk Lesson Import**: `admin action`
  - CSV/Excel upload with lesson data
  - YouTube playlist import
  - Clone from another course

#### Certificate Management
- **Certificate Template**: `design tool`
  - Upload template image
  - Define text positions (name, date, course)
  - Font selection
  - Color scheme
  - Digital signature: `image upload`

- **Manual Certificate Issue**: `admin action`
  - Override completion requirement
  - Issue to specific user
  - Custom certificate text

- **Revoke Certificate**: `admin action`
  - Remove certificate from user
  - Reason: `required`
  - Notify user: `yes/no`

#### Enrollment Management
- **Bulk Enrollment**: `admin action`
  - Enroll users by package/rank/region
  - Enroll from CSV upload
  - Set deadline for completion
  - Send enrollment notification

- **Force Complete Course**: `admin action`
  - Mark course as completed for user
  - Issue certificate
  - Reason: `required`

- **Reset Progress**: `admin action`
  - Reset user's course progress
  - Reason: `required`

#### Training Analytics
- **Course Analytics Dashboard**: `analytics view`
  - Total enrollments per course
  - Completion rate
  - Average completion time
  - Drop-off points (which lessons)
  - Quiz performance (average scores)
  - Most popular courses
  - Certificates issued
  - Export: `CSV/Excel`

- **User Progress Tracking**: `searchable table`
  - User details
  - Enrolled courses
  - Progress percentage
  - Completed lessons
  - Quiz scores
  - Last accessed date
  - Certificate status

#### Training Notifications
- **Course Reminders**: `settings`
  - Inactive for X days: `email reminder`
  - Mandatory course deadline: `email/SMS`
  - New course available: `email notification`
  - Course updated: `email notification`

---

### Digital Farm Administration

#### Farm Configuration
- **Crop Types**: `admin management`
  - Add new crop: `crop name, maturity days, investment required, expected yield %`
  - Edit crop: `all fields editable`
  - Delete crop: `soft delete, active crops continue`
  - Seasonal crops: `available only certain months`
  - Rare/limited crops: `unlock criteria`

- **Farm Levels**: `level configuration`
  - Level 1-10 settings:
    * Farm size (square meters)
    * Max concurrent crops
    * Crop slots
    * Unlock requirement (investment or achievements)
    * Upgrade cost

- **Investment Settings**: `global config`
  - Minimum investment per crop: `currency`
  - Maximum investment per crop: `currency`
  - Minimum yield percentage: `%`
  - Maximum yield percentage: `%`
  - Random yield variation: `yes/no, ± %`

#### Game Mechanics
- **Weather Events**: `admin controlled`
  - Create event: `drought, rain, sunshine, storm`
  - Event duration: `hours/days`
  - Effect: `increase/decrease yield, speed/delay maturity`
  - Affected regions: `global or specific`
  - Notify users: `yes/no`

- **Seasonal Bonuses**: `configuration`
  - Define seasons (months)
  - Bonus yield during season: `%`
  - Bonus crops available: `list`

- **Achievements & Milestones**: `admin creation`
  - First harvest
  - 10 harvests
  - 100 harvests
  - Specific crop harvested X times
  - Highest single yield
  - Consecutive harvests
  - Reward: `points, badges, unlock special crops`

#### Manual Operations
- **Force Harvest**: `admin action`
  - Select user's farm
  - Select crop to harvest
  - Reason: `required`
  - Override yield: `optional`

- **Grant Crop**: `admin action`
  - Gift crop to user
  - Instant maturity or normal growth: `dropdown`
  - Reason: `optional`

- **Reset Farm**: `admin action`
  - Reset user's farm to level 1
  - Refund investments: `yes/no`
  - Reason: `required`

#### Farm Analytics
- **Farm Performance Dashboard**: `analytics view`
  - Total active farms
  - Total investments
  - Total harvests
  - Average farm level
  - Most popular crops
  - Total earnings distributed
  - Farms by region/package
  - Export: `CSV/Excel`

- **User Farm Activity**: `searchable table`
  - User details
  - Farm level
  - Active crops
  - Next harvest time
  - Total invested
  - Total harvested
  - Last activity

#### Farm Suspension
- **Suspend Farm**: `admin action`
  - Pause all crop growth
  - Reason: `required`
  - Duration: `days or indefinite`
  - Notify user: `yes/no`

- **Unsuspend Farm**: `admin action`
  - Resume crop growth
  - Compensate lost time: `yes/no`

---

### Solar Assessment Administration

#### Assessment Configuration
- **Assessment Form Fields**: `customizable`
  - Add/remove fields
  - Make fields required/optional
  - Field types: `text, number, dropdown, file upload`
  - Field order: `drag-and-drop`

- **Assessment Questions**: `question bank`
  - Property type options: `residential, commercial, industrial`
  - Roof type options: `flat, sloped, metal, tile`
  - Budget ranges: `predefined or custom`
  - Custom questions: `add/edit/delete`

#### Consultant Management
- **Add Consultant**: `admin action`
  - Name: `required`
  - Email: `required`
  - Phone: `required`
  - Specialization: `tags`
  - Region coverage: `multi-select`
  - Max concurrent assessments: `integer`
  - Active: `yes/no`

- **Edit Consultant**: `admin action`
  - Update details
  - Reassign assessments
  - Set vacation mode: `dates`

- **Remove Consultant**: `admin action`
  - Reassign pending assessments
  - Soft delete

#### Assessment Workflow
- **Assessment Statuses**: `status flow config`
  - pending → under_review → assigned → scheduled → completed → quote_sent
  - Custom statuses: `add/edit`
  - Email templates per status: `customizable`

- **Auto-Assignment**: `settings`
  - Enable auto-assign: `yes/no`
  - Assignment criteria: `round-robin, workload, region, specialization`

- **Manual Assignment**: `admin action`
  - View pending assessments
  - Assign to consultant
  - Set priority: `high/medium/low`

#### Assessment Processing
- **View Assessment Details**: `admin view`
  - All user-submitted data
  - Uploaded documents/photos
  - Assessment history
  - Consultant notes
  - System recommendations

- **Edit Assessment**: `admin action`
  - Update any field
  - Add consultant notes
  - Attach files
  - Change status

- **Complete Assessment**: `admin action`
  - Enter results:
    * Estimated system size (kW)
    * Estimated annual savings
    * Recommended system type
    * Quoted amount
  - Generate PDF report
  - Send to user: `email`

- **Reject/Cancel Assessment**: `admin action`
  - Reason: `required`
  - Notify user: `yes/no`
  - Refund fee (if applicable)

#### Consultation Scheduling
- **Schedule Consultation**: `calendar interface`
  - Select date/time
  - Assign consultant
  - Set meeting type: `in-person, video call, phone`
  - Send calendar invite: `yes/no`
  - Reminder notifications: `24hr before, 1hr before`

- **Reschedule Consultation**: `admin action`
  - Change date/time
  - Notify all parties

- **Cancel Consultation**: `admin action`
  - Reason: `required`
  - Reschedule option: `yes/no`

#### Assessment Analytics
- **Assessment Dashboard**: `analytics view`
  - Total assessments
  - By status (pending, completed, etc.)
  - Average completion time
  - Consultant performance (assignments, completion rate)
  - Conversion rate (assessments → sales)
  - Revenue generated
  - Average system size recommended
  - Average quoted amount
  - Export: `CSV/Excel`

- **Regional Analytics**: `map view`
  - Assessments by region
  - Heat map of demand
  - Regional consultants

#### Quotes & Follow-up
- **Quote Templates**: `template editor`
  - Default quote template
  - Custom templates by system type
  - Variables: `user name, system details, pricing`

- **Quote Approval Workflow**: `optional`
  - Require admin approval before sending
  - Approval queue
  - Bulk approve

- **Follow-up Reminders**: `automation`
  - Days after quote sent: `email reminder`
  - Escalation: `notify sales team after X days`

---

### Global Community Feature Settings

#### Feature Toggle
- **Enable/Disable Features Globally**: `master switches`
  - BPI Calculator: `on/off`
  - Leadership Pool: `on/off`
  - EPC & EPP: `on/off`
  - Digital Farm: `on/off`
  - Solar Assessment: `on/off`
  - Training Center: `on/off`
  - Promotional Materials: `on/off`
  - Community Updates: `on/off`
  - Best Deals: `on/off`

#### Visibility Controls
- **Hide Feature by Package**: `per-feature setting`
  - Select packages that CAN see feature
  - All others are hidden

- **Hide Feature by Rank**: `per-feature setting`
  - Minimum rank required to see feature

- **Hide Feature by Region**: `per-feature setting`
  - Enable only in specific countries/regions

#### Maintenance Mode
- **Feature-Specific Maintenance**: `per-feature toggle`
  - Enable maintenance mode
  - Custom maintenance message
  - Estimated availability time
  - Exempt admin users: `yes/no`

#### Notification Settings
- **Global Notification Preferences**: `settings`
  - Email notifications: `on/off`
  - SMS notifications: `on/off`
  - In-app notifications: `on/off`
  - Push notifications (future): `on/off`

- **Notification Throttling**: `rate limits`
  - Max emails per user per day: `integer`
  - Max SMS per user per day: `integer`
  - Quiet hours: `time range`

#### Data Retention
- **Cleanup Settings**: `configuration`
  - Delete expired updates after: `days`
  - Archive old calculations after: `days`
  - Delete unclaimed deals after: `days`
  - Keep analytics data for: `months/years`

#### Rate Limiting
- **API Rate Limits (per feature)**: `configuration`
  - Calculations per hour: `integer`
  - Material downloads per hour: `integer`
  - Assessment submissions per day: `integer`

#### Audit & Compliance
- **Audit Logging**: `always enabled`
  - Log all admin actions
  - Log all user actions (configurable)
  - Retention period: `years`
  - Export audit logs: `date range, CSV/PDF`

- **GDPR Compliance**: `tools`
  - Export user data: `JSON/PDF`
  - Delete user data: `with confirmation`
  - Anonymize user data: `for analytics`

---

## 🎯 Future Considerations

### Potential Additional Settings
- [ ] Gamification settings (badges, achievements, leaderboards)
- [ ] Social sharing settings
- [ ] Integration with third-party services (payment gateways, analytics)
- [ ] Advanced referral tracking (attribution models, conversion tracking)
- [ ] Automated reward distribution
- [ ] KYC/Verification requirements (expanded)
- [ ] Withdrawal limits and verification (expanded)
- [ ] Transaction fees configuration (expanded)
- [ ] Community forum settings
- [ ] Event management system
- [ ] Multi-signature wallet approvals
- [ ] Smart contract integration
- [ ] Blockchain transaction tracking
- [ ] Cryptocurrency wallet integration
- [ ] Advanced fraud detection AI/ML
- [ ] Risk scoring for users
- [ ] Automated compliance checks
- [ ] Tax reporting automation
- [ ] Multi-tenant admin structure
- [x] Community Features (Community Updates, Calculator, Deals, Materials, Leadership Pool, EPC/EPP, Training, Digital Farm, Solar Assessment) ✅ Added

---

## 📌 Implementation Notes

### Database Schema
Will require a `DashboardSettings` or `SystemSettings` table with:
- Key-value pairs for flexibility
- JSON columns for complex settings
- Version tracking for settings changes
- Audit log for who changed what and when

### Admin Panel Location
Options:
1. Dedicated `/admin/dashboard-settings` page
2. Modal/drawer from Intel section
3. Both (overview in modal, detailed page for full settings)

### tRPC Endpoints Required
- `admin.getSettings` - Fetch all settings
- `admin.updateSettings` - Update settings (admin only)
- `admin.resetSettings` - Reset to defaults
- `admin.getSettingsHistory` - View change history
- `admin.community.*` - All community feature admin endpoints

### Admin Routers for Community Features
```typescript
// admin.community.ts - Updates management
// admin.calculator.ts - Calculator configuration
// admin.deals.ts - Deals creation & management
// admin.materials.ts - Material uploads & organization
// admin.leadershipPool.ts - Qualification & tier management
// admin.epcEpp.ts - Ranks, points, achievements
// admin.training.ts - Courses, lessons, certificates
// admin.digitalFarm.ts - Crops, farm config, events
// admin.solarAssessment.ts - Consultant management, assessment workflow
```

---

**Last Updated**: December 29, 2025  
**Status**: Planning Phase - Community Features Admin Controls Added  
**Next Steps**: 
1. Continue building frontend UI for community features
2. Implement user-facing features completely
3. Build comprehensive admin panel at the end using this specification
4. QA testing → Beta testing → Production deployment
