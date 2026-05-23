"use client";

import { useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { 
  Share2, Target, TrendingUp, Users, Link as LinkIcon,
  CheckCircle2, AlertCircle, Bell
} from "lucide-react";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface ThirdPartyOpportunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMatrixModal?: () => void;
}

type TabType = 'available' | 'my-links' | 'reminders';

export default function ThirdPartyOpportunitiesModal({ 
  isOpen, 
  onClose,
  onOpenMatrixModal,
}: ThirdPartyOpportunitiesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('available');
  
  const { data: myPlatforms, isLoading: loadingMyPlatforms } = 
    api.thirdPartyPlatforms.getMyPlatformsWithStats.useQuery();
  
  const { data: summary } = 
    api.thirdPartyPlatforms.getSummary.useQuery();

  const openMatrixConsole = () => {
    onClose();
    onOpenMatrixModal?.();
  };

  if (!isOpen) return null;

  const TABS = [
    { id: 'available' as TabType, label: 'Complete Registration', icon: Target, badge: summary?.pendingPlatforms },
    { id: 'my-links' as TabType, label: 'My Links & Stats', icon: TrendingUp, badge: null },
    { id: 'reminders' as TabType, label: 'Team Progress', icon: Bell, badge: null },
  ];

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
        <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Share2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Third-Party Training & Mentorship</h2>
                  <p className="text-purple-100 text-sm">Grow together across platforms</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-white/70 mb-1">Total Platforms</div>
                  <div className="text-2xl font-bold">{summary.totalPlatforms}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-white/70 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-300">{summary.completedPlatforms}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-white/70 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-yellow-300">{summary.pendingPlatforms}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xs text-white/70 mb-1">Team Registered</div>
                  <div className="text-2xl font-bold text-blue-300">
                    {summary.totalRegistrations}/{summary.totalDirectDownlines}
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {TABS.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap relative ${
                    activeTab === id
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                  {badge !== null && badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-260px)] p-6">
          
          {/* TAB 1: COMPLETE REGISTRATION */}
          {activeTab === 'available' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Opportunities And Matrix Are Separate
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Referral links and submission actions now live only in the Third-Party Matrix modal.
                      Use this modal for progress overview, and use Matrix Console for link operations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-5 bg-white dark:bg-bpi-dark-card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Pending Registrations</h3>
                    <p className="text-sm text-muted-foreground">
                      {summary?.pendingPlatforms ?? 0} platform{(summary?.pendingPlatforms ?? 0) === 1 ? '' : 's'} pending.
                    </p>
                  </div>
                  <Button
                    onClick={openMatrixConsole}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Open Matrix Console
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY LINKS & STATS */}
          {activeTab === 'my-links' && (
            <div className="space-y-6 animate-fadeIn">
              {loadingMyPlatforms ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading your platforms...</p>
                </div>
              ) : myPlatforms && myPlatforms.length > 0 ? (
                <div className="space-y-4">
                  {myPlatforms.map((item: any) => (
                    <div
                      key={item.platform.id}
                      className="border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6 bg-white dark:bg-bpi-dark-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                            {item.platform.icon || item.platform.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{item.platform.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.platform.description}</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>

                      <div className="bg-gray-50 dark:bg-bpi-dark-accent rounded-lg p-3 mb-4 text-xs text-muted-foreground">
                        Link actions are available only in Matrix Console.
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{item.totalDirectDownlines}</div>
                          <div className="text-xs text-muted-foreground">Total Team</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{item.registeredCount}</div>
                          <div className="text-xs text-muted-foreground">Registered</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{item.pendingCount}</div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{item.completionRate}%</div>
                          <div className="text-xs text-muted-foreground">Completion</div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-bpi-dark-accent rounded-full h-3 mb-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>

                      {item.registeredUsers.length > 0 && (
                        <div className="border-t border-bpi-border dark:border-bpi-dark-accent pt-4">
                          <div className="text-sm font-medium text-foreground mb-2">Recent Registrations</div>
                          <div className="space-y-2">
                            {item.registeredUsers.slice(0, 5).map((user: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{user.name}</span>
                                <span className="text-muted-foreground">
                                  {new Date(user.registeredAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Links Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Open Matrix Console to register and submit links, then return here to monitor progress.
                  </p>
                  <Button onClick={openMatrixConsole} className="bg-bpi-primary hover:bg-bpi-primary/90">
                    Open Matrix Console
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM PROGRESS / REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Team Progress Overview
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Monitor how many of your direct team members have completed each platform registration.
                      Encourage pending members to join and grow together!
                    </p>
                  </div>
                </div>
              </div>

              {myPlatforms && myPlatforms.length > 0 ? (
                <div className="space-y-4">
                  {myPlatforms.map((item: any) => (
                    <div
                      key={item.platform.id}
                      className="border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-5 bg-white dark:bg-bpi-dark-card"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {item.platform.icon || item.platform.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{item.platform.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {item.registeredCount} of {item.totalDirectDownlines} team members registered
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">{item.completionRate}%</div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 dark:bg-bpi-dark-accent rounded-full h-2 mb-3">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>

                      {item.pendingCount > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                            <FiAlertCircle className="w-4 h-4" />
                            <span>
                              {item.pendingCount} team member{item.pendingCount !== 1 ? 's' : ''} haven't registered yet
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Platform Data
                  </h3>
                  <p className="text-muted-foreground">
                    Submit your referral links first to track team progress.
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
