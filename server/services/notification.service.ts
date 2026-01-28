import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

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
  | "CSP_BROADCAST_EXTENDED"
  | "CSP_CONTRIBUTION_RECEIVED"
  | "CSP_CONTRIBUTION_SENT";

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
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

/**
 * Send a notification to a user
 */
export async function sendNotification(data: NotificationData) {
  try {
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
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotifications(notifications: NotificationData[]) {
  try {
    await prisma.notification.createMany({
      data: notifications.map(n => ({
        id: randomUUID(),
        userId: n.userId,
        title: n.title,
        message: n.message,
        link: n.actionUrl,
        isRead: false,
      })),
    });
  } catch (error) {
    console.error("Failed to send bulk notifications:", error);
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
