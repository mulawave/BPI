// NOTE: VSCode may show TypeScript errors for prisma.auditLog, prisma.pendingPayment, 
// prisma.paymentGatewayConfig, and prisma.adminNotificationSettings due to stale cache.
// These models exist in schema.prisma and build passes successfully.
// Run: npx prisma generate && restart VSCode to fix.

import { z } from "zod";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { hash } from "bcryptjs";
import {
  activateMembershipAfterExternalPayment,
  upgradeMembershipAfterExternalPayment,
} from "@/server/services/membershipPayments.service";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { initiateBankTransfer } from "@/lib/flutterwave";
import { notifyWithdrawalStatus, notifyDepositStatus } from "@/server/services/notification.service";
import { generateReceiptLink } from "@/server/services/receipt.service";
import { sendWithdrawalApprovedToUser, sendWithdrawalRejectedToUser } from "@/lib/email";
import { recordRevenue } from "@/server/services/revenue.service";
import { getNigerianRegion } from "@/lib/nigeria-regions";
import { verifyBasqetUsdtPayout } from "@/server/services/payment/BasqetClient";
import { impersonationCreationLimiter } from "@/lib/rateLimit";
import { executeAdminPaymentReview } from "@/server/services/payment/adminPaymentReview";
import { executeReferralSync } from "@/server/services/referralSync.service";
import { deriveMembershipExpiry } from "@/lib/membershipAccess";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error("UNAUTHORIZED: You must be an admin to perform this action.");
  }
  return next();
});

const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }
  const userRole = (ctx.session.user as any).role;
  if (userRole !== "super_admin") {
    throw new Error("UNAUTHORIZED: You must be a super admin to perform this action.");
  }
  return next();
});

function generateSscCode(): string {
  const segment = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36).toUpperCase()).join("");

  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

function normalizeSsc(input: string): string {
  return input.trim().toUpperCase();
}

// ── Newsletter Background Job Tracking ──────────────────────────────
interface SentEmailEntry {
  email: string;
  name: string;
  sentAt: number;
}

interface FailedEmailEntry {
  email: string;
  name: string;
  error: string;
  failedAt: number;
}

interface ErrorLogEntry {
  message: string;
  email: string;
  timestamp: number;
  attempt: number;
}

interface NewsletterJobState {
  jobId: string;
  status: 'running' | 'completed' | 'error' | 'cancelled';
  sent: number;
  failed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  startedAt: number;
  lastError: string | null;
  // Granular tracking
  currentEmail: string | null;
  sentEmails: SentEmailEntry[];
  failedEmails: FailedEmailEntry[];
  errorLog: ErrorLogEntry[];
  failedRecipients: string[]; // kept for backward compat
  // Resume support
  campaignConfig: {
    filter: string;
    membershipPackage?: string;
    fromEmail: string;
    replyToEmail: string;
    subject: string;
    body: string;
    attachments?: { filename: string; content: string }[];
    embeddedImages?: { id: string; content: string; position: number }[];
    sendRate: { batchSize: number; delayBetweenEmailsMs: number; delayBetweenBatchesMs: number; warmUp: boolean };
  } | null;
  allRecipientIds: string[];
  sentRecipientIds: Set<string>;
}

interface DurableNewsletterCampaign {
  id: string;
  jobId: string;
  adminId: string;
  status: string;
  scheduledFor: Date | null;
  subject: string;
  body: string;
  filter: string;
  membershipPackage: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  attachments: Prisma.JsonValue;
  embeddedImages: Prisma.JsonValue;
  batchSize: number;
  delayBetweenMs: number;
  batchCooldownMs: number;
  warmUp: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  elapsedMs: number;
  lastError: string | null;
  sentEmails: Prisma.JsonValue;
  failedEmails: Prisma.JsonValue;
  errorLog: Prisma.JsonValue;
  sentRecipientIds: Prisma.JsonValue;
  allRecipientIds: Prisma.JsonValue;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterJobs = new Map<string, NewsletterJobState>();
const newsletterCampaignStore = prisma.newsletterCampaign as any;
let newsletterRestoreStarted = false;
let newsletterSchedulerStarted = false;
let newsletterRuntimeStarted = false;

// Clean up completed jobs older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of newsletterJobs) {
    if (job.status !== 'running' && job.startedAt < oneHourAgo) {
      newsletterJobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

// Sync in-memory job state to database periodically
async function syncJobToDb(job: NewsletterJobState) {
  try {
    await newsletterCampaignStore.update({
      where: { jobId: job.jobId },
      data: {
        status: job.status,
        sentCount: job.sent,
        failedCount: job.failed,
        elapsedMs: Date.now() - job.startedAt,
        lastError: job.lastError,
        sentEmails: job.sentEmails.slice(-200) as any, // keep last 200 in DB
        failedEmails: job.failedEmails as any,
        errorLog: job.errorLog.slice(-200) as any,
        sentRecipientIds: Array.from(job.sentRecipientIds) as any,
        completedAt: job.status !== 'running' ? new Date() : null,
      },
    });
  } catch (err) {
    console.error(`[NEWSLETTER] Failed to sync job ${job.jobId} to DB:`, err);
  }
}

function buildNewsletterCampaignConfig(campaign: {
  filter: string;
  membershipPackage: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  subject: string;
  body: string;
  attachments?: unknown;
  embeddedImages?: unknown;
  batchSize: number;
  delayBetweenMs: number;
  batchCooldownMs: number;
  warmUp: boolean;
}) {
  return {
    filter: campaign.filter,
    membershipPackage: campaign.membershipPackage || undefined,
    fromEmail: campaign.fromEmail || 'noreply@beepagro.com',
    replyToEmail: campaign.replyToEmail || 'support@beepagro.com',
    subject: campaign.subject,
    body: campaign.body,
    attachments: Array.isArray(campaign.attachments) ? (campaign.attachments as { filename: string; content: string }[]) : [],
    embeddedImages: Array.isArray(campaign.embeddedImages) ? (campaign.embeddedImages as { id: string; content: string; position: number }[]) : [],
    sendRate: {
      batchSize: campaign.batchSize,
      delayBetweenEmailsMs: campaign.delayBetweenMs,
      delayBetweenBatchesMs: campaign.batchCooldownMs,
      warmUp: campaign.warmUp,
    },
  };
}

function restoreNewsletterJobState(campaign: {
  jobId: string;
  status: string;
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  elapsedMs: number;
  lastError: string | null;
  sentEmails: unknown;
  failedEmails: unknown;
  errorLog: unknown;
  sentRecipientIds: unknown;
  allRecipientIds: unknown;
  filter: string;
  membershipPackage: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  subject: string;
  body: string;
  attachments: unknown;
  embeddedImages: unknown;
  batchSize: number;
  delayBetweenMs: number;
  batchCooldownMs: number;
  warmUp: boolean;
  startedAt: Date;
}): NewsletterJobState {
  const sentEmails = Array.isArray(campaign.sentEmails) ? (campaign.sentEmails as SentEmailEntry[]) : [];
  const failedEmails = Array.isArray(campaign.failedEmails) ? (campaign.failedEmails as FailedEmailEntry[]) : [];
  const errorLog = Array.isArray(campaign.errorLog) ? (campaign.errorLog as ErrorLogEntry[]) : [];
  const sentRecipientIds = Array.isArray(campaign.sentRecipientIds) ? (campaign.sentRecipientIds as string[]) : [];
  const allRecipientIds = Array.isArray(campaign.allRecipientIds) ? (campaign.allRecipientIds as string[]) : [];

  return {
    jobId: campaign.jobId,
    status: (campaign.status as NewsletterJobState['status']) || 'error',
    sent: campaign.sentCount,
    failed: campaign.failedCount,
    total: campaign.totalRecipients,
    currentBatch: 0,
    totalBatches: 0,
    startedAt: campaign.startedAt.getTime(),
    lastError: campaign.lastError,
    currentEmail: null,
    sentEmails,
    failedEmails,
    errorLog,
    failedRecipients: failedEmails.map((entry) => entry.email),
    campaignConfig: buildNewsletterCampaignConfig(campaign),
    allRecipientIds,
    sentRecipientIds: new Set(sentRecipientIds),
  };
}

function buildNewsletterProgressSnapshot(job: NewsletterJobState, sentSince = 0) {
  const newSentEmails = sentSince > 0
    ? job.sentEmails.filter((entry) => entry.sentAt > sentSince)
    : job.sentEmails.slice(-50);
  const newFailedEmails = sentSince > 0
    ? job.failedEmails.filter((entry) => entry.failedAt > sentSince)
    : job.failedEmails;
  const newErrorLog = sentSince > 0
    ? job.errorLog.filter((entry) => entry.timestamp > sentSince)
    : job.errorLog.slice(-100);

  return {
    status: job.status,
    jobId: job.jobId,
    sent: job.sent,
    failed: job.failed,
    total: job.total,
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    lastError: job.lastError,
    currentEmail: job.currentEmail,
    sentEmails: newSentEmails,
    failedEmails: newFailedEmails,
    errorLog: newErrorLog,
    failedRecipients: job.failedRecipients,
    elapsedMs: Date.now() - job.startedAt,
    canResume: (job.status === 'cancelled' || job.status === 'error') && job.sent < job.total,
  };
}

async function getNewsletterCompanyInfo() {
  const companySettings = await prisma.adminSettings.findMany();
  return Object.fromEntries(
    companySettings.map((setting: any) => [setting.settingKey, { value: setting.settingValue, description: setting.description }])
  );
}

function getNewsletterRecipientWhere(filter: string, membershipPackage?: string | null) {
  const where: any = {};

  if (filter === 'activated') {
    where.activated = true;
  } else if (filter === 'non-activated') {
    where.activated = false;
  } else if (filter === 'membership' && membershipPackage) {
    where.activeMembershipPackageId = membershipPackage;
  }

  return where;
}

async function getNewsletterRecipients(filter: string, membershipPackage?: string | null) {
  const recipients = await prisma.user.findMany({
    where: getNewsletterRecipientWhere(filter, membershipPackage),
    select: { id: true, email: true, name: true },
  });

  return recipients.filter((recipient: any): recipient is typeof recipient & { email: string } => !!recipient.email);
}

async function launchNewsletterCampaign(
  campaign: {
    id: string;
    jobId: string;
    adminId: string;
    status: string;
    filter: string;
    membershipPackage: string | null;
    fromEmail: string | null;
    replyToEmail: string | null;
    subject: string;
    body: string;
    attachments: unknown;
    embeddedImages: unknown;
    batchSize: number;
    delayBetweenMs: number;
    batchCooldownMs: number;
    warmUp: boolean;
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    elapsedMs: number;
    lastError: string | null;
    sentEmails: unknown;
    failedEmails: unknown;
    errorLog: unknown;
    sentRecipientIds: unknown;
    allRecipientIds: unknown;
    startedAt: Date;
  },
  options?: { recipients?: { id: string; email: string; name: string | null }[] }
) {
  if (newsletterJobs.has(campaign.jobId)) {
    return;
  }

  const companyInfo = await getNewsletterCompanyInfo();
  const job = restoreNewsletterJobState(campaign);
  const validRecipients = options?.recipients ?? (await getNewsletterRecipients(campaign.filter, campaign.membershipPackage));

  if (!job.allRecipientIds.length) {
    job.allRecipientIds = validRecipients.map((recipient) => recipient.id);
  }

  const remainingRecipients = validRecipients.filter((recipient) => !job.sentRecipientIds.has(recipient.id));

  job.total = job.allRecipientIds.length;
  newsletterJobs.set(job.jobId, job);

  await newsletterCampaignStore.update({
    where: { id: campaign.id },
    data: {
      status: 'running',
      totalRecipients: job.total,
      allRecipientIds: job.allRecipientIds as any,
      scheduledFor: null,
      lastError: null,
    },
  });

  if (!remainingRecipients.length) {
    job.status = 'completed';
    await syncJobToDb(job);
    return;
  }

  processNewsletterInBackground(job.jobId, {
    validRecipients: remainingRecipients,
    fromEmail: job.campaignConfig?.fromEmail || 'noreply@beepagro.com',
    replyToEmail: job.campaignConfig?.replyToEmail || 'support@beepagro.com',
    subject: job.campaignConfig?.subject || campaign.subject,
    body: job.campaignConfig?.body || campaign.body,
    attachments: job.campaignConfig?.attachments,
    embeddedImages: job.campaignConfig?.embeddedImages,
    companyInfo,
    sendRate: job.campaignConfig?.sendRate || {
      batchSize: campaign.batchSize,
      delayBetweenEmailsMs: campaign.delayBetweenMs,
      delayBetweenBatchesMs: campaign.batchCooldownMs,
      warmUp: campaign.warmUp,
    },
    adminUserId: campaign.adminId,
  }).catch(async (error) => {
    const runningJob = newsletterJobs.get(job.jobId);
    if (runningJob) {
      runningJob.status = 'error';
      runningJob.lastError = error instanceof Error ? error.message : 'Unknown newsletter execution error';
      await syncJobToDb(runningJob);
    }
  });
}

async function restoreRunningNewsletterJobs() {
  if (newsletterRestoreStarted) return;
  newsletterRestoreStarted = true;

  try {
    const runningCampaigns = await newsletterCampaignStore.findMany({
      where: { status: 'running' },
      orderBy: { createdAt: 'asc' },
    }) as DurableNewsletterCampaign[];

    if (!runningCampaigns.length) return;

    for (const campaign of runningCampaigns) {
      const recipientIds = Array.isArray(campaign.allRecipientIds) ? (campaign.allRecipientIds as string[]) : [];
      const recipients = recipientIds.length
        ? await prisma.user.findMany({
            where: { id: { in: recipientIds } },
            select: { id: true, email: true, name: true },
          })
        : [];

      await launchNewsletterCampaign(campaign as any, {
        recipients: recipients.filter((recipient: any): recipient is typeof recipient & { email: string } => !!recipient.email),
      });
    }
  } catch (error) {
    console.error('[NEWSLETTER] Failed to restore running campaigns:', error);
  }
}

async function processScheduledNewsletterCampaigns() {
  if (newsletterSchedulerStarted) return;
  newsletterSchedulerStarted = true;

  const runScheduler = async () => {
    try {
      const now = new Date();
      const dueCampaigns = await newsletterCampaignStore.findMany({
        where: {
          status: 'scheduled',
          scheduledFor: { lte: now },
        },
        orderBy: { scheduledFor: 'asc' },
      }) as DurableNewsletterCampaign[];

      for (const campaign of dueCampaigns) {
        const claimed = await newsletterCampaignStore.updateMany({
          where: {
            id: campaign.id,
            status: 'scheduled',
          },
          data: {
            status: 'running',
            startedAt: now,
            completedAt: null,
            lastError: null,
          },
        });

        if (claimed.count !== 1) {
          continue;
        }

        const refreshed = await newsletterCampaignStore.findUnique({ where: { id: campaign.id } }) as DurableNewsletterCampaign | null;
        if (!refreshed) {
          continue;
        }

        const recipients = await getNewsletterRecipients(refreshed.filter, refreshed.membershipPackage);
        await launchNewsletterCampaign(refreshed as any, { recipients });
      }
    } catch (error) {
      console.error('[NEWSLETTER] Scheduled campaign processor failed:', error);
    }
  };

  void runScheduler();
  setInterval(() => {
    void runScheduler();
  }, 60 * 1000);
}

export function startNewsletterRuntime() {
  if (newsletterRuntimeStarted) return;
  newsletterRuntimeStarted = true;

  void restoreRunningNewsletterJobs();
  void processScheduledNewsletterCampaigns();
}

async function processNewsletterInBackground(
  jobId: string,
  opts: {
    validRecipients: { id: string; email: string; name: string | null }[];
    fromEmail: string;
    replyToEmail: string;
    subject: string;
    body: string;
    attachments?: { filename: string; content: string }[];
    embeddedImages?: { id: string; content: string; position: number }[];
    companyInfo: any;
    sendRate: { batchSize: number; delayBetweenEmailsMs: number; delayBetweenBatchesMs: number; warmUp: boolean };
    adminUserId: string;
  }
) {
  const job = newsletterJobs.get(jobId);
  if (!job) return;

  const isCancelled = () => (newsletterJobs.get(jobId)?.status as string) === 'cancelled';

  const { validRecipients, fromEmail, replyToEmail, subject, body, attachments, embeddedImages, companyInfo, sendRate, adminUserId } = opts;
  const { sendBulkEmail, closeBulkTransporter } = await import('@/lib/email');

  // Warm-up: start with smaller first batch, then ramp up
  const firstBatchSize = sendRate.warmUp ? Math.min(3, sendRate.batchSize) : sendRate.batchSize;
  const batchSize = sendRate.batchSize;

  // Split recipients into batches with warm-up
  const batches: typeof validRecipients[] = [];
  let cursor = 0;
  // First batch (warm-up)
  batches.push(validRecipients.slice(0, firstBatchSize));
  cursor = firstBatchSize;
  // Remaining batches at full size
  while (cursor < validRecipients.length) {
    batches.push(validRecipients.slice(cursor, cursor + batchSize));
    cursor += batchSize;
  }

  job.totalBatches = batches.length;
  console.log(`📧 [NEWSLETTER] Job ${jobId}: ${job.total} recipients in ${batches.length} batches (warm-up: ${sendRate.warmUp})`);

  const attachmentData = attachments?.map(att => ({
    filename: att.filename,
    content: att.content.split(',')[1],
    encoding: 'base64' as const,
  }));

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    // Check for cancellation
    if (isCancelled()) {
      console.log(`🚫 [NEWSLETTER] Job ${jobId} cancelled at batch ${bIdx + 1}`);
      break;
    }

    const batch = batches[bIdx];
    job.currentBatch = bIdx + 1;
    console.log(`📦 [NEWSLETTER] Job ${jobId}: batch ${bIdx + 1}/${batches.length} (${batch.length} emails)`);

    for (const recipient of batch) {
      if (isCancelled()) break;

      job.currentEmail = recipient.email;

      const MAX_RETRIES = 2;
      let sent = false;

      for (let attempt = 0; attempt <= MAX_RETRIES && !sent; attempt++) {
        try {
          const emailHtml = buildNewsletterEmail({
            userName: recipient.name || 'User',
            subject,
            body,
            companyInfo,
            embeddedImages: embeddedImages || [],
          });

          await sendBulkEmail({
            to: recipient.email,
            from: fromEmail,
            replyTo: replyToEmail,
            subject,
            html: emailHtml,
            attachments: attachmentData,
          });

          job.sent++;
          job.sentEmails.push({ email: recipient.email, name: recipient.name || 'User', sentAt: Date.now() });
          job.sentRecipientIds.add(recipient.id);
          sent = true;
        } catch (err: any) {
          const errMsg = err?.message || 'Unknown';
          job.errorLog.push({ message: errMsg, email: recipient.email, timestamp: Date.now(), attempt: attempt + 1 });

          if (attempt >= MAX_RETRIES) {
            job.failed++;
            job.failedRecipients.push(recipient.email);
            job.failedEmails.push({ email: recipient.email, name: recipient.name || 'User', error: errMsg, failedAt: Date.now() });
            job.lastError = errMsg;
            console.error(`❌ [NEWSLETTER] Job ${jobId}: failed ${recipient.email} after ${MAX_RETRIES + 1} attempts:`, errMsg);
          } else {
            // Exponential backoff before retry
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)));
          }
        }
      }

      job.currentEmail = null;

      await syncJobToDb(job);

      // Random jitter delay between emails (anti-spam)
      const jitter = sendRate.delayBetweenEmailsMs + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, jitter));
    }

    // Batch cooldown (except last batch)
    if (bIdx < batches.length - 1 && !isCancelled()) {
      const cooldown = sendRate.delayBetweenBatchesMs + Math.floor(Math.random() * 5000);
      console.log(`⏳ [NEWSLETTER] Job ${jobId}: batch cooldown ${Math.round(cooldown / 1000)}s`);
      await new Promise(r => setTimeout(r, cooldown));
    }
  }

  // Close the pooled transporter
  closeBulkTransporter();

  if (isCancelled()) {
    console.log(`🚫 [NEWSLETTER] Job ${jobId} finished (cancelled). Sent: ${job.sent}, Failed: ${job.failed}`);
  } else {
    job.status = 'completed';
    console.log(`✅ [NEWSLETTER] Job ${jobId} complete. Sent: ${job.sent}, Failed: ${job.failed}, Total: ${job.total}`);
  }

  // Final sync to database
  await syncJobToDb(job);

  // Audit log for the campaign
  try {
    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        userId: adminUserId,
        action: 'NEWSLETTER_CAMPAIGN_COMPLETE',
        entity: 'newsletter',
        entityId: jobId,
        status: job.failed > 0 ? 'warning' : 'success',
        metadata: {
          subject: opts.subject,
          sent: job.sent,
          failed: job.failed,
          total: job.total,
          durationMs: Date.now() - job.startedAt,
          failedRecipients: job.failedRecipients.slice(0, 50),
        },
      },
    });
  } catch (err) {
    console.error("[ADMIN] Failed to write newsletter campaign audit log:", err instanceof Error ? err.message : err);
  }

  // Notify admin if there were failures
  if (job.failed > 0) {
    try {
      const { sendEmail } = await import('@/lib/email');
      const adminUser = await prisma.user.findUnique({
        where: { id: adminUserId },
        select: { email: true, name: true },
      });
      if (adminUser?.email) {
        const duration = ((Date.now() - job.startedAt) / 1000 / 60).toFixed(1);
        await sendEmail({
          to: adminUser.email,
          subject: `⚠️ Newsletter Campaign — ${job.failed} Failed of ${job.total}`,
          html: `<p>Campaign "${opts.subject}" finished in ${duration} min.<br>Sent: ${job.sent} | Failed: ${job.failed} | Total: ${job.total}<br>Failed addresses: ${job.failedRecipients.slice(0, 20).join(', ')}${job.failedRecipients.length > 20 ? '...' : ''}</p>`,
        });
      }
    } catch (err) {
      console.error("[ADMIN] Failed to send newsletter failure notification email:", err instanceof Error ? err.message : err);
    }
  }
}

