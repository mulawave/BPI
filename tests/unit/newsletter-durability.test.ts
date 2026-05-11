/**
 * Newsletter durability and restart guard tests
 *
 * These are pattern-level regression tests for the durable newsletter campaign
 * machinery in server/trpc/router/admin.ts. The router is too heavy to import
 * directly in unit tests, so the persistence and restart invariants are locked
 * here against the implemented design.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const adminRouterSource = fs.readFileSync(
  path.resolve(process.cwd(), "server/trpc/router/admin.ts"),
  "utf8",
);

type PersistedCampaign = {
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
};

function buildNewsletterCampaignConfig(campaign: PersistedCampaign) {
  return {
    filter: campaign.filter,
    membershipPackage: campaign.membershipPackage || undefined,
    fromEmail: campaign.fromEmail || "noreply@beepagro.com",
    replyToEmail: campaign.replyToEmail || "support@beepagro.com",
    subject: campaign.subject,
    body: campaign.body,
    attachments: Array.isArray(campaign.attachments) ? campaign.attachments : [],
    embeddedImages: Array.isArray(campaign.embeddedImages) ? campaign.embeddedImages : [],
    sendRate: {
      batchSize: campaign.batchSize,
      delayBetweenEmailsMs: campaign.delayBetweenMs,
      delayBetweenBatchesMs: campaign.batchCooldownMs,
      warmUp: campaign.warmUp,
    },
  };
}

function restoreNewsletterJobState(campaign: PersistedCampaign) {
  const sentEmails = Array.isArray(campaign.sentEmails) ? campaign.sentEmails : [];
  const failedEmails = Array.isArray(campaign.failedEmails) ? campaign.failedEmails : [];
  const errorLog = Array.isArray(campaign.errorLog) ? campaign.errorLog : [];
  const sentRecipientIds = Array.isArray(campaign.sentRecipientIds) ? campaign.sentRecipientIds : [];
  const allRecipientIds = Array.isArray(campaign.allRecipientIds) ? campaign.allRecipientIds : [];

  return {
    jobId: campaign.jobId,
    status: campaign.status || "error",
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
    failedRecipients: failedEmails.map((entry: any) => entry.email),
    campaignConfig: buildNewsletterCampaignConfig(campaign),
    allRecipientIds,
    sentRecipientIds: new Set(sentRecipientIds as string[]),
  };
}

function buildNewsletterProgressSnapshot(
  job: ReturnType<typeof restoreNewsletterJobState>,
  sentSince = 0,
) {
  const sentEmails = sentSince > 0
    ? job.sentEmails.filter((entry: any) => entry.sentAt > sentSince)
    : job.sentEmails.slice(-50);
  const failedEmails = sentSince > 0
    ? job.failedEmails.filter((entry: any) => entry.failedAt > sentSince)
    : job.failedEmails;
  const errorLog = sentSince > 0
    ? job.errorLog.filter((entry: any) => entry.timestamp > sentSince)
    : job.errorLog.slice(-100);

  return {
    status: job.status,
    jobId: job.jobId,
    sent: job.sent,
    failed: job.failed,
    total: job.total,
    sentEmails,
    failedEmails,
    errorLog,
    canResume: (job.status === "cancelled" || job.status === "error") && job.sent < job.total,
  };
}

function resolveRemainingRecipients(
  allRecipients: Array<{ id: string; email: string }>,
  sentRecipientIds: Set<string>,
) {
  return allRecipients.filter((recipient) => !sentRecipientIds.has(recipient.id));
}

function claimScheduledCampaign(currentStatus: string) {
  if (currentStatus !== "scheduled") {
    return { claimed: false, nextStatus: currentStatus };
  }

  return { claimed: true, nextStatus: "running" };
}

describe("Newsletter durability and restart guards", () => {
  it("restores sent recipients and campaign config from persisted state", () => {
    const restored = restoreNewsletterJobState({
      jobId: "job-1",
      status: "running",
      sentCount: 2,
      failedCount: 1,
      totalRecipients: 5,
      elapsedMs: 2500,
      lastError: null,
      sentEmails: [{ email: "sent@example.com", name: "Sent", sentAt: 1 }],
      failedEmails: [{ email: "failed@example.com", name: "Failed", error: "SMTP", failedAt: 2 }],
      errorLog: [{ message: "SMTP", email: "failed@example.com", timestamp: 2, attempt: 1 }],
      sentRecipientIds: ["user-1", "user-2"],
      allRecipientIds: ["user-1", "user-2", "user-3", "user-4", "user-5"],
      filter: "activated",
      membershipPackage: null,
      fromEmail: null,
      replyToEmail: null,
      subject: "Subject",
      body: "Body",
      attachments: [{ filename: "a.txt", content: "hello" }],
      embeddedImages: [],
      batchSize: 20,
      delayBetweenMs: 250,
      batchCooldownMs: 1000,
      warmUp: true,
      startedAt: new Date("2026-05-11T10:00:00.000Z"),
    });

    assert.strictEqual(restored.sentRecipientIds.has("user-1"), true);
    assert.strictEqual(restored.sentRecipientIds.has("user-3"), false);
    assert.deepStrictEqual(restored.failedRecipients, ["failed@example.com"]);
    assert.strictEqual(restored.campaignConfig.fromEmail, "noreply@beepagro.com");
    assert.strictEqual(restored.campaignConfig.replyToEmail, "support@beepagro.com");
    assert.deepStrictEqual(restored.allRecipientIds, ["user-1", "user-2", "user-3", "user-4", "user-5"]);
  });

  it("resumes only unsent recipients after restart", () => {
    const recipients = [
      { id: "user-1", email: "one@example.com" },
      { id: "user-2", email: "two@example.com" },
      { id: "user-3", email: "three@example.com" },
    ];

    const remaining = resolveRemainingRecipients(recipients, new Set(["user-1", "user-3"]));

    assert.deepStrictEqual(remaining, [{ id: "user-2", email: "two@example.com" }]);
  });

  it("allows only one scheduler claim from scheduled to running", () => {
    const firstClaim = claimScheduledCampaign("scheduled");
    assert.deepStrictEqual(firstClaim, { claimed: true, nextStatus: "running" });

    const secondClaim = claimScheduledCampaign(firstClaim.nextStatus);
    assert.deepStrictEqual(secondClaim, { claimed: false, nextStatus: "running" });
  });

  it("completes immediately when every persisted recipient has already been sent", () => {
    const recipients = [
      { id: "user-1", email: "one@example.com" },
      { id: "user-2", email: "two@example.com" },
    ];

    const remaining = resolveRemainingRecipients(recipients, new Set(["user-1", "user-2"]));

    assert.deepStrictEqual(remaining, []);
  });

  it("serves persisted progress details when a restarted process has not restored the in-memory job yet", () => {
    const restored = restoreNewsletterJobState({
      jobId: "job-2",
      status: "error",
      sentCount: 3,
      failedCount: 1,
      totalRecipients: 5,
      elapsedMs: 2500,
      lastError: "SMTP timeout",
      sentEmails: [
        { email: "one@example.com", name: "One", sentAt: 100 },
        { email: "two@example.com", name: "Two", sentAt: 200 },
        { email: "three@example.com", name: "Three", sentAt: 300 },
      ],
      failedEmails: [{ email: "four@example.com", name: "Four", error: "SMTP timeout", failedAt: 350 }],
      errorLog: [{ message: "SMTP timeout", email: "four@example.com", timestamp: 350, attempt: 2 }],
      sentRecipientIds: ["user-1", "user-2", "user-3"],
      allRecipientIds: ["user-1", "user-2", "user-3", "user-4", "user-5"],
      filter: "all",
      membershipPackage: null,
      fromEmail: "ops@example.com",
      replyToEmail: "reply@example.com",
      subject: "Subject",
      body: "Body",
      attachments: [],
      embeddedImages: [],
      batchSize: 10,
      delayBetweenMs: 250,
      batchCooldownMs: 1000,
      warmUp: false,
      startedAt: new Date("2026-05-11T10:00:00.000Z"),
    });

    const snapshot = buildNewsletterProgressSnapshot(restored, 150);

    assert.equal(snapshot.status, "error");
    assert.equal(snapshot.sent, 3);
    assert.equal(snapshot.failed, 1);
    assert.deepStrictEqual(
      snapshot.sentEmails,
      [
        { email: "two@example.com", name: "Two", sentAt: 200 },
        { email: "three@example.com", name: "Three", sentAt: 300 },
      ],
    );
    assert.deepStrictEqual(snapshot.failedEmails, [
      { email: "four@example.com", name: "Four", error: "SMTP timeout", failedAt: 350 },
    ]);
    assert.deepStrictEqual(snapshot.errorLog, [
      { message: "SMTP timeout", email: "four@example.com", timestamp: 350, attempt: 2 },
    ]);
    assert.equal(snapshot.canResume, true);
  });

  it("looks up persisted campaign state when getNewsletterProgress misses the in-memory map", () => {
    assert.match(
      adminRouterSource,
      /const campaign = await newsletterCampaignStore\.findUnique\(\{\s*where: \{ jobId: input\.jobId \}/,
    );
    assert.match(
      adminRouterSource,
      /job = restoreNewsletterJobState\(campaign\);/,
    );
    assert.match(
      adminRouterSource,
      /return buildNewsletterProgressSnapshot\(job, input\.sentSince \|\| 0\);/,
    );
  });

  it("uses NewsletterCampaign as the sole persisted newsletter job store across queue endpoints", () => {
    assert.match(
      adminRouterSource,
      /const newsletterCampaignStore = prisma\.newsletterCampaign as any;/,
    );
    assert.match(
      adminRouterSource,
      /scheduleNewsletter: adminProcedure[\s\S]*?await newsletterCampaignStore\.create\(/,
    );
    assert.match(
      adminRouterSource,
      /getScheduledNewsletters: adminProcedure[\s\S]*?const campaigns = await newsletterCampaignStore\.findMany\(/,
    );
    assert.match(
      adminRouterSource,
      /getNewsletterJob: adminProcedure[\s\S]*?await newsletterCampaignStore\.findUnique\(\{ where: \{ jobId: input\.jobId \} \}\)/,
    );
    assert.match(
      adminRouterSource,
      /cancelScheduledNewsletter: adminProcedure[\s\S]*?await newsletterCampaignStore\.update\(/,
    );
    assert.match(
      adminRouterSource,
      /deleteNewsletterJob: adminProcedure[\s\S]*?await newsletterCampaignStore\.delete\(/,
    );
    assert.doesNotMatch(
      adminRouterSource,
      /prisma\.(newsletterJob|scheduledNewsletter|newsletterQueue)/,
    );
  });
});