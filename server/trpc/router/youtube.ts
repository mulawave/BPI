import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyChannelCode } from "@/lib/youtubeApi";
import { notifyYoutubeReferralEarning } from "@/server/services/notification.service";
import { randomUUID } from "crypto";

export const youtubeRouter = createTRPCRouter({
  // Get available YouTube subscription plans from database
  getPlans: publicProcedure.query(async () => {
    const plans = await prisma.youtubePlan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });
    return plans;
  }),

  // Get user's submitted channel or draft
  getUserChannel: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const channel = await prisma.youtubeChannel.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" }
    });
    return channel;
  }),

  // Check if user has a draft or active subscription
  checkDraftStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const userId = ctx.session.user.id;

    // Check for existing draft
    const draft = await prisma.youtubeChannel.findFirst({
      where: { 
        userId,
        status: 'DRAFT'
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check for active provider (paid plan)
    const provider = await prisma.youtubeProvider.findUnique({
      where: { userId },
      include: { YoutubePlan: true }
    });

    return {
      hasDraft: !!draft,
      draftData: draft,
      hasActivePlan: !!provider,
      providerData: provider
    };
  }),

  // Purchase a YouTube plan - Option 2: Deduct immediately, create draft
  purchasePlan: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;

      // Get plan from database
      const plan = await prisma.youtubePlan.findFirst({
        where: { id: input.planId, isActive: true }
      });
      
      if (!plan) throw new Error("Invalid plan");

      // Check if user already has an active provider
      const existingProvider = await prisma.youtubeProvider.findUnique({
        where: { userId }
      });

      if (existingProvider) {
        throw new Error("You already have an active YouTube plan. Please upgrade instead.");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { wallet: true, spendable: true }
      });

      if (!user) throw new Error("User not found");

      const availableFunds = (user.wallet || 0) + (user.spendable || 0);
      const totalCost = Number(plan.amount) + Number(plan.vat);

      if (availableFunds < totalCost) {
        throw new Error("Insufficient wallet balance. Please top up your wallet.");
      }

      // Deduct payment immediately (Option 2)
      const newBalance = availableFunds - totalCost;
      await prisma.user.update({
        where: { id: userId },
        data: { wallet: newBalance }
      });

      // Create transaction records
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "debit",
          amount: -Math.abs(Number(plan.amount)),
          description: `YouTube Growth - ${plan.name}`,
          status: "completed"
        }
      });

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: "debit",
          amount: -Math.abs(Number(plan.vat)),
          description: `VAT - YouTube ${plan.name}`,
          status: "completed"
        }
      });

      // Create YoutubeProvider record with subscription balance
      const provider = await prisma.youtubeProvider.create({
        data: {
          id: randomUUID(),
          userId,
          youtubePlanId: plan.id,
          balance: plan.totalSub,
          updatedAt: new Date()
        }
      });

      // Create draft YoutubeChannel record
      const verificationCode = `BPI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const draft = await prisma.youtubeChannel.create({
        data: {
          id: randomUUID(),
          userId,
          status: 'DRAFT',
          verificationCode,
          isVerified: false,
          updatedAt: new Date()
        }
      });

      return { 
        success: true, 
        message: `Plan activated! You have ${plan.totalSub} subscription slots. Complete your channel submission.`,
        draftId: draft.id,
        verificationCode
      };
    }),

  // Save draft as user types
  saveDraft: protectedProcedure
    .input(z.object({
      draftId: z.string(),
      channelName: z.string().optional(),
      channelUrl: z.string().optional(),
      channelLink: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;
      const { draftId, ...updateData } = input;

      const draft = await prisma.youtubeChannel.findUnique({
        where: { id: draftId }
      });

      if (!draft) throw new Error("Draft not found");
      if (draft.userId !== userId) throw new Error("Unauthorized");
      if (draft.status !== 'DRAFT') throw new Error("Channel already submitted");

      await prisma.youtubeChannel.update({
        where: { id: draftId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      return { success: true, message: "Draft saved" };
    }),

  // Submit YouTube channel for verification (final submission)
  submitChannel: protectedProcedure
    .input(z.object({
      draftId: z.string().optional(),
      channelName: z.string(),
      channelUrl: z.string(),
      channelLink: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;
      const { draftId, ...channelData } = input;

      // If draftId provided, update existing draft
      if (draftId) {
        const draft = await prisma.youtubeChannel.findUnique({
          where: { id: draftId }
        });

        if (!draft) throw new Error("Draft not found");
        if (draft.userId !== userId) throw new Error("Unauthorized");

        await prisma.youtubeChannel.update({
          where: { id: draftId },
          data: {
            ...channelData,
            status: 'SUBMITTED',
            updatedAt: new Date()
          }
        });

        return {
          success: true,
          verificationCode: draft.verificationCode,
          message: `Please add the verification code: ${draft.verificationCode} to your YouTube channel description.`
        };
      } 
      
      // Otherwise create new channel (should rarely happen)
      const existingChannel = await prisma.youtubeChannel.findFirst({
        where: { userId }
      });

      if (existingChannel) {
        throw new Error("You already have a submitted channel. Use the draft system instead.");
      }

      const verificationCode = `BPI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await prisma.youtubeChannel.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          userId,
          ...channelData,
          verificationCode,
          status: 'SUBMITTED',
          isVerified: false
        }
      });

      return {
        success: true,
        verificationCode,
        message: `Please add the verification code: ${verificationCode} to your YouTube channel description.`
      };
    }),

  // Retry channel verification
  retryVerification: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await prisma.youtubeChannel.findUnique({
        where: { id: input.channelId }
      });

      if (!channel) throw new Error("Channel not found");
      if (!ctx.session?.user?.id || channel.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      if (!channel.channelUrl || !channel.verificationCode) {
        throw new Error("Channel URL or verification code missing");
      }

      // Use YouTube API to verify
      const result = await verifyChannelCode(channel.channelUrl, channel.verificationCode);

      if (result.verified && result.channelData) {
        // Update channel as verified
        await prisma.youtubeChannel.update({
          where: { id: channel.id },
          data: {
            isVerified: true,
            status: 'VERIFIED',
            channelLogo: result.channelData.thumbnailUrl,
            channelName: result.channelData.title,
          }
        });

        return {
          success: true,
          message: "Channel successfully verified!",
          channelData: result.channelData
        };
      }

      return {
        success: false,
        message: "Verification code not found in channel description. Please add it and try again."
      };
    }),

  // Get YouTube channel videos
  getChannelVideos: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(10)
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Implement actual YouTube API integration
      // For now, return empty array
      return [];
    }),

  // Get specific video details
  getVideoDetails: publicProcedure
    .input(z.object({
      videoId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // TODO: Implement actual YouTube API integration
      // For now, return null
      return null;
    }),

  // Get featured videos
  getFeaturedVideos: publicProcedure
    .query(async ({ ctx }) => {
      // TODO: Implement actual YouTube API integration
      // For now, return empty array
      return [];
    }),

  // Get verified channels for browsing/subscription
  getVerifiedChannels: publicProcedure.query(async () => {
    const channels = await prisma.youtubeChannel.findMany({
      where: { 
        isVerified: true,
        status: 'VERIFIED'
      },
      include: {
        User: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            profilePic: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return channels;
  }),

  // Get user's active provider (plan + balance)
  getMyProvider: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const userId = ctx.session.user.id;
    const provider = await prisma.youtubeProvider.findUnique({
      where: { userId },
      include: { YoutubePlan: true }
    });
    return provider;
  }),

  // Subscribe to a verified channel
  subscribeToChannel: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session || !ctx.session.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;
      const { channelId } = input;

      // Verify channel exists and is verified
      const channel = await prisma.youtubeChannel.findUnique({
        where: { id: channelId }
      });

      if (!channel || !channel.isVerified) {
        throw new Error("Channel not found or not verified");
      }

      // Check if user is trying to subscribe to their own channel
      if (channel.userId === userId) {
        throw new Error("You cannot subscribe to your own channel");
      }

      // Check if already subscribed
      const existingSubscription = await prisma.channelSubscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: userId,
            channelId
          }
        }
      });

      if (existingSubscription) {
        throw new Error("You are already subscribed to this channel");
      }

      // Create subscription with pending status
      await prisma.channelSubscription.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
          subscriberId: userId,
          channelId,
          status: 'pending'
        }
      });

      return { 
        success: true, 
        message: "Subscription recorded! Please subscribe on YouTube. Earnings will be credited after verification." 
      };
    }),

  // Get user's earnings from subscriptions
  getMyEarnings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const userId = ctx.session.user.id;
    
    // Get all earnings
    const earnings = await prisma.userEarning.findMany({
      where: { userId },
      include: {
        YoutubeChannel: {
          select: {
            channelName: true,
            channelUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const paidEarnings = earnings.filter(e => e.isPaid).reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingEarnings = totalEarnings - paidEarnings;

    return {
      totalEarnings,
      paidEarnings,
      pendingEarnings,
      earnings
    };
  }),

  // Get user's channel subscriptions (used by Browse Channels UI)
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const userId = ctx.session.user.id;

    return await prisma.channelSubscription.findMany({
      where: { subscriberId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        channelId: true,
        status: true,
        subscriptionDate: true,
        verifiedAt: true,
        paidAt: true,
        createdAt: true,
      },
    });
  }),

  // Get pending subscriptions (subscriptions awaiting verification)
  getPendingSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) throw new Error("Unauthorized");
    const userId = ctx.session.user.id;
    
    const subscriptions = await prisma.channelSubscription.findMany({
      where: { 
        subscriberId: userId,
        status: 'pending'
      },
      include: {
        YoutubeChannel: {
          select: {
            channelName: true,
            channelUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return subscriptions;
  }),

  // Manual claim earnings (admin or automated system calls this)
  processSubscriptionPayment: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { subscriptionId } = input;

      // Get subscription
      const subscription = await prisma.channelSubscription.findUnique({
        where: { id: subscriptionId },
        include: {
          YoutubeChannel: true,
          User: true
        }
      });

      if (!subscription) throw new Error("Subscription not found");
      if (subscription.status !== 'pending') {
        throw new Error("Subscription already processed");
      }

      const subscriberId = subscription.subscriberId;
      const channelOwnerId = subscription.YoutubeChannel.userId;

      // Get subscriber's referrer
      const referral = await prisma.referral.findFirst({
        where: { referredId: subscriberId }
      });

      const subscriberEarning = new Prisma.Decimal(40);
      const referrerEarning = new Prisma.Decimal(10);

      // Pay subscriber ₦40
      await prisma.user.update({
        where: { id: subscriberId },
        data: {
          wallet: {
            increment: Number(subscriberEarning)
          }
        }
      });

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: subscriberId,
          transactionType: 'credit',
          amount: Number(subscriberEarning),
          description: 'BPI Youtube Subscription Earnings',
          status: 'completed'
        }
      });

      await prisma.userEarning.create({
        data: {
          id: randomUUID(),
          userId: subscriberId,
          channelId: subscription.channelId,
          amount: subscriberEarning,
          type: 'subscription',
          isPaid: true
        }
      });

      // Pay referrer ₦10 (if exists)
      if (referral) {
        await prisma.user.update({
          where: { id: referral.referrerId },
          data: {
            wallet: {
              increment: Number(referrerEarning)
            }
          }
        });

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: referral.referrerId,
            transactionType: 'credit',
            amount: Number(referrerEarning),
            description: 'BPI Youtube Subscription Referral Earnings',
            status: 'completed'
          }
        });

        await prisma.userEarning.create({
          data: {
            id: randomUUID(),
            userId: referral.referrerId,
            channelId: subscription.channelId,
            amount: referrerEarning,
            type: 'referral',
            isPaid: true
          }
        });

        const subscriberName =
          subscription.User?.firstname ||
          subscription.User?.name ||
          subscription.User?.email ||
          "your referral";
        await notifyYoutubeReferralEarning(referral.referrerId, subscriberName, Number(referrerEarning));
      }

      // Decrement channel owner's provider balance
      await prisma.youtubeProvider.update({
        where: { userId: channelOwnerId },
        data: {
          balance: {
            decrement: 1
          }
        }
      });

      // Update subscription status
      await prisma.channelSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'paid',
          verifiedAt: new Date(),
          paidAt: new Date()
        }
      });

      return {
        success: true,
        message: `Payment processed: ₦${subscriberEarning} to subscriber${referral ? `, ₦${referrerEarning} to referrer` : ''}`,
        subscriberEarning: Number(subscriberEarning),
        referrerEarning: referral ? Number(referrerEarning) : 0
      };
    }),

  // Claim earnings
  claimEarnings: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;
      const { channelId } = input;

      const subscription = await prisma.channelSubscription.findUnique({
        where: {
          subscriberId_channelId: {
            subscriberId: userId,
            channelId,
          },
        },
        include: {
          YoutubeChannel: {
            select: { userId: true },
          },
        },
      });

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      if (subscription.status === "paid") {
        return { success: true, message: "Earnings already claimed", amount: 0 };
      }

      const existingPaidEarning = await prisma.userEarning.findFirst({
        where: {
          userId,
          channelId,
          type: "subscription",
          isPaid: true,
        },
        select: { id: true },
      });

      if (existingPaidEarning) {
        return { success: true, message: "Earnings already claimed", amount: 0 };
      }

      const provider = await prisma.youtubeProvider.findUnique({
        where: { userId: subscription.YoutubeChannel.userId },
        select: { id: true, balance: true },
      });

      if (!provider) {
        throw new Error("Channel provider not found");
      }

      if (provider.balance <= 0) {
        throw new Error("Channel has no remaining subscription balance");
      }

      const referral = await prisma.referral.findFirst({
        where: { referredId: subscription.subscriberId },
        select: { referrerId: true },
      });

      const subscriberEarning = 40;
      const referrerEarning = 10;

      await prisma.$transaction(async (tx) => {
        const sub = await tx.channelSubscription.findUnique({
          where: { id: subscription.id },
          select: { status: true },
        });

        if (!sub || sub.status === "paid") {
          throw new Error("Earnings already claimed");
        }

        const providerCurrent = await tx.youtubeProvider.findUnique({
          where: { userId: subscription.YoutubeChannel.userId },
          select: { balance: true },
        });

        if (!providerCurrent || providerCurrent.balance <= 0) {
          throw new Error("Channel has no remaining subscription balance");
        }

        // Credit subscriber
        await tx.user.update({
          where: { id: subscription.subscriberId },
          data: {
            wallet: { increment: subscriberEarning },
          },
        });

        await tx.transaction.create({
          data: {
            id: randomUUID(),
            userId: subscription.subscriberId,
            transactionType: "credit",
            amount: subscriberEarning,
            description: "BPI Youtube Subscription Earnings",
            status: "completed",
          },
        });

        await tx.userEarning.create({
          data: {
            id: randomUUID(),
            userId: subscription.subscriberId,
            channelId: subscription.channelId,
            amount: subscriberEarning,
            type: "subscription",
            isPaid: true,
          },
        });

        // Credit referrer (if any)
        if (referral) {
          await tx.user.update({
            where: { id: referral.referrerId },
            data: {
              wallet: { increment: referrerEarning },
            },
          });

          await tx.transaction.create({
            data: {
              id: randomUUID(),
              userId: referral.referrerId,
              transactionType: "credit",
              amount: referrerEarning,
              description: "BPI Youtube Subscription Referral Earnings",
              status: "completed",
            },
          });

          await tx.userEarning.create({
            data: {
              id: randomUUID(),
              userId: referral.referrerId,
              channelId: subscription.channelId,
              amount: referrerEarning,
              type: "referral",
              isPaid: true,
            },
          });
        }

        // Decrement provider balance
        await tx.youtubeProvider.update({
          where: { userId: subscription.YoutubeChannel.userId },
          data: {
            balance: { decrement: 1 },
          },
        });

        // Mark subscription paid
        await tx.channelSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "paid",
            verifiedAt: new Date(),
            paidAt: new Date(),
          },
        });
      });

      return {
        success: true,
        message: "Earnings claimed successfully",
        amount: subscriberEarning,
      };
    }),

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  // Get all pending channels for manual approval
  adminGetPendingChannels: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check here
      // const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id } });
      // if (!user?.isAdmin) throw new Error("Admin access required");
      
      const pendingChannels = await prisma.youtubeChannel.findMany({
        where: {
          status: 'SUBMITTED',
          isVerified: false
        },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstname: true,
              lastname: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return pendingChannels;
    }),

  // Manually approve a channel
  adminApproveChannel: protectedProcedure
    .input(z.object({
      channelId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      const channel = await prisma.youtubeChannel.findUnique({
        where: { id: input.channelId }
      });

      if (!channel) {
        throw new Error("Channel not found");
      }

      await prisma.youtubeChannel.update({
        where: { id: input.channelId },
        data: {
          isVerified: true,
          status: 'VERIFIED'
        }
      });

      return {
        success: true,
        message: "Channel approved successfully"
      };
    }),

  // Reject a channel
  adminRejectChannel: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      await prisma.youtubeChannel.delete({
        where: { id: input.channelId }
      });

      // TODO: Optionally refund user or notify them

      return {
        success: true,
        message: "Channel rejected and removed"
      };
    }),

  // Get all pending subscriptions
  adminGetPendingSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      const pendingSubscriptions = await prisma.channelSubscription.findMany({
        where: {
          status: 'pending'
        },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstname: true,
              lastname: true
            }
          },
          YoutubeChannel: {
            select: {
              id: true,
              channelName: true,
              channelUrl: true,
              User: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          subscriptionDate: 'desc'
        },
        take: 100
      });

      return pendingSubscriptions;
    }),

  // Manually process a subscription payment
  adminProcessSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      // Reuse the same logic from processSubscriptionPayment
      const subscription = await prisma.channelSubscription.findUnique({
        where: { id: input.subscriptionId },
        include: {
          User: true,
          YoutubeChannel: true
        }
      });

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      if (subscription.status === 'paid') {
        throw new Error("Subscription already processed");
      }

      // Get subscriber's referrer
      const referral = await prisma.referral.findFirst({
        where: { referredId: subscription.subscriberId }
      });

      const subscriberEarning = 40;
      const referrerEarning = 10;

      // Pay subscriber ₦40
      await prisma.user.update({
        where: { id: subscription.subscriberId },
        data: {
          wallet: {
            increment: subscriberEarning
          }
        }
      });

      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId: subscription.subscriberId,
          transactionType: 'credit',
          amount: subscriberEarning,
          description: 'BPI Youtube Subscription Earnings',
          status: 'completed'
        }
      });

      await prisma.userEarning.create({
        data: {
          id: randomUUID(),
          userId: subscription.subscriberId,
          channelId: subscription.channelId,
          amount: subscriberEarning,
          type: 'subscription',
          isPaid: true
        }
      });

      // Pay referrer ₦10
      if (referral) {
        await prisma.user.update({
          where: { id: referral.referrerId },
          data: {
            wallet: {
              increment: referrerEarning
            }
          }
        });

        await prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: referral.referrerId,
            transactionType: 'credit',
            amount: referrerEarning,
            description: 'BPI Youtube Subscription Referral Earnings',
            status: 'completed'
          }
        });

        await prisma.userEarning.create({
          data: {
            id: randomUUID(),
            userId: referral.referrerId,
            channelId: subscription.channelId,
            amount: referrerEarning,
            type: 'referral',
            isPaid: true
          }
        });
      }

      // Decrement channel owner's balance
      await prisma.youtubeProvider.update({
        where: { userId: subscription.YoutubeChannel.userId },
        data: {
          balance: {
            decrement: 1
          }
        }
      });

      // Update subscription status
      await prisma.channelSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          status: 'paid',
          verifiedAt: new Date(),
          paidAt: new Date()
        }
      });

      return {
        success: true,
        message: "Subscription processed successfully",
        subscriberEarned: subscriberEarning,
        referrerEarned: referral ? referrerEarning : 0
      };
    }),

  // Ban user from YouTube program
  adminBanUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      // TODO: Add youtube_banned field to User model if needed
      // await prisma.user.update({
      //   where: { id: input.userId },
      //   data: {
      //     youtube_banned: true
      //   }
      // });

      // Delete all pending channels and subscriptions
      await prisma.youtubeChannel.deleteMany({
        where: {
          userId: input.userId,
          status: { in: ['DRAFT', 'SUBMITTED'] }
        }
      });

      await prisma.channelSubscription.deleteMany({
        where: {
          subscriberId: input.userId,
          status: 'pending'
        }
      });

      return {
        success: true,
        message: "User banned from YouTube program"
      };
    }),

  // Get YouTube program stats (for admin dashboard)
  adminGetStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      
      // TODO: Add admin check
      
      const [
        totalChannels,
        verifiedChannels,
        pendingChannels,
        totalSubscriptions,
        pendingSubscriptions,
        totalEarnings,
        activeProviders
      ] = await Promise.all([
        prisma.youtubeChannel.count(),
        prisma.youtubeChannel.count({ where: { isVerified: true } }),
        prisma.youtubeChannel.count({ where: { status: 'SUBMITTED' } }),
        prisma.channelSubscription.count(),
        prisma.channelSubscription.count({ where: { status: 'pending' } }),
        prisma.userEarning.aggregate({
          _sum: { amount: true }
        }),
        prisma.youtubeProvider.count()
      ]);

      return {
        channels: {
          total: totalChannels,
          verified: verifiedChannels,
          pending: pendingChannels
        },
        subscriptions: {
          total: totalSubscriptions,
          pending: pendingSubscriptions
        },
        earnings: {
          total: totalEarnings._sum.amount || 0
        },
        providers: {
          active: activeProviders
        }
      };
    }),

  // ============================================
  // USER ENDPOINTS (ADDITIONAL)
  // ============================================

  // Upgrade plan
  upgradePlan: protectedProcedure
    .input(z.object({
      newPlanId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;

      // Get current provider
      const provider = await prisma.youtubeProvider.findUnique({
        where: { userId }
      });

      if (!provider) {
        throw new Error("You don't have an active plan");
      }

      // Get current plan
      const currentPlan = await prisma.youtubePlan.findUnique({
        where: { id: provider.youtubePlanId }
      });

      if (!currentPlan) {
        throw new Error("Current plan not found");
      }

      // Get new plan
      const newPlan = await prisma.youtubePlan.findUnique({
        where: { id: input.newPlanId }
      });

      if (!newPlan || !newPlan.isActive) {
        throw new Error("Invalid plan selected");
      }

      // Check if upgrading to higher tier
      if (newPlan.totalSub <= currentPlan.totalSub) {
        throw new Error("You can only upgrade to a higher tier plan");
      }

      // Calculate upgrade cost (difference between plans)
      const currentPlanTotal = currentPlan.amount.toNumber() + currentPlan.vat.toNumber();
      const newPlanTotal = newPlan.amount.toNumber() + newPlan.vat.toNumber();
      const upgradeCost = newPlanTotal - currentPlanTotal;

      // Check user balance
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.wallet < upgradeCost) {
        throw new Error(`Insufficient balance. You need ₦${upgradeCost.toFixed(2)} to upgrade.`);
      }

      // Deduct upgrade cost
      await prisma.user.update({
        where: { id: userId },
        data: {
          wallet: {
            decrement: upgradeCost
          }
        }
      });

      // Create transaction
      await prisma.transaction.create({
        data: {
          id: randomUUID(),
          userId,
          transactionType: 'debit',
          amount: -Math.abs(upgradeCost),
          description: `YouTube Plan Upgrade: ${currentPlan.name} → ${newPlan.name}`,
          status: 'completed'
        }
      });

      // Calculate additional slots
      const additionalSlots = newPlan.totalSub - currentPlan.totalSub;
      const newBalance = provider.balance + additionalSlots;

      // Update provider
      await prisma.youtubeProvider.update({
        where: { userId },
        data: {
          youtubePlanId: newPlan.id,
          balance: newBalance
        }
      });

      return {
        success: true,
        message: `Successfully upgraded to ${newPlan.name}`,
        upgradeCost,
        additionalSlots,
        newBalance
      };
    }),

  // Get provider stats (for user dashboard)
  getMyProviderStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.session?.user?.id) throw new Error("Unauthorized");
      const userId = ctx.session.user.id;

      const provider = await prisma.youtubeProvider.findUnique({
        where: { userId }
      });

      if (!provider) {
        return null;
      }

      const plan = await prisma.youtubePlan.findUnique({
        where: { id: provider.youtubePlanId }
      });

      if (!plan) {
        return null;
      }

      const [channel, totalSubscriptions, earnings] = await Promise.all([
        prisma.youtubeChannel.findFirst({
          where: {
            userId,
            isVerified: true
          }
        }),
        prisma.channelSubscription.count({
          where: {
            YoutubeChannel: {
              userId
            }
          }
        }),
        prisma.userEarning.aggregate({
          where: { userId },
          _sum: { amount: true }
        })
      ]);

      const slotsUsed = plan.totalSub - provider.balance;
      const slotsRemaining = provider.balance;

      return {
        plan: {
          name: plan.name,
          totalSlots: plan.totalSub,
          slotsUsed,
          slotsRemaining,
          percentUsed: (slotsUsed / plan.totalSub) * 100
        },
        channel: channel ? {
          name: channel.channelName,
          url: channel.channelUrl,
          status: channel.status,
          isVerified: channel.isVerified
        } : null,
        subscriptions: {
          total: totalSubscriptions
        },
        earnings: {
          total: earnings._sum.amount || 0
        }
      };
    }),
});
