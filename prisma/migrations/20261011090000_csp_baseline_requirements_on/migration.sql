-- Corporate decision (BPI-CSP "How It Works", 09/10/2026): KYC approval and
-- Auto-Debit/Auto-Contribute activation are mandatory to unlock the CSP
-- Support Lifeline for every member. The code default is now on, but a
-- stored setting overrides the default, and seeded environments store
-- "false" for all three. Switch any stored value on. Idempotent; rows that
-- don't exist are left alone (the code default already applies).
UPDATE "AdminSettings"
SET "settingValue" = 'true', "updatedAt" = NOW()
WHERE "settingKey" IN ('csp_require_kyc', 'csp_require_auto_debit', 'csp_require_auto_contribute');
