/**
 * BPI TechQuiz Competition — tRPC Router
 *
 * Covers all spec sections:
 *  2  — Admin Event Manager (create, configure, publish, school assignment, lifecycle)
 *  3  — School Partnership & Verification (onboarding, school admin, dashboard, quota engine)
 *  4  — Parent Eligibility & Child Registration (eligibility check, beneficiary, consent)
 *  5  — Application Processing & Quota Engine (submit, payment, school verification)
 *  6  — CBT Engine Round 1 (access issuance, session, scoring, qualifier selection)
 *  7  — CBT Engine Round 2 + Onsite Scoring + Weighted Final Score + Final Ranking
 *  8  — Results & Ranking Engine (publication, dashboard, integrity)
 *  9  — Awards, BPI Benefits & Event Closure
 *  10 — Sponsorship Module (sponsor options, calculator, payment, admin dashboard)
 *  11 — Compliance & Safeguards (consent, RBAC, audit, data protection)
 *  12 — Notification Engine (embedded in procedures throughout)
 *  13 — Admin Reporting & Audit Dashboard (reports, CSV exports)
 *  15 — Multi-State & Expansion Framework
 *  16 — AdminSettings CMS Keys (seed / read)
 */

import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { sendNotification } from "@/server/services/notification.service";
import {
  TechQuizEventStatus,
  TechQuizSchoolStatus,
  TechQuizParticipationStatus,
  TechQuizChildStatus,
  TechQuizApplicationStatus,
  TechQuizPaymentStatus,
  TechQuizCBTRound,
  TechQuizCBTSessionStatus,
  TechQuizSponsorType,
  TechQuizAllocationPool,
  BlogPostStatus,
} from "@prisma/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertAdmin(session: any) {
  const role = session?.user?.role;
  if (!role || (role !== "admin" && role !== "superadmin")) {
    throw new Error("FORBIDDEN");
  }
}

function assertAuth(session: any) {
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
}

/** Load a numeric AdminSettings value with fallback */
async function loadNumericSetting(key: string, fallback: number): Promise<number> {
  const row = await prisma.adminSettings.findUnique({ where: { settingKey: key } });
  if (!row) return fallback;
  const v = parseFloat(row.settingValue ?? "");
  return isFinite(v) ? v : fallback;
}

