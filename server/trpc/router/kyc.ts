import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

// ── Admin guard ─────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required." });
  }
  return next();
});

// ── Zod schemas ─────────────────────────────────────────────
const documentTypeEnum = z.enum(["national_id", "passport", "drivers_license", "voters_card"]);
const proofOfAddressTypeEnum = z.enum(["utility_bill", "bank_statement", "tax_document"]);
const kycStatusEnum = z.enum(["pending", "under_review", "approved", "rejected", "expired"]);

const submitKycSchema = z.object({
  legalFirstName: z.string().min(1).max(100),
  legalLastName: z.string().min(1).max(100),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  nationality: z.string().min(1).max(100),
  gender: z.string().optional(),
  residentialAddress: z.string().min(1).max(500),
  residentialCity: z.string().min(1).max(100),
  residentialState: z.string().min(1).max(100),
  residentialCountry: z.string().min(1).max(100),
  residentialZip: z.string().max(20).optional(),
  documentType: documentTypeEnum,
  documentNumber: z.string().min(1).max(50),
  documentFrontUrl: z.string().min(1, "Front of document is required"),
  documentBackUrl: z.string().min(1).optional(),
  documentExpiryDate: z.string().optional(),
  proofOfAddressUrl: z.string().min(1).optional(),
  proofOfAddressType: proofOfAddressTypeEnum.optional(),
  selfieUrl: z.string().min(1).optional(),
  livenessCheckPassed: z.boolean().default(false),
  bvn: z.string().length(11).optional(),
  nin: z.string().length(11).optional(),
});

