"use client";

import { useState } from "react";
import { FiX, FiExternalLink, FiCopy, FiCheck, FiAlertCircle } from "react-icons/fi";
import { 
  Share2, Target, TrendingUp, Users, Link as LinkIcon, 
  CheckCircle2, AlertCircle, Bell, ExternalLink 
} from "lucide-react";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface ThirdPartyOpportunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'available' | 'my-links' | 'reminders';

export default function ThirdPartyOpportunitiesModal({ 
  isOpen, 
  onClose 
}: ThirdPartyOpportunitiesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [submittingPlatformId, setSubmittingPlatformId] = useState<string | null>(null);
  const [newLinks, setNewLinks] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const utils = api.useUtils();

  // API Queries
  const { data: availablePlatforms, isLoading: loadingAvailable } = 
    api.thirdPartyPlatforms.getAvailablePlatforms.useQuery();
  
  const { data: myPlatforms, isLoading: loadingMyPlatforms } = 
    api.thirdPartyPlatforms.getMyPlatformsWithStats.useQuery();
  
  const { data: summary } = 
    api.thirdPartyPlatforms.getSummary.useQuery();

  // Submit link mutation
  const submitLink = api.thirdPartyPlatforms.submitReferralLink.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      setNewLinks({});
      setSubmittingPlatformId(null);
      // Refetch data
      await utils.thirdPartyPlatforms.getAvailablePlatforms.invalidate();
      await utils.thirdPartyPlatforms.getMyPlatformsWithStats.invalidate();
      await utils.thirdPartyPlatforms.getSummary.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setSubmittingPlatformId(null);
    },
  });

  // Mark registration mutation
  const markRegistration = api.thirdPartyPlatforms.markRegistration.useMutation({
    onSuccess: async () => {
      await utils.thirdPartyPlatforms.getMyPlatformsWithStats.invalidate();
    },
  });

  const handleCopyLink = async (link: string, platformId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(platformId);
      setTimeout(() => setCopiedLink(null), 2000);
      toast.success("Link copied");
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy link");
    }
  };

  const handleSubmitLink = (platformId: string) => {
    const link = newLinks[platformId];
    if (!link || !link.trim()) {
      toast.error('Please enter a valid referral link');
      return;
    }

    setSubmittingPlatformId(platformId);
    submitLink.mutate({
      platformId,
      referralLink: link.trim(),
    });
  };

  const handleOpenSponsorLink = (platformId: string, link: string) => {
    // Mark registration when user clicks sponsor's link
    markRegistration.mutate({ platformId });
    window.open(link, '_blank');
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
              {loadingAvailable ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-4">Loading platforms...</p>
                </div>
              ) : availablePlatforms && availablePlatforms.length > 0 ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          How It Works
                        </h3>
                        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                          <li>Click your sponsor's referral link below</li>
                          <li>Register on the platform using their link</li>
                          <li>Get your own referral link from that platform</li>
                          <li>Come back and submit your link here</li>
                          <li>Your direct downlines will see YOUR link and register</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePlatforms.map((platform: any) => (
                      <div
                        key={platform.id}
                        className="border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-5 bg-white dark:bg-bpi-dark-card hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                            {platform.icon || platform.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg">{platform.name}</h3>
                            <p className="text-sm text-muted-foreground">{platform.description}</p>
                            {platform.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                {platform.category}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              Referral Link from: {platform.linkOwner}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={platform.referralLink}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white dark:bg-bpi-dark-accent border border-purple-200 dark:border-purple-800 rounded text-sm"
                            />
                            <button
                              onClick={() => handleCopyLink(platform.referralLink, platform.id)}
                              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                              title="Copy link"
                            >
                              {copiedLink === platform.id ? (
                                <FiCheck className="w-4 h-4" />
                              ) : (
                                <FiCopy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleOpenSponsorLink(platform.id, platform.referralLink)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="Open link"
                            >
                              <FiExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-bpi-border dark:border-bpi-dark-accent pt-3">
                          <label className="block text-xs font-medium text-foreground mb-2">
                            Your Referral Link (after registration)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://platform.com/ref?id=yourlink"
                              value={newLinks[platform.id] || ''}
                              onChange={(e) => setNewLinks({ ...newLinks, [platform.id]: e.target.value })}
                              className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:border-bpi-primary focus:outline-none"
                              disabled={submittingPlatformId === platform.id}
                            />
                            <Button
                              onClick={() => handleSubmitLink(platform.id)}
                              disabled={!newLinks[platform.id] || submittingPlatformId === platform.id}
                              className="bg-bpi-primary hover:bg-bpi-primary/90 px-4"
                            >
                              {submittingPlatformId === platform.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                'Submit'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    All Done!
                  </h3>
                  <p className="text-muted-foreground">
                    You've completed all available platforms. Check "My Links & Stats" to track your team's progress.
                  </p>
                </div>
              )}
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

                      <div className="bg-gray-50 dark:bg-bpi-dark-accent rounded-lg p-3 mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Your Referral Link</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item.referralLink}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white dark:bg-bpi-dark-card border border-input rounded text-sm"
                          />
                          <button
                            onClick={() => handleCopyLink(item.referralLink, item.platform.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            {copiedLink === item.platform.id ? (
                              <FiCheck className="w-4 h-4" />
                            ) : (
                              <FiCopy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
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
                    Start by completing platform registrations in the "Complete Registration" tab.
                  </p>
                  <Button onClick={() => setActiveTab('available')} className="bg-bpi-primary hover:bg-bpi-primary/90">
                    Get Started
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
