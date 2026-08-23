import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendEmail } from "@/lib/email";

export type NotificationType = 
  | "MEMBERSHIP_ACTIVATED"
  | "MEMBERSHIP_RENEWED"
  | "MEMBERSHIP_EXPIRING"
  | "MEMBERSHIP_EXPIRED"
  | "REFERRAL_REWARD"
  | "YOUTUBE_REFERRAL_EARNING"
  | "EMPOWERMENT_ACTIVATED"
  | "EMPOWERMENT_MATURE"
  | "EMPOWERMENT_APPROVED"
  | "EMPOWERMENT_RELEASED"
  | "EMPOWERMENT_FALLBACK"
  | "EMPOWERMENT_CONVERTED"
  | "BPT_REWARD"
  | "ADMIN_ACTION_REQUIRED"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PROCESSING"
  | "DEPOSIT_COMPLETED"
  | "DEPOSIT_FAILED"
  | "WITHDRAWAL_PENDING"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_PROCESSING"
  | "WITHDRAWAL_COMPLETED"
  | "WITHDRAWAL_REJECTED"
  | "WITHDRAWAL_FAILED"
  | "CSP_REQUEST_SUBMITTED"
  | "CSP_REQUEST_APPROVED"
  | "CSP_REQUEST_REJECTED"
  | "CSP_BROADCAST_EXTENDED"
  | "CSP_BROADCAST_EXPIRING"
  | "CSP_CONTRIBUTION_RECEIVED"
  | "CSP_CONTRIBUTION_SENT"
  | "CSP_QUALIFICATION_MET"
  | "CSP_BROADCAST_COMPLETED"
  | "CSP_REQUEST_PROCESSED"
  // Elite Club
  | "ELITE_CLUB_ACTIVATED"
  | "ELITE_CLUB_APP_SUBMITTED"
  | "ELITE_CLUB_APP_APPROVED"
  | "ELITE_CLUB_APP_REJECTED"
  | "ELITE_CLUB_TOKEN_VERIFIED"
  | "ELITE_CLUB_CONTRIBUTION_RECORDED"
  | "ELITE_CLUB_PAYOUT_SCHEDULED"
  | "ELITE_CLUB_PAYOUT_RELEASED"
  | "ELITE_CLUB_PAYOUT_BLOCKED"
  | "ELITE_CLUB_SWAP_REQUEST"
  | "ELITE_CLUB_SWAP_ACCEPTED"
  | "ELITE_CLUB_SWAP_REJECTED"
  | "ELITE_CLUB_VOTE_OPEN"
  | "ELITE_CLUB_INVESTMENT_REJECTED"
  | "ELITE_CLUB_SUSPENDED"
  | "ELITE_CLUB_REINSTATED"
  // TechQuiz Competition
  | "TECHQUIZ_EVENT_PUBLISHED"
  | "TECHQUIZ_APPLICATION_SUBMITTED"
  | "TECHQUIZ_APPLICATION_SLOT_RESERVED"
  | "TECHQUIZ_APPLICATION_VERIFIED"
  | "TECHQUIZ_APPLICATION_REJECTED"
  | "TECHQUIZ_CBT_ACCESS_ISSUED"
  | "TECHQUIZ_ROUND1_RESULT"
  | "TECHQUIZ_QUALIFIER_NOTICE"
  | "TECHQUIZ_ROUND2_SCHEDULE"
  | "TECHQUIZ_ROUND2_RESULT"
  | "TECHQUIZ_FINAL_RESULTS_PUBLISHED"
  | "TECHQUIZ_WINNER_NOTIFICATION"
  | "TECHQUIZ_SPONSORSHIP_CONFIRMED"
  | "TECHQUIZ_SPONSORSHIP_ALLOCATED"
  | "TECHQUIZ_SCHOOL_QUOTA_FULL"
  | "TECHQUIZ_SCHOOL_MIN_NOT_REACHED"
  | "TECHQUIZ_COMPLIANCE_FLAG";

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/** Map notification types to user preference keys */
const NOTIF_TYPE_TO_PREF: Record<string, string> = {
  MEMBERSHIP_ACTIVATED: "packageReminders",
  MEMBERSHIP_RENEWED: "packageReminders",
  MEMBERSHIP_EXPIRING: "packageReminders",
  MEMBERSHIP_EXPIRED: "packageReminders",
  REFERRAL_REWARD: "referralUpdates",
  YOUTUBE_REFERRAL_EARNING: "referralUpdates",
  EMPOWERMENT_ACTIVATED: "referralUpdates",
  EMPOWERMENT_MATURE: "referralUpdates",
  EMPOWERMENT_APPROVED: "referralUpdates",
  EMPOWERMENT_RELEASED: "referralUpdates",
  EMPOWERMENT_FALLBACK: "referralUpdates",
  EMPOWERMENT_CONVERTED: "referralUpdates",
  DEPOSIT_PENDING: "transactionAlerts",
  DEPOSIT_PROCESSING: "transactionAlerts",
  DEPOSIT_COMPLETED: "transactionAlerts",
  DEPOSIT_FAILED: "transactionAlerts",
  WITHDRAWAL_PENDING: "transactionAlerts",
  WITHDRAWAL_APPROVED: "transactionAlerts",
  WITHDRAWAL_PROCESSING: "transactionAlerts",
  WITHDRAWAL_COMPLETED: "transactionAlerts",
  WITHDRAWAL_REJECTED: "transactionAlerts",
  WITHDRAWAL_FAILED: "transactionAlerts",
  CSP_REQUEST_SUBMITTED: "transactionAlerts",
  CSP_REQUEST_APPROVED: "transactionAlerts",
  CSP_REQUEST_REJECTED: "transactionAlerts",
  CSP_BROADCAST_EXTENDED: "transactionAlerts",
  CSP_BROADCAST_EXPIRING: "transactionAlerts",
  CSP_CONTRIBUTION_RECEIVED: "transactionAlerts",
  CSP_CONTRIBUTION_SENT: "transactionAlerts",
  CSP_QUALIFICATION_MET: "transactionAlerts",
  CSP_BROADCAST_COMPLETED: "transactionAlerts",
  CSP_REQUEST_PROCESSED: "transactionAlerts",
  TECHQUIZ_EVENT_PUBLISHED: "marketingEmails",
  TECHQUIZ_APPLICATION_SUBMITTED: "transactionAlerts",
  TECHQUIZ_APPLICATION_SLOT_RESERVED: "transactionAlerts",
  TECHQUIZ_APPLICATION_VERIFIED: "transactionAlerts",
  TECHQUIZ_APPLICATION_REJECTED: "transactionAlerts",
  TECHQUIZ_CBT_ACCESS_ISSUED: "transactionAlerts",
  TECHQUIZ_ROUND1_RESULT: "transactionAlerts",
  TECHQUIZ_QUALIFIER_NOTICE: "transactionAlerts",
  TECHQUIZ_ROUND2_SCHEDULE: "transactionAlerts",
  TECHQUIZ_ROUND2_RESULT: "transactionAlerts",
  TECHQUIZ_FINAL_RESULTS_PUBLISHED: "transactionAlerts",
  TECHQUIZ_WINNER_NOTIFICATION: "transactionAlerts",
  TECHQUIZ_SPONSORSHIP_CONFIRMED: "transactionAlerts",
  TECHQUIZ_SPONSORSHIP_ALLOCATED: "transactionAlerts",
  TECHQUIZ_SCHOOL_QUOTA_FULL: "transactionAlerts",
  TECHQUIZ_SCHOOL_MIN_NOT_REACHED: "transactionAlerts",
  TECHQUIZ_COMPLIANCE_FLAG: "securityAlerts",
  ELITE_CLUB_ACTIVATED: "packageReminders",
  ELITE_CLUB_APP_SUBMITTED: "transactionAlerts",
  ELITE_CLUB_APP_APPROVED: "transactionAlerts",
  ELITE_CLUB_APP_REJECTED: "transactionAlerts",
  ELITE_CLUB_TOKEN_VERIFIED: "transactionAlerts",
  ELITE_CLUB_CONTRIBUTION_RECORDED: "transactionAlerts",
  ELITE_CLUB_PAYOUT_SCHEDULED: "transactionAlerts",
  ELITE_CLUB_PAYOUT_RELEASED: "transactionAlerts",
  ELITE_CLUB_PAYOUT_BLOCKED: "transactionAlerts",
  ELITE_CLUB_SWAP_REQUEST: "transactionAlerts",
  ELITE_CLUB_SWAP_ACCEPTED: "transactionAlerts",
  ELITE_CLUB_SWAP_REJECTED: "transactionAlerts",
  ELITE_CLUB_VOTE_OPEN: "transactionAlerts",
  ELITE_CLUB_INVESTMENT_REJECTED: "transactionAlerts",
  ELITE_CLUB_SUSPENDED: "securityAlerts",
  ELITE_CLUB_REINSTATED: "securityAlerts",
  ADMIN_ACTION_REQUIRED: "securityAlerts",
  BPT_REWARD: "transactionAlerts",
};

