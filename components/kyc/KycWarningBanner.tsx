"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  Shield, AlertTriangle, Clock, XCircle, ChevronRight, X, BadgeCheck,
} from "lucide-react";

/**
 * KYC Warning Banner — renders a persistent alert across all user pages
 * when KYC is incomplete, expired, or rejected.
 * 
 * Placement: inserted in DashboardContent and other user-facing layouts.
 * Hides when: KYC is approved and not expired, or user dismisses for session.
 */
export default function KycWarningBanner() {
  const { data: session, status: authStatus } = useSession();
  const [dismissed, setDismissed] = useState(false);

  const { data: kycStatus, isLoading } = api.kyc.getMyKycStatus.useQuery(undefined, {
    enabled: authStatus === "authenticated",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Don't render for unauthenticated or loading
  if (authStatus !== "authenticated" || !session) return null;
  if (isLoading || !kycStatus) return null;
  if (dismissed) return null;

  // Don't show if approved and not expired
  if (kycStatus.status === "approved") return null;

  // Don't show if pending / under review (show a softer version)
  const isPending = kycStatus.status === "pending" || kycStatus.status === "under_review";
  const isRejected = kycStatus.status === "rejected";
  const isExpired = kycStatus.status === "expired";
  const isNone = kycStatus.status === "none";

  const config = isPending
    ? {
        bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50",
        icon: Clock,
        iconColor: "text-blue-500",
        title: "KYC verification is under review",
        message: "We're reviewing your identity documents. This usually takes 24–48 hours.",
        cta: null,
      }
    : isRejected
    ? {
        bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50",
        icon: XCircle,
        iconColor: "text-red-500",
        title: "KYC verification was rejected",
        message: kycStatus.submission?.rejectionReason
          ? `Reason: ${kycStatus.submission.rejectionReason}`
          : "Your submission was not approved. Please resubmit with corrected documents.",
        cta: "Resubmit KYC",
      }
    : isExpired
    ? {
        bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
        icon: AlertTriangle,
        iconColor: "text-amber-500",
        title: "Your KYC verification has expired",
        message: "Your identity documents have expired. Please complete verification again to maintain full access.",
        cta: "Renew Verification",
      }
    : {
        // 'none' — never submitted
        bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50",
        icon: Shield,
        iconColor: "text-amber-600 dark:text-amber-400",
        title: "Complete your identity verification",
        message: "Verify your identity to unlock full platform access and secure your account.",
        cta: "Start KYC Verification",
      };

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative border rounded-xl ${config.bg} mx-auto mb-4`}
      >
        <div className="flex items-start gap-3 p-3 sm:p-4">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{config.message}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {config.cta && (
              <Link
                href="/kyc"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {config.cta} <ChevronRight className="w-3 h-3" />
              </Link>
            )}
            {(isPending || isNone) && (
              <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
