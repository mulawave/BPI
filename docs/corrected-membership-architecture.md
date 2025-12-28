# BPI Membership System - Complete Corrected Architecture

## Executive Summary
This document outlines the complete architecture for BPI's 7-package membership system with tokenomics, empowerment mechanics, and deflationary BPI Token (BPT) model.

---

## 1. Package Structure Overview

### 1.1 Standard Membership Packages (6)

| Package | Base Fee | VAT (7.5%) | Total | Cycle |
|---------|----------|------------|-------|-------|
| **Regular** | ₦10,000 | ₦750 | ₦10,750 | 365 days |
| **Regular Plus** | ₦50,000 | ₦3,750 | ₦53,750 | 365 days |
| **Gold Plus** | ₦221,000 | ₦16,575 | ₦237,575 | 365 days |
| **Platinum Plus** | ₦321,000 | ₦24,075 | ₦345,075 | 365 days |
| **Travel & Tour Agent** | ₦330,000 | ₦24,750 | ₦354,750 | 365 days |
| **Basic Early Retirement** | ₦267,000 | ₦20,025 | ₦287,025 | 365 days |

### 1.2 Empowerment Package (1)

| Package | Base Fee | VAT | Total | Maturity Period |
|---------|----------|-----|-------|-----------------|
| **Child Educational/Vocational Support** | ₦330,000 | ₦24,750 | ₦354,750 | 24 months |

**Key Differences:**
- Dual account structure (Sponsor + Beneficiary sub-account)
- 24-month maturity vs 365-day renewal
- Empowerment payouts (not referral rewards)
- 7.5% tax on fund availability (not upfront VAT)
- Fallback protection mechanism
- Community support waiver mechanics

---

## 2. Database Schema Architecture

### 2.1 Updated User Model

```prisma
model User {
  id                 String               @id @default(cuid())
  email              String?              @unique
  username           String?              @unique
  passwordHash       String?
  
  // Profile
  name               String?
  firstname          String?
  lastname           String?
  mobile             String?
  profilePic         String?
  
  // KYC & Verification
  verified           Boolean              @default(false)
  kyc                String?
  kycPending         Int                  @default(0)
  
  // Account Type & Status
  userType           String               @default("user")
  rank               String               @default("Newbie")
  activated          Boolean              @default(false)
  role               String               @default("user")
  
  // Referral Structure
  referralLink       String?
  referredBy         String?
  sponsorId          String?
  level1Count        Int                  @default(0)
  level2Count        Int                  @default(0)
  level3Count        Int                  @default(0)
  level4Count        Int                  @default(0)
  
  // Membership & Packages
  activeMembershipPackageId String?
  membershipActivatedAt     DateTime?
  membershipExpiresAt       DateTime?
  renewalCount              Int          @default(0)
  
  // === WALLET SYSTEM ===
  
  // Core Wallets
  wallet             Float                @default(0)      // Main cash wallet
  spendable          Float                @default(0)      // Withdrawable balance
  bpiTokenWallet     Float                @default(0)      // BPT tokens (member visible 50%)
  
  // Reward Wallets
  palliative         Float                @default(0)      // Palliative rewards
  cashback           Float                @default(0)      // Cashback (Gold/Platinum/Travel)
  
  // Welfare Wallets (Renewal rewards)
  shelter            Float                @default(0)      // Shelter wallet
  health             Float                @default(0)      // Health wallet
  meal               Float                @default(0)      // Meal wallet
  security           Float                @default(0)      // Security wallet (NEW)
  
  // Special Purpose Wallets
  community          Float                @default(0)      // Community support
  shareholder        Float                @default(0)      // Shareholder rewards
  education          Float                @default(0)      // Education support
  studentCashback    Float                @default(0)      // Student cashback
  
  // Asset Wallets
  car                Float                @default(0)      // Car fund
  business           Float                @default(0)      // Business fund
  land               Float                @default(0)      // Land fund
  solar              Float?                               // Solar fund
  legals             Float?                               // Legal fund
  
  // Shelter-Specific
  shelterWallet      Int                  @default(0)      // Legacy shelter wallet
  isShelter          Int                  @default(0)
  shelterPending     Int                  @default(0)
  
  // VIP & Special Status
  isVip              Int                  @default(0)
  vipPending         Int                  @default(0)
  isShareholder      Int                  @default(0)
  
  // Restrictions
  withdrawBan        Int                  @default(0)
  pendingActivation  Int?
  
  // Metadata
  defaultCurrency    Int                  @default(1)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  lastLogin          DateTime             @default(now())
  
  // Relationships
  sponsor                User?                @relation("Sponsorship", fields: [sponsorId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  sponsored              User[]               @relation("Sponsorship")
  
  empowermentPackages    EmpowermentPackage[] @relation("SponsorToEmpowerment")
  beneficiaryOf          EmpowermentPackage[] @relation("BeneficiaryToEmpowerment")
  
  accounts               Account[]
  packageActivations     PackageActivation[]
  renewalHistory         RenewalHistory[]
  shelterRewards         ShelterReward[]
  tokenTransactions      TokenTransaction[]
  
  // ... other existing relations
}
```

