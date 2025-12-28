import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { getReferralChain } from "@/server/services/referral.service";
import { distributeBptReward } from "@/server/services/rewards.service";
import {
  notifyMembershipActivation,
  notifyMembershipRenewal,
  notifyEmpowermentActivation,
  notifyEmpowermentMaturity,
  notifyEmpowermentApproval,
  notifyEmpowermentRelease,
  notifyAdminEmpowermentPending,
  notifyReferralReward,
} from "@/server/services/notification.service";

export const packageRouter = createTRPCRouter({
  getPackages: publicProcedure.query(async () => {
    return await prisma.membershipPackage.findMany();
  }),

  activateStandard: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId } = input;

      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      // TODO: Implement actual payment processing logic here
      const paymentSuccessful = true;

      if (!paymentSuccessful) {
        throw new Error("Payment failed.");
      }

      // Set membership activation and expiry dates
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt);
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year

      // Get the referral chain (L1 to L4)
      const referralChain = await getReferralChain(userId, 4);

      // Distribute rewards to referrers
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;

        const cashReward = (membershipPackage as any)[`cash_l${level}`] || 0;
        const palliativeReward = (membershipPackage as any)[`palliative_l${level}`] || 0;
        const bptReward = (membershipPackage as any)[`bpt_l${level}`] || 0;
        const cashbackReward = (membershipPackage as any)[`cashback_l${level}`] || 0;

        // Build update data object
        const updateData: any = {};
        if (cashReward > 0) updateData.wallet = { increment: cashReward };
        if (palliativeReward > 0) updateData.palliative = { increment: palliativeReward };
        if (cashbackReward > 0) updateData.cashback = { increment: cashbackReward };

        // Update referrer wallets
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: updateData,
          });
        }

        // Distribute BPT rewards using the 50/50 split service
        if (bptReward > 0) {
          await distributeBptReward(
            referrer.id, 
            bptReward, 
            `REFERRAL_L${level}`,
            `Referral reward L${level} from ${membershipPackage.name} activation`
          );
        }
        
        // Handle shelter rewards for Gold Plus and Platinum Plus (10 levels)
        if (membershipPackage.name === "Gold Plus" || membershipPackage.name === "Platinum Plus") {
          const shelterLevel = level; // L1-L4 only for now
          const shelterAmount = (membershipPackage as any)[`shelter_l${shelterLevel}`];
          
          if (shelterAmount && shelterAmount > 0) {
            // Update shelter wallet
            await prisma.user.update({
              where: { id: referrer.id },
              data: {
                shelter: { increment: shelterAmount }
              }
            });
            
            // Record shelter reward (admin-only visibility)
            await prisma.shelterReward.create({
              data: {
                userId: referrer.id,
                level: shelterLevel,
                amount: shelterAmount,
                packageType: membershipPackage.name === "Gold Plus" ? "GOLD_PLUS" : "PLATINUM_PLUS",
                sourceActivationId: packageId,
              }
            });
          }
        }
      }
      
      // Update the user's active package and membership dates
      await prisma.user.update({
        where: { id: userId },
        data: { 
          activeMembershipPackageId: packageId,
          membershipActivatedAt: activatedAt,
          membershipExpiresAt: expiresAt,
          activated: true,
        },
      });

      // Send activation notification
      await notifyMembershipActivation(userId, membershipPackage.name, expiresAt);

      return { 
        success: true, 
        message: `${membershipPackage.name} package activated successfully!`,
        expiresAt 
      };
    }),
  
  activateEmpowerment: protectedProcedure
    .input(z.object({ 
      beneficiaryId: z.string(),
      empowermentType: z.enum(["CHILD_EDUCATION", "VOCATIONAL_SKILL"])
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const sponsorId = (ctx.session.user as any).id;
      const { beneficiaryId, empowermentType } = input;

      // 1. Validate beneficiary
      const beneficiary = await prisma.user.findUnique({
        where: { id: beneficiaryId },
      });

      if (!beneficiary) {
        throw new Error("Beneficiary user not found.");
      }
      
      // TODO: Add payment logic for the empowerment package fee (₦354,750)
      const PACKAGE_FEE = 330000;
      const VAT = 24750;
      const TOTAL_COST = PACKAGE_FEE + VAT; // ₦354,750

      // 2. Define package constants
      const GROSS_EMPOWERMENT_VALUE = 7250000;
      const GROSS_SPONSOR_REWARD = 1000000;
      const TAX_RATE = 0.075;

      // 3. Calculate net values (tax applied at release, not upfront)
      const netEmpowermentValue = GROSS_EMPOWERMENT_VALUE * (1 - TAX_RATE);
      const netSponsorReward = GROSS_SPONSOR_REWARD * (1 - TAX_RATE);

      // 4. Set maturity date (24 months from now)
      const activatedAt = new Date();
      const maturityDate = new Date(activatedAt);
      maturityDate.setMonth(maturityDate.getMonth() + 24);

      // 5. Create the EmpowermentPackage record
      const empowermentPackage = await prisma.empowermentPackage.create({
        data: {
          sponsorId,
          beneficiaryId,
          packageFee: PACKAGE_FEE,
          vat: VAT,
          empowermentType,
          status: "Active - Countdown Running",
          activatedAt,
          maturityDate,
          grossEmpowermentValue: GROSS_EMPOWERMENT_VALUE,
          netEmpowermentValue,
          grossSponsorReward: GROSS_SPONSOR_REWARD,
          netSponsorReward,
          beneficiaryCanView: true,
          beneficiaryCanWithdraw: false,
        },
      });

      // 6. Link beneficiary to sponsor if not already linked
      await prisma.user.update({
        where: { id: beneficiaryId },
        data: { sponsorId: sponsorId },
      });
      
      // 7. Create activation transaction record
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentPackage.id,
          transactionType: "ACTIVATION",
          grossAmount: TOTAL_COST,
          taxAmount: 0, // No tax on activation
          netAmount: TOTAL_COST,
          description: "Empowerment package activated - 24-month countdown started",
        }
      });

      // Send activation notifications to sponsor and beneficiary
      await notifyEmpowermentActivation(sponsorId, beneficiaryId, maturityDate);

      return { 
        success: true, 
        message: "Empowerment package activated successfully. 24-month countdown has begun.",
        maturityDate 
      };
    }),

  renewMembership: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { packageId } = input;

      // 1. Get user's current membership
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          packageActivations: {
            where: { packageId },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!user || !user.activeMembershipPackageId) {
        throw new Error("No active membership found.");
      }

      // 2. Get the package details
      const membershipPackage = await prisma.membershipPackage.findUnique({
        where: { id: packageId },
      });

      if (!membershipPackage) {
        throw new Error("Membership package not found.");
      }

      if (!membershipPackage.hasRenewal) {
        throw new Error("This package does not support renewal.");
      }

      // 3. Check if membership has expired or is close to expiry
      const now = new Date();
      const expiresAt = user.membershipExpiresAt;
      
      if (expiresAt && expiresAt > new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        throw new Error("Membership is not yet eligible for renewal. Must be within 30 days of expiration.");
      }

      // TODO: Implement actual payment processing
      const renewalFee = membershipPackage.renewalFee || membershipPackage.price;
      const vat = renewalFee * 0.075;
      const totalCost = renewalFee + vat;

      // 4. Calculate new expiry date
      const newExpiresAt = expiresAt && expiresAt > now 
        ? new Date(expiresAt.getTime() + (membershipPackage.renewalCycle * 24 * 60 * 60 * 1000))
        : new Date(now.getTime() + (membershipPackage.renewalCycle * 24 * 60 * 60 * 1000));

      // 5. Get referral chain for renewal rewards
      const referralChain = await getReferralChain(userId, 4);

      // Track total rewards distributed
      let totalCash = 0, totalPalliative = 0, totalBpt = 0, totalCashback = 0;
      let totalHealth = 0, totalMeal = 0, totalSecurity = 0;

      // 6. Distribute renewal rewards to referrers
      for (let i = 0; i < referralChain.length; i++) {
        const referrer = referralChain[i];
        const level = (i + 1) as 1 | 2 | 3 | 4;

        const cashReward = (membershipPackage as any)[`renewal_cash_l${level}`] || 0;
        const palliativeReward = (membershipPackage as any)[`renewal_palliative_l${level}`] || 0;
        const bptReward = (membershipPackage as any)[`renewal_bpt_l${level}`] || 0;
        const cashbackReward = (membershipPackage as any)[`renewal_cashback_l${level}`] || 0;
        const healthReward = (membershipPackage as any)[`renewal_health_l${level}`] || 0;
        const mealReward = (membershipPackage as any)[`renewal_meal_l${level}`] || 0;
        const securityReward = (membershipPackage as any)[`renewal_security_l${level}`] || 0;

        // Build update data
        const updateData: any = {};
        if (cashReward > 0) { updateData.wallet = { increment: cashReward }; totalCash += cashReward; }
        if (palliativeReward > 0) { updateData.palliative = { increment: palliativeReward }; totalPalliative += palliativeReward; }
        if (cashbackReward > 0) { updateData.cashback = { increment: cashbackReward }; totalCashback += cashbackReward; }
        if (healthReward > 0) { updateData.health = { increment: healthReward }; totalHealth += healthReward; }
        if (mealReward > 0) { updateData.meal = { increment: mealReward }; totalMeal += mealReward; }
        if (securityReward > 0) { updateData.security = { increment: securityReward }; totalSecurity += securityReward; }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: updateData,
          });
        }

        // Distribute BPT rewards
        if (bptReward > 0) {
          await distributeBptReward(
            referrer.id,
            bptReward,
            `RENEWAL_L${level}`,
            `Renewal reward L${level} from ${membershipPackage.name} renewal`
          );
          totalBpt += bptReward;
        }
      }

      // 7. Update user's membership expiry and renewal count
      await prisma.user.update({
        where: { id: userId },
        data: {
          membershipExpiresAt: newExpiresAt,
          renewalCount: { increment: 1 },
        },
      });

      // 8. Create renewal history record
      await prisma.renewalHistory.create({
        data: {
          userId,
          packageId,
          packageName: membershipPackage.name,
          renewalNumber: user.renewalCount + 1,
          renewalFee,
          vat,
          totalPaid: totalCost,
          expiresAt: newExpiresAt,
          cashDistributed: totalCash,
          bptDistributed: totalBpt,
          palliativeDistributed: totalPalliative,
          cashbackDistributed: totalCashback,
          healthDistributed: totalHealth,
          mealDistributed: totalMeal,
          securityDistributed: totalSecurity,
        },
      });

      // Send renewal notification
      await notifyMembershipRenewal(userId, membershipPackage.name, user.renewalCount + 1, newExpiresAt);

      return {
        success: true,
        message: `Membership renewed successfully! Valid until ${newExpiresAt.toLocaleDateString()}`,
        expiresAt: newExpiresAt,
        renewalNumber: user.renewalCount + 1,
      };
    }),

  // Empowerment Package Lifecycle Endpoints
  
  checkEmpowermentMaturity: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      const now = new Date();
      if (empowerment.maturityDate > now) {
        throw new Error("Package has not yet reached maturity (24 months).");
      }

      // Update status to pending maturity
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          status: "Pending Maturity (24 Months)",
        },
      });

      // Create transaction record
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentId,
          transactionType: "MATURITY",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: 0,
          netAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          description: "Package reached 24-month maturity - pending admin approval",
          performedBy: (ctx.session.user as any).id,
        },
      });

      // Notify sponsor, beneficiary, and admins
      await notifyEmpowermentMaturity(empowerment.sponsorId, empowerment.beneficiaryId, empowermentId);
      const sponsor = await prisma.user.findUnique({ where: { id: empowerment.sponsorId } });
      await notifyAdminEmpowermentPending(empowermentId, sponsor?.name || "Unknown");

      return {
        success: true,
        message: "Empowerment package marked as mature. Awaiting admin approval.",
      };
    }),

  approveEmpowerment: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.status !== "Pending Maturity (24 Months)") {
        throw new Error("Package must be at maturity status to approve.");
      }

      const now = new Date();
      const TAX_RATE = 0.075;
      const totalTax = (empowerment.grossEmpowermentValue + empowerment.grossSponsorReward) * TAX_RATE;

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          adminApproved: true,
          approvedBy: adminId,
          approvedAt: now,
          status: "Approved - Activation Pending",
          totalTaxDeducted: totalTax,
        },
      });

      // Create approval transaction
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentId,
          transactionType: "APPROVAL",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: totalTax,
          netAmount: empowerment.netEmpowermentValue + empowerment.netSponsorReward,
          description: "Admin approved empowerment release - 7.5% tax calculated",
          performedBy: adminId,
        },
      });

      // Notify sponsor and beneficiary
      await notifyEmpowermentApproval(
        empowerment.sponsorId,
        empowerment.beneficiaryId,
        empowerment.netEmpowermentValue,
        empowerment.netSponsorReward
      );

      return {
        success: true,
        message: "Empowerment approved successfully. Ready for fund release.",
        netAmounts: {
          beneficiary: empowerment.netEmpowermentValue,
          sponsor: empowerment.netSponsorReward,
          totalTax,
        },
      };
    }),

  releaseEmpowermentFunds: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.status !== "Approved - Activation Pending") {
        throw new Error("Package must be approved before releasing funds.");
      }

      const now = new Date();

      // Credit beneficiary (education/skill-restricted, non-withdrawable)
      await prisma.user.update({
        where: { id: empowerment.beneficiaryId },
        data: {
          education: { increment: empowerment.netEmpowermentValue },
        },
      });

      // Credit sponsor (fully available)
      await prisma.user.update({
        where: { id: empowerment.sponsorId },
        data: {
          wallet: { increment: empowerment.netSponsorReward },
        },
      });

      // Update empowerment status
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          status: "Empowerment Released (Tax Applied)",
          releasedAt: now,
        },
      });

      // Create release transaction
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentId,
          transactionType: "RELEASE",
          grossAmount: empowerment.grossEmpowermentValue + empowerment.grossSponsorReward,
          taxAmount: empowerment.totalTaxDeducted,
          netAmount: empowerment.netEmpowermentValue + empowerment.netSponsorReward,
          description: `Released ₦${empowerment.netEmpowermentValue.toLocaleString()} to beneficiary (education wallet), ₦${empowerment.netSponsorReward.toLocaleString()} to sponsor`,
          performedBy: adminId,
        },
      });

      // Notify sponsor and beneficiary of fund release
      await notifyEmpowermentRelease(
        empowerment.sponsorId,
        empowerment.beneficiaryId,
        empowerment.netEmpowermentValue,
        empowerment.netSponsorReward
      );

      return {
        success: true,
        message: "Empowerment funds released successfully!",
        released: {
          beneficiary: empowerment.netEmpowermentValue,
          sponsor: empowerment.netSponsorReward,
        },
      };
    }),

  triggerFallbackProtection: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userRole = (ctx.session?.user as any)?.role;
      if (!ctx.session?.user || userRole !== "admin") {
        throw new Error("UNAUTHORIZED - Admin only");
      }
      const adminId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      // Verify 24 months have passed
      const now = new Date();
      if (empowerment.maturityDate > now) {
        throw new Error("Fallback can only be triggered after 24-month maturity.");
      }

      // Calculate fallback amounts
      const fallbackGross = empowerment.fallbackGrossAmount;
      const fallbackNet = empowerment.fallbackNetAmount;
      const taxAmount = fallbackGross - fallbackNet;

      // Credit sponsor's wallet with fallback amount
      await prisma.user.update({
        where: { id: empowerment.sponsorId },
        data: {
          wallet: { increment: fallbackNet },
        },
      });

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          fallbackEnabled: true,
          status: "Fallback Protection Activated",
          totalTaxDeducted: taxAmount,
        },
      });

      // Create fallback transaction
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentId,
          transactionType: "FALLBACK",
          grossAmount: fallbackGross,
          taxAmount,
          netAmount: fallbackNet,
          description: "Fallback protection activated - Insurance-backed refund released to sponsor",
          performedBy: adminId,
        },
      });

      return {
        success: true,
        message: "Fallback protection activated successfully.",
        fallbackAmount: fallbackNet,
      };
    }),

  convertToRegularPlus: protectedProcedure
    .input(z.object({ empowermentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user) {
        throw new Error("UNAUTHORIZED");
      }
      const userId = (ctx.session.user as any).id;
      const { empowermentId } = input;

      const empowerment = await prisma.empowermentPackage.findUnique({
        where: { id: empowermentId },
      });

      if (!empowerment) {
        throw new Error("Empowerment package not found.");
      }

      if (empowerment.sponsorId !== userId) {
        throw new Error("Only the sponsor can request conversion.");
      }

      if (empowerment.isConverted) {
        throw new Error("Package has already been converted.");
      }

      // Get user's wallet balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      const CONVERSION_COST = 64000; // ₦64,000 for Regular Plus + MYNGUL
      const COMMUNITY_CREDIT = 332000; // ₦332,000 restricted to community

      if (user.wallet < CONVERSION_COST) {
        throw new Error(`Insufficient balance. Need ₦${CONVERSION_COST.toLocaleString()} for conversion.`);
      }

      // Find Regular Plus package
      const regularPlusPackage = await prisma.membershipPackage.findFirst({
        where: { name: "Regular Plus" },
      });

      if (!regularPlusPackage) {
        throw new Error("Regular Plus package not found.");
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 365);

      // Deduct conversion cost, credit community wallet, activate Regular Plus
      await prisma.user.update({
        where: { id: userId },
        data: {
          wallet: { decrement: CONVERSION_COST },
          community: { increment: COMMUNITY_CREDIT },
          activeMembershipPackageId: regularPlusPackage.id,
          membershipActivatedAt: now,
          membershipExpiresAt: expiresAt,
          activated: true,
        },
      });

      // Update empowerment package
      await prisma.empowermentPackage.update({
        where: { id: empowermentId },
        data: {
          isConverted: true,
          convertedAt: now,
          conversionAmount: CONVERSION_COST,
          walletCreditAmount: COMMUNITY_CREDIT,
          status: "Converted to Regular Plus",
        },
      });

      // Create conversion transaction
      await prisma.empowermentTransaction.create({
        data: {
          empowermentPackageId: empowermentId,
          transactionType: "CONVERSION",
          grossAmount: CONVERSION_COST,
          taxAmount: 0,
          netAmount: CONVERSION_COST,
          description: `Converted to Regular Plus - ₦${COMMUNITY_CREDIT.toLocaleString()} credited to community wallet (restricted)`,
          performedBy: userId,
        },
      });

      return {
        success: true,
        message: "Successfully converted to Regular Plus membership!",
        communityCredit: COMMUNITY_CREDIT,
        newExpiry: expiresAt,
      };
    }),
});
