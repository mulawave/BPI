"use client";

import { useState } from "react";
import { FiX, FiZap, FiTrendingUp, FiAward, FiTarget } from "react-icons/fi";
import { Trophy, Star, TrendingUp, Zap, Award, Users, BarChart3, Crown } from "lucide-react";
import { api } from "@/client/trpc";

interface EpcEppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'dashboard' | 'calculator' | 'leaderboard' | 'achievements';

export default function EpcEppModal({ isOpen, onClose }: EpcEppModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedPoints, setSelectedPoints] = useState<number>(0);

  // API Queries
  const { data: epcData, refetch } = api.epcEpp.getMyStatus.useQuery();
  const { data: leaderboard } = api.epcEpp.getLeaderboard.useQuery({ limit: 10 });

  if (!isOpen) return null;

  const TABS = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'calculator' as TabType, label: 'Points Calculator', icon: Zap },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    { id: 'achievements' as TabType, label: 'Achievements', icon: Award },
  ];

  // Rank progression
  const ranks = [
    { name: 'Starter', minPoints: 0, color: 'from-gray-400 to-gray-500' },
    { name: 'Bronze', minPoints: 100, color: 'from-amber-600 to-orange-700' },
    { name: 'Silver', minPoints: 500, color: 'from-gray-300 to-gray-400' },
    { name: 'Gold', minPoints: 1500, color: 'from-yellow-400 to-amber-500' },
    { name: 'Platinum', minPoints: 3000, color: 'from-cyan-400 to-blue-500' },
    { name: 'Diamond', minPoints: 5000, color: 'from-purple-400 to-pink-500' },
  ];

  const currentRank = ranks.find(r => r.name === epcData?.currentRank) || ranks[0];
  const nextRank = ranks[ranks.findIndex(r => r.name === epcData?.currentRank) + 1];
  const progressPercentage = nextRank 
    ? ((epcData?.totalPoints || 0) - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints) * 100
    : 100;

  // Points earning activities
  const pointsActivities = [
    { action: 'Direct Referral', points: 50, icon: Users },
    { action: 'Package Upgrade', points: 100, icon: TrendingUp },
    { action: 'Monthly Sales Target', points: 200, icon: FiTarget },
    { action: 'Team Building Milestone', points: 150, icon: Trophy },
    { action: 'Training Completion', points: 75, icon: Award },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl animate-fadeIn">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <FiZap className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">EPC & EPP Program</h2>
                  <p className="text-orange-100 text-sm">Energy Performance Certification & Partnership</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap ${activeTab === id ? 'bg-white text-orange-600 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`bg-gradient-to-br ${currentRank.color} rounded-xl p-5 text-white shadow-lg`}>
                  <div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Current Rank</span></div>
                  <p className="text-3xl font-bold">{epcData?.currentRank || 'Starter'}</p>
                  <p className="text-xs opacity-75 mt-1">Level {epcData?.rankLevel || 1}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2"><Star className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Total Points</span></div>
                  <p className="text-3xl font-bold">{epcData?.totalPoints?.toLocaleString() || 0}</p>
                  <p className="text-xs opacity-75 mt-1">+{epcData?.monthlyPoints || 0} this month</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2"><Trophy className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Global Rank</span></div>
                  <p className="text-3xl font-bold">#{epcData?.globalRank || '--'}</p>
                  <p className="text-xs opacity-75 mt-1">Regional: #{epcData?.regionalRank || '--'}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="text-lg font-semibold text-foreground">Rank Progression</h3><p className="text-sm text-muted-foreground">{nextRank ? `${epcData?.nextRankPoints || 0} points to ${nextRank.name}` : 'Max rank achieved!'}</p></div>
                  <div className="text-right"><p className="text-2xl font-bold text-orange-600">{Math.round(progressPercentage)}%</p></div>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div className={`h-full bg-gradient-to-r ${currentRank.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(progressPercentage, 100)}%` }} />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6">
                  {ranks.map((rank) => (
                    <div key={rank.name} className={`text-center p-3 rounded-lg border-2 transition-all ${(epcData?.totalPoints || 0) >= rank.minPoints ? `border-transparent bg-gradient-to-br ${rank.color} text-white shadow-md` : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                      <Crown className={`w-6 h-6 mx-auto mb-1 ${(epcData?.totalPoints || 0) >= rank.minPoints ? '' : 'opacity-30'}`} />
                      <p className="text-xs font-medium">{rank.name}</p>
                      <p className="text-xs opacity-75">{rank.minPoints}pts</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-orange-600" /><h3 className="text-lg font-semibold text-foreground">Monthly Performance</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><p className="text-sm text-muted-foreground">This Month</p><p className="text-2xl font-bold text-orange-600">{epcData?.monthlyPoints || 0} pts</p></div>
                  <div><p className="text-sm text-muted-foreground">Last Month</p><p className="text-2xl font-bold text-foreground">{epcData?.lastMonthPoints || 0} pts</p></div>
                  <div><p className="text-sm text-muted-foreground">Growth</p><p className={`text-2xl font-bold ${(epcData?.monthlyPoints || 0) >= (epcData?.lastMonthPoints || 0) ? 'text-green-600' : 'text-red-600'}`}>{((epcData?.monthlyPoints || 0) - (epcData?.lastMonthPoints || 0) >= 0 ? '+' : '')}{((epcData?.monthlyPoints || 0) - (epcData?.lastMonthPoints || 0))}</p></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'calculator' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Points Calculator</h3>
                <p className="text-sm text-muted-foreground mb-6">Calculate how many points you can earn from different activities</p>
                <div className="space-y-4">
                  {pointsActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg"><Icon className="w-5 h-5 text-orange-600" /></div>
                          <div><p className="font-medium text-foreground">{activity.action}</p><p className="text-sm text-muted-foreground">+{activity.points} points</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="number" min="0" className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-foreground" placeholder="0" onChange={(e) => setSelectedPoints(prev => prev + (parseInt(e.target.value) || 0) * activity.points)} />
                          <span className="text-sm text-muted-foreground">times</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl text-white">
                  <div className="flex items-center justify-between"><div><p className="text-sm opacity-90">Estimated Points Earnings</p><p className="text-3xl font-bold mt-1">{selectedPoints.toLocaleString()} pts</p></div><Zap className="w-12 h-12 opacity-20" /></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4 animate-fadeIn">
              {leaderboard && leaderboard.leaders.length > 0 ? leaderboard.leaders.map((leader: any, index: number) => (
                <div key={leader.userId} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${index < 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 shadow-md' : 'bg-white dark:bg-bpi-dark-card border-bpi-border dark:border-bpi-dark-accent hover:shadow-md'}`}>
                  <div className="text-3xl font-bold w-12 text-center">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                  <div className="flex-1"><p className="font-semibold text-foreground">{leader.name}</p><p className="text-sm text-muted-foreground">{leader.rank} • {leader.region || 'Global'}</p></div>
                  <div className="text-right"><p className="text-xl font-bold text-orange-600">{leader.points.toLocaleString()}</p><p className="text-xs text-muted-foreground">points</p></div>
                </div>
              )) : (<div className="text-center py-12"><Trophy className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" /><p className="text-muted-foreground">No leaderboard data yet</p></div>)}
            </div>
          )}
          {activeTab === 'achievements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[{ title: 'First Steps', desc: 'Join EPC Program', unlocked: true }, { title: 'Rising Star', desc: 'Reach Bronze', unlocked: (epcData?.totalPoints || 0) >= 100 }, { title: 'Consistent Performer', desc: '30 Days Active', unlocked: false }, { title: 'Team Builder', desc: '10 Direct Referrals', unlocked: false }, { title: 'Top Tier', desc: 'Reach Gold', unlocked: (epcData?.totalPoints || 0) >= 1500 }, { title: 'Legend', desc: 'Reach Diamond', unlocked: (epcData?.totalPoints || 0) >= 5000 }].map((achievement, index) => (
                  <div key={index} className={`p-4 rounded-xl border-2 transition-all ${achievement.unlocked ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-transparent text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                    <Award className={`w-8 h-8 mb-2 ${achievement.unlocked ? '' : 'opacity-30'}`} />
                    <p className="font-semibold">{achievement.title}</p>
                    <p className="text-xs opacity-75 mt-1">{achievement.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