### 2.2 MembershipPackage Model (Enhanced)

```prisma
model MembershipPackage {
  id            String   @id @default(cuid())
  name          String   @unique
  packageType   String   // "STANDARD" | "EMPOWERMENT"
  
  // Pricing
  price         Float
  vat           Float
  
  // Referral Rewards (L1-L4)
  cash_l1       Float
  cash_l2       Float
  cash_l3       Float
  cash_l4       Float
  
  palliative_l1 Float
  palliative_l2 Float
  palliative_l3 Float
  palliative_l4 Float
  
  bpt_l1        Float    // BPT in Naira value (before 50/50 split)
  bpt_l2        Float
  bpt_l3        Float
  bpt_l4        Float
  
  // Cashback (Gold+, Platinum+, Travel)
  cashback_l1   Float?
  cashback_l2   Float?
  cashback_l3   Float?
  cashback_l4   Float?
  
  // Shelter Rewards (10 levels for Gold/Platinum)
  shelter_l1    Float?
  shelter_l2    Float?
  shelter_l3    Float?
  shelter_l4    Float?
  shelter_l5    Float?
  shelter_l6    Float?
  shelter_l7    Float?
  shelter_l8    Float?
  shelter_l9    Float?
  shelter_l10   Float?
  
  // Renewal Settings
  hasRenewal          Boolean  @default(true)
  renewalFee          Float?
  renewalCycle        Int      @default(365)  // days
  
  // Renewal Rewards
  renewal_cash_l1     Float?
  renewal_cash_l2     Float?
  renewal_cash_l3     Float?
  renewal_cash_l4     Float?
  
  renewal_palliative_l1 Float?
  renewal_palliative_l2 Float?
  renewal_palliative_l3 Float?
  renewal_palliative_l4 Float?
  
  renewal_bpt_l1      Float?
  renewal_bpt_l2      Float?
  renewal_bpt_l3      Float?
  renewal_bpt_l4      Float?
  
  renewal_cashback_l1 Float?
  renewal_cashback_l2 Float?
  renewal_cashback_l3 Float?
  renewal_cashback_l4 Float?
  
  // Renewal Welfare Wallets
  renewal_shelter_l1  Float?
  renewal_shelter_l2  Float?
  renewal_shelter_l3  Float?
  renewal_shelter_l4  Float?
  
  renewal_health_l1   Float?
  renewal_health_l2   Float?
  renewal_health_l3   Float?
  renewal_health_l4   Float?
  
  renewal_meal_l1     Float?
  renewal_meal_l2     Float?
  renewal_meal_l3     Float?
  renewal_meal_l4     Float?
  
  renewal_security_l1 Float?
  renewal_security_l2 Float?
  renewal_security_l3 Float?
  renewal_security_l4 Float?
  
  // Features
  features        String[]  // JSON array of feature descriptions
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  activations     PackageActivation[]
}
```

### 2.3 EmpowermentPackage Model (Enhanced)

```prisma
model EmpowermentPackage {
  id                      String    @id @default(cuid())
  sponsorId               String
  beneficiaryId           String    // Sub-account (child/skill trainee)
  
  // Package Details
  packageFee              Float     @default(330000)
  vat                     Float     @default(24750)
  
  // Status & Lifecycle
  status                  String    @default("Active - Countdown Running")
  // Statuses: 
  // - "Active - Countdown Running"
  // - "Pending Maturity (24 Months)"
  // - "Approved - Activation Pending"
  // - "Empowerment Released (Tax Applied)"
  // - "Fallback Protection Activated"
  // - "Converted to Regular Plus"
  // - "Community Support Rule Waived"
  // - "Default Community Rule Active"
  
  activatedAt             DateTime  @default(now())
  maturityDate            DateTime  // activatedAt + 24 months
  approvedAt              DateTime?
  releasedAt              DateTime?
  
  // Empowerment Values (After 24 months)
  grossEmpowermentValue   Float     @default(7250000)  // ₦7.25M
  netEmpowermentValue     Float     @default(6706250)  // After 7.5% tax
  grossSponsorReward      Float     @default(1000000)  // ₦1M
  netSponsorReward        Float     @default(925000)   // After 7.5% tax
  
  // Fallback Protection
  fallbackEnabled         Boolean   @default(false)
  fallbackGrossAmount     Float     @default(396000)   // ₦330k + 20%
  fallbackNetAmount       Float     @default(366300)   // After 7.5% tax
  
  // Conversion Option
  isConverted             Boolean   @default(false)
  convertedAt             DateTime?
  conversionAmount        Float?    // ₦64,000 for Regular Plus + MYNGUL
  walletCreditAmount      Float?    // ₦332,000 restricted to community
  
  // Community Support Waiver
  communityContribution   Float     @default(0)
  communityWaiverThreshold Float    @default(332000)
  communityWaiverActive   Boolean   @default(false)
  communityWaiverStartedAt DateTime?
  communityWaiverEndsAt   DateTime? // 72 hours from start
  
  // Admin Controls
  adminApproved           Boolean   @default(false)
  approvedBy              String?
  rejectionReason         String?
  
  // Beneficiary Restrictions
  beneficiaryCanView      Boolean   @default(true)
  beneficiaryCanWithdraw  Boolean   @default(false)
  usageRestrictions       String[]  // ["EDUCATION_ONLY", "SKILL_ONLY", etc.]
  
  // Tax Records
  taxRate                 Float     @default(7.5)
  totalTaxDeducted        Float     @default(0)
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  
  sponsor                 User      @relation("SponsorToEmpowerment", fields: [sponsorId], references: [id])
  beneficiary             User      @relation("BeneficiaryToEmpowerment", fields: [beneficiaryId], references: [id])
  
  transactions            EmpowermentTransaction[]
}
```