/** Security-sensitive types that always send regardless of preferences */
const ALWAYS_SEND_TYPES = new Set<NotificationType>([
  "ADMIN_ACTION_REQUIRED",
]);

/** Check if the user has disabled this notification category */
async function isNotificationAllowed(userId: string, type: NotificationType): Promise<boolean> {
  // Security alerts always pass
  if (ALWAYS_SEND_TYPES.has(type)) return true;

  const prefKey = NOTIF_TYPE_TO_PREF[type];
  if (!prefKey) return true; // unmapped types default to allowed

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { notifications: true },
    });
    if (!settings) return true; // no settings = allow all
    const prefs = settings.notifications as Record<string, boolean>;
    // If the specific pref is explicitly false, block the notification
    if (prefs[prefKey] === false) return false;
    return true;
  } catch {
    // If UserSettings table doesn't exist or query fails, allow notification
    return true;
  }
}

export async function notifyCspRequestSubmitted(userId: string, category: string, amount: number) {
  await sendNotification({
    userId,
    type: "CSP_REQUEST_SUBMITTED",
    title: "CSP request submitted",
    message: `Your ${category} CSP request for ₦${amount.toLocaleString()} was submitted. Awaiting admin approval.`,
    actionUrl: "/csp",
  });
}

export async function notifyCspRequestApproved(userId: string, category: string, threshold: number, expiresAt?: Date | null) {
  await sendNotification({
    userId,
    type: "CSP_REQUEST_APPROVED",
    title: "CSP request approved",
    message: `Your ${category} CSP request is live. Threshold ₦${threshold.toLocaleString()}` + (expiresAt ? `, ends ${expiresAt.toLocaleString()}.` : "."),
    actionUrl: "/csp",
  });
}

