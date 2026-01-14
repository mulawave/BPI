# VAT & Tax Management Settings

**Status:** ✅ VAT Recording Implemented | 🔧 Admin Controls Required

## Current Implementation

**Confirmed Working:**
- ✅ VAT transactions automatically created for membership activations
- ✅ VAT transactions automatically created for membership upgrades  
- ✅ VAT records tracked separately with transaction type "VAT"
- ✅ VAT history viewable in Tax History modal with export to CSV
- ✅ Backfill tool available for existing memberships

**Code Locations:**
- Membership Activation VAT: `server/trpc/router/package.ts` line 235-246
- Membership Upgrade VAT: `server/trpc/router/package.ts` line 1193-1206
- Tax History Modal: `components/TaxesModal.tsx`
- Tax API: `server/trpc/router/taxes.ts`

---

## Required Admin Controls

### 1. Global VAT Settings

**Settings Panel: `/admin/settings/vat`**

```typescript
interface VatSettings {
  defaultVatRate: number;      // Percentage (e.g., 7.5 for 7.5%)
  vatEnabled: boolean;          // Global toggle
  lastUpdatedBy: string;        // Admin user ID
  updatedAt: Date;
}
```

**UI Configuration:**
- Default VAT Rate: Input field (0-100%)
- Enable VAT Collection: Toggle switch (yes/no)
- Currently hardcoded at: 7.5%

### 2. Country-Specific VAT Rates

**Database Schema:**
```prisma
model CountryVatRate {
  id            String   @id @default(cuid())
  countryCode   String   @unique // ISO 3166-1 alpha-2 (NG, GH, KE, etc.)
  countryName   String   // Nigeria, Ghana, Kenya, etc.
  vatRate       Float    // Percentage
  isActive      Boolean  @default(true)
  effectiveFrom DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  // Admin user ID
  
  @@index([countryCode])
  @@index([isActive])
}

model VatSettings {
  id              String   @id @default(cuid())
  defaultVatRate  Float    @default(7.5)
  vatEnabled      Boolean  @default(true)
  lastUpdatedBy   String?
  updatedAt       DateTime @updatedAt
}
```

**Admin Interface Requirements:**

**Table View:**
| Country | VAT Rate (%) | Status | Actions |
|---------|--------------|--------|---------|
| Nigeria | 7.5 | Active | Edit Delete |
| Ghana | 12.5 | Active | Edit Delete |
| Kenya | 16.0 | Active | Edit Delete |
| South Africa | 15.0 | Active | Edit Delete |

**Add/Edit Form:**
- Country Dropdown (with ISO codes)
- VAT Rate Input (0-100%)
- Active/Inactive Toggle
- Save/Cancel Buttons

### 3. VAT Application Logic

```typescript
// Get VAT rate for user's country
async function getVatRateForUser(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true }
  });

  if (!user?.country) {
    return getDefaultVatRate();
  }

  const countryRate = await prisma.countryVatRate.findUnique({
    where: { 
      countryCode: getCountryCode(user.country),
      isActive: true
    }
  });

  return countryRate?.vatRate ?? getDefaultVatRate();
}

async function getDefaultVatRate(): Promise<number> {
  const settings = await prisma.vatSettings.findFirst();
  return settings?.vatEnabled ? settings.defaultVatRate : 0;
}
```

### 4. Transaction Types with VAT

**Currently Implemented:**
- ✅ MEMBERSHIP_ACTIVATION
- ✅ membership_upgrade

**Future Implementation:**
- 🔜 EMPOWERMENT_PURCHASE
- 🔜 PRODUCT_PURCHASE
- 🔜 SERVICE_PURCHASE
- 🔜 PLATFORM_FEE

### 5. VAT Reporting Dashboard

**Location: `/admin/reports/vat`**

**Monthly Summary:**
- Total VAT Collected
- Total Transactions
- Average VAT per Transaction
- Breakdown by Country
- Export to CSV/PDF

**Filters:**
- Date Range (Month/Year)
- Country
- Transaction Type
- Status (completed/pending/failed)

---

## Implementation Checklist

### Phase 1: Admin Interface (High Priority)
- [ ] Create `/admin/settings/vat` page
- [ ] Add global VAT toggle and default rate setting
- [ ] Build country VAT rate management table
- [ ] Implement add/edit/delete country VAT rates
- [ ] Add validation (0-100% range)

### Phase 2: Database & API (High Priority)
- [ ] Add CountryVatRate model to Prisma schema
- [ ] Add VatSettings model to Prisma schema
- [ ] Run database migrations
- [ ] Create tRPC admin endpoints:
  - `admin.vat.getSettings`
  - `admin.vat.updateSettings`
  - `admin.vat.getCountryRates`
  - `admin.vat.createCountryRate`
  - `admin.vat.updateCountryRate`
  - `admin.vat.deleteCountryRate`
- [ ] Add admin role authorization

### Phase 3: Integration (High Priority)
- [ ] Update processMockPayment to use dynamic VAT rate
- [ ] Update processUpgradePayment to use dynamic VAT rate
- [ ] Add getVatRateForUser helper function
- [ ] Test VAT calculation with different rates
- [ ] Update membership package VAT field calculation

### Phase 4: Reporting (Medium Priority)
- [ ] Create VAT reports dashboard
- [ ] Add monthly/annual export
- [ ] Country-wise breakdown
- [ ] Transaction-level audit trail

### Phase 5: Testing (High Priority)
- [ ] Test default VAT rate application
- [ ] Test country-specific VAT rates
- [ ] Test VAT disabled globally
- [ ] Test fallback to default when country not configured
- [ ] Test VAT calculation accuracy
- [ ] Test admin CRUD operations
- [ ] Test export functionality

---

## Security & Access Control

**Required Permissions:**
- `admin.vat.view`: View VAT settings and rates
- `admin.vat.edit`: Modify VAT settings and rates
- `admin.vat.reports`: Access VAT reports

**Audit Requirements:**
- Log all VAT rate changes
- Track admin user who made changes
- Record previous and new values
- Optional: Require reason/comment for changes

---

## Testing Scenarios

1. **Membership Activation (Default Rate)**
   - User from Nigeria activates ₦50,000 package
   - No country-specific rate configured
   - VAT = ₦3,488.37 (7.5%)
   - Total = ₦53,488.37

2. **Membership Activation (Country Rate)**
   - User from Kenya activates ₦50,000 package
   - Kenya rate = 16%
   - VAT = ₦6,896.55
   - Total = ₦56,896.55

3. **Membership Upgrade (Differential)**
   - Upgrade from ₦10,750 to ₦53,750
   - Differential = ₦43,000
   - VAT on differential = ₦3,000
   - Total upgrade cost = ₦43,000

4. **VAT Disabled Globally**
   - Admin disables VAT
   - No VAT charged on any transaction
   - Total = Base price only

---

**Add this content to docs/admin-settings-requirements.md under a new section: "## 🧾 VAT & Tax Management"**
