-- Add system settings for PIN and 2FA features
INSERT INTO "AdminSettings" (id, "settingKey", "settingValue", description, "updatedAt")
VALUES 
  (gen_random_uuid(), 'pin_enabled', 'false', 'Enable or disable PIN feature for all users', NOW()),
  (gen_random_uuid(), 'two_factor_enabled', 'false', 'Enable or disable Two-Factor Authentication for all users', NOW())
ON CONFLICT ("settingKey") DO NOTHING;
