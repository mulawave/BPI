"use client";

import { useState } from "react";
import { FiX, FiTrendingUp, FiAward, FiDollarSign, FiCheck } from "react-icons/fi";
import { Users, Crown, Trophy, Target, TrendingUp, Calendar, History, Gift, Zap, Star, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import toast from "react-hot-toast";

interface LeadershipPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'challenge' | 'leaderboard' | 'rewards' | 'history';

export default function LeadershipPoolModal({ isOpen, onClose }: LeadershipPoolModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('challenge');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { formatAmount } = useCurrency();

  // API Queries
  const { data: poolInfo, isLoading: loadingPool, refetch: refetchPoolInfo } = api.leadershipPool.getPoolInfo.useQuery();
  const { data: leaderboardData } = api.leadershipPool.getLeaderboard.useQuery({ limit: 10 });
  const { data: poolHistory } = api.leadershipPool.getMyPoolHistory.useQuery();
  const { data: poolSourcesData } = api.leadershipPool.getPoolSources.useQuery();
  
  // Leadership Challenge Progress
  const { data: challengeProgress, isLoading: loadingChallenge } = api.leadership.getMyProgress.useQuery();
  const { data: challengeStats } = api.leadership.getChallengeStats.useQuery();
  
  // Claim reward mutation
  const claimReward = api.leadershipPool.claimPoolReward.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Successfully claimed ₦${data.amount.toLocaleString()}!`);
        refetchPoolInfo();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  if (!isOpen) return null;

  const TABS = [
    { id: 'challenge' as TabType, label: 'Challenge', icon: Target },
    { id: 'overview' as TabType, label: 'Overview', icon: TrendingUp },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    { id: 'rewards' as TabType, label: 'My Rewards', icon: Gift },
    { id: 'history' as TabType, label: 'History', icon: History },
  ];

  // Color schemes for pool sources
  const sourceColors = [
    'from-amber-500 to-yellow-600',
    'from-orange-500 to-amber-600',
    'from-yellow-500 to-amber-500',
    'from-amber-600 to-orange-600',
    'from-yellow-600 to-amber-700',
  ];

  // Map pool sources data with colors
  const poolSources = (poolSourcesData || []).map((source, index) => ({
    ...source,
    color: sourceColors[index % sourceColors.length],
  }));

  // Qualification criteria (can be expanded based on backend data)
  const qualificationCriteria = [
    { label: 'Active Membership', required: true, status: poolInfo?.isQualified ? 'completed' : 'pending' },
    { label: 'Regular Plus Package', required: true, status: poolInfo?.isQualified ? 'completed' : 'pending' },
    { label: 'Monthly Requirements', required: true, status: poolInfo?.tier ? 'completed' : 'in-progress' },
    { label: 'Team Performance', required: false, status: poolInfo?.tier ? 'completed' : 'pending' },
  ];

  // Badge mapping for leaderboard
  const getBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '⭐';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl animate-fadeIn">
        
        {/* Header with Gradient */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Crown className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Leadership Pool</h2>
                  <p className="text-purple-100 text-sm">Earn from community success</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-white text-amber-600 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          
          {/* LEADERSHIP CHALLENGE TAB */}
          {activeTab === 'challenge' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Challenge Hero Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-2xl p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold">LEADERSHIP POOL CHALLENGE</h3>
                      <p className="text-yellow-100 text-sm mt-1">Limited to First 100 Qualifiers!</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Yearly Revenue Distribution</p>
                        <p className="text-4xl font-bold">{formatAmount(50000000)}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90 mb-1">Spots Remaining</p>
                        <p className="text-4xl font-bold">{challengeStats?.spotsRemaining || 0} / 100</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90 mb-1">Your Status</p>
                        <div className="flex items-center gap-2 mt-2">
                          {challengeProgress?.isQualified ? (
                            <>
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="text-2xl font-bold">Qualified #{challengeProgress.qualificationRank}</span>
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

              {/* Qualification Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Option 1 */}
                <div className="bg-white dark:bg-bpi-dark-card border-2 border-amber-500 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold">1</span>
                      </div>
                      <h4 className="text-xl font-bold">Qualification Option 1</h4>
                    </div>
                    <p className="text-sm opacity-90">Direct sponsorship path</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${challengeProgress?.currentProgress.isRegularPlus ? 'text-green-600' : 'text-gray-400'}`}>
                          {challengeProgress?.currentProgress.isRegularPlus ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">Activate or Upgrade to Regular Plus</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {challengeProgress?.currentProgress.isRegularPlus ? '✓ Completed' : 'Required first step'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${challengeProgress?.currentProgress.option1.qualified ? 'text-green-600' : 'text-gray-400'}`}>
                          {challengeProgress?.currentProgress.option1.qualified ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">Sponsor 70 Regular Plus Members</p>
                          <p className="text-xs text-muted-foreground mt-1">Direct first-generation sponsors</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">Progress</span>
                        <span className="text-muted-foreground">
                          {challengeProgress?.currentProgress.option1.directCount || 0} / 70
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((challengeProgress?.currentProgress.option1.percentage || 0), 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {(challengeProgress?.currentProgress.option1.percentage || 0).toFixed(1)}% Complete
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`p-3 rounded-lg text-center ${
                      challengeProgress?.currentProgress.option1.qualified 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      {challengeProgress?.currentProgress.option1.qualified ? (
                        <span className="font-semibold">✓ Option 1 Complete!</span>
                      ) : (
                        <span className="font-semibold">
                          {70 - (challengeProgress?.currentProgress.option1.directCount || 0)} more sponsors needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 2 */}
                <div className="bg-white dark:bg-bpi-dark-card border-2 border-blue-500 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold">2</span>
                      </div>
                      <h4 className="text-xl font-bold">Qualification Option 2</h4>
                    </div>
                    <p className="text-sm opacity-90">Multi-generation team building</p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${challengeProgress?.currentProgress.isRegularPlus ? 'text-green-600' : 'text-gray-400'}`}>
                          {challengeProgress?.currentProgress.isRegularPlus ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">Activate or Upgrade to Regular Plus</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {challengeProgress?.currentProgress.isRegularPlus ? '✓ Completed' : 'Required first step'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${(challengeProgress?.currentProgress.option2.firstGenCount || 0) >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                          {(challengeProgress?.currentProgress.option2.firstGenCount || 0) >= 50 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">50 First Generation Members</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {challengeProgress?.currentProgress.option2.firstGenCount || 0} / 50
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${(challengeProgress?.currentProgress.option2.secondGenCount || 0) >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                          {(challengeProgress?.currentProgress.option2.secondGenCount || 0) >= 50 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">50 Second Generation Members</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {challengeProgress?.currentProgress.option2.secondGenCount || 0} / 50
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3">
                      {/* First Gen */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">1st Generation</span>
                          <span className="font-medium">{challengeProgress?.currentProgress.option2.firstGenCount || 0}/50</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${Math.min(((challengeProgress?.currentProgress.option2.firstGenCount || 0) / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Second Gen */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">2nd Generation</span>
                          <span className="font-medium">{challengeProgress?.currentProgress.option2.secondGenCount || 0}/50</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${Math.min(((challengeProgress?.currentProgress.option2.secondGenCount || 0) / 50) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Overall Progress */}
                      <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Overall Progress</span>
                          <span>{(challengeProgress?.currentProgress.option2.percentage || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`p-3 rounded-lg text-center ${
                      challengeProgress?.currentProgress.option2.qualified 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    }`}>
                      {challengeProgress?.currentProgress.option2.qualified ? (
                        <span className="font-semibold">✓ Option 2 Complete!</span>
                      ) : (
                        <span className="font-semibold">Multi-generation team building in progress</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              {challengeProgress?.nextSteps && challengeProgress.nextSteps.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowRight className="w-5 h-5 text-green-600" />
                    <h4 className="text-lg font-semibold text-foreground">Your Next Steps</h4>
                  </div>
                  <div className="space-y-3">
                    {challengeProgress.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{step.step}</span>}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? 'text-green-600' : 'text-foreground'}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          {step.details && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {step.details.firstGenRemaining > 0 && <p>• 1st Gen: {step.details.firstGenRemaining} more needed</p>}
                              {step.details.secondGenRemaining > 0 && <p>• 2nd Gen: {step.details.secondGenRemaining} more needed</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">How It Works</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Upgrade to Regular Plus</p>
                      <p className="text-sm text-muted-foreground">This membership tier is required to participate in the challenge</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Choose Your Path</p>
                      <p className="text-sm text-muted-foreground">Select either Option 1 (70 direct sponsors) or Option 2 (50+50 team building)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Track Your Progress</p>
                      <p className="text-sm text-muted-foreground">Monitor your progress in real-time and receive milestone notifications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Qualify & Earn</p>
                      <p className="text-sm text-muted-foreground">Once qualified, enjoy your share of {formatAmount(50000000)} yearly revenue distribution</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <FiDollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-90">Total Pool</span>
                  </div>
                  <p className="text-3xl font-bold">{formatAmount(50000000)}</p>
                  <p className="text-xs opacity-75 mt-1">Yearly revenue distribution</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-90">Spots Remaining</span>
                  </div>
                  <p className="text-3xl font-bold">{challengeProgress?.spotsRemaining || 100} / 100</p>
                  <p className="text-xs opacity-75 mt-1">{challengeProgress?.totalQualified || 0} qualified</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5" />
                    <span className="text-sm font-medium opacity-90">Your Status</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {challengeProgress?.isQualified ? 'Qualified' : 'In Progress'}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {challengeProgress?.isQualified 
                      ? 'Earning revenue share' 
                      : `${Math.max(
                          challengeProgress?.currentProgress.option1.percentage || 0,
                          challengeProgress?.currentProgress.option2.percentage || 0
                        ).toFixed(1)}% complete`
                    }
                  </p>
                </div>
              </div>

              {/* Challenge Statistics */}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-foreground">Challenge Statistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Participants</p>
                    <p className="text-2xl font-bold text-foreground">{challengeStats?.totalParticipants || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Qualified</p>
                    <p className="text-2xl font-bold text-foreground">{challengeStats?.totalQualified || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Option 1 Qualified</p>
                    <p className="text-2xl font-bold text-foreground">{challengeStats?.option1Qualified || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Option 2 Qualified</p>
                    <p className="text-2xl font-bold text-foreground">{challengeStats?.option2Qualified || 0}</p>
                  </div>
                </div>
              </div>

              {/* Your Progress Summary */}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-foreground">Your Progress Summary</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Regular Plus Membership</p>
                      <p className="text-sm text-muted-foreground">Required to participate</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      challengeProgress?.currentProgress.isRegularPlus
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {challengeProgress?.currentProgress.isRegularPlus ? '✓ Active' : '✗ Inactive'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">Option 1 Progress</p>
                      <p className="text-sm text-muted-foreground">
                        {challengeProgress?.currentProgress.option1.directCount || 0} / 70 sponsors
                      </p>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                        style={{ width: `${Math.min(challengeProgress?.currentProgress.option1.percentage || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(challengeProgress?.currentProgress.option1.percentage || 0).toFixed(1)}% complete
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">Option 2 Progress</p>
                      <p className="text-sm text-muted-foreground">
                        1st: {challengeProgress?.currentProgress.option2.firstGenCount || 0}/50, 
                        2nd: {challengeProgress?.currentProgress.option2.secondGenCount || 0}/50
                      </p>
                    </div>
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.min(challengeProgress?.currentProgress.option2.percentage || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(challengeProgress?.currentProgress.option2.percentage || 0).toFixed(1)}% complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Qualification Status */}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiAward className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-foreground">Qualification Criteria</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      challengeProgress?.currentProgress.isRegularPlus
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {challengeProgress?.currentProgress.isRegularPlus ? (
                        <FiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Regular Plus Membership <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {challengeProgress?.currentProgress.isRegularPlus ? 'Completed' : 'Required'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      challengeProgress?.currentProgress.option1.qualified || challengeProgress?.currentProgress.option2.qualified
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : (challengeProgress?.currentProgress.option1.directCount || 0) > 0 || (challengeProgress?.currentProgress.option2.firstGenCount || 0) > 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {challengeProgress?.currentProgress.option1.qualified || challengeProgress?.currentProgress.option2.qualified ? (
                        <FiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Complete Option 1 or Option 2 <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {challengeProgress?.currentProgress.option1.qualified || challengeProgress?.currentProgress.option2.qualified
                          ? 'Qualified!'
                          : (challengeProgress?.currentProgress.option1.directCount || 0) > 0 || (challengeProgress?.currentProgress.option2.firstGenCount || 0) > 0
                          ? 'In Progress'
                          : 'Not Started'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      (challengeProgress?.spotsRemaining || 0) > 0
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {(challengeProgress?.spotsRemaining || 0) > 0 ? (
                        <FiCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Spots Available <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {challengeProgress?.spotsRemaining || 0} of 100 spots remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-foreground">How It Works</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• <strong className="text-foreground">Pool Distribution:</strong> 10% of all company revenue flows into the Leadership Pool</p>
                  <p>• <strong className="text-foreground">Monthly Sharing:</strong> Pool is distributed among qualified leaders at month end</p>
                  <p>• <strong className="text-foreground">Performance Based:</strong> Your share is based on team size, sales volume, and rank</p>
                  <p>• <strong className="text-foreground">Automatic Payment:</strong> Earnings are credited directly to your wallet</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Period Selector */}
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      selectedPeriod === period
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {leaderboardData?.leaders && leaderboardData.leaders.length > 0 ? (
                  leaderboardData.leaders.map((leader) => (
                    <div
                      key={leader.userId}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        leader.rank <= 3
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800 shadow-md'
                          : 'bg-white dark:bg-bpi-dark-card border-bpi-border dark:border-bpi-dark-accent hover:shadow-md'
                      }`}
                    >
                      <div className="text-2xl">{getBadge(leader.rank)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{leader.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {leader.referrals} referrals • {leader.tier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₦{leader.earnings.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{leader.sharePercentage.toFixed(2)}% share</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-muted-foreground">No qualified leaders yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be among the first to qualify and claim your share
                    </p>
                  </div>
                )}
              </div>

              {/* Your Position */}
              <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Your Current Position</p>
                    <p className="text-2xl font-bold">Rank #{leaderboardData?.myRank || '--'}</p>
                  </div>
                  <Star className="w-12 h-12 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Claimable Rewards */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Available to Claim</p>
                    <p className="text-4xl font-bold">₦{(poolInfo?.myShare || 0).toLocaleString()}</p>
                    {poolInfo?.isQualified && (
                      <p className="text-xs opacity-75 mt-1">{poolInfo.tier} Tier • {poolInfo.sharePercentage.toFixed(2)}% share</p>
                    )}
                  </div>
                  <Gift className="w-16 h-16 opacity-20" />
                </div>
                <button
                  onClick={() => claimReward.mutate()}
                  disabled={claimReward.isPending || !poolInfo?.isQualified || (poolInfo?.myShare || 0) <= 0}
                  className="w-full bg-white text-emerald-600 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claimReward.isPending ? 'Claiming...' : !poolInfo?.isQualified ? 'Not Qualified' : (poolInfo?.myShare || 0) <= 0 ? 'No Rewards Available' : 'Claim Rewards'}
                </button>
              </div>

              {/* Earnings Breakdown */}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-semibold text-foreground">₦0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-semibold text-foreground">₦0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-bpi-border dark:border-bpi-dark-accent">
                    <span className="text-foreground font-medium">Total Earned</span>
                    <span className="font-bold text-lg text-amber-600">₦0.00</span>
                  </div>
                </div>
              </div>

              {/* Next Distribution */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-foreground">Next Distribution</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  The leadership pool is distributed on the last day of each month
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fadeIn">
              {poolHistory && poolHistory.length > 0 ? (
                poolHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{record.period}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <span className="text-lg font-bold text-emerald-600">+₦{record.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Ref: {record.reference}</span>
                      {record.description && <span>• {record.description}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-muted-foreground">No distribution history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep qualifying and your earnings will appear here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
