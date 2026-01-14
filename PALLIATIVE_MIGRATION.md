# Palliative System Migration Guide

## Database Schema Changes Required

Due to migration drift in the database, manual SQL updates may be needed. Here are the changes:

### 1. Add New Columns to User Table

```sql
-- Add palliative wallet fields
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "palliativeWallet" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "palliativeActivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "selectedPalliative" TEXT,
ADD COLUMN IF NOT EXISTS "palliativeActivatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "palliativeTier" TEXT;

-- Note: shelter, education, car, business, land, health, solar fields already exist
-- If they don't exist, add them:
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "shelter" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "education" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "car" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "business" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "land" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "health" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "solar" DOUBLE PRECISION;
```

### 2. Create PalliativeOption Table

```sql
CREATE TABLE IF NOT EXISTS "PalliativeOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "PalliativeOption_active_displayOrder_idx" ON "PalliativeOption"("active", "displayOrder");
```

### 3. Create PalliativeWalletActivation Table

```sql
CREATE TABLE IF NOT EXISTS "PalliativeWalletActivation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "palliativeType" TEXT NOT NULL,
    "membershipTier" TEXT NOT NULL,
    "activationType" TEXT NOT NULL,
    "thresholdAmount" DOUBLE PRECISION,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PalliativeWalletActivation_userId_idx" ON "PalliativeWalletActivation"("userId");
CREATE INDEX IF NOT EXISTS "PalliativeWalletActivation_activatedAt_idx" ON "PalliativeWalletActivation"("activatedAt");
```

### 4. Create PalliativeMaturity Table

```sql
CREATE TABLE IF NOT EXISTS "PalliativeMaturity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "palliativeType" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "completedAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dateCompleted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PalliativeMaturity_userId_idx" ON "PalliativeMaturity"("userId");
CREATE INDEX IF NOT EXISTS "PalliativeMaturity_status_idx" ON "PalliativeMaturity"("status");
CREATE INDEX IF NOT EXISTS "PalliativeMaturity_dateCompleted_idx" ON "PalliativeMaturity"("dateCompleted");
```

### 5. Seed Palliative Options

Run the seed script or manually insert:

```sql
INSERT INTO "PalliativeOption" ("id", "name", "slug", "targetAmount", "description", "icon", "active", "displayOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Car Palliative', 'car', 10000000, 'Receive support toward purchasing your dream vehicle', 'car', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'House/Shelter Palliative', 'house', 40000000, 'Get assistance with housing and shelter needs', 'home', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Land Palliative', 'land', 5000000, 'Land acquisition support for your future', 'map', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Business Support Palliative', 'business', 10000000, 'Capital support to start or grow your business', 'briefcase', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Education Palliative', 'education', 20000000, 'Educational funding for you or your family', 'graduation-cap', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Solar Power Palliative', 'solar', 5000000, 'Clean energy solution for your home or business', 'sun', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
```

## Alternative: Using Prisma Migrate

If you can reset the database (development only):

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
npx prisma db seed
```

## Prisma Client Generation

After applying the SQL changes:

```bash
npx prisma generate
```

If you encounter file lock errors, close your development server and try again.
