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

  // Legacy router, to be deprecated
});

export type AppRouter = typeof appRouter;