export async function notifyCspContributionReceived(requestOwnerId: string, amount: number) {
  await sendNotification({
    userId: requestOwnerId,
    type: "CSP_CONTRIBUTION_RECEIVED",
    title: "Contribution received",
    message: `You received a CSP contribution of ₦${amount.toLocaleString()} to your community wallet.`,
    actionUrl: "/csp",
  });
}

export async function notifyCspContributionSent(contributorId: string, amount: number, walletType: string) {
  await sendNotification({
    userId: contributorId,
    type: "CSP_CONTRIBUTION_SENT",
    title: "Contribution sent",
    message: `You contributed ₦${amount.toLocaleString()} via ${walletType} wallet to a CSP request.`,
    actionUrl: "/csp",
  });
}

export async function notifyCspBroadcastExtended(userId: string, hours: number) {
  await sendNotification({
    userId,
    type: "CSP_BROADCAST_EXTENDED",
    title: "Broadcast extended",
    message: `Your CSP broadcast was extended by ${hours} hour(s).`,
    actionUrl: "/csp",
  });
}

export async function notifyCspBroadcastExpiring(userId: string, hoursLeft: number) {
  await sendNotification({
    userId,
    type: "CSP_BROADCAST_EXPIRING",
    title: `Broadcast ending in ${hoursLeft}h`,
    message: `Your CSP support broadcast will expire in ${hoursLeft} hour(s). Encourage your community to contribute before it ends.`,
    actionUrl: "/csp",
  });
}

export async function notifyCspRequestRejected(userId: string, category: string, reason: string) {
  await sendNotification({
    userId,
    type: "CSP_REQUEST_REJECTED",
    title: "CSP Request Rejected",
    message: `Your ${category} CSP request was rejected. Reason: ${reason}`,
    actionUrl: "/csp",
  });
}

/**
 * Send a notification to a user.
 * Returns true on success, false on failure. Logs errors but does not throw
 * so that notification failures don't break the calling business flow.
 */
