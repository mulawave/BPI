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
  Edit, Check, Eye, Heart, AlertCircle, MapPin,
  Phone, Mail, Flag, TrendingDown, ArrowUp, ArrowDown,
  Lock, Coins, BadgeDollarSign, EyeOff, RefreshCw,
  Clock, Package, CircleDollarSign, AlertTriangle
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
  icon?: React.ComponentType<{ className?: string }>;
  onUpdateStatus?: (status: 'loading' | 'success' | 'error', message: string) => void;
}

function ProfileField({ label, value, fieldKey, isEditable, icon: Icon, onUpdateStatus }: ProfileFieldProps) {
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
        <label className="text-xs font-medium text-muted-foreground mb-0 flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3 text-bpi-primary" />}
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
  
  // Dashboard state
  const [showBalances, setShowBalances] = useState(true); // Toggle to show/hide balances
  const [activeWalletTab, setActiveWalletTab] = useState<'operational' | 'rewards' | 'investment' | 'community'>('operational');
  
  // Email verification dialog state
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'success' | 'error'>('idle');
  const [lastEmailReminderTime, setLastEmailReminderTime] = useState<number>(Date.now());
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto Inviter state
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
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
  const { data: userProfile, isLoading: isLoadingProfile } = api.legacy.getUserProfile.useQuery();
  const { data: walletBalances, isLoading: isLoadingWallets } = api.legacy.getWalletBalances.useQuery();
  const { data: referralStats } = api.legacy.getReferralStats.useQuery();
  const { data: communityStats } = api.legacy.getCommunityStats.useQuery();
  const { data: activeShelters } = api.legacy.getActiveShelters.useQuery();
  const { data: transactionHistory } = api.legacy.getTransactionHistory.useQuery({ limit: 5 });
  const { data: leadershipPool } = api.legacy.getLeadershipPool.useQuery();
  
  // New membership package query for gating
  const { data: userDetails, isLoading: isLoadingDetails } = api.user.getDetails.useQuery();
  const needsActivation = !isLoadingDetails && !userDetails?.activeMembership;
  
  // Daily invite count query
  const { data: inviteCount } = api.referral.getDailyInviteCount.useQuery();
  
  // Get user's referral link
  const { data: referralLinkData } = api.referral.getMyReferralLink.useQuery();
  
  // Get recent referrals (last 5)
  const { data: recentReferralsData } = api.referral.getRecentReferrals.useQuery();
  
  // Get latest blog posts (2 for dashboard)
  const { data: latestBlogPosts } = api.blog.getLatestPosts.useQuery({ limit: 2 });
  
  // Get comprehensive dashboard overview
  const { data: dashboardData, isLoading: isDashboardLoading } = api.dashboard.getOverview.useQuery(
    undefined,
    { 
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000 // Consider data fresh for 10 seconds
    }
  );
  
  // Get wallet health status
  const { data: walletHealth } = api.dashboard.getWalletHealth.useQuery();
  
  // Combined loading state - wait for critical data before rendering dashboard
  const isInitialLoading = isLoadingProfile || isLoadingWallets || isLoadingDetails || isDashboardLoading;

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

  // Automated email verification reminder - Show modal every 30 seconds if email not verified
  useEffect(() => {
    if (!userProfile?.emailVerified && !showEmailVerificationDialog) {
      const interval = setInterval(() => {
        // Only show reminder if it's been more than 30 seconds since last reminder
        const now = Date.now();
        if (now - lastEmailReminderTime >= 30000) {
          setShowEmailVerificationDialog(true);
          setLastEmailReminderTime(now);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [userProfile?.emailVerified, showEmailVerificationDialog, lastEmailReminderTime]);

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

  // Email verification mutations
  const sendVerificationEmail = api.user.sendVerificationEmail.useMutation({
    onMutate: () => {
      setVerificationStatus('sending');
    },
    onSuccess: () => {
      setVerificationStatus('sent');
      setEmailSent(true);
    },
    onError: (error: any) => {
      setVerificationStatus('error');
      console.error('Failed to send verification email:', error);
    }
  });

  const verifyEmailCode = api.user.verifyEmailCode.useMutation({
    onMutate: () => {
      setVerificationStatus('verifying');
    },
    onSuccess: async () => {
      setVerificationStatus('success');
      // Refetch user profile to update email verification status
      await utils.legacy.getUserProfile.invalidate();
      setTimeout(() => {
        setShowEmailVerificationDialog(false);
        setVerificationCode('');
        setEmailSent(false);
        setVerificationStatus('idle');
      }, 2000);
    },
    onError: (error: any) => {
      setVerificationStatus('error');
      console.error('Failed to verify code:', error);
    }
  });

  const handleSendVerificationEmail = () => {
    sendVerificationEmail.mutate();
  };

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      verifyEmailCode.mutate({ code: verificationCode });
    }
  };

  // Auto-submit when code is 6 digits
  useEffect(() => {
    if (verificationCode.length === 6 && verificationStatus === 'sent') {
      handleVerifyCode();
    }
  }, [verificationCode]);

  // Referral invite mutation
  const sendReferralInvite = api.referral.sendReferralInvite.useMutation({
    onMutate: () => {
      setInviteStatus('sending');
      setInviteMessage('');
    },
    onSuccess: async (data) => {
      setInviteStatus('success');
      setInviteMessage(data.message);
      // Reset form
      setInviteFirstName('');
      setInviteLastName('');
      setInviteEmail('');
      // Refetch wallet balance and invite count
      await utils.legacy.getWalletBalances.invalidate();
      await utils.referral.getDailyInviteCount.invalidate();
      // Auto-dismiss success after 5 seconds
      setTimeout(() => {
        setInviteStatus('idle');
        setInviteMessage('');
      }, 5000);
    },
    onError: (error: any) => {
      setInviteStatus('error');
      setInviteMessage(error.message || 'Failed to send invite. Please try again.');
      // Auto-dismiss error after 7 seconds
      setTimeout(() => {
        setInviteStatus('idle');
        setInviteMessage('');
      }, 7000);
    }
  });

  // Helper function to format balance with visibility toggle
  const formatBalance = (amount: number, currency: string = '₦') => {
    if (!showBalances) {
      return `${currency}•••••••`;
    }
    return `${currency}${amount.toLocaleString()}`;
  };

  const handleSendInvite = () => {
    if (!inviteFirstName || !inviteLastName || !inviteEmail) {
      setInviteStatus('error');
      setInviteMessage('Please fill in all fields');
      setTimeout(() => {
        setInviteStatus('idle');
        setInviteMessage('');
      }, 3000);
      return;
    }
    
    sendReferralInvite.mutate({
      firstname: inviteFirstName,
      lastname: inviteLastName,
      email: inviteEmail
    });
  };
  
  const handleCopyLink = async () => {
    if (referralLinkData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralLinkData.referralLink);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Show loading screen while initial data is fetching
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
        <div className="text-center">
          {/* Animated Logo/Spinner */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white dark:bg-bpi-dark-card rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">BPI</span>
            </div>
          </div>
          
          {/* Loading Text */}
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Your Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-6">Fetching your personalized data...</p>
          
          {/* Shimmer Progress Bar */}
          <div className="w-64 h-2 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-bpi-primary via-bpi-secondary to-bpi-primary bg-[length:200%_100%] animate-[shimmer_2s_infinite]" 
                 style={{ animationTimingFunction: 'linear' }}></div>
          </div>
        </div>
        
        {/* Add shimmer animation to globals.css if not already present */}
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Email Verification Dialog */}
      <Modal 
        isOpen={showEmailVerificationDialog} 
        title="Verify Your Email"
        onClose={() => {
          setShowEmailVerificationDialog(false);
          setVerificationCode('');
          setEmailSent(false);
          setVerificationStatus('idle');
        }}
      >
        <div className="space-y-4">
          {!emailSent ? (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to receive a verification code at your registered email address: <span className="font-semibold text-foreground">{session.user?.email}</span>
              </p>
              <Button 
                onClick={handleSendVerificationEmail}
                disabled={verificationStatus === 'sending'}
                className="w-full bg-bpi-primary hover:bg-bpi-primary/90"
              >
                {verificationStatus === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Verification Email'
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                We've sent a 6-digit verification code to <span className="font-semibold text-foreground">{session.user?.email}</span>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full p-3 text-center text-2xl font-mono tracking-widest border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground focus:border-bpi-primary focus:outline-none"
                  disabled={verificationStatus === 'verifying' || verificationStatus === 'success'}
                  autoFocus
                />
              </div>

              {verificationStatus === 'verifying' && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-bpi-primary border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              )}

              {verificationStatus === 'success' && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  Email verified successfully!
                </div>
              )}

              {verificationStatus === 'error' && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Invalid code. Please try again.
                </div>
              )}

              <button
                onClick={handleSendVerificationEmail}
                disabled={verificationStatus === 'sending' || verificationStatus === 'verifying'}
                className="text-sm text-bpi-primary hover:underline disabled:opacity-50"
              >
                Resend verification email
              </button>
            </>
          )}
          
          {/* Cancel Button */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                setShowEmailVerificationDialog(false);
                setVerificationCode('');
                setEmailSent(false);
                setVerificationStatus('idle');
                setLastEmailReminderTime(Date.now()); // Reset reminder timer when cancelled
              }}
              variant="outline"
              className="flex-1"
              disabled={verificationStatus === 'sending' || verificationStatus === 'verifying'}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

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
                    icon={User}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Last Name */}
                  <ProfileField
                    label="Last Name"
                    value={userProfile?.lastname || ''}
                    fieldKey="lastname"
                    icon={User}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Email (Read-only) */}
                  <ProfileField
                    label="Email"
                    value={userProfile?.email || ''}
                    fieldKey="email"
                    icon={Mail}
                    isEditable={false}
                  />
                  
                  {/* Phone */}
                  <ProfileField
                    label="Phone"
                    value={userProfile?.mobile || ''}
                    fieldKey="mobile"
                    icon={Phone}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Address */}
                  <ProfileField
                    label="Address"
                    value={userProfile?.address || ''}
                    fieldKey="address"
                    icon={MapPin}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* City */}
                  <ProfileField
                    label="City"
                    value={userProfile?.city || ''}
                    fieldKey="city"
                    icon={Home}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* State */}
                  <ProfileField
                    label="State"
                    value={userProfile?.state || ''}
                    fieldKey="state"
                    icon={MapPin}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Country */}
                  <ProfileField
                    label="Country"
                    value={userProfile?.country || ''}
                    fieldKey="country"
                    icon={Globe}
                    isEditable={true}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Gender */}
                  <ProfileField
                    label="Gender"
                    value={userProfile?.gender || ''}
                    fieldKey="gender"
                    icon={User}
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


            {/* Account Statistics */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Account Statistics</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4">Account Activity</h3>
              <div className="space-y-3">
                {/* Total Referrals */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Total Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.total || 0}
                  </span>
                </div>

                {/* Level 1 (Direct) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-bpi-primary" />
                    <span className="text-sm text-muted-foreground">Direct Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.level1 || 0}
                  </span>
                </div>

                {/* Level 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Level 2 Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.level2 || 0}
                  </span>
                </div>

                {/* Total Team Size */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Total Team Size</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.referralCounts?.total || 0}
                  </span>
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-muted-foreground">Member Since</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {userProfile?.createdAt 
                      ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
            </div>

            {/* Membership Status */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Membership Status</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-4 mt-4 bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-lg">
              <h3 className="font-semibold text-foreground mb-4">Membership Status</h3>
              <div className="space-y-3">
                {/* BPI Activation Status - Green if has active membership */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  userDetails?.activeMembership 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${
                      userDetails?.activeMembership 
                        ? 'text-green-500 animate-pulse' 
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      userDetails?.activeMembership
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>BPI Activation</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userDetails?.activeMembership
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {userDetails?.activeMembership ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Profile Status - Green when 100% complete */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  profileCompletionStatus?.isComplete
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${
                      profileCompletionStatus?.isComplete
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      profileCompletionStatus?.isComplete
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Profile Status</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    profileCompletionStatus?.isComplete
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {profileCompletionStatus?.isComplete ? 'Complete' : `${profileCompletionStatus?.completionPercentage}%`}
                  </span>
                </div>

                {/* Shelter Activation - Green if active */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  (walletBalances?.shelter || 0) > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Home className={`w-4 h-4 ${
                      (walletBalances?.shelter || 0) > 0
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      (walletBalances?.shelter || 0) > 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Shelter Activation</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (walletBalances?.shelter || 0) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {(walletBalances?.shelter || 0) > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Community Support - Green if eligible (has active membership + complete profile) */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  (userDetails?.activeMembership && profileCompletionStatus?.isComplete)
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${
                      (userDetails?.activeMembership && profileCompletionStatus?.isComplete)
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      (userDetails?.activeMembership && profileCompletionStatus?.isComplete)
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Community Support</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (userDetails?.activeMembership && profileCompletionStatus?.isComplete)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {(userDetails?.activeMembership && profileCompletionStatus?.isComplete) ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>

                {/* Email Verification */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  userProfile?.emailVerified
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${
                      userProfile?.emailVerified
                        ? 'text-green-500'
                        : 'text-red-500 animate-pulse'
                    }`} />
                    <span className={`text-sm font-medium ${
                      userProfile?.emailVerified
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Email Verification</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!userProfile?.emailVerified) {
                        setShowEmailVerificationDialog(true);
                      }
                    }}
                    disabled={!!userProfile?.emailVerified}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      !!userProfile?.emailVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cursor-default'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer transition-colors'
                    }`}
                  >
                    {!!userProfile?.emailVerified ? 'Verified' : 'Pending'}
                  </button>
                </div>

                {/* Referral Program */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  (referralStats?.referralCounts?.level1 || 0) > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Award className={`w-4 h-4 ${
                      (referralStats?.referralCounts?.level1 || 0) > 0
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      (referralStats?.referralCounts?.level1 || 0) > 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Referral Program</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (referralStats?.referralCounts?.level1 || 0) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {(referralStats?.referralCounts?.level1 || 0) > 0 ? 'Active' : 'Inactive'}
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
              
              {/* Cost & Limit Notice */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                  💰 Cost: <span className="font-bold">0.5 BPT</span> per invite | 
                  📧 Daily Limit: <span className="font-bold">10 invites</span>
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Enter your friend's details and we'll send them an invite from you
              </p>
              
              {/* Status Alert */}
              {inviteMessage && (
                <div className={`mb-4 p-3 rounded-lg border text-sm ${
                  inviteStatus === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}>
                  {inviteMessage}
                </div>
              )}
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Friend's First Name"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  disabled={inviteStatus === 'sending'}
                  className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="Friend's Last Name"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  disabled={inviteStatus === 'sending'}
                  className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm disabled:opacity-50"
                />
                <input
                  type="email"
                  placeholder="Friend's Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteStatus === 'sending'}
                  className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground text-sm disabled:opacity-50"
                />
                <div className="flex gap-2 items-center">
                  <Button 
                    onClick={handleSendInvite}
                    disabled={
                      inviteStatus === 'sending' || 
                      !inviteCount?.canSend || 
                      (walletBalances?.bpiTokenWallet || 0) < 0.5
                    }
                    className="flex-1 bg-bpi-primary hover:bg-bpi-primary/90 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteStatus === 'sending' ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                  
                  {/* Daily Counter */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-bpi-dark-accent rounded-lg border border-bpi-border dark:border-bpi-dark-accent">
                    <Mail className="w-4 h-4 text-bpi-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {inviteCount?.remaining || 0}/{inviteCount?.total || 10}
                    </span>
                  </div>
                </div>
                
                {/* Insufficient BPT Warning */}
                {(walletBalances?.bpiTokenWallet || 0) < 0.5 && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Insufficient BPT balance. You need at least 0.5 BPT to send invites.
                  </p>
                )}
                
                {/* Daily Limit Warning */}
                {inviteCount && !inviteCount.canSend && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    ⚠️ Daily invite limit reached. You can send {inviteCount.total} more invites tomorrow.
                  </p>
                )}
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
                Share your unique referral link to earn rewards
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg border border-bpi-border dark:border-bpi-dark-accent">
                  <p className="text-xs text-foreground break-all font-mono">
                    {referralLinkData?.referralLink || 'Loading...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCopyLink}
                    className="flex-1 bg-bpi-secondary hover:bg-bpi-secondary/90 text-sm"
                  >
                    {copyStatus === 'copied' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="px-3"
                    onClick={() => window.open(referralLinkData?.referralLink, '_blank')}
                    disabled={!referralLinkData?.referralLink}
                  >
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
                {/* Real referral data or empty state */}
                {recentReferralsData?.referrals && recentReferralsData.referrals.length > 0 ? (
                  <>
                    {recentReferralsData.referrals.map((referral) => {
                      const referredName = referral.referredUserName || 'Unknown User';
                      const joinedDate = new Date(referral.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      const status = referral.status === 'active' ? 'Active' : 'Pending';
                      
                      return (
                        <div key={referral.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{referredName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{referredName}</p>
                            <p className="text-xs text-muted-foreground">Joined: {joinedDate}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            status === 'Active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                    
                    <Button variant="outline" className="w-full text-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Referrals
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You do not currently have any referrals. Use the auto-invite form to send out invites to your contacts or copy your ref link and share with your friends.
                    </p>
                  </div>
                )}
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
                {/* Real blog posts or empty state */}
                {latestBlogPosts?.posts && latestBlogPosts.posts.length > 0 ? (
                  <>
                    {latestBlogPosts.posts.map((post) => {
                      const excerpt = post.content.substring(0, 150) + '...';
                      const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      });
                      
                      return (
                        <div key={post.id} className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
                          {/* Row 1: Blog Image */}
                          <div className="w-full h-32 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                            {post.image ? (
                              <img 
                                src={post.image} 
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileImage className="w-12 h-12 text-white" />
                            )}
                          </div>
                          
                          {/* Row 2: Blog Title */}
                          <h4 className="font-semibold text-foreground text-base mb-2">{post.title}</h4>
                          
                          {/* Row 3: Blog Excerpt with Read More */}
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {excerpt}
                            <span className="text-bpi-primary hover:underline cursor-pointer ml-1">read more</span>
                          </p>
                          
                          {/* Row 4: Blog Statistics */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{post.viewers}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formattedDate}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{post.author.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <Button variant="outline" className="w-full text-sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View All Posts
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      The blog is currently not available. Check back soon for exciting updates and articles from the BPI community!
                    </p>
                  </div>
                )}
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
            
            {/* Hero - Portfolio Value Card */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-bpi-primary via-bpi-secondary to-yellow-500 text-white border-0 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white/90 text-sm font-medium">Total Portfolio Value</p>
                    <button
                      onClick={() => setShowBalances(!showBalances)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                      title={showBalances ? "Hide balances" : "Show balances"}
                    >
                      {showBalances ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {formatBalance(dashboardData?.portfolio.totalValue || 0)}
                  </h2>
                  <div className="flex items-center gap-2">
                    {dashboardData?.portfolio.changePercentage24h !== undefined && dashboardData.portfolio.changePercentage24h >= 0 ? (
                      <div className="flex items-center gap-1 text-green-100">
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          +{formatBalance(dashboardData.portfolio.change24h)} ({dashboardData.portfolio.changePercentage24h.toFixed(2)}%)
                        </span>
                      </div>
                    ) : dashboardData?.portfolio.changePercentage24h !== undefined ? (
                      <div className="flex items-center gap-1 text-red-100">
                        <ArrowDown className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatBalance(dashboardData.portfolio.change24h)} ({dashboardData.portfolio.changePercentage24h.toFixed(2)}%)
                        </span>
                      </div>
                    ) : null}
                    <span className="text-white/70 text-xs">24h</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CircleDollarSign className="w-7 h-7" />
                </div>
              </div>
              
              {/* Quick Portfolio Breakdown */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-white/70 text-xs mb-1">BPI Token</p>
                  <p className="font-semibold text-sm">{showBalances ? `${dashboardData?.wallets.primary.bpiToken.balance.toFixed(2) || '0'} BPT` : '••••'}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs mb-1">Main</p>
                  <p className="font-semibold text-sm">{showBalances ? `₦${(dashboardData?.wallets.primary.main.balance || 0).toLocaleString()}` : '₦••••'}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs mb-1">Locked</p>
                  <p className="font-semibold text-sm">{showBalances ? `₦${(dashboardData?.wallets.primary.locked.balance || 0).toLocaleString()}` : '₦••••'}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-xs mb-1">Rewards</p>
                  <p className="font-semibold text-sm">{showBalances ? `₦${(dashboardData?.wallets.primary.rewards.balance || 0).toLocaleString()}` : '₦••••'}</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
                <button className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-xs font-medium">Deposit</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Withdraw</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium">Transfer</span>
                </button>
              </div>
            </Card>

            {/* Primary Wallets Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* BPI Token Wallet */}
              <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  {walletHealth?.health.bpiToken === 'critical' && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Critical</span>
                  )}
                  {walletHealth?.health.bpiToken === 'low' && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Low</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1">BPI Token</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500 mb-1">
                  {showBalances ? `${dashboardData?.wallets.primary.bpiToken.balance.toFixed(2) || '0'} BPT` : '••••••'}
                </p>
                <p className="text-xs text-muted-foreground">
                  ≈ {formatBalance(dashboardData?.wallets.primary.bpiToken.balanceInNaira || 0)}
                </p>
              </Card>

              {/* Main Wallet */}
              <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-bpi-primary">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-bpi-primary/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-bpi-primary" />
                  </div>
                  {walletHealth?.health.mainWallet === 'critical' && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Critical</span>
                  )}
                  {walletHealth?.health.mainWallet === 'low' && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Low</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1">Main Wallet</h3>
                <p className="text-2xl font-bold text-bpi-primary mb-1">
                  {formatBalance(dashboardData?.wallets.primary.main.balance || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Available for operations
                </p>
              </Card>

              {/* Locked Capital */}
              <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">Locked Capital</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-500 mb-1">
                  {formatBalance(dashboardData?.wallets.primary.locked.balance || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.wallets.primary.locked.packagesCount || 0} active packages
                </p>
              </Card>

              {/* Total Rewards */}
              <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <BadgeDollarSign className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">Total Rewards</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500 mb-1">
                  {formatBalance(dashboardData?.wallets.primary.rewards.balance || 0)}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>Cashback:</span>
                    <span>{showBalances ? `₦${(dashboardData?.wallets.primary.rewards.breakdown.cashback || 0).toLocaleString()}` : '••••'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span>{showBalances ? `₦${(dashboardData?.wallets.primary.rewards.breakdown.studentCashback || 0).toLocaleString()}` : '••••'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Education:</span>
                    <span>{showBalances ? `₦${(dashboardData?.wallets.primary.rewards.breakdown.education || 0).toLocaleString()}` : '••••'}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Active Packages Summary */}
            <Card className="p-5 mb-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-foreground">Active Packages</h3>
                </div>
                <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {dashboardData?.packages.stats.totalActive || 0} active
                </span>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatBalance(dashboardData?.packages.stats.totalInvested || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-500">
                    {formatBalance(dashboardData?.packages.stats.totalCurrentValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total ROI Accrued</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-500">
                    {formatBalance(dashboardData?.packages.stats.totalAccruedROI || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Maturing Soon</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-500">
                    {dashboardData?.packages.stats.upcomingMaturities || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">within 7 days</p>
                </div>
              </div>

              {/* Package List Preview */}
              {dashboardData?.packages.active && dashboardData.packages.active.length > 0 && (
                <div className="space-y-2">
                  {dashboardData.packages.active.slice(0, 3).map((pkg) => {
                    const daysLeft = pkg.maturityDate 
                      ? Math.ceil((new Date(pkg.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 0;
                    
                    return (
                      <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-bpi-dark-accent/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm text-foreground">{pkg.packageName}</h4>
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              {pkg.roiPercentage}% ROI
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {showBalances ? `₦${pkg.amount.toLocaleString()}` : '₦••••••'} • {daysLeft} days remaining
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-500">
                            {showBalances ? `₦${pkg.currentValue.toLocaleString()}` : '₦••••••'}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            +{showBalances ? `₦${pkg.accruedROI.toLocaleString()}` : '₦•••••'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {dashboardData.packages.active.length > 3 && (
                    <button className="w-full text-sm text-bpi-primary hover:underline py-2">
                      View all {dashboardData.packages.active.length} packages →
                    </button>
                  )}
                </div>
              )}
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

            {/* Categorized Wallets Tabs */}
            <Card className="p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">All Wallets</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveWalletTab('operational')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeWalletTab === 'operational'
                        ? 'bg-bpi-primary text-white'
                        : 'bg-gray-100 dark:bg-bpi-dark-accent text-muted-foreground hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/70'
                    }`}
                  >
                    Operational
                  </button>
                  <button
                    onClick={() => setActiveWalletTab('investment')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeWalletTab === 'investment'
                        ? 'bg-bpi-primary text-white'
                        : 'bg-gray-100 dark:bg-bpi-dark-accent text-muted-foreground hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/70'
                    }`}
                  >
                    Investment
                  </button>
                  <button
                    onClick={() => setActiveWalletTab('community')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeWalletTab === 'community'
                        ? 'bg-bpi-primary text-white'
                        : 'bg-gray-100 dark:bg-bpi-dark-accent text-muted-foreground hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/70'
                    }`}
                  >
                    Community
                  </button>
                </div>
              </div>

              {/* Operational Wallets */}
              {activeWalletTab === 'operational' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {dashboardData?.wallets.operational.map((wallet) => {
                    const isLow = walletHealth?.health.spendable === 'low' && wallet.id === 'spendable';
                    const isCritical = walletHealth?.health.spendable === 'critical' && wallet.id === 'spendable';
                    
                    return (
                      <div
                        key={wallet.id}
                        className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/50 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                          </div>
                          {isCritical && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Critical</span>
                          )}
                          {isLow && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Low</span>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-foreground mb-1">{wallet.name}</h4>
                        <p className="text-lg font-bold text-foreground mb-1">
                          {formatBalance(wallet.balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">{wallet.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Investment Wallets */}
              {activeWalletTab === 'investment' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboardData?.wallets.investment.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/50 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-500" />
                      </div>
                      <h4 className="font-medium text-sm text-foreground mb-1">{wallet.name}</h4>
                      <p className="text-lg font-bold text-foreground mb-1">
                        {formatBalance(wallet.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">{wallet.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Community Wallets */}
              {activeWalletTab === 'community' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {dashboardData?.wallets.community.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/50 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mb-2">
                        <Users className="w-4 h-4 text-green-600 dark:text-green-500" />
                      </div>
                      <h4 className="font-medium text-sm text-foreground mb-1">{wallet.name}</h4>
                      <p className="text-lg font-bold text-foreground mb-1">
                        {formatBalance(wallet.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">{wallet.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
            {/* Recent Transactions - Real Data */}
            <Card className="p-6 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-4 relative z-10">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-bpi-primary" />
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {/* Real transaction data from dashboard query */}
                {dashboardData?.transactions && dashboardData.transactions.length > 0 ? (
                  <>
                    {dashboardData.transactions.slice(0, 5).map((transaction: any, index: number) => (
                      <div key={transaction.id || index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl border border-gray-200 dark:border-bpi-dark-accent hover:shadow-md transition-shadow">
                        {/* Transaction Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          transaction.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                          transaction.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${
                            transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                            transaction.status === 'pending' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                          }`} />
                        </div> 
                        
                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{transaction.type}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{transaction.description || 'Transaction'}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <p className={`text-sm font-bold ${
                              transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                              transaction.status === 'pending' ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.currency === 'BPT' ? 
                                `${transaction.amount.toFixed(8)} BPT` :
                                `₦${transaction.amount.toLocaleString()}`
                              }
                            </p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : transaction.status === 'pending'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {transaction.status === 'completed' ? 'Success' : 
                               transaction.status === 'pending' ? 'Pending' : 'Failed'}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="outline" className="w-full text-sm mt-4">
                      <Eye className="w-4 h-4 mr-2" />
                      View All Transactions
                    </Button>
                  </>
                ) : (
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-blue-500 opacity-50" />
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                      No Recent Transactions
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Your transaction history will appear here once you start making transfers, referrals, or package activations.
                    </p>
                  </div>
                )}
              </div>
            </Card>
            </div>

            {/* Smart Notifications & Alerts */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Alerts & Notifications</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-5 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-4 relative z-10">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-500" />
                Smart Alerts
              </h3>
              <div className="space-y-3">
                {/* Wallet Health Warnings */}
                {walletHealth?.warnings && walletHealth.warnings.length > 0 && (
                  <>
                    {walletHealth.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Wallet Warning
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            {warning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Package Maturity Alerts */}
                {dashboardData?.packages.stats.upcomingMaturities && dashboardData.packages.stats.upcomingMaturities > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Package Maturing Soon
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {dashboardData.packages.stats.upcomingMaturities} package{dashboardData.packages.stats.upcomingMaturities > 1 ? 's' : ''} will mature within 7 days. Plan your reinvestment strategy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Profile Incomplete Warning */}
                {!profileCompletionStatus?.isComplete && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <User className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Complete Your Profile
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Your profile is {profileCompletionStatus?.completionPercentage}% complete. Complete it to unlock all dashboard features.
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Verification Pending */}
                {!userProfile?.emailVerified && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Verify Your Email
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Please verify your email address to receive important notifications and updates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Positive Notifications */}
                {walletHealth?.overall === 'healthy' && 
                 profileCompletionStatus?.isComplete && 
                 userProfile?.emailVerified && 
                 (!dashboardData?.packages.stats.upcomingMaturities || dashboardData.packages.stats.upcomingMaturities === 0) && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        All Systems Normal
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Your account is in good standing. All wallets are healthy and no urgent actions required.
                      </p>
                    </div>
                  </div>
                )}

                {/* No Alerts Message */}
                {!walletHealth?.warnings?.length && 
                 !dashboardData?.packages.stats.upcomingMaturities && 
                 profileCompletionStatus?.isComplete && 
                 userProfile?.emailVerified && (
                  <div className="p-4 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No alerts at this time
                    </p>
                  </div>
                )}
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