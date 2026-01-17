// This file forces TypeScript server to reload Prisma types
import type { User } from '@prisma/client';

// Test new fields
type TestPin = User['userProfilePin'];
type Test2FA = User['twoFactorEnabled'];
type Test2FASecret = User['twoFactorSecret'];
