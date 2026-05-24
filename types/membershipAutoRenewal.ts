/**
 * TypeScript Types for Membership Auto-Renewal System
 */

// ═════════════════════════════════════════════════════════════════════════
// Membership Hierarchy & Tiers
// ═════════════════════════════════════════════════════════════════════════

export type MembershipTier = "Regular" | "Regular Plus" | "Gold Plus" | "Platinum Plus";

export enum MembershipTierLevel {
  Regular = 1,
  RegularPlus = 2,
  GoldPlus = 3,
  PlatinumPlus = 4,
}

// ═════════════════════════════════════════════════════════════════════════
// Eligibility & Validation
// ═════════════════════════════════════════════════════════════════════════

export interface AutoRenewalEligibility {
  eligible: boolean;
  reason?: string;
  membershipExpiresAt?: Date;
  daysUntilExpiry?: number;
}

export interface NoDowngradeValidation {
  isValid: boolean;
  reason?: string;
  currentTier?: string;
  requestedTier?: string;
  currentLevel?: number;
  requestedLevel?: number;
}

// ═════════════════════════════════════════════════════════════════════════
// Renewal Information
// ═════════════════════════════════════════════════════════════════════════

export interface RenewalPackageInfo {
  packageId: string;
  packageName: string;
  renewalFee: number;
  vat: number;
  totalCost: number;
  isUpgrade: boolean;
}

export interface RenewalRewards {
  cash: number;
  bpt: number;
  palliative: number;
  cashback: number;
  health: number;
  meal: number;
  security: number;
  shelter?: number;
}

export interface MembershipRenewalStatus {
  hasActiveMembership: boolean;
  error?: string;
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  currentPackage?: string;
  membershipActivatedAt?: Date | null;
  membershipExpiresAt?: Date;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isRenewalWindow?: boolean;
  renewalFee?: number;
  renewalCycleDays?: number;
  totalRenewals?: number;
}

export interface RenewalPreview {
  eligible: boolean;
  reason?: string;
  membershipExpiresAt?: Date;
  daysUntilExpiry?: number;
  userId?: string;
  renewalPackage?: string;
  renewalFee?: number;
  vat?: number;
  totalCost?: number;
  isUpgrade?: boolean;
  referralCount?: number;
  estimatedRewards?: RenewalRewards;
}

// ═════════════════════════════════════════════════════════════════════════
// Processing Results
// ═════════════════════════════════════════════════════════════════════════

export interface AutoRenewalResult {
  success: boolean;
  renewalHistoryId?: string;
  newExpiresAt?: Date;
  totalRewardsDistributed?: RenewalRewards;
  error?: string;
}

export interface ManualUserAutoRenewalResult extends AutoRenewalResult {
  message?: string;
}

// ═════════════════════════════════════════════════════════════════════════
// Candidate & History
// ═════════════════════════════════════════════════════════════════════════

export interface AutoRenewalCandidate {
  userId: string;
  userName: string;
  userEmail: string;
  currentPackage: string;
  renewalFee: number;
  membershipExpiresAt: Date;
  daysExpired: number;
  renewalCount: number;
}

export interface RenewalHistoryRecord {
  renewalHistoryId: string;
  packageName: string;
  renewalNumber: number;
  renewalFee: number;
  vat: number;
  totalPaid: number;
  renewedAt: Date;
  expiresAt: Date;
  totalRewardsDistributed: RenewalRewards;
}

export interface RenewalHistoryPage {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  renewals: RenewalHistoryRecord[];
}

// ═════════════════════════════════════════════════════════════════════════
// Admin Operations
// ═════════════════════════════════════════════════════════════════════════

export interface GetCandidatesOptions {
  limit?: number;
  expiredDaysAgo?: number;
}

export interface GetCandidatesResult {
  total: number;
  candidates: AutoRenewalCandidate[];
}

export interface PreviewAutoRenewalInput {
  userId: string;
  optionalUpgradePackageId?: string;
}

export interface ProcessAutoRenewalInput {
  userId: string;
  optionalUpgradePackageId?: string;
  reason?: string;
}

