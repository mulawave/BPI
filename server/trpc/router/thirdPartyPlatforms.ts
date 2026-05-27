import { z } from "zod";
import { randomUUID } from "crypto";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { placeUserInThirdPartyMatrix } from "@/server/services/thirdPartyMatrix.service";

const THIRD_PARTY_CACHE_TTL_MS = 15_000;
const thirdPartyQueryCache = new Map<string, { value: any; expiresAt: number }>();
const thirdPartyQueryInFlight = new Map<string, Promise<any>>();

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

function getCachedThirdPartyQuery<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = thirdPartyQueryCache.get(key);
  if (cached && isFresh(cached.expiresAt)) {
    return Promise.resolve(cached.value as T);
  }

  const inFlight = thirdPartyQueryInFlight.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const request = fetcher()
    .then((value) => {
      thirdPartyQueryCache.set(key, {
        value,
        expiresAt: Date.now() + THIRD_PARTY_CACHE_TTL_MS,
      });
      return value;
    })
    .finally(() => {
      thirdPartyQueryInFlight.delete(key);
    });

  thirdPartyQueryInFlight.set(key, request as Promise<any>);
  return request;
}

function clearThirdPartyUserCache(userId: string) {
  const prefix = `${userId}:`;
  for (const key of thirdPartyQueryCache.keys()) {
    if (key.startsWith(prefix)) {
      thirdPartyQueryCache.delete(key);
    }
  }
  for (const key of thirdPartyQueryInFlight.keys()) {
    if (key.startsWith(prefix)) {
      thirdPartyQueryInFlight.delete(key);
    }
  }
}

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const role = (ctx.session?.user as any)?.role;
  if (role !== "admin" && role !== "super_admin" && role !== "superadmin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access required",
    });
  }
  return next();
});

