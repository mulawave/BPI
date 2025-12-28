import { createTRPCRouter } from "../trpc";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { referralRouter } from "./referral";
import { bpiRouter } from "./bpi";
import { bpiCalculatorRouter } from "./calculator";
import { legacyRouter } from "./legacy";
import { packageRouter } from "./package";
import { adminRouter } from "./admin";
import { tokenRouter } from "./token";
import { notificationRouter } from "./notification";
import { userRouter } from "./user";
import { blogRouter } from "./blog";
import { dashboardRouter } from "./dashboard";

// Community Features
import { communityUpdatesRouter } from "./communityUpdates";
import { bpiCalculatorRouter as communityCalculatorRouter } from "./bpiCalculator";
import { dealsRouter } from "./deals";
import { promotionalMaterialsRouter } from "./promotionalMaterials";
import { leadershipPoolRouter } from "./leadershipPool";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  auth: authRouter,
  referral: referralRouter,
  bpi: bpiRouter,
  calculator: bpiCalculatorRouter,
  legacy: legacyRouter,
  package: packageRouter,
  admin: adminRouter,
  token: tokenRouter,
  notification: notificationRouter,
  user: userRouter,
  blog: blogRouter,
  dashboard: dashboardRouter,
  
  // Community Features
  communityUpdates: communityUpdatesRouter,
  communityCalculator: communityCalculatorRouter,
  deals: dealsRouter,
  promotionalMaterials: promotionalMaterialsRouter,
  leadershipPool: leadershipPoolRouter,

  // Legacy router, to be deprecated
});

export type AppRouter = typeof appRouter;