### 2.4 New Models Required

```prisma
model RenewalHistory {
  id                String   @id @default(cuid())
  userId            String
  packageId         String
  packageName       String
  
  renewalNumber     Int      // 1st, 2nd, 3rd renewal
  renewalFee        Float
  vat               Float
  totalPaid         Float
  
  renewedAt         DateTime @default(now())
  expiresAt         DateTime
  
  // Rewards Distributed
  cashDistributed       Float @default(0)
  bptDistributed        Float @default(0)
  palliativeDistributed Float @default(0)
  cashbackDistributed   Float @default(0)
  shelterDistributed    Float @default(0)
  healthDistributed     Float @default(0)
  mealDistributed       Float @default(0)
  securityDistributed   Float @default(0)
  
  user              User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

model ShelterReward {
  id              String   @id @default(cuid())
  userId          String
  level           Int      // 1-10
  amount          Float
  packageType     String   // "GOLD_PLUS" | "PLATINUM_PLUS"
  sourceActivationId String // PackageActivation ID that triggered it
  
  createdAt       DateTime @default(now())
  
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

model TokenTransaction {
  id                String   @id @default(cuid())
  userId            String
  transactionType   String   // "REWARD" | "PURCHASE" | "BURN" | "TRANSFER"
  
  // Amount split (50/50 rule)
  grossAmount       Float    // Total BPT value in ₦
  memberAmount      Float    // 50% to user wallet
  buyBackAmount     Float    // 50% to buy-back wallet
  
  source            String   // "MEMBERSHIP_ACTIVATION" | "RENEWAL" | "REFERRAL_L1" etc.
  sourceId          String?  // Related PackageActivation/Renewal ID
  
  description       String?
  
  createdAt         DateTime @default(now())
  
  user              User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([transactionType])
}

model EmpowermentTransaction {
  id                    String   @id @default(cuid())
  empowermentPackageId  String
  transactionType       String   // "ACTIVATION" | "MATURITY" | "APPROVAL" | "RELEASE" | "FALLBACK" | "CONVERSION"
  
  grossAmount           Float
  taxAmount             Float
  netAmount             Float
  
  description           String
  performedBy           String?  // Admin user ID
  
  createdAt             DateTime @default(now())
  
  empowermentPackage    EmpowermentPackage @relation(fields: [empowermentPackageId], references: [id])
  
  @@index([empowermentPackageId])
}

model SystemWallet {
  id                String   @id @default(cuid())
  name              String   @unique
  walletType        String   // "BUY_BACK_BURN" | "TREASURY" | "COMMUNITY_SUPPORT"
  
  balanceNgn        Float    @default(0)
  balanceUsd        Float    @default(0)
  balanceBpt        Float    @default(0)  // Equivalent BPT amount
  
  isPubliclyVisible Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  events            BurnEvent[]
  buyBackEvents     BuyBackEvent[]
}

model BuyBackEvent {
  id              String   @id @default(cuid())
  systemWalletId  String
  
  amountNgn       Float    // Amount used to buy back
  amountUsd       Float
  bptPurchased    Float    // BPT tokens purchased
  exchangeRate    Float    // BPT/NGN rate at time
  
  triggeredBy     String   // Admin user ID
  description     String?
  
  createdAt       DateTime @default(now())
  
  systemWallet    SystemWallet @relation(fields: [systemWalletId], references: [id])
  
  @@index([systemWalletId])
}

model BurnEvent {
  id              String   @id @default(cuid())
  systemWalletId  String?
  
  amountBpt       Float    // BPT burned
  valueNgn        Float    // ₦ value at burn time
  valueUsd        Float    // $ value at burn time
  
  burnType        String   // "MANUAL_ADMIN" | "AUTOMATIC_THRESHOLD"
  triggeredBy     String?  // Admin user ID
  txHash          String?  // Blockchain transaction hash
  
  description     String?
  
  createdAt       DateTime @default(now())
  
  systemWallet    SystemWallet? @relation(fields: [systemWalletId], references: [id])
  
  @@index([systemWalletId])
}
```

---