export const adminRouter = createTRPCRouter({
  // Global search across key admin entities
  globalSearch: adminProcedure
    .input(
      z.object({
        q: z.string().min(1),
        limit: z.number().min(1).max(25).default(5),
      })
    )
    .query(async ({ input }) => {
      const term = input.q.trim();
      if (term.length < 2) {
        return { users: [], payments: [], packages: [] };
      }

      const take = input.limit;

      const [users, payments, packages] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { username: { contains: term, mode: "insensitive" } },
            ],
          },
          take,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.transaction.findMany({
          where: {
            OR: [
              { reference: { contains: term, mode: "insensitive" } },
              { description: { contains: term, mode: "insensitive" } },
              { transactionType: { contains: term, mode: "insensitive" } },
              { User: { name: { contains: term, mode: "insensitive" } } },
              { User: { email: { contains: term, mode: "insensitive" } } },
            ],
          },
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reference: true,
            description: true,
            amount: true,
            status: true,
            transactionType: true,
            createdAt: true,
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.membershipPackage.findMany({
          where: {
            name: { contains: term, mode: "insensitive" },
          },
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            price: true,
            vat: true,
            isActive: true,
          },
        }),
      ]);

      return { users, payments, packages };
    }),

  // Membership auto-renewal system
  getAutoRenewalCandidates: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(500).default(50),
          expiredDaysAgo: z.number().int().min(0).max(365).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const now = new Date();

      const { getAutoRenewalCandidates } = await import(
        "@/server/services/membershipAutoRenewal.service"
      );
      const candidates = await getAutoRenewalCandidates(prisma, limit);

      const packageIds = Array.from(
        new Set(
          candidates
            .map((c) => c.activeMembershipPackageId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const packages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true, renewalFee: true, price: true },
          })
        : [];

      const packageMap = new Map(packages.map((p) => [p.id, p]));

      return {
        total: candidates.length,
        candidates: candidates.map((user) => {
          const expiresAt = user.membershipExpiresAt || new Date();
          const daysExpired = Math.floor(
            (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const currentPackage = user.activeMembershipPackageId
            ? packageMap.get(user.activeMembershipPackageId)
            : null;

          return {
            userId: user.id,
            userName: user.name || "Unknown",
            userEmail: user.email || "No email",
            currentPackage: currentPackage?.name || "Unknown",
            renewalFee: currentPackage?.renewalFee || currentPackage?.price || 0,
            membershipExpiresAt: expiresAt,
            daysExpired,
          };
        }),
      };
    }),

  previewAutoRenewal: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        optionalUpgradePackageId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const {
          validateAutoRenewalEligibility,
          getRenewalPackage,
        } = await import("@/server/services/membershipAutoRenewal.service");
        const { getReferralChain } = await import("@/server/services/referral.service");

        const eligibility = await validateAutoRenewalEligibility(prisma, input.userId);
        if (!eligibility.eligible) {
          return {
            eligible: false,
            reason: eligibility.reason,
          };
        }

        const renewalPackageInfo = await getRenewalPackage(
          prisma,
          input.userId,
          input.optionalUpgradePackageId
        );

        const referralChain = await getReferralChain(input.userId, 4);
        const membershipPackage = await prisma.membershipPackage.findUnique({
          where: { id: renewalPackageInfo.packageId },
        });

        let totalCash = 0;
        let totalBpt = 0;
        let totalHealth = 0;
        let totalMeal = 0;
        let totalSecurity = 0;
        let totalPalliative = 0;
        let totalShelter = 0;

        for (let i = 0; i < referralChain.length; i++) {
          const level = i + 1;
          totalCash += (membershipPackage as any)?.[`renewal_cash_l${level}`] || 0;
          totalBpt += (membershipPackage as any)?.[`renewal_bpt_l${level}`] || 0;
          totalHealth += (membershipPackage as any)?.[`renewal_health_l${level}`] || 0;
          totalMeal += (membershipPackage as any)?.[`renewal_meal_l${level}`] || 0;
          totalSecurity += (membershipPackage as any)?.[`renewal_security_l${level}`] || 0;
          totalPalliative += (membershipPackage as any)?.[`renewal_palliative_l${level}`] || 0;
          totalShelter += (membershipPackage as any)?.[`shelter_l${level}`] || 0;
        }

        return {
          eligible: true,
          userId: input.userId,
          renewalPackage: renewalPackageInfo.packageName,
          renewalFee: renewalPackageInfo.renewalFee,
          vat: renewalPackageInfo.vat,
          totalCost: renewalPackageInfo.totalCost,
          isUpgrade: renewalPackageInfo.isUpgrade,
          referralCount: referralChain.length,
          estimatedRewards: {
            cash: totalCash,
            bpt: totalBpt,
            health: totalHealth,
            meal: totalMeal,
            security: totalSecurity,
            palliative: totalPalliative,
            shelter: totalShelter,
          },
        };
      } catch (err) {
        return {
          eligible: false,
          reason: `Preview failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    }),

  processAutoRenewalForUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        optionalUpgradePackageId: z.string().optional(),
        reason: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { processAutoRenewal } = await import(
          "@/server/services/membershipAutoRenewal.service"
        );

        const result = await processAutoRenewal(
          prisma,
          input.userId,
          input.optionalUpgradePackageId
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: ctx.session!.user.id,
            action: "MANUAL_AUTO_RENEWAL",
            entity: "USER",
            entityId: input.userId,
            metadata: {
              renewalHistoryId: result.renewalHistoryId,
              newExpiresAt: result.newExpiresAt,
              totalRewardsDistributed: result.totalRewardsDistributed,
              reason: input.reason ?? "Admin-triggered auto-renewal",
            },
            ipAddress: "",
            userAgent: "",
          },
        });

        return {
          success: true,
          renewalHistoryId: result.renewalHistoryId,
          newExpiresAt: result.newExpiresAt,
          totalRewardsDistributed: result.totalRewardsDistributed,
        };
      } catch (err) {
        return {
          success: false,
          error: `Auto-renewal failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    }),

  bulkProcessAutoRenewal: adminProcedure
    .input(
      z
        .object({
          dryRun: z.boolean().default(true),
          limit: z.number().int().min(1).max(500).default(100),
          reasonIfFailed: z.string().trim().max(500).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const dryRun = input?.dryRun ?? true;
      const limit = input?.limit ?? 100;

      try {
        const { getAutoRenewalCandidates, processAutoRenewal } = await import(
          "@/server/services/membershipAutoRenewal.service"
        );

        const candidates = await getAutoRenewalCandidates(prisma, limit);

        if (dryRun) {
          return {
            success: true,
            dryRun: true,
            processed: 0,
            failed: 0,
            totalCandidates: candidates.length,
            message: `Dry run: Found ${candidates.length} users eligible for auto-renewal`,
            candidates: candidates.slice(0, 20),
          };
        }

        let processed = 0;
        let failed = 0;
        const failures: Array<{ userId: string; error: string }> = [];

        for (const candidate of candidates) {
          try {
            const result = await processAutoRenewal(prisma, candidate.id);
            if (result.success) {
              processed++;
            } else {
              failed++;
              failures.push({
                userId: candidate.id,
                error: result.error || "Unknown error",
              });
            }
          } catch (err) {
            failed++;
            failures.push({
              userId: candidate.id,
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: ctx.session!.user.id,
            action: "BULK_AUTO_RENEWAL",
            entity: "SYSTEM",
            entityId: "BULK_AUTO_RENEWAL",
            metadata: {
              processed,
              failed,
              totalCandidates: candidates.length,
              failures: failures.slice(0, 50),
            },
            ipAddress: "",
            userAgent: "",
          },
        });

        return {
          success: true,
          dryRun: false,
          processed,
          failed,
          totalCandidates: candidates.length,
          failures: failures.slice(0, 50),
        };
      } catch (err) {
        return {
          success: false,
          error: `Bulk auto-renewal failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    }),
  // User Management
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
        search: z.string().optional(),
        role: z.enum(["user", "admin", "super_admin"]).optional(),
        activated: z.boolean().optional(),
        sortBy: z.enum(["createdAt", "name", "email", "lastLogin"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search, role, activated, sortBy, sortOrder } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ];
      }
      
      if (role) where.role = role;
      if (activated !== undefined) where.activated = activated;

      // Use transaction for consistent count and data
      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            username: true,
            role: true,
            activated: true,
            verified: true,
            createdAt: true,
            lastLogin: true,
            wallet: true,
            spendable: true,
            bpiTokenWallet: true,
            level1Count: true,
            level2Count: true,
            level3Count: true,
            rank: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  /**
   * SSC issuance summary for admins
   */
  getSscSummary: adminProcedure.query(async () => {
    const now = new Date();
    const activeMembershipFilter: Prisma.UserWhereInput = {
      activeMembershipPackageId: { not: null },
      activated: true,
      OR: [
        { membershipExpiresAt: null },
        { membershipExpiresAt: { gt: now } },
      ],
    };

    const [pending, activeWithCodes, totalActive] = await prisma.$transaction([
      prisma.user.count({ where: { ...activeMembershipFilter, ssc: null } }),
      prisma.user.count({ where: { ...activeMembershipFilter, ssc: { not: null } } }),
      prisma.user.count({ where: activeMembershipFilter }),
    ]);

    return { pending, activeWithCodes, totalActive };
  }),

  /**
   * Generate SSC codes for all active members missing one
   */
  generateSscForActiveMembers: adminProcedure.mutation(async () => {
    const now = new Date();
    const activeMembershipFilter: Prisma.UserWhereInput = {
      activeMembershipPackageId: { not: null },
      activated: true,
      OR: [
        { membershipExpiresAt: null },
        { membershipExpiresAt: { gt: now } },
      ],
    };

    const usersNeedingSsc = await prisma.user.findMany({
      where: { ...activeMembershipFilter, ssc: null },
      select: { id: true },
    });

    if (usersNeedingSsc.length === 0) {
      return { generated: 0, pendingBefore: 0, remaining: 0 };
    }

    const generatedCodes = new Set<string>();
    const updates = [] as ReturnType<typeof prisma.user.update>[];

    for (const user of usersNeedingSsc) {
      let code: string | null = null;

      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateSscCode();
        if (generatedCodes.has(candidate)) continue;

        const exists = await prisma.user.findFirst({ where: { ssc: candidate } });
        if (exists) continue;

        code = candidate;
        generatedCodes.add(candidate);
        break;
      }

      if (!code) {
        throw new Error("Failed to generate a unique SSC code after multiple attempts.");
      }

      updates.push(
        prisma.user.update({
          where: { id: user.id },
          data: { ssc: code },
        })
      );
    }

    await prisma.$transaction(updates);

    const remaining = await prisma.user.count({ where: { ...activeMembershipFilter, ssc: null } });

    return {
      generated: usersNeedingSsc.length,
      pendingBefore: usersNeedingSsc.length + remaining,
      remaining,
    };
  }),

  /**
   * List users who already have SSCs (paginated)
   */
  getSscUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.pageSize;

      const where: any = { ssc: { not: null } };
      if (input.search) {
        where.OR = [
          { firstname: { contains: input.search, mode: "insensitive" } },
          { lastname: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { ssc: { contains: normalizeSsc(input.search) } },
        ];
      }

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          skip,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            ssc: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            activeMembershipPackageId: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      const packageIds = users
        .map((u) => u.activeMembershipPackageId)
        .filter((id): id is string => !!id);

      const packages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
          })
        : [];

      const packageMap = new Map<string, string>();
      packages.forEach((pkg) => packageMap.set(pkg.id, pkg.name));

      const enriched = users.map((u) => ({
        ...u,
        membershipName: u.activeMembershipPackageId
          ? packageMap.get(u.activeMembershipPackageId) || "Active membership"
          : null,
      }));

      return {
        users: enriched,
        total,
        pages: Math.max(1, Math.ceil(total / input.pageSize)),
        currentPage: input.page,
      };
    }),

  /**
   * Strip SSC from a user
   */
  stripSsc: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.user.update({ where: { id: input.userId }, data: { ssc: null } });
      return { success: true };
    }),

  /**
   * Update a user's SSC with a custom value
   */
  updateUserSsc: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        ssc: z
          .string()
          .min(11)
          .max(11)
          .regex(/^[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{3}$/),
      })
    )
    .mutation(async ({ input }) => {
      const normalized = normalizeSsc(input.ssc);

      const existing = await prisma.user.findFirst({
        where: { ssc: normalized, NOT: { id: input.userId } },
        select: { id: true },
      });

      if (existing) {
        throw new Error("SSC already assigned to another user");
      }

      await prisma.user.update({
        where: { id: input.userId },
        data: { ssc: normalized },
      });

      return { success: true, ssc: normalized };
    }),

  getUserById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          Account: true,
          // @ts-ignore - AuditLog model exists, VSCode cache issue
          AuditLog: {
            take: 20,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!user) throw new Error("User not found");

      const [
        level1Referrals,
        directReferralRows,
        referredByUser,
        sponsorUser,
        membershipPackage,
        city,
        state,
        country,
      ] = await Promise.all([
          prisma.referral.findMany({
            where: { referrerId: input.userId },
            select: { referredId: true },
          }),
          prisma.referral.findMany({
            where: { referrerId: input.userId },
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              rewardPaid: true,
              createdAt: true,
              User_Referral_referredIdToUser: {
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              },
            },
          }),
          user.referredBy
            ? prisma.user.findUnique({
                where: { id: user.referredBy },
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              })
            : Promise.resolve(null),
          user.sponsorId
            ? prisma.user.findUnique({
                where: { id: user.sponsorId },
                select: {
                  id: true,
                  name: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                  image: true,
                  profilePic: true,
                  activated: true,
                  verified: true,
                  emailVerified: true,
                  createdAt: true,
                },
              })
            : Promise.resolve(null),
          user.activeMembershipPackageId
            ? prisma.membershipPackage.findUnique({
                where: { id: user.activeMembershipPackageId },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  vat: true,
                },
              })
            : Promise.resolve(null),
          user.cityId
            ? prisma.city.findUnique({
                where: { id: user.cityId },
                select: { id: true, name: true },
              })
            : Promise.resolve(null),
          user.stateId
            ? prisma.state.findUnique({
                where: { id: user.stateId },
                select: { id: true, name: true },
              })
            : Promise.resolve(null),
          user.countryId
            ? prisma.country.findUnique({
                where: { id: user.countryId },
                select: { id: true, name: true },
              })
            : Promise.resolve(null),
        ]);

      const level1Ids = level1Referrals.map((r: any) => r.referredId);
      const level2Referrals =
        level1Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level1Ids } },
              select: { referredId: true },
            })
          : [];

      const level2Ids = level2Referrals.map((r: any) => r.referredId);
      const level3Referrals =
        level2Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level2Ids } },
              select: { referredId: true },
            })
          : [];

      const level3Ids = level3Referrals.map((r: any) => r.referredId);
      const level4Referrals =
        level3Ids.length > 0
          ? await prisma.referral.findMany({
              where: { referrerId: { in: level3Ids } },
              select: { referredId: true },
            })
          : [];

      const referrals = directReferralRows
        .map((r: any) => {
          const u = r.User_Referral_referredIdToUser;
          return u
            ? {
                ...u,
                referral: {
                  id: r.id,
                  status: r.status,
                  rewardPaid: r.rewardPaid,
                  createdAt: r.createdAt,
                },
              }
            : null;
        })
        .filter(Boolean);

      const networkStats = {
        level1: level1Referrals.length,
        level2: level2Referrals.length,
        level3: level3Referrals.length,
        level4: level4Referrals.length,
      };

      return {
        ...user,
        ReferredUsers: referrals,
        ReferredByUser: referredByUser,
        SponsorUser: sponsorUser,
        MembershipPackage: membershipPackage,
        cityRelation: city,
        stateRelation: state,
        countryRelation: country,
        // expose all wallet fields for UI
        wallets: {
          wallet: user.wallet,
          spendable: user.spendable,
          palliative: user.palliative,
          cashback: user.cashback,
          studentCashback: user.studentCashback,
          community: user.community,
          shareholder: user.shareholder,
          shelter: user.shelter,
          shelterWallet: user.shelterWallet,
          education: user.education,
          car: user.car,
          business: user.business,
          solar: user.solar ?? 0,
          legals: user.legals ?? 0,
          land: user.land,
          meal: user.meal,
          health: user.health,
          security: user.security,
          socialMedia: user.socialMedia,
          empowermentSponsorReward: user.empowermentSponsorReward,
          retirement: user.retirement,
          travelTour: user.travelTour,
          bpiTokenWallet: user.bpiTokenWallet,
        },
        networkStats,
      };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          role: z.enum(["user", "admin", "super_admin"]).optional(),
          activated: z.boolean().optional(),
          verified: z.boolean().optional(),
          emailVerified: z.boolean().optional(),
          wallet: z.number().optional(),
          spendable: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, data } = input;

      const updateData: any = { ...data };
      if (typeof data.emailVerified === "boolean") {
        updateData.emailVerified = data.emailVerified ? new Date() : null;
      }
      
      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_USER",
          entity: "User",
          entityId: userId,
          changes: JSON.stringify(updateData),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  bulkUpdateUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        action: z.enum(["activate", "deactivate", "delete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, action } = input;

      let result;
      if (action === "activate") {
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { activated: true },
        });
      } else if (action === "deactivate") {
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { activated: false },
        });
      } else if (action === "delete") {
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }

      // Log the bulk action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: `BULK_${action.toUpperCase()}`,
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({ count: userIds.length }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return result;
    }),

  activateAllUsers: adminProcedure
    .input(
      z.object({
        confirmed: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.confirmed) {
        throw new Error("Confirmation required to activate all users");
      }

      // Get count of inactive users before activation
      const inactiveCount = await prisma.user.count({
        where: { activated: false },
      });

      // Activate all users
      const result = await prisma.user.updateMany({
        where: { activated: false },
        data: { activated: true },
      });

      // Log the global activation
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "ACTIVATE_ALL_USERS",
          entity: "User",
          entityId: "*",
          changes: JSON.stringify({ 
            inactiveCount,
            activatedCount: result.count 
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { count: result.count, previousInactiveCount: inactiveCount };
    }),

  syncReferralData: adminProcedure
    .input(
      z.object({
        confirmed: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.confirmed) {
        throw new Error("Confirmation required to sync referral data");
      }

      const existingCount = await prisma.referral.count();
      const usersWithSponsors = await prisma.user.findMany({
        where: {
          sponsorId: {
            not: null,
          },
        },
        select: {
          id: true,
          sponsorId: true,
          createdAt: true,
          activated: true,
        },
      });

      const sponsorIds = Array.from(
        new Set(
          usersWithSponsors
            .map((user) => user.sponsorId)
            .filter((sponsorId): sponsorId is string => Boolean(sponsorId))
        )
      );

      const validSponsors = sponsorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: sponsorIds } },
            select: { id: true },
          })
        : [];
      const validSponsorIds = new Set(validSponsors.map((sponsor) => sponsor.id));

      return executeReferralSync({
        prisma,
        existingCount,
        usersWithSponsors,
        validSponsorIds,
        actorId: (ctx.session?.user as any)?.id || "system",
      });
    }),

  bulkEmailUsers: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        subject: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, subject, message } = input;

      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, email: { not: null } },
        select: { id: true, email: true, name: true },
      });

      // Log the bulk email action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BULK_EMAIL",
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({
            count: users.length,
            subject,
            messageLength: message.length,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      return {
        sent: users.length,
        recipients: users.map((u: any) => u.email),
      };
    }),

  bulkUpdateUserRoles: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        role: z.enum(["user", "admin", "super_admin"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userIds, role } = input;

      const result = await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { role },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BULK_UPDATE_ROLES",
          entity: "User",
          entityId: userIds.join(","),
          changes: JSON.stringify({ count: userIds.length, newRole: role }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return result;
    }),

  // Payment Management
  getAllPayments: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.string().optional(),
        search: z.string().optional(),
        type: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, search, type } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (status) where.status = status;
      if (type) where.transactionType = type;
      if (search) {
        where.OR = [
          { reference: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { transactionType: { contains: search, mode: "insensitive" } },
          { User: { name: { contains: search, mode: "insensitive" } } },
          { User: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  getPendingPayments: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(10),
        status: z.enum(["pending", "approved", "rejected", "expired"]).optional(),
        search: z.string().optional(),
        paymentMethod: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, search, paymentMethod } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      
      if (status) where.status = status;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (search) {
        where.OR = [
          { gatewayReference: { contains: search, mode: "insensitive" } },
          { User: { name: { contains: search, mode: "insensitive" } } },
          { User: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [payments, total] = await Promise.all([
        prisma.pendingPayment.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            Reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.pendingPayment.count({ where }),
      ]);

      return {
        payments,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  getPaymentById: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      const payment = await prisma.pendingPayment.findUnique({
        where: { id: input.paymentId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              mobile: true,
              wallet: true,
              spendable: true,
            },
          },
          Reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!payment) throw new Error("Payment not found");
      return payment;
    }),

  reviewPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { paymentId, action, notes } = input;
      const payment = await prisma.pendingPayment.findUnique({
        where: { id: paymentId },
        include: { User: true },
      });

      if (!payment) throw new Error("Payment not found");

      const currentStatus = (payment.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        throw new Error("Payment has already been reviewed");
      }

      const reviewerId = (ctx.session?.user as any)?.id;
      return executeAdminPaymentReview({
        prisma,
        payment: payment as any,
        action,
        notes,
        reviewerId,
      });
    }),

  bulkReviewPayments: adminProcedure
    .input(
      z.object({
        paymentIds: z.array(z.string()),
        action: z.enum(["approve", "reject"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { paymentIds, action, notes } = input;
      const reviewerId = (ctx.session?.user as any)?.id;

      // Get all pending payments
      const payments = await prisma.pendingPayment.findMany({
        where: {
          id: { in: paymentIds },
          status: "pending",
        },
        include: { User: true },
      });

      // Process each payment atomically to avoid partial credit + stale status.
      for (const payment of payments) {
        await executeAdminPaymentReview({
          prisma,
          payment: payment as any,
          action,
          notes,
          reviewerId,
        });
      }

      // Log the bulk action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: reviewerId || "system",
          action: `BULK_PAYMENT_${action.toUpperCase()}`,
          entity: "PendingPayment",
          entityId: paymentIds.join(","),
          changes: JSON.stringify({
            count: payments.length,
            totalAmount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { count: payments.length };
    }),

  // ============================================
  // WITHDRAWAL MANAGEMENT
  // ============================================
  
  getPendingWithdrawals: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, search } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {
        status: "pending",
        transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT", "WITHDRAWAL_USDT"] }
      };

      if (search) {
        where.OR = [
          { reference: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { User: { name: { contains: search, mode: "insensitive" } } },
          { User: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [withdrawals, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                bankRecords: {
                  where: { isDefault: true },
                  include: { bank: true },
                  take: 1
                }
              }
            }
          }
        }),
        prisma.transaction.count({ where })
      ]);

      return {
        withdrawals,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page
      };
    }),

  getWithdrawalById: adminProcedure
    .input(z.object({ withdrawalId: z.string() }))
    .query(async ({ input }) => {
      const withdrawal = await prisma.transaction.findUnique({
        where: { id: input.withdrawalId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              bankRecords: {
                include: { bank: true }
              }
            }
          }
        }
      });

      if (!withdrawal) throw new Error("Withdrawal not found");
      return withdrawal;
    }),

  // Bulk approve multiple withdrawals at once
  bulkApproveWithdrawals: adminProcedure
    .input(z.object({
      withdrawalIds: z.array(z.string()).min(1, "At least one withdrawal required"),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { withdrawalIds, notes } = input;
      const reviewerId = (ctx.session?.user as any)?.id;

      console.log(`\n🔵 [BULK-APPROVAL] Processing ${withdrawalIds.length} withdrawals...`);

      const withdrawals = await prisma.transaction.findMany({
        where: {
          id: { in: withdrawalIds },
          status: "pending",
          transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT"] }
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              bankRecords: {
                where: { isDefault: true },
                include: { bank: true },
                take: 1
              }
            }
          }
        }
      });

      if (withdrawals.length === 0) {
        throw new Error("No pending withdrawals found with provided IDs");
      }

      let approved = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const withdrawal of withdrawals) {
        try {
          const amount = Math.abs(withdrawal.amount);
          const txReference = withdrawal.reference || `WD-${Date.now()}`;
          const isCashWithdrawal = withdrawal.transactionType === "WITHDRAWAL_CASH";

          console.log(`⏳ Processing: ${txReference} - ₦${amount.toLocaleString()} for ${withdrawal.User.email}`);

          // Update transaction status
          await prisma.transaction.update({
            where: { id: withdrawal.id },
            data: { status: "completed" }
          });

          // Update withdrawal history
          await prisma.withdrawalHistory.updateMany({
            where: {
              userId: withdrawal.userId,
              amount: amount,
              status: "pending"
            },
            data: { status: "approved" }
          });

          // Generate receipt
          const receiptUrl = generateReceiptLink(txReference, 'withdrawal');

          // Send notification
          await notifyWithdrawalStatus(
            withdrawal.userId,
            "completed",
            amount,
            txReference,
            receiptUrl
          );

          // Send email notification
          try {
            await sendWithdrawalApprovedToUser(
              withdrawal.User.email || '',
              withdrawal.User.name || 'User',
              amount,
              isCashWithdrawal ? 'cash' : withdrawal.transactionType === 'WITHDRAWAL_USDT' ? 'usdt' : 'bpt',
              txReference,
              receiptUrl
            );
          } catch (emailError) {
            console.error(`❌ Email failed for ${withdrawal.User.email}:`, emailError);
          }

          // Audit log
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: reviewerId || "system",
              action: "WITHDRAWAL_APPROVAL",
              entity: "Transaction",
              entityId: withdrawal.id,
              changes: JSON.stringify({
                action: "approve",
                amount,
                userId: withdrawal.userId,
                notes: notes || "Bulk approval",
                reference: txReference
              }),
              status: "success",
              createdAt: new Date()
            }
          });

          approved++;
          console.log(`✅ Approved: ${txReference}`);

        } catch (error: any) {
          failed++;
          const errorMsg = `Failed to approve ${withdrawal.reference}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`\n✅ [BULK-APPROVAL] Complete: ${approved} approved, ${failed} failed`);

      return {
        success: true,
        approved,
        failed,
        total: withdrawals.length,
        errors: errors.length > 0 ? errors : undefined
      };
    }),

  approveWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { withdrawalId, notes } = input;
      
      console.log("\n🔵 [ADMIN-APPROVAL] Withdrawal approval initiated");
      console.log("📋 Details:", { withdrawalId, notes: notes || 'N/A' });
      
      const withdrawal = await prisma.transaction.findUnique({
        where: { id: withdrawalId },
        include: {
          User: {
            include: {
              bankRecords: {
                where: { isDefault: true },
                include: { bank: true },
                take: 1
              }
            }
          }
        }
      });

      if (!withdrawal) {
        console.error("❌ [ADMIN-APPROVAL] Withdrawal not found:", withdrawalId);
        throw new Error("Withdrawal not found");
      }
      
      console.log("✅ [ADMIN-APPROVAL] Withdrawal found:", {
        user: withdrawal.User.name || withdrawal.User.email,
        amount: withdrawal.amount,
        type: withdrawal.transactionType,
        status: withdrawal.status
      });

      const currentStatus = (withdrawal.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        console.error("❌ [ADMIN-APPROVAL] Withdrawal already processed. Current status:", currentStatus);
        throw new Error(`Cannot approve withdrawal: Current status is '${withdrawal.status}'. Only pending withdrawals can be approved. Reference: ${withdrawal.reference}, User: ${withdrawal.User.email}`);
      }

      const reviewerId = (ctx.session?.user as any)?.id;
      const amount = Math.abs(withdrawal.amount);
      const txReference = withdrawal.reference || `WD-${Date.now()}`;
      const isCashWithdrawal = withdrawal.transactionType === "WITHDRAWAL_CASH";
      const isUsdtWithdrawal = withdrawal.transactionType === "WITHDRAWAL_USDT";

      // USDT withdrawals must use the dedicated approveUsdtWithdrawal endpoint
      if (isUsdtWithdrawal) {
        throw new Error("USDT withdrawals require a transaction hash. Please use the USDT approval flow.");
      }
      
      console.log("⚙️  [ADMIN-APPROVAL] Processing:", {
        amount,
        reference: txReference,
        cashWithdrawal: isCashWithdrawal,
        reviewerId
      });

      try {
        // Get Flutterwave credentials from admin settings
        console.log("🔄 [ADMIN-APPROVAL] Fetching Flutterwave configuration...");
        const flutterwaveGateway = await prisma.paymentGatewayConfig.findFirst({
          where: { gatewayName: 'flutterwave', isActive: true }
        });

        if (!flutterwaveGateway?.secretKey && isCashWithdrawal) {
          console.error("❌ [ADMIN-APPROVAL] Flutterwave not configured");
          throw new Error('Flutterwave is not configured. Please configure in admin settings.');
        }
        console.log("✅ [ADMIN-APPROVAL] Flutterwave configuration found");

        let gatewayReference = txReference;

        // Initiate bank transfer via Flutterwave (only for cash withdrawals)
        if (isCashWithdrawal && flutterwaveGateway?.secretKey) {
          const defaultBank = withdrawal.User.bankRecords?.[0];
          
          if (!defaultBank?.bank?.bankCode || !defaultBank?.accountNumber) {
            console.error("❌ [ADMIN-APPROVAL] User bank details not found");
            throw new Error('User bank details not found');
          }
          
          console.log("📋 [ADMIN-APPROVAL] Bank details:", {
            bankCode: defaultBank.bank.bankCode,
            bankName: defaultBank.bank.bankName,
            account: `****${defaultBank.accountNumber.slice(-4)}`,
            accountName: defaultBank.accountName
          });

          console.log("🌐 [ADMIN-APPROVAL] Initiating Flutterwave transfer...");
          const transferResult = await initiateBankTransfer(
            flutterwaveGateway.secretKey,
            {
              accountBank: defaultBank.bank.bankCode,
              accountNumber: defaultBank.accountNumber,
              amount: amount,
              narration: `Withdrawal - ${txReference}`,
              currency: 'NGN',
              reference: txReference,
              beneficiaryName: defaultBank.accountName || withdrawal.User.name || 'BPI User'
            }
          );

          gatewayReference = transferResult.id || transferResult.reference || txReference;
          console.log("✅ [ADMIN-APPROVAL] Flutterwave transfer successful. Reference:", gatewayReference);
        }

        // Update transaction status
        console.log("🔄 [ADMIN-APPROVAL] Updating transaction status to completed...");
        const updated = await prisma.transaction.update({
          where: { id: withdrawalId },
          data: {
            status: "completed",
          }
        });
        console.log("✅ [ADMIN-APPROVAL] Transaction updated successfully");

        // Update withdrawal history
        await prisma.withdrawalHistory.updateMany({
          where: {
            userId: withdrawal.userId,
            amount: amount,
            status: "pending"
          },
          data: { status: "completed" }
        });

        // Generate receipt link
        const receiptUrl = generateReceiptLink(withdrawalId, 'withdrawal');
        console.log("📄 [ADMIN-APPROVAL] Receipt generated:", receiptUrl);

        // Send success notification
        console.log("📧 [ADMIN-APPROVAL] Sending notification to user...");
        await notifyWithdrawalStatus(
          withdrawal.userId, 
          "completed", 
          amount, 
          txReference, 
          receiptUrl
        );

        // Send email notification to user
        try {
          console.log("📧 [EMAIL] Sending approval email to user...");
          await sendWithdrawalApprovedToUser(
            withdrawal.User.email || '',
            withdrawal.User.name || 'User',
            amount,
            isCashWithdrawal ? 'cash' : 'bpt',
            txReference,
            receiptUrl
          );
          console.log("✅ [EMAIL] Approval email sent successfully");
        } catch (emailError) {
          console.error('❌ [EMAIL] Failed to send approval email to user:', emailError);
          // Don't fail the approval if email fails
        }

        // Log the action
        console.log("📝 [ADMIN-APPROVAL] Creating audit log...");
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: reviewerId || "system",
            action: "WITHDRAWAL_APPROVAL",
            entity: "Transaction",
            entityId: withdrawalId,
            changes: JSON.stringify({ 
              action: "approve", 
              amount: amount, 
              userId: withdrawal.userId,
              gatewayReference: gatewayReference,
              notes: notes
            }),
            status: "success",
            createdAt: new Date(),
          },
        });
        console.log("✅ [ADMIN-APPROVAL] Audit log created");
        
        console.log("\n✅ [ADMIN-APPROVAL] Withdrawal approval completed successfully");
        console.log("═".repeat(60) + "\n");

        return updated;
      } catch (error) {
        console.error('\n❌ [ADMIN-APPROVAL] Withdrawal approval error:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        
        // Log the failed action
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: reviewerId || "system",
            action: "WITHDRAWAL_APPROVAL",
            entity: "Transaction",
            entityId: withdrawalId,
            changes: JSON.stringify({ 
              action: "approve", 
              amount: amount, 
              userId: withdrawal.userId,
              error: error instanceof Error ? error.message : 'Unknown error'
            }),
            status: "error",
            createdAt: new Date(),
          },
        });

        throw error;
      }
    }),

  rejectWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.string(),
        reason: z.string().min(1, "Rejection reason is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { withdrawalId, reason } = input;
      
      const withdrawal = await prisma.transaction.findUnique({
        where: { id: withdrawalId },
        include: { User: true }
      });

      if (!withdrawal) throw new Error("Withdrawal not found");

      const currentStatus = (withdrawal.status || "").toLowerCase();
      if (currentStatus !== "pending") {
        throw new Error(`Cannot approve withdrawal: Current status is '${withdrawal.status}'. Only pending withdrawals can be approved. Reference: ${withdrawal.reference}`);
      }

      const reviewerId = (ctx.session?.user as any)?.id;
      const amount = Math.abs(withdrawal.amount);
      const txReference = withdrawal.reference || `WD-${Date.now()}`;

      // Update transaction status
      const updated = await prisma.transaction.update({
        where: { id: withdrawalId },
        data: {
          status: "rejected",
        }
      });

      // Update withdrawal history
      await prisma.withdrawalHistory.updateMany({
        where: {
          userId: withdrawal.userId,
          amount: amount,
          status: "pending"
        },
        data: { status: "rejected" }
      });

      // Refund the amount back to user's wallet
      // Calculate what was deducted (amount + fee + tax)
      const withdrawalFees = await prisma.transaction.findMany({
        where: {
          userId: withdrawal.userId,
          reference: { startsWith: `FEE-WD-` },
          createdAt: { gte: new Date(withdrawal.createdAt.getTime() - 5000) },
          status: "completed"
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      const taxPayments = await prisma.transaction.findMany({
        where: {
          userId: withdrawal.userId,
          reference: { startsWith: `TAX-WD-` },
          createdAt: { gte: new Date(withdrawal.createdAt.getTime() - 5000) },
          status: "completed"
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      const feeAmount = Math.abs(withdrawalFees[0]?.amount || 0);
      const taxAmount = Math.abs(taxPayments[0]?.amount || 0);
      const totalRefund = amount + feeAmount + taxAmount;

      // Determine source wallet (default to main wallet)
      const sourceWallet = withdrawal.walletType || 'wallet';

      // Refund to source wallet
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          [sourceWallet]: { increment: totalRefund }
        }
      });

      // Create refund transaction
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: withdrawal.userId,
          transactionType: "REFUND",
          amount: totalRefund,
          description: `Withdrawal rejected: ${reason}`,
          status: "completed",
          reference: `REFUND-${txReference}`,
          walletType: sourceWallet
        }
      });

      // Send rejection notification
      await notifyWithdrawalStatus(withdrawal.userId, "rejected", amount, txReference);

      // Send email notification to user
      try {
        await sendWithdrawalRejectedToUser(
          withdrawal.User.email || '',
          withdrawal.User.name || 'User',
          amount,
          txReference,
          reason
        );
      } catch (emailError) {
        console.error('Failed to send rejection email to user:', emailError);
        // Don't fail the rejection if email fails
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: reviewerId || "system",
          action: "WITHDRAWAL_REJECTION",
          entity: "Transaction",
          entityId: withdrawalId,
          changes: JSON.stringify({ 
            action: "reject", 
            amount: amount, 
            userId: withdrawal.userId,
            reason: reason,
            refundAmount: totalRefund
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  // ============================================
  // USDT WITHDRAWAL APPROVAL (with tx hash)
  // ============================================
  approveUsdtWithdrawal: adminProcedure
    .input(z.object({
      withdrawalId: z.string(),
      txHash: z.string().min(10, "Transaction hash is required"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { withdrawalId, txHash, notes } = input;
      const reviewerId = (ctx.session?.user as any)?.id;

      const withdrawal = await prisma.transaction.findUnique({
        where: { id: withdrawalId },
        include: { User: { select: { id: true, name: true, email: true } } },
      });

      if (!withdrawal) throw new Error("Withdrawal not found");
      if (withdrawal.transactionType !== "WITHDRAWAL_USDT") {
        throw new Error("This endpoint is only for USDT withdrawals");
      }
      if ((withdrawal.status || "").toLowerCase() !== "pending") {
        throw new Error("This withdrawal has already been processed.");
      }

      const amount = Math.abs(withdrawal.amount);
      const txReference = withdrawal.reference || `WD-USDT-${Date.now()}`;

      // Parse existing metadata and add admin tx hash
      let meta: any = {};
      try { meta = JSON.parse(withdrawal.metadata || "{}"); } catch {}
      meta.adminTxHash = txHash;
      meta.approvedAt = new Date().toISOString();
      meta.approvedBy = reviewerId;
      meta.notes = notes;

      // Update transaction with tx hash and mark completed (atomic)
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: withdrawalId },
          data: {
            status: "completed",
            metadata: JSON.stringify(meta),
          },
        }),
        prisma.withdrawalHistory.updateMany({
          where: { userId: withdrawal.userId, amount, status: "pending" },
          data: { status: "completed" },
        }),
        prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: reviewerId || "system",
            action: "WITHDRAWAL_USDT_APPROVAL",
            entity: "Transaction",
            entityId: withdrawalId,
            changes: JSON.stringify({
              action: "approve_usdt",
              amount,
              userId: withdrawal.userId,
              txHash,
              usdtAddress: meta.usdtAddress,
              notes,
            }),
            status: "success",
            createdAt: new Date(),
          },
        }),
      ]);

      // Generate receipt
      const receiptUrl = generateReceiptLink(withdrawalId, 'withdrawal');

      // Notify user
      await notifyWithdrawalStatus(withdrawal.userId, "completed", amount, txReference, receiptUrl);

      // Send email
      try {
        await sendWithdrawalApprovedToUser(
          withdrawal.User.email || '',
          withdrawal.User.name || 'User',
          amount,
          'usdt',
          txReference,
          receiptUrl
        );
      } catch (emailError) {
        console.error('Failed to send USDT approval email:', emailError);
      }

      return { success: true, txHash, amount, reference: txReference };
    }),

  // ============================================
  // BASQET USDT WITHDRAWAL RECONCILIATION
  // ============================================
  reconcileBasqetUsdtWithdrawal: adminProcedure
    .input(z.object({
      withdrawalId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const reviewerId = (ctx.session?.user as any)?.id;
      const withdrawal = await prisma.transaction.findUnique({
        where: { id: input.withdrawalId },
      });

      if (!withdrawal) throw new Error("Withdrawal not found");
      if (withdrawal.transactionType !== "WITHDRAWAL_USDT") {
        throw new Error("This endpoint is only for USDT withdrawals");
      }

      let meta: Record<string, any> = {};
      try {
        meta = withdrawal.metadata ? JSON.parse(withdrawal.metadata) : {};
      } catch {
        meta = {};
      }

      const basqetRef = meta?.basqet?.providerRef || meta?.providerReference || withdrawal.reference;
      if (!basqetRef) {
        throw new Error("No Basqet reference found on this withdrawal");
      }

      const cryptoConfig = await prisma.paymentGatewayConfig.findFirst({
        where: { gatewayName: 'crypto', isActive: true },
        select: { apiProvider: true, cryptoPublicKey: true, cryptoSecretKey: true, publicKey: true, secretKey: true },
      });

      if ((cryptoConfig?.apiProvider || '').toLowerCase() !== 'basqet') {
        throw new Error("Crypto provider is not set to Basqet");
      }

      const secretKey = cryptoConfig?.cryptoSecretKey || cryptoConfig?.secretKey;
      const publicKey = cryptoConfig?.cryptoPublicKey || cryptoConfig?.publicKey;
      if (!secretKey) {
        throw new Error("Basqet secret key is not configured");
      }

      const verification = await verifyBasqetUsdtPayout(secretKey, publicKey || undefined, basqetRef);
      const normalized = (verification.status || 'pending').toLowerCase();
      const completed = ['completed', 'success', 'successful', 'paid'].includes(normalized);
      const failed = ['failed', 'rejected', 'cancelled', 'canceled'].includes(normalized);

      meta.basqet = {
        ...(meta.basqet || {}),
        status: verification.status,
        providerRef: verification.providerRef,
        payoutId: verification.payoutId,
        txHash: verification.txHash,
        lastReconciledAt: new Date().toISOString(),
        lastReconciledBy: reviewerId,
      };
      if (verification.txHash) {
        meta.adminTxHash = verification.txHash;
      }

      const nextStatus = completed ? 'completed' : failed ? 'failed' : 'processing';
      await prisma.transaction.update({
        where: { id: withdrawal.id },
        data: {
          status: nextStatus,
          metadata: JSON.stringify(meta),
        },
      });

      await prisma.withdrawalHistory.updateMany({
        where: {
          userId: withdrawal.userId,
          amount: Math.abs(withdrawal.amount),
          status: { in: ['pending', 'processing'] },
        },
        data: { status: nextStatus },
      });

      if (completed) {
        const receiptUrl = generateReceiptLink(withdrawal.id, 'withdrawal');
        await notifyWithdrawalStatus(
          withdrawal.userId,
          'completed',
          Math.abs(withdrawal.amount),
          withdrawal.reference || basqetRef,
          receiptUrl,
        );
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: reviewerId || 'system',
          action: 'WITHDRAWAL_USDT_BASQET_RECONCILE',
          entity: 'Transaction',
          entityId: withdrawal.id,
          changes: JSON.stringify({
            basqetRef,
            verificationStatus: verification.status,
            normalizedStatus: nextStatus,
          }),
          status: 'success',
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        withdrawalId: withdrawal.id,
        providerRef: verification.providerRef,
        providerStatus: verification.status,
        status: nextStatus,
      };
    }),

  // Transaction Reversal - For correcting errors in completed transactions
  reverseTransaction: adminProcedure
    .input(z.object({
      transactionId: z.string(),
      reason: z.string().min(10, "Reversal reason must be at least 10 characters"),
      notifyUser: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      const { transactionId, reason, notifyUser } = input;
      const adminId = (ctx.session?.user as any)?.id;

      // Get original transaction
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { User: { select: { id: true, name: true, email: true } } }
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (transaction.status !== "completed") {
        throw new Error("Only completed transactions can be reversed");
      }

      // Check if already reversed
      const existingReversal = await prisma.transaction.findFirst({
        where: {
          reference: { startsWith: `REV-${transaction.reference}` },
          status: "completed"
        }
      });

      if (existingReversal) {
        throw new Error("This transaction has already been reversed");
      }

      const userId = transaction.userId;
      const amount = transaction.amount;
      const walletType = transaction.walletType || 'wallet';

      // VALIDATION: Ensure user has sufficient balance to reverse
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { [walletType]: true, wallet: true }
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentBalance = (user as any)[walletType] || 0;
      
      // For negative transactions (debits), reversal adds money back
      // For positive transactions (credits), reversal deducts money
      const reversalAmount = -amount;
      const newBalance = currentBalance + reversalAmount;

      if (newBalance < 0) {
        throw new Error(`Insufficient balance to reverse transaction. User ${walletType} balance: ₦${currentBalance}, reversal requires: ₦${Math.abs(reversalAmount)}`);
      }

      // Create reversal transaction
      const reversalRef = `REV-${transaction.reference}-${Date.now()}`;
      const reversalTx = await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "REVERSAL",
          amount: reversalAmount,
          description: `Reversal: ${transaction.description}. Reason: ${reason}. Original: ${transaction.reference || transactionId}`,
          status: "completed",
          reference: reversalRef,
          walletType
        }
      });

      // Update user's wallet balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          [walletType]: { increment: reversalAmount }
        }
      });

      // Original transaction reference preserved in reversal description for audit trail

      // Send notification to user if requested
      if (notifyUser && transaction.User?.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: transaction.User.email,
            subject: '⚠️ Transaction Reversal Notification',
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #dc2626;">Transaction Reversal Notice</h2>
                    <p>Dear ${transaction.User.name || 'User'},</p>
                    <p>A transaction on your account has been reversed by our admin team.</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p><strong>Original Transaction:</strong> ${transaction.reference}</p>
                      <p><strong>Amount:</strong> ₦${Math.abs(amount).toLocaleString()}</p>
                      <p><strong>Description:</strong> ${transaction.description}</p>
                      <p><strong>Reversal Amount:</strong> ₦${Math.abs(reversalAmount).toLocaleString()} ${reversalAmount > 0 ? 'credited' : 'debited'}</p>
                      <p><strong>Reason:</strong> ${reason}</p>
                    </div>
                    <p>Your wallet balance has been adjusted accordingly. If you have any questions, please contact support.</p>
                    <p>Best regards,<br>BPI Team</p>
                  </div>
                </body>
              </html>
            `
          });
        } catch (emailError) {
          console.error('Failed to send reversal notification email:', emailError);
        }
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: "TRANSACTION_REVERSAL",
          entity: "Transaction",
          entityId: transactionId,
          changes: JSON.stringify({
            originalTransaction: transaction.reference,
            reversalTransaction: reversalRef,
            amount: reversalAmount,
            reason,
            userId
          }),
          status: "success",
          createdAt: new Date()
        }
      });

      console.log(`✅ [REVERSAL] Transaction ${transaction.reference} reversed. New balance: ₦${newBalance}`);

      return {
        success: true,
        reversalTransaction: reversalTx,
        newBalance,
        message: `Transaction reversed successfully. ${reversalAmount > 0 ? 'Credited' : 'Debited'} ₦${Math.abs(reversalAmount).toLocaleString()} ${reversalAmount > 0 ? 'to' : 'from'} user's ${walletType} wallet.`
      };
    }),

  // Admin-initiated refund for completed payments
  initiateRefund: adminProcedure
    .input(
      z.object({
        transactionId: z.string(),
        reason: z.string().min(5, "Refund reason required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { transactionId, reason } = input;
      const adminId = (ctx.session?.user as any)?.id;

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { User: true },
      });

      if (!transaction) throw new Error("Transaction not found");
      if ((transaction.status || "").toLowerCase() !== "completed") {
        throw new Error("Only completed transactions can be refunded");
      }
      if (transaction.transactionType === "REFUND") {
        throw new Error("Cannot refund a refund transaction");
      }

      // Check for existing refund to prevent duplicates
      const existingRefund = await prisma.transaction.findFirst({
        where: {
          reference: `REFUND-${transaction.reference || transactionId}`,
          status: "completed",
        },
      });
      if (existingRefund) {
        throw new Error("A refund has already been issued for this transaction");
      }

      const refundAmount = Math.abs(transaction.amount);
      const walletType = transaction.walletType || "wallet";

      // Credit wallet
      await prisma.user.update({
        where: { id: transaction.userId },
        data: { [walletType]: { increment: refundAmount } },
      });

      // Create refund transaction
      const refundTx = await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: transaction.userId,
          transactionType: "REFUND",
          amount: refundAmount,
          description: `Admin refund: ${reason}`,
          status: "completed",
          reference: `REFUND-${transaction.reference || transactionId}`,
          walletType,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId || "system",
          action: "ADMIN_REFUND",
          entity: "Transaction",
          entityId: transactionId,
          changes: JSON.stringify({
            originalTransaction: transaction.reference,
            refundAmount,
            reason,
            userId: transaction.userId,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        refundTransaction: refundTx,
        message: `Refunded ₦${refundAmount.toLocaleString()} to ${walletType} wallet.`,
      };
    }),

  bulkExportPayments: adminProcedure
    .input(
      z.object({
        paymentIds: z.array(z.string()),
      }),
    )
    .query(async ({ input }) => {
      const { paymentIds } = input;

      const payments = await prisma.pendingPayment.findMany({
        where: { id: { in: paymentIds } },
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      return payments;
    }),

  // Package Management
  getPackages: adminProcedure
    .input(
      z.object({
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { isActive, search } = input;
      const where: any = {};
      
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { packageType: { contains: search, mode: "insensitive" } },
        ];
      }

      const packages = await prisma.membershipPackage.findMany({
        where,
        orderBy: [{ price: "asc" }],
      });

      // Get activation counts for each package
      const packagesWithStats = await Promise.all(
        packages.map(async (pkg: any) => {
          const activeCount = await prisma.user.count({
            where: { activeMembershipPackageId: pkg.id },
          });

          const totalRevenue = activeCount * (pkg.price + pkg.vat);

          return {
            ...pkg,
            activeSubscriptions: activeCount,
            totalRevenue,
          };
        })
      );

      return packagesWithStats;
    }),

  getPackageById: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .query(async ({ input }) => {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) throw new Error("Package not found");

      const now = new Date();
      const currentWindowStart = new Date(now);
      currentWindowStart.setDate(currentWindowStart.getDate() - 30);
      const previousWindowStart = new Date(currentWindowStart);
      previousWindowStart.setDate(previousWindowStart.getDate() - 30);

      const [
        activeSubscriptions,
        currentWindowActivations,
        previousWindowActivations,
        subscribers,
      ] = await prisma.$transaction([
        prisma.user.count({
          where: { activeMembershipPackageId: input.packageId },
        }),
        prisma.user.count({
          where: {
            activeMembershipPackageId: input.packageId,
            membershipActivatedAt: { gte: currentWindowStart },
          },
        }),
        prisma.user.count({
          where: {
            activeMembershipPackageId: input.packageId,
            membershipActivatedAt: {
              gte: previousWindowStart,
              lt: currentWindowStart,
            },
          },
        }),
        prisma.user.findMany({
          where: { activeMembershipPackageId: input.packageId },
          select: {
            id: true,
            name: true,
            email: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
          },
          take: 10,
          orderBy: { membershipActivatedAt: "desc" },
        }),
      ]);

      const totalRevenue = activeSubscriptions * (pkg.price + pkg.vat);
      const subscriberGrowthRate =
        previousWindowActivations > 0
          ? ((currentWindowActivations - previousWindowActivations) / previousWindowActivations) * 100
          : null;

      return {
        ...pkg,
        subscribers,
        activeSubscriptions,
        totalRevenue,
        analytics: {
          growthWindowDays: 30,
          currentWindowActivations,
          previousWindowActivations,
          subscriberGrowthRate,
        },
      };
    }),

  updatePackage: adminProcedure
    .input(
      z.object({
        packageId: z.string(),
        data: z.object({
          name: z.string().optional(),
          price: z.number().optional(),
          vat: z.number().optional(),
          isActive: z.boolean().optional(),
          features: z.array(z.string()).optional(),
          renewalFee: z.number().optional(),
          profitMode: z.enum(["PERCENT", "FIXED", "HYBRID"]).optional(),
          profitPercent: z.number().min(0).optional(),
          profitFixedAmountFiat: z.number().min(0).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { packageId, data } = input;

      const updated = await prisma.membershipPackage.update({
        where: { id: packageId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: packageId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  togglePackageStatus: adminProcedure
    .input(z.object({ packageId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { packageId, isActive } = input;

      const updated = await prisma.membershipPackage.update({
        where: { id: packageId },
        data: {
          isActive,
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: isActive ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: packageId,
          changes: JSON.stringify({ isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  createPackage: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().positive(),
        vat: z.number(),
        baseMembershipPackageId: z.string().optional(),
        packageType: z.string().default("STANDARD"),
        isActive: z.boolean().default(true),
        features: z.array(z.string()).default([]),
        hasRenewal: z.boolean().default(true),
        renewalFee: z.number().optional(),
        renewalCycle: z.number().default(365),
        profitMode: z.enum(["PERCENT", "FIXED", "HYBRID"]).default("PERCENT"),
        profitPercent: z.number().min(0).default(1),
        profitFixedAmountFiat: z.number().min(0).default(0),
        // Activation rewards
        cash_l1: z.number().default(0),
        cash_l2: z.number().default(0),
        cash_l3: z.number().default(0),
        cash_l4: z.number().default(0),
        bpt_l1: z.number().default(0),
        bpt_l2: z.number().default(0),
        bpt_l3: z.number().default(0),
        bpt_l4: z.number().default(0),
        palliative_l1: z.number().default(0),
        palliative_l2: z.number().default(0),
        palliative_l3: z.number().default(0),
        palliative_l4: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newPackage = await prisma.membershipPackage.create({
        data: {
          id: randomUUID(),
          ...input,
          baseMembershipPackageId: input.baseMembershipPackageId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_PACKAGE",
          entity: "MembershipPackage",
          entityId: newPackage.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return newPackage;
    }),

  bulkUpdatePackages: adminProcedure
    .input(
      z.object({
        packageIds: z.array(z.string()),
        action: z.enum(["activate", "deactivate", "delete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { packageIds, action } = input;

      if (action === "delete") {
        // Delete packages
        await prisma.membershipPackage.deleteMany({
          where: { id: { in: packageIds } },
        });

        // Log deletion
        for (const pkgId of packageIds) {
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: (ctx.session?.user as any)?.id || "system",
              action: "DELETE_PACKAGE",
              entity: "MembershipPackage",
              entityId: pkgId,
              changes: JSON.stringify({ deleted: true }),
              status: "success",
              createdAt: new Date(),
            },
          });
        }

        return { success: true, count: packageIds.length, action: "deleted" };
      } else {
        // Activate or deactivate
        const isActive = action === "activate";
        
        await prisma.membershipPackage.updateMany({
          where: { id: { in: packageIds } },
          data: { isActive, updatedAt: new Date() },
        });

        // Log the bulk action
        for (const pkgId of packageIds) {
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: (ctx.session?.user as any)?.id || "system",
              action: isActive ? "ACTIVATE_PACKAGE" : "DEACTIVATE_PACKAGE",
              entity: "MembershipPackage",
              entityId: pkgId,
              changes: JSON.stringify({ isActive, bulkOperation: true }),
              status: "success",
              createdAt: new Date(),
            },
          });
        }

        return { success: true, count: packageIds.length, action };
      }
    }),

  // Analytics & Reports Endpoints
  getSystemAnalytics: adminProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { activeMembershipPackageId: { not: null } },
    });
    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Payments - from Transaction ledger
    const totalPayments = await prisma.transaction.count({
      where: { transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] } },
    });
    const completedPayments = await prisma.transaction.count({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
      },
    });
    const pendingPayments = await prisma.transaction.count({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "pending",
      },
    });
    const totalPaymentAmount = await prisma.transaction.aggregate({
      where: {
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });

    // Packages
    const totalPackages = await prisma.membershipPackage.count();
    const activePackages = await prisma.membershipPackage.count({
      where: { isActive: true },
    });

    // Recent activity (last 7 days)
    const recentPayments = await prisma.transaction.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
        transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
        status: "completed",
      },
    });
    const recentActivations = await prisma.user.count({
      where: { 
        membershipActivatedAt: { gte: sevenDaysAgo },
      },
    });

    // Revenue by package
    const revenueByPackage = await prisma.user.groupBy({
      by: ["activeMembershipPackageId"],
      where: {
        activeMembershipPackageId: { not: null },
      },
      _count: { id: true },
    });

    const packageRevenue = await Promise.all(
      revenueByPackage.map(async (item: any) => {
        const pkg = await prisma.membershipPackage.findUnique({
          where: { id: item.activeMembershipPackageId! },
          select: { name: true, price: true, vat: true },
        });
        return {
          packageName: pkg?.name || "Unknown",
          subscribers: item._count.id,
          revenue: item._count.id * ((pkg?.price || 0) + (pkg?.vat || 0)),
        };
      })
    );

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newLast30Days: newUsersLast30Days,
        inactivePercentage: totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0,
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        approved: completedPayments,
        totalAmount: totalPaymentAmount._sum.amount || 0,
      },
      packages: {
        total: totalPackages,
        active: activePackages,
      },
      activity: {
        recentPayments,
        recentActivations,
      },
      revenue: {
        byPackage: packageRevenue,
        total: totalPaymentAmount._sum.amount || 0,
      },
    };
  }),

  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
        granularity: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get payments from Transaction ledger
      const payments = await prisma.transaction.findMany({
        where: {
          status: "completed",
          transactionType: { in: ["DEPOSIT", "MEMBERSHIP_PAYMENT", "PACKAGE_ACTIVATION"] },
          amount: { gt: 0 },
          createdAt: { gte: startDate },
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const formatBucket = (d: Date) => {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        if (input.granularity === "day") return `${yyyy}-${mm}-${dd}`;
        if (input.granularity === "month") return `${yyyy}-${mm}`;
        // week: ISO-ish year-week
        const temp = new Date(Date.UTC(yyyy, d.getUTCMonth(), d.getUTCDate()));
        const dayNum = temp.getUTCDay() || 7;
        temp.setUTCDate(temp.getUTCDate() + (4 - dayNum));
        const isoYear = temp.getUTCFullYear();
        const isoWeek = Math.ceil((((temp.getTime() - Date.UTC(isoYear, 0, 1)) / 86400000) + 1) / 7);
        return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
      };

      const revenueByBucket: Record<string, number> = {};
      payments.forEach((payment: any) => {
        const bucket = formatBucket(payment.createdAt);
        revenueByBucket[bucket] = (revenueByBucket[bucket] || 0) + payment.amount;
      });

      const chartData = Object.entries(revenueByBucket)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, amount]) => ({ date, amount }));

      const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const averagePerDay = chartData.length > 0 ? totalRevenue / chartData.length : 0;

      return {
        chartData,
        totalRevenue,
        averagePerDay,
        transactionCount: payments.length,
        granularity: input.granularity,
      };
    }),

  getUserGrowthAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
        granularity: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Get users
      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          membershipActivatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const formatBucket = (d: Date) => {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        if (input.granularity === "day") return `${yyyy}-${mm}-${dd}`;
        if (input.granularity === "month") return `${yyyy}-${mm}`;
        // week bucket
        const temp = new Date(Date.UTC(yyyy, d.getUTCMonth(), d.getUTCDate()));
        const dayNum = temp.getUTCDay() || 7;
        temp.setUTCDate(temp.getUTCDate() + (4 - dayNum));
        const isoYear = temp.getUTCFullYear();
        const isoWeek = Math.ceil((((temp.getTime() - Date.UTC(isoYear, 0, 1)) / 86400000) + 1) / 7);
        return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
      };

      const usersByBucket: Record<string, { registrations: number; activations: number }> = {};
      users.forEach((user: any) => {
        const regBucket = formatBucket(user.createdAt);
        if (!usersByBucket[regBucket]) {
          usersByBucket[regBucket] = { registrations: 0, activations: 0 };
        }
        usersByBucket[regBucket].registrations++;

        if (user.membershipActivatedAt && user.membershipActivatedAt >= startDate) {
          const actBucket = formatBucket(user.membershipActivatedAt);
          if (!usersByBucket[actBucket]) {
            usersByBucket[actBucket] = { registrations: 0, activations: 0 };
          }
          usersByBucket[actBucket].activations++;
        }
      });

      const chartData = Object.entries(usersByBucket)
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, counts]) => ({
          date,
          registrations: counts.registrations,
          activations: counts.activations,
        }));

      return {
        chartData,
        totalRegistrations: users.length,
        totalActivations: users.filter((u: any) => u.membershipActivatedAt).length,
        granularity: input.granularity,
      };
    }),

  getAuditLogs: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        action: z.string().optional(),
        entity: z.string().optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, action, entity, userId, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (action) where.action = action;
      if (entity) where.entity = entity;
      if (userId) where.userId = userId;
      if (search) {
        where.OR = [
          { action: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Community Management Endpoints
  getCommunityUpdates: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, category, isActive, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      const [updates, total] = await Promise.all([
        prisma.communityUpdate.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            UpdateRead: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.communityUpdate.count({ where }),
      ]);

      return {
        updates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getCommunityUpdateDetails: adminProcedure
    .input(z.object({ updateId: z.string() }))
    .query(async ({ input }) => {
      const update = await prisma.communityUpdate.findUnique({
        where: { id: input.updateId },
        include: {
          User: {
            select: { name: true, email: true },
          },
          UpdateRead: {
            select: {
              id: true,
              readAt: true,
              User: { select: { name: true, email: true } },
            },
            orderBy: { readAt: "desc" },
            take: 50,
          },
        },
      });

      if (!update) return null;

      const [audit, readCount] = await Promise.all([
        prisma.auditLog.findMany({
          where: { entity: "CommunityUpdate", entityId: input.updateId },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            User: { select: { name: true, email: true } },
          },
        }),
        prisma.updateRead.count({ where: { updateId: input.updateId } }),
      ]);

      const readsByDay = (update.UpdateRead || []).reduce((acc: Record<string, number>, read: any) => {
        const day = new Date(read.readAt).toISOString().slice(0, 10);
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const audience = {
        packages: update.targetPackages || null,
        ranks: update.targetRanks || null,
        regions: update.targetRegions || null,
      };

      const attachments = update.imageUrl
        ? [{ id: `${update.id}-image`, type: "image", url: update.imageUrl, label: "Hero image" }]
        : [];

      const metadata = {
        category: update.category,
        priority: update.priority,
        publishedAt: update.publishedAt,
        expiresAt: update.expiresAt,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt,
      };

      return {
        ...update,
        audience,
        attachments,
        metadata,
        readCount,
        readDistribution: Object.entries(readsByDay).map(([day, count]) => ({ day, count })),
        audit,
        lastActor: audit[0]?.User || null,
        statusHistory: audit.map((log: any) => ({
          id: log.id,
          action: log.action,
          status: log.status,
          actor: log.User,
          metadata: log.metadata,
          changes: log.changes,
          createdAt: log.createdAt,
        })),
      };
    }),

  createCommunityUpdate: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().default("announcement"),
        priority: z.string().default("MEDIUM"),
        imageUrl: z.string().optional(),
        ctaText: z.string().optional(),
        ctaLink: z.string().optional(),
        publishedAt: z.string().optional(),
        expiresAt: z.string().optional(),
        targetPackages: z.string().optional(),
        targetRanks: z.string().optional(),
        targetRegions: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const now = new Date();
      const publishedAt = input.publishedAt ? new Date(input.publishedAt) : now;
      const isActive = publishedAt <= now; // Auto-activate if publish time is now or in the past

      const update = await prisma.communityUpdate.create({
        data: {
          id: randomUUID(),
          ...input,
          publishedAt,
          isActive,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          createdBy: (ctx.session?.user as any)?.id || "system",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: update.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return update;
    }),

  updateCommunityUpdate: adminProcedure
    .input(
      z.object({
        updateId: z.string(),
        data: z.object({
          title: z.string().optional(),
          content: z.string().optional(),
          category: z.string().optional(),
          priority: z.string().optional(),
          isActive: z.boolean().optional(),
          imageUrl: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          expiresAt: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { updateId, data } = input;

      const updated = await prisma.communityUpdate.update({
        where: { id: updateId },
        data: {
          ...data,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: updateId,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  deleteCommunityUpdate: adminProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.communityUpdate.delete({
        where: { id: input.updateId },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "DELETE_COMMUNITY_UPDATE",
          entity: "CommunityUpdate",
          entityId: input.updateId,
          changes: JSON.stringify({ deleted: true }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { success: true };
    }),

  getBestDeals: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, isActive, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [deals, total] = await Promise.all([
        prisma.bestDeal.findMany({
          where,
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
            DealClaim: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.bestDeal.count({ where }),
      ]);

      return {
        deals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getBestDealDetails: adminProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input }) => {
      const deal = await prisma.bestDeal.findUnique({
        where: { id: input.dealId },
        include: {
          User: {
            select: { name: true, email: true },
          },
        },
      });

      if (!deal) return null;

      const [claims, audit] = await Promise.all([
        prisma.dealClaim.findMany({
          where: { dealId: input.dealId },
          include: {
            User: { select: { name: true, email: true } },
          },
          orderBy: { claimedAt: "desc" },
          take: 100,
        }),
        prisma.auditLog.findMany({
          where: { entity: "BestDeal", entityId: input.dealId },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            User: { select: { name: true, email: true } },
          },
        }),
      ]);

      const claimsByDay = claims.reduce((acc: Record<string, number>, claim: any) => {
        const day = new Date(claim.claimedAt).toISOString().slice(0, 10);
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const usageRate = deal.usageLimit ? Math.min(100, ((deal.currentUsage || 0) / deal.usageLimit) * 100) : null;

      const audience = {
        packages: deal.eligiblePackages || null,
        ranks: deal.eligibleRanks || null,
        minPurchaseAmount: deal.minPurchaseAmount || null,
      };

      const attachments = deal.imageUrl
        ? [{ id: `${deal.id}-image`, type: "image", url: deal.imageUrl, label: "Hero image" }]
        : [];

      const metadata = {
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
        startDate: deal.startDate,
        endDate: deal.endDate,
        usageLimit: deal.usageLimit,
        usagePerUser: deal.usagePerUser,
        isFeatured: deal.isFeatured,
      };

      const statusHistory = audit.map((log: any) => ({
        id: log.id,
        action: log.action,
        status: log.status,
        actor: log.User,
        metadata: log.metadata,
        changes: log.changes,
        createdAt: log.createdAt,
      }));

      const deactivationReason = (() => {
        for (const log of audit) {
          const meta = log.metadata;
          if (meta && typeof meta === "object" && !Array.isArray(meta) && "deactivationReason" in meta) {
            const value = (meta as Record<string, unknown>).deactivationReason;
            if (typeof value === "string") return value;
          }
        }
        return null;
      })();

      return {
        ...deal,
        claims,
        claimCount: claims.length,
        remainingClaims: deal.usageLimit ? Math.max(0, deal.usageLimit - (deal.currentUsage || 0)) : null,
        claimDistribution: Object.entries(claimsByDay).map(([day, count]) => ({ day, count })),
        audit,
        usageRate,
        lastActor: audit[0]?.User || null,
        audience,
        attachments,
        metadata,
        statusHistory,
        deactivationReason,
      };
    }),

  createBestDeal: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        dealType: z.string(),
        discountType: z.string(),
        discountValue: z.number(),
        originalPrice: z.number().optional(),
        discountedPrice: z.number().optional(),
        startDate: z.string(),
        endDate: z.string(),
        usageLimit: z.number().optional(),
        usagePerUser: z.number().default(1),
        eligiblePackages: z.string().optional(),
        eligibleRanks: z.string().optional(),
        minPurchaseAmount: z.number().optional(),
        isFeatured: z.boolean().default(false),
        imageUrl: z.string().optional(),
        ctaText: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const deal = await prisma.bestDeal.create({
        data: {
          id: randomUUID(),
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          createdBy: (ctx.session?.user as any)?.id || "system",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CREATE_DEAL",
          entity: "BestDeal",
          entityId: deal.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return deal;
    }),

  updateBestDeal: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          discountValue: z.number().optional(),
          usageLimit: z.number().optional(),
          deactivationReason: z.string().max(500).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { dealId, data } = input;
      const { deactivationReason, ...updateData } = data;

      const updated = await prisma.bestDeal.update({
        where: { id: dealId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_DEAL",
          entity: "BestDeal",
          entityId: dealId,
          changes: JSON.stringify({ ...updateData, deactivationReason }),
          metadata: deactivationReason ? { deactivationReason } : undefined,
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  // Notification Broadcasting
  broadcastNotification: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.string().default("info"),
        targetUserIds: z.array(z.string()).optional(),
        targetPackages: z.string().optional(),
        targetRanks: z.string().optional(),
        link: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let userIds = input.targetUserIds;

      // If no specific users, filter by packages/ranks
      if (!userIds || userIds.length === 0) {
        const where: any = {};
        
        if (input.targetPackages) {
          const packageIds = input.targetPackages.split(",").map((id: string) => id.trim());
          where.activeMembershipPackageId = { in: packageIds };
        }

        const users = await prisma.user.findMany({
          where,
          select: { id: true },
        });

        userIds = users.map((u: any) => u.id);
      }

      // Create notifications for each user
      const notifications = await Promise.all(
        (userIds || []).map((userId: string) =>
          prisma.notification.create({
            data: {
              id: randomUUID(),
              userId,
              title: input.title,
              message: input.message,
              link: input.link,
              isRead: false,
              createdAt: new Date(),
            },
          })
        )
      );

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "BROADCAST_NOTIFICATION",
          entity: "Notification",
          entityId: "broadcast",
          changes: JSON.stringify({
            title: input.title,
            recipientCount: notifications.length,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        sent: notifications.length,
      };
    }),

  toggleUpdateStatus: adminProcedure
    .input(
      z.object({
        updateId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await prisma.communityUpdate.update({
        where: { id: input.updateId },
        data: { isActive: input.isActive },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "TOGGLE_UPDATE_STATUS",
          entity: "CommunityUpdate",
          entityId: input.updateId,
          changes: JSON.stringify({ isActive: input.isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  toggleDealStatus: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await prisma.bestDeal.update({
        where: { id: input.dealId },
        data: { isActive: input.isActive },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "TOGGLE_DEAL_STATUS",
          entity: "BestDeal",
          entityId: input.dealId,
          changes: JSON.stringify({ isActive: input.isActive }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return updated;
    }),

  // Settings Management Endpoints
  getSystemSettings: adminProcedure.query(async () => {
    const settings = await prisma.adminSettings.findMany({
      orderBy: { settingKey: "asc" },
    });

    // Convert to key-value object
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.settingKey] = {
        value: setting.settingValue,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
    });

    return settingsMap;
  }),

  updateSystemSetting: adminProcedure
    .input(
      z.object({
        settingKey: z.string(),
        settingValue: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const setting = await prisma.adminSettings.upsert({
        where: { settingKey: input.settingKey },
        create: {
          id: randomUUID(),
          settingKey: input.settingKey,
          settingValue: input.settingValue,
          description: input.description,
          updatedAt: new Date(),
        },
        update: {
          settingValue: input.settingValue,
          description: input.description,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_SETTING",
          entity: "AdminSettings",
          entityId: setting.id,
          changes: JSON.stringify(input),
          status: "success",
          createdAt: new Date(),
        },
      });

      return setting;
    }),

  getPaymentGateways: adminProcedure.query(async () => {
    const now = new Date();
    const defaultGateways = [
      {
        gatewayName: "paystack",
        displayName: "Paystack",
        provider: "paystack",
        displayOrder: 10,
      },
      {
        gatewayName: "flutterwave",
        displayName: "Flutterwave",
        provider: "flutterwave",
        displayOrder: 20,
      },
      {
        gatewayName: "bank-transfer",
        displayName: "Bank Transfer",
        provider: "bank-transfer",
        displayOrder: 30,
      },
      {
        gatewayName: "utility-token",
        displayName: "Utility Token",
        provider: "utility-token",
        displayOrder: 40,
      },
      {
        gatewayName: "crypto",
        displayName: "Crypto",
        provider: "crypto",
        displayOrder: 50,
      },
      {
        gatewayName: "mock",
        displayName: "Mock",
        provider: "mock",
        displayOrder: 60,
      },
    ];

    // Check if table is empty
    const existingCount = await prisma.paymentGatewayConfig.count();
    
    if (existingCount === 0) {
      // Force create defaults if table is empty
      for (const gateway of defaultGateways) {
        await prisma.paymentGatewayConfig.create({
          data: {
            id: randomUUID(),
            gatewayName: gateway.gatewayName,
            displayName: gateway.displayName,
            provider: gateway.provider,
            isActive: false,
            supportedMethods: [],
            currency: "NGN",
            displayOrder: gateway.displayOrder,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    return await prisma.paymentGatewayConfig.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }),

  updatePaymentGateway: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        // Paystack & Flutterwave fields
        publicKey: z.string().optional(),
        secretKey: z.string().optional(),
        merchantId: z.string().optional(),
        webhookUrl: z.string().optional(),
        callbackUrl: z.string().optional(),
        // Crypto fields
        apiProvider: z.string().optional(),
        merchantKey: z.string().optional(),
        cryptoPublicKey: z.string().optional(),
        cryptoSecretKey: z.string().optional(),
        cryptoDepositAddress: z.string().optional(),
        cryptoNetwork: z.string().optional(),
        // Bank Transfer fields
        bankName: z.string().optional(),
        bankAccount: z.string().optional(),
        bankAccountName: z.string().optional(),
        // Utility Token fields
        tokenName: z.string().optional(),
        tokenSymbol: z.string().optional(),
        tokenContractAddress: z.string().optional(),
        tokenomicsUrl: z.string().optional(),
        homePageUrl: z.string().optional(),
        currentPriceNgn: z.number().optional(),
        currentPriceUsd: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Guard: prevent activating gateways that have no backend implementation
      if (data.isActive === true) {
        const existing = await prisma.paymentGatewayConfig.findUnique({ where: { id } });
        const IMPLEMENTED_GATEWAYS = new Set(["paystack", "flutterwave", "mock", "crypto", "bank-transfer", "utility-token"]);
        if (existing && !IMPLEMENTED_GATEWAYS.has(existing.gatewayName)) {
          throw new Error(
            `Cannot activate '${existing.displayName}' — this payment gateway does not have a backend implementation yet. ` +
            `Only Paystack and Flutterwave are currently supported.`
          );
        }
      }

      const gateway = await prisma.paymentGatewayConfig.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_PAYMENT_GATEWAY",
          entity: "PaymentGatewayConfig",
          entityId: id,
          changes: JSON.stringify({
            ...data,
            secretKey: data.secretKey ? "***REDACTED***" : undefined,
            cryptoSecretKey: data.cryptoSecretKey ? "***REDACTED***" : undefined,
            merchantKey: data.merchantKey ? "***REDACTED***" : undefined,
          }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return gateway;
    }),

  getNotificationSettings: adminProcedure.query(async () => {
    return await prisma.adminNotificationSettings.findMany({
      orderBy: { notificationType: "asc" },
    });
  }),

  updateNotificationSetting: adminProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const setting = await prisma.adminNotificationSettings.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "UPDATE_NOTIFICATION_SETTING",
          entity: "AdminNotificationSettings",
          entityId: id,
          changes: JSON.stringify(data),
          status: "success",
          createdAt: new Date(),
        },
      });

      return setting;
    }),

  initializeNotificationSettings: adminProcedure
    .mutation(async ({ ctx }) => {
      const now = new Date();
      const existing = await prisma.adminNotificationSettings.count();

      const defaults = [
        "user_registered",
        "payment_received",
        "payment_failed",
        "membership_activated",
        "membership_upgraded",
        "withdrawal_requested",
        "withdrawal_processed",
      ];

      if (existing === 0) {
        for (const type of defaults) {
          await prisma.adminNotificationSettings.create({
            data: {
              id: randomUUID(),
              notificationType: type,
              enabled: true,
              emailEnabled: true,
              smsEnabled: false,
              pushEnabled: false,
              createdAt: now,
              updatedAt: now,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: (ctx.session?.user as any)?.id || "system",
            action: "INITIALIZE_NOTIFICATION_SETTINGS",
            entity: "AdminNotificationSettings",
            entityId: "bulk",
            changes: JSON.stringify({ created: defaults.length }),
            status: "success",
            createdAt: now,
          },
        });
      }

      return await prisma.adminNotificationSettings.findMany({
        orderBy: { notificationType: "asc" },
      });
    }),

  // Backup & Restore
  createBackup: superAdminProcedure
    .mutation(async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
      const filename = `backup-${timestamp}.sql`;
      const filePath = path.join(backupDir, filename);

      // Ensure directory exists
      await fs.promises.mkdir(backupDir, { recursive: true });

      // Use pg_dump for a complete database backup (all tables, FK ordering, data integrity)
      const rawDbUrl = process.env.DATABASE_URL;
      if (!rawDbUrl) {
        throw new Error("DATABASE_URL is not configured");
      }
      // pg_dump doesn't support the ?schema= query parameter — strip it
      const dbUrl = rawDbUrl.replace(/[?&]schema=[^&]*/g, "").replace(/\?$/, "");

      try {
        execSync(
          `pg_dump --no-owner --no-privileges --clean --if-exists "${dbUrl}" -f "${filePath}"`,
          { timeout: 120_000, stdio: "pipe" }
        );
      } catch (err: any) {
        const stderr = err?.stderr?.toString() || "";
        throw new Error(`pg_dump failed: ${stderr || err.message}`);
      }

      const stats = await fs.promises.stat(filePath);

      // Enforce retention policy (keep last N backups)
      try {
        const retentionSetting = await prisma.adminSettings.findUnique({
          where: { settingKey: "backup.retention.count" },
        });
        const retentionCount = retentionSetting ? parseInt(retentionSetting.settingValue, 10) : NaN;
        if (!Number.isNaN(retentionCount) && retentionCount > 0) {
          const files = await fs.promises.readdir(backupDir);
          const backupFiles = files.filter((f) => f.endsWith(".sql") || f.endsWith(".json"));
          const withTimes = await Promise.all(
            backupFiles.map(async (f) => {
              const s = await fs.promises.stat(path.join(backupDir, f));
              return { f, t: s.birthtime.getTime() };
            }),
          );
          withTimes.sort((a, b) => b.t - a.t);
          const toDelete = withTimes.slice(retentionCount);
          for (const d of toDelete) {
            try {
              await fs.promises.unlink(path.join(backupDir, d.f));
            } catch (err) {
              console.warn(`[ADMIN][BACKUP] Failed to delete old backup ${d.f}:`, err instanceof Error ? err.message : err);
            }
          }
        }
      } catch (err) {
        console.warn("[ADMIN][BACKUP] Backup retention cleanup failed:", err instanceof Error ? err.message : err);
      }

      return {
        filename,
        url: `/uploads/backups/${filename}`,
        createdAt: new Date().toISOString(),
        size: stats.size,
        counts: {
          note: "Full PostgreSQL dump — all tables included",
        },
      };
    }),

  restoreDatabase: superAdminProcedure
    .input(
      z.object({
        // Client uploads file content as string (SQL or JSON)
        data: z.any(),
        format: z.enum(["sql", "json"]).default("sql"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error("DATABASE_URL is not configured");
      }

      if (input.format === "sql" || (typeof input.data === "string" && input.data.trimStart().startsWith("--"))) {
        // SQL dump restore via psql
        const sqlContent = typeof input.data === "string" ? input.data : JSON.stringify(input.data);
        const tmpFile = path.join(process.cwd(), `tmp-restore-${Date.now()}.sql`);
        try {
          await fs.promises.writeFile(tmpFile, sqlContent, "utf-8");
          execSync(
            `psql "${dbUrl}" -f "${tmpFile}"`,
            { timeout: 300_000, stdio: "pipe" }
          );
        } catch (err: any) {
          const stderr = err?.stderr?.toString() || "";
          // psql may emit NOTICEs for "table does not exist" on --clean; that's OK
          // Only throw if there's a real fatal error
          if (stderr.includes("FATAL") || stderr.includes("could not connect")) {
            throw new Error(`Restore failed: ${stderr}`);
          }
        } finally {
          try { await fs.promises.unlink(tmpFile); } catch (_) {}
        }
      } else {
        // Legacy JSON restore (backward-compatible with old backup files)
        const payload = typeof input.data === "string" ? JSON.parse(input.data) : input.data;
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid backup payload");
        }

        // Use a transaction with deferred FK checks for JSON restores
        await prisma.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED");

        const upsertArray = async (model: any, items: any[], idKey: string = "id") => {
          for (const item of items || []) {
            try {
              const id = item[idKey];
              if (!id) continue;
              await model.upsert({
                where: { [idKey]: id },
                create: item,
                update: item,
              });
            } catch (err) {
              try {
                await model.create({ data: item });
              } catch (createErr) {
                console.warn(`[ADMIN][RESTORE] Skipped row (constraint violation):`, createErr instanceof Error ? createErr.message : createErr);
              }
            }
          }
        };

        // Restore reference/lookup tables first, then dependents
        await upsertArray(prisma.adminSettings, payload.adminSettings || []);
        await upsertArray(prisma.paymentGatewayConfig, payload.gateways || []);
        await upsertArray(prisma.membershipPackage, payload.packages || []);

        // Users: null out self-referential sponsorId first, insert, then patch sponsors
        const users = payload.users || [];
        const sponsorMap = new Map<string, string>();
        for (const u of users) {
          if (u.sponsorId) {
            sponsorMap.set(u.id, u.sponsorId);
            u.sponsorId = null;
          }
        }
        await upsertArray(prisma.user, users);
        // Re-link sponsors now that all users exist
        for (const [userId, sponsorId] of sponsorMap) {
          try {
            await prisma.user.update({ where: { id: userId }, data: { sponsorId } });
          } catch (err) {
            console.warn(`[ADMIN][RESTORE] Failed to re-link sponsor for user ${userId}:`, err instanceof Error ? err.message : err);
          }
        }

        await upsertArray(prisma.referral, payload.referrals || []);
        await upsertArray(prisma.referralTree, payload.referralTrees || []);
        await upsertArray(prisma.transaction, payload.transactions || []);
        await upsertArray(prisma.pendingPayment, payload.pendingPayments || []);
        await upsertArray(prisma.communityUpdate, payload.communityUpdates || []);
        await upsertArray(prisma.bestDeal, payload.bestDeals || []);
        await upsertArray(prisma.adminNotificationSettings, payload.notifications || []);

        for (const log of payload.auditLogs || []) {
          try {
            await prisma.auditLog.create({ data: log });
          } catch (err) {
            console.warn(`[ADMIN][RESTORE] Failed to restore audit log entry:`, err instanceof Error ? err.message : err);
          }
        }

        try { await prisma.$executeRawUnsafe("SET CONSTRAINTS ALL IMMEDIATE"); } catch (err) {
          console.error("[ADMIN][RESTORE] Failed to re-enable constraints:", err instanceof Error ? err.message : err);
        }
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "RESTORE_DATABASE",
          entity: "Backup",
          entityId: new Date().toISOString(),
          changes: JSON.stringify({ format: input.format }),
          status: "success",
          createdAt: new Date(),
        },
      });

      return { restored: true };
    }),

  listBackups: adminProcedure.query(async () => {
    const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
    try {
      await fs.promises.mkdir(backupDir, { recursive: true });
      const files = await fs.promises.readdir(backupDir);
      const items = await Promise.all(
        files
          .filter((f) => f.endsWith(".json") || f.endsWith(".sql"))
          .map(async (filename) => {
            const full = path.join(backupDir, filename);
            const stats = await fs.promises.stat(full);
            return {
              filename,
              url: `/uploads/backups/${filename}`,
              size: stats.size,
              createdAt: stats.birthtime.toISOString(),
              format: filename.endsWith(".sql") ? "sql" as const : "json" as const,
            };
          })
      );
      // Newest first
      items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    } catch (e) {
      return [] as any[];
    }
  }),

  deleteBackup: adminProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
      const target = path.resolve(backupDir, input.filename);
      // Safety: prevent path traversal and restrict to backup extensions
      if (!target.startsWith(backupDir) || input.filename.includes("..")) {
        throw new Error("Invalid backup file path");
      }
      if (!input.filename.endsWith(".json") && !input.filename.endsWith(".sql")) {
        throw new Error("Invalid backup file");
      }
      try {
        await fs.promises.unlink(target);
      } catch (e: any) {
        throw new Error(e?.message || "Failed to delete backup");
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "DELETE_BACKUP",
          entity: "Backup",
          entityId: input.filename,
          status: "success",
          createdAt: new Date(),
        },
      });

      return { deleted: true };
    }),

  wipeNonEssentialData: superAdminProcedure
    .input(
      z.object({
        confirmPhrase: z.string().min(1, "Confirmation phrase is required"),
        superAdminEmail: z.string().email(),
        superAdminPassword: z.string().min(8, "Password must be at least 8 characters"),
        superAdminName: z.string().min(1).max(120).default("Super Admin"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = (ctx.session?.user as any)?.role;
      if (role !== "super_admin") {
        throw new Error("Super admin privileges required for data wipes");
      }

      const requiredPhrase = (process.env.ADMIN_RESET_CONFIRM_PHRASE || "WIPE").toLowerCase();
      if (input.confirmPhrase.trim().toLowerCase() !== requiredPhrase) {
        throw new Error(`Confirmation phrase mismatch. Type "${requiredPhrase}" to proceed.`);
      }

      const keepTables = new Set(
        [
          "_prisma_migrations",
          "adminsettings",
          "adminnotificationsettings",
          "paymentgatewayconfig",
          "membershippackage",
          "systemwallet",
          "bptconversionrate",
          "youtubeplan",
          "thirdpartyplatform",
          "palliativeoption",
          "communityfeature",
          "leadershippool",
          "investorspool",
          "communitystats",
        ].map((n) => n.toLowerCase())
      );

      const tables = await prisma.$queryRaw<
        Array<{ tablename: string; schemaname: string; quoted_name: string }>
      >`
        SELECT tablename, schemaname, quote_ident(tablename) as quoted_name
        FROM pg_tables
        WHERE schemaname = 'public'
      `;

      const toTruncate = tables.filter(
        (t: any) => !keepTables.has(t.tablename.toLowerCase()) && t.tablename !== "_prisma_migrations"
      );
      const now = new Date();

      const passwordHash = await hash(input.superAdminPassword, 10);

      const result = await prisma.$transaction(async (tx: any) => {
        if (toTruncate.length) {
          const quoted = toTruncate
            .map((t: any) => `"${t.schemaname}".${t.quoted_name}`)
            .join(", ");
          await tx.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
        }

        const superAdmin = await tx.user.upsert({
          where: { email: input.superAdminEmail },
          update: {
            name: input.superAdminName,
            passwordHash,
            role: "super_admin",
            activated: true,
            verified: true,
            emailVerified: now,
            updatedAt: now,
          },
          create: {
            id: randomUUID(),
            email: input.superAdminEmail,
            name: input.superAdminName,
            passwordHash,
            role: "super_admin",
            activated: true,
            verified: true,
            emailVerified: now,
            createdAt: now,
            updatedAt: now,
          },
        });

        try {
          await tx.auditLog.create({
            data: {
              id: randomUUID(),
              userId: (ctx.session?.user as any)?.id || "system",
              action: "WIPE_NON_ESSENTIAL_DATA",
              entity: "Database",
              entityId: "wipe",
              changes: JSON.stringify({ truncated: toTruncate }),
              status: "success",
              createdAt: now,
            },
          });
        } catch (err) {
          console.error("[ADMIN] Failed to write WIPE_NON_ESSENTIAL_DATA audit log:", err instanceof Error ? err.message : err);
        }

        return { superAdmin };
      });

      const [userCount, transactionCount, referralCount, notificationCount] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.referral.count(),
        prisma.notification.count(),
      ]);

      return {
        truncatedTables: toTruncate.map((t: any) => t.tablename),
        keptTables: Array.from(keepTables),
        superAdminEmail: result.superAdmin.email,
        confirmationPhrase: requiredPhrase,
        counts: {
          users: userCount,
          transactions: transactionCount,
          referrals: referralCount,
          notifications: notificationCount,
        },
      };
    }),

  listDatabaseTables: adminProcedure.query(async () => {
    const tables = await prisma.$queryRaw<
      Array<{
        schemaname: string;
        tablename: string;
        quoted_name: string;
        row_estimate: number | null;
        total_bytes: bigint | number | string | null;
      }>
    >`
      SELECT
        t.schemaname,
        t.tablename,
        quote_ident(t.tablename) AS quoted_name,
        COALESCE(pgc.reltuples::bigint, 0) AS row_estimate,
        pg_total_relation_size(('"' || t.schemaname || '"."' || t.tablename || '"')::regclass) AS total_bytes
      FROM pg_catalog.pg_tables t
      LEFT JOIN pg_class pgc
        ON pgc.oid = format('"%s"."%s"', t.schemaname, t.tablename)::regclass
      WHERE t.schemaname = 'public'
      ORDER BY t.tablename;
    `;

    return tables.map((table: any) => ({
      schema: table.schemaname,
      name: table.tablename,
      quotedName: table.quoted_name,
      rowEstimate: Number(table.row_estimate ?? 0),
      totalBytes: Number((table.total_bytes as any) ?? 0),
    }));
  }),

  truncateTable: superAdminProcedure
    .input(z.object({ tableName: z.string().min(1, "Table name is required") }))
    .mutation(async ({ input, ctx }) => {
      const now = new Date();

      const records = await prisma.$queryRaw<
        Array<{ schemaname: string; tablename: string; quoted_name: string }>
      >`
        SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = ${input.tableName}
      `;

      const target = records[0];
      if (!target) {
        throw new Error("Table not found in public schema");
      }

      const fullyQualified = `"${target.schemaname}".${target.quoted_name}`;
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE ${fullyQualified} RESTART IDENTITY CASCADE;`
      );

      try {
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: (ctx.session?.user as any)?.id || "system",
            action: "TRUNCATE_TABLE",
            entity: "DatabaseTable",
            entityId: target.tablename,
            status: "success",
            changes: JSON.stringify({ table: target.tablename }),
            createdAt: now,
          },
        });
      } catch (err) {
        console.error(`[ADMIN] Failed to write TRUNCATE_TABLE audit log for ${target.tablename}:`, err instanceof Error ? err.message : err);
      }

      return { truncated: target.tablename };
    }),

  previewTable: adminProcedure
    .input(
      z.object({
        tableName: z.string().min(1, "Table name is required"),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const exists = await prisma.$queryRaw<
        Array<{ schemaname: string; tablename: string; quoted_name: string }>
      >`
        SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = ${input.tableName}
      `;

      const target = exists[0];
      if (!target) {
        throw new Error("Table not found in public schema");
      }

      const tableIdent = `"${target.schemaname}".${target.quoted_name}`;

      const columns = await prisma.$queryRaw<
        Array<{ column_name: string; data_type: string }>
      >`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = ${target.schemaname} AND table_name = ${target.tablename}
        ORDER BY ordinal_position
      `;

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM ${tableIdent} ORDER BY 1 LIMIT ${input.limit};`
      );

      return {
        columns,
        rows,
        table: target.tablename,
        schema: target.schemaname,
        limit: input.limit,
      };
    }),

  getWipeEligibility: adminProcedure.query(async () => {
    const tables = await prisma.$queryRaw<
      Array<{ schemaname: string; tablename: string; quoted_name: string }>
    >`
      SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const withCounts = await Promise.all(
      tables.map(async (t: any) => {
        const tableIdent = `"${t.schemaname}".${t.quoted_name}`;
        const result = await prisma.$queryRawUnsafe<
          Array<{ row_count: bigint | number | string }>
        >(`SELECT COUNT(*)::bigint AS row_count FROM ${tableIdent};`);
        const rowCount = Number(result?.[0]?.row_count ?? 0);
        return {
          schema: t.schemaname,
          name: t.tablename,
          rowCount,
          eligible: rowCount === 0,
        };
      })
    );

    return withCounts;
  }),

  getWipeProfile: adminProcedure.query(async () => {
    const setting = await prisma.adminSettings.findUnique({
      where: { settingKey: "db_wipe_profile" },
    });

    if (!setting) {
      return {
        wipeableTables: [],
        protectedTables: [],
        capturedAt: null as string | null,
      };
    }

    try {
      const parsed = JSON.parse(setting.settingValue || "{}") as {
        wipeableTables?: string[];
        protectedTables?: string[];
        capturedAt?: string;
      };
      return {
        wipeableTables: parsed.wipeableTables || [],
        protectedTables: parsed.protectedTables || [],
        capturedAt: parsed.capturedAt || null,
      };
    } catch (_) {
      return {
        wipeableTables: [],
        protectedTables: [],
        capturedAt: null as string | null,
      };
    }
  }),

  captureWipeProfile: adminProcedure.mutation(async ({ ctx }) => {
    const tables = await prisma.$queryRaw<
      Array<{ schemaname: string; tablename: string; quoted_name: string }>
    >`
      SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const withCounts = await Promise.all(
      tables.map(async (t: any) => {
        const tableIdent = `"${t.schemaname}".${t.quoted_name}`;
        const result = await prisma.$queryRawUnsafe<
          Array<{ row_count: bigint | number | string }>
        >(`SELECT COUNT(*)::bigint AS row_count FROM ${tableIdent};`);
        const rowCount = Number(result?.[0]?.row_count ?? 0);
        return { ...t, rowCount };
      })
    );

    const wipeableTables = withCounts.filter((t: any) => t.rowCount === 0).map((t: any) => t.tablename);
    const protectedTables = withCounts.filter((t: any) => t.rowCount > 0).map((t: any) => t.tablename);
    const capturedAt = new Date().toISOString();

    await prisma.adminSettings.upsert({
      where: { settingKey: "db_wipe_profile" },
      update: {
        settingValue: JSON.stringify({ wipeableTables, protectedTables, capturedAt }),
        description: "Captured wipeable/protected table lists for database reset",
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        settingKey: "db_wipe_profile",
        settingValue: JSON.stringify({ wipeableTables, protectedTables, capturedAt }),
        description: "Captured wipeable/protected table lists for database reset",
        updatedAt: new Date(),
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "CAPTURE_WIPE_PROFILE",
          entity: "Database",
          entityId: "wipe-profile",
          status: "success",
          changes: JSON.stringify({ wipeableTables, protectedTables }),
          createdAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[ADMIN] Failed to write CAPTURE_WIPE_PROFILE audit log:", err instanceof Error ? err.message : err);
    }

    return { wipeableTables, protectedTables, capturedAt };
  }),

  wipeStoredTables: superAdminProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    const setting = await prisma.adminSettings.findUnique({
      where: { settingKey: "db_wipe_profile" },
    });

    if (!setting) {
      throw new Error("No wipe profile captured yet");
    }

    let wipeableTables: string[] = [];
    try {
      const parsed = JSON.parse(setting.settingValue || "{}") as { wipeableTables?: string[] };
      wipeableTables = parsed.wipeableTables || [];
    } catch (_) {
      wipeableTables = [];
    }

    if (!wipeableTables.length) {
      throw new Error("No wipeable tables stored in wipe profile");
    }

    const tables = await prisma.$queryRaw<
      Array<{ schemaname: string; tablename: string; quoted_name: string }>
    >`
      SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const requested = new Set(wipeableTables.map((t) => t.toLowerCase()));
    const candidates = tables.filter((t: any) => requested.has(t.tablename.toLowerCase()));
    const missing = wipeableTables.filter(
      (t: any) => !candidates.some((c: any) => c.tablename.toLowerCase() === t.toLowerCase())
    );

    if (candidates.length) {
      const quoted = candidates
        .map((t: any) => `"${t.schemaname}".${t.quoted_name}`)
        .join(", ");
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
    }

    try {
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: (ctx.session?.user as any)?.id || "system",
          action: "WIPE_STORED_TABLES",
          entity: "Database",
          entityId: "wipe-stored",
          status: "success",
          changes: JSON.stringify({ wiped: candidates.map((t: any) => t.tablename), missing }),
          createdAt: now,
        },
      });
    } catch (err) {
      console.error("[ADMIN] Failed to write WIPE_STORED_TABLES audit log:", err instanceof Error ? err.message : err);
    }

    return {
      wipedTables: candidates.map((t: any) => t.tablename),
      missingTables: missing,
      totalRequested: wipeableTables.length,
    };
  }),

  exportTableData: superAdminProcedure
    .input(z.object({ tableName: z.string().min(1, "Table name is required") }))
    .query(async ({ input }) => {
      const exists = await prisma.$queryRaw<
        Array<{ schemaname: string; tablename: string; quoted_name: string }>
      >`
        SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = ${input.tableName}
      `;

      const target = exists[0];
      if (!target) {
        throw new Error("Table not found in public schema");
      }

      const tableIdent = `"${target.schemaname}".${target.quoted_name}`;
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM ${tableIdent};`);

      return {
        tableName: target.tablename,
        schema: target.schemaname,
        rowCount: rows.length,
        data: rows,
        exportedAt: new Date().toISOString(),
      };
    }),

  importTableData: superAdminProcedure
    .input(
      z.object({
        tableName: z.string().min(1, "Table name is required"),
        data: z.array(z.record(z.any())),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const now = new Date();

      if (!input.data.length) {
        throw new Error("No data provided for import");
      }

      const exists = await prisma.$queryRaw<
        Array<{ schemaname: string; tablename: string; quoted_name: string }>
      >`
        SELECT schemaname, tablename, quote_ident(tablename) as quoted_name
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = ${input.tableName}
      `;

      const target = exists[0];
      if (!target) {
        throw new Error("Table not found in public schema");
      }

      const tableIdent = `"${target.schemaname}".${target.quoted_name}`;

      // Get column names from the first row
      const columns = Object.keys(input.data[0]);
      
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      // Import each row with upsert logic
      for (const row of input.data) {
        try {
          const columnNames = columns.map((col) => `"${col}"`).join(", ");
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          const values = columns.map((col) => {
            const val = row[col];
            // Handle dates
            if (val && typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
              return new Date(val);
            }
            return val;
          });

          // Check if row exists (assumes first column is ID)
          const idCol = columns[0];
          const existing = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM ${tableIdent} WHERE "${idCol}" = $1 LIMIT 1;`,
            row[idCol]
          );

          if (existing.length > 0) {
            // Update existing row
            const setClauses = columns
              .map((col, i) => `"${col}" = $${i + 1}`)
              .join(", ");
            await prisma.$queryRawUnsafe(
              `UPDATE ${tableIdent} SET ${setClauses} WHERE "${idCol}" = $${columns.length + 1};`,
              ...values,
              row[idCol]
            );
            updated++;
          } else {
            // Insert new row
            await prisma.$queryRawUnsafe(
              `INSERT INTO ${tableIdent} (${columnNames}) VALUES (${placeholders});`,
              ...values
            );
            inserted++;
          }
        } catch (err) {
          console.error(`Error importing row:`, err);
          errors++;
        }
      }

      try {
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: (ctx.session?.user as any)?.id || "system",
            action: "IMPORT_TABLE_DATA",
            entity: "DatabaseTable",
            entityId: target.tablename,
            status: "success",
            changes: JSON.stringify({ inserted, updated, errors, totalRows: input.data.length }),
            createdAt: now,
          },
        });
      } catch (err) {
        console.error(`[ADMIN] Failed to write IMPORT_TABLE_DATA audit log for ${target.tablename}:`, err instanceof Error ? err.message : err);
      }

      return {
        tableName: target.tablename,
        inserted,
        updated,
        errors,
        totalRows: input.data.length,
      };
    }),

  getPendingEmpowermentPackages: adminProcedure.query(async () => {
    return await prisma.empowermentPackage.findMany({
      where: {
        OR: [
          { status: "Pending Maturity" },
          { status: "Pending Maturity (24 Months)" }
        ],
        adminApproved: false,
      },
      include: {
        User_EmpowermentPackage_sponsorIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        User_EmpowermentPackage_beneficiaryIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        EmpowermentTransaction: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { maturityDate: "asc" },
    });
  }),

  getAllEmpowerments: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const where = input.status ? { status: input.status } : {};

      return await prisma.empowermentPackage.findMany({
        where,
        include: {
          User_EmpowermentPackage_sponsorIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          User_EmpowermentPackage_beneficiaryIdToUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get L5-L10 shelter rewards (admin only visibility)
  getShelterRewardsExtended: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        minLevel: z.number().default(5),
        maxLevel: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const where: any = {
        level: {
          gte: input.minLevel,
          lte: input.maxLevel,
        },
      };

      if (input.userId) {
        where.userId = input.userId;
      }

      return await prisma.shelterReward.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [{ level: "asc" }, { createdAt: "desc" }],
      });
    }),

  // Get shelter reward statistics
  getShelterStats: adminProcedure.query(async () => {
    const totalShelterRewards = await prisma.shelterReward.count();
    const totalShelterAmount = await prisma.shelterReward.aggregate({
      _sum: { amount: true },
    });

    const rewardsByPackage = await prisma.shelterReward.groupBy({
      by: ["packageType"],
      _count: true,
      _sum: { amount: true },
    });

    // Get level distribution
    const levelDistribution = await prisma.shelterReward.groupBy({
      by: ["level"],
      _count: true,
      _sum: { amount: true },
      orderBy: { level: "asc" },
    });

    return {
      totalRewards: totalShelterRewards,
      totalAmount: totalShelterAmount._sum.amount || 0,
      byLevel: levelDistribution.map((r: any) => ({
        level: r.level,
        count: r._count,
        total: r._sum.amount || 0,
      })),
      byPackage: rewardsByPackage.map((r: any) => ({
        packageType: r.packageType,
        count: r._count,
        total: r._sum.amount || 0,
      })),
    };
  }),

  // Get BPT buy-back wallet balance
  getBuyBackWalletBalance: adminProcedure.query(async () => {
    const buyBackWallet = await prisma.systemWallet.findFirst({
      where: { name: "BPI Token Buy-Back Wallet" },
    });

    if (!buyBackWallet) {
      return {
        balanceNgn: 0,
        balanceBpt: 0,
        balanceUsd: 0,
      };
    }

    return {
      balanceNgn: buyBackWallet.balanceNgn,
      balanceBpt: buyBackWallet.balanceBpt,
      balanceUsd: buyBackWallet.balanceUsd,
    };
  }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async () => {
    const [totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { activated: true } }),
      prisma.packageActivation.count(),
      prisma.renewalHistory.count(),
      prisma.empowermentPackage.count(),
      prisma.empowermentPackage.count({
        where: {
          OR: [
            { status: "Pending Maturity" },
            { status: "Pending Maturity (24 Months)" }
          ],
          adminApproved: false,
        },
      }),
    ]);

    // Get total BPT distributed (member share only)
    const totalBptDistributed = await prisma.tokenTransaction.aggregate({
      _sum: { memberAmount: true },
    });

    return {
      totalUsers,
      activeMembers,
      totalPackageActivations,
      totalRenewals,
      totalEmpowerments,
      pendingEmpowerments,
      totalBptDistributed: totalBptDistributed._sum.memberAmount || 0,
    };
  }),

  // Get user's full wallet details (admin view)
  getUserWallets: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          wallet: true,
          palliative: true,
          cashback: true,
          bpiTokenWallet: true,
          shelter: true,
          health: true,
          meal: true,
          security: true,
          education: true,
          community: true,
          spendable: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          renewalCount: true,
        },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      return user;
    }),

  approveEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Approved – Activation Pending" },
      });
    }),

  triggerFallbackProtection: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input }) => {
      const FALLBACK_NET_AMOUNT = 366300;

      const pkg = await prisma.empowermentPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!pkg) {
        throw new Error("Package not found");
      }

      // Add funds to sponsor's main wallet
      await prisma.user.update({
        where: { id: pkg.sponsorId },
        data: { wallet: { increment: FALLBACK_NET_AMOUNT } },
      });

      return await prisma.empowermentPackage.update({
        where: { id: input.packageId },
        data: { status: "Fallback Protection Activated" },
      });
    }),
  
  convertEmpowermentPackage: adminProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ input, ctx }) => {
        const empowermentPackage = await prisma.empowermentPackage.findUnique({
          where: { id: input.packageId },
          include: {
            User_EmpowermentPackage_sponsorIdToUser: {
              select: { id: true, wallet: true, name: true, email: true }
            },
            User_EmpowermentPackage_beneficiaryIdToUser: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        if (!empowermentPackage) {
          throw new Error("Empowerment package not found");
        }

        if (empowermentPackage.isConverted) {
          throw new Error("This empowerment package has already been converted");
        }

        // BALANCE VALIDATION: Use existing package fee as validation
        const sponsorId = empowermentPackage.sponsorId;
        const beneficiaryId = empowermentPackage.beneficiaryId;
        const packageFee = empowermentPackage.packageFee || 330000;
        
        // Note: In production, you may want to track actual payments separately
        console.log(`✅ [EMPOWERMENT] Converting package for beneficiary ${beneficiaryId}`);
        console.log(`📊 [EMPOWERMENT] Package fee: ₦${packageFee.toLocaleString()}`);

        // Verify sponsor wallet has sufficient balance if additional funds needed
        const sponsor = empowermentPackage.User_EmpowermentPackage_sponsorIdToUser;
        if (!sponsor) {
          throw new Error("Sponsor not found");
        }

        console.log(`✅ [EMPOWERMENT] Converting package for beneficiary ${beneficiaryId}`);
        console.log(`📊 [EMPOWERMENT] Package fee: ₦${packageFee.toLocaleString()}`);

        // Update package status
        const updated = await prisma.empowermentPackage.update({
            where: { id: input.packageId },
            data: { 
              status: "Converted to Regular Plus", 
              isConverted: true,
              updatedAt: new Date()
            },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: (ctx.session?.user as any)?.id || "system",
            action: "CONVERT_EMPOWERMENT_PACKAGE",
            entity: "EmpowermentPackage",
            entityId: input.packageId,
            changes: JSON.stringify({
              sponsorId,
              beneficiaryId,
              packageFee,
              status: "Converted to Regular Plus"
            }),
            status: "success",
            createdAt: new Date()
          }
        });

        return updated;
    }),

  // ============ TRAINING CENTER ADMIN CONTROLS ============
  
  // Get all training courses
  getAllCourses: adminProcedure.query(async () => {
    return await prisma.trainingCourse.findMany({
      include: {
        TrainingLesson: {
          orderBy: { lessonOrder: 'asc' },
        },
        _count: {
          select: {
            TrainingLesson: true,
            TrainingProgress: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }),

  // Create training course
  createCourse: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      displayOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.trainingCourse.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  // Update training course
  updateCourse: adminProcedure
    .input(z.object({
      courseId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      thumbnailUrl: z.string().optional(),
      estimatedHours: z.number().optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { courseId, ...data } = input;
      return await prisma.trainingCourse.update({
        where: { id: courseId },
        data,
      });
    }),

  // Delete training course
  deleteCourse: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.trainingCourse.delete({
        where: { id: input.courseId },
      });
    }),

  // Create lesson
  createLesson: adminProcedure
    .input(z.object({
      courseId: z.string(),
      title: z.string(),
      content: z.string(),
      lessonOrder: z.number(),
      videoUrl: z.string().optional(),
      documentUrl: z.string().optional(),
      estimatedMinutes: z.number().optional(),
      quizQuestions: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      return await prisma.trainingLesson.create({
        data: {
          id: randomUUID(),
          ...input,
          updatedAt: new Date(),
        },
      });
    }),

  // Update lesson
  updateLesson: adminProcedure
    .input(z.object({
      lessonId: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      lessonOrder: z.number().optional(),
      videoUrl: z.string().optional(),
      documentUrl: z.string().optional(),
      estimatedMinutes: z.number().optional(),
      quizQuestions: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { lessonId, ...data } = input;
      return await prisma.trainingLesson.update({
        where: { id: lessonId },
        data,
      });
    }),

  // Delete lesson
  deleteLesson: adminProcedure
    .input(z.object({ lessonId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.trainingLesson.delete({
        where: { id: input.lessonId },
      });
    }),

  // Get course enrollment statistics
  getCourseStats: adminProcedure.query(async () => {
    const totalCourses = await prisma.trainingCourse.count();
    const activeCourses = await prisma.trainingCourse.count({ where: { isActive: true } });
    const totalEnrollments = await prisma.trainingProgress.count();
    const completedEnrollments = await prisma.trainingProgress.count({
      where: { completedAt: { not: null } },
    });

    const topCourses = await prisma.trainingCourse.findMany({
      take: 5,
      include: {
        _count: {
          select: { TrainingProgress: true },
        },
      },
      orderBy: {
        TrainingProgress: {
          _count: 'desc',
        },
      },
    });

    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
      topCourses: topCourses.map((c: any) => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.TrainingProgress,
      })),
    };
  }),

  // ============ COMMUNITY UPDATES ADMIN CONTROLS ============
  
  // Get all community updates
  getAllUpdates: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.category) where.category = input.category;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return await prisma.communityUpdate.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          _count: {
            select: {
              UpdateRead: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' },
        ],
      });
    }),

  // Create community update
  createUpdate: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum(['announcement', 'promotion', 'news', 'event', 'policy', 'success']),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      imageUrl: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      publishedAt: z.date().optional(),
      expiresAt: z.date().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.communityUpdate.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          updatedAt: new Date(),
        },
      });
    }),

  // Update community update
  updateUpdate: adminProcedure
    .input(z.object({
      updateId: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      category: z.enum(['announcement', 'promotion', 'news', 'event', 'policy', 'success']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      imageUrl: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      expiresAt: z.date().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { updateId, ...data } = input;
      return await prisma.communityUpdate.update({
        where: { id: updateId },
        data,
      });
    }),

  // Delete community update
  deleteUpdate: adminProcedure
    .input(z.object({ updateId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.communityUpdate.delete({
        where: { id: input.updateId },
      });
    }),

  // Get update statistics
  getUpdateStats: adminProcedure.query(async () => {
    const totalUpdates = await prisma.communityUpdate.count();
    const activeUpdates = await prisma.communityUpdate.count({ where: { isActive: true } });
    
    const updatesByCategory = await prisma.communityUpdate.groupBy({
      by: ['category'],
      _count: true,
    });

    const topUpdates = await prisma.communityUpdate.findMany({
      take: 5,
      orderBy: {
        viewCount: 'desc',
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        clickCount: true,
        category: true,
      },
    });

    return {
      totalUpdates,
      activeUpdates,
      byCategory: updatesByCategory,
      topUpdates,
    };
  }),

  // ============ BEST DEALS ADMIN CONTROLS ============
  
  // Get all deals
  getAllDeals: adminProcedure
    .input(z.object({
      dealType: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.dealType) where.dealType = input.dealType;
      if (input.isActive !== undefined) where.isActive = input.isActive;

      return await prisma.bestDeal.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
          _count: {
            select: {
              DealClaim: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  // Create deal
  createDeal: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      dealType: z.enum(['package_discount', 'referral_bonus', 'bundle', 'loyalty', 'seasonal']),
      discountType: z.enum(['percentage', 'fixed']),
      discountValue: z.number(),
      originalPrice: z.number().optional(),
      startDate: z.date(),
      endDate: z.date(),
      usageLimit: z.number().optional(),
      usagePerUser: z.number().default(1),
      requiresPackage: z.boolean().default(false),
      minRankRequired: z.string().optional(),
      isFeatured: z.boolean().default(false),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      return await prisma.bestDeal.create({
        data: {
          id: randomUUID(),
          ...input,
          createdBy: userId,
          currentUsage: 0,
          updatedAt: new Date(),
        },
      });
    }),

  // Update deal
  updateDeal: adminProcedure
    .input(z.object({
      dealId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      discountValue: z.number().optional(),
      originalPrice: z.number().optional(),
      endDate: z.date().optional(),
      usageLimit: z.number().optional(),
      usagePerUser: z.number().optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { dealId, ...data } = input;
      return await prisma.bestDeal.update({
        where: { id: dealId },
        data,
      });
    }),

  // Delete deal
  deleteDeal: adminProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.bestDeal.delete({
        where: { id: input.dealId },
      });
    }),

  // Get deal statistics
  getDealStats: adminProcedure.query(async () => {
    const totalDeals = await prisma.bestDeal.count();
    const activeDeals = await prisma.bestDeal.count({ 
      where: { 
        isActive: true,
        endDate: { gte: new Date() },
      } 
    });
    
    const totalClaims = await prisma.dealClaim.count();
    const redeemedClaims = await prisma.dealClaim.count({
      where: { usedAt: { not: null } },
    });

    const dealsByType = await prisma.bestDeal.groupBy({
      by: ['dealType'],
      _count: true,
    });

    const topDeals = await prisma.bestDeal.findMany({
      take: 5,
      orderBy: {
        currentUsage: 'desc',
      },
      select: {
        id: true,
        title: true,
        currentUsage: true,
        usageLimit: true,
        dealType: true,
      },
    });

    return {
      totalDeals,
      activeDeals,
      totalClaims,
      redeemedClaims,
      redemptionRate: totalClaims > 0 ? (redeemedClaims / totalClaims) * 100 : 0,
      byType: dealsByType,
      topDeals,
    };
  }),

  getAdminWiringStatus: adminProcedure.query(async () => {
    const backupSummaryPromise = (async () => {
      try {
        const backupDir = path.join(process.cwd(), "public", "uploads", "backups");
        await fs.promises.mkdir(backupDir, { recursive: true });
        const files = await fs.promises.readdir(backupDir);
        const backupFiles = files.filter((f) => f.endsWith(".json"));
        let latestBackup: string | null = null;
        let latestTime = 0;

        for (const f of backupFiles) {
          const stats = await fs.promises.stat(path.join(backupDir, f));
          if (stats.mtimeMs > latestTime) {
            latestTime = stats.mtimeMs;
            latestBackup = stats.mtime.toISOString();
          }
        }

        return { count: backupFiles.length, latest: latestBackup };
      } catch (err) {
        console.warn("[ADMIN] Failed to read backup summary:", err instanceof Error ? err.message : err);
        return { count: 0, latest: null };
      }
    })();

    const [
      updatesCount,
      dealsCount,
      auditCount,
      backupSummary,
      gatewayCount,
      usersCount,
      paymentsCount,
      totalClaims,
      latestUpdate,
      latestDeal,
      latestAudit,
    ] = await Promise.all([
      prisma.communityUpdate.count(),
      prisma.bestDeal.count(),
      prisma.auditLog.count(),
      backupSummaryPromise,
      prisma.paymentGatewayConfig.count(),
      prisma.user.count(),
      prisma.pendingPayment.count(),
      prisma.dealClaim.count(),
      prisma.communityUpdate.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true, id: true } }),
      prisma.bestDeal.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true, id: true, isActive: true } }),
      prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, action: true } }),
    ]);

    const generatedAt = new Date().toISOString();

    const features = [
      {
        key: "community-details",
        title: "Community Details Modals",
        status: updatesCount > 0 ? "wired" : "partial",
        stats: { updates: updatesCount, lastUpdated: latestUpdate?.updatedAt },
        route: "/admin/community",
        component: "CommunityUpdateModal",
        procedures: ["admin.getCommunityUpdateDetails", "admin.updateCommunityUpdate", "admin.deleteCommunityUpdate", "admin.getCommunityUpdates"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "deal-details",
        title: "Deal Details Modals",
        status: dealsCount > 0 ? "wired" : "partial",
        stats: { deals: dealsCount, claims: totalClaims, lastUpdated: latestDeal?.updatedAt },
        route: "/admin/community",
        component: "BestDealModal",
        procedures: ["admin.getBestDealDetails", "admin.updateBestDeal", "admin.deleteDeal", "admin.getBestDeals"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "help-page",
        title: "Help Wiring Status",
        status: auditCount > 0 ? "wired" : "partial",
        stats: { auditLogs: auditCount, lastUpdated: latestAudit?.createdAt },
        route: "/admin/help",
        component: "AdminHelpPage",
        procedures: ["admin.getAdminWiringStatus"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "backups",
        title: "Backups & Restore",
        status: backupSummary.count > 0 ? "wired" : "partial",
        stats: { backups: backupSummary.count, lastBackup: backupSummary.latest },
        route: "/admin/settings?tab=backups",
        component: "BackupsPanel",
        procedures: ["admin.listBackups", "admin.createBackup", "admin.deleteBackup"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "gateways",
        title: "Payment Gateways",
        status: gatewayCount > 0 ? "wired" : "partial",
        stats: { gateways: gatewayCount },
        route: "/admin/payments",
        component: "PaymentGatewaySettings",
        procedures: ["admin.getPaymentGateways", "admin.updatePaymentGateway"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "users",
        title: "Users Module",
        status: usersCount > 0 ? "wired" : "partial",
        stats: { users: usersCount },
        route: "/admin/users",
        component: "AdminUsersTable",
        procedures: ["admin.getUsers", "admin.bulkUpdateUserRoles"],
        routerPath: "server/trpc/router/admin.ts",
      },
      {
        key: "payments",
        title: "Payments Review",
        status: paymentsCount > 0 ? "wired" : "partial",
        stats: { pendingPayments: paymentsCount },
        route: "/admin/payments",
        component: "PaymentsReview",
        procedures: ["admin.getPendingPayments", "admin.reviewPayment"],
        routerPath: "server/trpc/router/admin.ts",
      },
    ];

    return {
      generatedAt,
      features,
    };
  }),

  // ============ EPC & EPP ADMIN CONTROLS ============
  
  // Get all EPC & EPP participants
  getAllEpcEppParticipants: adminProcedure
    .input(z.object({
      minPoints: z.number().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.minPoints) {
        where.totalPoints = { gte: input.minPoints };
      }

      return await prisma.ePCandEPP.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { totalPoints: 'desc' },
        take: input.limit,
      });
    }),

  // Adjust user EPC points (admin override)
  adjustEpcPoints: adminProcedure
    .input(z.object({
      userId: z.string(),
      pointsAdjustment: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const epcRecord = await prisma.ePCandEPP.findUnique({
        where: { userId: input.userId },
      });

      if (!epcRecord) {
        throw new Error("User not found in EPC & EPP program");
      }

      return await prisma.ePCandEPP.update({
        where: { userId: input.userId },
        data: {
          totalPoints: { increment: input.pointsAdjustment },
        },
      });
    }),

  // ============ SOLAR ASSESSMENT ADMIN CONTROLS ============
  
  // Get all solar assessments
  getAllSolarAssessments: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status) {
        where.assessmentStatus = input.status;
      }

      return await prisma.solarAssessment.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              mobile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  // Update solar assessment status
  updateSolarAssessmentStatus: adminProcedure
    .input(z.object({
      assessmentId: z.string(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { assessmentId, status, notes } = input;
      return await prisma.solarAssessment.update({
        where: { id: assessmentId },
        data: {
          assessmentStatus: status,
          consultantNotes: notes,
        },
      });
    }),

  // Get solar assessment statistics
  getSolarAssessmentStats: adminProcedure.query(async () => {
    const totalAssessments = await prisma.solarAssessment.count();
    
    const assessmentsByStatus = await prisma.solarAssessment.groupBy({
      by: ['assessmentStatus'],
      _count: true,
    });

    const avgSystemSize = await prisma.solarAssessment.aggregate({
      _avg: { estimatedSystemSize: true },
    });

    const avgMonthlySavings = await prisma.solarAssessment.aggregate({
      _avg: { estimatedSavings: true },
    });

    return {
      totalAssessments,
      byStatus: assessmentsByStatus,
      avgSystemSize: avgSystemSize._avg.estimatedSystemSize || 0,
      avgMonthlySavings: avgMonthlySavings._avg.estimatedSavings || 0,
    };
  }),

  // Get admin settings for feature toggles
  getSettings: adminProcedure.query(async () => {
    const settings = await prisma.adminSettings.findMany({
      select: {
        settingKey: true,
        settingValue: true,
      },
    });

    // Convert to key-value object with boolean conversion for toggles, string for others
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      // Boolean settings
      if (['enableEpcEpp', 'enableSolarAssessment', 'enableBestDeals', 'enableBpiCalculator', 'enableDigitalFarm', 'enableTrainingCenter', 'enablePromotionalMaterials', 'enableLatestUpdates'].includes(setting.settingKey)) {
        acc[setting.settingKey] = setting.settingValue === 'true';
      } else {
        // String settings
        acc[setting.settingKey] = setting.settingValue;
      }
      return acc;
    }, {} as Record<string, any>);

    // Return with defaults if settings don't exist
    return {
      enableEpcEpp: settingsMap.enableEpcEpp ?? false,
      enableSolarAssessment: settingsMap.enableSolarAssessment ?? false,
      enableBestDeals: settingsMap.enableBestDeals ?? false,
      enableBpiCalculator: settingsMap.enableBpiCalculator ?? true,
      enableDigitalFarm: settingsMap.enableDigitalFarm ?? false,
      enableTrainingCenter: settingsMap.enableTrainingCenter ?? true,
      enablePromotionalMaterials: settingsMap.enablePromotionalMaterials ?? true,
      enableLatestUpdates: settingsMap.enableLatestUpdates ?? true,
      siteTitle: settingsMap.siteTitle ?? 'BPI - BeepAgro Palliative Initiative',
      supportEmail: settingsMap.supportEmail ?? 'support@beepagroafrica.com',
      smtpHost: settingsMap.smtpHost ?? '',
      smtpPort: settingsMap.smtpPort ?? '587',
      smtpUser: settingsMap.smtpUser ?? '',
      smtpPassword: settingsMap.smtpPassword ?? '',
      smtpSecure: settingsMap.smtpSecure ?? 'false',
      smtpFromEmail: settingsMap.smtpFromEmail ?? '',
      smtpFromName: settingsMap.smtpFromName ?? 'BPI Team',
    };
  }),

  // Update admin settings
  updateSettings: adminProcedure
    .input(z.object({
      enableEpcEpp: z.boolean().optional(),
      enableSolarAssessment: z.boolean().optional(),
      enableBestDeals: z.boolean().optional(),
      enableBpiCalculator: z.boolean().optional(),
      enableDigitalFarm: z.boolean().optional(),
      enableTrainingCenter: z.boolean().optional(),
      enablePromotionalMaterials: z.boolean().optional(),
      enableLatestUpdates: z.boolean().optional(),
      siteTitle: z.string().optional(),
      supportEmail: z.string().email().optional(),
      smtpHost: z.string().optional(),
      smtpPort: z.string().optional(),
      smtpUser: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpSecure: z.string().optional(),
      smtpFromEmail: z.string().email().optional(),
      smtpFromName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates = [];

      if (input.enableEpcEpp !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableEpcEpp' },
            create: {
              id: randomUUID(),
              settingKey: 'enableEpcEpp',
              settingValue: String(input.enableEpcEpp),
              description: 'Enable/disable EPC & EPP card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableEpcEpp),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableSolarAssessment !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableSolarAssessment' },
            create: {
              id: randomUUID(),
              settingKey: 'enableSolarAssessment',
              settingValue: String(input.enableSolarAssessment),
              description: 'Enable/disable Solar Assessment card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableSolarAssessment),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableBestDeals !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableBestDeals' },
            create: {
              id: randomUUID(),
              settingKey: 'enableBestDeals',
              settingValue: String(input.enableBestDeals),
              description: 'Enable/disable Best Deals card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableBestDeals),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableBpiCalculator !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableBpiCalculator' },
            create: {
              id: randomUUID(),
              settingKey: 'enableBpiCalculator',
              settingValue: String(input.enableBpiCalculator),
              description: 'Enable/disable BPI Calculator card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableBpiCalculator),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableDigitalFarm !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableDigitalFarm' },
            create: {
              id: randomUUID(),
              settingKey: 'enableDigitalFarm',
              settingValue: String(input.enableDigitalFarm),
              description: 'Enable/disable Digital Farm card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableDigitalFarm),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableTrainingCenter !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableTrainingCenter' },
            create: {
              id: randomUUID(),
              settingKey: 'enableTrainingCenter',
              settingValue: String(input.enableTrainingCenter),
              description: 'Enable/disable Training Center card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableTrainingCenter),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enablePromotionalMaterials !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enablePromotionalMaterials' },
            create: {
              id: randomUUID(),
              settingKey: 'enablePromotionalMaterials',
              settingValue: String(input.enablePromotionalMaterials),
              description: 'Enable/disable Promotional Materials card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enablePromotionalMaterials),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.enableLatestUpdates !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'enableLatestUpdates' },
            create: {
              id: randomUUID(),
              settingKey: 'enableLatestUpdates',
              settingValue: String(input.enableLatestUpdates),
              description: 'Enable/disable Latest Updates card on dashboard',
              updatedAt: new Date(),
            },
            update: {
              settingValue: String(input.enableLatestUpdates),
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.siteTitle !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'siteTitle' },
            create: {
              id: randomUUID(),
              settingKey: 'siteTitle',
              settingValue: input.siteTitle,
              description: 'Site title displayed across the application',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.siteTitle,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.supportEmail !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'supportEmail' },
            create: {
              id: randomUUID(),
              settingKey: 'supportEmail',
              settingValue: input.supportEmail,
              description: 'Support email address for user inquiries',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.supportEmail,
              updatedAt: new Date(),
            },
          })
        );
      }

      // SMTP Configuration
      if (input.smtpHost !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpHost' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpHost',
              settingValue: input.smtpHost,
              description: 'SMTP server hostname',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpHost,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpPort !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpPort' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpPort',
              settingValue: input.smtpPort,
              description: 'SMTP server port',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpPort,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpUser !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpUser' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpUser',
              settingValue: input.smtpUser,
              description: 'SMTP authentication username',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpUser,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpPassword !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpPassword' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpPassword',
              settingValue: input.smtpPassword,
              description: 'SMTP authentication password',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpPassword,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpSecure !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpSecure' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpSecure',
              settingValue: input.smtpSecure,
              description: 'Use TLS/SSL for SMTP connection',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpSecure,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpFromEmail !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpFromEmail' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpFromEmail',
              settingValue: input.smtpFromEmail,
              description: 'Default from email address',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpFromEmail,
              updatedAt: new Date(),
            },
          })
        );
      }

      if (input.smtpFromName !== undefined) {
        updates.push(
          prisma.adminSettings.upsert({
            where: { settingKey: 'smtpFromName' },
            create: {
              id: randomUUID(),
              settingKey: 'smtpFromName',
              settingValue: input.smtpFromName,
              description: 'Default from name for emails',
              updatedAt: new Date(),
            },
            update: {
              settingValue: input.smtpFromName,
              updatedAt: new Date(),
            },
          })
        );
      }

      await prisma.$transaction(updates);

      return { success: true };
    }),

  // Dashboard Statistics
  getDashboardStats: adminProcedure.query(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await prisma.user.count();
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: sevenDaysAgo,
        },
      },
    });
    const usersChange =
      previousUsers > 0
        ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
        : 0;

    // Pending payments
    const pendingPayments = await prisma.pendingPayment.count({
      where: { status: "pending" },
    });

    // Pending withdrawals
    const pendingWithdrawals = await prisma.transaction.count({
      where: {
        status: "pending",
        transactionType: { in: ["WITHDRAWAL_CASH", "WITHDRAWAL_BPT", "WITHDRAWAL_USDT"] }
      }
    });

    // Pending KYC submissions
    const pendingKyc = await prisma.kycSubmission.count({
      where: { status: { in: ["pending", "under_review"] } },
    });

    // Total revenue (last 30 days)
    const revenueTransactions = await prisma.transaction.aggregate({
      where: {
        status: "completed",
        transactionType: { in: [
          "membership_activation",
          "MEMBERSHIP_ACTIVATION",
          "deposit",
          "DEPOSIT",
        ] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });
    const totalRevenueRaw = revenueTransactions._sum.amount || 0;
    const totalRevenue = Math.max(0, Math.abs(totalRevenueRaw));

    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        status: "completed",
        transactionType: { in: [
          "membership_activation",
          "MEMBERSHIP_ACTIVATION",
          "deposit",
          "DEPOSIT",
        ] },
        createdAt: {
          gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: thirtyDaysAgo,
        },
      },
      _sum: { amount: true },
    });
    const prevRevenueRaw = previousRevenue._sum.amount || 0;
    const prevRevenue = Math.max(0, Math.abs(prevRevenueRaw));
    const revenueChange = prevRevenue > 0 ? Math.max(0, Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)) : 0;

    // Active members
    const activeMembers = await prisma.user.count({
      where: { activated: true, activeMembershipPackageId: { not: null } },
    });
    const recentActiveMembers = await prisma.user.count({
      where: {
        activated: true,
        activeMembershipPackageId: { not: null },
        membershipActivatedAt: { gte: sevenDaysAgo },
      },
    });
    const membersChange = Math.round((recentActiveMembers / totalUsers) * 100);

    return {
      totalUsers,
      usersChange,
      pendingPayments,
      pendingWithdrawals,
      pendingKyc,
      totalRevenue,
      revenueChange,
      activeMembers,
      membersChange,
    };
  }),

  // Recent Activity
  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        action: z.string().optional(),
        entity: z.string().optional(),
        status: z.string().optional(),
        userId: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { limit, cursor, action, entity, status, userId, search, dateFrom, dateTo } = input;

      const where: any = {};
      if (action) where.action = action;
      if (entity) where.entity = entity;
      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (search) {
        where.OR = [
          { action: { contains: search, mode: "insensitive" } },
          { entity: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
        ];
      }
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }

      const activities = await prisma.auditLog.findMany({
        where,
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          User: { select: { name: true, email: true } },
        },
      });

      const nextCursor = activities.length === limit ? activities[activities.length - 1]?.id : undefined;
      return { items: activities, nextCursor };
    }),

  // Chart Data
  getChartData: adminProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "90d"]).default("7d") }))
    .query(async ({ input }) => {
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User growth data
      const userGrowth = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const users = await prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        userGrowth.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users,
        });
      }

      // Revenue data
      const revenue = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayRevenue = await prisma.transaction.aggregate({
          where: {
            status: "completed",
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: { amount: true },
        });

        revenue.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          revenue: dayRevenue._sum.amount || 0,
        });
      }

      // Activity data (mocked for now - can be enhanced)
      const activity = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        activity.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          logins: Math.floor(Math.random() * 50) + 10,
          transactions: Math.floor(Math.random() * 30) + 5,
          signups: Math.floor(Math.random() * 20) + 1,
        });
      }

      return {
        userGrowth,
        revenue,
        activity,
      };
    }),

  // Dashboard Alerts & Warnings
  getDashboardAlerts: adminProcedure.query(async () => {
    const alerts: Array<{
      type: "warning" | "info" | "success" | "error";
      title: string;
      message: string;
      action?: string;
      priority: "high" | "medium" | "low";
    }> = [];

    // Check for pending payments
    const pendingCount = await prisma.pendingPayment.count({
      where: { status: "pending" },
    });
    if (pendingCount > 10) {
      alerts.push({
        type: "warning" as const,
        title: "High Pending Payments",
        message: `${pendingCount} payments awaiting approval`,
        action: "/admin/payments",
        priority: "high" as const,
      });
    }

    // Check for inactive users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveUsers = await prisma.user.count({
      where: {
        lastLogin: { lt: thirtyDaysAgo },
        activeMembershipPackageId: { not: null },
      },
    });
    if (inactiveUsers > 5) {
      alerts.push({
        type: "info" as const,
        title: "Inactive Active Members",
        message: `${inactiveUsers} active members haven't logged in for 30+ days`,
        action: "/admin/users",
        priority: "medium" as const,
      });
    }

    // Check for expiring packages
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringPackages = await prisma.membershipPackage.count({
      where: {
        isActive: true,
        // Could add expiration date check if field exists
      },
    });

    // Check for low BPT balance users
    const lowBalanceUsers = await prisma.user.count({
      where: {
        bpiTokenWallet: { lt: 100 },
        activeMembershipPackageId: { not: null },
      },
    });
    if (lowBalanceUsers > 20) {
      alerts.push({
        type: "info" as const,
        title: "Low BPT Balances",
        message: `${lowBalanceUsers} active members have less than 100 BPT`,
        action: "/admin/users",
        priority: "low" as const,
      });
    }

    return alerts;
  }),

  // Financial Summary
  getFinancialSummary: adminProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input?.dateTo ?? now;
      const dateFrom = input?.dateFrom ?? new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

      const whereRange = { createdAt: { gte: dateFrom, lte: dateTo } };

      // Inflows
      const deposits = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { in: ["DEPOSIT", "deposit", "CREDIT"] } },
        _sum: { amount: true },
      });
      const vat = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { in: ["VAT", "vat"] } },
        _sum: { amount: true },
      });
      const withdrawalFeesRaw = await prisma.transaction.aggregate({
        where: {
          ...whereRange,
          status: "completed",
          OR: [
            { transactionType: { in: ["WITHDRAWAL_FEE"] } },
            { description: { contains: "service charge", mode: "insensitive" } },
          ],
        },
        _sum: { amount: true },
      });
      const withdrawalFees = Math.abs(withdrawalFeesRaw._sum.amount || 0);
      const depositFeesRaw = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: "USDT_DEPOSIT_FEE" },
        _sum: { amount: true },
      });
      const depositFees = Math.abs(depositFeesRaw._sum.amount || 0);
      const membershipRevenueRaw = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { in: [
          "MEMBERSHIP_PAYMENT", "membership_payment",
          "MEMBERSHIP_ACTIVATION", "membership_activation",
          "MEMBERSHIP_UPGRADE", "membership_upgrade",
          "SUBSCRIPTION", "PURCHASE",
        ] } },
        _sum: { amount: true },
      });
      const membershipRevenue = Math.abs(membershipRevenueRaw._sum.amount || 0);

      // Outflows
      const withdrawalCash = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { in: ["WITHDRAWAL_CASH", "DEBIT"] } },
        _sum: { amount: true },
      });
      const withdrawalBpt = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { in: ["WITHDRAWAL_BPT"] } },
        _sum: { amount: true },
      });
      const rewardsBpt = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", transactionType: { startsWith: "REFERRAL_" } as any },
        _sum: { amount: true },
      });

      // BPT conversion rate (from admin-managed BPTokenPrice table)
      const activeBptPrice = await prisma.bPTokenPrice.findFirst({ where: { active: true }, orderBy: { updatedAt: 'desc' } });
      const bptRateNgn = activeBptPrice?.price ?? 0;

      // BPT activities
      const convertToContactRaw = await prisma.transaction.aggregate({
        where: { ...whereRange, status: "completed", walletType: "bpiToken", transactionType: { in: ["CONVERT_TO_CONTACT"] } },
        _sum: { amount: true },
      });
      const convertToContact = Math.abs(convertToContactRaw._sum.amount || 0);

      const bptFromTransactions = (rewardsBpt._sum.amount || 0) - Math.abs(withdrawalBpt._sum.amount || 0) - convertToContact;

      // Wallet totals
      const walletTotals = await prisma.user.aggregate({ _sum: {
        wallet: true, spendable: true, cashback: true, community: true, shareholder: true,
        education: true, car: true, business: true, palliative: true, studentCashback: true,
        bpiTokenWallet: true,
      } });
      const bptWalletTotal = (walletTotals._sum.bpiTokenWallet || 0) || bptFromTransactions;

      // Palliatives
      const totalPalliativeTickets = await prisma.palliativeTicket.count();

      return {
        range: { from: dateFrom, to: dateTo },
        inflows: {
          deposits: deposits._sum.amount || 0,
          membershipRevenue,
          vat: vat._sum.amount || 0,
          withdrawalFees,
          depositFees,
          total: (deposits._sum.amount || 0) + membershipRevenue + (vat._sum.amount || 0) + withdrawalFees + depositFees,
        },
        outflows: {
          withdrawalsCash: Math.abs(withdrawalCash._sum.amount || 0),
          withdrawalsBpt: Math.abs(withdrawalBpt._sum.amount || 0),
          rewardsBpt: rewardsBpt._sum.amount || 0,
          total: Math.abs(withdrawalCash._sum.amount || 0) + Math.abs(withdrawalBpt._sum.amount || 0) + (rewardsBpt._sum.amount || 0),
        },
        bptActivities: {
          convertToContact,
        },
        wallets: {
          ngn: {
            main: walletTotals._sum.wallet || 0,
            spendable: walletTotals._sum.spendable || 0,
            cashback: walletTotals._sum.cashback || 0,
            community: walletTotals._sum.community || 0,
            shareholder: walletTotals._sum.shareholder || 0,
            education: walletTotals._sum.education || 0,
            car: walletTotals._sum.car || 0,
            business: walletTotals._sum.business || 0,
            palliative: walletTotals._sum.palliative || 0,
            studentCashback: walletTotals._sum.studentCashback || 0,
          },
          bpt: bptWalletTotal,
        },
        bptRateNgn,
        palliatives: {
          totalTickets: totalPalliativeTickets,
        },
      };
    }),

  getBptTransactions: adminProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      page: z.number().min(1).optional(),
      pageSize: z.number().min(1).max(100).optional(),
    }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input?.dateTo ?? now;
      // default to last 365 days to surface legacy imports
      const dateFrom = input?.dateFrom ?? new Date(dateTo.getTime() - 365 * 24 * 60 * 60 * 1000);
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 12;

      const where = {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: "completed" as const,
        AND: [
          {
            OR: [
              { transactionType: "WITHDRAWAL_BPT" },
              { transactionType: { startsWith: "REFERRAL_" } as any },
              { transactionType: "CONVERT_TO_CONTACT" },
            ],
          },
          {
            OR: [
              { walletType: "bpiToken" },
              { description: { contains: "bpt", mode: "insensitive" } },
            ],
          },
        ],
      } satisfies NonNullable<Parameters<typeof prisma.transaction.findMany>[0]>["where"];

      const [total, items] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: { id: true, transactionType: true, amount: true, description: true, createdAt: true, walletType: true },
        }),
      ]);

      return {
        range: { from: dateFrom, to: dateTo },
        page,
        pageSize,
        total,
        items,
      };
    }),

  // Financial Time Series (per-category by day/week/month)
  getFinancialTimeSeries: adminProcedure
    .input(z.object({
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      granularity: z.enum(["day", "week", "month"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input?.dateTo ?? now;
      const dateFrom = input?.dateFrom ?? new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);
      const granularity = input?.granularity ?? "day";

      const whereRange = { createdAt: { gte: dateFrom, lte: dateTo }, status: "completed" as const };

      const txns = await prisma.transaction.findMany({
        where: whereRange,
        select: { createdAt: true, transactionType: true, amount: true, description: true },
        orderBy: { createdAt: "asc" },
      });

      function bucketKey(d: Date): string {
        if (granularity === "day") {
          return d.toISOString().slice(0, 10);
        }
        if (granularity === "week") {
          // ISO week: use Monday-based week number approximation
          const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
          const dayNum = (tmp.getUTCDay() + 6) % 7; // 0=Mon
          tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
          const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
          const weekNum = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
          return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
        }
        // month
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      }

      const buckets: Record<string, {
        deposits: number; membershipRevenue: number; vat: number; withdrawalFees: number;
        withdrawalsCash: number; withdrawalsBpt: number; rewardsBpt: number;
      }> = {};

      for (const t of txns) {
        const key = bucketKey(t.createdAt);
        if (!buckets[key]) {
          buckets[key] = { deposits: 0, membershipRevenue: 0, vat: 0, withdrawalFees: 0, withdrawalsCash: 0, withdrawalsBpt: 0, rewardsBpt: 0 };
        }
        const amt = t.amount || 0;
        const type = t.transactionType || "";
        const desc = (t as any).description?.toLowerCase?.() || "";

        if (type === "DEPOSIT" || type === "deposit" || type === "CREDIT") {
          buckets[key].deposits += Math.abs(amt);
        } else if (
          type === "MEMBERSHIP_PAYMENT" || type === "membership_payment" ||
          type === "MEMBERSHIP_ACTIVATION" || type === "membership_activation" ||
          type === "MEMBERSHIP_UPGRADE" || type === "membership_upgrade" ||
          type === "SUBSCRIPTION" || type === "PURCHASE"
        ) {
          buckets[key].membershipRevenue += Math.abs(amt);
        } else if (type === "VAT" || type === "vat") {
          buckets[key].vat += Math.abs(amt);
        } else if (type === "WITHDRAWAL_FEE" || desc.includes("service charge")) {
          buckets[key].withdrawalFees += Math.abs(amt);
        } else if (type === "WITHDRAWAL_CASH" || type === "DEBIT") {
          buckets[key].withdrawalsCash += Math.abs(amt);
        } else if (type === "WITHDRAWAL_BPT") {
          buckets[key].withdrawalsBpt += Math.abs(amt);
        } else if (type.startsWith("REFERRAL_")) {
          buckets[key].rewardsBpt += Math.abs(amt);
        }
      }

      const points = Object.keys(buckets)
        .sort()
        .map((date) => ({ date, ...buckets[date] }));

      return {
        range: { from: dateFrom, to: dateTo },
        granularity,
        points,
      };
    }),

  // Performance Metrics
  getPerformanceMetrics: adminProcedure.query(async () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Response times (mock data - would need actual monitoring)
    const responseTime = {
      average: 245, // ms
      p95: 580,
      p99: 1200,
    };

    // Database queries (mock data)
    const dbMetrics = {
      activeConnections: 12,
      slowQueries: 3,
      cacheHitRate: 87.5, // percentage
    };

    // User engagement
    const activeUsers24h = await prisma.user.count({
      where: { lastLogin: { gte: last24h } },
    });
    const activeUsers7d = await prisma.user.count({
      where: { lastLogin: { gte: last7d } },
    });

    // Transaction metrics
    const transactions24h = await prisma.pendingPayment.count({
      where: { createdAt: { gte: last24h } },
    });
    const successRate = await prisma.pendingPayment.count({
      where: {
        createdAt: { gte: last7d },
        status: "approved",
      },
    });
    const totalTransactions7d = await prisma.pendingPayment.count({
      where: { createdAt: { gte: last7d } },
    });

    return {
      responseTime,
      dbMetrics,
      userEngagement: {
        activeUsers24h,
        activeUsers7d,
        dailyActiveRate: totalTransactions7d > 0 ? (activeUsers24h / activeUsers7d) * 100 : 0,
      },
      transactions: {
        count24h: transactions24h,
        count7d: totalTransactions7d,
        successRate: totalTransactions7d > 0 ? (successRate / totalTransactions7d) * 100 : 0,
      },
    };
  }),

  // Quick Stats for widgets
  getQuickStats: adminProcedure.query(async () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      usersToday,
      usersThisMonth,
      paymentsToday,
      revenueToday,
      revenueThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.pendingPayment.count({ where: { createdAt: { gte: today } } }),
      prisma.pendingPayment.aggregate({
        where: { createdAt: { gte: today }, status: "approved" },
        _sum: { amount: true },
      }),
      prisma.pendingPayment.aggregate({
        where: { createdAt: { gte: thisMonth }, status: "approved" },
        _sum: { amount: true },
      }),
    ]);

    return {
      today: {
        users: usersToday,
        payments: paymentsToday,
        revenue: Math.max(0, Math.abs(revenueToday._sum.amount || 0)),
      },
      thisMonth: {
        users: usersThisMonth,
        revenue: Math.max(0, Math.abs(revenueThisMonth._sum.amount || 0)),
      },
    };
  }),

  // Export data to CSV
  exportUsersToCSV: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            search: z.string().optional(),
            role: z.string().optional(),
            status: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.filters?.search) {
        where.OR = [
          { email: { contains: input.filters.search, mode: "insensitive" } },
          { name: { contains: input.filters.search, mode: "insensitive" } },
          {
            username: { contains: input.filters.search, mode: "insensitive" },
          },
        ];
      }

      if (input.filters?.role) {
        where.role = input.filters.role;
      }

      if (input.filters?.status === "active") {
        where.activated = true;
      } else if (input.filters?.status === "inactive") {
        where.activated = false;
      }

      if (input.filters?.dateFrom) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(input.filters.dateFrom),
        };
      }

      if (input.filters?.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(input.filters.dateTo),
        };
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          activated: true,
          bpiTokenWallet: true,
          wallet: true,
          createdAt: true,
          lastLogin: true,
          activeMembershipPackageId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Convert to CSV format
      const headers = [
        "ID",
        "Email",
        "Name",
        "Username",
        "Role",
        "Status",
        "BPT Balance",
        "NGN Balance",
        "Membership",
        "Created At",
        "Last Login",
      ];

      const rows = users.map((user: any) => [
        user.id,
        user.email || "",
        user.name || "",
        user.username || "",
        user.role,
        user.activated ? "Active" : "Inactive",
        user.bpiTokenWallet.toString(),
        user.wallet.toString(),
        user.activeMembershipPackageId ? "Active" : "None",
        user.createdAt.toISOString(),
        user.lastLogin.toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) =>
          row.map((cell: any) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return {
        data: csvContent,
        filename: `users-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: users.length,
      };
    }),

  exportPaymentsToCSV: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            status: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.filters?.status) {
        where.status = input.filters.status;
      }

      if (input.filters?.dateFrom) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(input.filters.dateFrom),
        };
      }

      if (input.filters?.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(input.filters.dateTo),
        };
      }

      const payments = await prisma.transaction.findMany({
        where,
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "User Email",
        "User Name",
        "Transaction Type",
        "Amount",
        "Currency",
        "Payment Method",
        "Status",
        "Gateway Reference",
        "Created At",
        "Updated At",
      ];

      const rows = payments.map((payment: any) => [
        payment.id,
        payment.User.email || "",
        payment.User.name || "",
        payment.transactionType,
        payment.amount.toString(),
        "NGN",
        payment.walletType || "",
        payment.status,
        payment.reference || "",
        payment.createdAt.toISOString(),
        payment.createdAt.toISOString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell: any) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      return {
        data: csvContent,
        filename: `payments-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: payments.length,
      };
    }),

  exportPackagesToCSV: adminProcedure.query(async ({ ctx }) => {
    const packages = await prisma.membershipPackage.findMany({
      orderBy: { name: "asc" },
    });

    const headers = [
      "ID",
      "Name",
      "Price",
      "VAT",
      "Type",
      "BPT L1",
      "BPT L2",
      "BPT L3",
      "BPT L4",
      "Active",
      "Has Renewal",
      "Created At",
    ];

    const rows = packages.map((pkg: any) => [
      pkg.id,
      pkg.name,
      pkg.price.toString(),
      pkg.vat.toString(),
      pkg.packageType,
      pkg.bpt_l1.toString(),
      pkg.bpt_l2.toString(),
      pkg.bpt_l3.toString(),
      pkg.bpt_l4.toString(),
      pkg.isActive ? "Yes" : "No",
      pkg.hasRenewal ? "Yes" : "No",
      pkg.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) =>
        row.map((cell: any) => `"${cell.toString().replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    return {
      data: csvContent,
      filename: `packages-export-${new Date().toISOString().split("T")[0]}.csv`,
      count: packages.length,
    };
  }),

  // Export Financial Summary to CSV
  exportFinancialSummaryToCSV: adminProcedure
    .input(z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const now = new Date();
      const dateTo = input?.dateTo ? new Date(input.dateTo) : now;
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

      const whereRange = { createdAt: { gte: dateFrom, lte: dateTo } };

      // Reuse aggregation similar to getFinancialSummary
      const deposits = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { in: ["DEPOSIT", "deposit", "CREDIT"] } }, _sum: { amount: true } });
      const vat = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { in: ["VAT", "vat"] } }, _sum: { amount: true } });
      const withdrawalFeesRaw = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", OR: [ { transactionType: { in: ["WITHDRAWAL_FEE"] } }, { description: { contains: "service charge", mode: "insensitive" } } ] }, _sum: { amount: true } });
      const withdrawalFees = Math.abs(withdrawalFeesRaw._sum.amount || 0);
      const membershipRevenueRaw = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { in: ["MEMBERSHIP_PAYMENT", "membership_payment", "MEMBERSHIP_ACTIVATION", "membership_activation", "MEMBERSHIP_UPGRADE", "membership_upgrade", "SUBSCRIPTION", "PURCHASE"] } }, _sum: { amount: true } });
      const membershipRevenue = Math.abs(membershipRevenueRaw._sum.amount || 0);

      const withdrawalCash = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { in: ["WITHDRAWAL_CASH", "DEBIT"] } }, _sum: { amount: true } });
      const withdrawalBpt = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { in: ["WITHDRAWAL_BPT"] } }, _sum: { amount: true } });
      const rewardsBpt = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", transactionType: { startsWith: "REFERRAL_" } as any }, _sum: { amount: true } });

      const convertToContactRaw = await prisma.transaction.aggregate({ where: { ...whereRange, status: "completed", walletType: "bpiToken", transactionType: { in: ["CONVERT_TO_CONTACT"] } }, _sum: { amount: true } });
      const convertToContact = Math.abs(convertToContactRaw._sum.amount || 0);
      const bptFromTransactions = (rewardsBpt._sum.amount || 0) - Math.abs(withdrawalBpt._sum.amount || 0) - convertToContact;

      const walletTotals = await prisma.user.aggregate({ _sum: { wallet: true, spendable: true, cashback: true, community: true, shareholder: true, education: true, car: true, business: true, palliative: true, studentCashback: true, bpiTokenWallet: true } });
      const bptWalletTotal = (walletTotals._sum.bpiTokenWallet || 0) || bptFromTransactions;

      const inflowsTotal = (deposits._sum.amount || 0) + membershipRevenue + (vat._sum.amount || 0) + withdrawalFees;
      const outflowsTotal = Math.abs(withdrawalCash._sum.amount || 0) + Math.abs(withdrawalBpt._sum.amount || 0) + (rewardsBpt._sum.amount || 0);

      // Build CSV
      const headers = ["Section", "Category", "Amount"];
      const rows: Array<[string, string, string]> = [];
      rows.push(["Range", "From", dateFrom.toISOString()]);
      rows.push(["Range", "To", dateTo.toISOString()]);
      rows.push(["", "", ""]);

      rows.push(["Inflows", "Deposits", ((deposits._sum.amount || 0)).toString()]);
      rows.push(["Inflows", "Membership Revenue", (membershipRevenue).toString()]);
      rows.push(["Inflows", "VAT", ((vat._sum.amount || 0)).toString()]);
      rows.push(["Inflows", "Withdrawal Fees", (withdrawalFees).toString()]);
      rows.push(["Inflows", "Total", inflowsTotal.toString()]);
      rows.push(["", "", ""]);

      rows.push(["Outflows", "Cash Withdrawals", (Math.abs(withdrawalCash._sum.amount || 0)).toString()]);
      rows.push(["Outflows", "BPT Withdrawals", (Math.abs(withdrawalBpt._sum.amount || 0)).toString()]);
      rows.push(["Outflows", "BPT Rewards", ((rewardsBpt._sum.amount || 0)).toString()]);
      rows.push(["Outflows", "Total", outflowsTotal.toString()]);
      rows.push(["", "", ""]);

      rows.push(["BPT Activities", "Convert To Contact", convertToContact.toString()]);
      rows.push(["", "", ""]);

      rows.push(["Wallets (NGN)", "main", ((walletTotals._sum.wallet || 0)).toString()]);
      rows.push(["Wallets (NGN)", "spendable", ((walletTotals._sum.spendable || 0)).toString()]);
      rows.push(["Wallets (NGN)", "cashback", ((walletTotals._sum.cashback || 0)).toString()]);
      rows.push(["Wallets (NGN)", "community", ((walletTotals._sum.community || 0)).toString()]);
      rows.push(["Wallets (NGN)", "shareholder", ((walletTotals._sum.shareholder || 0)).toString()]);
      rows.push(["Wallets (NGN)", "education", ((walletTotals._sum.education || 0)).toString()]);
      rows.push(["Wallets (NGN)", "car", ((walletTotals._sum.car || 0)).toString()]);
      rows.push(["Wallets (NGN)", "business", ((walletTotals._sum.business || 0)).toString()]);
      rows.push(["Wallets (NGN)", "palliative", ((walletTotals._sum.palliative || 0)).toString()]);
      rows.push(["Wallets (NGN)", "studentCashback", ((walletTotals._sum.studentCashback || 0)).toString()]);
      rows.push(["Wallets (BPT)", "bpiTokenWallet", ((bptWalletTotal)).toString()]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return {
        data: csvContent,
        filename: `financial-summary-${new Date().toISOString().split("T")[0]}.csv`,
        count: rows.length,
        range: { from: dateFrom, to: dateTo },
      };
    }),

  // Export Audit Logs to CSV
  exportAuditLogsToCSV: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            action: z.string().optional(),
            entity: z.string().optional(),
            status: z.string().optional(),
            userId: z.string().optional(),
            search: z.string().optional(),
            dateFrom: z.string().optional(),
            dateTo: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const where: any = {};
      const f = input.filters;
      if (f?.action) where.action = f.action;
      if (f?.entity) where.entity = f.entity;
      if (f?.status) where.status = f.status;
      if (f?.userId) where.userId = f.userId;
      if (f?.search) {
        where.OR = [
          { action: { contains: f.search, mode: "insensitive" } },
          { entity: { contains: f.search, mode: "insensitive" } },
          { entityId: { contains: f.search, mode: "insensitive" } },
        ];
      }
      if (f?.dateFrom || f?.dateTo) {
        where.createdAt = {
          ...(f.dateFrom ? { gte: new Date(f.dateFrom) } : {}),
          ...(f.dateTo ? { lte: new Date(f.dateTo) } : {}),
        };
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          User: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "ID",
        "Created At",
        "Action",
        "Entity",
        "Entity ID",
        "User Email",
        "User Name",
        "Status",
        "Changes",
      ];

      const rows = logs.map((log: any) => [
        log.id,
        log.createdAt.toISOString(),
        log.action,
        log.entity || "",
        log.entityId || "",
        log.User?.email || "",
        log.User?.name || "",
        log.status || "",
        (typeof log.changes === "string" ? log.changes : JSON.stringify(log.changes)) || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      return {
        data: csvContent,
        filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
        count: logs.length,
      };
    }),

  // Third Party Platforms Management
  getAllThirdPartyPlatforms: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.thirdPartyPlatform.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            UserThirdPartyLink: true,
            ThirdPartyRegistration: true,
          },
        },
      },
    });
  }),

  createThirdPartyPlatform: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        registrationUrl: z.string().optional(),
        adminDefaultLink: z.string().optional(),
        category: z.string().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the highest display order
      const lastPlatform = await ctx.prisma.thirdPartyPlatform.findFirst({
        orderBy: { displayOrder: 'desc' },
        select: { displayOrder: true },
      });

      const nextOrder = (lastPlatform?.displayOrder ?? 0) + 1;

      return await ctx.prisma.thirdPartyPlatform.create({
        data: {
          id: randomUUID(),
          name: input.name,
          description: input.description,
          registrationUrl: input.registrationUrl,
          adminDefaultLink: input.adminDefaultLink,
          category: input.category,
          logo: input.logo,
          displayOrder: nextOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }),

  updateThirdPartyPlatform: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        registrationUrl: z.string().optional(),
        adminDefaultLink: z.string().optional(),
        category: z.string().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.thirdPartyPlatform.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }),

  deleteThirdPartyPlatform: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.thirdPartyPlatform.delete({
        where: { id: input.id },
      });
    }),

  toggleThirdPartyPlatformStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.thirdPartyPlatform.update({
        where: { id: input.id },
        data: {
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      });
    }),

  reorderThirdPartyPlatform: adminProcedure
    .input(
      z.object({
        id: z.string(),
        direction: z.enum(['up', 'down']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const platform = await ctx.prisma.thirdPartyPlatform.findUnique({
        where: { id: input.id },
        select: { displayOrder: true },
      });

      if (!platform) throw new Error("Platform not found");

      if (input.direction === 'up') {
        // Find the platform with the next lower order
        const swapPlatform = await ctx.prisma.thirdPartyPlatform.findFirst({
          where: { displayOrder: { lt: platform.displayOrder } },
          orderBy: { displayOrder: 'desc' },
        });

        if (swapPlatform) {
          await ctx.prisma.$transaction([
            ctx.prisma.thirdPartyPlatform.update({
              where: { id: input.id },
              data: { displayOrder: swapPlatform.displayOrder, updatedAt: new Date() },
            }),
            ctx.prisma.thirdPartyPlatform.update({
              where: { id: swapPlatform.id },
              data: { displayOrder: platform.displayOrder, updatedAt: new Date() },
            }),
          ]);
        }
      } else {
        // Find the platform with the next higher order
        const swapPlatform = await ctx.prisma.thirdPartyPlatform.findFirst({
          where: { displayOrder: { gt: platform.displayOrder } },
          orderBy: { displayOrder: 'asc' },
        });

        if (swapPlatform) {
          await ctx.prisma.$transaction([
            ctx.prisma.thirdPartyPlatform.update({
              where: { id: input.id },
              data: { displayOrder: swapPlatform.displayOrder, updatedAt: new Date() },
            }),
            ctx.prisma.thirdPartyPlatform.update({
              where: { id: swapPlatform.id },
              data: { displayOrder: platform.displayOrder, updatedAt: new Date() },
            }),
          ]);
        }
      }

      return { success: true };
    }),

  // Third Party Executive Overpass (bypass sponsor dependency for user third-party links)
  searchThirdPartyExecutiveOverpassUsers: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional(),
      })
    )
    .query(async ({ input }) => {
      const queryRaw = input.query.trim();
      if (queryRaw.length < 2) {
        return [];
      }

      const limit = input.limit ?? 10;
      const queryLower = queryRaw.toLowerCase();

      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: queryRaw,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstname: true,
          lastname: true,
        },
        take: Math.max(limit * 3, 30),
      });

      const formatName = (u: any) => {
        const full = `${u?.firstname || ""} ${u?.lastname || ""}`.trim();
        return full || u?.name || u?.email || "";
      };

      return users
        .filter((u) => !!u.email)
        .map((u) => ({
          id: u.id,
          email: u.email!,
          fullName: formatName(u),
        }))
        .sort((a, b) => {
          const aEmail = a.email.toLowerCase();
          const bEmail = b.email.toLowerCase();
          const aStarts = aEmail.startsWith(queryLower);
          const bStarts = bEmail.startsWith(queryLower);
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
          return aEmail.localeCompare(bEmail);
        })
        .slice(0, limit);
    }),

  getThirdPartyExecutiveOverpassPreview: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const email = input.email.trim();

      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstname: true,
          lastname: true,
          activated: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
          sponsorId: true,
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found for that email");
      }

      const membershipPackage = user.activeMembershipPackageId
        ? await prisma.membershipPackage.findUnique({
            where: { id: user.activeMembershipPackageId },
            select: { id: true, name: true },
          })
        : null;

      const overpass = await prisma.thirdPartyExecutiveOverpass.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
          grantedAt: true,
          expiresAt: true,
          revokedAt: true,
          grantedByUserId: true,
          revokedByUserId: true,
        },
      });

      const now = new Date();
      const isActiveOverpass =
        !!overpass && !overpass.revokedAt && (!overpass.expiresAt || overpass.expiresAt >= now);

      const formatName = (u: any) => {
        const full = `${u?.firstname || ""} ${u?.lastname || ""}`.trim();
        return full || u?.name || u?.email || "";
      };

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: formatName(user),
        },
        sponsor: user.User
          ? {
              id: user.User.id,
              email: user.User.email,
              fullName: formatName(user.User),
            }
          : null,
        membership: {
          isActivated: user.activated,
          activeMembershipPackageId: user.activeMembershipPackageId,
          planName: membershipPackage?.name ?? null,
          membershipActivatedAt: user.membershipActivatedAt,
          membershipExpiresAt: user.membershipExpiresAt,
        },
        overpass: {
          exists: !!overpass,
          isActive: isActiveOverpass,
          grantedAt: overpass?.grantedAt ?? null,
          expiresAt: overpass?.expiresAt ?? null,
          revokedAt: overpass?.revokedAt ?? null,
        },
      };
    }),

  grantThirdPartyExecutiveOverpass: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        mode: z.enum(["PERMANENT", "EXPIRES"]),
        expiresOn: z.string().optional(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim();
      const target = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
        select: { id: true, email: true, firstname: true, lastname: true, name: true },
      });

      if (!target) {
        throw new Error("User not found for that email");
      }

      let expiresAt: Date | null = null;
      if (input.mode === "EXPIRES") {
        const raw = (input.expiresOn || "").trim();
        const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
          throw new Error("Expiry date is required (YYYY-MM-DD)");
        }

        const year = Number(match[1]);
        const monthIndex = Number(match[2]) - 1;
        const day = Number(match[3]);
        const endOfDayServerTime = new Date(year, monthIndex, day, 23, 59, 59, 999);
        if (Number.isNaN(endOfDayServerTime.getTime())) {
          throw new Error("Invalid expiry date");
        }

        expiresAt = endOfDayServerTime;
      }

      const adminId = ctx.session!.user.id;
      const now = new Date();

      const existing = await prisma.thirdPartyExecutiveOverpass.findUnique({
        where: { userId: target.id },
        select: { id: true },
      });

      const record = existing
        ? await prisma.thirdPartyExecutiveOverpass.update({
            where: { userId: target.id },
            data: {
              grantedByUserId: adminId,
              grantedAt: now,
              expiresAt,
              revokedAt: null,
              revokedByUserId: null,
            },
            select: { id: true },
          })
        : await prisma.thirdPartyExecutiveOverpass.create({
            data: {
              id: randomUUID(),
              userId: target.id,
              grantedByUserId: adminId,
              grantedAt: now,
              expiresAt,
              createdAt: now,
            },
            select: { id: true },
          });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: "GRANT_THIRD_PARTY_EXECUTIVE_OVERPASS",
          entity: "THIRD_PARTY_OVERPASS",
          entityId: target.id,
          metadata: {
            targetEmail: target.email,
            mode: input.mode,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
            overpassId: record.id,
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true };
    }),

  listThirdPartyExecutiveOverpasses: adminProcedure.query(async () => {
    const now = new Date();
    const rows = await prisma.thirdPartyExecutiveOverpass.findMany({
      where: {
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: { grantedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstname: true,
            lastname: true,
            activated: true,
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            sponsorId: true,
            User: {
              select: {
                id: true,
                email: true,
                name: true,
                firstname: true,
                lastname: true,
              },
            },
          },
        },
        grantedBy: {
          select: { id: true, email: true, name: true, firstname: true, lastname: true },
        },
      },
    });

    const packageIds = [...new Set(rows.map((r) => r.user.activeMembershipPackageId).filter(Boolean))] as string[];
    const packages = packageIds.length
      ? await prisma.membershipPackage.findMany({
          where: { id: { in: packageIds } },
          select: { id: true, name: true },
        })
      : [];

    const packageMap = new Map(packages.map((p) => [p.id, p.name] as const));

    const formatName = (u: any) => {
      const full = `${u?.firstname || ""} ${u?.lastname || ""}`.trim();
      return full || u?.name || u?.email || "";
    };

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      grantedAt: r.grantedAt,
      expiresAt: r.expiresAt,
      user: {
        id: r.user.id,
        email: r.user.email,
        fullName: formatName(r.user),
        activated: r.user.activated,
        membershipActivatedAt: r.user.membershipActivatedAt,
        membershipExpiresAt: r.user.membershipExpiresAt,
        planName: r.user.activeMembershipPackageId ? packageMap.get(r.user.activeMembershipPackageId) ?? null : null,
      },
      sponsor: r.user.User
        ? {
            id: r.user.User.id,
            email: r.user.User.email,
            fullName: formatName(r.user.User),
          }
        : null,
      grantedBy: {
        id: r.grantedBy.id,
        email: r.grantedBy.email,
        fullName: formatName(r.grantedBy),
      },
    }));
  }),

  revokeThirdPartyExecutiveOverpass: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session!.user.id;
      const now = new Date();

      const existing = await prisma.thirdPartyExecutiveOverpass.findUnique({
        where: { userId: input.userId },
        select: { id: true, userId: true },
      });

      if (!existing) {
        throw new Error("Overpass record not found");
      }

      await prisma.thirdPartyExecutiveOverpass.update({
        where: { userId: input.userId },
        data: {
          revokedAt: now,
          revokedByUserId: adminId,
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: "REVOKE_THIRD_PARTY_EXECUTIVE_OVERPASS",
          entity: "THIRD_PARTY_OVERPASS",
          entityId: input.userId,
          metadata: { overpassId: existing.id },
          ipAddress: "",
          userAgent: "",
        },
      });

      return { success: true };
    }),

  // ===========================
  // Leadership Pool Admin
  // ===========================

  getLeadershipPoolSettings: adminProcedure.query(async () => {
    const settings = await prisma.adminSettings.findMany({
      where: {
        settingKey: {
          in: ['leadershipPoolAmount', 'leadershipPoolEnabled', 'leadershipPoolMaxParticipants'],
        },
      },
    });

    return {
      amount: parseInt(settings.find((s: any) => s.settingKey === 'leadershipPoolAmount')?.settingValue || '50000000'),
      enabled: settings.find((s: any) => s.settingKey === 'leadershipPoolEnabled')?.settingValue === 'true',
      maxParticipants: parseInt(settings.find((s: any) => s.settingKey === 'leadershipPoolMaxParticipants')?.settingValue || '100'),
    };
  }),

  updateLeadershipPoolSettings: adminProcedure
    .input(
      z.object({
        amount: z.number().min(0).optional(),
        enabled: z.boolean().optional(),
        maxParticipants: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Array<{
        settingKey: string;
        settingValue: string;
        description: string;
      }> = [];

      if (input.amount !== undefined) {
        updates.push({
          settingKey: 'leadershipPoolAmount',
          settingValue: input.amount.toString(),
          description: 'Total amount to distribute in Leadership Pool',
        });
      }
      if (input.enabled !== undefined) {
        updates.push({
          settingKey: 'leadershipPoolEnabled',
          settingValue: input.enabled.toString(),
          description: 'Enable or disable Leadership Pool Challenge',
        });
      }
      if (input.maxParticipants !== undefined) {
        updates.push({
          settingKey: 'leadershipPoolMaxParticipants',
          settingValue: input.maxParticipants.toString(),
          description: 'Maximum number of participants in Leadership Pool',
        });
      }

      await Promise.all(
        updates.map(update =>
          prisma.adminSettings.upsert({
            where: { settingKey: update.settingKey },
            update: {
              settingValue: update.settingValue,
              updatedAt: new Date(),
            },
            create: {
              id: randomUUID(),
              settingKey: update.settingKey,
              settingValue: update.settingValue,
              description: update.description,
              updatedAt: new Date(),
            },
          })
        )
      );

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: 'UPDATE_LEADERSHIP_POOL_SETTINGS',
          entity: 'LEADERSHIP_POOL',
          entityId: 'settings',
          changes: input,
          ipAddress: '',
          userAgent: '',
        },
      });

      return { success: true };
    }),

  getLeadershipPoolParticipants: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        filter: z.enum(['all', 'earned', 'sponsored']).default('all'),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, filter, search } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {
        isQualified: true,
      };

      if (filter === 'earned') {
        where.sponsorshipClass = false;
      } else if (filter === 'sponsored') {
        where.sponsorshipClass = true;
      }

      if (search) {
        where.User = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      const [participants, total] = await Promise.all([
        prisma.leadershipPoolQualification.findMany({
          where,
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                activeMembershipPackageId: true,
              },
            },
          },
          orderBy: { qualifiedAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.leadershipPoolQualification.count({ where }),
      ]);

      const packageIds = Array.from(
        new Set(
          participants
            .map((p: any) => p.User.activeMembershipPackageId)
            .filter((id: any): id is string => Boolean(id))
        )
      );

      const membershipPackages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
          })
        : [];
      const packageNameById = new Map(membershipPackages.map((p: any) => [p.id, p.name] as const));

      return {
        participants: participants.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          userName: p.User.name,
          userEmail: p.User.email,
          membershipPackage: p.User.activeMembershipPackageId
            ? packageNameById.get(p.User.activeMembershipPackageId) ?? null
            : null,
          qualificationOption: p.qualificationOption,
          sponsorshipClass: p.sponsorshipClass,
          qualifiedAt: p.qualifiedAt,
          poolSharePercentage: p.poolSharePercentage,
        })),
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  addSponsorshipClassParticipant: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, activeMembershipPackageId: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const membershipPackage = user.activeMembershipPackageId
        ? await prisma.membershipPackage.findUnique({
            where: { id: user.activeMembershipPackageId },
            select: { name: true },
          })
        : null;

      const membershipPackageName = membershipPackage?.name ?? null;

      // Create or update qualification record
      await prisma.leadershipPoolQualification.upsert({
        where: { userId: input.userId },
        update: {
          sponsorshipClass: true,
          isQualified: true,
          qualifiedAt: new Date(),
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          userId: input.userId,
          sponsorshipClass: true,
          isQualified: true,
          qualifiedAt: new Date(),
          hasRegularPlusPackage:
            membershipPackageName !== null &&
            ['Regular Plus', 'Gold Plus', 'Platinum Plus'].includes(membershipPackageName),
          updatedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: 'ADD_SPONSORSHIP_CLASS_PARTICIPANT',
          entity: 'LEADERSHIP_POOL',
          entityId: input.userId,
          metadata: { userName: user.name, userEmail: user.email },
          ipAddress: '',
          userAgent: '',
        },
      });

      return { success: true, user: { ...user, membershipPackageName } };
    }),

  removeSponsorshipClassParticipant: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const qualification = await prisma.leadershipPoolQualification.findUnique({
        where: { userId: input.userId },
        include: {
          User: {
            select: { name: true, email: true },
          },
        },
      });

      if (!qualification) {
        throw new Error('Qualification record not found');
      }

      // Remove sponsorship class flag (they may still be qualified through normal means)
      await prisma.leadershipPoolQualification.update({
        where: { userId: input.userId },
        data: {
          sponsorshipClass: false,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: 'REMOVE_SPONSORSHIP_CLASS_PARTICIPANT',
          entity: 'LEADERSHIP_POOL',
          entityId: input.userId,
          metadata: { userName: qualification.User.name, userEmail: qualification.User.email },
          ipAddress: '',
          userAgent: '',
        },
      });

      return { success: true };
    }),

  disqualifyParticipant: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const qualification = await prisma.leadershipPoolQualification.findUnique({
        where: { userId: input.userId },
        include: {
          User: {
            select: { name: true, email: true },
          },
        },
      });

      if (!qualification) {
        throw new Error('Qualification record not found');
      }

      // Completely disqualify the user
      await prisma.leadershipPoolQualification.update({
        where: { userId: input.userId },
        data: {
          isQualified: false,
          sponsorshipClass: false,
          qualifiedAt: null,
          updatedAt: new Date(),
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: 'DISQUALIFY_LEADERSHIP_POOL_PARTICIPANT',
          entity: 'LEADERSHIP_POOL',
          entityId: input.userId,
          metadata: { userName: qualification.User.name, userEmail: qualification.User.email },
          ipAddress: '',
          userAgent: '',
        },
      });

      return { success: true };
    }),

  getLeadershipPoolStats: adminProcedure.query(async () => {
    const [total, earned, sponsored] = await Promise.all([
      prisma.leadershipPoolQualification.count({ where: { isQualified: true } }),
      prisma.leadershipPoolQualification.count({ where: { isQualified: true, sponsorshipClass: false } }),
      prisma.leadershipPoolQualification.count({ where: { isQualified: true, sponsorshipClass: true } }),
    ]);

    return {
      totalQualified: total,
      earnedQualifications: earned,
      sponsoredQualifications: sponsored,
    };
  }),

  // User email search with autocomplete
  searchUsersByEmail: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          activated: true,
          activeMembershipPackageId: true,
        },
        take: input.limit,
        orderBy: { email: "asc" },
      });

      return users;
    }),

  // Assign membership package to single user
  assignMembershipPackage: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        packageId: z.string(),
        processPayout: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user, membershipPackage] = await Promise.all([
        prisma.user.findUnique({
          where: { id: input.userId },
          include: {
            Referral_Referral_referredIdToUser: {
              include: {
                User_Referral_referrerIdToUser: true,
              },
            },
          },
        }),
        prisma.membershipPackage.findUnique({
          where: { id: input.packageId },
        }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      if (!membershipPackage) {
        throw new Error("Membership package not found");
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Update user membership
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          activeMembershipPackageId: input.packageId,
          activated: true,
          membershipActivatedAt: now,
          updatedAt: now,
        },
      });

      // Process payout if requested (execute full referral flow)
      if (input.processPayout) {
        await activateMembershipAfterExternalPayment({
          prisma,
          userId: input.userId,
          packageId: input.packageId,
          selectedPalliative: undefined,
          paymentReference: `MANUAL-ACTIVATION-${Date.now()}`,
          paymentMethodLabel: "Manual Admin Activation",
          activatorName: user.name || user.email || "Manual Activation",
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "ASSIGN_MEMBERSHIP_PACKAGE",
          entity: "USER",
          entityId: input.userId,
          metadata: {
            packageId: input.packageId,
            packageName: membershipPackage.name,
            packagePrice: membershipPackage.price,
            processPayout: input.processPayout,
            userEmail: user.email,
            userName: user.name,
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        package: {
          id: membershipPackage.id,
          name: membershipPackage.name,
        },
      };
    }),

  // Bulk assign membership package
  bulkAssignMembershipPackage: adminProcedure
    .input(
      z.object({
        emails: z.array(z.string().email()),
        packageId: z.string(),
        processPayout: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: input.packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found");
      }

      const users = await prisma.user.findMany({
        where: {
          email: { in: input.emails },
        },
        include: {
          Referral_Referral_referredIdToUser: {
            include: {
              User_Referral_referrerIdToUser: true,
            },
          },
        },
      });

      if (users.length === 0) {
        throw new Error("No users found with provided emails");
      }

      const now = new Date();
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ email: string; error: string }>,
      };

      for (const user of users) {
        try {
          // Update user membership
          await prisma.user.update({
            where: { id: user.id },
            data: {
              activeMembershipPackageId: input.packageId,
              activated: true,
              membershipActivatedAt: now,
              updatedAt: now,
            },
          });

          // Process payout if requested
          if (input.processPayout) {
            await activateMembershipAfterExternalPayment({
              prisma,
              userId: user.id,
              packageId: input.packageId,
              selectedPalliative: undefined,
              paymentReference: `BULK-ACTIVATION-${Date.now()}-${user.id}`,
              paymentMethodLabel: "Bulk Admin Activation",
              activatorName: user.name || user.email || "Bulk Activation",
            });
          }

          results.success++;

          // Audit log for each user
          await prisma.auditLog.create({
            data: {
              id: randomUUID(),
              userId: ctx.session!.user.id,
              action: "BULK_ASSIGN_MEMBERSHIP_PACKAGE",
              entity: "USER",
              entityId: user.id,
              metadata: {
                packageId: input.packageId,
                packageName: membershipPackage.name,
                packagePrice: membershipPackage.price,
                processPayout: input.processPayout,
                userEmail: user.email,
                userName: user.name,
                bulkOperation: true,
              },
              ipAddress: "",
              userAgent: "",
            },
          });
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            email: user.email || "Unknown",
            error: error.message,
          });
        }
      }

      return {
        success: true,
        results,
        package: {
          id: membershipPackage.id,
          name: membershipPackage.name,
        },
      };
    }),

  // Extend membership expiration
  extendMembershipExpiration: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        months: z.number().min(1).max(36),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.activeMembershipPackageId) {
        throw new Error("User does not have an active membership");
      }

      const now = new Date();
      const currentActivatedAt = user.membershipActivatedAt || now;

      // Use membershipExpiresAt as the authoritative base if it exists;
      // otherwise fall back to activatedAt + 1 year (handles legacy records).
      const currentExpiresAt = user.membershipExpiresAt
        ? new Date(user.membershipExpiresAt)
        : (() => {
            const d = new Date(currentActivatedAt);
            d.setFullYear(d.getFullYear() + 1);
            return d;
          })();

      // New expiration = current expiration + extension months
      const newExpiresAt = new Date(currentExpiresAt);
      newExpiresAt.setMonth(newExpiresAt.getMonth() + input.months);

      // Keep activatedAt consistent: new expiration minus 1 year
      const newStartDate = new Date(newExpiresAt);
      newStartDate.setFullYear(newStartDate.getFullYear() - 1);

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          membershipActivatedAt: newStartDate,
          membershipExpiresAt: newExpiresAt,   // ← the field the system actually reads
          updatedAt: now,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "EXTEND_MEMBERSHIP_EXPIRATION",
          entity: "USER",
          entityId: input.userId,
          metadata: {
            userEmail: user.email,
            userName: user.name,
            extensionMonths: input.months,
            previousExpiresAt: currentExpiresAt.toISOString(),
            previousActivatedAt: currentActivatedAt.toISOString(),
            newActivatedAt: newStartDate.toISOString(),
            newExpiresAt: newExpiresAt.toISOString(),
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        newStartDate,
        newExpiresAt,
      };
    }),

  getMembershipResetOverview: adminProcedure
    .input(
      z
        .object({
          windowDays: z.number().int().min(1).max(90).default(14),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const windowDays = input?.windowDays ?? 14;
      const limit = input?.limit ?? 50;
      const now = new Date();
      const soon = new Date(now);
      soon.setDate(soon.getDate() + windowDays);

      const baseMembershipWhere = { activeMembershipPackageId: { not: null } } as const;

      const [expiredCount, expiringSoonCount, noExpiryCount, dueResetCount, dueResetUsers] = await Promise.all([
        prisma.user.count({
          where: {
            ...baseMembershipWhere,
            membershipExpiresAt: { lte: now },
          },
        }),
        prisma.user.count({
          where: {
            ...baseMembershipWhere,
            membershipExpiresAt: { gt: now, lte: soon },
          },
        }),
        prisma.user.count({
          where: {
            ...baseMembershipWhere,
            membershipExpiresAt: null,
          },
        }),
        prisma.user.count({
          where: {
            ...baseMembershipWhere,
            membershipExpiresAt: { lte: now },
          },
        }),
        prisma.user.findMany({
          where: {
            ...baseMembershipWhere,
            membershipExpiresAt: { lte: now },
          },
          orderBy: [{ membershipExpiresAt: "asc" }],
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
            membershipExpiresAt: true,
            activated: true,
          },
        }),
      ]);

      const packageIds = Array.from(
        new Set(
          dueResetUsers
            .map((user) => user.activeMembershipPackageId)
            .filter((packageId): packageId is string => Boolean(packageId))
        )
      );

      const packages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
          })
        : [];

      const packageNameById = new Map(packages.map((pkg) => [pkg.id, pkg.name]));

      return {
        generatedAt: now,
        windowDays,
        summary: {
          expiredCount,
          expiringSoonCount,
          noExpiryCount,
          dueResetCount,
        },
        dueResetUsers: dueResetUsers.map((user) => {
          const expiresAt = user.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null;
          const daysExpired = expiresAt
            ? Math.max(0, Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)))
            : null;
          return {
            ...user,
            packageName: user.activeMembershipPackageId
              ? packageNameById.get(user.activeMembershipPackageId) ?? "Unknown package"
              : null,
            daysExpired,
          };
        }),
      };
    }),

  getMembershipExpiryRepairOverview: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(25),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 25;

      const [missingExpiryCount, repairableUsers, unrecoverableCount] = await Promise.all([
        prisma.user.count({
          where: {
            activeMembershipPackageId: { not: null },
            membershipExpiresAt: null,
          },
        }),
        prisma.user.findMany({
          where: {
            activeMembershipPackageId: { not: null },
            membershipExpiresAt: null,
            membershipActivatedAt: { not: null },
          },
          orderBy: [{ membershipActivatedAt: "asc" }],
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            activeMembershipPackageId: true,
            membershipActivatedAt: true,
          },
        }),
        prisma.user.count({
          where: {
            activeMembershipPackageId: { not: null },
            membershipExpiresAt: null,
            membershipActivatedAt: null,
          },
        }),
      ]);

      const packageIds = Array.from(
        new Set(
          repairableUsers
            .map((user) => user.activeMembershipPackageId)
            .filter((packageId): packageId is string => Boolean(packageId))
        )
      );

      const membershipPackages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true, renewalCycle: true },
          })
        : [];

      const packageMap = new Map(membershipPackages.map((membershipPackage) => [membershipPackage.id, membershipPackage]));

      const candidates = repairableUsers
        .map((user) => {
          const membershipPackage = user.activeMembershipPackageId
            ? packageMap.get(user.activeMembershipPackageId)
            : null;
          const { expiresAt } = deriveMembershipExpiry({
            membershipActivatedAt: user.membershipActivatedAt,
            renewalCycleDays: membershipPackage?.renewalCycle,
          });

          if (!expiresAt || !membershipPackage) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            packageName: membershipPackage.name,
            renewalCycleDays: membershipPackage.renewalCycle,
            membershipActivatedAt: user.membershipActivatedAt,
            derivedMembershipExpiresAt: expiresAt,
          };
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

      return {
        summary: {
          missingExpiryCount,
          repairableCount: candidates.length,
          unrecoverableCount,
        },
        candidates,
      };
    }),

  backfillMembershipExpiryDates: adminProcedure
    .input(
      z
        .object({
          dryRun: z.boolean().default(true),
          limit: z.number().int().min(1).max(500).default(100),
          userId: z.string().optional(),
          reason: z.string().trim().max(500).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const dryRun = input?.dryRun ?? true;
      const limit = input?.limit ?? 100;

      const users = await prisma.user.findMany({
        where: {
          activeMembershipPackageId: { not: null },
          membershipExpiresAt: null,
          ...(input?.userId ? { id: input.userId } : {}),
        },
        orderBy: [{ membershipActivatedAt: "asc" }],
        take: input?.userId ? 1 : limit,
        select: {
          id: true,
          name: true,
          email: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
        },
      });

      const packageIds = Array.from(
        new Set(
          users
            .map((user) => user.activeMembershipPackageId)
            .filter((packageId): packageId is string => Boolean(packageId))
        )
      );

      const membershipPackages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true, renewalCycle: true },
          })
        : [];

      const packageMap = new Map(membershipPackages.map((membershipPackage) => [membershipPackage.id, membershipPackage]));

      const repairable = users
        .map((user) => {
          const membershipPackage = user.activeMembershipPackageId
            ? packageMap.get(user.activeMembershipPackageId)
            : null;
          const { expiresAt } = deriveMembershipExpiry({
            membershipActivatedAt: user.membershipActivatedAt,
            renewalCycleDays: membershipPackage?.renewalCycle,
          });

          if (!expiresAt || !membershipPackage) {
            return null;
          }

          return {
            user,
            membershipPackage,
            derivedMembershipExpiresAt: expiresAt,
          };
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

      const unrecoverable = users.filter(
        (user) => !repairable.some((candidate) => candidate.user.id === user.id)
      );

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          matched: users.length,
          repaired: 0,
          unrecoverable: unrecoverable.length,
          candidates: repairable.map((candidate) => ({
            id: candidate.user.id,
            name: candidate.user.name,
            email: candidate.user.email,
            packageName: candidate.membershipPackage.name,
            membershipActivatedAt: candidate.user.membershipActivatedAt,
            derivedMembershipExpiresAt: candidate.derivedMembershipExpiresAt,
          })),
        };
      }

      for (const candidate of repairable) {
        await prisma.user.update({
          where: { id: candidate.user.id },
          data: {
            membershipExpiresAt: candidate.derivedMembershipExpiresAt,
            updatedAt: new Date(),
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "BACKFILL_MEMBERSHIP_EXPIRY",
          entity: "SYSTEM",
          entityId: input?.userId ?? "BULK_MEMBERSHIP_EXPIRY_BACKFILL",
          metadata: {
            dryRun: false,
            matched: users.length,
            repaired: repairable.length,
            unrecoverable: unrecoverable.length,
            repairedUsers: repairable.slice(0, 100).map((candidate) => ({
              userId: candidate.user.id,
              packageName: candidate.membershipPackage.name,
              membershipActivatedAt: candidate.user.membershipActivatedAt,
              derivedMembershipExpiresAt: candidate.derivedMembershipExpiresAt,
            })),
            reason: input?.reason ?? "Derived missing membership expiry dates from activation date and renewal cycle",
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        dryRun: false,
        matched: users.length,
        repaired: repairable.length,
        unrecoverable: unrecoverable.length,
      };
    }),

  resetMembershipPlan: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          activeMembershipPackageId: true,
          membershipActivatedAt: true,
          membershipExpiresAt: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (!user.activeMembershipPackageId) {
        return {
          success: true,
          userId: user.id,
          alreadyReset: true,
        };
      }

      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: user.activeMembershipPackageId },
        select: { id: true, name: true },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeMembershipPackageId: null,
          membershipActivatedAt: null,
          membershipExpiresAt: null,
          updatedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "RESET_MEMBERSHIP_PLAN",
          entity: "USER",
          entityId: user.id,
          metadata: {
            userName: user.name,
            userEmail: user.email,
            previousPackageId: membershipPackage?.id ?? user.activeMembershipPackageId,
            previousPackageName: membershipPackage?.name ?? null,
            previousActivatedAt: user.membershipActivatedAt,
            previousExpiresAt: user.membershipExpiresAt,
            reason: input.reason ?? "Manual admin reset",
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        userId: user.id,
        previousPackageName: membershipPackage?.name ?? null,
      };
    }),

  autoResetExpiredMemberships: adminProcedure
    .input(
      z
        .object({
          dryRun: z.boolean().default(true),
          limit: z.number().int().min(1).max(500).default(200),
          reason: z.string().trim().max(500).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const dryRun = input?.dryRun ?? true;
      const limit = input?.limit ?? 200;
      const now = new Date();

      const candidates = await prisma.user.findMany({
        where: {
          activeMembershipPackageId: { not: null },
          membershipExpiresAt: { lte: now },
        },
        orderBy: [{ membershipExpiresAt: "asc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          activeMembershipPackageId: true,
          membershipExpiresAt: true,
        },
      });

      if (dryRun) {
        return {
          dryRun: true,
          matched: candidates.length,
          reset: 0,
          users: candidates,
        };
      }

      if (candidates.length === 0) {
        return {
          dryRun: false,
          matched: 0,
          reset: 0,
          users: [],
        };
      }

      const packageIds = Array.from(
        new Set(
          candidates
            .map((candidate) => candidate.activeMembershipPackageId)
            .filter((packageId): packageId is string => Boolean(packageId))
        )
      );
      const packages = packageIds.length
        ? await prisma.membershipPackage.findMany({
            where: { id: { in: packageIds } },
            select: { id: true, name: true },
          })
        : [];
      const packageNameById = new Map(packages.map((pkg) => [pkg.id, pkg.name]));

      const resetAt = new Date();

      await prisma.$transaction(async (tx) => {
        for (const candidate of candidates) {
          await tx.user.update({
            where: { id: candidate.id },
            data: {
              activeMembershipPackageId: null,
              membershipActivatedAt: null,
              membershipExpiresAt: null,
              updatedAt: resetAt,
            },
          });

          await tx.auditLog.create({
            data: {
              id: randomUUID(),
              userId: ctx.session!.user.id,
              action: "AUTO_RESET_EXPIRED_MEMBERSHIP",
              entity: "USER",
              entityId: candidate.id,
              metadata: {
                userName: candidate.name,
                userEmail: candidate.email,
                previousPackageId: candidate.activeMembershipPackageId,
                previousPackageName: candidate.activeMembershipPackageId
                  ? packageNameById.get(candidate.activeMembershipPackageId) ?? null
                  : null,
                previousExpiresAt: candidate.membershipExpiresAt,
                reason: input?.reason ?? "Automatic reset for expired membership",
              },
              ipAddress: "",
              userAgent: "",
            },
          });
        }
      });

      return {
        dryRun: false,
        matched: candidates.length,
        reset: candidates.length,
        users: candidates,
      };
    }),

  // Admin wallet adjustments (set balance) and credits for any wallet field
  adjustUserWallet: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        walletKey: z.enum([
          "wallet",
          "spendable",
          "palliative",
          "cashback",
          "studentCashback",
          "community",
          "shareholder",
          "shelter",
          "shelterWallet",
          "education",
          "car",
          "business",
          "solar",
          "legals",
          "land",
          "meal",
          "health",
          "security",
          "socialMedia",
          "empowermentSponsorReward",
          "retirement",
          "travelTour",
          "bpiTokenWallet",
        ]),
        newBalance: z.number(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { walletKey } = input;
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          [walletKey]: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentValue = (user as any)[walletKey] ?? 0;
      const normalized = Number(input.newBalance);
      if (!Number.isFinite(normalized)) {
        throw new Error("Invalid amount");
      }
      const coercedValue = walletKey === "shelterWallet" ? Math.round(normalized) : normalized;
      const delta = coercedValue - currentValue;
      const now = new Date();

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          [walletKey]: coercedValue,
          updatedAt: now,
        },
      });

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          transactionType: delta >= 0 ? "ADMIN_WALLET_CREDIT" : "ADMIN_WALLET_DEBIT",
          amount: delta,
          description: `Admin set ${walletKey} from ${currentValue} to ${coercedValue}. Remark: ${
            input.remark || "System generated asset"
          }`,
          status: "completed",
          reference: `ADMIN-ADJUST-${walletKey}-${Date.now()}`,
          walletType: walletKey,
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "ADMIN_WALLET_ADJUST",
          entity: "USER",
          entityId: input.userId,
          metadata: {
            walletKey,
            previousValue: currentValue,
            newValue: coercedValue,
            delta,
            remark: input.remark || "System generated asset",
            userEmail: user.email,
            userName: user.name,
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        newBalance: coercedValue,
        delta,
      };
    }),

  addUserWallet: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        walletKey: z.enum([
          "wallet",
          "spendable",
          "palliative",
          "cashback",
          "studentCashback",
          "community",
          "shareholder",
          "shelter",
          "shelterWallet",
          "education",
          "car",
          "business",
          "solar",
          "legals",
          "land",
          "meal",
          "health",
          "security",
          "socialMedia",
          "empowermentSponsorReward",
          "retirement",
          "travelTour",
          "bpiTokenWallet",
        ]),
        amount: z.number().positive(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { walletKey } = input;
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          name: true,
          [walletKey]: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentValue = (user as any)[walletKey] ?? 0;
      const normalizedAmount = Number(input.amount);
      if (!Number.isFinite(normalizedAmount)) {
        throw new Error("Invalid amount");
      }
      const newBalanceRaw = currentValue + normalizedAmount;
      const newBalance = walletKey === "shelterWallet" ? Math.round(newBalanceRaw) : newBalanceRaw;
      const now = new Date();

      await prisma.user.update({
        where: { id: input.userId },
        data: {
          [walletKey]: newBalance,
          updatedAt: now,
        },
      });

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          transactionType: "ADMIN_WALLET_ADD",
          amount: normalizedAmount,
          description: `Admin added ${normalizedAmount} to ${walletKey}. Remark: ${
            input.remark || "System generated asset"
          }`,
          status: "completed",
          reference: `ADMIN-ADD-${walletKey}-${Date.now()}`,
          walletType: walletKey,
        },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "ADMIN_WALLET_ADD",
          entity: "USER",
          entityId: input.userId,
          metadata: {
            walletKey,
            previousValue: currentValue,
            newValue: newBalance,
            delta: normalizedAmount,
            remark: input.remark || "System generated asset",
            userEmail: user.email,
            userName: user.name,
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        newBalance,
        added: normalizedAmount,
      };
    }),

  // Swap user sponsor/referrer
  swapSponsor: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newSponsorEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [user, newSponsor] = await Promise.all([
        prisma.user.findUnique({
          where: { id: input.userId },
          select: { 
            id: true, 
            email: true, 
            name: true, 
            referredBy: true, 
            sponsorId: true 
          },
        }),
        prisma.user.findUnique({
          where: { email: input.newSponsorEmail },
          select: { id: true, email: true, name: true },
        }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      if (!newSponsor) {
        throw new Error("New sponsor not found with that email");
      }

      if (newSponsor.id === input.userId) {
        throw new Error("User cannot be their own sponsor");
      }

      // Get old sponsor info if exists
      const oldSponsorInfo = user.sponsorId 
        ? await prisma.user.findUnique({
            where: { id: user.sponsorId },
            select: { id: true, email: true, name: true },
          })
        : null;

      if (!newSponsor) {
        throw new Error("New sponsor not found with that email");
      }

      if (newSponsor.id === input.userId) {
        throw new Error("User cannot be their own sponsor");
      }

      // Check for circular referrals (prevent sponsor loops)
      const checkCircular = async (checkId: string, targetId: string, depth = 0): Promise<boolean> => {
        if (depth > 10) return false; // Max depth to prevent infinite loops
        if (checkId === targetId) return true;
        
        const sponsor = await prisma.user.findUnique({
          where: { id: checkId },
          select: { sponsorId: true },
        });
        
        if (!sponsor?.sponsorId) return false;
        return checkCircular(sponsor.sponsorId, targetId, depth + 1);
      };

      const wouldCreateLoop = await checkCircular(newSponsor.id, input.userId);
      if (wouldCreateLoop) {
        throw new Error("Cannot set this sponsor - would create a circular referral loop");
      }

      const oldReferredBy = user.referredBy;
      const oldSponsor = user.sponsorId;

      // Update user's referredBy and sponsorId
      await prisma.user.update({
        where: { id: input.userId },
        data: {
          referredBy: newSponsor.id,
          sponsorId: newSponsor.id,
          updatedAt: new Date(),
        },
      });

      // Update or create referral record
      const existingReferral = await prisma.referral.findFirst({
        where: {
          referredId: input.userId,
        },
      });

      if (existingReferral) {
        // Update existing referral to point to new sponsor
        await prisma.referral.update({
          where: { id: existingReferral.id },
          data: {
            referrerId: newSponsor.id,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new referral record
        await prisma.referral.create({
          data: {
            id: randomUUID(),
            referrerId: newSponsor.id,
            referredId: input.userId,
            status: "completed",
            rewardPaid: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session!.user.id,
          action: "SWAP_SPONSOR",
          entity: "USER",
          entityId: input.userId,
          metadata: {
            userEmail: user.email,
            userName: user.name,
            oldSponsorId: oldSponsor,
            oldSponsorEmail: oldSponsorInfo?.email,
            oldSponsorName: oldSponsorInfo?.name,
            newSponsorId: newSponsor.id,
            newSponsorEmail: newSponsor.email,
            newSponsorName: newSponsor.name,
            oldReferredById: oldReferredBy,
          },
          ipAddress: "",
          userAgent: "",
        },
      });

      return {
        success: true,
        oldSponsor: oldSponsor ? {
          id: oldSponsor,
          email: oldSponsorInfo?.email,
          name: oldSponsorInfo?.name,
        } : null,
        newSponsor: {
          id: newSponsor.id,
          email: newSponsor.email,
          name: newSponsor.name,
        },
      };
    }),

  // Help Center - Admin Management
  helpListCategories: adminProcedure.query(async () => {
    return prisma.helpCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }),

  helpCreateCategory: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
        description: z.string().optional(),
        order: z.number().int().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.helpCategory.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          order: input.order,
          isActive: input.isActive,
        },
      });
    }),

  helpUpdateCategory: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2),
        slug: z.string().min(2),
        description: z.string().optional(),
        order: z.number().int().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.helpCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          order: input.order,
          isActive: input.isActive,
        },
      });
    }),

  helpDeleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.helpCategory.delete({ where: { id: input.id } });
      return { success: true };
    }),

  helpListTopics: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { search, categoryId, page, pageSize } = input;
      const skip = (page - 1) * pageSize;
      const where: any = {};
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ];
      }

      const [topics, total] = await prisma.$transaction([
        prisma.helpTopic.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            tags: true,
            isPublished: true,
            updatedAt: true,
            category: { select: { id: true, name: true } },
          },
        }),
        prisma.helpTopic.count({ where }),
      ]);

      return {
        topics,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }),

  helpGetTopic: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.helpTopic.findUnique({ where: { id: input.id } });
    }),

  helpCreateTopic: adminProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        title: z.string().min(3),
        slug: z.string().min(3),
        summary: z.string().optional(),
        steps: z.array(z.string()).optional(),
        faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
        tags: z.array(z.string()).default([]),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const topic = await prisma.helpTopic.create({
        data: {
          categoryId: input.categoryId || null,
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          steps: input.steps ?? [],
          faq: input.faq ?? [],
          tags: input.tags,
          isPublished: input.isPublished,
          createdById: ctx.session?.user?.id,
          updatedById: ctx.session?.user?.id,
        },
      });

      await prisma.helpRevision.create({
        data: {
          topicId: topic.id,
          createdById: ctx.session?.user?.id,
          contentSnapshot: {
            title: topic.title,
            summary: topic.summary,
            steps: topic.steps,
            faq: topic.faq,
            tags: topic.tags,
            isPublished: topic.isPublished,
            categoryId: topic.categoryId,
          },
        },
      });

      return topic;
    }),

  helpUpdateTopic: adminProcedure
    .input(
      z.object({
        id: z.string(),
        categoryId: z.string().optional(),
        title: z.string().min(3),
        slug: z.string().min(3),
        summary: z.string().optional(),
        steps: z.array(z.string()).optional(),
        faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
        tags: z.array(z.string()).default([]),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.helpTopic.findUnique({ where: { id: input.id } });
      if (!existing) throw new Error("Topic not found");

      await prisma.helpRevision.create({
        data: {
          topicId: existing.id,
          createdById: ctx.session?.user?.id,
          contentSnapshot: {
            title: existing.title,
            summary: existing.summary,
            steps: existing.steps,
            faq: existing.faq,
            tags: existing.tags,
            isPublished: existing.isPublished,
            categoryId: existing.categoryId,
          },
        },
      });

      return prisma.helpTopic.update({
        where: { id: input.id },
        data: {
          categoryId: input.categoryId || null,
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          steps: input.steps ?? [],
          faq: input.faq ?? [],
          tags: input.tags,
          isPublished: input.isPublished,
          updatedById: ctx.session?.user?.id,
        },
      });
    }),

  helpTogglePublish: adminProcedure
    .input(z.object({ id: z.string(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.helpTopic.update({
        where: { id: input.id },
        data: {
          isPublished: input.isPublished,
          updatedById: ctx.session?.user?.id,
        },
      });
    }),

  // Generate impersonation token for admin to login as user
  createImpersonationToken: adminProcedure
    .input(z.object({ targetUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session?.user?.id;
      if (!adminId) throw new Error("Admin not authenticated");

      const rateLimit = impersonationCreationLimiter.check(adminId);
      if (!rateLimit.success) {
        throw new Error("Too many impersonation token requests. Please wait before creating another one.");
      }

      // Verify target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: input.targetUserId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!targetUser) throw new Error("Target user not found");

      // Prevent impersonating other admins
      if (targetUser.role === "admin" || targetUser.role === "super_admin") {
        throw new Error("Cannot impersonate admin users");
      }

      // Create a one-time impersonation token
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.$transaction(async (tx) => {
        await tx.impersonationToken.deleteMany({
          where: {
            adminId,
            OR: [
              { used: false },
              { expiresAt: { lte: new Date() } },
            ],
          },
        });

        const createdToken = await tx.impersonationToken.create({
          data: {
            id: randomUUID(),
            token,
            adminId,
            targetUserId: input.targetUserId,
            expiresAt,
            used: false,
          },
          select: { id: true },
        });

        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            userId: adminId,
            action: "ADMIN_IMPERSONATION_ISSUED",
            entity: "ImpersonationToken",
            entityId: createdToken.id,
            status: "success",
            metadata: {
              targetUserId: input.targetUserId,
              targetUserEmail: targetUser.email,
              targetUserName: targetUser.name,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });
      });

      return { token, expiresAt };
    }),

  // ============ PROMOTIONAL MATERIALS MANAGEMENT ============
  getAllPromotionalMaterials: adminProcedure.query(async () => {
    return await prisma.promotionalMaterial.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  createPromotionalMaterial: adminProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      type: z.string(),
      category: z.string(),
      fileUrl: z.string(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.session?.user as any)?.id;
      if (!userId) throw new Error("Unauthorized");
      
      return await prisma.promotionalMaterial.create({
        data: {
          id: randomUUID(),
          ...input,
          isActive: true,
          downloadCount: 0,
          shareCount: 0,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  updatePromotionalMaterial: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      category: z.string().optional(),
      fileUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.promotionalMaterial.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    }),

  deletePromotionalMaterial: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.promotionalMaterial.delete({
        where: { id: input.id },
      });
    }),

  togglePromotionalMaterialActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const material = await prisma.promotionalMaterial.findUnique({
        where: { id: input.id },
      });
      if (!material) throw new Error("Material not found");
      
      return await prisma.promotionalMaterial.update({
        where: { id: input.id },
        data: { isActive: !material.isActive },
      });
    }),

  // ============ DEPOSIT LOGS ============
  getDepositLogs: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(50),
      search: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, status } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {
        transactionType: { in: ['deposit', 'funding', 'payment'] },
      };

      if (search) {
        where.OR = [
          { userId: { contains: search } },
          { reference: { contains: search } },
          { description: { contains: search } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        transactions,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  // ============ WITHDRAWAL LOGS ============
  getWithdrawalLogs: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      pageSize: z.number().default(50),
      search: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { page, pageSize, search, status } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {
        transactionType: { in: ['WITHDRAWAL_CASH', 'WITHDRAWAL_BPT', 'WITHDRAWAL_FEE'] },
      };

      if (search) {
        where.OR = [
          { userId: { contains: search } },
          { reference: { contains: search } },
          { description: { contains: search } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [withdrawals, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      return {
        withdrawals,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
      };
    }),

  // SMTP Test Endpoint
  testSmtpConnection: adminProcedure
    .input(z.object({
      testEmail: z.string().email(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { testEmail } = input;

      try {
        const { sendEmail } = await import('@/lib/email');
        
        const testHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0d3b29 0%, #1a5c3f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .info-grid { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .info-label { font-weight: 600; color: #6b7280; }
                .info-value { color: #111827; font-weight: 500; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ SMTP Test Email</h1>
                </div>
                <div class="content">
                  <div class="success-box">
                    <strong>🎉 Success! Your SMTP configuration is working correctly.</strong>
                  </div>

                  <p>This is a test email from your BPI admin panel to verify your SMTP settings.</p>

                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">Test Initiated By:</span>
                      <span class="info-value">${ctx.session?.user?.name || ctx.session?.user?.email || 'Admin'}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Test Date:</span>
                      <span class="info-value">${new Date().toLocaleString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Status:</span>
                      <span class="info-value" style="color: #10b981;">✅ Email Delivery Successful</span>
                    </div>
                  </div>

                  <p><strong>What this means:</strong></p>
                  <ul>
                    <li>Your SMTP server credentials are correct</li>
                    <li>The server can successfully connect and authenticate</li>
                    <li>Email delivery is functioning properly</li>
                    <li>Your system is ready to send user notifications</li>
                  </ul>

                  <p>You can now safely use this configuration for:</p>
                  <ul>
                    <li>Password reset emails</li>
                    <li>Email verification codes</li>
                    <li>Withdrawal notifications</li>
                    <li>Newsletter campaigns</li>
                    <li>System alerts and notifications</li>
                  </ul>

                  <p>If you received this email, your SMTP setup is complete and operational!</p>
                  
                  <p>Best regards,<br>The BPI System</p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
                  <p style="margin-top: 10px; color: #999;">This is an automated test email sent from your admin panel.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        await sendEmail({
          to: testEmail,
          subject: '✅ SMTP Test Email - Configuration Successful',
          html: testHtml,
        });

        // Log the test
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: ctx.session?.user?.id || 'admin',
            action: 'SMTP_TEST',
            entity: 'system',
            entityId: 'smtp-config',
            metadata: {
              testEmail,
              timestamp: new Date().toISOString(),
              result: 'success'
            }
          },
        });

        console.log(`✅ [SMTP TEST] Test email sent successfully to ${testEmail}`);
        return { 
          success: true, 
          message: `Test email sent successfully to ${testEmail}. Please check your inbox.` 
        };
      } catch (error: any) {
        console.error('❌ [SMTP TEST] Failed to send test email:', error);
        
        // Log the failed test
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: ctx.session?.user?.id || 'admin',
            action: 'SMTP_TEST_FAILED',
            entity: 'system',
            entityId: 'smtp-config',
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
            metadata: {
              testEmail,
              timestamp: new Date().toISOString(),
              error: error.message || 'Unknown error',
              code: error.code || 'N/A',
              command: error.command || 'N/A'
            }
          },
        });

        throw new Error(`SMTP Test Failed: ${error.message || 'Unknown error'}. Please check your SMTP configuration.`);
      }
    }),

  // Newsletter System
  getNewsletterRecipientCount: adminProcedure
    .input(z.object({
      filter: z.enum(['all', 'activated', 'non-activated', 'membership']),
      membershipPackage: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { filter, membershipPackage } = input;
      const count = await prisma.user.count({ where: getNewsletterRecipientWhere(filter, membershipPackage) });
      
      return { count };
    }),

  sendTestNewsletter: adminProcedure
    .input(z.object({
      testEmail: z.string().email(),
      fromEmail: z.string().email().optional(),
      replyToEmail: z.string().email().optional(),
      subject: z.string().min(1),
      body: z.string().min(1),
      embeddedImages: z.array(z.object({
        id: z.string(),
        content: z.string(),
        position: z.number(),
      })).optional(),
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { testEmail, fromEmail, replyToEmail, subject, body, embeddedImages, attachments } = input;

      // Get company info for email template
      const companySettings = await prisma.adminSettings.findMany();
      const companyInfo = Object.fromEntries(
        companySettings.map((s: any) => [s.settingKey, { value: s.settingValue, description: s.description }])
      );

      // Build email HTML with template
      const emailHtml = buildNewsletterEmail({
        userName: 'Test User',
        subject,
        body,
        companyInfo,
        embeddedImages: embeddedImages || [],
      });

      const { sendEmail } = await import('@/lib/email');

      await sendEmail({
        to: testEmail,
        from: fromEmail || companyInfo.company_email?.value || 'noreply@beepagro.com',
        replyTo: replyToEmail || companyInfo.support_email?.value || 'support@beepagro.com',
        subject: `[TEST] ${subject}`,
        html: emailHtml,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content.split(',')[1],
          encoding: 'base64'
        })),
      });

      return { success: true, message: `Test email sent to ${testEmail}` };
    }),

  sendNewsletter: adminProcedure
    .input(z.object({
      filter: z.enum(['all', 'activated', 'non-activated', 'membership']),
      membershipPackage: z.string().optional(),
      fromEmail: z.string().email().optional(),
      replyToEmail: z.string().email().optional(),
      subject: z.string().min(1),
      body: z.string().min(1),
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })).optional(),
      embeddedImages: z.array(z.object({
        id: z.string(),
        content: z.string(),
        position: z.number(),
      })).optional(),
      sendRate: z.object({
        batchSize: z.number().min(1).max(50).default(10),
        delayBetweenEmailsMs: z.number().min(1000).max(30000).default(4000),
        delayBetweenBatchesMs: z.number().min(5000).max(300000).default(45000),
        warmUp: z.boolean().default(true),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const { filter, membershipPackage, fromEmail, replyToEmail, subject, body, attachments, embeddedImages, sendRate } = input;
      
      const jobId = randomUUID();
      console.log(`\n📧 [NEWSLETTER] Job ${jobId} created`);
      console.log('📋 [NEWSLETTER] Config:', { filter, membershipPackage, subject, sendRate });
      
      const validRecipients = await getNewsletterRecipients(filter, membershipPackage);
      const total = validRecipients.length;

      if (total === 0) {
        return { jobId, total: 0, message: 'No valid recipients found' };
      }

      // Get company info for email template
      const companySettings = await prisma.adminSettings.findMany();
      const companyInfo = Object.fromEntries(
        companySettings.map((s: any) => [s.settingKey, { value: s.settingValue, description: s.description }])
      );

      const adminUserId = ctx.session?.user?.id || 'admin';
      const resolvedFromEmail = fromEmail || companyInfo.company_email?.value || 'noreply@beepagro.com';
      const resolvedReplyTo = replyToEmail || companyInfo.support_email?.value || 'support@beepagro.com';

      // Initialize job state
      newsletterJobs.set(jobId, {
        jobId,
        status: 'running',
        sent: 0,
        failed: 0,
        total,
        currentBatch: 0,
        totalBatches: 0,
        startedAt: Date.now(),
        lastError: null,
        currentEmail: null,
        sentEmails: [],
        failedEmails: [],
        errorLog: [],
        failedRecipients: [],
        campaignConfig: {
          filter,
          membershipPackage,
          fromEmail: resolvedFromEmail,
          replyToEmail: resolvedReplyTo,
          subject,
          body,
          attachments,
          embeddedImages,
          sendRate,
        },
        allRecipientIds: validRecipients.map(r => r.id),
        sentRecipientIds: new Set(),
      });

      // Persist campaign to database
      try {
        await newsletterCampaignStore.create({
          data: {
            jobId,
            adminId: adminUserId,
            status: 'running',
            subject,
            body,
            filter,
            membershipPackage: membershipPackage || null,
            fromEmail: resolvedFromEmail,
            replyToEmail: resolvedReplyTo,
            attachments: (attachments || []) as any,
            embeddedImages: (embeddedImages || []) as any,
            batchSize: sendRate.batchSize,
            delayBetweenMs: sendRate.delayBetweenEmailsMs,
            batchCooldownMs: sendRate.delayBetweenBatchesMs,
            warmUp: sendRate.warmUp,
            totalRecipients: total,
            allRecipientIds: validRecipients.map(r => r.id),
          },
        });
      } catch (err) {
        console.error(`[NEWSLETTER] Failed to persist campaign ${jobId}:`, err);
      }

      // Fire and forget — process in background
      processNewsletterInBackground(jobId, {
        validRecipients,
        fromEmail: resolvedFromEmail,
        replyToEmail: resolvedReplyTo,
        subject,
        body,
        attachments,
        embeddedImages,
        companyInfo,
        sendRate,
        adminUserId,
      }).catch(err => {
        console.error(`❌ [NEWSLETTER] Job ${jobId} fatal error:`, err);
        const job = newsletterJobs.get(jobId);
        if (job) {
          job.status = 'error';
          job.lastError = err instanceof Error ? err.message : 'Unknown fatal error';
        }
      });

      return { jobId, total, message: `Newsletter campaign started — ${total} recipients` };
    }),

  getNewsletterProgress: adminProcedure
    .input(z.object({ jobId: z.string(), sentSince: z.number().optional() }))
    .query(async ({ input }) => {
      let job = newsletterJobs.get(input.jobId);
      if (!job) {
        const campaign = await newsletterCampaignStore.findUnique({
          where: { jobId: input.jobId },
        }) as DurableNewsletterCampaign | null;

        if (!campaign) {
          return {
            status: 'not_found' as const,
            sent: 0, failed: 0, total: 0,
            currentBatch: 0, totalBatches: 0,
            lastError: null,
            currentEmail: null,
            sentEmails: [] as SentEmailEntry[],
            failedEmails: [] as FailedEmailEntry[],
            errorLog: [] as ErrorLogEntry[],
            failedRecipients: [] as string[],
            elapsedMs: 0,
            canResume: false,
          };
        }

        job = restoreNewsletterJobState(campaign);
      }

      return buildNewsletterProgressSnapshot(job, input.sentSince || 0);
    }),

  cancelNewsletter: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(({ input }) => {
      const job = newsletterJobs.get(input.jobId);
      if (!job) throw new Error('Job not found');
      if (job.status !== 'running') throw new Error('Job is not running');
      job.status = 'cancelled';
      return { success: true, sent: job.sent, remaining: job.total - job.sent - job.failed };
    }),

  resumeNewsletter: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const oldJob = newsletterJobs.get(input.jobId);
      if (!oldJob) throw new Error('Job not found');
      if (oldJob.status === 'running') throw new Error('Job is still running');
      if (!oldJob.campaignConfig) throw new Error('Cannot resume — campaign config not available');

      const alreadySentIds = oldJob.sentRecipientIds;
      const config = oldJob.campaignConfig;

      // Fetch remaining recipients (exclude already sent)
      const allRecipientIds = oldJob.allRecipientIds.filter(id => !alreadySentIds.has(id));
      if (allRecipientIds.length === 0) {
        throw new Error('All recipients have already been sent to');
      }

      const remainingRecipients = await prisma.user.findMany({
        where: { id: { in: allRecipientIds } },
        select: { id: true, email: true, name: true },
      });

      const validRecipients = remainingRecipients.filter((r: any): r is typeof r & { email: string } => !!r.email);
      if (validRecipients.length === 0) {
        throw new Error('No valid recipients remaining');
      }

      // Get company info
      const companySettings = await prisma.adminSettings.findMany();
      const companyInfo = Object.fromEntries(
        companySettings.map((s: any) => [s.settingKey, { value: s.settingValue, description: s.description }])
      );

      const newJobId = randomUUID();
      const adminUserId = ctx.session?.user?.id || 'admin';

      // Create new job that carries forward the sent data from old job
      newsletterJobs.set(newJobId, {
        jobId: newJobId,
        status: 'running',
        sent: oldJob.sent,
        failed: 0,
        total: oldJob.total,
        currentBatch: 0,
        totalBatches: 0,
        startedAt: Date.now(),
        lastError: null,
        currentEmail: null,
        sentEmails: [...oldJob.sentEmails],
        failedEmails: [],
        errorLog: [],
        failedRecipients: [],
        campaignConfig: config,
        allRecipientIds: oldJob.allRecipientIds,
        sentRecipientIds: new Set(alreadySentIds),
      });

      // Mark old job so we don't try to resume it again
      oldJob.status = 'completed';

      processNewsletterInBackground(newJobId, {
        validRecipients,
        fromEmail: config.fromEmail,
        replyToEmail: config.replyToEmail,
        subject: config.subject,
        body: config.body,
        attachments: config.attachments,
        embeddedImages: config.embeddedImages,
        companyInfo,
        sendRate: config.sendRate,
        adminUserId,
      }).catch(err => {
        console.error(`❌ [NEWSLETTER] Resumed job ${newJobId} fatal error:`, err);
        const job = newsletterJobs.get(newJobId);
        if (job) {
          job.status = 'error';
          job.lastError = err instanceof Error ? err.message : 'Unknown fatal error';
        }
      });

      return {
        jobId: newJobId,
        remaining: validRecipients.length,
        alreadySent: oldJob.sent,
        message: `Resumed campaign — ${validRecipients.length} remaining (${oldJob.sent} already sent)`,
      };
    }),

  // ── Active Campaign (for auto-restore on page load) ────────────────
  getActiveNewsletterCampaign: adminProcedure
    .query(async () => {
      // First check in-memory for any running job
      for (const [, job] of newsletterJobs) {
        if (job.status === 'running') {
          return {
            id: '',
            jobId: job.jobId,
            status: 'running' as const,
            subject: job.campaignConfig?.subject || 'Newsletter',
            totalRecipients: job.total,
            sentCount: job.sent,
            failedCount: job.failed,
            elapsedMs: Date.now() - job.startedAt,
            lastError: job.lastError,
          };
        }
      }
      // Fall back to DB — find most recent non-completed campaign
      const campaign = await newsletterCampaignStore.findFirst({
        where: { status: { in: ['running', 'cancelled'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          status: true,
          subject: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          elapsedMs: true,
          lastError: true,
        },
      });
      return campaign;
    }),

  // ── Campaign History ──────────────────────────────────────────────
  getNewsletterCampaigns: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const campaigns = await newsletterCampaignStore.findMany({
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          status: true,
          subject: true,
          filter: true,
          membershipPackage: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          elapsedMs: true,
          lastError: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (campaigns.length > input.limit) {
        const next = campaigns.pop()!;
        nextCursor = next.id;
      }

      // Check if any in-memory jobs are still running (supplement DB data)
      const enriched: DurableNewsletterCampaign[] = [];
      for (const c of campaigns as DurableNewsletterCampaign[]) {
        const memJob = newsletterJobs.get(c.jobId);
        if (memJob && memJob.status === 'running') {
          enriched.push({
            ...c,
            status: 'running',
            sentCount: memJob.sent,
            failedCount: memJob.failed,
            elapsedMs: Date.now() - memJob.startedAt,
          });
          continue;
        }
        enriched.push(c);
      }

      return { campaigns: enriched, nextCursor };
    }),

  getNewsletterCampaignDetail: adminProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      const campaign = await newsletterCampaignStore.findUnique({
        where: { id: input.campaignId },
      });
      if (!campaign) throw new Error('Campaign not found');

      // If it's running in memory, return live data
      const memJob = newsletterJobs.get(campaign.jobId);
      if (memJob) {
        return {
          ...campaign,
          status: memJob.status,
          sentCount: memJob.sent,
          failedCount: memJob.failed,
          elapsedMs: Date.now() - memJob.startedAt,
          currentEmail: memJob.currentEmail,
          sentEmails: memJob.sentEmails.slice(-50),
          failedEmails: memJob.failedEmails,
          errorLog: memJob.errorLog.slice(-100),
          canResume: (memJob.status === 'cancelled' || memJob.status === 'error') && memJob.sent < memJob.total,
        };
      }

      return {
        ...campaign,
        currentEmail: null,
        canResume: (campaign.status === 'cancelled' || campaign.status === 'error') && campaign.sentCount < campaign.totalRecipients,
      };
    }),

  resumeNewsletterFromDb: adminProcedure
    .input(z.object({ campaignId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const campaign = await newsletterCampaignStore.findUnique({
        where: { id: input.campaignId },
      });
      if (!campaign) throw new Error('Campaign not found');
      if (campaign.status === 'running') throw new Error('Campaign is still running');
      if (campaign.sentCount >= campaign.totalRecipients) throw new Error('All recipients already sent');

      const sentIds = new Set(campaign.sentRecipientIds as string[]);
      const remainingIds = (campaign.allRecipientIds as string[]).filter(id => !sentIds.has(id));

      if (remainingIds.length === 0) throw new Error('No recipients remaining');

      const validRecipients = await prisma.user.findMany({
        where: { id: { in: remainingIds } },
        select: { id: true, email: true, name: true },
      });

      const emailableRecipients = validRecipients.filter((r: any): r is typeof r & { email: string } => !!r.email);
      if (emailableRecipients.length === 0) throw new Error('No valid recipients remaining');

      const companySettings = await prisma.adminSettings.findMany();
      const companyInfo = Object.fromEntries(
        companySettings.map((s: any) => [s.settingKey, { value: s.settingValue, description: s.description }])
      );

      const newJobId = randomUUID();
      const adminUserId = ctx.session?.user?.id || 'admin';

      // Create new in-memory job carrying forward sent data
      newsletterJobs.set(newJobId, {
        jobId: newJobId,
        status: 'running',
        sent: campaign.sentCount,
        failed: 0,
        total: campaign.totalRecipients,
        currentBatch: 0,
        totalBatches: 0,
        startedAt: Date.now(),
        lastError: null,
        currentEmail: null,
        sentEmails: [],
        failedEmails: [],
        errorLog: [],
        failedRecipients: [],
        campaignConfig: {
          filter: campaign.filter,
          membershipPackage: campaign.membershipPackage || undefined,
          fromEmail: campaign.fromEmail || 'noreply@beepagro.com',
          replyToEmail: campaign.replyToEmail || 'support@beepagro.com',
          subject: campaign.subject,
          body: campaign.body,
          attachments: Array.isArray(campaign.attachments) ? (campaign.attachments as { filename: string; content: string }[]) : [],
          embeddedImages: Array.isArray(campaign.embeddedImages) ? (campaign.embeddedImages as { id: string; content: string; position: number }[]) : [],
          sendRate: {
            batchSize: campaign.batchSize,
            delayBetweenEmailsMs: campaign.delayBetweenMs,
            delayBetweenBatchesMs: campaign.batchCooldownMs,
            warmUp: campaign.warmUp,
          },
        },
        allRecipientIds: campaign.allRecipientIds as string[],
        sentRecipientIds: sentIds,
      });

      // Create new DB campaign row linked to old one
      await newsletterCampaignStore.create({
        data: {
          jobId: newJobId,
          adminId: adminUserId,
          status: 'running',
          subject: campaign.subject,
          body: campaign.body,
          filter: campaign.filter,
          membershipPackage: campaign.membershipPackage,
          fromEmail: campaign.fromEmail,
          replyToEmail: campaign.replyToEmail,
          attachments: (Array.isArray(campaign.attachments) ? campaign.attachments : []) as Prisma.InputJsonValue,
          embeddedImages: (Array.isArray(campaign.embeddedImages) ? campaign.embeddedImages : []) as Prisma.InputJsonValue,
          batchSize: campaign.batchSize,
          delayBetweenMs: campaign.delayBetweenMs,
          batchCooldownMs: campaign.batchCooldownMs,
          warmUp: campaign.warmUp,
          totalRecipients: campaign.totalRecipients,
          sentCount: campaign.sentCount,
          sentRecipientIds: Array.from(sentIds),
          allRecipientIds: (campaign.allRecipientIds ?? []) as any,
        },
      });

      // Mark old campaign as completed
      await newsletterCampaignStore.update({
        where: { id: campaign.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      processNewsletterInBackground(newJobId, {
        validRecipients: emailableRecipients,
        fromEmail: campaign.fromEmail || 'noreply@beepagro.com',
        replyToEmail: campaign.replyToEmail || 'support@beepagro.com',
        subject: campaign.subject,
        body: campaign.body,
        attachments: Array.isArray(campaign.attachments) ? (campaign.attachments as { filename: string; content: string }[]) : [],
        embeddedImages: Array.isArray(campaign.embeddedImages) ? (campaign.embeddedImages as { id: string; content: string; position: number }[]) : [],
        companyInfo,
        sendRate: {
          batchSize: campaign.batchSize,
          delayBetweenEmailsMs: campaign.delayBetweenMs,
          delayBetweenBatchesMs: campaign.batchCooldownMs,
          warmUp: campaign.warmUp,
        },
        adminUserId,
      }).catch(err => {
        const job = newsletterJobs.get(newJobId);
        if (job) {
          job.status = 'error';
          job.lastError = err instanceof Error ? err.message : 'Unknown error';
        }
      });

      return {
        jobId: newJobId,
        remaining: emailableRecipients.length,
        alreadySent: campaign.sentCount,
        message: `Resumed — ${emailableRecipients.length} remaining (${campaign.sentCount} already sent)`,
      };
    }),

  // ========================================
  // SCHEDULED NEWSLETTER QUEUE ENDPOINTS
  // ========================================

  // Schedule a newsletter for future delivery
  scheduleNewsletter: adminProcedure
    .input(z.object({
      scheduledFor: z.date().min(new Date(), "Cannot schedule in the past"),
      filter: z.enum(['all', 'activated', 'non-activated', 'membership']),
      membershipPackage: z.string().optional(),
      fromEmail: z.string().email().optional(),
      replyToEmail: z.string().email().optional(),
      subject: z.string().min(1),
      body: z.string().min(1),
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })).optional(),
      embeddedImages: z.array(z.object({
        id: z.string(),
        content: z.string(),
        position: z.number(),
      })).optional(),
      sendRate: z.object({
        emails: z.number().min(1).max(100),
        interval: z.number().min(1).max(60),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const jobId = randomUUID();

      await newsletterCampaignStore.create({
        data: {
          jobId,
          adminId: ctx.session?.user?.id || 'admin',
          status: 'scheduled',
          scheduledFor: input.scheduledFor,
          subject: input.subject,
          body: input.body,
          filter: input.filter,
          membershipPackage: input.membershipPackage || null,
          fromEmail: input.fromEmail || null,
          replyToEmail: input.replyToEmail || null,
          attachments: (input.attachments || []) as any,
          embeddedImages: (input.embeddedImages || []) as any,
          batchSize: input.sendRate.emails,
          delayBetweenMs: 0,
          batchCooldownMs: input.sendRate.interval * 60 * 1000,
          warmUp: false,
          totalRecipients: 0,
          allRecipientIds: [] as any,
        },
      });

      console.log(`✅ [ADMIN] Newsletter scheduled: ${jobId} for ${input.scheduledFor.toISOString()}`);

      return {
        jobId,
        scheduledFor: input.scheduledFor,
        status: 'pending',
        message: `Newsletter scheduled successfully for ${input.scheduledFor.toLocaleString()}`
      };
    }),

  // Get all scheduled newsletters
  getScheduledNewsletters: adminProcedure
    .query(async () => {
      const campaigns = await newsletterCampaignStore.findMany({
        where: { scheduledFor: { not: null } },
        orderBy: { scheduledFor: 'asc' },
      });

      const scheduledJobs = [];
      for (const campaign of campaigns as DurableNewsletterCampaign[]) {
        scheduledJobs.push({
          id: campaign.jobId,
          scheduledFor: campaign.scheduledFor!,
          filter: campaign.filter as 'all' | 'activated' | 'non-activated' | 'membership',
          membershipPackage: campaign.membershipPackage || undefined,
          fromEmail: campaign.fromEmail || undefined,
          replyToEmail: campaign.replyToEmail || undefined,
          subject: campaign.subject,
          body: campaign.body,
          attachments: (Array.isArray(campaign.attachments) ? campaign.attachments : []) as Array<{ filename: string; content: string }>,
          embeddedImages: (Array.isArray(campaign.embeddedImages) ? campaign.embeddedImages : []) as Array<{ id: string; content: string; position: number }>,
          sendRate: {
            emails: campaign.batchSize,
            interval: Math.max(1, Math.round(campaign.batchCooldownMs / 60000)),
          },
          status: campaign.status === 'scheduled' ? 'pending' : campaign.status === 'running' ? 'processing' : campaign.status,
          createdBy: campaign.adminId,
          createdAt: campaign.createdAt,
          processedAt: campaign.completedAt || undefined,
          error: campaign.lastError || undefined,
          stats: {
            total: campaign.totalRecipients,
            sent: campaign.sentCount,
            failed: campaign.failedCount,
            duration: Math.round(campaign.elapsedMs / 60000),
          },
        });
      }

      return scheduledJobs;
    }),

  // Get newsletter job by ID
  getNewsletterJob: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const campaign = await newsletterCampaignStore.findUnique({ where: { jobId: input.jobId } }) as DurableNewsletterCampaign | null;

      if (!campaign || !campaign.scheduledFor) {
        throw new Error(`Newsletter job ${input.jobId} not found`);
      }

      return {
        id: campaign.jobId,
        scheduledFor: campaign.scheduledFor,
        filter: campaign.filter as 'all' | 'activated' | 'non-activated' | 'membership',
        membershipPackage: campaign.membershipPackage || undefined,
        fromEmail: campaign.fromEmail || undefined,
        replyToEmail: campaign.replyToEmail || undefined,
        subject: campaign.subject,
        body: campaign.body,
        attachments: (Array.isArray(campaign.attachments) ? campaign.attachments : []) as Array<{ filename: string; content: string }>,
        embeddedImages: (Array.isArray(campaign.embeddedImages) ? campaign.embeddedImages : []) as Array<{ id: string; content: string; position: number }>,
        sendRate: {
          emails: campaign.batchSize,
          interval: Math.max(1, Math.round(campaign.batchCooldownMs / 60000)),
        },
        status: campaign.status === 'scheduled' ? 'pending' : campaign.status === 'running' ? 'processing' : campaign.status,
        createdBy: campaign.adminId,
        createdAt: campaign.createdAt,
        processedAt: campaign.completedAt || undefined,
        error: campaign.lastError || undefined,
        stats: {
          total: campaign.totalRecipients,
          sent: campaign.sentCount,
          failed: campaign.failedCount,
          duration: Math.round(campaign.elapsedMs / 60000),
        },
      };
    }),

  // Cancel a scheduled newsletter
  cancelScheduledNewsletter: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      const campaign = await newsletterCampaignStore.findUnique({ where: { jobId: input.jobId } }) as DurableNewsletterCampaign | null;

      if (!campaign || !campaign.scheduledFor) {
        throw new Error(`Failed to cancel newsletter job ${input.jobId}`);
      }

      if (campaign.status === 'running') {
        throw new Error('Cannot cancel newsletter that is currently processing');
      }

      if (campaign.status !== 'scheduled') {
        throw new Error(`Failed to cancel newsletter job ${input.jobId}`);
      }

      await newsletterCampaignStore.update({
        where: { id: campaign.id },
        data: { status: 'cancelled' },
      });

      console.log(`🚫 [ADMIN] Newsletter cancelled: ${input.jobId}`);

      return { 
        success: true, 
        message: `Newsletter job ${input.jobId} cancelled successfully` 
      };
    }),

  // Delete a completed/failed/cancelled newsletter job
  deleteNewsletterJob: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      const campaign = await newsletterCampaignStore.findUnique({ where: { jobId: input.jobId } }) as DurableNewsletterCampaign | null;

      if (!campaign || !campaign.scheduledFor) {
        throw new Error(`Failed to delete newsletter job ${input.jobId}`);
      }

      if (campaign.status === 'running' || campaign.status === 'scheduled') {
        throw new Error('Cannot delete active or pending newsletter. Cancel it first.');
      }

      await newsletterCampaignStore.delete({ where: { id: campaign.id } });

      console.log(`🗑️ [ADMIN] Newsletter job deleted: ${input.jobId}`);

      return { 
        success: true, 
        message: `Newsletter job ${input.jobId} deleted successfully` 
      };
    }),

  // Get newsletter queue statistics
  getNewsletterQueueStats: adminProcedure
    .query(async () => {
      const campaigns = await newsletterCampaignStore.findMany({
        where: { scheduledFor: { not: null } },
        select: { status: true },
      });

      let pending = 0;
      let processing = 0;
      let completed = 0;
      let failed = 0;
      let cancelled = 0;

      for (const campaign of campaigns as Array<Pick<DurableNewsletterCampaign, 'status'>>) {
        if (campaign.status === 'scheduled') pending++;
        else if (campaign.status === 'running') processing++;
        else if (campaign.status === 'completed') completed++;
        else if (campaign.status === 'cancelled') cancelled++;
        else if (campaign.status === 'failed' || campaign.status === 'error') failed++;
      }

      return {
        total: campaigns.length,
        pending,
        processing,
        completed,
        failed,
        cancelled,
      };
    }),

  // Send renewal reminders to members expiring soon
  sendRenewalReminders: adminProcedure
    .input(z.object({
      daysBeforeExpiry: z.number().min(1).max(30).default(14),
      sendToAll: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const { daysBeforeExpiry, sendToAll } = input;
      const now = new Date();
      const targetDate = new Date(now.getTime() + (daysBeforeExpiry * 24 * 60 * 60 * 1000));

      console.log(`📧 [RENEWAL-REMINDERS] Starting batch send for ${daysBeforeExpiry}-day notice...`);

      // Find users whose membership expires within the specified days
      const users = await prisma.user.findMany({
        where: {
          activated: true,
          membershipExpiresAt: sendToAll 
            ? { lte: targetDate, gte: now }  // All users expiring within timeframe
            : { 
                lte: targetDate,
                gte: new Date(targetDate.getTime() - (24 * 60 * 60 * 1000)) // Only users expiring exactly N days from now
              },
          activeMembershipPackageId: { not: null }
        },
        select: {
          id: true,
          email: true,
          name: true,
          membershipExpiresAt: true,
          activeMembershipPackageId: true
        }
      });

      console.log(`📊 [RENEWAL-REMINDERS] Found ${users.length} users expiring within ${daysBeforeExpiry} days`);

      let sent = 0;
      let failed = 0;
      const { sendRenewalReminderEmail } = await import('@/lib/email');

      for (const user of users) {
        if (!user.email || !user.membershipExpiresAt || !user.activeMembershipPackageId) {
          continue;
        }

        // Fetch the membership package separately
        const pkg = await prisma.membershipPackage.findUnique({
          where: { id: user.activeMembershipPackageId },
          select: {
            name: true,
            renewalFee: true,
            price: true,
            hasRenewal: true
          }
        });
        
        if (!pkg || !pkg.hasRenewal) {
          continue;
        }

        const daysRemaining = Math.ceil(
          (user.membershipExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining < 0) {
          continue; // Already expired
        }

        try {
          await sendRenewalReminderEmail(
            user.email,
            user.name || 'Member',
            pkg.name,
            user.membershipExpiresAt,
            daysRemaining,
            pkg.renewalFee || pkg.price
          );
          sent++;
          console.log(`✅ Sent renewal reminder to ${user.email} (${daysRemaining} days remaining)`);
        } catch (error) {
          failed++;
          console.error(`❌ Failed to send renewal reminder to ${user.email}:`, error);
        }

        // Rate limiting: wait 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: ctx.session?.user?.id || 'admin',
          action: 'SEND_RENEWAL_REMINDERS',
          entity: 'Email',
          entityId: `renewal-batch-${Date.now()}`,
          changes: JSON.stringify({
            daysBeforeExpiry,
            sent,
            failed,
            total: users.length
          }),
          status: 'success',
          createdAt: new Date()
        }
      });

      console.log(`✅ [RENEWAL-REMINDERS] Complete: ${sent} sent, ${failed} failed`);

      return { sent, failed, total: users.length };
    }),

  // ========================================
  // WALLET FREEZE/UNFREEZE ENDPOINTS
  // ========================================

  // Freeze a user's wallet
  freezeWallet: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().min(1, "Reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { userId, reason } = input;
      const adminId = ctx.session?.user?.id || 'admin';

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          walletFrozen: true,
          wallet: true 
        }
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      if (user.walletFrozen) {
        throw new Error(`Wallet for user ${user.name || user.email || userId} is already frozen`);
      }

      // Freeze wallet
      await prisma.user.update({
        where: { id: userId },
        data: {
          walletFrozen: true,
          walletFrozenAt: new Date(),
          walletFrozenBy: adminId,
          walletFrozenReason: reason,
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: 'FREEZE_WALLET',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({
            walletFrozen: { from: false, to: true },
            reason,
            walletBalance: user.wallet,
          }),
          status: 'success',
        }
      });

      // Send email notification to user
      if (user.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: user.email,
            subject: '🔒 Your BPI Wallet Has Been Frozen',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                  .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🔒 Wallet Frozen</h1>
                  </div>
                  <div class="content">
                    <p>Dear ${user.name || 'Member'},</p>
                    
                    <div class="alert-box">
                      <strong>⚠️ Important Notice:</strong> Your BPI wallet has been frozen by administration.
                    </div>

                    <p><strong>Reason:</strong></p>
                    <p style="padding-left: 20px; font-style: italic;">${reason}</p>

                    <p><strong>What this means:</strong></p>
                    <ul>
                      <li>You cannot make withdrawals from your wallet</li>
                      <li>You cannot make transfers to other users</li>
                      <li>You cannot use wallet funds for purchases</li>
                      <li>Incoming funds and rewards may still be credited (but frozen)</li>
                    </ul>

                    <p><strong>Next Steps:</strong></p>
                    <p>Please contact our support team immediately to resolve this matter. You can reach us at:</p>
                    <ul>
                      <li>Email: support@bpiplatform.com</li>
                      <li>Help Center: Visit your dashboard and use the support chat</li>
                    </ul>

                    <p>We apologize for any inconvenience this may cause.</p>
                    
                    <p>Best regards,<br>BPI Administration Team</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
                    <p>This is an automated system notification. Please do not reply to this email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log(`✅ Wallet freeze notification sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send wallet freeze notification:', emailError);
        }
      }

      console.log(`🔒 [ADMIN] Wallet frozen for user ${userId} by ${adminId}. Reason: ${reason}`);

      return {
        success: true,
        message: `Wallet frozen for ${user.name || user.email || userId}`,
        userId,
        frozenAt: new Date(),
      };
    }),

  // Unfreeze a user's wallet
  unfreezeWallet: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;
      const adminId = ctx.session?.user?.id || 'admin';

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          walletFrozen: true,
          walletFrozenAt: true,
          walletFrozenBy: true,
          walletFrozenReason: true,
          wallet: true,
        }
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      if (!user.walletFrozen) {
        throw new Error(`Wallet for user ${user.name || user.email || userId} is not frozen`);
      }

      const previousReason = user.walletFrozenReason;
      const frozenDuration = user.walletFrozenAt 
        ? Math.round((Date.now() - user.walletFrozenAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Unfreeze wallet
      await prisma.user.update({
        where: { id: userId },
        data: {
          walletFrozen: false,
          walletFrozenAt: null,
          walletFrozenBy: null,
          walletFrozenReason: null,
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: 'UNFREEZE_WALLET',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({
            walletFrozen: { from: true, to: false },
            previousReason,
            frozenDurationDays: frozenDuration,
            walletBalance: user.wallet,
          }),
          status: 'success',
        }
      });

      // Send email notification to user
      if (user.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: user.email,
            subject: '✅ Your BPI Wallet Has Been Unfrozen',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                  .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
                  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Wallet Unfrozen</h1>
                  </div>
                  <div class="content">
                    <p>Dear ${user.name || 'Member'},</p>
                    
                    <div class="success-box">
                      <strong>✅ Good News:</strong> Your BPI wallet has been unfrozen and is now fully operational.
                    </div>

                    <p><strong>Wallet Status:</strong> Active ✅</p>
                    <p><strong>Current Balance:</strong> ₦${user.wallet.toLocaleString()}</p>
                    <p><strong>Frozen Duration:</strong> ${frozenDuration} day(s)</p>

                    <p><strong>You can now:</strong></p>
                    <ul>
                      <li>Make withdrawals from your wallet</li>
                      <li>Transfer funds to other users</li>
                      <li>Use wallet balance for purchases and payments</li>
                      <li>Access all wallet features normally</li>
                    </ul>

                    <p>Thank you for your patience and cooperation in resolving this matter.</p>
                    
                    <p>Best regards,<br>BPI Administration Team</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
                    <p>This is an automated system notification. Please do not reply to this email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log(`✅ Wallet unfreeze notification sent to ${user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send wallet unfreeze notification:', emailError);
        }
      }

      console.log(`🔓 [ADMIN] Wallet unfrozen for user ${userId} by ${adminId}. Was frozen for ${frozenDuration} days.`);

      return {
        success: true,
        message: `Wallet unfrozen for ${user.name || user.email || userId}`,
        userId,
        unfrozenAt: new Date(),
        frozenDuration: `${frozenDuration} day(s)`,
      };
    }),

  // Get all users with frozen wallets
  getFrozenWallets: adminProcedure
    .query(async () => {
      const frozenUsers = await prisma.user.findMany({
        where: { walletFrozen: true },
        select: {
          id: true,
          email: true,
          name: true,
          wallet: true,
          walletFrozen: true,
          walletFrozenAt: true,
          walletFrozenBy: true,
          walletFrozenReason: true,
        },
        orderBy: { walletFrozenAt: 'desc' }
      });

      return frozenUsers.map((user: any) => ({
        ...user,
        frozenDuration: user.walletFrozenAt 
          ? Math.round((Date.now() - user.walletFrozenAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    }),

  // ========================================
  // WITHDRAWAL BAN/UNBAN ENDPOINTS
  // ========================================

  // Ban a user from making withdrawals
  banWithdrawals: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().min(1, "Reason is required"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { userId, reason } = input;
      const adminId = ctx.session?.user?.id || 'admin';

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, withdrawBan: true, wallet: true }
      });

      if (!user) throw new Error(`User ${userId} not found`);
      if (user.withdrawBan === 1) throw new Error(`User ${user.name || user.email || userId} is already banned from withdrawals`);

      await prisma.user.update({
        where: { id: userId },
        data: {
          withdrawBan: 1,
          withdrawBanAt: new Date(),
          withdrawBanBy: adminId,
          withdrawBanReason: reason,
        }
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: 'BAN_WITHDRAWALS',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({
            withdrawBan: { from: 0, to: 1 },
            reason,
            walletBalance: user.wallet,
          }),
          status: 'success',
        }
      });

      if (user.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: user.email,
            subject: '⚠️ Withdrawal Access Restricted on Your BPI Account',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                  .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header"><h1>⚠️ Withdrawal Access Restricted</h1></div>
                  <div class="content">
                    <p>Dear ${user.name || 'Member'},</p>
                    <div class="alert-box">
                      <strong>⚠️ Notice:</strong> Your withdrawal access has been restricted by administration.
                    </div>
                    <p><strong>Reason:</strong></p>
                    <p style="padding-left: 20px; font-style: italic;">${reason}</p>
                    <p><strong>What this means:</strong></p>
                    <ul>
                      <li>You cannot make any withdrawals (cash, BPT, or USDT)</li>
                      <li>Your wallet balance and other features remain accessible</li>
                      <li>Incoming funds and rewards will continue to be credited normally</li>
                    </ul>
                    <p>Please contact our support team to resolve this matter.</p>
                    <p>Best regards,<br>BPI Administration Team</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        } catch (emailError) {
          console.error('❌ Failed to send withdrawal ban notification:', emailError);
        }
      }

      console.log(`🚫 [ADMIN] Withdrawal ban set for user ${userId} by ${adminId}. Reason: ${reason}`);

      return {
        success: true,
        message: `Withdrawals banned for ${user.name || user.email || userId}`,
        userId,
        bannedAt: new Date(),
      };
    }),

  // Unban a user from withdrawal restriction
  unbanWithdrawals: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;
      const adminId = ctx.session?.user?.id || 'admin';

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, withdrawBan: true, withdrawBanAt: true, withdrawBanReason: true, wallet: true }
      });

      if (!user) throw new Error(`User ${userId} not found`);
      if (user.withdrawBan !== 1) throw new Error(`User ${user.name || user.email || userId} is not banned from withdrawals`);

      const previousReason = user.withdrawBanReason;
      const banDuration = user.withdrawBanAt
        ? Math.round((Date.now() - user.withdrawBanAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      await prisma.user.update({
        where: { id: userId },
        data: {
          withdrawBan: 0,
          withdrawBanAt: null,
          withdrawBanBy: null,
          withdrawBanReason: null,
        }
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: 'UNBAN_WITHDRAWALS',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({
            withdrawBan: { from: 1, to: 0 },
            previousReason,
            banDurationDays: banDuration,
            walletBalance: user.wallet,
          }),
          status: 'success',
        }
      });

      if (user.email) {
        try {
          const { sendEmail } = await import('@/lib/email');
          await sendEmail({
            to: user.email,
            subject: '✅ Withdrawal Access Restored on Your BPI Account',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                  .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; }
                  .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header"><h1>✅ Withdrawal Access Restored</h1></div>
                  <div class="content">
                    <p>Dear ${user.name || 'Member'},</p>
                    <div class="success-box">
                      <strong>✅ Good News:</strong> Your withdrawal access has been restored.
                    </div>
                    <p><strong>Restriction Duration:</strong> ${banDuration} day(s)</p>
                    <p>You can now make withdrawals from your wallet normally.</p>
                    <p>Thank you for your patience.</p>
                    <p>Best regards,<br>BPI Administration Team</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
        } catch (emailError) {
          console.error('❌ Failed to send withdrawal unban notification:', emailError);
        }
      }

      console.log(`✅ [ADMIN] Withdrawal ban lifted for user ${userId} by ${adminId}. Was banned for ${banDuration} days.`);

      return {
        success: true,
        message: `Withdrawal access restored for ${user.name || user.email || userId}`,
        userId,
        unbannedAt: new Date(),
        banDuration: `${banDuration} day(s)`,
      };
    }),

  // ========================================
  // USD FEATURES ACCESS TOGGLE
  // ========================================

  toggleAllowUsdFeatures: adminProcedure
    .input(z.object({
      userId: z.string(),
      allow: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { userId, allow } = input;
      const adminId = ctx.session?.user?.id || 'admin';

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, allowUsdFeatures: true }
      });

      if (!user) throw new Error(`User ${userId} not found`);
      if (user.allowUsdFeatures === allow) {
        throw new Error(`USD features are already ${allow ? 'enabled' : 'disabled'} for this user`);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { allowUsdFeatures: allow },
      });

      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: adminId,
          action: allow ? 'ENABLE_USD_FEATURES' : 'DISABLE_USD_FEATURES',
          entity: 'User',
          entityId: userId,
          changes: JSON.stringify({
            allowUsdFeatures: { from: !allow, to: allow },
          }),
          status: 'success',
        }
      });

      console.log(`💱 [ADMIN] USD features ${allow ? 'enabled' : 'disabled'} for user ${userId} by ${adminId}`);

      return {
        success: true,
        message: `USD features ${allow ? 'enabled' : 'disabled'} for ${user.name || user.email || userId}`,
        userId,
      };
    }),
})

;

// Helper function to build newsletter email HTML
function buildNewsletterEmail({
  userName,
  subject,
  body,
  companyInfo,
  embeddedImages,
}: {
  userName: string;
  subject: string;
  body: string;
  companyInfo: any;
  embeddedImages: Array<{ id: string; content: string; position: number }>;
}) {
  // Process embedded images in body (insert from end to start to maintain positions)
  let processedBody = body;
  const sortedImages = [...embeddedImages].sort((a, b) => b.position - a.position);
  sortedImages.forEach(img => {
    // Insert image at position
    const imageHtml = `<img src="${img.content}" alt="Image" style="max-width: 100%; height: auto; margin: 1rem 0; border-radius: 8px;" />`;
    processedBody = processedBody.slice(0, img.position) + imageHtml + processedBody.slice(img.position);
  });

  const socialLinks = [
    { name: 'Facebook', url: companyInfo.social_facebook?.value, color: '#1877f2' },
    { name: 'Twitter', url: companyInfo.social_twitter?.value, color: '#1da1f2' },
    { name: 'Instagram', url: companyInfo.social_instagram?.value, color: '#e4405f' },
    { name: 'LinkedIn', url: companyInfo.social_linkedin?.value, color: '#0077b5' },
  ].filter(s => {
    // Validate URL format
    if (!s.url) return false;
    try {
      new URL(s.url);
      return true;
    } catch {
      return false;
    }
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 2rem; text-align: center; }
    .header img { height: 48px; margin-bottom: 0.75rem; }
    .header-text { color: #ffffff; font-size: 0.875rem; opacity: 0.9; }
    .content { padding: 2rem; }
    .greeting { color: #374151; margin-bottom: 1rem; }
    .body-text { color: #4b5563; line-height: 1.75; white-space: pre-wrap; }
    .footer { 
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      padding: 3rem 2rem 0;
      position: relative;
      overflow: hidden;
    }
    .footer::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 0;
      width: 100%;
      height: 60px;
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="%23ffffff"></path></svg>');
      background-size: cover;
      background-repeat: no-repeat;
    }
    .footer-content { position: relative; z-index: 1; padding-top: 2rem; }
    .footer-logo { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .footer-logo img { height: 32px; }
    .footer-title { font-weight: bold; font-size: 1.125rem; }
    .footer-text { text-align: center; margin-bottom: 1rem; opacity: 0.95; }
    .social-links { display: flex; gap: 1.5rem; justify-content: center; margin: 1.5rem 0; }
    .social-link { 
      color: #ffffff; 
      text-decoration: none; 
      background: rgba(255,255,255,0.2);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: background 0.3s;
    }
    .social-link:hover { background: rgba(255,255,255,0.3); }
    .disclaimer { 
      border-top: 1px solid rgba(255,255,255,0.3);
      padding-top: 1.5rem; 
      margin-top: 1.5rem; 
      font-size: 0.75rem; 
      opacity: 0.8;
      text-align: center;
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content, .footer { padding: 1.5rem !important; }
      .social-links { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://beepagro.com/img/logo.png" alt="BPI Logo" />
      <div class="header-text">Powering Palliative Through Technology</div>
    </div>

    <!-- Content -->
    <div class="content">
      <h2 style="color: #111827; font-size: 1.5rem; margin-bottom: 1.5rem;">${subject}</h2>
      <div class="greeting">Hello ${userName},</div>
      <div class="body-text">${processedBody}</div>
    </div>

    <!-- Footer with Green Wave -->
    <div class="footer">
      <div class="footer-content">
        <div class="footer-logo">
          <img src="https://beepagro.com/img/logo.png" alt="BPI" />
          <div class="footer-title">BeepAgro Palliative Initiative</div>
        </div>
        
        <p class="footer-text">Powering Palliative Through Technology</p>
        
        ${companyInfo.company_address?.value ? `<p class="footer-text">📍 ${companyInfo.company_address.value}</p>` : ''}
        ${companyInfo.company_phone?.value ? `<p class="footer-text">📞 ${companyInfo.company_phone.value}</p>` : ''}
        ${companyInfo.company_email?.value ? `<p class="footer-text">✉️ ${companyInfo.company_email.value}</p>` : ''}
        
        ${socialLinks.length > 0 ? `
          <div class="social-links">
            ${socialLinks.map(s => `<a href="${s.url}" class="social-link">${s.name}</a>`).join('')}
          </div>
        ` : ''}
        
        <div class="disclaimer">
          <p style="margin-bottom: 0.5rem;">You are receiving this email because you signed up on BeepAgro Palliative Initiative.</p>
          <p style="margin-bottom: 0.5rem;">If you no longer wish to receive these emails, you can <a href="https://beepagro.com/settings" style="color: #ffffff; text-decoration: underline;">unsubscribe here</a>.</p>
          <p style="margin-top: 1rem;">© ${new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