export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    // Check user notification preferences before sending
    const allowed = await isNotificationAllowed(data.userId, data.type);
    if (!allowed) return true; // silently skip — user opted out

    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.actionUrl,
        isRead: false,
      },
    });
    return true;
  } catch (error) {
    console.error(`[NOTIFICATION] Failed to send notification (type=${data.type}, user=${data.userId}):`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Send notifications to multiple users.
 * Returns true on success, false on failure.
 */
export async function sendBulkNotifications(notifications: NotificationData[]): Promise<boolean> {
  try {
    // Filter out notifications the user has opted out of
    const allowed: NotificationData[] = [];
    for (const n of notifications) {
      const ok = await isNotificationAllowed(n.userId, n.type);
      if (ok) allowed.push(n);
    }
    if (allowed.length === 0) return true;

    await prisma.notification.createMany({
      data: allowed.map(n => ({
        id: randomUUID(),
        userId: n.userId,
        title: n.title,
        message: n.message,
        link: n.actionUrl,
        isRead: false,
      })),
    });
    return true;
  } catch (error) {
    console.error(`[NOTIFICATION] Failed to send bulk notifications (count=${notifications.length}):`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Notify user about membership activation
 */
export async function notifyMembershipActivation(
  userId: string,
  packageName: string,
  expiresAt: Date
) {
  await sendNotification({
    userId,
    type: "MEMBERSHIP_ACTIVATED",
    title: "Membership Activated! 🎉",
    message: `Your ${packageName} package has been activated successfully. Valid until ${expiresAt.toLocaleDateString()}.`,
    actionUrl: "/dashboard",
  });
}

/**
 * Notify user about membership renewal
 */
export async function notifyMembershipRenewal(
  userId: string,
  packageName: string,
  renewalNumber: number,
  expiresAt: Date
) {
  await sendNotification({
    userId,
    type: "MEMBERSHIP_RENEWED",
    title: "Membership Renewed! 🔄",
    message: `Your ${packageName} package has been renewed (Renewal #${renewalNumber}). Valid until ${expiresAt.toLocaleDateString()}.`,
    actionUrl: "/dashboard",
  });
}

/**
 * Notify user about upcoming expiry
 */
export async function notifyMembershipExpiring(
  userId: string,
  packageName: string,
  daysRemaining: number
) {
  await sendNotification({
    userId,
    type: "MEMBERSHIP_EXPIRING",
    title: "Membership Expiring Soon ⚠️",
    message: `Your ${packageName} package expires in ${daysRemaining} days. Renew now to continue enjoying benefits.`,
    actionUrl: "/membership",
  });
}

/**
 * Notify referrer about reward received
 */
export async function notifyReferralReward(
  referrerId: string,
  referreeName: string,
  rewardType: string,
  amount: number
) {
  await sendNotification({
    userId: referrerId,
    type: "REFERRAL_REWARD",
    title: "Referral Reward Received! 💰",
    message: `You earned ₦${amount.toLocaleString()} ${rewardType} from ${referreeName}'s membership activation.`,
    actionUrl: "/dashboard",
  });
}

export async function notifyYoutubeReferralEarning(
  referrerId: string,
  subscriberName: string,
  amount: number
) {
  await sendNotification({
    userId: referrerId,
    type: "YOUTUBE_REFERRAL_EARNING",
    title: "YouTube Referral Earning Received! 💰",
    message: `You earned ₦${amount.toLocaleString()} from ${subscriberName}'s YouTube subscription verification.`,
    actionUrl: "/dashboard",
  });
}

/**
 * Notify about empowerment package activation
 */
export async function notifyEmpowermentActivation(
  sponsorId: string,
  beneficiaryId: string,
  maturityDate: Date
) {
  // Notify sponsor
  await sendNotification({
    userId: sponsorId,
    type: "EMPOWERMENT_ACTIVATED",
    title: "Empowerment Package Activated! 🎓",
    message: `Your empowerment package has been activated. Maturity date: ${maturityDate.toLocaleDateString()} (24 months).`,
    actionUrl: "/empowerment",
  });

  // Notify beneficiary
  await sendNotification({
    userId: beneficiaryId,
    type: "EMPOWERMENT_ACTIVATED",
    title: "You're an Empowerment Beneficiary! 🎓",
    message: `An empowerment package has been activated for you. Funds will be available after 24 months.`,
    actionUrl: "/empowerment",
  });
}

/**
 * Notify about empowerment maturity
 */
export async function notifyEmpowermentMaturity(
  sponsorId: string,
  beneficiaryId: string,
  empowermentId: string
) {
  const notifications = [
    {
      userId: sponsorId,
      type: "EMPOWERMENT_MATURE" as NotificationType,
      title: "Empowerment Package Matured! ⏰",
      message: "Your empowerment package has reached 24-month maturity. Awaiting admin approval for fund release.",
      actionUrl: `/empowerment/${empowermentId}`,
    },
    {
      userId: beneficiaryId,
      type: "EMPOWERMENT_MATURE" as NotificationType,
      title: "Empowerment Funds Maturing! ⏰",
      message: "Your empowerment package has reached maturity. Funds will be released pending admin approval.",
      actionUrl: `/empowerment/${empowermentId}`,
    },
  ];

  await sendBulkNotifications(notifications);
}

/**
 * Notify about empowerment approval
 */
export async function notifyEmpowermentApproval(
  sponsorId: string,
  beneficiaryId: string,
  netBeneficiaryAmount: number,
  netSponsorAmount: number
) {
  const notifications = [
    {
      userId: sponsorId,
      type: "EMPOWERMENT_APPROVED" as NotificationType,
      title: "Empowerment Approved! ✅",
      message: `Your empowerment package has been approved by admin. You will receive ₦${netSponsorAmount.toLocaleString()}.`,
      actionUrl: "/empowerment",
    },
    {
      userId: beneficiaryId,
      type: "EMPOWERMENT_APPROVED" as NotificationType,
      title: "Empowerment Approved! ✅",
      message: `Your empowerment package has been approved! ₦${netBeneficiaryAmount.toLocaleString()} will be credited to your education wallet.`,
      actionUrl: "/empowerment",
    },
  ];

  await sendBulkNotifications(notifications);
}

/**
 * Notify about empowerment fund release
 */
export async function notifyEmpowermentRelease(
  sponsorId: string,
  beneficiaryId: string,
  beneficiaryAmount: number,
  sponsorAmount: number
) {
  const notifications = [
    {
      userId: sponsorId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: "Empowerment Funds Released! 💸",
      message: `₦${sponsorAmount.toLocaleString()} has been credited to your wallet. Congratulations!`,
      actionUrl: "/dashboard",
    },
    {
      userId: beneficiaryId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: "Education Funds Released! 💸",
      message: `₦${beneficiaryAmount.toLocaleString()} has been credited to your education wallet.`,
      actionUrl: "/dashboard",
    },
  ];

  await sendBulkNotifications(notifications);
}

/**
 * Send admin notification for empowerment requiring approval
 */
export async function notifyAdminEmpowermentPending(empowermentId: string, sponsorName: string) {
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });

  const notifications = admins.map(admin => ({
    userId: admin.id,
    type: "ADMIN_ACTION_REQUIRED" as NotificationType,
    title: "Empowerment Approval Required 📋",
    message: `Empowerment package from ${sponsorName} has reached maturity and requires approval.`,
    actionUrl: `/admin/empowerment/${empowermentId}`,
  }));

  await sendBulkNotifications(notifications);
}

/**
 * Notify sponsor + beneficiary when admin sets empowerment outcome
 */
export async function notifyEmpowermentOutcomeSet(
  sponsorId: string,
  beneficiaryId: string,
  outcomeType: string,
  creditedAmount: number
) {
  const outcomeLabel =
    outcomeType === "FULL_APPROVAL"          ? "Full Approval (100%)" :
    outcomeType === "PARTIAL_DECLINE_50"     ? "Partial Decline (50% credited)" :
    outcomeType === "PARTIAL_DECLINE_75"     ? "Partial Decline (25% credited)" :
    outcomeType === "PARTIAL_DECLINE_OTHER"  ? "Partial Decline (custom %)" :
    "Full Decline (0% credited)";

  const notifications = [
    {
      userId: sponsorId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: `Empowerment Outcome Set: ${outcomeLabel}`,
      message:
        outcomeType === "FULL_DECLINE"
          ? "A full decline has been recorded. Your subscription refund + interest will be credited to your Cash Wallet."
          : `Outcome confirmed. ₦${creditedAmount.toLocaleString()} will be credited to the beneficiary's education wallet.`,
      actionUrl: "/empowerment",
    },
    {
      userId: beneficiaryId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: `Your Empowerment Outcome: ${outcomeLabel}`,
      message:
        outcomeType === "FULL_DECLINE"
          ? "A full decline has been recorded for your empowerment package. Please contact your sponsor for details."
          : `₦${creditedAmount.toLocaleString()} has been approved for your education wallet.`,
      actionUrl: "/empowerment",
    },
  ];
  await sendBulkNotifications(notifications);
}

/**
 * Notify sponsor + beneficiary when a tranche is released (Full Approval staged release)
 */
export async function notifyEmpowermentTrancheReleased(
  sponsorId: string,
  beneficiaryId: string,
  trancheNumber: number,
  netAmount: number,
  remainingPercent: number
) {
  const notifications = [
    {
      userId: beneficiaryId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: `Tranche #${trancheNumber} Released 🎓`,
      message: `₦${netAmount.toLocaleString()} has been credited to your education wallet. ${remainingPercent > 0 ? `${remainingPercent}% remains to be released.` : "All tranches fully released!"}`,
      actionUrl: "/empowerment",
    },
    {
      userId: sponsorId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: `Empowerment Tranche #${trancheNumber} Released`,
      message: `₦${netAmount.toLocaleString()} released to beneficiary education wallet. ${remainingPercent > 0 ? `${remainingPercent}% still pending.` : "Full approval complete!"}`,
      actionUrl: "/empowerment",
    },
  ];
  await sendBulkNotifications(notifications);
}

/**
 * Notify sponsor when empowerment sponsor reward is credited
 */
export async function notifyEmpowermentSponsorReward(
  sponsorId: string,
  rewardAmount: number,
  outcomeType: string
) {
  await sendBulkNotifications([
    {
      userId: sponsorId,
      type: "EMPOWERMENT_RELEASED" as NotificationType,
      title: "Empowerment Sponsor Reward Credited 💰",
      message: `₦${rewardAmount.toLocaleString()} sponsor reward has been credited to your wallet for the ${outcomeType === "FULL_APPROVAL" ? "Full Approval" : "Partial Decline"} outcome.`,
      actionUrl: "/dashboard",
    },
  ]);
}

/**
 * Notify beneficiary when CSP waiver is activated on their empowerment package
 */
export async function notifyEmpowermentCspWaiverActivated(
  beneficiaryId: string,
  minThreshold: number
) {
  await sendBulkNotifications([
    {
      userId: beneficiaryId,
      type: "CSP_REQUEST_APPROVED" as NotificationType,
      title: "CSP Waiver Activated 🛡️",
      message: `A CSP Waiver has been activated for your empowerment package. You can transfer from your education wallet to meet the minimum contribution threshold of ₦${minThreshold.toLocaleString()} and submit a CSP request.`,
      actionUrl: "/csp",
    },
  ]);
}

/**
 * Notify all admins that an empowerment package has reached maturity but no outcome has been set (24h+ reminder).
 */
export async function notifyAdminOutcomeNotSet(
  packageId: string,
  beneficiaryName: string,
  maturityDate: Date
) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "super_admin"] } },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await sendBulkNotifications(
    admins.map((a) => ({
      userId: a.id,
      type: "SYSTEM_ANNOUNCEMENT" as NotificationType,
      title: "⚠️ Empowerment Outcome Pending",
      message: `Package for ${beneficiaryName} matured on ${maturityDate.toLocaleDateString()} and no outcome has been set yet. Please review and set an outcome.`,
      actionUrl: `/admin/empowerment?pkg=${packageId}`,
    }))
  );
}

