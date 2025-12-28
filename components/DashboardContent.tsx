"use client";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/client/trpc";
import { 
  User, Calendar, DollarSign, Users, TrendingUp, 
  Bell, Settings, LogOut, ChevronDown, Play,
  CreditCard, BarChart3, Wallet, Gift, Award,
  Shield, BookOpen, Youtube, Calculator,
  Globe, Zap, Target, Home, Cpu, HeadphonesIcon,
  Store, Grid3x3, Wrench, HelpCircle, ShoppingCart,
  Archive, Database, Server, FileImage, Moon, Sun, X,
  Router, Book, Inbox, FileText, Bookmark, Camera,
  Edit, Check, Eye, Heart, AlertCircle
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Modal } from "./ui/Modal";
import { checkProfileCompletion, getCompletionMessage } from "@/lib/profile-completion";
import DashboardPreview from "./DashboardPreview";

interface DashboardContentProps {
  session: Session;
}

// ProfileField Component for inline editing
interface ProfileFieldProps {
  label: string;
  value: string;
  fieldKey: string;
  isEditable: boolean;
  onUpdateStatus?: (status: 'loading' | 'success' | 'error', message: string) => void;
}

function ProfileField({ label, value, fieldKey, isEditable, onUpdateStatus }: ProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const utils = api.useUtils();
  
  const updateProfile = api.legacy.updateUserProfile.useMutation({
    onMutate: () => {
      onUpdateStatus?.('loading', `Updating ${label.toLowerCase()}...`);
    },
    onSuccess: async () => {
      setIsEditing(false);
      onUpdateStatus?.('success', `${label} updated successfully!`);
      // Refetch profile data to update UI in real-time
      await utils.legacy.getUserProfile.invalidate();
    },
    onError: (error) => {
      console.error(`Failed to update ${fieldKey}:`, error.message);
      setEditValue(value); // Reset to original value
      setIsEditing(false);
      onUpdateStatus?.('error', `Failed to update ${label.toLowerCase()}. Please try again.`);
    }
  });

  const handleEdit = () => {
    if (isEditable) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = () => {
    updateProfile.mutate({
      fieldKey,
      value: editValue
    });
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-bpi-dark-accent last:border-b-0">
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground mb-0 block">
          {label}
        </label>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm text-foreground bg-transparent border border-bpi-border dark:border-bpi-dark-accent rounded px-1.5 py-0.5 w-full focus:border-bpi-primary focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
              disabled={updateProfile.isPending}
            />
            {updateProfile.isPending && (
              <div className="w-3 h-3 border-2 border-bpi-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        ) : (
          <span className="text-sm text-foreground">
            {value || 'Not set'}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-0.5 ml-1">
        {isEditable && (
          isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleCancel}
                disabled={updateProfile.isPending}
                className="p-0.5 text-gray-400 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="p-0.5 text-bpi-primary hover:bg-bpi-primary/10 rounded transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function DashboardContent({ session }: DashboardContentProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, toggleTheme } = useTheme();
  // Announcement state + animation
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(true);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Mock notification count
  const notificationCount = 4;

  // Auto-scroll slides
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2); // 2 slides total
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(slideInterval);
  }, []);
  
  // Alert state for profile updates
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'warning' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  const handleUpdateStatus = (status: 'loading' | 'success' | 'error', message: string) => {
    if (status === 'loading') {
      setAlertState({ show: true, type: 'warning', message });
    } else if (status === 'success') {
      setAlertState({ show: true, type: 'success', message });
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setAlertState(prev => ({ ...prev, show: false }));
      }, 3000);
    } else {
      setAlertState({ show: true, type: 'error', message });
    }
  };

  const dismissAlert = () => {
    setAlertState(prev => ({ ...prev, show: false }));
  };
  const [isEntering, setIsEntering] = useState<boolean>(false);

  // Avatar upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // Legacy API data fetching
  const utils = api.useUtils();
  const { data: userProfile } = api.legacy.getUserProfile.useQuery();
  const { data: walletBalances } = api.legacy.getWalletBalances.useQuery();
  const { data: referralStats } = api.legacy.getReferralStats.useQuery();
  const { data: communityStats } = api.legacy.getCommunityStats.useQuery();
  const { data: activeShelters } = api.legacy.getActiveShelters.useQuery();
  const { data: transactionHistory } = api.legacy.getTransactionHistory.useQuery({ limit: 5 });
  const { data: leadershipPool } = api.legacy.getLeadershipPool.useQuery();
  
  // New membership package query for gating
  const { data: userDetails, isLoading: isLoadingDetails } = api.user.getDetails.useQuery();
  const needsActivation = !isLoadingDetails && !userDetails?.activeMembership;

  // Check profile completion
  const profileCompletionStatus = checkProfileCompletion({
    firstname: userProfile?.firstname,
    lastname: userProfile?.lastname,
    email: userProfile?.email,
    mobile: userProfile?.mobile,
    address: userProfile?.address,
    city: userProfile?.city,
    state: userProfile?.state,
    country: userProfile?.country,
    gender: userProfile?.gender,
    image: userProfile?.image,
  });
  
  const isProfileComplete = profileCompletionStatus.isComplete;
  
  // Legacy data for compatibility
  const accountSummary = walletBalances;
  const bpiStats = {
    totalMembers: communityStats?.totalMembers || 0,
    palliativeMembers: communityStats?.palliativeMembers || 0,
    activeShelters: communityStats?.activeShelters || 0,
    activeTickets: communityStats?.activeTickets || 0
  };

  // Configure expiration: number of days after dismissal to show again, or 'never'
  // Change this constant to the number of days you want, or 'never' to never repeat
  const ANNOUNCEMENT_EXPIRY_DAYS: number | 'never' = 7;

    // Persist announcement dismissal in localStorage.
    // We'll store a JSON object: { ts: number, days: number } or the string 'never'
    function setDismissalPreference(value: number | 'never') {
      try {
        if (value === 'never') {
          localStorage.setItem('bpi:announcement:closed', 'never');
        } else {
          const payload = { ts: Date.now(), days: value };
          localStorage.setItem('bpi:announcement:closed', JSON.stringify(payload));
        }
      } catch (e) {
        // ignore
      }
    }

    useEffect(() => {
      try {
        const val = localStorage.getItem('bpi:announcement:closed');
        if (!val) return;

        if (val === 'never') {
          setShowAnnouncement(false);
          return;
        }

        // try parse JSON
        try {
          const obj = JSON.parse(val);
          if (obj && typeof obj.ts === 'number' && typeof obj.days === 'number') {
            const expireAt = obj.ts + obj.days * 24 * 60 * 60 * 1000;
            if (Date.now() < expireAt) {
              setShowAnnouncement(false);
              return;
            }
          }
        } catch (e) {
          // not JSON; fall back to old numeric timestamp behavior
          const ts = parseInt(val, 10);
          if (!isNaN(ts)) {
            // default expiry was 7 days
            const expireAt = ts + 7 * 24 * 60 * 60 * 1000;
            if (Date.now() < expireAt) {
              setShowAnnouncement(false);
              return;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }, []);

  // Entrance animation trigger when announcement is mounted
  useEffect(() => {
    if (showAnnouncement) {
      setIsEntering(true);
      const t = setTimeout(() => setIsEntering(false), 50);
      return () => clearTimeout(t);
    }
  }, [showAnnouncement]);

  // API queries - temporarily commented for demo
  // const { data: bpiMember } = api.bpi.getBpiMember.useQuery();
  // const { data: accountSummary } = api.bpi.getAccountSummary.useQuery();
  // const { data: profileStatus } = api.bpi.getProfileStatus.useQuery();
  // const { data: referralStats } = api.referral.getReferralStats.useQuery();
  // const { data: communityStats } = api.bpi.getCommunityStats.useQuery();
  // const { data: leadershipPool } = api.bpi.getLeadershipPool.useQuery();
  // const { data: recentTransactions } = api.bpi.getRecentTransactions.useQuery({ limit: 5 });

  // Mock data for demo
  const bpiMember = null;
  const profileStatus = { completionPercentage: profileCompletionStatus.completionPercentage };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Avatar upload handler
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      handleUpdateStatus('error', 'Invalid file type. Please upload a valid image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      handleUpdateStatus('error', 'File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);
      
      handleUpdateStatus('success', 'Avatar uploaded successfully!');
      
      // Refetch profile to update both avatar locations
      await utils.legacy.getUserProfile.invalidate();
      
      // Reset upload state after 1 second
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      handleUpdateStatus('error', error instanceof Error ? error.message : 'Failed to upload avatar');
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    const input = document.getElementById('avatar-upload-input') as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Subscription Activation Modal */}
      <Modal isOpen={needsActivation} title="Activate Your Account">
        <p className="mb-6 text-muted-foreground">
          Your account is not yet active. Please choose a membership plan to unlock all features and start your journey with BPI.
        </p>
        <Link href="/membership">
          <Button size="lg" className="w-full" disabled={isLoadingDetails}>
            {isLoadingDetails ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Activate a Plan"
            )}
          </Button>
        </Link>
      </Modal>

      {/* Extended Header with BPI Theme */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm">
        <div className="max-w-[95vw] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Brand - Aligned with container left */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                  BeepAgro Africa
                </h1>
                <p className="text-sm text-muted-foreground">Palliative Initiative</p>
              </div>
            </div>

            {/* User Menu - Aligned with container right */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{currentTime.toLocaleDateString()}</span>
                <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2 bg-background hover:bg-accent"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="hidden md:inline">
                  {theme === 'light' ? 'Dark' : 'Light'}
                </span>
              </Button>

              {/* Notification Button with Badge */}
              <div className="relative" id="notification-trigger">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="gap-2 bg-background hover:bg-accent relative"
                >
                  <Bell className="w-4 h-4" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                  <span className="hidden md:inline">Notifications</span>
                </Button>

                {/* Notification Dropdown Panel - Back to Absolute with Higher Z-Index */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0"
                      style={{ zIndex: 99999999 }}
                      onClick={() => setShowNotifications(false)}
                    />
                    <div 
                      className="absolute right-0 mt-2 w-80 bg-bpi-dark-card/95 backdrop-blur-lg rounded-xl shadow-2xl border border-bpi-border dark:border-bpi-dark-accent max-h-96 overflow-hidden"
                      style={{ zIndex: 999999999 }}
                    >
                      {/* Caret */}
                      <div 
                        className="absolute -top-2 right-16 w-4 h-4 bg-bpi-dark-card/95 border-l border-t border-bpi-border dark:border-bpi-dark-accent transform rotate-45"
                        style={{ zIndex: 999999999 }}
                      ></div>
                      
                      <div className="p-4 border-b border-bpi-border dark:border-bpi-dark-accent bg-bpi-dark-card/95 rounded-t-xl">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Bell className="w-5 h-5 text-orange-600" />
                          Recent Notifications
                        </h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="p-4 space-y-3">
                          {/* Notifications */}
                          {[
                            {
                              type: "system",
                              title: "New Palliative Program Available",
                              message: "Check out our latest Solar Palliative offering",
                              time: "2 hours ago",
                              icon: Zap,
                              color: "from-yellow-500 to-orange-500"
                            },
                            {
                              type: "referral",
                              title: "Referral Commission Earned",
                              message: "You earned ₦5,000 from John Doe's activation",
                              time: "5 hours ago",
                              icon: Users,
                              color: "from-green-500 to-emerald-500"
                            },
                            {
                              type: "update",
                              title: "Profile Update Required",
                              message: "Complete your profile to access new features",
                              time: "1 day ago",
                              icon: User,
                              color: "from-blue-500 to-cyan-500"
                            },
                            {
                              type: "announcement",
                              title: "Leadership Pool Registration",
                              message: "Limited slots available for the leadership program",
                              time: "2 days ago",
                              icon: Award,
                              color: "from-purple-500 to-pink-500"
                            }
                          ].map((notification, index) => (
                            <div key={index} className="flex gap-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                              <div className={`w-10 h-10 bg-gradient-to-r ${notification.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <notification.icon className="w-5 h-5 text-white" />
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground text-sm mb-1">{notification.title}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                              </div>
                              
                              <div className="w-2 h-2 bg-bpi-primary rounded-full mt-2 flex-shrink-0"></div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-t border-bpi-border dark:border-bpi-dark-accent">
                          <Button variant="outline" className="w-full text-sm">
                            <Bell className="w-4 h-4 mr-2" />
                            View All Notifications
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile?.image ? (
                    <img 
                      src={userProfile.image} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Regular Member
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>

              <Link href="/api/auth/signout">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-[95vw] mx-auto px-4 py-8 relative">
        {/* Profile Completion Banner */}
        {!isProfileComplete && (
          <div className="mb-6 relative z-30">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-2xl border-2 border-orange-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Complete Your Profile</h3>
                  <p className="text-white/90 mb-3">
                    {getCompletionMessage(profileCompletionStatus)}
                  </p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Profile Completion</span>
                      <span className="font-bold">{profileCompletionStatus.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-3">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${profileCompletionStatus.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  {profileCompletionStatus.missingFields.length > 0 && (
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Missing fields:</p>
                      <p className="text-white/80">{profileCompletionStatus.missingFields.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-2 relative">
          
          {/* Profile Incomplete Overlay - Blocks EVERYTHING except User Profile Card */}
          {!isProfileComplete && (
            <>
              {/* Semi-transparent blocking overlay - covers header and all content */}
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-10 pointer-events-auto"
              />
              
              {/* Dashboard Preview (visible but disabled) */}
              <div className="fixed inset-0 z-5 pointer-events-none" style={{ top: '280px' }}>
                <DashboardPreview />
              </div>
            </>
          )}
          
          {/* Vertical Navigation Sidebar */}
          <div className="col-span-12 lg:col-span-1">
            <div className="rounded-2xl">
              <div className="space-y-2">
              {/* Admin Section (conditional) - temporarily disabled until role checking is implemented */}
              {false && (
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Cpu className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Intel</span>
                    </div>
                  </Card>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Intelligence Center
                  </div>
                </div>
              )}

              {/* Dashboard Section (Active) */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-bpi-primary to-bpi-secondary text-white border-0 shadow-xl ring-2 ring-bpi-primary/30">
                    <div className="flex flex-col items-center">
                      <Home className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Dashboard</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Member Dashboard
                  </div>
                </div>
              </div>

              {/* Community Support */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <HeadphonesIcon className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Support</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Community Support
                  </div>
                </div>
              </div>

              {/* Storefront */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Store className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Store</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Storefront
                  </div>
                </div>
              </div>

              {/* Palliative Services */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Grid3x3 className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Services</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Palliative Services
                  </div>
                </div>
              </div>

              {/* BPI Tools */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Wrench className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Tools</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    BPI Tools
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <User className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Account</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Account Management
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="bg-white dark:bg-bpi-dark-card rounded-xl p-2 mb-4 shadow-lg">
                <div className="relative group">
                  <Card className="p-4 bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-center">
                      <HelpCircle className="w-6 h-6 mb-2" />
                      <span className="text-xs font-medium">Help</span>
                    </div>
                  </Card>
                  <div className="absolute left-full ml-2 top-0 bg-bpi-dark-card dark:bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Support & Help
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* User Profile Column */}
          <div className="col-span-12 lg:col-span-3">
            {/* User Profile Card - ONLY this card elevated with z-20 when profile incomplete */}
            <div className={`bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3 ${!isProfileComplete ? 'relative z-20' : ''}`}>
              <h2 className="text-lg font-semibold text-foreground mb-3">User Profile</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  {userProfile?.image ? (
                    <img 
                      src={userProfile.image} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {/* Hidden file input */}
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                  {/* Floating Avatar Update Icon */}
                  <button 
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-bpi-secondary hover:bg-bpi-primary text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>
                
                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-2">
                    <div className="text-xs text-muted-foreground mb-1">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-gray-200 dark:bg-bpi-dark-accent rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-bpi-primary to-bpi-secondary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <h2 className="font-bold text-base text-foreground mb-0.5">
                  {session.user?.name || 'BPI Member'}
                </h2>
                <p className="text-xs text-muted-foreground mb-2">
                  {session.user?.email}
                </p>

                {/* Profile Progress */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">Profile Status</span>
                    <span className="font-semibold text-foreground">
                      {profileStatus?.completionPercentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-bpi-dark-accent rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-bpi-primary to-bpi-secondary h-1.5 rounded-full transition-all"
                      style={{ width: `${profileStatus?.completionPercentage || 0}%` }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <hr className="my-2 border-gray-200 dark:border-bpi-dark-accent" />
                
                {/* Profile Update Alert */}
                {alertState.show && (
                  <div 
                    id="profile_edit_alert_div"
                    className={`mb-2 p-2 rounded border text-xs flex items-center justify-between ${
                      alertState.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                        : alertState.type === 'warning'
                        ? 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200'
                        : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                    }`}
                  >
                    <span>{alertState.message}</span>
                    <button
                      onClick={dismissAlert}
                      className="ml-1 p-0.5 hover:bg-black/10 rounded transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                
                {/* Profile Fields with Inline Editing */}
                <div className="space-y-1 text-left">
                  {/* First Name */}
                  <ProfileField
                    label="First Name"
                    value={userProfile?.firstname || ''}
                    fieldKey="firstname"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Last Name */}
                  <ProfileField
                    label="Last Name"
                    value={userProfile?.lastname || ''}
                    fieldKey="lastname"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Email (Read-only) */}
                  <ProfileField
                    label="Email"
                    value={userProfile?.email || ''}
                    fieldKey="email"
                    isEditable={false}
                  />
                  
                  {/* Phone */}
                  <ProfileField
                    label="Phone"
                    value={userProfile?.mobile || ''}
                    fieldKey="mobile"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Address */}
                  <ProfileField
                    label="Address"
                    value={userProfile?.address || ''}
                    fieldKey="address"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* City */}
                  <ProfileField
                    label="City"
                    value={userProfile?.city || ''}
                    fieldKey="city"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* State */}
                  <ProfileField
                    label="State"
                    value={userProfile?.state || ''}
                    fieldKey="state"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Country */}
                  <ProfileField
                    label="Country"
                    value={userProfile?.country || ''}
                    fieldKey="country"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Gender */}
                  <ProfileField
                    label="Gender"
                    value={userProfile?.gender || ''}
                    fieldKey="gender"
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                </div>

                <div className="mt-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Shield className="w-3 h-3" />
                    <span className="text-xs">Security</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>


            {/* Storage Stats */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Account Statistics</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4">Account Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-muted-foreground">Total Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-bpi-primary rounded-full" />
                    <span className="text-sm text-muted-foreground">Level 1</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.level1 || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-bpi-secondary rounded-full" />
                    <span className="text-sm text-muted-foreground">Direct</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.directReferrals?.length || 0}
                  </span>
                </div>
              </div>
            </Card>
            </div>

            {/* Account Status & Activations */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Account Status</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4">Account Status</h3>
              <div className="space-y-3">
                {/* BPI Activation Status */}
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">BPI Activation</span>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Active
                  </span>
                </div>

                {/* Profile Status */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Profile Status</span>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {profileStatus?.completionPercentage >= 80 ? 'Complete' : 'Incomplete'}
                  </span>
                </div>

                {/* Shelter Palliative Activation */}
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Shelter Palliative</span>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                    Inactive
                  </span>
                </div>

                {/* Student Palliative Activation */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Student Palliative</span>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                    Inactive
                  </span>
                </div>
              </div>
            </Card>
            </div>

            {/* Referral System Cards */}
            {/* Auto Inviter */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Referral Tools</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-bpi-primary" />
                Auto Inviter
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your friend's email and we'll send them an invite from you
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Friend's First Name"
                  className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm"
                />
                <input
                  type="email"
                  placeholder="Friend's Email"
                  className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-bpi-primary hover:bg-bpi-primary/90 text-sm">
                    <Users className="w-4 h-4 mr-2" />
                    Send Invite
                  </Button>
                  <Button variant="outline" className="px-3">
                    <Inbox className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
            </div>

            {/* Referral Link */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Share Link</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-bpi-secondary" />
                Referral Link
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your unique referral link
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg border border-bpi-border dark:border-bpi-dark-accent">
                  <p className="text-xs text-muted-foreground break-all">
                    https://bpi.beepagro.com/register?ref=BPI{Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-bpi-secondary hover:bg-bpi-secondary/90 text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" className="px-3">
                    <Globe className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
            </div>

            {/* Latest Invites */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Recent Referrals</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg mb-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Latest Invites
              </h3>
              <div className="space-y-3">
                {/* Mock referral data */}
                {[
                  { name: "John Doe", date: "Nov 14", status: "Active" },
                  { name: "Jane Smith", date: "Nov 12", status: "Pending" },
                  { name: "Mike Johnson", date: "Nov 10", status: "Active" }
                ].map((invite, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{invite.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{invite.name}</p>
                      <p className="text-xs text-muted-foreground">Joined: {invite.date}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      invite.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {invite.status}
                    </span>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full text-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Referrals
                </Button>
              </div>
            </Card>
            </div>

                {/* Latest Blog Posts */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Community Blog</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-6 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-8">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-bpi-primary" />
                Latest From Our Blog
              </h3>
              <div className="space-y-4">
                {/* Mock blog posts */}
                {[
                  {
                    title: "BPI Leadership Pool Opens 100 New Slots",
                    excerpt: "Exciting opportunity for members to join our prestigious leadership program and become part of our transformative initiatives...",
                    author: "BPI Admin",
                    date: "Nov 14, 2024",
                    views: 248,
                    comments: 12,
                    likes: 45,
                    image: "blog-1.jpg"
                  },
                  {
                    title: "Solar Palliative Program Launch",
                    excerpt: "Revolutionary green energy initiative now available for BPI members to participate in sustainable development projects...",
                    author: "Energy Team",
                    date: "Nov 12, 2024",
                    views: 156,
                    comments: 8,
                    likes: 32,
                    image: "blog-2.jpg"
                  },
                ].map((post, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                    {/* Row 1: Blog Image */}
                    <div className="w-full h-32 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-lg flex items-center justify-center mb-3">
                      <FileImage className="w-12 h-12 text-white" />
                    </div>
                    
                    {/* Row 2: Blog Title */}
                    <h4 className="font-semibold text-foreground text-base mb-2">{post.title}</h4>
                    
                    {/* Row 3: Blog Excerpt with Read More */}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                      <span className="text-bpi-primary hover:underline cursor-pointer ml-1">read more</span>
                    </p>
                    
                    {/* Row 4: Blog Statistics */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Inbox className="w-3 h-3" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full text-sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View All Posts
                </Button>
              </div>
            </Card>
            </div>
          </div>

          {/* Dashboard Content Wrapper - Conditional rendering based on profile completion */}
          {isProfileComplete ? (
            <>
          {/* Center Content */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Dashboard Overview</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            {/* Main Balance Card */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-bpi-primary via-bpi-secondary to-yellow-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm">Total Assets</p>
                  <h2 className="text-3xl font-bold">
                    ₦{walletBalances?.totalAssets?.toLocaleString() || '0.00'}
                  </h2>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">•••• •••• •••• 9090</span>
                <span className="text-green-100">07/25</span>
              </div>
            </Card>


            {/* Account Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
              <Card className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bpi-primary/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-bpi-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet</p>
                    <p className="font-semibold text-foreground">₦{walletBalances?.wallet?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Spendable</p>
                    <p className="font-semibold text-foreground">₦{walletBalances?.spendable?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bpi-secondary/10 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-bpi-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cashback</p>
                    <p className="font-semibold text-foreground">₦{walletBalances?.cashback?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* View More Wallets Button */}
            <div className="mb-6">
              <Button 
                onClick={() => setShowAllWallets(!showAllWallets)}
                variant="outline" 
                className="w-full border-bpi-border dark:border-bpi-dark-accent hover:bg-bpi-primary/5 dark:hover:bg-bpi-primary/10 transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showAllWallets ? 'View Less Wallets' : 'View More Wallets'}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showAllWallets ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Additional Wallets - Collapsible */}
            {showAllWallets && (
              <div className="space-y-6 mb-6">
                {/* Additional Wallets - Legacy BPI System */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Palliative</p>
                      <p className="text-sm font-semibold text-foreground">₦{walletBalances?.palliative?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Home className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Shelter</p>
                      <p className="text-sm font-semibold text-foreground">₦{walletBalances?.shelter?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Student</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.student?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-brown-100 dark:bg-brown-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Globe className="w-4 h-4 text-brown-600 dark:text-brown-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Land</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.land?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Business</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.business?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Solar</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.solar?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                </div>

                {/* Additional Specialized Wallets Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <ShoppingCart className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Car</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.car?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Youtube className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">YouTube</p>
                      <p className="text-sm font-semibold text-foreground">₦{(walletBalances as any)?.youtube?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Users className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">Community</p>
                      <p className="text-sm font-semibold text-foreground">₦{walletBalances?.community?.toLocaleString() || '0'}</p>
                    </div>
                  </Card>
                  
                  <Card className="p-3 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">BPT Token</p>
                      <p className="text-sm font-semibold text-foreground">{(walletBalances as any)?.bpt?.toFixed(8) || '0.00000000'} BPT</p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            </div>

            {/* YouTube Channel Section */}
            {/* Announcement (Community) - moved here from second column */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Community Updates</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            {showAnnouncement && (
              <div className={`my-6 transform transition-all duration-300 ${isClosing ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className="relative bg-bpi-gradient-light dark:bg-bpi-gradient-dark text-foreground dark:text-bpi-dark-text rounded-2xl shadow-lg p-6 border border-bpi-border dark:border-bpi-dark-accent">
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 dark:bg-black/30 text-foreground hover:opacity-90"
                    onClick={() => {
                      try {
                        localStorage.setItem('bpi:announcement:closed','1');
                      } catch (e) {
                        // ignore
                      }
                      setIsClosing(true);
                      setTimeout(() => setShowAnnouncement(false), 300);
                    }}
                    aria-label="Dismiss announcement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-bold mb-2">Community Announcement <span className="text-red-500 font-extrabold">(IMPORTANT!!)</span></h2>
                  <p className="mb-2">Hello {session.user?.name?.split(' ')[0] || 'Member'}, Trust you are well!</p>
                  <p className="mb-2">We are pleased to announce that we have completed the first batch of our recent upgrade. However, between the periods of <span className="font-semibold">October 11th and October 15th</span>, some registration and activations records may have been affected during our final systems check and deployments.</p>
                  <h3 className="font-semibold mt-4 mb-2">IMPORTANT ACTION STEPS FOR ALL MEMBERS</h3>
                  <p className="mb-2">We sincerely appreciate your patience and understanding during this upgrade period.</p>
                  <p className="mb-2">We remain committed to delivering a stronger, faster and more secure community platform. Please explore the improvements and share your experience with your team.</p>

                  {/* Dismissal preference control */}
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">Show again:</label>
                    <select
                      className="text-sm rounded-md border px-2 py-1 bg-white/90 dark:bg-bpi-dark-card/90"
                      defaultValue="7"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === 'never') {
                          setDismissalPreference('never');
                          setIsClosing(true);
                          setTimeout(() => setShowAnnouncement(false), 300);
                        } else {
                          const days = parseInt(v, 10);
                          if (!isNaN(days)) {
                            setDismissalPreference(days);
                            setIsClosing(true);
                            setTimeout(() => setShowAnnouncement(false), 300);
                          }
                        }
                      }}
                    >
                      <option value="1">1 day</option>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  <p className="mt-4">Best regards,<br />The BPI Technical Team</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-6 bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">YouTube Channel</h3>
                    <p className="text-red-100 text-sm">Share with BPI Community</p>
                  </div>
                </div>
                <Button className="w-full bg-white/20 hover:bg-white/30 border-0">
                  Submit Channel
                </Button>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-bpi-primary to-bpi-secondary text-white border-0 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Play className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">Browse Channels</h3>
                    <p className="text-green-100 text-sm">Explore member content</p>
                  </div>
                </div>
                <Button className="w-full bg-white/20 hover:bg-white/30 border-0">
                  Explore
                </Button>
              </Card>
            </div>
            </div>

            {/* BPI Services Grid */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Calculator, title: "BPI Calculator", desc: "Calculate earnings", color: "from-blue-500 to-cyan-500" },
                { icon: Award, title: "Leadership Pool", desc: "Join elite program", color: "from-bpi-primary to-bpi-secondary" },
                { icon: Globe, title: "EPC & EPP", desc: "Global promotion", color: "from-emerald-500 to-green-500" },
                { icon: Zap, title: "Solar Assessment", desc: "Energy consulting", color: "from-bpi-secondary to-orange-500" },
                { icon: Target, title: "Digital Farm", desc: "Virtual agriculture", color: "from-bpi-primary to-emerald-500" },
                { icon: BookOpen, title: "Training Center", desc: "Skill development", color: "from-red-500 to-pink-500" }
              ].map((service, index) => (
                <Card key={index} className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{service.title}</h4>
                  <p className="text-xs text-muted-foreground">{service.desc}</p>
                </Card>
              ))}
            </div>
            </div>

            {/* Promotional Materials - Legacy Feature */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <div className="mb-8">
              <Card className="relative overflow-hidden bg-gradient-to-br from-bpi-primary via-bpi-primary to-bpi-secondary text-white border-0 shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Promotional Materials</h2>
                      <p className="text-white/90 text-sm">
                        We have marketing materials to help spread the BPI ideology. As a member, you can download and use these assets to make a lasting impact and advance our mission.
                      </p>
                    </div>
                  </div>
                  <Button className="bg-white/20 hover:bg-white/30 border-0 text-white">
                    <FileImage className="w-4 h-4 mr-2" />
                    Download Materials
                  </Button>
                </div>
              </Card>
            </div>
            </div>

            {/* BPI Leadership Pool Challenge */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-xl">
                <div className="text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="font-bold text-lg mb-2">LEADERSHIP POOL CHALLENGE!!</h3>
                  <p className="text-sm text-blue-100 mb-4">
                    Enjoy an average Yearly Revenue Distribution of N50 million (Naira) Yearly!! Capped at the first 100 members to Qualify
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-bpi-primary to-emerald-600 text-white border-0 shadow-xl">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="font-bold text-lg mb-2">Qualification Option 1</h3>
                  <ul className="text-sm text-green-100 space-y-1">
                    <li>• Activate or Upgrade To Regular Plus</li>
                    <li>• Invite / Sponsor 70 Regular Plus Members</li>
                  </ul>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-bpi-secondary to-orange-600 text-white border-0 shadow-xl">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-80" />
                  <h3 className="font-bold text-lg mb-2">Qualification Option 2</h3>
                  <ul className="text-sm text-orange-100 space-y-1">
                    <li>• Activate or Upgrade To Regular Plus</li>
                    <li>• Invite / Sponsor up to 100 Regular Plus Members on First generation(50) and Second Generation(50)</li>
                  </ul>
                </div>
              </Card>
            </div>
            </div>

            {/* BPI Fractional Ownership Program */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <div className="mb-8">
              <Card className="p-8 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl">
                <h2 className="text-2xl font-bold text-foreground mb-2">Latest Update!</h2>
                <h3 className="text-xl font-semibold text-bpi-primary mb-4">BPI Fractional Ownership Program: Special Offer!!</h3>
                
                <div className="space-y-6">
                  <p className="text-muted-foreground">
                    The BPI Fractional Ownership Program is designed to enable joint contributions towards packages, subscriptions, or special offers, allowing participants to share both the cost and the benefits. This unique model supports groups of individuals who contribute a percentage of the total price, thereby collectively owning and enjoying the associated benefits of the program.
                  </p>

                  {/* Auto-scrolling Text Slides */}
                  <div className="relative overflow-hidden h-80 rounded-xl">
                    {/* Slide 1: BPI Training Center */}
                    <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${currentSlide === 0 ? 'translate-x-0' : '-translate-x-full'}`}>
                      <div className="bg-gradient-to-r from-bpi-primary/10 to-bpi-secondary/10 p-8 mx-4 mt-4 mb-8 rounded-xl h-full flex flex-col justify-start shadow-lg">
                        <h4 className="font-bold text-lg text-foreground mb-3">BPI Training Center Investment – ₦3,000,000:</h4>
                        <p className="text-muted-foreground text-sm mb-4">
                          The BeepAgro Palliative Initiative (BPI) Training Center is a cutting-edge facility that provides individuals with advanced digital, agricultural, and leadership skills. As a hub for innovation and empowerment, the center aims to foster entrepreneurship and self-sustainability, creating new opportunities for a brighter future.
                        </p>
                        <p className="text-muted-foreground text-sm">
                          We are thrilled to announce that 100 investment slots are now available for BPI members. Investors will be automatically enrolled in the prestigious BPI Leadership Pool, giving them a prominent role in shaping our transformative initiatives.
                        </p>
                      </div>
                    </div>

                    {/* Slide 2: BPI Zero Hunger */}
                    <div className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${currentSlide === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
                      <div className="bg-gradient-to-r from-bpi-secondary/10 to-orange-500/10 p-8 mx-4 mt-4 mb-8 rounded-xl h-full flex flex-col justify-start shadow-lg">
                        <h4 className="font-bold text-lg text-foreground mb-3">BPI Zero Hunger Meal Pack Sponsor Partner - ₦4,500,000:</h4>
                        <p className="text-muted-foreground text-sm">
                          As a BPI Zero Hunger Meal Pack Sponsor Partner, you can contribute ₦4.5 million per slot, gaining leadership privileges and lifetime royalty benefits from the BPI Zero Hunger Program. Sponsors investing in two or more slots (₦9 million for two slots) are eligible for higher benefits, including a stake in the BPI Leadership Pool and continued royalty income.
                        </p>
                      </div>
                    </div>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {[0, 1].map((slide) => (
                        <button
                          key={slide}
                          onClick={() => setCurrentSlide(slide)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            currentSlide === slide ? 'bg-bpi-primary' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button className="bg-bpi-primary hover:bg-bpi-primary/90">
                    <Target className="w-4 h-4 mr-2" />
                    Explore Packages
                  </Button>
                </div>
              </Card>
            </div>
            </div>

            {/* Best Deals Section */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Best Deals!!</h2>
              <div className="space-y-4">
                {[
                  { title: "BPI BSC & Masters", desc: "Enroll with BPI Strategic Partner Universities Abroad for BSC and Masters Degree", icon: BookOpen },
                  { title: "ICT Skills for Teens", desc: "A unique opportunity to embark on a digital skill journey from the ground up", icon: Cpu },
                  { title: "BPI Training Center Investment", desc: "100 slots available! Secure a slot to be automatically added to the prestigious BPI Leadership Pool", icon: Target },
                  { title: "Young Professionals Bootcamp 2024", desc: "Upcoming International Leadership and Entrepreneurship Event, scheduled to take place in Atlanta Metropolitan State College, USA.", icon: Globe }
                ].map((deal, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    {/* Column 1: Deal Icon */}
                    <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <deal.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Column 2: Deal Details */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Deal Title */}
                      <h3 className="font-semibold text-foreground text-base mb-1">{deal.title}</h3>
                      
                      {/* Row 2: Deal Description */}
                      <p className="text-sm text-muted-foreground leading-relaxed">{deal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Activity Center</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            {/* Recent Transactions - Enhanced */}
            <Card className="p-6 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-4 relative z-10">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-bpi-primary" />
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {/* Enhanced Mock Transactions */}
                {[
                  { type: "Referral Commission", info: "Membership Activation", amount: "5000", status: "successful", date: "4 hours ago", icon: Users, isBPT: false },
                  { type: "BPT Transfer", info: "Token Exchange", amount: "0.00125000", status: "pending", date: "1 day ago", icon: Award, isBPT: true },
                  { type: "Palliative Withdrawal", info: "Emergency Fund Access", amount: "8000", status: "failed", date: "1 month ago", icon: Shield, isBPT: false }
                ].map((transaction, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl border border-gray-200 dark:border-bpi-dark-accent hover:shadow-md transition-shadow">
                    {/* Column 1: Transaction Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transaction.status === 'successful' ? 'bg-green-100 dark:bg-green-900/30' :
                      transaction.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <transaction.icon className={`w-5 h-5 ${
                        transaction.status === 'successful' ? 'text-green-600 dark:text-green-400' :
                        transaction.status === 'pending' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                    </div> 
                    
                    {/* Column 2: Transaction Details */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Transaction Type */}
                      <p className="text-sm font-medium text-foreground truncate">{transaction.type}</p>
                      
                      {/* Row 2: Transaction Info */}
                      <p className="text-xs text-muted-foreground truncate mt-1">{transaction.info}</p>
                      
                      {/* Row 3: Amount and Status */}
                      <div className="flex items-center gap-2 mt-2">
                        <p className={`text-sm font-bold ${
                          transaction.status === 'successful' ? 'text-green-600 dark:text-green-400' :
                          transaction.status === 'pending' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.isBPT ? 
                            `${parseFloat(transaction.amount).toFixed(8)} BPT` :
                            `₦${parseFloat(transaction.amount).toLocaleString()}`
                          }
                        </p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'successful' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : transaction.status === 'pending'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {transaction.status === 'successful' ? 'Success' : 
                           transaction.status === 'pending' ? 'Pending' : 'Failed'}
                        </span>
                      </div>
                      
                      {/* Row 4: Transaction Date */}
                      <p className="text-xs text-muted-foreground mt-1">{transaction.date}</p>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full text-sm mt-4">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Transactions
                </Button>
              </div>
            </Card>
            </div>

            {/* Student Palliative Card */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Student Palliative</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg mb-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Student Palliative</h3>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  {/* Mock countdown - 7 days remaining */}
                  7 Days
                </div>
                <div className="text-xs text-muted-foreground mb-3">Remaining</div>
                {/* Alert styling for < 10 days */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Bell className="w-4 h-4" />
                    <span className="text-xs font-medium">Alert: Less than 10 days</span>
                  </div>
                </div>
              </div>
            </Card>
            </div>

            {/* BPI Ticket Card */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">BPI Ticket</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">BPI Ticket</h3>
                <div className="text-2xl font-bold text-bpi-primary mb-2">
                  {/* Mock countdown - 15 days remaining */}
                  15 Days
                </div>
                <div className="text-xs text-muted-foreground mb-3">Until Expiry</div>
                {/* Normal display for > 10 days */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">Active & Valid</span>
                  </div>
                </div>
              </div>
            </Card> 
            </div>

            {/* Community Stats */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Community Statistics</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-6 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-6">
              <h3 className="font-semibold text-foreground mb-4">Community Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Total Members</p>
                    <p className="text-xs text-muted-foreground">Verified users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {communityStats?.totalMembers?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Members</p>
                    <p className="text-xs text-muted-foreground">With palliative</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-bpi-primary">
                      {communityStats?.palliativeMembers?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Leadership Pool</p>
                    <p className="text-xs text-muted-foreground">Total value</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      ₦{leadershipPool?.totalPoolValue?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {leadershipPool?.lastUpdated ? 
                        new Date(leadershipPool.lastUpdated).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>s
            </Card>
            </div>

            {/* Membership Growth Promotion Rewards - Moved from 3rd column */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <Card className="p-6 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-6">
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-4">Membership Growth Rewards</h3>
              <div className="space-y-4">
                {[
                  { target: "100 members", reward: "₦100,000 & More", icon: DollarSign, color: "from-green-500 to-emerald-500" },
                  { target: "500 members", reward: "₦400,000 & More", icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
                { target: "1000 members", reward: "₦800,000 & More", icon: Award, color: "from-purple-500 to-pink-500" },
                { target: "10 members daily", reward: "Earn ₦500 per member", icon: Calendar, color: "from-bpi-primary to-bpi-secondary" }
              ].map((reward, index) => (
                <Card key={index} className="p-4 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${reward.color} rounded-lg flex items-center justify-center`}>
                      <reward.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">First to activate {reward.target}</h4>
                      <p className="text-bpi-primary font-bold text-sm">{reward.reward}</p>
                    </div>
                  </div>
                </Card>
              ))}
              </div>
            </div>
            </Card>
            </div>

            {/* BPI Calculator */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
            <Card className="p-6 backdrop-blur-md backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-6">
              <h3 className="font-semibold text-foreground mb-4">BPI Calculator</h3>
              <div className="space-y-4">
                {/* Currency Selector */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Currency</label>
                  <select className="w-full p-2 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm">
                    <option value="NGN">Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>

                {/* Shelter Type */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Shelter Type</label>
                  <select className="w-full p-2 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm">
                    <option value="1">Shelter Option 1 - ₦40,000,000</option>
                    <option value="2">Shelter Option 2 - ₦20,000,000</option>
                    <option value="3">Shelter Option 3 - ₦10,000,000</option>
                    <option value="4">Shelter Option 4 - ₦5,000,000</option>
                  </select>
                </div>

                {/* Membership Level */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Membership Level</label>
                  <select className="w-full p-2 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm">
                    <option value="regular">Regular Membership</option>
                    <option value="plus">Regular Plus</option>
                    <option value="premium">Premium</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>

                {/* Number of Invites */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Number of Invites</label>
                  <input 
                    type="number" 
                    placeholder="Enter number of invites"
                    className="w-full p-2 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm"
                    min="0"
                    defaultValue="0"
                  />
                </div>

                {/* Calculate Button */}
                <Button className="w-full bg-bpi-primary hover:bg-bpi-primary/90">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Earnings
                </Button>

                {/* Results Display */}
                <div className="bg-gradient-to-r from-bpi-primary/10 to-bpi-secondary/10 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Wallet Amount</p>
                    <p className="text-lg font-bold text-bpi-primary">₦0.00</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on your selections
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            </div>
          </div>
            </>
          ) : null}

        </div>
      </main>
    </div>
  );
}