/** Write a TechQuiz audit log entry */
async function audit(params: {
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.techQuizAuditLog.create({
    data: {
      id: randomUUID(),
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      eventId: params.eventId,
      metadata: params.metadata as any,
    },
  });
}

/** Notify all BPI admins */
async function notifyAdmins(title: string, message: string, link?: string) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "superadmin"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      sendNotification({
        userId: a.id,
        type: "TECHQUIZ_COMPLIANCE_FLAG",
        title,
        message,
        actionUrl: link ?? "/admin/techquiz",
      })
    )
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const techquizRouter = createTRPCRouter({

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — ADMIN EVENT MANAGER
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new TechQuiz event (admin only).
   * All scheduling, quotas, weights, and bracket config supplied here or later.
   */
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3),
        state: z.string().min(2),
        frequencyType: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]).optional(),
        applicationWindowStart: z.string().optional(),
        applicationWindowEnd: z.string().optional(),
        sponsorshipPackagePrice: z.number().positive().default(18000),
        topQualifiersPerSchool: z.number().int().min(1).default(4),
        cbtWeightPct: z.number().int().min(1).max(99).default(55),
        onsiteWeightPct: z.number().int().min(1).max(99).default(45),
        isZonalOrNational: z.boolean().default(false),
        zonalEventType: z.enum(["ZONAL", "NATIONAL"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      if (input.cbtWeightPct + input.onsiteWeightPct !== 100) {
        throw new Error("cbtWeightPct + onsiteWeightPct must equal 100");
      }
      const event = await prisma.techQuizEvent.create({
        data: {
          id: randomUUID(),
          title: input.title,
          state: input.state,
          status: TechQuizEventStatus.DRAFT,
          frequencyType: input.frequencyType,
          applicationWindowStart: input.applicationWindowStart
            ? new Date(input.applicationWindowStart)
            : null,
          applicationWindowEnd: input.applicationWindowEnd
            ? new Date(input.applicationWindowEnd)
            : null,
          sponsorshipPackagePrice: input.sponsorshipPackagePrice,
          topQualifiersPerSchool: input.topQualifiersPerSchool,
          cbtWeightPct: input.cbtWeightPct,
          onsiteWeightPct: input.onsiteWeightPct,
          isZonalOrNational: input.isZonalOrNational,
          zonalEventType: input.zonalEventType,
          createdBy: ctx.session!.user!.id,
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "CREATE_EVENT",
        entityType: "TechQuizEvent",
        entityId: event.id,
        eventId: event.id,
        metadata: { title: event.title, state: event.state },
      });
      return event;
    }),

  /** Update event configuration (admin only — only in DRAFT or APPROVED) */
  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string().min(3).optional(),
        state: z.string().optional(),
        frequencyType: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]).optional(),
        applicationWindowStart: z.string().optional(),
        applicationWindowEnd: z.string().optional(),
        sponsorshipPackagePrice: z.number().positive().optional(),
        topQualifiersPerSchool: z.number().int().min(1).optional(),
        cbtWeightPct: z.number().int().min(1).max(99).optional(),
        onsiteWeightPct: z.number().int().min(1).max(99).optional(),
        isZonalOrNational: z.boolean().optional(),
        zonalEventType: z.enum(["ZONAL", "NATIONAL"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const { eventId, ...fields } = input;
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: eventId } });
      if (!ev) throw new Error("Event not found");
      if (ev.status === TechQuizEventStatus.COMPLETED || ev.status === TechQuizEventStatus.ARCHIVED) {
        throw new Error("Cannot edit a completed or archived event");
      }
      // Validate weights if both provided
      const newCbt = fields.cbtWeightPct ?? ev.cbtWeightPct;
      const newOnsite = fields.onsiteWeightPct ?? ev.onsiteWeightPct;
      if (newCbt + newOnsite !== 100) throw new Error("cbtWeightPct + onsiteWeightPct must equal 100");

      const updated = await prisma.techQuizEvent.update({
        where: { id: eventId },
        data: {
          ...(fields.title !== undefined && { title: fields.title }),
          ...(fields.state !== undefined && { state: fields.state }),
          ...(fields.frequencyType !== undefined && { frequencyType: fields.frequencyType }),
          ...(fields.applicationWindowStart !== undefined && {
            applicationWindowStart: new Date(fields.applicationWindowStart),
          }),
          ...(fields.applicationWindowEnd !== undefined && {
            applicationWindowEnd: new Date(fields.applicationWindowEnd),
          }),
          ...(fields.sponsorshipPackagePrice !== undefined && {
            sponsorshipPackagePrice: fields.sponsorshipPackagePrice,
          }),
          ...(fields.topQualifiersPerSchool !== undefined && {
            topQualifiersPerSchool: fields.topQualifiersPerSchool,
          }),
          ...(fields.cbtWeightPct !== undefined && { cbtWeightPct: fields.cbtWeightPct }),
          ...(fields.onsiteWeightPct !== undefined && { onsiteWeightPct: fields.onsiteWeightPct }),
          ...(fields.isZonalOrNational !== undefined && { isZonalOrNational: fields.isZonalOrNational }),
          ...(fields.zonalEventType !== undefined && { zonalEventType: fields.zonalEventType }),
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "UPDATE_EVENT",
        entityType: "TechQuizEvent",
        entityId: eventId,
        eventId,
        metadata: fields as any,
      });
      return updated;
    }),

  /** Create or replace Round 1 schedule for an event */
  upsertRound1Schedule: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        venueDescription: z.string().optional(),
        cbtWindowStart: z.string().optional(),
        cbtWindowEnd: z.string().optional(),
        materialReleaseAt: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizRound1Schedule.create({
        data: {
          id: randomUUID(),
          eventId: input.eventId,
          venueDescription: input.venueDescription,
          cbtWindowStart: input.cbtWindowStart ? new Date(input.cbtWindowStart) : null,
          cbtWindowEnd: input.cbtWindowEnd ? new Date(input.cbtWindowEnd) : null,
          materialReleaseAt: input.materialReleaseAt ? new Date(input.materialReleaseAt) : null,
          notes: input.notes,
        },
      });
    }),

  /** Create Round 2 schedule for an event */
  upsertRound2Schedule: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        venueDescription: z.string().optional(),
        cbtWindowStart: z.string().optional(),
        cbtWindowEnd: z.string().optional(),
        onsiteDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizRound2Schedule.create({
        data: {
          id: randomUUID(),
          eventId: input.eventId,
          venueDescription: input.venueDescription,
          cbtWindowStart: input.cbtWindowStart ? new Date(input.cbtWindowStart) : null,
          cbtWindowEnd: input.cbtWindowEnd ? new Date(input.cbtWindowEnd) : null,
          onsiteDate: input.onsiteDate ? new Date(input.onsiteDate) : null,
          notes: input.notes,
        },
      });
    }),

  /** Create or replace award brackets for an event */
  upsertAwardBrackets: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        brackets: z.array(
          z.object({
            minRank: z.number().int().min(1),
            maxRank: z.number().int().min(1),
            bracketLabel: z.string(),
            awardDescription: z.string().optional(),
            bpiActivationGranted: z.boolean().default(true),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      // Delete existing brackets then recreate
      await prisma.techQuizAwardBracket.deleteMany({ where: { eventId: input.eventId } });
      const created = await Promise.all(
        input.brackets.map((b) =>
          prisma.techQuizAwardBracket.create({
            data: {
              id: randomUUID(),
              eventId: input.eventId,
              minRank: b.minRank,
              maxRank: b.maxRank,
              bracketLabel: b.bracketLabel,
              awardDescription: b.awardDescription,
              bpiActivationGranted: b.bpiActivationGranted,
            },
          })
        )
      );
      return created;
    }),

  /** Create or update the scoring rubric for an event */
  upsertScoringRubric: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        maxPresentation: z.number().int().min(1).default(40),
        maxLogicalReasoning: z.number().int().min(1).default(30),
        maxUseCase: z.number().int().min(1).default(30),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizScoringRubric.upsert({
        where: { eventId: input.eventId },
        create: {
          id: randomUUID(),
          eventId: input.eventId,
          maxPresentation: input.maxPresentation,
          maxLogicalReasoning: input.maxLogicalReasoning,
          maxUseCase: input.maxUseCase,
        },
        update: {
          maxPresentation: input.maxPresentation,
          maxLogicalReasoning: input.maxLogicalReasoning,
          maxUseCase: input.maxUseCase,
        },
      });
    }),

  /**
   * Assign an approved school to an event with quota settings.
   * Admin can assign individually or call this in bulk.
   */
  assignSchoolToEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        schoolId: z.string(),
        minStudents: z.number().int().min(1).default(10),
        maxStudents: z.number().int().min(1).default(12),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const school = await prisma.techQuizSchool.findUnique({ where: { id: input.schoolId } });
      if (!school || school.status !== TechQuizSchoolStatus.APPROVED) {
        throw new Error("School not found or not approved");
      }
      const existing = await prisma.techQuizEventSchool.findUnique({
        where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
      });
      if (existing) throw new Error("School already assigned to this event");
      return prisma.techQuizEventSchool.create({
        data: {
          id: randomUUID(),
          eventId: input.eventId,
          schoolId: input.schoolId,
          minStudents: input.minStudents,
          maxStudents: input.maxStudents,
          participationStatus: TechQuizParticipationStatus.APPROVED,
          enrolledCount: 0,
        },
      });
    }),

  /** Remove a school assignment from an event (before applications open) */
  removeSchoolFromEvent: protectedProcedure
    .input(z.object({ eventId: z.string(), schoolId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (ev?.status !== TechQuizEventStatus.DRAFT && ev?.status !== TechQuizEventStatus.APPROVED) {
        throw new Error("Can only remove school assignments from DRAFT or APPROVED events");
      }
      await prisma.techQuizEventSchool.delete({
        where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
      });
      return { success: true };
    }),

  /** Update school quota for an event */
  updateSchoolQuota: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        schoolId: z.string(),
        minStudents: z.number().int().min(1),
        maxStudents: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizEventSchool.update({
        where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
        data: { minStudents: input.minStudents, maxStudents: input.maxStudents },
      });
    }),

  /**
   * Transition event status through lifecycle: DRAFT → APPROVED → PUBLISHED → COMPLETED → ARCHIVED
   * Guards enforced for each transition.
   */
  updateEventStatus: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        status: z.enum(["APPROVED", "PUBLISHED", "COMPLETED", "ARCHIVED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        include: { eventSchools: true },
      });
      if (!ev) throw new Error("Event not found");

      // Guards
      if (input.status === "PUBLISHED") {
        if (ev.status !== TechQuizEventStatus.APPROVED)
          throw new Error("Event must be APPROVED before publishing");
        if (ev.eventSchools.length === 0)
          throw new Error("Cannot publish event without at least one assigned school");
      }
      if (input.status === "COMPLETED" && ev.status !== TechQuizEventStatus.PUBLISHED) {
        throw new Error("Event must be PUBLISHED before completing");
      }
      if (input.status === "ARCHIVED" && ev.status !== TechQuizEventStatus.COMPLETED) {
        throw new Error("Event must be COMPLETED before archiving");
      }

      const updated = await prisma.techQuizEvent.update({
        where: { id: input.eventId },
        data: {
          status: input.status as TechQuizEventStatus,
          ...(input.status === "PUBLISHED" && { publishedAt: new Date() }),
          ...(input.status === "COMPLETED" && { completedAt: new Date() }),
        },
      });

      // On PUBLISHED — broadcast notification to all BPI members (all or state-filtered)
      if (input.status === "PUBLISHED") {
        const members = await prisma.user.findMany({
          where: { activated: true },
          select: { id: true },
        });
        await Promise.all(
          members.map((m) =>
            sendNotification({
              userId: m.id,
              type: "TECHQUIZ_EVENT_PUBLISHED",
              title: "BPI TechQuiz Event Published",
              message: `A new TechQuiz Competition event has been published for ${ev.state}. Apply now for your child!`,
              actionUrl: "/techquiz",
            })
          )
        );
        await audit({
          actorId: ctx.session!.user!.id,
          actorRole: ctx.session!.user!.role as string,
          action: "PUBLISH_EVENT",
          entityType: "TechQuizEvent",
          entityId: input.eventId,
          eventId: input.eventId,
        });
      }

      return updated;
    }),

  /** Paginated list of events with filters */
  adminListEvents: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        state: z.string().optional(),
        status: z.enum(["DRAFT", "APPROVED", "PUBLISHED", "COMPLETED", "ARCHIVED"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const skip = (input.page - 1) * input.perPage;
      const where: any = {};
      if (input.state) where.state = input.state;
      if (input.status) where.status = input.status;
      const [events, total] = await Promise.all([
        prisma.techQuizEvent.findMany({
          where,
          skip,
          take: input.perPage,
          orderBy: { createdAt: "desc" },
          include: {
            eventSchools: { include: { school: true } },
            round1Schedules: true,
            round2Schedules: true,
            awardBrackets: true,
            scoringRubric: true,
            _count: { select: { applications: true, sponsorshipPackages: true } },
          },
        }),
        prisma.techQuizEvent.count({ where }),
      ]);
      return { events, total, page: input.page, perPage: input.perPage };
    }),

  /** Get a single event with all relations */
  getEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      return prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        include: {
          eventSchools: { include: { school: true } },
          round1Schedules: true,
          round2Schedules: true,
          awardBrackets: true,
          scoringRubric: true,
          _count: { select: { applications: true } },
        },
      });
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — SCHOOL PARTNERSHIP & VERIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  /** Create a new school (admin only) */
  createSchool: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        state: z.string().min(2),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const school = await prisma.techQuizSchool.create({
        data: {
          id: randomUUID(),
          name: input.name,
          state: input.state,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          status: TechQuizSchoolStatus.PENDING,
          mouSigned: false,
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "CREATE_SCHOOL",
        entityType: "TechQuizSchool",
        entityId: school.id,
        metadata: { name: school.name, state: school.state },
      });
      return school;
    }),

  /** Approve a school (admin only) */
  approveSchool: protectedProcedure
    .input(z.object({ schoolId: z.string(), mouSigned: z.boolean().default(false) }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const school = await prisma.techQuizSchool.update({
        where: { id: input.schoolId },
        data: {
          status: TechQuizSchoolStatus.APPROVED,
          mouSigned: input.mouSigned,
          mouSignedAt: input.mouSigned ? new Date() : undefined,
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "APPROVE_SCHOOL",
        entityType: "TechQuizSchool",
        entityId: school.id,
      });
      return school;
    }),

  /** Suspend a school (admin only) */
  suspendSchool: protectedProcedure
    .input(z.object({ schoolId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const school = await prisma.techQuizSchool.update({
        where: { id: input.schoolId },
        data: { status: TechQuizSchoolStatus.SUSPENDED },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "SUSPEND_SCHOOL",
        entityType: "TechQuizSchool",
        entityId: school.id,
      });
      return school;
    }),

  /** Update MoU signed status (admin only) */
  updateSchoolMoU: protectedProcedure
    .input(z.object({ schoolId: z.string(), mouSigned: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizSchool.update({
        where: { id: input.schoolId },
        data: {
          mouSigned: input.mouSigned,
          mouSignedAt: input.mouSigned ? new Date() : null,
        },
      });
    }),

  /** List schools with filters (admin) */
  adminListSchools: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        state: z.string().optional(),
        status: z.enum(["PENDING", "APPROVED", "SUSPENDED"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const skip = (input.page - 1) * input.perPage;
      const where: any = {};
      if (input.state) where.state = input.state;
      if (input.status) where.status = input.status;
      const [schools, total] = await Promise.all([
        prisma.techQuizSchool.findMany({
          where,
          skip,
          take: input.perPage,
          orderBy: { createdAt: "desc" },
          include: {
            adminProfiles: { include: { user: { select: { id: true, name: true, email: true } } } },
            _count: { select: { applications: true } },
          },
        }),
        prisma.techQuizSchool.count({ where }),
      ]);
      return { schools, total, page: input.page, perPage: input.perPage };
    }),

  /** Create school admin profile (admin only) */
  createSchoolAdminProfile: protectedProcedure
    .input(z.object({ userId: z.string(), schoolId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const existing = await prisma.schoolAdminProfile.findUnique({ where: { userId: input.userId } });
      if (existing) throw new Error("This user already has a school admin profile");
      const profile = await prisma.schoolAdminProfile.create({
        data: {
          id: randomUUID(),
          userId: input.userId,
          schoolId: input.schoolId,
          isActive: true,
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "CREATE_SCHOOL_ADMIN",
        entityType: "SchoolAdminProfile",
        entityId: profile.id,
        metadata: { userId: input.userId, schoolId: input.schoolId },
      });
      return profile;
    }),

  /** Get the caller's school admin profile + linked school */
  getSchoolAdminProfile: protectedProcedure.query(async ({ ctx }) => {
    assertAuth(ctx.session);
    const profile = await prisma.schoolAdminProfile.findUnique({
      where: { userId: ctx.session!.user!.id },
      include: {
        school: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return profile;
  }),

  /**
   * School admin dashboard — list candidates registered for a specific event.
   * Only accessible to the school admin of that school.
   */
  schoolDashboardApplications: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const profile = await prisma.schoolAdminProfile.findUnique({
        where: { userId: ctx.session!.user!.id },
      });
      if (!profile) throw new Error("No school admin profile found");
      const skip = (input.page - 1) * input.perPage;
      const [applications, total] = await Promise.all([
        prisma.techQuizApplication.findMany({
          where: { schoolId: profile.schoolId, eventId: input.eventId },
          skip,
          take: input.perPage,
          orderBy: { appliedAt: "desc" },
          include: { childBeneficiary: true, parent: { select: { id: true, name: true, email: true } } },
        }),
        prisma.techQuizApplication.count({
          where: { schoolId: profile.schoolId, eventId: input.eventId },
        }),
      ]);
      const eventSchool = await prisma.techQuizEventSchool.findUnique({
        where: { eventId_schoolId: { eventId: input.eventId, schoolId: profile.schoolId } },
      });
      return { applications, total, page: input.page, perPage: input.perPage, quotaInfo: eventSchool };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — PARENT ELIGIBILITY & CHILD REGISTRATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if the calling parent is eligible to register a child.
   * Requires ≥ Regular BPI membership (activated = true & valid membership package).
   */
  checkParentEligibility: protectedProcedure.query(async ({ ctx }) => {
    assertAuth(ctx.session);
    const userId = ctx.session!.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activated: true, activeMembershipPackageId: true, membershipExpiresAt: true },
    });
    if (!user) throw new Error("User not found");
    const requiredTier = await loadNumericSetting("techquiz_required_membership_tier", 0);
    // Basic check: user must be activated with an active membership
    const isEligible =
      user.activated &&
      !!user.activeMembershipPackageId &&
      (!user.membershipExpiresAt || new Date() < user.membershipExpiresAt);
    return {
      isEligible,
      reason: isEligible ? null : "You must have an active Regular BPI membership to apply for TechQuiz",
      activated: user.activated,
      hasMembership: !!user.activeMembershipPackageId,
    };
  }),

  /**
   * Create a child beneficiary record (parent only).
   * Parental consent checkbox is mandatory — creates a TechQuizConsentLog entry.
   */
  createChildBeneficiary: protectedProcedure
    .input(
      z.object({
        childName: z.string().min(2),
        dateOfBirth: z.string().optional(),
        email: z.string().email().optional(),
        schoolId: z.string().optional(),
        state: z.string().optional(),
        parentalConsentGiven: z.literal(true, {
          errorMap: () => ({ message: "Parental consent is mandatory" }),
        }),
        consentVersion: z.string().default("1.0"),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const parentId = ctx.session!.user!.id;

      // Eligibility check
      const user = await prisma.user.findUnique({
        where: { id: parentId },
        select: { activated: true, activeMembershipPackageId: true, membershipExpiresAt: true },
      });
      if (
        !user?.activated ||
        !user.activeMembershipPackageId ||
        (user.membershipExpiresAt && new Date() >= user.membershipExpiresAt)
      ) {
        throw new Error("You must have an active BPI membership to register a child");
      }

      const child = await prisma.techQuizChildBeneficiary.create({
        data: {
          id: randomUUID(),
          parentUserId: parentId,
          childName: input.childName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          email: input.email,
          schoolId: input.schoolId,
          state: input.state,
          parentalConsentGiven: true,
          parentalConsentAt: new Date(),
          status: TechQuizChildStatus.INACTIVE,
        },
      });

      // Log consent
      await prisma.techQuizConsentLog.create({
        data: {
          id: randomUUID(),
          parentUserId: parentId,
          childBeneficiaryId: child.id,
          consentVersion: input.consentVersion,
          consentGivenAt: new Date(),
          ipAddress: input.ipAddress,
        },
      });

      await audit({
        actorId: parentId,
        actorRole: "user",
        action: "CREATE_CHILD_BENEFICIARY",
        entityType: "TechQuizChildBeneficiary",
        entityId: child.id,
        metadata: { childName: child.childName },
      });

      return child;
    }),

  /** Update child beneficiary details (parent only, before verification) */
  updateChildBeneficiary: protectedProcedure
    .input(
      z.object({
        childId: z.string(),
        childName: z.string().min(2).optional(),
        dateOfBirth: z.string().optional(),
        email: z.string().email().optional(),
        schoolId: z.string().optional(),
        state: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const parentId = ctx.session!.user!.id;
      const child = await prisma.techQuizChildBeneficiary.findUnique({ where: { id: input.childId } });
      if (!child || child.parentUserId !== parentId) throw new Error("Child not found or access denied");
      if (child.status === TechQuizChildStatus.ACTIVE) throw new Error("Cannot edit a verified active child profile");
      return prisma.techQuizChildBeneficiary.update({
        where: { id: input.childId },
        data: {
          ...(input.childName && { childName: input.childName }),
          ...(input.dateOfBirth && { dateOfBirth: new Date(input.dateOfBirth) }),
          ...(input.email && { email: input.email }),
          ...(input.schoolId !== undefined && { schoolId: input.schoolId }),
          ...(input.state !== undefined && { state: input.state }),
        },
      });
    }),

  /** List the calling parent's child beneficiaries */
  myChildBeneficiaries: protectedProcedure.query(async ({ ctx }) => {
    assertAuth(ctx.session);
    return prisma.techQuizChildBeneficiary.findMany({
      where: { parentUserId: ctx.session!.user!.id },
      include: { applications: { include: { event: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — APPLICATION PROCESSING & QUOTA ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Submit a TechQuiz application for a child.
   * Validates:
   *  - Parent eligibility (membership)
   *  - Published event exists
   *  - School is in the approved list for the event
   *  - Quota available
   *  - Payment status (caller must have paid — paymentReference required)
   *  - No duplicate application for same child+event
   */
  applyForTechQuiz: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        childBeneficiaryId: z.string(),
        schoolId: z.string(),
        paymentReference: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const parentId = ctx.session!.user!.id;

      // 1. Parent eligibility
      const user = await prisma.user.findUnique({
        where: { id: parentId },
        select: { activated: true, activeMembershipPackageId: true, membershipExpiresAt: true },
      });
      if (!user?.activated || !user.activeMembershipPackageId) {
        throw new Error("Active BPI membership required to apply");
      }

      // 2. Child belongs to parent
      const child = await prisma.techQuizChildBeneficiary.findUnique({
        where: { id: input.childBeneficiaryId },
      });
      if (!child || child.parentUserId !== parentId) {
        throw new Error("Child not found or not owned by this parent");
      }

      // 3. Event is published
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev || ev.status !== TechQuizEventStatus.PUBLISHED) {
        throw new Error("Event not found or not published");
      }

      // 4. Application deadline check
      if (ev.applicationWindowEnd && new Date() > ev.applicationWindowEnd) {
        throw new Error("Application window has closed for this event");
      }

      // 5. School is approved for this event
      const eventSchool = await prisma.techQuizEventSchool.findUnique({
        where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
      });
      if (!eventSchool || eventSchool.participationStatus === TechQuizParticipationStatus.NOT_ELIGIBLE) {
        throw new Error("Selected school is not approved for this event");
      }

      // 6. Quota check — SLOT_RESERVED + VERIFIED count vs maxStudents
      if (eventSchool.participationStatus === TechQuizParticipationStatus.CLOSED) {
        throw new Error("School quota reached for this event");
      }
      const currentCount = await prisma.techQuizApplication.count({
        where: {
          eventId: input.eventId,
          schoolId: input.schoolId,
          status: { in: [TechQuizApplicationStatus.SLOT_RESERVED, TechQuizApplicationStatus.VERIFIED] },
        },
      });
      if (currentCount >= eventSchool.maxStudents) {
        // Mark quota full
        await prisma.techQuizEventSchool.update({
          where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
          data: { participationStatus: TechQuizParticipationStatus.CLOSED },
        });
        await notifyAdmins(
          "TechQuiz School Quota Full",
          `School "${input.schoolId}" has reached max quota (${eventSchool.maxStudents}) for event "${ev.title}".`,
          `/admin/techquiz/${input.eventId}`
        );
        throw new Error("School quota reached for this event");
      }

      // 7. Duplicate application guard
      const dup = await prisma.techQuizApplication.findUnique({
        where: {
          childBeneficiaryId_eventId: {
            childBeneficiaryId: input.childBeneficiaryId,
            eventId: input.eventId,
          },
        },
      });
      if (dup) throw new Error("An application for this child and event already exists");

      // 8. Create application + child profile, update beneficiary status
      const [application] = await prisma.$transaction(async (tx) => {
        const app = await tx.techQuizApplication.create({
          data: {
            id: randomUUID(),
            parentUserId: parentId,
            childBeneficiaryId: input.childBeneficiaryId,
            eventId: input.eventId,
            schoolId: input.schoolId,
            state: ev.state,
            paymentReference: input.paymentReference,
            paymentStatus: TechQuizPaymentStatus.PAID,
            status: TechQuizApplicationStatus.SLOT_RESERVED,
          },
        });

        // Create child TechQuiz profile
        await tx.techQuizChildProfile.create({
          data: {
            id: randomUUID(),
            childBeneficiaryId: input.childBeneficiaryId,
            state: ev.state,
            schoolId: input.schoolId,
          },
        });

        // Update child beneficiary status
        await tx.techQuizChildBeneficiary.update({
          where: { id: input.childBeneficiaryId },
          data: { status: TechQuizChildStatus.TECH_QUIZ_ENABLED },
        });

        // Increment enrolled count
        await tx.techQuizEventSchool.update({
          where: { eventId_schoolId: { eventId: input.eventId, schoolId: input.schoolId } },
          data: { enrolledCount: { increment: 1 } },
        });

        // Initialize result record
        await tx.techQuizResult.create({
          data: {
            id: randomUUID(),
            applicationId: app.id,
            childBeneficiaryId: input.childBeneficiaryId,
            eventId: input.eventId,
          },
        });

        return [app];
      });

      // Notifications
      await sendNotification({
        userId: parentId,
        type: "TECHQUIZ_APPLICATION_SUBMITTED",
        title: "TechQuiz Application Submitted",
        message: `Application submitted for ${child.childName}. Awaiting school verification.`,
        actionUrl: "/techquiz",
      });
      await sendNotification({
        userId: parentId,
        type: "TECHQUIZ_APPLICATION_SLOT_RESERVED",
        title: "Slot Reserved",
        message: `A slot has been reserved for ${child.childName} at the selected school. School will now verify eligibility.`,
        actionUrl: "/techquiz",
      });

      await audit({
        actorId: parentId,
        actorRole: "user",
        action: "APPLY_FOR_TECHQUIZ",
        entityType: "TechQuizApplication",
        entityId: application.id,
        eventId: input.eventId,
        metadata: { childName: child.childName, schoolId: input.schoolId },
      });

      return application;
    }),

  /**
   * School admin verifies or rejects a candidate application.
   * On approve: updates application status to VERIFIED.
   * On reject: releases soft-locked slot, notifies parent.
   * Quota engine recalculates participation status after each decision.
   */
  verifyCandidate: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        decision: z.enum(["APPROVE", "REJECT"]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);

      // Must be school admin
      const profile = await prisma.schoolAdminProfile.findUnique({
        where: { userId: ctx.session!.user!.id },
      });
      if (!profile) throw new Error("Only school admins can verify candidates");

      const application = await prisma.techQuizApplication.findUnique({
        where: { id: input.applicationId },
        include: { childBeneficiary: true, event: true },
      });
      if (!application) throw new Error("Application not found");
      if (application.schoolId !== profile.schoolId) throw new Error("Not your school's application");
      if (application.status !== TechQuizApplicationStatus.SLOT_RESERVED) {
        throw new Error("Application is not in SLOT_RESERVED status");
      }

      const eventSchool = await prisma.techQuizEventSchool.findUnique({
        where: { eventId_schoolId: { eventId: application.eventId, schoolId: profile.schoolId } },
      });
      if (!eventSchool) throw new Error("School not assigned to this event");

      if (input.decision === "APPROVE") {
        await prisma.techQuizApplication.update({
          where: { id: input.applicationId },
          data: {
            status: TechQuizApplicationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: ctx.session!.user!.id,
          },
        });

        // Check if min_students reached → ELIGIBLE
        const verifiedCount = await prisma.techQuizApplication.count({
          where: {
            eventId: application.eventId,
            schoolId: profile.schoolId,
            status: TechQuizApplicationStatus.VERIFIED,
          },
        });
        if (
          eventSchool.participationStatus !== TechQuizParticipationStatus.ELIGIBLE &&
          verifiedCount >= eventSchool.minStudents
        ) {
          await prisma.techQuizEventSchool.update({
            where: { eventId_schoolId: { eventId: application.eventId, schoolId: profile.schoolId } },
            data: { participationStatus: TechQuizParticipationStatus.ELIGIBLE },
          });
        }
        // If maxStudents reached → CLOSED
        if (verifiedCount >= eventSchool.maxStudents) {
          await prisma.techQuizEventSchool.update({
            where: { eventId_schoolId: { eventId: application.eventId, schoolId: profile.schoolId } },
            data: { participationStatus: TechQuizParticipationStatus.CLOSED },
          });
          await notifyAdmins(
            "School Quota Full",
            `School has reached max students (${eventSchool.maxStudents}) for event "${application.event.title}".`,
            `/admin/techquiz/${application.eventId}`
          );
        }

        await sendNotification({
          userId: application.parentUserId,
          type: "TECHQUIZ_APPLICATION_VERIFIED",
          title: "Application Verified",
          message: `${application.childBeneficiary.childName}'s application has been verified by the school. Your child is confirmed for TechQuiz Round 1!`,
          actionUrl: "/techquiz",
        });
      } else {
        // Reject — release slot
        await prisma.techQuizApplication.update({
          where: { id: input.applicationId },
          data: {
            status: TechQuizApplicationStatus.REJECTED,
            rejectionReason: input.rejectionReason,
          },
        });
        // Decrement enrolled count
        await prisma.techQuizEventSchool.update({
          where: { eventId_schoolId: { eventId: application.eventId, schoolId: profile.schoolId } },
          data: { enrolledCount: { decrement: 1 } },
        });

        await sendNotification({
          userId: application.parentUserId,
          type: "TECHQUIZ_APPLICATION_REJECTED",
          title: "Application Rejected",
          message: `${application.childBeneficiary.childName}'s application was rejected by the school${
            input.rejectionReason ? `: ${input.rejectionReason}` : "."
          }`,
          actionUrl: "/techquiz",
        });
      }

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: "school_admin",
        action: input.decision === "APPROVE" ? "VERIFY_CANDIDATE" : "REJECT_CANDIDATE",
        entityType: "TechQuizApplication",
        entityId: input.applicationId,
        eventId: application.eventId,
        metadata: { decision: input.decision, reason: input.rejectionReason },
      });

      return { success: true };
    }),

  /**
   * Admin: list applications for an event with filters.
   */
  adminListApplications: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        status: z.enum([
          "APPLIED", "SLOT_RESERVED", "VERIFIED", "REJECTED",
          "ROUND1_ELIGIBLE", "QUALIFIER", "ROUND2_ELIGIBLE",
        ]).optional(),
        schoolId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const skip = (input.page - 1) * input.perPage;
      const where: any = { eventId: input.eventId };
      if (input.status) where.status = input.status;
      if (input.schoolId) where.schoolId = input.schoolId;
      const [applications, total] = await Promise.all([
        prisma.techQuizApplication.findMany({
          where,
          skip,
          take: input.perPage,
          orderBy: { appliedAt: "desc" },
          include: {
            childBeneficiary: true,
            parent: { select: { id: true, name: true, email: true } },
            school: { select: { id: true, name: true, state: true } },
            result: true,
          },
        }),
        prisma.techQuizApplication.count({ where }),
      ]);
      return { applications, total, page: input.page, perPage: input.perPage };
    }),

  /**
   * Admin: check if school minimum has been reached; if not, send alert.
   */
  checkSchoolMinimumStatus: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new Error("Event not found");
      const eventSchools = await prisma.techQuizEventSchool.findMany({
        where: { eventId: input.eventId },
        include: { school: true },
      });
      const notReached = [];
      for (const es of eventSchools) {
        const verified = await prisma.techQuizApplication.count({
          where: {
            eventId: input.eventId,
            schoolId: es.schoolId,
            status: TechQuizApplicationStatus.VERIFIED,
          },
        });
        if (verified < es.minStudents) {
          notReached.push({ school: es.school.name, verified, required: es.minStudents });
        }
      }
      if (notReached.length > 0) {
        await notifyAdmins(
          "TechQuiz Minimum Not Reached",
          `${notReached.length} school(s) have not reached minimum students for event "${ev.title}".`,
          `/admin/techquiz/${input.eventId}`
        );
      }
      return { notReached };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — CBT ENGINE ROUND 1 (INTRA-SCHOOL)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Issue Round 1 CBT access to all VERIFIED applications where school is ELIGIBLE.
   * Sets application status → ROUND1_ELIGIBLE and sends notifications.
   */
  issueCBTAccess: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        include: { round1Schedules: true },
      });
      if (!ev) throw new Error("Event not found");

      // Find schools that are ELIGIBLE
      const eligibleSchools = await prisma.techQuizEventSchool.findMany({
        where: { eventId: input.eventId, participationStatus: TechQuizParticipationStatus.ELIGIBLE },
        select: { schoolId: true },
      });
      const eligibleSchoolIds = eligibleSchools.map((s) => s.schoolId);

      // Get all VERIFIED applications for eligible schools
      const apps = await prisma.techQuizApplication.findMany({
        where: {
          eventId: input.eventId,
          schoolId: { in: eligibleSchoolIds },
          status: TechQuizApplicationStatus.VERIFIED,
        },
        include: { childBeneficiary: true },
      });

      let issued = 0;
      for (const app of apps) {
        await prisma.techQuizApplication.update({
          where: { id: app.id },
          data: { status: TechQuizApplicationStatus.ROUND1_ELIGIBLE },
        });
        const schedule = ev.round1Schedules[0];
        const venue = schedule?.venueDescription ?? "TBD";
        const windowStart = schedule?.cbtWindowStart?.toLocaleDateString() ?? "TBD";
        const windowEnd = schedule?.cbtWindowEnd?.toLocaleDateString() ?? "TBD";
        await sendNotification({
          userId: app.parentUserId,
          type: "TECHQUIZ_CBT_ACCESS_ISSUED",
          title: "Round 1 CBT Access Issued",
          message: `${app.childBeneficiary.childName} is eligible for TechQuiz Round 1 CBT. Venue: ${venue}. Window: ${windowStart} – ${windowEnd}.`,
          actionUrl: "/techquiz/cbt",
        });
        issued++;
      }

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "ISSUE_CBT_ACCESS_ROUND1",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { issued },
      });

      return { issued };
    }),

  /**
   * Start a Round 1 CBT session for a child.
   * Validates: ROUND1_ELIGIBLE + within CBT window + school ELIGIBLE.
   * Creates TechQuizCBTSession with IN_PROGRESS status.
   */
  startCBTSession: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        round: z.enum(["ROUND1", "ROUND2"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const parentId = ctx.session!.user!.id;

      const app = await prisma.techQuizApplication.findUnique({
        where: { id: input.applicationId },
        include: { event: { include: { round1Schedules: true, round2Schedules: true } } },
      });
      if (!app) throw new Error("Application not found");
      if (app.parentUserId !== parentId) throw new Error("Access denied");

      // Status gate
      const requiredStatus =
        input.round === "ROUND1"
          ? TechQuizApplicationStatus.ROUND1_ELIGIBLE
          : TechQuizApplicationStatus.ROUND2_ELIGIBLE;
      if (app.status !== requiredStatus) {
        throw new Error(`Application must be ${requiredStatus} to start this CBT round`);
      }

      // CBT window gate
      const schedules =
        input.round === "ROUND1" ? app.event.round1Schedules : app.event.round2Schedules;
      const now = new Date();
      const inWindow = schedules.some(
        (s: any) =>
          (!s.cbtWindowStart || now >= new Date(s.cbtWindowStart)) &&
          (!s.cbtWindowEnd || now <= new Date(s.cbtWindowEnd))
      );
      if (!inWindow) throw new Error("CBT window is not currently open");

      // Duplicate session guard
      const existing = await prisma.techQuizCBTSession.findUnique({
        where: { applicationId_round: { applicationId: input.applicationId, round: input.round as TechQuizCBTRound } },
      });
      if (existing && existing.status !== TechQuizCBTSessionStatus.NOT_STARTED) {
        throw new Error("A CBT session already exists for this round");
      }

      const session = await prisma.techQuizCBTSession.upsert({
        where: { applicationId_round: { applicationId: input.applicationId, round: input.round as TechQuizCBTRound } },
        create: {
          id: randomUUID(),
          applicationId: input.applicationId,
          eventId: app.eventId,
          round: input.round as TechQuizCBTRound,
          startedAt: new Date(),
          status: TechQuizCBTSessionStatus.IN_PROGRESS,
        },
        update: {
          startedAt: new Date(),
          status: TechQuizCBTSessionStatus.IN_PROGRESS,
        },
      });

      return session;
    }),

  /**
   * Submit a CBT session (child submits answers).
   * Score is provided directly (CBT portal scores externally; or can be computed here).
   */
  submitCBTSession: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        round: z.enum(["ROUND1", "ROUND2"]),
        score: z.number().min(0),
        totalQuestions: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const parentId = ctx.session!.user!.id;
      const app = await prisma.techQuizApplication.findUnique({ where: { id: input.applicationId } });
      if (!app || app.parentUserId !== parentId) throw new Error("Access denied");

      const cbtSession = await prisma.techQuizCBTSession.findUnique({
        where: { applicationId_round: { applicationId: input.applicationId, round: input.round as TechQuizCBTRound } },
      });
      if (!cbtSession || cbtSession.status !== TechQuizCBTSessionStatus.IN_PROGRESS) {
        throw new Error("No active CBT session found for this round");
      }

      const updated = await prisma.techQuizCBTSession.update({
        where: { applicationId_round: { applicationId: input.applicationId, round: input.round as TechQuizCBTRound } },
        data: {
          score: input.score,
          totalQuestions: input.totalQuestions,
          submittedAt: new Date(),
          status: TechQuizCBTSessionStatus.SUBMITTED,
        },
      });

      // Auto-score immediately
      await prisma.techQuizCBTSession.update({
        where: { applicationId_round: { applicationId: input.applicationId, round: input.round as TechQuizCBTRound } },
        data: { status: TechQuizCBTSessionStatus.SCORED },
      });

      // Update result record
      if (input.round === "ROUND1") {
        await prisma.techQuizResult.update({
          where: { applicationId: input.applicationId },
          data: { round1Score: input.score },
        });
      } else {
        await prisma.techQuizResult.update({
          where: { applicationId: input.applicationId },
          data: { round2CbtScore: input.score },
        });
      }

      return updated;
    }),

  /**
   * Admin: auto-submit all IN_PROGRESS sessions that are past the CBT window end.
   * Sets status = SUBMITTED, marks score as 0 if no score recorded.
   */
  autoSubmitExpiredSessions: protectedProcedure
    .input(z.object({ eventId: z.string(), round: z.enum(["ROUND1", "ROUND2"]) }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        include: { round1Schedules: true, round2Schedules: true },
      });
      if (!ev) throw new Error("Event not found");
      const schedules = input.round === "ROUND1" ? ev.round1Schedules : ev.round2Schedules;
      const maxEnd = schedules.reduce((m: Date | null, s: any) => {
        if (!s.cbtWindowEnd) return m;
        return !m || new Date(s.cbtWindowEnd) > m ? new Date(s.cbtWindowEnd) : m;
      }, null);
      if (!maxEnd || new Date() <= maxEnd) throw new Error("CBT window is still open");

      const expired = await prisma.techQuizCBTSession.findMany({
        where: {
          eventId: input.eventId,
          round: input.round as TechQuizCBTRound,
          status: TechQuizCBTSessionStatus.IN_PROGRESS,
        },
      });
      for (const s of expired) {
        await prisma.techQuizCBTSession.update({
          where: { id: s.id },
          data: { submittedAt: new Date(), status: TechQuizCBTSessionStatus.SCORED, score: s.score ?? 0 },
        });
        if (input.round === "ROUND1") {
          await prisma.techQuizResult.updateMany({
            where: { applicationId: s.applicationId },
            data: { round1Score: Number(s.score ?? 0) },
          });
        } else {
          await prisma.techQuizResult.updateMany({
            where: { applicationId: s.applicationId },
            data: { round2CbtScore: Number(s.score ?? 0) },
          });
        }
      }
      return { autoSubmitted: expired.length };
    }),

  /**
   * Compute intra-school rankings after Round 1 CBT window closes.
   * Assigns intraSchoolRank per student within their school.
   * Selects top-N qualifiers per school (N = event.topQualifiersPerSchool).
   */
  computeRound1Rankings: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new Error("Event not found");

      // Get all ROUND1_ELIGIBLE applications with their scores
      const results = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId },
        include: { application: { select: { schoolId: true, status: true } } },
      });

      // Group by school
      const bySchool: Record<string, typeof results> = {};
      for (const r of results) {
        const sid = r.application.schoolId;
        if (!bySchool[sid]) bySchool[sid] = [];
        bySchool[sid].push(r);
      }

      let qualifiersSelected = 0;
      for (const [schoolId, schoolResults] of Object.entries(bySchool)) {
        // Sort by round1Score desc (null = 0)
        schoolResults.sort((a, b) => Number(b.round1Score ?? 0) - Number(a.round1Score ?? 0));
        // Assign intra-school ranks
        for (let i = 0; i < schoolResults.length; i++) {
          await prisma.techQuizResult.update({
            where: { id: schoolResults[i].id },
            data: { intraSchoolRank: i + 1 },
          });
        }
        // Select top-N qualifiers
        const topN = schoolResults.slice(0, ev.topQualifiersPerSchool);
        for (const r of topN) {
          // Upsert qualifier record
          await prisma.techQuizQualifier.upsert({
            where: { applicationId: r.applicationId },
            create: {
              id: randomUUID(),
              applicationId: r.applicationId,
              eventId: input.eventId,
              schoolId,
              round1Rank: r.intraSchoolRank ?? 1,
              qualifiedAt: new Date(),
            },
            update: { round1Rank: r.intraSchoolRank ?? 1 },
          });
          await prisma.techQuizApplication.update({
            where: { id: r.applicationId },
            data: { status: TechQuizApplicationStatus.QUALIFIER },
          });
          // Notify parent
          const app = await prisma.techQuizApplication.findUnique({
            where: { id: r.applicationId },
            include: { childBeneficiary: true },
          });
          if (app) {
            await sendNotification({
              userId: app.parentUserId,
              type: "TECHQUIZ_QUALIFIER_NOTICE",
              title: "Qualified for Round 2!",
              message: `Congratulations! ${app.childBeneficiary.childName} has qualified for TechQuiz Round 2!`,
              actionUrl: "/techquiz",
            });
          }
          qualifiersSelected++;
        }
      }

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "COMPUTE_ROUND1_RANKINGS",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { qualifiersSelected },
      });

      return { qualifiersSelected };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — ROUND 2 + ONSITE + RANKINGS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Issue Round 2 access to all qualifiers.
   * Sets application status → ROUND2_ELIGIBLE and notifies qualifiers.
   */
  issueRound2Access: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        include: { round2Schedules: true },
      });
      if (!ev) throw new Error("Event not found");

      const qualifiers = await prisma.techQuizApplication.findMany({
        where: { eventId: input.eventId, status: TechQuizApplicationStatus.QUALIFIER },
        include: { childBeneficiary: true },
      });

      const schedule = ev.round2Schedules[0];
      const venue = schedule?.venueDescription ?? "TBD";
      const onsiteDate = schedule?.onsiteDate?.toLocaleDateString() ?? "TBD";
      const cbWin = schedule?.cbtWindowStart
        ? `${schedule.cbtWindowStart.toLocaleDateString()} – ${schedule.cbtWindowEnd?.toLocaleDateString() ?? "TBD"}`
        : "TBD";

      for (const app of qualifiers) {
        await prisma.techQuizApplication.update({
          where: { id: app.id },
          data: { status: TechQuizApplicationStatus.ROUND2_ELIGIBLE },
        });
        await sendNotification({
          userId: app.parentUserId,
          type: "TECHQUIZ_ROUND2_SCHEDULE",
          title: "Round 2 Schedule",
          message: `${app.childBeneficiary.childName} has been issued Round 2 access. CBT Window: ${cbWin}. Onsite Assessment: ${onsiteDate}. Venue: ${venue}.`,
          actionUrl: "/techquiz/round2",
        });
      }

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "ISSUE_ROUND2_ACCESS",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { qualifiers: qualifiers.length },
      });

      return { issued: qualifiers.length };
    }),

  /**
   * Assessor submits onsite scores for a student.
   * Components: presentation, logical reasoning, use-case.
   * Validated against event scoring rubric.
   */
  submitOnsiteScore: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        presentationScore: z.number().min(0),
        logicalReasoningScore: z.number().min(0),
        useCaseScore: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const assessorId = ctx.session!.user!.id;
      const role = (ctx.session!.user as any)?.role;
      if (!["admin", "superadmin", "assessor"].includes(role)) {
        throw new Error("Only authorised assessors can submit onsite scores");
      }

      const app = await prisma.techQuizApplication.findUnique({
        where: { id: input.applicationId },
        include: { event: { include: { scoringRubric: true } } },
      });
      if (!app) throw new Error("Application not found");
      if (app.status !== TechQuizApplicationStatus.ROUND2_ELIGIBLE) {
        throw new Error("Application is not eligible for Round 2 onsite scoring");
      }

      // Validate against rubric
      const rubric = app.event.scoringRubric;
      if (rubric) {
        if (input.presentationScore > rubric.maxPresentation)
          throw new Error(`Presentation score exceeds max (${rubric.maxPresentation})`);
        if (input.logicalReasoningScore > rubric.maxLogicalReasoning)
          throw new Error(`Logical reasoning score exceeds max (${rubric.maxLogicalReasoning})`);
        if (input.useCaseScore > rubric.maxUseCase)
          throw new Error(`Use-case score exceeds max (${rubric.maxUseCase})`);
      }

      const total = input.presentationScore + input.logicalReasoningScore + input.useCaseScore;

      const score = await prisma.techQuizOnsiteScore.upsert({
        where: { applicationId: input.applicationId },
        create: {
          id: randomUUID(),
          applicationId: input.applicationId,
          eventId: app.eventId,
          assessorUserId: assessorId,
          presentationScore: input.presentationScore,
          logicalReasoningScore: input.logicalReasoningScore,
          useCaseScore: input.useCaseScore,
          totalOnsiteScore: total,
          notes: input.notes,
          isLocked: false,
        },
        update: {
          assessorUserId: assessorId,
          presentationScore: input.presentationScore,
          logicalReasoningScore: input.logicalReasoningScore,
          useCaseScore: input.useCaseScore,
          totalOnsiteScore: total,
          notes: input.notes,
          scoredAt: new Date(),
        },
      });

      // Reflect in result
      await prisma.techQuizResult.update({
        where: { applicationId: input.applicationId },
        data: { onsiteScore: total },
      });

      await audit({
        actorId: assessorId,
        actorRole: role,
        action: "SUBMIT_ONSITE_SCORE",
        entityType: "TechQuizOnsiteScore",
        entityId: score.id,
        eventId: app.eventId,
        metadata: { total, applicationId: input.applicationId },
      });

      return score;
    }),

  /**
   * Admin: lock all onsite scores for an event (prevents further edits).
   */
  lockOnsiteScores: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      await prisma.techQuizOnsiteScore.updateMany({
        where: { eventId: input.eventId },
        data: { isLocked: true },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "LOCK_ONSITE_SCORES",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
      });
      return { success: true };
    }),

  /**
   * Compute weighted final scores and assign final rankings 1–20 across the event.
   * Formula: FinalScore = (round2CbtScore × cbtWeightPct/100) + (onsiteScore × onsiteWeightPct/100)
   * Tie-break: higher round2CbtScore → then higher round1Score.
   */
  computeFinalScores: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new Error("Event not found");

      const results = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId },
        include: { application: { select: { status: true } } },
      });

      // Only compute for ROUND2_ELIGIBLE applications
      const r2Results = results.filter(
        (r) => r.application.status === TechQuizApplicationStatus.ROUND2_ELIGIBLE
      );

      const cbtW = ev.cbtWeightPct / 100;
      const onsiteW = ev.onsiteWeightPct / 100;

      for (const r of r2Results) {
        const cbt = Number(r.round2CbtScore ?? 0);
        const onsite = Number(r.onsiteScore ?? 0);
        const final = cbt * cbtW + onsite * onsiteW;
        await prisma.techQuizResult.update({
          where: { id: r.id },
          data: { finalScore: final, computedAt: new Date() },
        });
      }

      // Re-fetch updated results for ranking
      const updated = await prisma.techQuizResult.findMany({
        where: {
          eventId: input.eventId,
          finalScore: { not: null },
        },
        orderBy: [
          { finalScore: "desc" },
          { round2CbtScore: "desc" },
          { round1Score: "desc" },
        ],
      });

      // Get award brackets
      const brackets = await prisma.techQuizAwardBracket.findMany({
        where: { eventId: input.eventId },
        orderBy: { minRank: "asc" },
      });

      for (let i = 0; i < updated.length; i++) {
        const rank = i + 1;
        const bracket = brackets.find((b) => rank >= b.minRank && rank <= b.maxRank);
        await prisma.techQuizResult.update({
          where: { id: updated[i].id },
          data: {
            finalRank: rank,
            awardBracket: bracket?.bracketLabel ?? null,
          },
        });
      }

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "COMPUTE_FINAL_SCORES",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { ranked: updated.length },
      });

      return { ranked: updated.length };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — RESULTS PUBLICATION ENGINE
  // ══════════════════════════════════════════════════════════════════════════

  /** Publish Round 1 results — visible on parent, child, and school dashboards */
  publishRound1Results: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const apps = await prisma.techQuizApplication.findMany({
        where: { eventId: input.eventId, status: { not: TechQuizApplicationStatus.REJECTED } },
        include: { childBeneficiary: true, result: true },
      });
      for (const app of apps) {
        if (app.result) {
          await prisma.techQuizResult.update({
            where: { id: app.result.id },
            data: { round1Published: true },
          });
          await sendNotification({
            userId: app.parentUserId,
            type: "TECHQUIZ_ROUND1_RESULT",
            title: "Round 1 Results Available",
            message: `Round 1 results for ${app.childBeneficiary.childName} are now published. Score: ${app.result.round1Score ?? "N/A"}, Rank: ${app.result.intraSchoolRank ?? "N/A"}.`,
            actionUrl: "/techquiz/results",
          });
        }
      }
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "PUBLISH_ROUND1_RESULTS",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
      });
      return { published: apps.length };
    }),

  /** Publish final results — assign winners, notify all stakeholders */
  publishFinalResults: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new Error("Event not found");

      const results = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId, finalRank: { not: null } },
        orderBy: { finalRank: "asc" },
        include: { application: { include: { childBeneficiary: true } } },
      });

      for (const r of results) {
        await prisma.techQuizResult.update({
          where: { id: r.id },
          data: { finalPublished: true },
        });
        // Notify parent
        const isWinner = r.finalRank !== null && r.finalRank <= 20;
        if (isWinner) {
          await sendNotification({
            userId: r.application.parentUserId,
            type: "TECHQUIZ_WINNER_NOTIFICATION",
            title: "TechQuiz Winner 🎉",
            message: `${r.application.childBeneficiary.childName} finished in position #${r.finalRank} (${r.awardBracket ?? "Award"} Prize). BPI Regular activation will be granted.`,
            actionUrl: "/techquiz/results",
          });
        } else {
          await sendNotification({
            userId: r.application.parentUserId,
            type: "TECHQUIZ_FINAL_RESULTS_PUBLISHED",
            title: "Final Results Published",
            message: `Final results for the TechQuiz Competition "${ev.title}" are out. Check your dashboard for ${r.application.childBeneficiary.childName}'s ranking.`,
            actionUrl: "/techquiz/results",
          });
        }
      }

      await prisma.techQuizEvent.update({
        where: { id: input.eventId },
        data: { status: TechQuizEventStatus.COMPLETED, completedAt: new Date() },
      });

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "PUBLISH_FINAL_RESULTS",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { totalRanked: results.length },
      });

      return { published: results.length };
    }),

  /** Get results for an event (admin — full leaderboard) */
  adminGetLeaderboard: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        schoolId: z.string().optional(),
        onlyPublished: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const where: any = { eventId: input.eventId };
      if (input.schoolId) where.application = { schoolId: input.schoolId };
      if (input.onlyPublished) where.finalPublished = true;
      return prisma.techQuizResult.findMany({
        where,
        orderBy: [{ finalRank: "asc" }, { round1Score: "desc" }],
        include: {
          application: {
            include: {
              childBeneficiary: true,
              parent: { select: { id: true, name: true } },
              school: { select: { id: true, name: true, state: true } },
            },
          },
        },
      });
    }),

  /** Get a parent's child's result for an event */
  myChildResult: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const app = await prisma.techQuizApplication.findUnique({
        where: { id: input.applicationId },
        include: { result: true, childBeneficiary: true, event: true },
      });
      if (!app || app.parentUserId !== ctx.session!.user!.id) throw new Error("Access denied");
      return app;
    }),

  /** Admin: correct a result (requires reason for audit) */
  correctResult: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        round1Score: z.number().optional(),
        round2CbtScore: z.number().optional(),
        onsiteScore: z.number().optional(),
        finalScore: z.number().optional(),
        finalRank: z.number().int().optional(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const { applicationId, reason, ...scores } = input;
      const updated = await prisma.techQuizResult.update({
        where: { applicationId },
        data: scores,
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "CORRECT_RESULT",
        entityType: "TechQuizResult",
        entityId: updated.id,
        eventId: updated.eventId,
        metadata: { reason, changes: scores },
      });
      return updated;
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — AWARDS, BPI BENEFITS & EVENT CLOSURE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Grant BPI Regular activation to winners ranked 1–20.
   * Non-monetary: Regular activation only.
   */
  grantBPIActivation: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const winners = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId, finalPublished: true, finalRank: { lte: 20 } },
        include: { childBeneficiary: true, application: true },
      });
      let granted = 0;
      for (const w of winners) {
        if (!w.bpiActivationGranted) {
          await prisma.techQuizResult.update({
            where: { id: w.id },
            data: { bpiActivationGranted: true, bpiActivationGrantedAt: new Date() },
          });
          // Update child beneficiary status to ACTIVE
          await prisma.techQuizChildBeneficiary.update({
            where: { id: w.childBeneficiaryId },
            data: { status: TechQuizChildStatus.ACTIVE },
          });
          await audit({
            actorId: ctx.session!.user!.id,
            actorRole: ctx.session!.user!.role as string,
            action: "GRANT_BPI_ACTIVATION",
            entityType: "TechQuizResult",
            entityId: w.id,
            eventId: input.eventId,
            metadata: { childName: w.childBeneficiary.childName, rank: w.finalRank },
          });
          granted++;
        }
      }
      return { granted };
    }),

  /** Archive an event (COMPLETED → ARCHIVED) */
  archiveEvent: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const ev = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!ev) throw new Error("Event not found");
      if (ev.status !== TechQuizEventStatus.COMPLETED) throw new Error("Event must be COMPLETED to archive");
      const updated = await prisma.techQuizEvent.update({
        where: { id: input.eventId },
        data: { status: TechQuizEventStatus.ARCHIVED },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "ARCHIVE_EVENT",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
      });
      return updated;
    }),

  /** Get public results page data for a published/completed event */
  getPublicResults: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        select: { id: true, title: true, state: true, status: true, completedAt: true },
      });
      if (!ev) throw new Error("Event not found");
      const top20 = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId, finalPublished: true, finalRank: { lte: 20 } },
        orderBy: { finalRank: "asc" },
        include: {
          childBeneficiary: { select: { childName: true } },
          application: { include: { school: { select: { name: true, state: true } } } },
        },
      });
      return { event: ev, top20 };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — SPONSORSHIP MODULE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate sponsorship total before payment.
   * formula: totalAmount = event.sponsorshipPackagePrice × childrenCount
   */
  calculateSponsorshipTotal: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        childrenCount: z.number().int().min(1),
        sponsorType: z.enum(["CHILD_PARENT", "SCHOOL_COHORT", "PRIZE_POOL"]),
        schoolId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        select: { sponsorshipPackagePrice: true, title: true, state: true },
      });
      if (!ev) throw new Error("Event not found");
      const total = Number(ev.sponsorshipPackagePrice) * input.childrenCount;
      const allocationPool =
        input.schoolId ? TechQuizAllocationPool.SCHOOL_POOL : TechQuizAllocationPool.EVENT_PRIZE_POOL;
      return { total, allocationPool, perUnit: Number(ev.sponsorshipPackagePrice), event: ev };
    }),

  /** Create a sponsor profile (or find existing) and create a sponsorship package */
  createSponsorshipPackage: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        sponsorName: z.string().min(2),
        sponsorEmail: z.string().email().optional(),
        sponsorPhone: z.string().optional(),
        childrenCount: z.number().int().min(1),
        sponsorType: z.enum(["CHILD_PARENT", "SCHOOL_COHORT", "PRIZE_POOL"]),
        schoolId: z.string().optional(),
        paymentReference: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const userId = ctx.session!.user!.id;
      const ev = await prisma.techQuizEvent.findUnique({
        where: { id: input.eventId },
        select: { sponsorshipPackagePrice: true },
      });
      if (!ev) throw new Error("Event not found");

      const totalAmount = Number(ev.sponsorshipPackagePrice) * input.childrenCount;
      const allocationPool = input.schoolId
        ? TechQuizAllocationPool.SCHOOL_POOL
        : TechQuizAllocationPool.EVENT_PRIZE_POOL;

      // Create or find sponsor
      let sponsor = await prisma.techQuizSponsor.findFirst({
        where: { userId },
      });
      if (!sponsor) {
        sponsor = await prisma.techQuizSponsor.create({
          data: {
            id: randomUUID(),
            userId,
            name: input.sponsorName,
            email: input.sponsorEmail,
            phone: input.sponsorPhone,
          },
        });
      }

      const pkg = await prisma.techQuizSponsorshipPackage.create({
        data: {
          id: randomUUID(),
          sponsorId: sponsor.id,
          eventId: input.eventId,
          sponsorType: input.sponsorType as TechQuizSponsorType,
          childrenCount: input.childrenCount,
          schoolId: input.schoolId,
          totalAmount,
          paymentReference: input.paymentReference,
          paymentStatus: input.paymentReference ? TechQuizPaymentStatus.PAID : TechQuizPaymentStatus.PENDING,
          allocationPool,
        },
      });

      if (pkg.paymentStatus === TechQuizPaymentStatus.PAID) {
        await sendNotification({
          userId,
          type: "TECHQUIZ_SPONSORSHIP_CONFIRMED",
          title: "Sponsorship Confirmed",
          message: `Your TechQuiz sponsorship of ₦${totalAmount.toLocaleString()} has been confirmed. Thank you!`,
          actionUrl: "/techquiz/sponsor",
        });
        await notifyAdmins(
          "New TechQuiz Sponsorship",
          `New sponsorship: ₦${totalAmount.toLocaleString()} (${input.sponsorType}) for event "${input.eventId}".`,
          `/admin/techquiz/${input.eventId}`
        );
      }

      await audit({
        actorId: userId,
        actorRole: (ctx.session!.user as any)?.role ?? "user",
        action: "CREATE_SPONSORSHIP",
        entityType: "TechQuizSponsorshipPackage",
        entityId: pkg.id,
        eventId: input.eventId,
        metadata: { totalAmount, sponsorType: input.sponsorType, allocationPool },
      });

      return pkg;
    }),

  /** Confirm sponsorship payment (admin or system webhook) */
  confirmSponsorshipPayment: protectedProcedure
    .input(z.object({ packageId: z.string(), paymentReference: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const pkg = await prisma.techQuizSponsorshipPackage.update({
        where: { id: input.packageId },
        data: { paymentStatus: TechQuizPaymentStatus.PAID, paymentReference: input.paymentReference },
        include: { sponsor: true, event: true },
      });
      if (pkg.sponsor.userId) {
        await sendNotification({
          userId: pkg.sponsor.userId,
          type: "TECHQUIZ_SPONSORSHIP_CONFIRMED",
          title: "Sponsorship Payment Confirmed",
          message: `Your TechQuiz sponsorship of ₦${Number(pkg.totalAmount).toLocaleString()} has been confirmed.`,
          actionUrl: "/techquiz/sponsor",
        });
      }
      await notifyAdmins(
        "Sponsorship Allocated",
        `Sponsorship package ${input.packageId} confirmed for event "${pkg.event.title}".`,
        `/admin/techquiz/${pkg.eventId}`
      );
      return pkg;
    }),

  /** Admin: sponsorship dashboard for an event */
  adminSponsorshipDashboard: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const packages = await prisma.techQuizSponsorshipPackage.findMany({
        where: { eventId: input.eventId },
        include: { sponsor: true, school: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });

      const totalRaised = packages
        .filter((p) => p.paymentStatus === TechQuizPaymentStatus.PAID)
        .reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const schoolPoolTotal = packages
        .filter((p) => p.paymentStatus === TechQuizPaymentStatus.PAID && p.allocationPool === TechQuizAllocationPool.SCHOOL_POOL)
        .reduce((sum, p) => sum + Number(p.totalAmount), 0);
      const eventPrizePoolTotal = packages
        .filter((p) => p.paymentStatus === TechQuizPaymentStatus.PAID && p.allocationPool === TechQuizAllocationPool.EVENT_PRIZE_POOL)
        .reduce((sum, p) => sum + Number(p.totalAmount), 0);

      return { packages, totalRaised, schoolPoolTotal, eventPrizePoolTotal };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 11 — COMPLIANCE & SAFEGUARDS
  // ══════════════════════════════════════════════════════════════════════════

  /** Get consent log for a child (admin or parent owner) */
  getConsentLog: protectedProcedure
    .input(z.object({ childBeneficiaryId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAuth(ctx.session);
      const userId = ctx.session!.user!.id;
      const role = (ctx.session!.user as any)?.role;
      const child = await prisma.techQuizChildBeneficiary.findUnique({
        where: { id: input.childBeneficiaryId },
        select: { parentUserId: true },
      });
      if (!child) throw new Error("Child not found");
      if (child.parentUserId !== userId && !["admin", "superadmin"].includes(role)) {
        throw new Error("Access denied");
      }
      return prisma.techQuizConsentLog.findMany({
        where: { childBeneficiaryId: input.childBeneficiaryId },
        orderBy: { consentGivenAt: "desc" },
      });
    }),

  /** Create a TechQuiz legal event (compliance flag) */
  createLegalEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        description: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const le = await prisma.techQuizLegalEvent.create({
        data: {
          id: randomUUID(),
          eventId: input.eventId,
          description: input.description,
          raisedBy: ctx.session!.user!.id,
          raisedAt: new Date(),
        },
      });
      await notifyAdmins(
        "TechQuiz Compliance Flag",
        `A compliance issue was raised for event ${input.eventId}: ${input.description}`,
        `/admin/techquiz/${input.eventId}`
      );
      return le;
    }),

  /** Resolve a legal event */
  resolveLegalEvent: protectedProcedure
    .input(
      z.object({
        legalEventId: z.string(),
        resolution: z.string().min(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizLegalEvent.update({
        where: { id: input.legalEventId },
        data: {
          resolvedAt: new Date(),
          resolvedBy: ctx.session!.user!.id,
          resolution: input.resolution,
        },
      });
    }),

  /** List legal events for an event */
  adminListLegalEvents: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizLegalEvent.findMany({
        where: { eventId: input.eventId },
        orderBy: { raisedAt: "desc" },
      });
    }),

  /** Get full audit log for an event (admin) */
  getAuditLog: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().max(200).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const skip = (input.page - 1) * input.perPage;
      const [logs, total] = await Promise.all([
        prisma.techQuizAuditLog.findMany({
          where: { eventId: input.eventId },
          skip,
          take: input.perPage,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { id: true, name: true, role: true } } },
        }),
        prisma.techQuizAuditLog.count({ where: { eventId: input.eventId } }),
      ]);
      return { logs, total, page: input.page, perPage: input.perPage };
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 13 — ADMIN REPORTING & AUDIT DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════

  /** Event overview report: totals per event */
  adminEventReport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const [
        totalApplications,
        verifiedApplications,
        qualifiers,
        round2Eligible,
        finalRanked,
        sponsorshipPaid,
        schools,
      ] = await Promise.all([
        prisma.techQuizApplication.count({ where: { eventId: input.eventId } }),
        prisma.techQuizApplication.count({ where: { eventId: input.eventId, status: TechQuizApplicationStatus.VERIFIED } }),
        prisma.techQuizApplication.count({ where: { eventId: input.eventId, status: TechQuizApplicationStatus.QUALIFIER } }),
        prisma.techQuizApplication.count({ where: { eventId: input.eventId, status: TechQuizApplicationStatus.ROUND2_ELIGIBLE } }),
        prisma.techQuizResult.count({ where: { eventId: input.eventId, finalRank: { not: null } } }),
        prisma.techQuizSponsorshipPackage.aggregate({
          where: { eventId: input.eventId, paymentStatus: TechQuizPaymentStatus.PAID },
          _sum: { totalAmount: true },
        }),
        prisma.techQuizEventSchool.findMany({
          where: { eventId: input.eventId },
          include: { school: true },
        }),
      ]);
      return {
        totalApplications,
        verifiedApplications,
        qualifiers,
        round2Eligible,
        finalRanked,
        totalSponsorshipRaised: Number(sponsorshipPaid._sum.totalAmount ?? 0),
        schools: schools.length,
        schoolBreakdown: schools,
      };
    }),

  /** Per-school breakdown report */
  adminSchoolReport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const eventSchools = await prisma.techQuizEventSchool.findMany({
        where: { eventId: input.eventId },
        include: { school: true },
      });
      const breakdown = await Promise.all(
        eventSchools.map(async (es) => {
          const [total, verified, qualifierCount] = await Promise.all([
            prisma.techQuizApplication.count({ where: { eventId: input.eventId, schoolId: es.schoolId } }),
            prisma.techQuizApplication.count({
              where: { eventId: input.eventId, schoolId: es.schoolId, status: TechQuizApplicationStatus.VERIFIED },
            }),
            prisma.techQuizQualifier.count({ where: { eventId: input.eventId, schoolId: es.schoolId } }),
          ]);
          return {
            school: es.school,
            participationStatus: es.participationStatus,
            minStudents: es.minStudents,
            maxStudents: es.maxStudents,
            enrolledCount: es.enrolledCount,
            totalApplications: total,
            verifiedApplications: verified,
            qualifiers: qualifierCount,
          };
        })
      );
      return breakdown;
    }),

  /** Full application list for CSV export */
  adminApplicationsExport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizApplication.findMany({
        where: { eventId: input.eventId },
        orderBy: { appliedAt: "asc" },
        include: {
          childBeneficiary: true,
          parent: { select: { id: true, name: true, email: true } },
          school: { select: { id: true, name: true, state: true } },
          result: true,
        },
      });
    }),

  /** Final results list for CSV / media export */
  adminResultsExport: protectedProcedure
    .input(z.object({ eventId: z.string(), topN: z.number().int().min(1).default(20) }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.techQuizResult.findMany({
        where: { eventId: input.eventId, finalPublished: true, finalRank: { lte: input.topN } },
        orderBy: { finalRank: "asc" },
        include: {
          childBeneficiary: { select: { childName: true } },
          application: {
            include: {
              school: { select: { name: true, state: true } },
              parent: { select: { name: true, email: true } },
            },
          },
        },
      });
    }),

  /** Consent log export per event */
  adminConsentLogExport: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      // Get all child beneficiary IDs associated with this event
      const apps = await prisma.techQuizApplication.findMany({
        where: { eventId: input.eventId },
        select: { childBeneficiaryId: true },
      });
      const ids = apps.map((a) => a.childBeneficiaryId);
      return prisma.techQuizConsentLog.findMany({
        where: { childBeneficiaryId: { in: ids } },
        include: {
          childBeneficiary: { select: { childName: true } },
          parent: { select: { name: true, email: true } },
        },
        orderBy: { consentGivenAt: "asc" },
      });
    }),

  /** Cross-event analytics: active events summary per state */
  adminCrossStateAnalytics: protectedProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "APPROVED", "PUBLISHED", "COMPLETED", "ARCHIVED"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const where: any = {};
      if (input.status) where.status = input.status;
      const events = await prisma.techQuizEvent.findMany({
        where,
        include: {
          _count: { select: { applications: true, sponsorshipPackages: true } },
          eventSchools: true,
        },
        orderBy: [{ state: "asc" }, { createdAt: "desc" }],
      });
      return events;
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 15 — MULTI-STATE & EXPANSION FRAMEWORK
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a Zonal/National event that pulls qualifiers from constituent state events.
   * Same flow as a regular event but marked isZonalOrNational = true.
   */
  createZonalEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3),
        zonalEventType: z.enum(["ZONAL", "NATIONAL"]),
        constituentEventIds: z.array(z.string()).min(1),
        cbtWeightPct: z.number().int().min(1).max(99).default(55),
        onsiteWeightPct: z.number().int().min(1).max(99).default(45),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      if (input.cbtWeightPct + input.onsiteWeightPct !== 100) {
        throw new Error("cbtWeightPct + onsiteWeightPct must equal 100");
      }
      // Derive state from constituent events
      const constituentEvents = await prisma.techQuizEvent.findMany({
        where: { id: { in: input.constituentEventIds } },
        select: { state: true },
      });
      const states = [...new Set(constituentEvents.map((e) => e.state))];
      const event = await prisma.techQuizEvent.create({
        data: {
          id: randomUUID(),
          title: input.title,
          state: states.join(", "),
          status: TechQuizEventStatus.DRAFT,
          isZonalOrNational: true,
          zonalEventType: input.zonalEventType,
          cbtWeightPct: input.cbtWeightPct,
          onsiteWeightPct: input.onsiteWeightPct,
          createdBy: ctx.session!.user!.id,
        },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: `CREATE_${input.zonalEventType}_EVENT`,
        entityType: "TechQuizEvent",
        entityId: event.id,
        eventId: event.id,
        metadata: { constituentEventIds: input.constituentEventIds },
      });
      return event;
    }),

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 16 — ADMINSETTINGS CMS KEYS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get all TechQuiz CMS settings with current values and defaults.
   */
  getCmsSettings: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const defaults: Record<string, string> = {
      techquiz_default_top_qualifiers_per_school: "4",
      techquiz_default_min_students_per_school: "10",
      techquiz_default_max_students_per_school: "12",
      techquiz_default_cbt_weight_pct: "55",
      techquiz_default_onsite_weight_pct: "45",
      techquiz_default_sponsorship_price: "18000",
      techquiz_cbt_tiebreak_method: "SUBMISSION_TIME",
      techquiz_sponsor_visibility_enabled: "false",
      techquiz_certificate_generation_enabled: "false",
      techquiz_blog_auto_publish_enabled: "false",
      techquiz_required_membership_tier: "REGULAR",
    };
    const keys = Object.keys(defaults);
    const rows = await prisma.adminSettings.findMany({
      where: { settingKey: { in: keys } },
    });
    const result: Record<string, string> = { ...defaults };
    for (const row of rows) {
      result[row.settingKey] = row.settingValue ?? defaults[row.settingKey];
    }
    return result;
  }),

  /**
   * Update a TechQuiz CMS setting (admin only).
   */
  updateCmsSetting: protectedProcedure
    .input(
      z.object({
        key: z.string().startsWith("techquiz_"),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      const setting = await prisma.adminSettings.upsert({
        where: { settingKey: input.key },
        create: { id: randomUUID(), settingKey: input.key, settingValue: input.value, updatedAt: new Date() },
        update: { settingValue: input.value, updatedAt: new Date() },
      });
      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "UPDATE_CMS_SETTING",
        entityType: "AdminSettings",
        metadata: { key: input.key, value: input.value },
      });
      return setting;
    }),

  /**
   * Bulk-seed all TechQuiz default CMS settings (admin only).
   * Only creates missing keys, does not overwrite existing values.
   */
  seedDefaultCmsSettings: protectedProcedure.mutation(async ({ ctx }) => {
    assertAdmin(ctx.session);
    const defaults: Array<{ key: string; value: string }> = [
      { key: "techquiz_default_top_qualifiers_per_school", value: "4" },
      { key: "techquiz_default_min_students_per_school", value: "10" },
      { key: "techquiz_default_max_students_per_school", value: "12" },
      { key: "techquiz_default_cbt_weight_pct", value: "55" },
      { key: "techquiz_default_onsite_weight_pct", value: "45" },
      { key: "techquiz_default_sponsorship_price", value: "18000" },
      { key: "techquiz_cbt_tiebreak_method", value: "SUBMISSION_TIME" },
      { key: "techquiz_sponsor_visibility_enabled", value: "false" },
      { key: "techquiz_certificate_generation_enabled", value: "false" },
      { key: "techquiz_blog_auto_publish_enabled", value: "false" },
      { key: "techquiz_required_membership_tier", value: "REGULAR" },
    ];
    let created = 0;
    for (const d of defaults) {
      const existing = await prisma.adminSettings.findUnique({ where: { settingKey: d.key } });
      if (!existing) {
        await prisma.adminSettings.create({ data: { id: randomUUID(), settingKey: d.key, settingValue: d.value, updatedAt: new Date() } });
        created++;
      }
    }
    return { created, total: defaults.length };
  }),

  /**
   * Publish a blog post summarising Round 1 qualifier results for an event.
   * Creates a PUBLISHED BlogPost with a school-by-school qualifier breakdown.
   */
  publishRound1BlogPost: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);

      const event = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!event) throw new Error("Event not found");

      // Gather qualifier applications grouped by school
      const qualifiers = await prisma.techQuizApplication.findMany({
        where: {
          eventId: input.eventId,
          status: TechQuizApplicationStatus.ROUND2_ELIGIBLE,
        },
        include: {
          childBeneficiary: true,
          school: { select: { name: true, state: true } },
          result: true,
        },
      });
      // Sort: school name asc, then intraSchoolRank asc
      qualifiers.sort((a, b) => {
        const schoolCmp = a.school.name.localeCompare(b.school.name);
        if (schoolCmp !== 0) return schoolCmp;
        return (a.result?.intraSchoolRank ?? 999) - (b.result?.intraSchoolRank ?? 999);
      });

      // Build school → qualifiers map
      const schoolMap = new Map<string, typeof qualifiers>();
      for (const app of qualifiers) {
        const key = `${app.school.name} (${app.school.state})`;
        if (!schoolMap.has(key)) schoolMap.set(key, []);
        schoolMap.get(key)!.push(app);
      }

      // Build HTML content
      const rows = [...schoolMap.entries()]
        .map(([school, apps]) => {
          const childRows = apps
            .map(
              (a) =>
                `<tr><td style="padding:6px 12px;">${a.childBeneficiary.childName}</td>` +
                `<td style="padding:6px 12px;text-align:center;">${a.result?.round1Score ?? "—"}</td>` +
                `<td style="padding:6px 12px;text-align:center;">${a.result?.intraSchoolRank ?? "—"}</td></tr>`
            )
            .join("");
          return (
            `<h3 style="margin-top:24px;color:#0d3b29;">${school}</h3>` +
            `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">` +
            `<thead><tr style="background:#f0f7f4;">` +
            `<th style="padding:8px 12px;text-align:left;">Student</th>` +
            `<th style="padding:8px 12px;">Score</th>` +
            `<th style="padding:8px 12px;">School Rank</th>` +
            `</tr></thead><tbody>${childRows}</tbody></table>`
          );
        })
        .join("");

      const content =
        `<p>Round 1 of the <strong>${event.title}</strong> has concluded. ` +
        `A total of <strong>${qualifiers.length} students</strong> across ${schoolMap.size} schools have qualified for Round 2 (Onsite Finals).</p>` +
        `<p>Congratulations to all qualifiers! The onsite competition details will be communicated to participating schools shortly.</p>` +
        rows;

      const slug = `techquiz-${input.eventId}-round1-results-${Date.now()}`;

      const post = await prisma.blogPost.create({
        data: {
          title: `${event.title} — Round 1 Qualifier Results`,
          slug,
          content,
          excerpt: `Round 1 of ${event.title} is complete. ${qualifiers.length} students from ${schoolMap.size} schools have qualified for the onsite finals.`,
          tags: "techquiz,round1,results,qualifiers",
          status: BlogPostStatus.PUBLISHED,
          featured: false,
          authorId: ctx.session!.user!.id,
          publishedAt: new Date(),
        },
      });

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "PUBLISH_ROUND1_BLOG_POST",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { blogPostId: post.id, qualifiers: qualifiers.length },
      });

      return { postId: post.id, slug, qualifiers: qualifiers.length };
    }),

  /**
   * Publish a blog post announcing the final Top-20 winners of an event.
   */
  publishFinalBlogPost: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertAdmin(ctx.session);

      const event = await prisma.techQuizEvent.findUnique({ where: { id: input.eventId } });
      if (!event) throw new Error("Event not found");

      const top20 = await prisma.techQuizResult.findMany({
        where: { eventId: input.eventId, finalRank: { gte: 1, lte: 20 }, finalPublished: true },
        orderBy: { finalRank: "asc" },
        include: {
          application: {
            include: {
              childBeneficiary: true,
              school: { select: { name: true, state: true } },
            },
          },
        },
      });

      const podiumRows = top20
        .map((r) => {
          const medal =
            r.finalRank === 1 ? "🥇" : r.finalRank === 2 ? "🥈" : r.finalRank === 3 ? "🥉" : "";
          return (
            `<tr>` +
            `<td style="padding:8px 12px;text-align:center;font-weight:700;">${medal} ${r.finalRank}</td>` +
            `<td style="padding:8px 12px;">${r.application.childBeneficiary.childName}</td>` +
            `<td style="padding:8px 12px;">${r.application.school.name}</td>` +
            `<td style="padding:8px 12px;">${r.application.school.state}</td>` +
            `<td style="padding:8px 12px;font-weight:600;color:#1a5c3a;">${r.awardBracket ?? "—"}</td>` +
            `</tr>`
          );
        })
        .join("");

      const content =
        `<p>The <strong>${event.title}</strong> has officially concluded. ` +
        `After an intense Round 1 CBT and an exciting onsite Round 2 finale, we are proud to announce our Top 20 winners.</p>` +
        `<p>All winners will receive BPI Regular activation and their official certificates of achievement. Congratulations to every participant for their hard work and dedication!</p>` +
        `<h3 style="margin-top:24px;color:#0d3b29;">🏆 Final Top 20 Leaderboard</h3>` +
        `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">` +
        `<thead><tr style="background:#f0f7f4;">` +
        `<th style="padding:8px 12px;">Rank</th>` +
        `<th style="padding:8px 12px;text-align:left;">Student</th>` +
        `<th style="padding:8px 12px;text-align:left;">School</th>` +
        `<th style="padding:8px 12px;text-align:left;">State</th>` +
        `<th style="padding:8px 12px;text-align:left;">Award</th>` +
        `</tr></thead><tbody>${podiumRows}</tbody></table>` +
        `<p style="margin-top:16px;">Stay tuned for TechQuiz Season announcements and school registration details.</p>`;

      const slug = `techquiz-${input.eventId}-final-winners-${Date.now()}`;

      const post = await prisma.blogPost.create({
        data: {
          title: `${event.title} — Final Winners Announced`,
          slug,
          content,
          excerpt: `${event.title} has concluded. Discover our Top 20 winners and their awards in this special announcement.`,
          tags: "techquiz,finals,winners,leaderboard",
          status: BlogPostStatus.PUBLISHED,
          featured: true,
          authorId: ctx.session!.user!.id,
          publishedAt: new Date(),
        },
      });

      await audit({
        actorId: ctx.session!.user!.id,
        actorRole: ctx.session!.user!.role as string,
        action: "PUBLISH_FINAL_BLOG_POST",
        entityType: "TechQuizEvent",
        entityId: input.eventId,
        eventId: input.eventId,
        metadata: { blogPostId: post.id, winners: top20.length },
      });

      return { postId: post.id, slug, winners: top20.length };
    }),

  /** Search platform users by email fragment (admin only) */
  searchUsersByEmail: protectedProcedure
    .input(z.object({ email: z.string().min(2) }))
    .query(async ({ input, ctx }) => {
      assertAdmin(ctx.session);
      return prisma.user.findMany({
        where: { email: { contains: input.email, mode: "insensitive" } },
        select: { id: true, name: true, email: true, role: true },
        take: 8,
        orderBy: { email: "asc" },
      });
    }),
});