export interface ProcessAutoRenewalResult extends AutoRenewalResult {
  renewalHistoryId: string;
  newExpiresAt: Date;
  totalRewardsDistributed: RenewalRewards;
}

export interface BulkProcessOptions {
  dryRun?: boolean;
  limit?: number;
  reasonIfFailed?: string;
}

export interface BulkProcessDryRunResult {
  success: true;
  dryRun: true;
  processed: 0;
  failed: 0;
  totalCandidates: number;
  message: string;
  candidates: AutoRenewalCandidate[];
}

export interface BulkProcessExecuteResult {
  success: boolean;
  dryRun: false;
  processed: number;
  failed: number;
  totalCandidates: number;
  failures?: Array<{ userId: string; error: string }>;
}

export type BulkProcessResult = BulkProcessDryRunResult | BulkProcessExecuteResult;

// ═════════════════════════════════════════════════════════════════════════
// Background Job
// ═════════════════════════════════════════════════════════════════════════

export interface AutoRenewalJobOptions {
  dryRun?: boolean;
  limit?: number;
  onlyProcessUsersBeforeExpiry?: boolean;
  skipFailedUsers?: string[];
}

export interface AutoRenewalJobError {
  userId: string;
  userEmail?: string;
  error: string;
}

export interface AutoRenewalJobResult {
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  totalCandidates: number;
  processed: number;
  failed: number;
  skipped: number;
  errors: AutoRenewalJobError[];
  summary: string;
}

// ═════════════════════════════════════════════════════════════════════════
// User Operations
// ═════════════════════════════════════════════════════════════════════════

export interface GetMembershipRenewalStatusResult extends MembershipRenewalStatus {}

export interface PreviewMembershipRenewalInput {
  optionalUpgradePackageId?: string;
}

export interface PreviewMembershipRenewalResult extends RenewalPreview {}

export interface InitiateUserAutoRenewalInput {
  optionalUpgradePackageId?: string;
}

export interface InitiateUserAutoRenewalResult extends ManualUserAutoRenewalResult {
  message: string;
}

export interface GetMembershipRenewalHistoryInput {
  limit?: number;
  page?: number;
}

// ═════════════════════════════════════════════════════════════════════════
// Audit & Logging
// ═════════════════════════════════════════════════════════════════════════

export type AutoRenewalAuditAction =
  | "AUTO_RENEWAL_BACKGROUND_JOB"
  | "MANUAL_AUTO_RENEWAL"
  | "BULK_AUTO_RENEWAL"
  | "AUTO_RENEWAL_JOB_SUMMARY";

export interface AutoRenewalAuditMetadata {
  renewalHistoryId?: string;
  newExpiresAt?: Date;
  totalRewardsDistributed?: RenewalRewards;
  daysExpired?: number;

  // For bulk operations
  processed?: number;
  failed?: number;
  totalCandidates?: number;
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  dryRun?: boolean;
  limit?: number;
  errorCount?: number;
  errors?: AutoRenewalJobError[];
}

// ═════════════════════════════════════════════════════════════════════════
// Service Functions Type Definition
// ═════════════════════════════════════════════════════════════════════════

export interface IMembershipAutoRenewalService {
  getMembershipHierarchyLevel(packageName: string): number;

  validateNoDowngrade(
    prismaLike: any,
    userId: string,
    newPackageId: string
  ): Promise<NoDowngradeValidation>;

  validateAutoRenewalEligibility(
    prismaLike: any,
    userId: string
  ): Promise<AutoRenewalEligibility>;

  getRenewalPackage(
    prismaLike: any,
    userId: string,
    optionalUpgradePackageId?: string
  ): Promise<RenewalPackageInfo>;

  processAutoRenewal(
    prismaLike: any,
    userId: string,
    optionalUpgradePackageId?: string
  ): Promise<AutoRenewalResult>;

  getAutoRenewalCandidates(
    prismaLike: any,
    limit?: number
  ): Promise<AutoRenewalCandidate[]>;
}