// ── Router ──────────────────────────────────────────────────
export const kycRouter = createTRPCRouter({
  // ── User procedures ─────────────────────────────────────

  /** Get the current user's latest KYC status */
  getMyKycStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;

    const latest = await prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        expiresAt: true,
        documentType: true,
        documentExpiryDate: true,
      },
    });

    if (!latest) {
      return { status: "none" as const, submission: null };
    }

    // Check if approved but document has expired
    if (latest.status === "approved" && latest.expiresAt && new Date(latest.expiresAt) < new Date()) {
      // Mark as expired if not already
      await prisma.kycSubmission.update({
        where: { id: latest.id },
        data: { status: "expired" },
      });
      return { status: "expired" as const, submission: { ...latest, status: "expired" } };
    }

    return { status: latest.status as "pending" | "under_review" | "approved" | "rejected" | "expired", submission: latest };
  }),

  /** Get full submission details for the current user */
  getMySubmission: protectedProcedure.query(async ({ ctx }) => {
    const userId = (ctx.session!.user as any).id;

    return prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });
  }),

  /** Submit or resubmit KYC */
  submitKyc: protectedProcedure.input(submitKycSchema).mutation(async ({ ctx, input }) => {
    const userId = (ctx.session!.user as any).id;

    // Check if there's already a pending/under_review submission
    const existing = await prisma.kycSubmission.findFirst({
      where: { userId, status: { in: ["pending", "under_review"] } },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You already have a KYC submission being reviewed. Please wait for a response.",
      });
    }

    const expiryDate = input.documentExpiryDate ? new Date(input.documentExpiryDate) : null;

    const submission = await prisma.kycSubmission.create({
      data: {
        userId,
        legalFirstName: input.legalFirstName,
        legalLastName: input.legalLastName,
        dateOfBirth: new Date(input.dateOfBirth),
        nationality: input.nationality,
        gender: input.gender,
        residentialAddress: input.residentialAddress,
        residentialCity: input.residentialCity,
        residentialState: input.residentialState,
        residentialCountry: input.residentialCountry,
        residentialZip: input.residentialZip,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        documentFrontUrl: input.documentFrontUrl,
        documentBackUrl: input.documentBackUrl,
        documentExpiryDate: expiryDate,
        proofOfAddressUrl: input.proofOfAddressUrl,
        proofOfAddressType: input.proofOfAddressType,
        selfieUrl: input.selfieUrl,
        livenessCheckPassed: input.livenessCheckPassed,
        bvn: input.bvn,
        nin: input.nin,
        expiresAt: expiryDate,
        auditLogs: {
          create: {
            action: "submitted",
            performedBy: userId,
            performedByRole: "user",
            details: "KYC submission created",
          },
        },
      },
    });

    // Update user's kyc status field
    await prisma.user.update({
      where: { id: userId },
      data: { kyc: "pending", kycPending: 1 },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        title: "KYC Submitted",
        message: "Your KYC documents have been submitted for review. You will be notified once reviewed.",
        isRead: false,
      },
    });

    return submission;
  }),

  // ── Admin procedures ────────────────────────────────────

  /** List all KYC submissions with filters (admin) */
  listSubmissions: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: kycStatusEnum.optional(),
        search: z.string().optional(),
        sortBy: z.enum(["submittedAt", "status", "legalFirstName"]).default("submittedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { page, pageSize, status, search, sortBy, sortOrder } = input;

      const where: any = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { legalFirstName: { contains: search, mode: "insensitive" } },
          { legalLastName: { contains: search, mode: "insensitive" } },
          { documentNumber: { contains: search, mode: "insensitive" } },
          { bvn: { contains: search, mode: "insensitive" } },
          { nin: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const [submissions, total] = await Promise.all([
        prisma.kycSubmission.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                firstname: true,
                lastname: true,
                profilePic: true,
                activated: true,
                rank: true,
              },
            },
            reviewer: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.kycSubmission.count({ where }),
      ]);

      return {
        submissions,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /** Get stats for KYC dashboard (admin) */
  getStats: adminProcedure.query(async () => {
    const [pending, underReview, approved, rejected, expired, total] = await Promise.all([
      prisma.kycSubmission.count({ where: { status: "pending" } }),
      prisma.kycSubmission.count({ where: { status: "under_review" } }),
      prisma.kycSubmission.count({ where: { status: "approved" } }),
      prisma.kycSubmission.count({ where: { status: "rejected" } }),
      prisma.kycSubmission.count({ where: { status: "expired" } }),
      prisma.kycSubmission.count(),
    ]);

    return { pending, underReview, approved, rejected, expired, total };
  }),

  /** Get single submission detail (admin) */
  getSubmissionDetail: adminProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ input }) => {
      const submission = await prisma.kycSubmission.findUnique({
        where: { id: input.submissionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              firstname: true,
              lastname: true,
              mobile: true,
              profilePic: true,
              activated: true,
              rank: true,
              createdAt: true,
              kyc: true,
            },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      }

      return submission;
    }),

  /** Approve KYC submission (admin) */
  approveSubmission: adminProcedure
    .input(
      z.object({
        submissionId: z.string(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;

      const submission = await prisma.kycSubmission.findUnique({
        where: { id: input.submissionId },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      }

      if (submission.status === "approved") {
        throw new TRPCError({ code: "CONFLICT", message: "Submission is already approved." });
      }

      // Calculate expiry: use document expiry, or 1 year from now
      const expiresAt = submission.documentExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.kycSubmission.update({
          where: { id: input.submissionId },
          data: {
            status: "approved",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            adminNotes: input.adminNotes,
            expiresAt,
          },
        }),
        prisma.kycAuditLog.create({
          data: {
            submissionId: input.submissionId,
            action: "approved",
            performedBy: adminId,
            performedByRole: "admin",
            details: input.adminNotes || "KYC approved",
          },
        }),
        prisma.user.update({
          where: { id: submission.userId },
          data: { kyc: "approved", kycPending: 0, verified: true },
        }),
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: submission.userId,
            title: "KYC Approved",
            message: "Your identity verification has been approved. Your account is now fully verified.",
            isRead: false,
          },
        }),
      ]);

      return { success: true };
    }),

  /** Reject KYC submission (admin) */
  rejectSubmission: adminProcedure
    .input(
      z.object({
        submissionId: z.string(),
        rejectionReason: z.string().min(1, "A rejection reason is required."),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;

      const submission = await prisma.kycSubmission.findUnique({
        where: { id: input.submissionId },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found." });
      }

      if (submission.status === "approved") {
        throw new TRPCError({ code: "CONFLICT", message: "Cannot reject an approved submission." });
      }

      await prisma.$transaction([
        prisma.kycSubmission.update({
          where: { id: input.submissionId },
          data: {
            status: "rejected",
            reviewedBy: adminId,
            reviewedAt: new Date(),
            rejectionReason: input.rejectionReason,
            adminNotes: input.adminNotes,
          },
        }),
        prisma.kycAuditLog.create({
          data: {
            submissionId: input.submissionId,
            action: "rejected",
            performedBy: adminId,
            performedByRole: "admin",
            details: input.rejectionReason,
          },
        }),
        prisma.user.update({
          where: { id: submission.userId },
          data: { kyc: "rejected", kycPending: 0 },
        }),
        prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: submission.userId,
            title: "KYC Rejected",
            message: `Your identity verification was not approved. Reason: ${input.rejectionReason}. You may resubmit with corrected documents.`,
            isRead: false,
          },
        }),
      ]);

      return { success: true };
    }),

  /** Mark submission as under review (admin) */
  markUnderReview: adminProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;

      await prisma.$transaction([
        prisma.kycSubmission.update({
          where: { id: input.submissionId },
          data: { status: "under_review" },
        }),
        prisma.kycAuditLog.create({
          data: {
            submissionId: input.submissionId,
            action: "under_review",
            performedBy: adminId,
            performedByRole: "admin",
            details: "Submission marked for detailed review",
          },
        }),
      ]);

      return { success: true };
    }),

  /** Admin can manually mark any user as KYC verified (override) */
  adminVerifyUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        adminNotes: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;
      const expiresAt = input.expiresAt
        ? new Date(input.expiresAt)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      // Create an admin-override KYC submission
      const submission = await prisma.kycSubmission.create({
        data: {
          userId: input.userId,
          status: "approved",
          legalFirstName: "Admin Override",
          legalLastName: "Verification",
          dateOfBirth: new Date("1900-01-01"),
          nationality: "N/A",
          residentialAddress: "N/A",
          residentialCity: "N/A",
          residentialState: "N/A",
          residentialCountry: "N/A",
          documentType: "national_id",
          documentNumber: "ADMIN-OVERRIDE",
          documentFrontUrl: "",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: input.adminNotes || "Admin manual verification override",
          expiresAt,
          auditLogs: {
            create: {
              action: "approved",
              performedBy: adminId,
              performedByRole: "admin",
              details: `Admin manual verification: ${input.adminNotes || "No notes"}`,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: input.userId },
        data: { kyc: "approved", kycPending: 0, verified: true },
      });

      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: input.userId,
          title: "Account Verified",
          message: "Your account has been verified by an administrator.",
          isRead: false,
        },
      });

      return submission;
    }),

  /** Bulk approve submissions (admin) */
  bulkApprove: adminProcedure
    .input(z.object({ submissionIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;
      let approved = 0;

      for (const id of input.submissionIds) {
        const submission = await prisma.kycSubmission.findUnique({ where: { id } });
        if (!submission || submission.status === "approved") continue;

        const expiresAt = submission.documentExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.kycSubmission.update({
            where: { id },
            data: {
              status: "approved",
              reviewedBy: adminId,
              reviewedAt: new Date(),
              expiresAt,
            },
          }),
          prisma.kycAuditLog.create({
            data: {
              submissionId: id,
              action: "approved",
              performedBy: adminId,
              performedByRole: "admin",
              details: "Bulk approved",
            },
          }),
          prisma.user.update({
            where: { id: submission.userId },
            data: { kyc: "approved", kycPending: 0, verified: true },
          }),
          prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: submission.userId,
              title: "KYC Approved",
              message: "Your identity verification has been approved.",
              isRead: false,
            },
          }),
        ]);
        approved++;
      }

      return { approved };
    }),

  /** Bulk reject submissions (admin) */
  bulkReject: adminProcedure
    .input(
      z.object({
        submissionIds: z.array(z.string()).min(1),
        rejectionReason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminId = (ctx.session!.user as any).id;
      let rejected = 0;

      for (const id of input.submissionIds) {
        const submission = await prisma.kycSubmission.findUnique({ where: { id } });
        if (!submission || submission.status === "approved") continue;

        await prisma.$transaction([
          prisma.kycSubmission.update({
            where: { id },
            data: {
              status: "rejected",
              reviewedBy: adminId,
              reviewedAt: new Date(),
              rejectionReason: input.rejectionReason,
            },
          }),
          prisma.kycAuditLog.create({
            data: {
              submissionId: id,
              action: "rejected",
              performedBy: adminId,
              performedByRole: "admin",
              details: input.rejectionReason,
            },
          }),
          prisma.user.update({
            where: { id: submission.userId },
            data: { kyc: "rejected", kycPending: 0 },
          }),
          prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: submission.userId,
              title: "KYC Rejected",
              message: `Your identity verification was not approved. Reason: ${input.rejectionReason}`,
              isRead: false,
            },
          }),
        ]);
        rejected++;
      }

      return { rejected };
    }),
});