/**
 * Notify user about deposit status
 */
export async function notifyDepositStatus(
  userId: string,
  status: "pending" | "processing" | "completed" | "failed",
  amount: number,
  reference: string,
  receiptUrl?: string
) {
  const statusConfig = {
    pending: {
      type: "DEPOSIT_PENDING" as NotificationType,
      title: "Deposit Initiated 💰",
      message: `Your deposit of ₦${amount.toLocaleString()} is pending confirmation. Reference: ${reference}`,
    },
    processing: {
      type: "DEPOSIT_PROCESSING" as NotificationType,
      title: "Deposit Processing ⏳",
      message: `Your deposit of ₦${amount.toLocaleString()} is being processed. This may take a few moments.`,
    },
    completed: {
      type: "DEPOSIT_COMPLETED" as NotificationType,
      title: "Deposit Successful! ✅",
      message: `₦${amount.toLocaleString()} has been successfully credited to your wallet. ${receiptUrl ? 'Download your receipt.' : ''}`,
    },
    failed: {
      type: "DEPOSIT_FAILED" as NotificationType,
      title: "Deposit Failed ❌",
      message: `Your deposit of ₦${amount.toLocaleString()} could not be processed. Please try again or contact support.`,
    },
  };

  const config = statusConfig[status];
  
  await sendNotification({
    userId,
    type: config.type,
    title: config.title,
    message: config.message,
    actionUrl: receiptUrl || "/dashboard",
  });

  if (status !== "completed" && status !== "failed") {
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return;
    }

    const safeName = user.name || "Member";
    const subject = status === "completed"
      ? "Your BPI deposit has been completed"
      : "Your BPI deposit could not be completed";
    const receiptLine = receiptUrl
      ? `<p><strong>Receipt:</strong> <a href="${receiptUrl}">View receipt</a></p>`
      : "";
    const html = status === "completed"
      ? `
        <p>Hello ${safeName},</p>
        <p>Your deposit of <strong>₦${amount.toLocaleString()}</strong> has been successfully credited to your wallet.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        ${receiptLine}
        <p>You can view the updated balance in your dashboard.</p>
      `
      : `
        <p>Hello ${safeName},</p>
        <p>Your deposit of <strong>₦${amount.toLocaleString()}</strong> could not be completed automatically.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p>Please try again or contact support if funds were already sent.</p>
      `;

    await sendEmail({
      to: user.email,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[NOTIFICATION] Failed to send deposit status email (user=${userId}, status=${status}, ref=${reference}):`, error instanceof Error ? error.message : error);
  }
}

/**
 * Notify user about withdrawal status
 */
export async function notifyWithdrawalStatus(
  userId: string,
  status: "pending" | "approved" | "processing" | "completed" | "rejected" | "failed",
  amount: number,
  reference: string,
  receiptUrl?: string
) {
  const statusConfig = {
    pending: {
      type: "WITHDRAWAL_PENDING" as NotificationType,
      title: "Withdrawal Submitted 📤",
      message: `Your withdrawal request of ₦${amount.toLocaleString()} is pending approval. Reference: ${reference}`,
    },
    approved: {
      type: "WITHDRAWAL_APPROVED" as NotificationType,
      title: "Withdrawal Approved ✅",
      message: `Your withdrawal of ₦${amount.toLocaleString()} has been approved and will be processed shortly.`,
    },
    processing: {
      type: "WITHDRAWAL_PROCESSING" as NotificationType,
      title: "Withdrawal Processing ⏳",
      message: `Your withdrawal of ₦${amount.toLocaleString()} is being processed. Funds will arrive shortly.`,
    },
    completed: {
      type: "WITHDRAWAL_COMPLETED" as NotificationType,
      title: "Withdrawal Completed! 💸",
      message: `₦${amount.toLocaleString()} has been successfully transferred. ${receiptUrl ? 'Download your receipt.' : ''}`,
    },
    rejected: {
      type: "WITHDRAWAL_REJECTED" as NotificationType,
      title: "Withdrawal Rejected ⚠️",
      message: `Your withdrawal request of ₦${amount.toLocaleString()} was rejected. Funds have been returned to your wallet.`,
    },
    failed: {
      type: "WITHDRAWAL_FAILED" as NotificationType,
      title: "Withdrawal Failed ❌",
      message: `Your withdrawal of ₦${amount.toLocaleString()} could not be processed. Funds have been returned to your wallet.`,
    },
  };

  const config = statusConfig[status];
  
  await sendNotification({
    userId,
    type: config.type,
    title: config.title,
    message: config.message,
    actionUrl: receiptUrl || "/dashboard",
  });
}
// ─── Elite Club Notification Helpers ─────────────────────────────────────────

export async function notifyEliteClubActivated(userId: string, clubName: string, tier: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_ACTIVATED", title: "Your Elite Club is Now Active!", message: `Your ${tier} tier Elite Club "${clubName}" has been activated. Your empowerment rotation begins now.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubAppApproved(userId: string, tier: string, rotationNumber: number, clubName: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_APP_APPROVED", title: "Elite Club Application Approved!", message: `Congratulations! You have been assigned rotation #${rotationNumber} in "${clubName}" ${tier} Elite Club.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubAppRejected(userId: string, tier: string, reason: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_APP_REJECTED", title: "Elite Club Application Rejected", message: `Your ${tier} tier Elite Club application was not approved. Reason: ${reason}`, actionUrl: "/elite-club/application" });
}

export async function notifyEliteClubTokenVerified(userId: string, tier: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_TOKEN_VERIFIED", title: "Token Holdings Verified", message: `Your BPT/PACToken holdings for ${tier} tier have been verified.`, actionUrl: "/elite-club/application" });
}

export async function notifyEliteClubContributionRecorded(userId: string, amount: number, month: number, year: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_CONTRIBUTION_RECORDED", title: "Monthly Contribution Recorded", message: `Your ₦${amount.toLocaleString()} Elite Club contribution for ${month}/${year} has been recorded.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubPayoutScheduled(userId: string, amount: number, month: number, year: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_PAYOUT_SCHEDULED", title: "Empowerment Payout Scheduled", message: `Your empowerment payout of ₦${amount.toLocaleString()} is scheduled for ${month}/${year}.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubPayoutReleased(userId: string, amount: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_PAYOUT_RELEASED", title: "Empowerment Payout Released!", message: `Your empowerment payout of ₦${amount.toLocaleString()} has been released to your wallet. Congratulations!`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubPayoutBlocked(userId: string, amount: number, reason: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_PAYOUT_BLOCKED", title: "Empowerment Payout Blocked", message: `Your empowerment payout of ₦${amount.toLocaleString()} has been blocked. Reason: ${reason}`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubSwapRequest(userId: string, fromRotation: number, toRotation: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_SWAP_REQUEST", title: "Rotation Swap Request", message: `A member has requested to swap rotation numbers with you (#${fromRotation} ↔ #${toRotation}).`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubSwapAccepted(userId: string, newRotation: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_SWAP_ACCEPTED", title: "Rotation Swap Accepted", message: `Your rotation swap request was accepted. You are now at rotation #${newRotation}.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubSwapRejected(userId: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_SWAP_REJECTED", title: "Rotation Swap Declined", message: `Your rotation swap request was declined.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubVoteOpen(userId: string, investmentTitle: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_VOTE_OPEN", title: "Investment Vote Open", message: `"${investmentTitle}" is open for vote. Review the legal documents and cast your vote.`, actionUrl: "/elite-club/investments" });
}

export async function notifyEliteClubInvestmentRejected(userId: string, title: string, reason?: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_INVESTMENT_REJECTED", title: "Investment Recommendation Rejected", message: `Your investment "${title}" was not approved.${reason ? ` Reason: ${reason}` : ""}`, actionUrl: "/elite-club/investments" });
}

export async function notifyEliteClubSuspended(userId: string, defaultCount: number) {
  await sendNotification({ userId, type: "ELITE_CLUB_SUSPENDED", title: "Elite Club Membership Suspended", message: `Your membership has been suspended due to ${defaultCount} recorded defaults.`, actionUrl: "/elite-club" });
}

export async function notifyEliteClubReinstated(userId: string) {
  await sendNotification({ userId, type: "ELITE_CLUB_REINSTATED", title: "Elite Club Membership Reinstated", message: `Your Elite Club membership has been reinstated. Welcome back!`, actionUrl: "/elite-club" });
}

export async function sendCspLifecycleEmail(
  userEmail: string,
  stage: "received" | "processed",
  details: {
    category: string;
    amount: number;
    status: string;
    requestedAmount?: number;
    totalRaised?: number;
    fullyFunded?: boolean;
    shares?: { recipient: number; admin: number; sponsor: number; state: number; management: number; reserve: number };
  },
) {
  const subject = stage === "received" ? "CSP: Request received" : "CSP: Request processed";
  const isRelease = details.status === "released" && details.shares;
  let html = `<h2>${stage === "received" ? "Your CSP Support Request Has Been Received" : "Your CSP Support Request Has Been Processed"}</h2>`;
  html += `<p>Category: ${details.category}</p>`;
  if (isRelease) {
    html += `<p>Original Requested Amount: ₦${(details.requestedAmount ?? 0).toLocaleString()}</p>`;
    html += `<p>Total Raised: ₦${(details.totalRaised ?? 0).toLocaleString()}</p>`;
    html += `<p><strong>Amount Released to Your Wallet: ₦${details.amount.toLocaleString()}</strong></p>`;
    html += `<p>Fully Funded: ${details.fullyFunded ? "Yes" : "No"}</p>`;
    html += `<p>Status: ${details.status}</p>`;
    if (details.shares) {
      html += `<h4>Distribution Summary</h4><ul>`;
      html += `<li>Recipient (You): ₦${details.shares.recipient.toLocaleString()}</li>`;
      html += `<li>BPI Profit Pool: ₦${details.shares.admin.toLocaleString()}</li>`;
      html += `<li>Sponsor Reward: ₦${details.shares.sponsor.toLocaleString()}</li>`;
      html += `<li>State Wallet: ₦${details.shares.state.toLocaleString()}</li>`;
      html += `<li>Management: ₦${details.shares.management.toLocaleString()}</li>`;
      html += `<li>Reserve: ₦${details.shares.reserve.toLocaleString()}</li>`;
      html += `</ul>`;
    }
  } else {
    html += `<p>Amount: ₦${details.amount.toLocaleString()}</p>`;
    html += `<p>Status: ${details.status}</p>`;
  }
  html += `<p>You can track your request status on your CSP dashboard.</p>`;
  await sendEmail({ to: userEmail, subject, html });
}

export async function notifyCspRequestReceived(userId: string, category: string, amount: number) {
  await sendNotification({ userId, type: "CSP_REQUEST_PROCESSED", title: "CSP: Request received", message: `Your ${category} support request for ₦${amount.toLocaleString()} has been received and is pending review.`, actionUrl: "/csp" });
}

export async function notifyCspRequestProcessed(userId: string, category: string, amount: number, status: string) {
  await sendNotification({ userId, type: "CSP_BROADCAST_COMPLETED", title: "CSP: Request processed", message: `Your ${category} support request for ₦${amount.toLocaleString()} has been processed. Status: ${status}.`, actionUrl: "/csp" });
}