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

---

**Last Updated**: December 28, 2025  
**Status**: Planning Phase  
**Next Steps**: Continue building dashboard features, update this document as new requirements emerge
