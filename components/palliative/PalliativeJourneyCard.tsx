"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Target, Users, TrendingUp, Zap, 
  Loader2, AlertCircle, CheckCircle2 
} from "lucide-react";
import { cn } from "@/styles/utils";

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffWeek > 0) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * PalliativeJourneyCard - Lower-tier progress tracker
 * Shows pooling balance, threshold progress (₦200k), network stats
 * Displayed for users with palliativeTier: "regular" or "regular-plus"
 */
interface PalliativeJourneyCardProps {
  onActivateClick?: () => void;
  membershipName?: string;
  membershipAmount?: number;
}

export function PalliativeJourneyCard({ 
  onActivateClick,
  membershipName,
  membershipAmount 
}: PalliativeJourneyCardProps) {
  const [isActivating, setIsActivating] = React.useState(false);
  const { formatAmount } = useCurrency();
  const { data: journey, isLoading, error } = api.palliative.getPalliativeJourney.useQuery();

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl" />
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
          <p className="text-sm">Failed to load palliative journey</p>
        </div>
      </Card>
    );
  }

  if (!journey) {
    return null;
  }

  const {
    palliativeWallet,
    threshold,
    percentageComplete,
    canActivate,
    networkStats,
    tier,
    recentEarnings,
  } = journey;

  // Get latest earning
  const latestEarning = recentEarnings && recentEarnings.length > 0 ? recentEarnings[0] : null;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20 hover:shadow-2xl transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
      <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
      <div className="relative p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-emerald-500/20 ring-1 ring-amber-300/20">
            <Target className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Palliative Journey
            </h3>
            <p className="text-sm text-emerald-200/70">
              {membershipName || tier?.replace("-", " ") || "Member"} {membershipAmount ? `(${formatAmount(membershipAmount)})` : ''}
            </p>
          </div>
        </div>
        {canActivate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 ring-1 ring-amber-300/30 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to Activate
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
              {formatAmount(palliativeWallet)}
            </p>
            <p className="text-sm text-emerald-200/60">
              of {formatAmount(threshold)} pooled
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-200 tabular-nums tracking-tight">
              {percentageComplete}%
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-3 bg-emerald-900/50 rounded-full overflow-hidden ring-1 ring-emerald-300/10">
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              percentageComplete >= 100 
                ? "bg-gradient-to-r from-emerald-400 to-amber-300"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
            )}
            style={{ width: `${Math.min(percentageComplete, 100)}%` }}
          />
          {percentageComplete >= 100 && (
            <div className="absolute inset-0 bg-emerald-400/30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Palliative Wallet Balance */}
      <div className="mb-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-emerald-300/15">
        <p className="text-xs text-emerald-200/70 font-medium mb-2">Palliative Wallet Balance</p>
        <p className="text-3xl font-bold text-white tabular-nums tracking-tight mb-2">
          {formatAmount(palliativeWallet)}
        </p>
        {latestEarning ? (
          <div className="pt-2 border-t border-emerald-300/15">
            <p className="text-xs text-emerald-200/60">
              Latest: +{formatAmount(latestEarning.amount)} • {getRelativeTime(new Date(latestEarning.createdAt))}
            </p>
            <p className="text-xs text-emerald-200/60 mt-1">
              {latestEarning.description || 'Palliative earning'}
            </p>
          </div>
        ) : palliativeWallet > 0 ? (
          <p className="text-xs text-emerald-200/60">
            Keep referring to grow your balance to ₦200,000
          </p>
        ) : (
          <p className="text-xs text-emerald-200/60">
            Start referring to earn towards your palliative goal!
          </p>
        )}
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-emerald-300/15">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-300" />
            <p className="text-xs text-emerald-200/70">Your Referrals</p>
          </div>
          <p className="text-xl font-bold text-white tabular-nums tracking-tight">
            {networkStats.directReferrals}
          </p>
          <p className="text-xs text-emerald-200/50 mt-0.5">Direct team</p>
        </div>

        <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-emerald-300/15">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <p className="text-xs text-emerald-200/70">Total Network</p>
          </div>
          <p className="text-xl font-bold text-white tabular-nums tracking-tight">
            {networkStats.totalNetwork}
          </p>
          <p className="text-xs text-emerald-200/50 mt-0.5">All levels</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-300/15 mb-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-200 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium mb-1">
              How it works:
            </p>
            <ul className="text-xs text-emerald-200/70 space-y-1">
              <li>• Earn 10% of referrals' package price as palliative rewards</li>
              <li>• Rewards pool in your palliative wallet until ₦200,000</li>
              <li>• Choose your palliative type when threshold is reached</li>
              <li>• Start earning towards your selected target (car, house, etc.)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {canActivate ? (
        <Button 
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold ring-1 ring-amber-300/30"
          size="lg"
          onClick={() => {
            setIsActivating(true);
            onActivateClick?.();
          }}
          disabled={isActivating}
        >
          {isActivating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Activate Your Palliative Choice
            </>
          )}
        </Button>
      ) : (
        <Button 
          variant="outline"
          className="w-full border-emerald-300/30 text-emerald-200 bg-white/5 backdrop-blur-sm"
          disabled
        >
          {formatAmount(threshold - palliativeWallet)} more to activate
        </Button>
      )}
      </div>
    </div>
  );
}