const platformUpsertInput = z.object({
  name: z.string().trim().min(1, "Platform name is required"),
  description: z.string().trim().optional().nullable(),
  registrationUrl: z.string().trim().url("Please enter a valid base URL"),
  adminDefaultLink: z
    .string()
    .trim()
    .url("Please enter a valid admin referral URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  defaultAdminUserId: z.string().trim().min(1, "Default owner admin is required"),
  category: z.string().trim().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  logo: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

function normalizeOptional(input?: string | null) {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeHostname(urlValue: string) {
  try {
    const hostname = new URL(urlValue).hostname.toLowerCase().replace(/\.$/, "");
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

function isSameDomainOrSubdomain(candidateHost: string, baseHost: string) {
  return candidateHost === baseHost || candidateHost.endsWith(`.${baseHost}`);
}

export const thirdPartyPlatformsRouter = createTRPCRouter({
  adminListPlatformOwners: adminProcedure.query(async ({ ctx }) => {
    const admins = await ctx.prisma.user.findMany({
      where: {
        role: { in: ["admin", "super_admin", "superadmin"] },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        activated: true,
      },
      orderBy: [{ activated: "desc" }, { role: "asc" }, { firstname: "asc" }],
    });

    return admins.map((admin: any) => ({
      id: admin.id,
      role: admin.role,
      activated: !!admin.activated,
      name:
        `${admin.firstname || ""} ${admin.lastname || ""}`.trim() ||
        admin.email ||
        "Admin",
    }));
  }),

  adminListPlatforms: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.thirdPartyPlatform.findMany({
      include: {
        DefaultAdminUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            role: true,
            activated: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
  }),

  adminAddPlatform: adminProcedure
    .input(platformUpsertInput)
    .mutation(async ({ ctx, input }) => {
      const owner = await ctx.prisma.user.findFirst({
        where: {
          id: input.defaultAdminUserId,
          role: { in: ["admin", "super_admin", "superadmin"] },
        },
        select: { id: true },
      });

      if (!owner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected owner is not a valid admin",
        });
      }

      return ctx.prisma.thirdPartyPlatform.create({
        data: {
          id: randomUUID(),
          name: input.name,
          description: normalizeOptional(input.description),
          registrationUrl: input.registrationUrl,
          adminDefaultLink: normalizeOptional(input.adminDefaultLink),
          defaultAdminUserId: input.defaultAdminUserId,
          category: normalizeOptional(input.category),
          displayOrder: input.displayOrder,
          logo: normalizeOptional(input.logo),
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      });
    }),

  adminUpdatePlatform: adminProcedure
    .input(
      platformUpsertInput.extend({
        id: z.string().trim().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.thirdPartyPlatform.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      const owner = await ctx.prisma.user.findFirst({
        where: {
          id: input.defaultAdminUserId,
          role: { in: ["admin", "super_admin", "superadmin"] },
        },
        select: { id: true },
      });

      if (!owner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected owner is not a valid admin",
        });
      }

      return ctx.prisma.thirdPartyPlatform.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: normalizeOptional(input.description),
          registrationUrl: input.registrationUrl,
          adminDefaultLink: normalizeOptional(input.adminDefaultLink),
          defaultAdminUserId: input.defaultAdminUserId,
          category: normalizeOptional(input.category),
          displayOrder: input.displayOrder,
          logo: normalizeOptional(input.logo),
          isActive: input.isActive,
          updatedAt: new Date(),
        },
      });
    }),

  adminTogglePlatformActive: adminProcedure
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.thirdPartyPlatform.findUnique({
        where: { id: input.id },
        select: { id: true, isActive: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      const updated = await ctx.prisma.thirdPartyPlatform.update({
        where: { id: input.id },
        data: {
          isActive: !existing.isActive,
          updatedAt: new Date(),
        },
        select: { id: true, isActive: true },
      });

      return updated;
    }),

  adminDeletePlatform: adminProcedure
    .input(z.object({ id: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.thirdPartyPlatform.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found",
        });
      }

      await ctx.prisma.thirdPartyPlatform.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Get all active platforms for current user (filtered - exclude completed ones)
  getAvailablePlatforms: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;
    const cacheKey = `${userId}:availablePlatforms`;

    return getCachedThirdPartyQuery(cacheKey, async () => {

    // Get all active platforms
    const allPlatforms = await ctx.prisma.thirdPartyPlatform.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Get platforms user has already submitted
    const userSubmittedPlatforms = await ctx.prisma.userThirdPartyLink.findMany({
      where: { userId },
      select: { platformId: true },
    });

    const submittedPlatformIds = new Set(
      userSubmittedPlatforms.map((link: { platformId: string }) => link.platformId)
    );

    // Filter out platforms user has already submitted
    const availablePlatforms = allPlatforms.filter(
      (platform: any) => !submittedPlatformIds.has(platform.id)
    );

    // Executive Overpass: allow user to use admin links (bypass sponsor dependency)
    const overpass = await ctx.prisma.thirdPartyExecutiveOverpass.findUnique({
      where: { userId },
      select: { revokedAt: true, expiresAt: true },
    });

    const now = new Date();
    const hasActiveOverpass =
      !!overpass && !overpass.revokedAt && (!overpass.expiresAt || overpass.expiresAt >= now);

    if (hasActiveOverpass) {
      const platformsWithAdminLinks = availablePlatforms
        .filter((p: any) => !!p.adminDefaultLink)
        .map((p: any) => ({
          ...p,
          referralLink: p.adminDefaultLink,
          linkOwner: "Admin",
        }));

      return platformsWithAdminLinks;
    }

    // Get user's sponsor
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { sponsorId: true },
    });

    // For each available platform, only return direct sponsor-submitted links
    if (!user?.sponsorId) {
      return [];
    }

    const sponsorId = user.sponsorId;

    // Fetch sponsor profile for name and role (needed for admin-link fallback)
    const sponsor = await ctx.prisma.user.findUnique({
      where: { id: sponsorId },
      select: { id: true, firstname: true, lastname: true, email: true, role: true },
    });

    const platformsWithLinks = await Promise.all(
      availablePlatforms.map(async (platform: any) => {
        // 1. Use sponsor's own submitted link if they have one
        const sponsorLink = await ctx.prisma.userThirdPartyLink.findUnique({
          where: {
            userId_platformId: {
              userId: sponsorId,
              platformId: platform.id,
            },
          },
          include: {
            User: {
              select: { firstname: true, lastname: true },
            },
          },
        });

        if (sponsorLink?.referralLink) {
          return {
            ...platform,
            referralLink: sponsorLink.referralLink,
            linkOwner:
              `${sponsorLink.User.firstname || ""} ${sponsorLink.User.lastname || ""}`.trim() ||
              "Your Sponsor",
          };
        }

        // 2. Fallback: if sponsor is the assigned default admin owner of this platform,
        //    and the platform has an adminDefaultLink, show that link.
        const sponsorRole = (sponsor?.role || "").toLowerCase();
        const sponsorIsAdmin =
          sponsorRole === "admin" || sponsorRole === "super_admin" || sponsorRole === "superadmin";
        const sponsorIsAssignedOwner =
          !!platform.defaultAdminUserId && platform.defaultAdminUserId === sponsorId;

        if (sponsorIsAdmin && sponsorIsAssignedOwner && platform.adminDefaultLink) {
          const ownerName =
            `${sponsor!.firstname || ""} ${sponsor!.lastname || ""}`.trim() ||
            sponsor!.email ||
            "Default Owner Admin";

          return {
            ...platform,
            referralLink: platform.adminDefaultLink,
            linkOwner: ownerName,
          };
        }

        return null;
      })
    );

    return platformsWithLinks.filter(Boolean);
    });
  }),

  // Submit user's referral link for a platform
  submitReferralLink: protectedProcedure
    .input(
      z.object({
        platformId: z.string(),
        referralLink: z.string().url({ message: "Please enter a valid URL" }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;

      // Check if platform exists and is active
      const platform = await ctx.prisma.thirdPartyPlatform.findFirst({
        where: {
          id: input.platformId,
          isActive: true,
        },
      });

      if (!platform) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform not found or inactive",
        });
      }

      // Ensure submitted referral URL belongs to the configured platform domain.
      if (platform.registrationUrl) {
        const baseHost = normalizeHostname(platform.registrationUrl);
        const referralHost = normalizeHostname(input.referralLink);

        if (baseHost && referralHost && !isSameDomainOrSubdomain(referralHost, baseHost)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Referral link must use the platform domain (${baseHost})`,
          });
        }
      }

      // Check if user already submitted a link for this platform
      const existingLink = await ctx.prisma.userThirdPartyLink.findUnique({
        where: {
          userId_platformId: {
            userId,
            platformId: input.platformId,
          },
        },
      });

      if (existingLink) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already submitted a link for this platform",
        });
      }

      // Create the user's referral link
      await ctx.prisma.userThirdPartyLink.create({
        data: {
          id: randomUUID(),
          userId,
          platformId: input.platformId,
          referralLink: input.referralLink,
          updatedAt: new Date(),
        },
      });
      clearThirdPartyUserCache(userId);

      // Submitting a link confirms the user completed external registration —
      // place them in their sponsor's third-party matrix (non-blocking).
      const userForPlacement = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { sponsorId: true },
      });
      if (userForPlacement?.sponsorId) {
        placeUserInThirdPartyMatrix({
          prisma: ctx.prisma,
          userId,
          sponsorId: userForPlacement.sponsorId,
          sourceFlow: "register",
        }).catch((err) => {
          console.error("[thirdPartyPlatforms.submitReferralLink] Matrix placement failed:", err);
        });
      }

      return {
        success: true,
        message: `Your ${platform.name} referral link has been saved successfully!`,
      };
    }),

  // Get user's submitted platforms with stats
  getMyPlatformsWithStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;
    const cacheKey = `${userId}:myPlatformsWithStats`;

    return getCachedThirdPartyQuery(cacheKey, async () => {

    // Get user's submitted links
    const userLinks = await ctx.prisma.userThirdPartyLink.findMany({
      where: { userId },
      include: {
          ThirdPartyPlatform: true,
      },
    });

    // Get total direct downlines count
    const directDownlines = await ctx.prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true },
    });

    const totalDirectDownlines = directDownlines.length;
    const downlineIds = directDownlines.map((d) => d.id);

    // For each platform, calculate stats
    const platformsWithStats = await Promise.all(
      userLinks.map(async (link: any) => {
        // Registration is completed when downline submits their own link for this platform.
        const registrations = await ctx.prisma.userThirdPartyLink.findMany({
          where: {
            platformId: link.platformId,
            userId: { in: downlineIds }, // Only count direct downlines
          },
          include: {
            User: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
              },
            },
          },
        });

        const registeredCount = registrations.length;
        const pendingCount = Math.max(0, totalDirectDownlines - registeredCount);
        const completionRate =
          totalDirectDownlines > 0
            ? Math.round((registeredCount / totalDirectDownlines) * 100)
            : 0;

        const reg = link.ThirdPartyPlatform;
        return {
          platform: reg,
          referralLink: link.referralLink,
          submittedAt: link.createdAt,
          updatedAt: link.updatedAt,
          totalDirectDownlines,
          registeredCount,
          pendingCount,
          completionRate,
          registeredUsers: registrations.map((r: any) => {
            const u = r.User;
            return {
              name: `${u?.firstname || ''} ${u?.lastname || ''}`.trim() || u?.email || 'Member',
              registeredAt: r.updatedAt || r.createdAt,
            };
          }),
        };
      })
    );

    return platformsWithStats;
    });
  }),

  // Get pending downlines for a specific platform (for reminders)
  getPendingDownlines: protectedProcedure
    .input(z.object({ platformId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;
      const cacheKey = `${userId}:pendingDownlines:${input.platformId}`;

      return getCachedThirdPartyQuery(cacheKey, async () => {

      // Get all direct downlines
      const directDownlines = await ctx.prisma.user.findMany({
        where: { sponsorId: userId },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
      });

      // Get downlines who already submitted a referral link for this platform.
      const registrations = await ctx.prisma.userThirdPartyLink.findMany({
        where: {
          platformId: input.platformId,
          userId: { in: directDownlines.map((d) => d.id) },
        },
        select: { userId: true },
      });

      const registeredUserIds = new Set(registrations.map((r: any) => r.userId));

      // Filter out registered users
      const pendingDownlines = directDownlines.filter(
        (downline) => !registeredUserIds.has(downline.id)
      );

      return pendingDownlines.map((d) => ({
        id: d.id,
        name: `${d.firstname || ''} ${d.lastname || ''}`.trim() || d.email || 'Member',
        email: d.email,
      }));
      });
    }),

  // Mark a registration (when user clicks sponsor's link and completes)
  markRegistration: protectedProcedure
    .input(
      z.object({
        platformId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user.id;

      // Executive Overpass: allow registration tracking even if sponsor is unavailable
      const overpass = await ctx.prisma.thirdPartyExecutiveOverpass.findUnique({
        where: { userId },
        select: { revokedAt: true, expiresAt: true },
      });
      const now = new Date();
      const hasActiveOverpass =
        !!overpass && !overpass.revokedAt && (!overpass.expiresAt || overpass.expiresAt >= now);

      // Get user's sponsor
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { sponsorId: true },
      });

      if (!user?.sponsorId && !hasActiveOverpass) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't have a sponsor",
        });
      }

      // Check if already registered
      const existing = await ctx.prisma.thirdPartyRegistration.findUnique({
        where: {
          userId_platformId: {
            userId,
            platformId: input.platformId,
          },
        },
      });

      if (existing) {
        return {
          success: true,
          message: "Registration already recorded",
        };
      }

      // Create registration record
      await ctx.prisma.thirdPartyRegistration.create({
        data: {
          id: randomUUID(),
          userId,
          platformId: input.platformId,
          // Keep sponsor attribution when sponsor exists; otherwise allow null under overpass
          referredByUserId: user?.sponsorId ?? null,
        },
      });
      clearThirdPartyUserCache(userId);

      return {
        success: true,
        message: "Registration recorded successfully",
      };
    }),

  // Get summary stats for dashboard card
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id;
    const cacheKey = `${userId}:summary`;

    return getCachedThirdPartyQuery(cacheKey, async () => {

    // Count total active platforms
    const totalPlatforms = await ctx.prisma.thirdPartyPlatform.count({
      where: { isActive: true },
    });

    // Count platforms user has completed (submitted links)
    const completedPlatforms = await ctx.prisma.userThirdPartyLink.count({
      where: { userId },
    });

    const pendingPlatforms = totalPlatforms - completedPlatforms;

    // Get total direct downlines
    const directDownlines = await ctx.prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true },
    });
    const totalDirectDownlines = directDownlines.length;

    // Team registered = number of direct downlines that submitted at least one link.
    const totalRegistrations = totalDirectDownlines
      ? (
          await ctx.prisma.userThirdPartyLink.findMany({
            where: { userId: { in: directDownlines.map((d) => d.id) } },
            select: { userId: true },
            distinct: ["userId"],
          })
        ).length
      : 0;

    return {
      totalPlatforms,
      completedPlatforms,
      pendingPlatforms,
      totalDirectDownlines,
      totalRegistrations,
    };
    });
  }),
});
