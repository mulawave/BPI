import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const referralRouter = createTRPCRouter({
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get referrals made by this user
    const referrals = await ctx.prisma.$queryRaw`
      SELECT 
        r.id,
        r.status,
        r."rewardPaid",
        r."createdAt",
        u.name as referredUserName,
        u.email as referredUserEmail
      FROM "Referral" r
      JOIN "User" u ON r."referredId" = u.id
      WHERE r."referrerId" = ${userId}
      ORDER BY r."createdAt" DESC
    `;

    return { referrals };
  }),

  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get referral statistics using Prisma aggregation
    const totalreferrals = await ctx.prisma.referral.count({
      where: { referrerId: userId }
    });

    const activereferrals = await ctx.prisma.referral.count({
      where: { 
        referrerId: userId,
        status: 'active'
      }
    });

    const paidreferrals = await ctx.prisma.referral.count({
      where: { 
        referrerId: userId,
        rewardPaid: true
      }
    });

    return {
      totalreferrals,
      activereferrals,
      paidreferrals,
    };
  }),

  // Get recent referrals (last 5)
  getRecentReferrals: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;

    // Get last 5 referrals made by this user
    const referrals = await ctx.prisma.$queryRaw<Array<{
      id: string;
      status: string;
      createdAt: Date;
      referredUserName: string;
      referredUserEmail: string;
    }>>`
      SELECT 
        r.id,
        r.status,
        r."createdAt",
        u.name as "referredUserName",
        u.email as "referredUserEmail"
      FROM "Referral" r
      JOIN "User" u ON r."referredId" = u.id
      WHERE r."referrerId" = ${userId}
      ORDER BY r."createdAt" DESC
      LIMIT 5
    `;

    return { referrals };
  }),

  // Get or generate encrypted referral link for the current user
  getMyReferralLink: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;
    
    // Get user data
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        referralLink: true,
        inviteCode: true
      }
    });
    
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }
    
    let inviteCode = user.inviteCode;
    
    // Generate unique encrypted invite code if user doesn't have one
    if (!inviteCode) {
      // Generate a secure 12-character alphanumeric code
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
      inviteCode = '';
      for (let i = 0; i < 12; i++) {
        inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await ctx.prisma.user.findUnique({
          where: { inviteCode }
        });
        if (!existing) {
          isUnique = true;
        } else {
          // Generate new code if collision
          inviteCode = '';
          for (let i = 0; i < 12; i++) {
            inviteCode += characters.charAt(Math.floor(Math.random() * characters.length));
          }
          attempts++;
        }
      }
      
      if (!isUnique) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate unique invite code"
        });
      }
      
      // Save the invite code to user
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { inviteCode }
      });
    }
    
    // Generate encrypted referral link
    // Format: https://beepagro.com/register?ref={encryptedCode}
    const referralLink = `https://beepagro.com/register?ref=${inviteCode}`;
    
    // Update referralLink field if different
    if (user.referralLink !== referralLink) {
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { referralLink }
      });
    }
    
    return {
      referralLink,
      inviteCode
    };
  }),

  // Get daily invite usage count
  getDailyInviteCount: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    const userId = (session!.user as any).id as string;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    const usage = await ctx.prisma.inviteUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today!
        }
      }
    });
    
    const used = usage?.count || 0;
    const remaining = Math.max(0, 10 - used);
    
    return {
      used,
      remaining,
      total: 10,
      canSend: remaining > 0
    };
  }),

  // Send referral invite
  sendReferralInvite: protectedProcedure
    .input(z.object({
      firstname: z.string().min(1, "First name is required"),
      lastname: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address")
    }))
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      const userId = (session!.user as any).id as string;
      const { firstname, lastname, email } = input;
      
      // 1. Check BPT balance
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { bpiTokenWallet: true, email: true, name: true }
      });
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }
      
      if (user.bpiTokenWallet < 0.5) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient BPT balance. You need at least 0.5 BPT to send an invite."
        });
      }
      
      // 2. Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const usage = await ctx.prisma.inviteUsage.findUnique({
        where: {
          userId_date: {
            userId,
            date: today!
          }
        }
      });
      
      if (usage && usage.count >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Daily invite limit reached (10 invites per day). Try again tomorrow."
        });
      }
      
      // 3. Check if contact already exists
      const existingContact = await ctx.prisma.contact.findUnique({
        where: {
          userId_email: {
            userId,
            email
          }
        }
      });
      
      // 4. Deduct BPT
      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          bpiTokenWallet: {
            decrement: 0.5
          }
        }
      });
      
      // 5. Create or update contact record
      if (existingContact) {
        // Update existing contact with new invite date
        await ctx.prisma.contact.update({
          where: {
            userId_email: {
              userId,
              email
            }
          },
          data: {
            dateInvited: new Date(),
            bptSpent: {
              increment: 0.5
            }
          }
        });
      } else {
        // Create new contact
        await ctx.prisma.contact.create({
          data: {
            userId,
            firstname,
            lastname,
            email,
            bptSpent: 0.5
          }
        });
      }
      
      // 6. Update daily invite counter
      if (usage) {
        await ctx.prisma.inviteUsage.update({
          where: {
            userId_date: {
              userId,
              date: today!
            }
          },
          data: {
            count: {
              increment: 1
            }
          }
        });
      } else {
        await ctx.prisma.inviteUsage.create({
          data: {
            userId,
            date: today!,
            count: 1
          }
        });
      }
      
      // 7. Send email (console.log for now - will use SMTP later)
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  BPI REFERRAL INVITE EMAIL                     ║
╠════════════════════════════════════════════════════════════════╣
║ To: ${email.padEnd(57)}║
║ From: ${user.email?.padEnd(55)}║
║ Subject: ${`${user.name} invited you to join BPI!`.padEnd(47)}║
╠════════════════════════════════════════════════════════════════╣
║ Hi ${firstname} ${lastname},                                   
║                                                                ║
║ ${user.name} has invited you to join the BPI community!       
║                                                                ║
║ Click the link below to register:                             ║
║ https://bpi.beepagro.com/register?ref=${userId}                
║                                                                ║
║ Best regards,                                                  ║
║ The BPI Team                                                   ║
╚════════════════════════════════════════════════════════════════╝
      `);
      
      return {
        success: true,
        message: existingContact 
          ? `Invite resent to ${email}. 0.5 BPT deducted.`
          : `Invite sent to ${email}. Contact added. 0.5 BPT deducted.`,
        isResend: !!existingContact
      };
    }),
});