## 3. Package-Specific Reward Structures

### 3.1 Regular Membership (₦10,750)

**Activation Rewards:**
| Level | Cash Wallet | BPI Token (Gross) | Palliative Wallet |
|-------|-------------|-------------------|-------------------|
| L1 | ₦1,000 | ₦1,000* | ₦250 |
| L2 | ₦500 | ₦500* | ₦250 |
| L3 | ₦500 | ₦500* | ₦250 |
| L4 | ₦500 | ₦500* | ₦250 |

*50% to member (₦500/250/250/250), 50% to buy-back wallet

**No Renewal Logic** (per doc)

---

### 3.2 Regular Plus (₦53,750)

**Activation Rewards:**
| Level | Cash Wallet | BPI Token (Gross) | Palliative Wallet |
|-------|-------------|-------------------|-------------------|
| L1 | ₦10,000 | ₦500* | ₦1,000 |
| L2 | ₦5,000 | ₦500* | ₦500 |
| L3 | ₦10,000 | ₦500* | ₦1,000 |
| L4 | ₦5,000 | ₦500* | ₦500 |

*50% to member (₦250 each), 50% to buy-back

**Renewal (₦53,750):**
| Level | Cash | BPI Token | Palliative | Health | Meal | Security |
|-------|------|-----------|------------|--------|------|----------|
| L1 | ₦2,500 | ₦500* | ₦3,000 | ₦250 | ₦250 | ₦250 |
| L2 | ₦1,250 | ₦500* | ₦1,500 | ₦250 | ₦250 | ₦250 |
| L3 | ₦2,500 | ₦500* | ₦3,000 | ₦250 | ₦250 | ₦250 |
| L4 | ₦1,250 | ₦500* | ₦1,500 | ₦250 | ₦250 | ₦250 |

---

### 3.3 Gold Plus (₦237,575)

**Activation Rewards:**
| Level | Palliative | BPI Token | Cashback |
|-------|------------|-----------|----------|
| L1 | ₦7,200 | ₦2,000* | ₦3,600 |
| L2 | ₦4,320 | ₦600* | ₦2,160 |
| L3 | ₦1,440 | ₦200* | ₦720 |
| L4 | ₦1,440 | ₦200* | ₦720 |

**Shelter Rewards (10 Levels):**
| Level | Amount |
|-------|--------|
| 1 | ₦60,000 |
| 2 | ₦45,000 |
| 3 | ₦15,000 |
| 4 | ₦15,000 |
| 5 | ₦3,000 |
| 6 | ₦3,000 |
| 7 | ₦3,000 |
| 8 | ₦3,000 |
| 9 | ₦1,500 |
| 10 | ₦1,500 |

**Renewal (₦107,500):**
| Level | Palliative | Cashback | BPI Token |
|-------|------------|----------|-----------|
| L1 | ₦6,000 | ₦4,000 | ₦1,000* |
| L2 | ₦3,600 | ₦2,400 | ₦500* |
| L3 | ₦1,200 | ₦800 | ₦250* |
| L4 | ₦1,200 | ₦800 | ₦250* |

**Renewal Welfare Wallets:**
| Level | Shelter | Health | Meal | Security |
|-------|---------|--------|------|----------|
| 1 | ₦15,000 | ₦1,000 | ₦300 | ₦150 |
| 2 | ₦10,000 | ₦800 | ₦300 | ₦150 |
| 3-10 | ₦2,000 | ₦500-800 | ₦200 | ₦100 |

---

### 3.4 Platinum Plus (₦345,075)

**Activation Rewards:**
| Level | Palliative | BPI Token | Cashback |
|-------|------------|-----------|----------|
| L1 | ₦16,000 | ₦2,000* | ₦74,250 |
| L2 | ₦6,400 | ₦600* | ₦44,550 |
| L3 | ₦3,200 | ₦200* | ₦14,850 |
| L4 | ₦3,200 | ₦200* | ₦14,850 |

**Shelter Rewards (10 Levels):**
| Level | Amount |
|-------|--------|
| 1 | ₦30,000 |
| 2 | ₦22,500 |
| 3 | ₦7,500 |
| 4 | ₦7,500 |
| 5-10 | ₦1,500 each |

**Renewal:** Same structure as Gold Plus

---

### 3.5 Travel & Tour Agent (₦354,750)

**Activation Rewards:**
| Level | Cash | BPI Token | Palliative | Cashback |
|-------|------|-----------|------------|----------|
| L1 | ₦10,000 | ₦1,000* | ₦500 | ₦62,500 |
| L2 | ₦5,000 | ₦500* | ₦500 | ₦62,500 |
| L3 | ₦10,000 | ₦1,000* | ₦500 | ₦10,000 |
| L4 | ₦5,000 | ₦500* | ₦500 | ₦10,000 |

---

### 3.6 Basic Early Retirement (₦287,025)

