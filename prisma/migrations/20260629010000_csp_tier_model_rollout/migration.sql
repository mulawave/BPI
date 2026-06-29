-- Roll out the CSP tier model by default.
INSERT INTO "AdminSettings" ("id", "settingKey", "settingValue", "description", "updatedAt")
VALUES (gen_random_uuid(), 'csp_tier_model_enabled', 'true', 'Enable CSP tier model', NOW())
ON CONFLICT ("settingKey")
DO UPDATE SET
  "settingValue" = EXCLUDED."settingValue",
  "description" = EXCLUDED."description",
  "updatedAt" = NOW();
