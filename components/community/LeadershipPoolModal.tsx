"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";
import {
  AlertCircle,
  Calendar,
  Crown,
  Gift,
  History,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";

interface LeadershipPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "challenge" | "overview" | "leaderboard" | "rewards" | "history";

export default function LeadershipPoolModal({ isOpen, onClose }: LeadershipPoolModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("challenge");
  const { formatAmount } = useCurrency();

  const { data: poolSettings } = api.leadershipPool.getPoolSettings.useQuery();
  const { data: poolInfo, isLoading: loadingPoolInfo, refetch: refetchPoolInfo } =
    api.leadershipPool.getPoolInfo.useQuery(undefined, { enabled: isOpen });
  const { data: leaderboardData, isLoading: loadingLeaderboard } =
    api.leadershipPool.getLeaderboard.useQuery({ limit: 10 }, { enabled: isOpen });
  const { data: poolHistory, isLoading: loadingHistory } = api.leadershipPool.getMyPoolHistory.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const { data: challengeProgress, isLoading: loadingProgress } = api.leadership.getMyProgress.useQuery(
    undefined,
    { enabled: isOpen }
  );
  const { data: challengeStats, isLoading: loadingStats } = api.leadership.getChallengeStats.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const claimReward = api.leadershipPool.claimPoolReward.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Successfully claimed ${formatAmount(data.amount)}.`);
        refetchPoolInfo();
        return;
      }
      toast.error(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const amount = poolSettings?.amount ?? 50_000_000;
  const maxParticipants = poolSettings?.maxParticipants ?? 100;

  const tabs = useMemo(
    () =>
      [
        { id: "challenge" as const, label: "Challenge", icon: Target },
        { id: "overview" as const, label: "Overview", icon: TrendingUp },
        { id: "leaderboard" as const, label: "Leaderboard", icon: Trophy },
        { id: "rewards" as const, label: "My Rewards", icon: Gift },
        { id: "history" as const, label: "History", icon: History },
      ] satisfies Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }>,
    []
  );

  if (!isOpen) return null;

  // If admin disabled the pool, the dashboard card is hidden. This is a safety guard.
  if (poolSettings?.enabled === false) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Leadership Pool</h2>
                  <p className="text-amber-50 text-sm">Earn from community success</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === id
                      ? "bg-white text-amber-700 shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {activeTab === "challenge" && (
            <div className="space-y-6">
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-8 text-white">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold">LEADERSHIP POOL CHALLENGE</h3>
                      <p className="text-amber-50 text-sm mt-1">Limited to first {maxParticipants} qualifiers</p>
                    </div>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Yearly Revenue Distribution</p>
                        <p className="text-4xl font-bold">{formatAmount(amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90 mb-1">Spots Remaining</p>
                        <p className="text-4xl font-bold">
                          {(challengeStats?.spotsRemaining ?? 0).toLocaleString()} / {maxParticipants.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90 mb-1">Your Status</p>
                        <div className="flex items-center gap-2 mt-2">
                          {challengeProgress?.isQualified ? (
                            <>
                              <Target className="w-6 h-6" />
                              <span className="text-2xl font-bold">
                                Qualified
                                {typeof challengeProgress.qualificationRank === "number"
                                  ? ` #${challengeProgress.qualificationRank}`
                                  : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-6 h-6" />
                              <span className="text-2xl font-bold">In Progress</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <h4 className="text-lg font-semibold text-foreground mb-2">What to do next</h4>
                <p className="text-sm text-muted-foreground">
                  Complete the leadership requirements to qualify. Once qualified, you can claim your share from the pool when distributions are
                  available.
                </p>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                  <p className="text-sm opacity-90 mb-1">Total Pool</p>
                  <p className="text-3xl font-bold">{formatAmount(amount)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                  <p className="text-sm opacity-90 mb-1">Qualified</p>
                  <p className="text-3xl font-bold">{(challengeStats?.totalQualified ?? 0).toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
                  <p className="text-sm opacity-90 mb-1">Spots Remaining</p>
                  <p className="text-3xl font-bold">{(challengeStats?.spotsRemaining ?? 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-foreground">Distribution Schedule</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Distributions occur on the last day of each month. Your eligibility depends on your qualification status.
                </p>
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              {loadingLeaderboard ? (
                <div className="text-center py-12 text-muted-foreground">Loading leaderboard...</div>
              ) : leaderboardData?.leaders?.length ? (
                <div className="space-y-3">
                  {leaderboardData.leaders.map((leader) => (
                    <div
                      key={leader.userId}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-bpi-dark-card border-bpi-border dark:border-bpi-dark-accent"
                    >
                      <div className="w-12 text-center font-bold text-foreground">#{leader.rank}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{leader.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {leader.referrals} referrals - {leader.tier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatAmount(leader.earnings)}</p>
                        <p className="text-xs text-muted-foreground">{leader.sharePercentage.toFixed(2)}% share</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-muted-foreground">No qualified leaders yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Available to Claim</p>
                <p className="text-4xl font-bold">{formatAmount(poolInfo?.myShare ?? 0)}</p>
                {poolInfo?.isQualified ? (
                  <p className="text-xs opacity-75 mt-1">
                    {poolInfo.tier} Tier - {poolInfo.sharePercentage.toFixed(2)}% share
                  </p>
                ) : (
                  <p className="text-xs opacity-75 mt-1">Not qualified yet</p>
                )}

                <button
                  onClick={() => claimReward.mutate()}
                  disabled={
                    claimReward.isPending || !poolInfo?.isQualified || (poolInfo?.myShare ?? 0) <= 0 || loadingPoolInfo
                  }
                  className="w-full bg-white text-emerald-600 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-5"
                >
                  {claimReward.isPending
                    ? "Claiming..."
                    : !poolInfo?.isQualified
                      ? "Not Qualified"
                      : (poolInfo?.myShare ?? 0) <= 0
                        ? "No Rewards Available"
                        : "Claim Rewards"}
                </button>
              </div>

              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <p className="text-sm text-muted-foreground">
                  Rewards become available after distributions and depend on qualification. If your dashboard shows the card, the pool is active.
                </p>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="text-center py-12 text-muted-foreground">Loading history...</div>
              ) : poolHistory?.length ? (
                poolHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-5"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{record.period}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">+{formatAmount(record.amount)}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Ref: {record.reference}</span>
                      {record.description ? <span>- {record.description}</span> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-muted-foreground">No distribution history yet</p>
                </div>
              )}
            </div>
          )}

          {(loadingProgress || loadingStats || loadingPoolInfo) && activeTab !== "leaderboard" && (
            <div className="mt-6 text-center text-xs text-muted-foreground">Updating latest stats...</div>
          )}
        </div>
      </div>
    </div>
  );
}
