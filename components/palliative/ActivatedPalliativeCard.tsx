"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Target, TrendingUp, CheckCircle2, Clock,
  Loader2, AlertCircle, Sparkles, Award,
  Car, Home, MapPin, Briefcase, Sun as SolarIcon, GraduationCap
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
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-300 dark:border-emerald-700">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
      </Card>
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
    <Card className={cn(
      "p-6 border transition-all",
      hasMatured
        ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-400 dark:border-yellow-600 shadow-lg"
        : "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-300 dark:border-emerald-700 hover:shadow-lg"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-full",
            hasMatured
              ? "bg-yellow-100 dark:bg-yellow-900/30"
              : "bg-emerald-100 dark:bg-emerald-900/30"
          )}>
            <PalliativeIcon className={cn(
              "w-6 h-6",
              hasMatured
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-emerald-600 dark:text-emerald-400"
            )} />
          </div>
          <div>
            <h3 className={cn(
              "text-lg font-semibold",
              hasMatured
                ? "text-yellow-900 dark:text-yellow-100"
                : "text-emerald-900 dark:text-emerald-100"
            )}>
              {palliativeType.charAt(0).toUpperCase() + palliativeType.slice(1)} Palliative
            </h3>
            <p className={cn(
              "text-sm",
              hasMatured
                ? "text-yellow-700 dark:text-yellow-300"
                : "text-emerald-700 dark:text-emerald-300"
            )}>
              Active since {activatedDate}
            </p>
          </div>
        </div>
        {hasMatured ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse">
            <Award className="w-3.5 h-3.5" />
            Matured!
          </span>
        ) : progressPercentage >= 100 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Target Reached
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className={cn(
              "text-2xl font-bold",
              hasMatured
                ? "text-yellow-900 dark:text-yellow-100"
                : "text-emerald-900 dark:text-emerald-100"
            )}>
              {formatAmount(currentBalance)}
            </p>
            <p className={cn(
              "text-sm",
              hasMatured
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}>
              of {formatAmount(targetAmount)} target
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-3xl font-bold",
              hasMatured
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}>
              {progressPercentage}%
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className={cn(
          "relative h-3 rounded-full overflow-hidden",
          hasMatured
            ? "bg-yellow-200 dark:bg-yellow-900/50"
            : "bg-emerald-200 dark:bg-emerald-900/50"
        )}>
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              hasMatured
                ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                : progressPercentage >= 100
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-emerald-500 to-green-500"
            )}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          {(progressPercentage >= 100 || hasMatured) && (
            <div className={cn(
              "absolute inset-0 animate-pulse",
              hasMatured ? "bg-yellow-400/30" : "bg-green-400/30"
            )} />
          )}
        </div>
      </div>

      {/* Status Info */}
      {hasMatured ? (
        <div className="p-4 rounded-lg bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mb-4">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium mb-1">
                🎉 Congratulations!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Your palliative has matured. Our team will contact you soon to arrange claiming your reward. This typically takes 3-5 business days for processing.
              </p>
            </div>
          </div>
        </div>
      ) : progressPercentage >= 100 ? (
        <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-1">
                Target Reached!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                You've reached your target amount. Click "Check Maturity" to create a maturity record and start the claiming process.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-emerald-900 dark:text-emerald-100 font-medium mb-1">
                Keep growing your network!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                You need {formatAmount(targetAmount - currentBalance)} more to reach your target. Earn 10% of all referral package prices towards your palliative.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {hasMatured ? (
        <Button 
          variant="outline"
          className="w-full border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300"
          disabled
        >
          <Clock className="w-4 h-4 mr-2" />
          Processing Claim Request
        </Button>
      ) : progressPercentage >= 100 ? (
        <Button 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
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
          className="w-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
          disabled
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {formatAmount(targetAmount - currentBalance)} to target
        </Button>
      )}
    </Card>
  );
}
