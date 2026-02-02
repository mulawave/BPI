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
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-700 dark:border-green-700">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-700 dark:text-green-600" />
        </div>
      </Card>
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
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-700 dark:border-green-700 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <Target className="w-6 h-6 text-green-700 dark:text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Palliative Journey
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300">
              {membershipName || tier?.replace("-", " ") || "Member"} {membershipAmount ? `(${formatAmount(membershipAmount)})` : ''}
            </p>
          </div>
        </div>
        {canActivate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to Activate
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatAmount(palliativeWallet)}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              of {formatAmount(threshold)} pooled
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-700 dark:text-green-600">
              {percentageComplete}%
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-3 bg-green-200 dark:bg-green-900/50 rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              percentageComplete >= 100 
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-green-700 to-green-800"
            )}
            style={{ width: `${Math.min(percentageComplete, 100)}%` }}
          />
          {percentageComplete >= 100 && (
            <div className="absolute inset-0 bg-green-400/30 animate-pulse" />
          )}
        </div>
      </div>

      {/* Palliative Wallet Balance */}
      <div className="mb-4 p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-green-700 dark:border-green-800">
        <p className="text-xs text-green-800 dark:text-green-300 font-medium mb-2">Palliative Wallet Balance</p>
        <p className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
          {formatAmount(palliativeWallet)}
        </p>
        {latestEarning ? (
          <div className="pt-2 border-t border-green-700 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400">
              Latest: +{formatAmount(latestEarning.amount)} • {getRelativeTime(new Date(latestEarning.createdAt))}
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              {latestEarning.description || 'Palliative earning'}
            </p>
          </div>
        ) : palliativeWallet > 0 ? (
          <p className="text-xs text-green-700 dark:text-green-400">
            Keep referring to grow your balance to ₦200,000
          </p>
        ) : (
          <p className="text-xs text-green-700 dark:text-green-400">
            Start referring to earn towards your palliative goal!
          </p>
        )}
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-700 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-700 dark:text-green-600" />
            <p className="text-xs text-green-800 dark:text-green-300">Your Referrals</p>
          </div>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">
            {networkStats.directReferrals}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Direct team</p>
        </div>

        <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-green-700 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-600" />
            <p className="text-xs text-green-800 dark:text-green-300">Total Network</p>
          </div>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">
            {networkStats.totalNetwork}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">All levels</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-700 dark:border-green-800 mb-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-green-700 dark:text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-1">
              How it works:
            </p>
            <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">
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
          className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white font-semibold"
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
          className="w-full border-green-700 dark:border-green-700 text-green-800 dark:text-green-300"
          disabled
        >
          {formatAmount(threshold - palliativeWallet)} more to activate
        </Button>
      )}
    </Card>
  );
}
