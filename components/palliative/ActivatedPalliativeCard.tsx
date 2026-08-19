"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Target, TrendingUp, CheckCircle2, Clock,
  Loader2, AlertCircle, Sparkles, Award,
  Car, Home, MapPin, Briefcase, Sun as SolarIcon, GraduationCap,
  Zap, Shield
} from "lucide-react";
import { cn } from "@/styles/utils";
import toast from "react-hot-toast";

/**
 * ActivatedPalliativeCard - Post-activation tracking
 * Shows selected palliative, current balance, target amount, maturity status
 * Displayed for users with palliativeActivated: true
 */
export function ActivatedPalliativeCard() {
  const { formatAmount } = useCurrency();
  const { data: activated, isLoading, error } = api.palliative.getActivatedPalliative.useQuery();
  const checkMaturityMutation = api.palliative.checkMaturity.useMutation();

  const handleCheckMaturity = async () => {
    try {
      const result = await checkMaturityMutation.mutateAsync();
      if (result.matured) {
        // Show success notification or modal
        toast.success(
          "🎉 Congratulations! Your palliative has matured. Our team will contact you soon."
        );
      } else {
        toast("Keep going! You haven't reached your target yet.");
      }
    } catch (error) {
      console.error("Failed to check maturity:", error);
      toast.error("Failed to check maturity. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="relative flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-300" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700">
        <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Failed to load palliative status</p>
        </div>
      </Card>
    );
  }

  if (!activated) {
    return null;
  }

  const {
    palliativeType,
    currentBalance,
    targetAmount,
    progressPercentage,
    hasMatured,
    activatedAt,
  } = activated;

  const isOpenPalliative = (activated as any).activationType === "instant";
  const thresholdAmount = (activated as any).thresholdAmount ?? null;

  // Icon mapping for palliative types
  const palliativeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    car: Car,
    house: Home,
    land: MapPin,
    business: Briefcase,
    solar: SolarIcon,
    education: GraduationCap,
  };

  const PalliativeIcon = palliativeIcons[palliativeType] || Target;

  // Format dates
  const activatedDate = activatedAt ? new Date(activatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : "N/A";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20 transition-all",
      hasMatured ? "" : "hover:shadow-2xl"
    )}>
      <div className={cn(
        "absolute inset-0",
        hasMatured
          ? "bg-gradient-to-br from-[#3a2a04] via-[#4a3a08] to-[#2a1e02]"
          : "bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]"
      )} />
      <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      <div className="relative p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-full ring-1 ring-amber-300/20",
            hasMatured
              ? "bg-amber-500/20"
              : "bg-emerald-500/20"
          )}>
            <PalliativeIcon className={cn(
              "w-6 h-6",
              hasMatured
                ? "text-amber-300"
                : "text-emerald-300"
            )} />
          </div>
          <div>
            <h3 className={cn(
              "text-lg font-semibold text-white",
            )}>
              {palliativeType.charAt(0).toUpperCase() + palliativeType.slice(1)} Palliative
            </h3>
            {/* Open vs Shelter distinction badge */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1",
                isOpenPalliative
                  ? "bg-violet-500/20 text-violet-200 ring-violet-300/20"
                  : "bg-sky-500/20 text-sky-200 ring-sky-300/20"
              )}>
                {isOpenPalliative ? (
                  <><Zap className="w-3 h-3" /> Open Palliative • Instant</>
                ) : (
                  <><Shield className="w-3 h-3" /> Shelter Palliative • Accumulated</>
                )}
              </span>
            </div>
            <p className={cn(
              "text-sm mt-0.5",
              hasMatured
                ? "text-amber-200/70"
                : "text-emerald-200/70"
            )}>
              Active since {activatedDate}
            </p>
          </div>
        </div>
        {hasMatured ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 ring-1 ring-amber-300/30 animate-pulse">
            <Award className="w-3.5 h-3.5" />
            Matured!
          </span>
        ) : progressPercentage >= 100 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 ring-1 ring-amber-300/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Target Reached
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-200 ring-1 ring-sky-300/20">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {formatAmount(currentBalance)}
            </p>
            <p className={cn(
              "text-sm",
              hasMatured
                ? "text-amber-200/60"
                : "text-emerald-200/60"
            )}>
              of {formatAmount(targetAmount)} target
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-3xl font-bold tabular-nums tracking-tight",
              hasMatured
                ? "text-amber-200"
                : "text-amber-200"
            )}>
              {progressPercentage}%
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className={cn(
          "relative h-3 rounded-full overflow-hidden ring-1",
          hasMatured
            ? "bg-amber-900/50 ring-amber-300/10"
            : "bg-emerald-900/50 ring-emerald-300/10"
        )}>
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              hasMatured
                ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                : progressPercentage >= 100
                ? "bg-gradient-to-r from-emerald-400 to-amber-300"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
            )}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          {(progressPercentage >= 100 || hasMatured) && (
            <div className={cn(
              "absolute inset-0 animate-pulse",
              hasMatured ? "bg-amber-400/30" : "bg-emerald-400/30"
            )} />
          )}
        </div>
      </div>

      {/* Status Info */}
      {hasMatured ? (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-300/15 mb-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium mb-1">
                🎉 Congratulations!
              </p>
              <p className="text-xs text-amber-200/70">
                Your palliative has matured. Our team will contact you soon to arrange claiming your reward. This typically takes 3-5 business days for processing.
              </p>
            </div>
          </div>
        </div>
      ) : progressPercentage >= 100 ? (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-300/15 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium mb-1">
                Target Reached!
              </p>
              <p className="text-xs text-emerald-200/70">
                You've reached your target amount. Click "Check Maturity" to create a maturity record and start the claiming process.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-300/15 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {isOpenPalliative ? (
                <>
                  <p className="text-sm text-white font-medium mb-1">
                    <Zap className="w-3.5 h-3.5 inline mr-1 text-violet-300" />
                    Open Palliative — Instant Benefit Active
                  </p>
                  <p className="text-xs text-emerald-200/70">
                    Your palliative was activated instantly at membership registration. Your benefit wallet is growing as referral commissions flow in.
                    {thresholdAmount ? ` Starting value: ₦${Number(thresholdAmount).toLocaleString()}.` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white font-medium mb-1">
                    Keep growing your network!
                  </p>
                  <p className="text-xs text-emerald-200/70">
                    You need {formatAmount(targetAmount - currentBalance)} more to reach your target. Earn 10% of all referral package prices towards your palliative.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {hasMatured ? (
        <Button 
          variant="outline"
          className="w-full border-amber-300/30 text-amber-200 bg-white/5 backdrop-blur-sm"
          disabled
        >
          <Clock className="w-4 h-4 mr-2" />
          Processing Claim Request
        </Button>
      ) : progressPercentage >= 100 ? (
        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold ring-1 ring-amber-300/30"
          size="lg"
          onClick={handleCheckMaturity}
          disabled={checkMaturityMutation.isPending}
        >
          {checkMaturityMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Check Maturity & Claim
            </>
          )}
        </Button>
      ) : (
        <Button 
          variant="outline"
          className="w-full border-emerald-300/30 text-emerald-200 bg-white/5 backdrop-blur-sm"
          disabled
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {formatAmount(targetAmount - currentBalance)} to target
        </Button>
      )}
      </div>
    </div>
  );
}
