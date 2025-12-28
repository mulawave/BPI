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

## 🎯 Future Considerations

### Potential Additional Settings
- [ ] Gamification settings (badges, achievements, leaderboards)
- [ ] Social sharing settings
- [ ] Integration with third-party services (payment gateways, analytics)
- [ ] Advanced referral tracking (attribution models, conversion tracking)
- [ ] Automated reward distribution
- [ ] KYC/Verification requirements
- [ ] Withdrawal limits and verification
- [ ] Transaction fees configuration
- [ ] Community forum settings
- [ ] Event management system

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