**Activation Rewards:**
| Level | Cash | BPI Token | Palliative |
|-------|------|-----------|------------|
| L1 | ₦10,000 | ₦500* | ₦1,000 |
| L2 | ₦5,000 | ₦500* | ₦500 |
| L3 | ₦10,000 | ₦500* | ₦1,000 |
| L4 | ₦5,000 | ₦500* | ₦500 |

---

### 3.7 Child Educational/Vocational Support (₦354,750)

**NOT a referral-based package** - Different mechanics entirely:

**Flow:**
1. Sponsor pays ₦330,000 + ₦24,750 VAT = ₦354,750
2. Sub-account created for beneficiary (child/trainee)
3. 24-month countdown starts
4. After 24 months + admin approval:
   - Beneficiary gets: ₦7,250,000 (gross) → ₦6,706,250 (net after 7.5% tax)
   - Sponsor gets: ₦1,000,000 (gross) → ₦925,000 (net after 7.5% tax)

**Fallback (if BPI can't deliver):**
- ₦330,000 + 20% = ₦396,000 (gross) → ₦366,300 (net)

**Conversion Option:**
- ₦64,000 → Regular Plus + MYNGUL activation
- ₦332,000 → Wallet (community support restricted)
- If ₦332,000 contributed to community → 72-hour waiver window

---

## 4. Business Logic Flows

### 4.1 Standard Package Activation Flow

```typescript
async function activateStandardPackage(userId: string, packageId: string) {
  // 1. Payment verification
  // 2. Create PackageActivation record
  // 3. Update user membership fields
  // 4. Calculate expiry (activatedAt + 365 days)
  // 5. Distribute referral rewards (L1-L4):
  //    - Cash wallet (direct)
  //    - Palliative wallet (direct)
  //    - Cashback wallet (if package has it)
  //    - BPI Token: 50% member wallet, 50% buy-back wallet
  //    - Shelter rewards (if Gold/Platinum)
  // 6. Create TokenTransaction records for each BPT reward
  // 7. Trigger notification system
  // 8. Return success + new membership status
}
```

### 4.2 Renewal Flow

```typescript
async function renewMembership(userId: string) {
  // 1. Check if user has active membership
  // 2. Verify membership is expired or near expiry
  // 3. Payment verification (renewal fee + VAT)
  // 4. Create RenewalHistory record
  // 5. Extend membership (expiresAt + 365 days)
  // 6. Distribute renewal rewards (L1-L4):
  //    - Cash, Palliative, BPI Token, Cashback
  //    - Welfare wallets: Shelter, Health, Meal, Security
  // 7. BPI Token 50/50 split
  // 8. Increment renewal count
  // 9. Trigger notifications
}
```

### 4.3 Empowerment Package Flow

```typescript
async function activateEmpowermentPackage(
  sponsorId: string, 
  beneficiaryData: { name, email, type: 'CHILD' | 'VOCATIONAL' }
) {
  // 1. Payment verification (₦354,750)
  // 2. Create beneficiary sub-account
  //    - beneficiaryCanView = true
  //    - beneficiaryCanWithdraw = false
  //    - usageRestrictions = ["EDUCATION_ONLY" | "SKILL_ONLY"]
  // 3. Create EmpowermentPackage record
  // 4. Set maturityDate = activatedAt + 24 months
  // 5. Status = "Active - Countdown Running"
  // 6. Create EmpowermentTransaction (ACTIVATION)
  // 7. Start countdown timer job
  // 8. Notify both sponsor and beneficiary
}

async function processEmpowermentMaturity(empowermentId: string) {
  // Triggered at 24-month mark
  // 1. Update status = "Pending Maturity (24 Months)"
  // 2. Notify admin for approval
  // 3. Lock for admin review
}

async function approveEmpowerment(empowermentId: string, adminId: string) {
  // Admin action
  // 1. Verify maturity date reached
  // 2. Set adminApproved = true, approvedBy = adminId
  // 3. Calculate tax (7.5% on both amounts)
  // 4. Update status = "Approved - Activation Pending"
  // 5. Create EmpowermentTransaction (APPROVAL)
  // 6. Notify sponsor + beneficiary
}

async function releaseEmpowermentFunds(empowermentId: string, adminId: string) {
  // Final release
  // 1. Credit beneficiary: ₦6,706,250 (visible, non-cashable)
  // 2. Credit sponsor: ₦925,000 (available)
  // 3. Record tax deductions
  // 4. Update status = "Empowerment Released (Tax Applied)"
  // 5. Create EmpowermentTransaction (RELEASE)
  // 6. Beneficiary funds remain education/skill-restricted
}

async function triggerFallbackProtection(empowermentId: string) {
  // If BPI cannot deliver after 24 months
  // 1. Calculate fallback: ₦396,000 gross → ₦366,300 net
  // 2. Apply 7.5% tax
  // 3. Credit sponsor wallet (immediately available)
  // 4. Update status = "Fallback Protection Activated"
  // 5. Create EmpowermentTransaction (FALLBACK)
  // 6. Tag funds as "Protected Refund – Insurance Backed"
}

async function convertToRegularPlus(empowermentId: string, userId: string) {
  // Conversion option
  // 1. Deduct ₦64,000 from user wallet
  // 2. Activate Regular Plus membership
  // 3. Activate MYNGUL social media
  // 4. Credit ₦332,000 to wallet (community support restricted)
  // 5. Update isConverted = true, status = "Converted to Regular Plus"
  // 6. Create EmpowermentTransaction (CONVERSION)
}

async function processCommunityWaiver(empowermentId: string, contributionAmount: number) {
  // If user contributes ₦332,000+ to community support
  // 1. Verify contribution >= ₦332,000
  // 2. Set communityWaiverActive = true
  // 3. Set communityWaiverStartedAt = now
  // 4. Set communityWaiverEndsAt = now + 72 hours
  // 5. Update status = "Community Support Rule Waived"
  // 6. After 72 hours, auto-revert to "Default Community Rule Active"
}
```

### 4.4 BPI Token 50/50 Split Logic

```typescript
async function distributeBPTReward(
  userId: string, 
  grossAmountNgn: number, 
  source: string,
  sourceId: string
) {
  const memberAmount = grossAmountNgn * 0.5;  // 50% to user wallet
  const buyBackAmount = grossAmountNgn * 0.5; // 50% to buy-back wallet
  
  // 1. Credit user BPT wallet (member visible portion)
  await prisma.user.update({
    where: { id: userId },
    data: {
      bpiTokenWallet: { increment: memberAmount }
    }
  });
  
  // 2. Credit buy-back system wallet (invisible to user)
  await prisma.systemWallet.update({
    where: { name: "BUY_BACK_BURN" },
    data: {
      balanceNgn: { increment: buyBackAmount },
      // Update balanceBpt based on current exchange rate
    }
  });
  
  // 3. Record transaction
  await prisma.tokenTransaction.create({
    data: {
      userId,
      transactionType: "REWARD",
      grossAmount: grossAmountNgn,
      memberAmount,
      buyBackAmount,
      source,
      sourceId,
      description: `BPT reward from ${source} (50/50 split applied)`
    }
  });
}
```

---

## 5. API Endpoints Required

### 5.1 Package Management
- `GET /api/packages` - List all active packages
- `GET /api/packages/:id` - Get package details
- `POST /api/packages/activate` - Activate standard package
- `POST /api/packages/renew` - Renew membership

### 5.2 Empowerment Package
- `POST /api/empowerment/activate` - Create empowerment package
- `GET /api/empowerment/:id` - Get empowerment details
- `POST /api/empowerment/:id/convert` - Convert to Regular Plus
- `POST /api/empowerment/:id/contribute-community` - Community contribution
- `GET /api/empowerment/beneficiary/:userId` - Beneficiary view (read-only)

### 5.3 Admin Endpoints
- `POST /api/admin/empowerment/:id/approve` - Approve matured empowerment
- `POST /api/admin/empowerment/:id/release` - Release funds
- `POST /api/admin/empowerment/:id/fallback` - Trigger fallback
- `POST /api/admin/token/buy-back` - Execute buy-back
- `POST /api/admin/token/burn` - Burn BPT tokens
- `GET /api/admin/token/buy-back-wallet` - View buy-back wallet status

### 5.4 User Endpoints
- `GET /api/user/wallets` - Get all wallet balances
- `GET /api/user/membership` - Get membership status
- `GET /api/user/renewals` - Get renewal history
- `GET /api/user/referrals` - Get referral tree & rewards

---

## 6. Frontend Components Required

### 6.1 Membership Selection Page
- Package cards (7 total: 6 standard + 1 empowerment)
- Clear distinction between standard (365-day) and empowerment (24-month)
- Reward breakdown visualization
- "Activate Now" buttons

### 6.2 Empowerment Package UI
- Dual-account creation form (sponsor + beneficiary)
- 24-month countdown display
- Status progression tracker
- Beneficiary view (read-only dashboard)
- Conversion option UI
- Community contribution tracker
- 72-hour waiver timer

### 6.3 Dashboard Wallet Display
- Multi-wallet view with categories:
  - Core: Cash, Spendable, BPI Token (visible 50%)
  - Rewards: Palliative, Cashback
  - Welfare: Shelter, Health, Meal, Security
  - Special: Community, Education, Shareholder, etc.
- Wallet transaction history per category
- Restrictions/usage rules display

### 6.4 Renewal Interface
- Renewal countdown timer
- Renewal reminder system
- Renewal payment flow
- Renewal history table

### 6.5 Admin Dashboard
- Empowerment approval queue
- Buy-back wallet public dashboard (read-only)
- Burn event history
- Buy-back execution interface
- Tax calculation reports

---

## 7. Notification System Requirements

### 7.1 Membership Notifications
- Activation success
- Renewal reminders (weekly → 3 days → 24 hours)
- Expiry warnings
- Referral reward notifications (L1-L4)

### 7.2 Empowerment Notifications
- Activation confirmation (sponsor + beneficiary)
- Monthly countdown updates
- 24-month maturity alert
- Admin approval notifications
- Fund release confirmation
- Fallback trigger notice
- Conversion completion
- Community waiver activation/expiry

---

## 8. Data Seeding Strategy

### 8.1 Correct Package Data

```typescript
const COMPLETE_PACKAGES = [
  {
    name: "Regular",
    packageType: "STANDARD",
    price: 10000,
    vat: 750,
    cash_l1: 1000, cash_l2: 500, cash_l3: 500, cash_l4: 500,
    palliative_l1: 250, palliative_l2: 250, palliative_l3: 250, palliative_l4: 250,
    bpt_l1: 1000, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
    hasRenewal: false,
  },
  {
    name: "Regular Plus",
    packageType: "STANDARD",
    price: 50000,
    vat: 3750,
    cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
    palliative_l1: 1000, palliative_l2: 500, palliative_l3: 1000, palliative_l4: 500,
    bpt_l1: 500, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
    hasRenewal: true,
    renewalFee: 50000,
    renewal_cash_l1: 2500, renewal_cash_l2: 1250, renewal_cash_l3: 2500, renewal_cash_l4: 1250,
    renewal_palliative_l1: 3000, renewal_palliative_l2: 1500, renewal_palliative_l3: 3000, renewal_palliative_l4: 1500,
    renewal_bpt_l1: 500, renewal_bpt_l2: 500, renewal_bpt_l3: 500, renewal_bpt_l4: 500,
    renewal_health_l1: 250, renewal_health_l2: 250, renewal_health_l3: 250, renewal_health_l4: 250,
    renewal_meal_l1: 250, renewal_meal_l2: 250, renewal_meal_l3: 250, renewal_meal_l4: 250,
    renewal_security_l1: 250, renewal_security_l2: 250, renewal_security_l3: 250, renewal_security_l4: 250,
  },
  {
    name: "Gold Plus",
    packageType: "STANDARD",
    price: 221000,
    vat: 16575,
    palliative_l1: 7200, palliative_l2: 4320, palliative_l3: 1440, palliative_l4: 1440,
    bpt_l1: 2000, bpt_l2: 600, bpt_l3: 200, bpt_l4: 200,
    cashback_l1: 3600, cashback_l2: 2160, cashback_l3: 720, cashback_l4: 720,
    shelter_l1: 60000, shelter_l2: 45000, shelter_l3: 15000, shelter_l4: 15000,
    shelter_l5: 3000, shelter_l6: 3000, shelter_l7: 3000, shelter_l8: 3000,
    shelter_l9: 1500, shelter_l10: 1500,
    hasRenewal: true,
    renewalFee: 100000,
    renewal_palliative_l1: 6000, renewal_palliative_l2: 3600, renewal_palliative_l3: 1200, renewal_palliative_l4: 1200,
    renewal_cashback_l1: 4000, renewal_cashback_l2: 2400, renewal_cashback_l3: 800, renewal_cashback_l4: 800,
    renewal_bpt_l1: 1000, renewal_bpt_l2: 500, renewal_bpt_l3: 250, renewal_bpt_l4: 250,
    renewal_shelter_l1: 15000, renewal_shelter_l2: 10000, // levels 3-10: 2000 each
    renewal_health_l1: 1000, renewal_health_l2: 800, // levels 3-10: 500-800
    renewal_meal_l1: 300, renewal_meal_l2: 300, renewal_meal_l3: 200, renewal_meal_l4: 200,
    renewal_security_l1: 150, renewal_security_l2: 150, renewal_security_l3: 100, renewal_security_l4: 100,
  },
  {
    name: "Platinum Plus",
    packageType: "STANDARD",
    price: 321000,
    vat: 24075,
    palliative_l1: 16000, palliative_l2: 6400, palliative_l3: 3200, palliative_l4: 3200,
    bpt_l1: 2000, bpt_l2: 600, bpt_l3: 200, bpt_l4: 200,
    cashback_l1: 74250, cashback_l2: 44550, cashback_l3: 14850, cashback_l4: 14850,
    shelter_l1: 30000, shelter_l2: 22500, shelter_l3: 7500, shelter_l4: 7500,
    shelter_l5: 1500, shelter_l6: 1500, shelter_l7: 1500, shelter_l8: 1500,
    shelter_l9: 1500, shelter_l10: 1500,
    hasRenewal: true,
    renewalFee: 100000,
    // Same renewal structure as Gold Plus
  },
  {
    name: "Travel & Tour Agent",
    packageType: "STANDARD",
    price: 330000,
    vat: 24750,
    cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
    palliative_l1: 500, palliative_l2: 500, palliative_l3: 500, palliative_l4: 500,
    bpt_l1: 1000, bpt_l2: 500, bpt_l3: 1000, bpt_l4: 500,
    cashback_l1: 62500, cashback_l2: 62500, cashback_l3: 10000, cashback_l4: 10000,
  },
  {
    name: "Basic Early Retirement",
    packageType: "STANDARD",
    price: 267000,
    vat: 20025,
    cash_l1: 10000, cash_l2: 5000, cash_l3: 10000, cash_l4: 5000,
    palliative_l1: 1000, palliative_l2: 500, palliative_l3: 1000, palliative_l4: 500,
    bpt_l1: 500, bpt_l2: 500, bpt_l3: 500, bpt_l4: 500,
  }
];
```

**Note:** Child Educational/Vocational package is NOT seeded - it's created dynamically via empowerment activation flow.

---

## 9. Migration Plan

### Phase 1: Schema Updates
1. Update User model with new wallet fields
2. Enhance MembershipPackage model
3. Enhance EmpowermentPackage model
4. Add new models: RenewalHistory, ShelterReward, TokenTransaction, EmpowermentTransaction, BuyBackEvent
5. Run `prisma migrate dev --name complete-membership-system`

### Phase 2: Data Migration
1. Delete incorrect packages (Basic, Regular Plus "Premium")
2. Seed 6 correct standard packages
3. Create BUY_BACK_BURN system wallet
4. Migrate any existing user memberships (if applicable)

### Phase 3: Backend Implementation
1. Update tRPC routers with correct reward logic
2. Implement 50/50 BPT split logic
3. Build empowerment package flows
4. Add admin approval workflows
5. Implement renewal system
6. Add countdown/scheduler jobs

### Phase 4: Frontend Updates
1. Update membership page with 7 package cards
2. Build empowerment package UI
3. Add multi-wallet dashboard
4. Implement renewal interface
5. Build admin empowerment approval UI
6. Add buy-back wallet public display

### Phase 5: Testing & Validation
1. Test all 6 standard package activations
2. Test empowerment package full lifecycle
3. Test renewal flows
4. Test BPT 50/50 split accuracy
5. Test admin workflows
6. Test beneficiary restrictions

---

## 10. Critical Implementation Notes

### 10.1 BPI Token Calculation
- All BPT amounts in docs are in **Naira value**, not token count
- Apply 50/50 split: member gets 50%, buy-back gets 50%
- Member only sees their 50% in wallet UI
- Buy-back wallet accumulates for periodic buy-back/burn events

### 10.2 Tax vs VAT
- **Standard packages:** 7.5% VAT added upfront (included in total price)
- **Empowerment package:** 7.5% tax deducted on fund **availability** (not upfront)
- Tax applies to empowerment payouts, fallback, and community support access

### 10.3 Empowerment Package Uniqueness
- Completely different product from standard memberships
- No referral rewards - only empowerment payouts
- 24-month vs 365-day cycle
- Requires admin intervention
- Sub-account with restricted access
- Insurance-backed fallback mechanism

### 10.4 Renewal Complexity
- Only Regular Plus, Gold Plus, Platinum Plus have renewals
- Renewal adds NEW wallet types (health, meal, security)
- Renewal rewards differ from activation rewards
- Gold/Platinum have 10-level shelter logic that needs clarity on levels 3-10

### 10.5 Shelter Rewards
- Gold/Platinum have 10-level shelter distribution
- Needs referral tree depth up to 10 levels (current system only tracks L1-L4)
- **Action Required:** Clarify if shelter levels 5-10 follow same distribution or need separate tracking

---

## 11. Outstanding Questions for Clarification

1. **Shelter Levels 5-10:** Do Regular Plus renewals also get shelter rewards for levels 5-10, or only levels 1-4?
2. **Referral Tree Depth:** Current schema tracks 4 levels. Do we need to extend to 10 for shelter rewards?
3. **Gold/Platinum Renewal Levels 3-10:** Document shows "₦2,000" for shelter, "₦500-800" for health. Need exact values per level.
4. **Regular Package Renewal:** Doc section 5 says "₦53,750" renewal for Regular + Regular Plus, but earlier says Regular has no renewal. Clarify?
5. **Empowerment Package Renewal:** Does this package renew after 24 months, or is it one-time only?
6. **MYNGUL Social Media:** What is the activation logic when included in packages or conversions?
7. **Community Support Restriction:** What exactly restricts wallet funds to "community support only"? What actions are allowed/blocked?

---

## 12. Implementation Priority

### High Priority (Blocking user testing)
1. ✅ Delete wrong packages
2. ✅ Update schema with all wallet fields
3. ✅ Seed correct 6 packages
4. ✅ Update activation logic with correct rewards
5. ✅ Implement 50/50 BPT split
6. ✅ Update membership page UI with all 6 packages

### Medium Priority (Core features)
7. Renewal system
8. Empowerment package activation
9. Admin approval workflows
10. Multi-wallet dashboard display
11. Countdown timers

### Low Priority (Advanced features)
12. Shelter 10-level distribution
13. Community support waiver mechanics
14. Buy-back/burn public dashboard
15. MYNGUL integration
16. Fallback protection automation

---

**End of Architecture Document**

This architecture represents the **complete, corrected implementation** based on all provided documentation. The current implementation has ~15% coverage - only 3 packages with wrong values and missing most features.
