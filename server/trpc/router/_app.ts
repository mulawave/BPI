import { createTRPCRouter } from "../trpc";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { referralRouter } from "./referral";
import { bpiRouter } from "./bpi";
import { bpiCalculatorRouter } from "./calculator";
// REMOVED: legacy router - all endpoints replaced with proper implementations
// import { legacyRouter } from "./legacy";
import { packageRouter } from "./package";
import { adminRouter } from "./admin";
import { adminAuthRouter } from "./adminAuth";
import { tokenRouter } from "./token";
import { notificationRouter } from "./notification";
import { userRouter } from "./user";
import { blogRouter } from "./blog";
import { dashboardRouter } from "./dashboard";
import { paymentRouter } from "./payment";

// Community Features
import { communityUpdatesRouter } from "./communityUpdates";
import { bpiCalculatorRouter as communityCalculatorRouter } from "./bpiCalculator";
import { dealsRouter } from "./deals";
import { promotionalMaterialsRouter } from "./promotionalMaterials";
import { leadershipPoolRouter } from "./leadershipPool";
import { leadershipRouter } from "./leadership";
import { membershipPackagesRouter } from "./membershipPackages";
import { epcEppRouter } from "./epcEpp";
import { solarAssessmentRouter } from "./solarAssessment";
import { trainingCenterRouter } from "./trainingCenter";
import { currencyRouter } from "./currency";
import { youtubeRouter } from "./youtube";
import { thirdPartyPlatformsRouter } from "./thirdPartyPlatforms";
import { taxesRouter } from "./taxes";
import { palliativeRouter } from "./palliative";
import { walletRouter } from "./wallet";
import { communityRouter } from "./community";
import { configRouter } from "./config";
import { locationRouter } from "./location";
import { adminLocationRouter } from "./adminLocation";
import { bankRouter } from "./bank";
import { adminBankRouter } from "./adminBank";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  auth: authRouter,
  referral: referralRouter,
  bpi: bpiRouter,
  calculator: bpiCalculatorRouter,
  // REMOVED: legacy: legacyRouter - all endpoints replaced with proper implementations
  package: packageRouter,
  payment: paymentRouter,
  admin: adminRouter,
  adminAuth: adminAuthRouter,
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
  leadership: leadershipRouter,
  membershipPackages: membershipPackagesRouter,
  epcEpp: epcEppRouter,
  solarAssessment: solarAssessmentRouter,
  trainingCenter: trainingCenterRouter,
  currency: currencyRouter,
  youtube: youtubeRouter,
  thirdPartyPlatforms: thirdPartyPlatformsRouter,
  taxes: taxesRouter,
  palliative: palliativeRouter,
  wallet: walletRouter,
  community: communityRouter,
  config: configRouter,
  location: locationRouter,
  adminLocation: adminLocationRouter,
  bank: bankRouter,
  adminBank: adminBankRouter,

  // Legacy router, to be deprecated
});

export type AppRouter = typeof appRouter;
