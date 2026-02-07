"use client";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useTransition, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/client/trpc";
import LoadingScreen from "@/components/LoadingScreen";
import { 
  User, Calendar, DollarSign, Users, TrendingUp, 
  Bell, Settings, LogOut, ChevronDown, Play,
  CreditCard, BarChart3, Wallet, Gift, Award,
  Shield, BookOpen, Youtube, Calculator,
  Globe, Zap, Target, Home, Cpu, LifeBuoy,
  Store, Grid3x3, Wrench, HelpCircle, ShoppingCart,
  Archive, Database, Server, FileImage, Moon, Sun, X,
  Router, Book, Inbox, FileText, Bookmark, Camera,
  Edit, Check, Eye, Heart, AlertCircle, MapPin,
  Phone, Mail, Flag, TrendingDown, ArrowUp, ArrowDown,
  Lock, Coins, BadgeDollarSign, EyeOff, RefreshCw,
  Clock, Package, CircleDollarSign, AlertTriangle,
  Megaphone, Sparkles, TrendingUpIcon, Leaf, Sun as SolarIcon,
  GraduationCap, Download, ChevronRight, Code, Building2, ChevronLeft, Pause, Loader2, MessageCircle
} from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Modal } from "./ui/Modal";
import { checkProfileCompletion, getCompletionMessage } from "@/lib/profile-completion";
import DashboardPreview from "./DashboardPreview";
import { CommunityCard } from "./CommunityCard";
import UpdatesModal from "./community/UpdatesModal";
import CalculatorModal from "./community/CalculatorModal";
import DealsModal from "./community/DealsModal";
import LeadershipPoolModal from "./community/LeadershipPoolModal";
import EpcEppModal from "./community/EpcEppModal";
import SolarAssessmentModal from "./community/SolarAssessmentModal";
import TrainingCenterModal from "./community/TrainingCenterModal";
import PromotionalMaterialsModal from "./community/PromotionalMaterialsModal";
import DigitalFarmModal from "./community/DigitalFarmModal";
import SubmitChannelModal from "./community/SubmitChannelModal";
import BrowseChannelsModal from "./community/BrowseChannelsModal";
import ThirdPartyOpportunitiesModal from "./community/ThirdPartyOpportunitiesModal";
import ReferralDetailsModal from "./ReferralDetailsModal";
import TaxesModal from "./TaxesModal";
import { Share2 } from "lucide-react";
import { PalliativeJourneyCard } from "./palliative/PalliativeJourneyCard";
import { ActivatedPalliativeCard } from "./palliative/ActivatedPalliativeCard";
import { PalliativeActivationModal } from "./palliative/PalliativeActivationModal";
import DepositModal from "./wallet/DepositModal";
import NotificationsModal from "./notifications/NotificationsModal";
import CommunityStatsModal from "./community/CommunityStatsModal";
import Footer from "./Footer";
import toast from "react-hot-toast";
import WithdrawalModal from "./wallet/WithdrawalModal";
import TransferModal from "./wallet/TransferModal";
import WalletTimelineModal from "./wallet/WalletTimelineModal";
import BptTimelineModal from "./wallet/BptTimelineModal";
import { LocationCascadeField } from "./profile/LocationCascadeField";
import { BankDetailsField } from "./profile/BankDetailsFieldEnhanced";
import { MobileBottomNav } from "./mobile/MobileBottomNav";
import { CollapsibleSection } from "./mobile/CollapsibleSection";

interface DashboardContentProps {
  session: Session;
  customContent?: ReactNode;
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
  
  const updateProfile = api.user.updateDetails.useMutation({
    onMutate: () => {
      onUpdateStatus?.('loading', `Updating ${label.toLowerCase()}...`);
    },
    onSuccess: async () => {
      setIsEditing(false);
      onUpdateStatus?.('success', `${label} updated successfully!`);
      // Refetch profile data to update UI in real-time
      await utils.user.getDetails.invalidate();
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
      [fieldKey]: editValue
    } as any);
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

export default function DashboardContent({ session, customContent }: DashboardContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isBlogNavPending, startBlogNav] = useTransition();
  const [navLoadingHref, setNavLoadingHref] = useState<string | null>(null);
  const readOnlyProfile = !!customContent;
  const isStorePage = pathname?.startsWith("/store");
  const containerClass = `min-h-screen w-full ${isStorePage
    ? "bg-gradient-to-br from-amber-100 via-orange-200 to-amber-300 dark:from-amber-200 dark:via-orange-300 dark:to-amber-400"
    : "bg-bpi-gradient-light dark:bg-bpi-gradient-dark"}`;
  
  // Safety check for session
  if (!session || !session.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, toggleTheme } = useTheme();
  // Announcement state + animation
  const [showAnnouncement, setShowAnnouncement] = useState<boolean>(true);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  
  // Dashboard state
  const [showBalances, setShowBalances] = useState(true); // Toggle to show/hide balances
  const [activeWalletTab, setActiveWalletTab] = useState<'operational' | 'rewards' | 'investment' | 'community'>('operational');
  
  // Wallet dropdown states
  const [showBpiTokenDetails, setShowBpiTokenDetails] = useState(false);
  const [showMainWalletDetails, setShowMainWalletDetails] = useState(false);
  const [showPalliativeDetails, setShowPalliativeDetails] = useState(false);
  const [showTaxesModal, setShowTaxesModal] = useState(false);
  const [isWalletTimelineOpen, setIsWalletTimelineOpen] = useState(false);
  const [isBptTimelineOpen, setIsBptTimelineOpen] = useState(false);
  
  // Wallet operation modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  // Email verification dialog state
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'success' | 'error'>('idle');
  const [lastEmailReminderTime, setLastEmailReminderTime] = useState<number>(Date.now());
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto Inviter state
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  // Investment Deals Carousel State
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Notifications Modal State
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Community Stats Modal State
  const [showCommunityStatsModal, setShowCommunityStatsModal] = useState(false);
  
  // Navigation Loading State
  const [isMembershipNavigating, setIsMembershipNavigating] = useState(false);

  const currentPath = pathname || "";
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);
  useEffect(() => {
    setNavLoadingHref(null);
  }, [currentPath]);
  const navItemClass = (active: boolean) =>
    active
      ? "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-bpi-primary to-bpi-secondary text-white shadow-sm"
      : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors";

  const sidebarNav = () => (
    <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 shadow-lg dark:shadow-none">
      <nav className="space-y-1">
        <div className="group">
          <Link href="/dashboard" className={navItemClass(isActive("/dashboard") || currentPath === "/") }
            onClick={() => setNavLoadingHref("/dashboard")}>
            {navLoadingHref === "/dashboard" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <Home className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Dashboard</div>
            </div>
          </Link>
        </div>

        <div className="group">
          <Link href="/blog" className={navItemClass(isActive("/blog"))}
            onClick={() => setNavLoadingHref("/blog")}>
            {navLoadingHref === "/blog" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <BookOpen className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">BPI Blog</div>
            </div>
          </Link>
        </div>

        <div className="group">
          <Link href="/csp" className={navItemClass(isActive("/csp"))}
            onClick={() => setNavLoadingHref("/csp")}>
            {navLoadingHref === "/csp" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <LifeBuoy className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">BPI CSP</div>
            </div>
          </Link>
        </div>

        <div className="group">
          <Link href="/store" className={navItemClass(isActive("/store"))}
            onClick={() => setNavLoadingHref("/store")}>
            {navLoadingHref === "/store" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <Store className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Store</div>
            </div>
          </Link>
        </div>

        <div className="group">
          <Link href="/help" className={navItemClass(isActive("/help"))}
            onClick={() => setNavLoadingHref("/help")}>
            {navLoadingHref === "/help" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <AiOutlineRobot className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Smart Help</div>
            </div>
          </Link>
        </div>

        <div className="group">
          <Link href="/settings" className={navItemClass(isActive("/settings"))}
            onClick={() => setNavLoadingHref("/settings")}>
            {navLoadingHref === "/settings" ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <User className="w-5 h-5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Account</div>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
  
  const formatTimeAgo = useCallback((value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }, []);

  // Currency context
  const { selectedCurrency: currentCurrency, currencies, setSelectedCurrencyId, formatAmount: formatAmountFromContext, convertAmount } = useCurrency();
  const selectedCurrencyId = currentCurrency?.id || '';

  // Use formatAmount from context
  const formatAmount = formatAmountFromContext;

  // Investment Deals Data
  const investmentDeals = [
    {
      id: 2,
      title: 'ICT Skills for Teens',
      description: 'A unique opportunity to embark on a digital skill journey from the ground up',
      icon: Code,
      color: '#A855F7', // Purple
      category: 'Training & Skills',
      price: 20000,
      fullTitle: '21st Century ICT Skills for Teens (Ages 13-19)',
      subtitle: 'Empowering Pan-African Teens to Excel in ICT and Digital Skills',
      details: {
        overview: 'This program allows teens to embark on a digital skill journey from the ground up. Participants gain access to various courses designed to introduce them to essential ICT skills and enhance their social media capabilities.',
        ictOptions: [
          'Introduction to Web Development: Learn the basics of HTML and CSS',
          'Introduction to App Development: Dive into app creation fundamentals',
          'Programming: Develop coding skills with Python and JavaScript'
        ],
        socialMediaOptions: [
          'Video Editing: Create and edit engaging videos',
          'Content Writing: Craft compelling written content',
          'Graphics Design: Design visually appealing graphics'
        ],
        benefits: [
          'Self-paced Learning: Start at the beginner stage and progress to an expert level in your chosen skill',
          'Select Your Path: Choose one ICT skill and one social media upskill program to tailor your learning experience',
          'Affordable Investment: A subscription fee opens the door to this comprehensive learning opportunity'
        ]
      },
      paymentOptions: ['wallet', 'cashback']
    },
    {
      id: 1,
      title: 'BPI BSC & Masters',
      description: 'Enroll with BPI Strategic Partner Universities Abroad for BSC and Masters Degree',
      icon: GraduationCap,
      color: '#2d7a4f', // Green to align with brand
      category: 'Education',
      status: 'application_pending',
      fullTitle: 'BPI BSc & MSc, MBA, MCA, MA Online Program',
      subtitle: 'Access to Higher Education Through Partner Universities',
      details: {
        overview: "As part of our commitment to education and skill development, BPI's third pillar focuses on providing access to higher education through our BPI BSc & MSc, MBA, MCA, and MA Online Programs. This initiative allows BPI members to pursue degree and certification courses from partner universities and institutions.",
        keyFeatures: [
          'BPI Membership Benefits: Use your BPI cashback to enroll in BSc, MSc, or certification programs',
          'Accessible Education: Even without JAMB, African members with just 5 credits in O\'Level (WAEC or equivalent) can start their academic journey'
        ],
        bscPrograms: [
          'Computer Science & IT',
          'Cybersecurity',
          'Artificial Intelligence'
        ],
        masterPrograms: [
          'Business Intelligence & Analytics',
          'Entrepreneurship & Leadership',
          'Computer Science & IT',
          'Cybersecurity',
          'Data Analytics',
          'Information Technology Management'
        ],
        duration: {
          bsc: '3 years',
          masters: '2 years for MSc, MBA, MCA, and MA programs'
        },
        mission: 'This program is designed to help BPI members upskill, whether they are students or working professionals, enabling them to advance their careers and contribute to their communities.'
      }
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isCarouselPaused) {
      const interval = setInterval(() => {
        setCurrentDealIndex((prev) => (prev + 1) % investmentDeals.length);
      }, 5000); // 5 seconds per slide
      return () => clearInterval(interval);
    }
  }, [isCarouselPaused, investmentDeals.length]);

  const handleNextDeal = () => {
    setCurrentDealIndex((prev) => (prev + 1) % investmentDeals.length);
  };

  const handlePrevDeal = () => {
    setCurrentDealIndex((prev) => (prev - 1 + investmentDeals.length) % investmentDeals.length);
  };

  const handleDealClick = (deal: any) => {
    setSelectedDeal(deal);
    setIsDealModalOpen(true);
  };

  const closeDealModal = useCallback(() => {
    setIsDealModalOpen(false);
    setSelectedDeal(null);
  }, []);

  // Allow closing the Investment Deal modal with Escape
  useEffect(() => {
    if (!isDealModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDealModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDealModalOpen, closeDealModal]);

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
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Avatar upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // API data fetching
  const utils = api.useUtils();
  const { data: userProfile, isLoading: isLoadingProfile } = api.user.getDetails.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: dashboardData, isLoading: isLoadingWallets } = api.dashboard.getOverview.useQuery(undefined, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: referralStats } = api.referral.getReferralStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: leadershipData } = api.leadership.getMyProgress.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: notifications, isLoading: isLoadingNotifications, error: notificationsError } = api.notification.getMyNotifications.useQuery(undefined, {
    staleTime: 1 * 60 * 1000, // 1 minute for notifications
    refetchOnWindowFocus: false,
  });
  const { data: communityStats, isLoading: isLoadingCommunityStats } = api.community.getStats.useQuery(undefined, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
  const markNotificationAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
    },
  });

  const markMultipleAsRead = api.notification.markMultipleAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
    },
  });

  const archiveNotifications = api.notification.archiveNotifications.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
    },
  });

  const deleteNotifications = api.notification.deleteNotifications.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
    },
  });
  
  // Extract data from dashboard overview
  const walletBalances = dashboardData?.wallets;
  const communityWallets = dashboardData ? {
    palliativeBalance: dashboardData.wallets.community.find(w => w.name.toLowerCase().includes('palliative'))?.balance || 0,
    shelterBalance: dashboardData.wallets.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0,
    communityBalance: dashboardData.wallets.community.find(w => w.name.toLowerCase().includes('community'))?.balance || 0
  } : undefined;
  const transactionHistory = dashboardData?.transactions;
  const activeShelters = undefined; // REMOVED - was mock data
  const leadershipPool = leadershipData;
  
  // New membership package query for gating
  const { data: userDetails, isLoading: isLoadingDetails } = api.user.getDetails.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const needsActivation = !isLoadingDetails && !userDetails?.activeMembership;
  
  // Training progress for current course tracker
  const { data: myTrainingProgress } = api.trainingCenter.getMyProgress.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const currentCourse = myTrainingProgress?.find((p: any) => !p.completedAt);
  // const { data: userKnowledgeRank } = api.trainingCenter.getMyBadges.useQuery();
  const { data: myBadges } = api.trainingCenter.getMyBadges.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Daily invite count query
  const { data: inviteCount } = api.referral.getDailyInviteCount.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get user's referral link
  const { data: referralLinkData } = api.referral.getMyReferralLink.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get recent referrals (last 5)
  const { data: recentReferralsData } = api.referral.getRecentReferrals.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get latest blog posts for dashboard carousel
  const { data: latestBlogPosts } = api.blog.getLatestPosts.useQuery({ limit: 12 }, {
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const [blogSlide, setBlogSlide] = useState(0);
  const [blogCardsPerView, setBlogCardsPerView] = useState(1);
  const blogCarouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const computeCardsPerView = () => {
      if (typeof window === "undefined") return 1;
      const w = window.innerWidth;
      if (w >= 1600) return 5;
      if (w >= 1280) return 4;
      if (w >= 1024) return 3;
      if (w >= 768) return 2;
      return 1;
    };

    const handleResize = () => setBlogCardsPerView(computeCardsPerView());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setBlogSlide(0);
  }, [latestBlogPosts?.posts?.length, blogCardsPerView]);

  useEffect(() => {
    if (!latestBlogPosts?.posts?.length || blogCardsPerView <= 0) return;
    const total = latestBlogPosts.posts.length;
    if (total <= 1) return;
    const maxStart = Math.max(0, total - blogCardsPerView);

    const id = setInterval(() => {
      setBlogSlide((current) => {
        const nextSlide = current + 1;
        return nextSlide > maxStart ? 0 : nextSlide;
      });
    }, 5000); // Slide every 5 seconds

    return () => clearInterval(id);
  }, [latestBlogPosts?.posts?.length, blogCardsPerView]);

  useEffect(() => {
    const container = blogCarouselRef.current;
    if (!container) return;
    const children = container.children;
    if (!children.length) return;
    const clampedIndex = Math.max(0, Math.min(blogSlide, children.length - 1));
    const target = children[clampedIndex] as HTMLElement;
    container.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, [blogSlide, blogCardsPerView]);
  
  // Get wallet health status
  const { data: walletHealth } = api.dashboard.getWalletHealth.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get admin settings for feature toggles
  const { data: adminSettings } = api.admin.getSettings.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get third-party platforms summary
  const { data: summary } = api.thirdPartyPlatforms.getSummary.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get available third-party platforms (to check if there are any from upline)
  const { data: availablePlatforms } = api.thirdPartyPlatforms.getAvailablePlatforms.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get total taxes paid
  const { data: totalTaxes } = api.taxes.getTotalTaxes.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get Leadership Pool progress
  const { data: leadershipProgress } = api.leadership.getMyProgress.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Get Leadership Pool admin settings
  const { data: leadershipPoolSettings } = api.leadershipPool.getPoolSettings.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Portfolio 24h tracking
  const [portfolio24hChange, setPortfolio24hChange] = useState({ change: 0, percentage: 0 });

  // Track portfolio value for 24h change calculation
  useEffect(() => {
    if (dashboardData?.portfolio.totalValue === undefined) return;

    const now = Date.now();
    const currentValue = dashboardData.portfolio.totalValue;

    const storedSnapshots = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("bpi:portfolioSnapshots") || "[]")
      : [];

    const newSnapshot = { timestamp: now, value: currentValue };
    const updatedSnapshots = [...storedSnapshots, newSnapshot]
      .filter((s) => now - s.timestamp < 25 * 60 * 60 * 1000)
      .sort((a, b) => b.timestamp - a.timestamp);

    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const snapshot24hAgo = updatedSnapshots.find((s) => s.timestamp <= twentyFourHoursAgo);
    const fallbackSnapshot = updatedSnapshots.at(-1);

    if (snapshot24hAgo || fallbackSnapshot) {
      const basis = snapshot24hAgo ?? fallbackSnapshot;
      const change = currentValue - basis.value;
      const percentage = basis.value > 0 ? (change / basis.value) * 100 : 0;
      setPortfolio24hChange({ change, percentage });
    } else {
      setPortfolio24hChange({ change: 0, percentage: 0 });
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("bpi:portfolioSnapshots", JSON.stringify(updatedSnapshots));
    }
  }, [dashboardData?.portfolio.totalValue]);
  
  // Backfill VAT for existing memberships (runs once on mount if needed)
  const backfillVatMutation = api.package.backfillMembershipVat.useMutation();
  
  // Combined loading state - wait for critical data before rendering dashboard
  const isInitialLoading = isLoadingProfile || isLoadingWallets || isLoadingDetails;

  // Community Updates queries
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  // const { data: unreadUpdatesCount } = api.communityUpdates.getUnreadCount.useQuery();
  const unreadUpdatesCount = 0;
  
  // Calculator modal state
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  
  // Deals modal state
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  
  // Leadership Pool modal state
  const [isLeadershipPoolModalOpen, setIsLeadershipPoolModalOpen] = useState(false);
  
  // EPC & EPP modal state
  const [isEpcEppModalOpen, setIsEpcEppModalOpen] = useState(false);
  
  // Solar Assessment modal state
  const [isSolarAssessmentModalOpen, setIsSolarAssessmentModalOpen] = useState(false);
  
  // Training Center modal state
  const [isTrainingCenterModalOpen, setIsTrainingCenterModalOpen] = useState(false);
  
  // Promotional Materials modal state
  const [isPromotionalMaterialsModalOpen, setIsPromotionalMaterialsModalOpen] = useState(false);
  
  // Digital Farm modal state
  const [isDigitalFarmModalOpen, setIsDigitalFarmModalOpen] = useState(false);
  
  const [isSubmitChannelModalOpen, setIsSubmitChannelModalOpen] = useState(false);
  const [isBrowseChannelsModalOpen, setIsBrowseChannelsModalOpen] = useState(false);
  
  // Third-Party Opportunities modal state
  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false);

  // Palliative activation modal state
  const [isPalliativeActivationModalOpen, setIsPalliativeActivationModalOpen] = useState(false);

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
    totalMembers: 0,
    palliativeMembers: 0,
    activeShelters: 0,
    activeTickets: 0
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
      
      // Reset avatar error state
      setAvatarLoadError(false);
      
      // Refetch profile to update both avatar locations
      await utils.user.getDetails.invalidate();
      
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
      await utils.user.getDetails.invalidate();
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
      await utils.dashboard.getOverview.invalidate();
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
  const formatBalance = (amount: number) => {
    if (!showBalances) {
      return `${currentCurrency?.sign || '₦'}•••••••`;
    }
    
    return formatAmount(amount);
  };

  // Badge counts for mobile collapsibles
  const unreadNotificationsCount = notifications?.filter((n) => !n.isRead).length || 0;
  const walletWarningCount = walletHealth?.warnings?.length || 0;
  const pendingMaturitiesCount = dashboardData?.packages?.stats?.upcomingMaturities || 0;
  const missingProfileFieldsCount = profileCompletionStatus?.missingFields?.length || 0;
  const pendingCommunityItemsCount = (summary?.pendingPlatforms || 0) + (unreadUpdatesCount || 0);
  const alertsBadgeCount =
    unreadNotificationsCount +
    walletWarningCount +
    pendingMaturitiesCount +
    (!profileCompletionStatus?.isComplete ? 1 : 0) +
    (!userProfile?.emailVerified ? 1 : 0);
  const accountToolsBadge = missingProfileFieldsCount;
  const dashboardSectionsBadge = walletWarningCount + pendingMaturitiesCount;
  const accountOverviewBadge = walletWarningCount;
  const myWalletsBadge = walletWarningCount;
  const communityFeaturesBadge = pendingCommunityItemsCount;

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
      <LoadingScreen 
        message="Loading Your Dashboard"
        subtitle="Fetching your personalized data..."
      />
    );
  }

  const blogPosts = latestBlogPosts?.posts || [];
  const blogTotal = blogPosts.length;
  const maxBlogStart = Math.max(0, blogTotal - blogCardsPerView);
  const blogPageCount = Math.max(1, Math.ceil(blogTotal / Math.max(blogCardsPerView, 1)));
  const blogCurrentPage = Math.min(blogPageCount - 1, Math.floor(blogSlide / Math.max(blogCardsPerView, 1)));

  // Community stats helpers
  const dailySignups = communityStats?.dailySignups || [];
  const lastSignup = dailySignups[dailySignups.length - 1]?.signups || 0;
  const prevSignup = dailySignups[dailySignups.length - 2]?.signups || 0;
  const growthDelta = lastSignup - prevSignup;
  const growthPct = prevSignup > 0 ? (growthDelta / prevSignup) * 100 : (lastSignup > 0 ? 100 : 0);
  const cs: any = communityStats as any;
  const topRegion = cs?.topRegion?.name || cs?.platform?.topRegion || cs?.platform?.topCountry;
  const topReferrer = cs?.topReferrer?.name || cs?.platform?.topReferrer;
  const totalMembers = communityStats?.platform.totalUsers || 0;
  const todayMetrics = [
    {
      label: 'New signups',
      value: communityStats?.platform.todaySignups ?? lastSignup ?? 0,
      delta: growthDelta,
      icon: Users,
    },
    {
      label: 'Active members',
      value: communityStats?.platform.activeMembers || 0,
      delta: (communityStats?.platform.activeMembers || 0) - (cs?.platform?.prevActiveMembers || 0),
      icon: TrendingUp,
    },
    {
      label: 'Palliative active',
      value: communityStats?.platform.palliativeActiveUsers || 0,
      delta: cs?.platform?.palliativeChange || 0,
      icon: Heart,
    },
    {
      label: 'New this month',
      value: communityStats?.platform.newUsersThisMonth || 0,
      delta: (communityStats?.platform.newUsersThisMonth || 0) - (cs?.platform?.prevMonthUsers || 0),
      icon: Calendar,
    },
  ];

  const regionBreakdownRaw = Array.isArray(cs?.topRegions)
    ? cs.topRegions
    : Array.isArray(cs?.platform?.topRegions)
      ? cs.platform.topRegions
      : [];
  const fallbackRegions = !regionBreakdownRaw?.length && topRegion
    ? [{ name: topRegion, count: cs?.platform?.topRegionCount || cs?.platform?.topCountryCount || 0 }]
    : [];
  const regionBreakdown = (regionBreakdownRaw?.length ? regionBreakdownRaw : fallbackRegions).slice(0, 3).map((region: any) => {
    const count = region?.count || region?.value || region?.total || 0;
    return {
      name: region?.name || region?.region || region?.label || 'Region',
      count,
      share: totalMembers > 0 ? (count / totalMembers) * 100 : 0,
    };
  });

  const referrerBreakdownRaw = Array.isArray(cs?.topReferrers)
    ? cs.topReferrers
    : Array.isArray(cs?.platform?.topReferrers)
      ? cs.platform.topReferrers
      : [];
  const fallbackReferrers = !referrerBreakdownRaw?.length && topReferrer
    ? [{ name: topReferrer, count: cs?.platform?.topReferrerCount || (referralStats as any)?.activereferrals || 0 }]
    : [];
  const referrerBreakdown = (referrerBreakdownRaw?.length ? referrerBreakdownRaw : fallbackReferrers).slice(0, 3).map((ref: any) => {
    const count = ref?.count || ref?.value || ref?.total || 0;
    return {
      name: ref?.name || ref?.referrer || ref?.label || 'Referrer',
      count,
      share: totalMembers > 0 ? (count / totalMembers) * 100 : 0,
    };
  });

  const funnelVisits = cs?.platform?.visits || cs?.platform?.traffic || (totalMembers ? totalMembers * 2 : 0);
  const funnelSignups = communityStats?.platform.totalUsers || 0;
  const funnelVerified = cs?.platform?.verifiedUsers || cs?.platform?.kycVerified || communityStats?.platform.activeMembers || 0;
  const funnelActive = communityStats?.platform.activeMembers || 0;
  const funnelSteps = [
    { label: 'Visits', value: funnelVisits || Math.max(funnelSignups * 2, 0), color: 'from-emerald-500 to-green-500' },
    { label: 'Signups', value: funnelSignups, color: 'from-blue-500 to-cyan-500' },
    { label: 'Verified', value: funnelVerified, color: 'from-indigo-500 to-purple-500' },
    { label: 'Active', value: funnelActive, color: 'from-orange-500 to-amber-500' },
  ];

  const activeRateSeries = (cs?.activeRateHistory || cs?.platform?.activeRateHistory || (dailySignups.length ? dailySignups.map(() => communityStats?.platform.activeRate || 0) : [communityStats?.platform.activeRate || 0])).slice(-7);
  const signupSeries = dailySignups.slice(-7);
  const activityFeed = (Array.isArray(cs?.recentActivity) ? cs.recentActivity : (recentReferralsData?.referrals || [])).slice(0, 5);
  
  return (
    <div className={containerClass}>
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
                Click the button below to receive a verification code at your registered email address: <span className="font-semibold text-foreground">{session?.user?.email}</span>
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
                We've sent a 6-digit verification code to <span className="font-semibold text-foreground">{session?.user?.email}</span>
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

      {/* Subscription Activation Modal - Non-dismissible, blocks everything until membership activated */}
      {needsActivation && (
        <Modal isOpen={true} title="Activate Your Account" onClose={undefined}>
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
      )}

      {/* Mobile: single base container; desktop: structured containers */}
      <div>
        {/* Extended Header with BPI Theme */}
        <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm sticky top-0 z-40">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              {/* Logo & Brand - Aligned with container left */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  <img src="/img/logo.png" alt="BPI Logo" className="w-full h-full object-cover" />
                </div>
                <div className="hidden md:block">
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

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    utils.user.getDetails.invalidate();
                    utils.dashboard.getOverview.invalidate();
                    utils.referral.getReferralStats.invalidate();
                    utils.leadership.getMyProgress.invalidate();
                    utils.notification.getMyNotifications.invalidate();
                    utils.community.getStats.invalidate();
                    toast.success('Dashboard refreshed!');
                  }}
                  className="gap-2 bg-white dark:bg-green-900/40 hover:bg-accent border-gray-300 dark:border-green-700/50"
                  title="Refresh dashboard data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden lg:inline">Refresh</span>
                </Button>

                {/* Theme Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className="gap-2 bg-white dark:bg-green-900/40 hover:bg-accent border-gray-300 dark:border-green-700/50"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span className="hidden md:inline">
                    {theme === 'light' ? 'Dark' : 'Light'}
                  </span>
                </Button>

                {/* Currency Selector */}
                <div className="relative">
                  <select
                    value={selectedCurrencyId}
                    onChange={(e) => setSelectedCurrencyId(e.target.value)}
                    className="h-9 px-3 pr-8 text-sm font-medium bg-white dark:bg-green-900/40 hover:bg-accent border border-gray-300 dark:border-green-700/50 rounded-md appearance-none cursor-pointer transition-colors text-gray-900 dark:text-white"
                    disabled={!currencies || currencies.length === 0}
                  >
                    {currencies?.map((currency) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.sign} {currency.symbol}
                      </option>
                    ))}
                  </select>
                  <RefreshCw className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile?.image && !avatarLoadError ? (
                      <img 
                        src={userProfile.image} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                        onError={() => {
                          console.error('Failed to load avatar:', userProfile.image);
                          setAvatarLoadError(true);
                        }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-foreground">
                      {session?.user?.name || session?.user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userDetails?.activeMembership
                        ? `${userDetails.activeMembership.name} (${formatAmount(userDetails.activeMembership.price)})`
                        : "No Membership"}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-green-900/40 border-gray-300 dark:border-green-700/50">
                      <Settings className="w-4 h-4" />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </Link>
                  
                  <Link href="/api/auth/signout">
                    <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-green-900/40 border-gray-300 dark:border-green-700/50">
                      <LogOut className="w-4 h-4" />
                      <span className="hidden md:inline">Sign Out</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Main Dashboard */}
        <main className="w-full py-6 sm:py-8 px-3 sm:px-4 lg:px-6 relative">
        {customContent ? (
          <div className="grid grid-cols-12 gap-2 lg:gap-3 relative items-start">
            <div className="hidden lg:block lg:col-span-1">{sidebarNav()}</div>
            <div className="hidden md:block md:col-span-12 lg:col-span-2">
              <div className={`bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-4 shadow-lg dark:shadow-none mb-3`}>
                {/* Reuse the same profile card but with read-only safeguards */}
                <h2 className="text-lg font-semibold text-foreground mb-3">User Profile</h2>
                <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
                {/** Content below is shared with the main profile card and respects readOnlyProfile */}
                {/* Avatar and basic info are rendered above in the existing card structure; reuse by rendering the same JSX via a fragment */}
                {/* We reuse the same block by calling a small inline fragment to avoid duplication */}
                <div>
                  {/* Avatar + name/email */}
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-t-xl">
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      {userProfile?.image && !avatarLoadError ? (
                        <img 
                          src={userProfile.image} 
                          alt="Profile" 
                          className="w-16 h-16 rounded-full object-cover"
                          onError={() => {
                            console.error('Failed to load avatar:', userProfile.image);
                            setAvatarLoadError(true);
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <h2 className="font-bold text-base text-foreground mb-0.5">
                      {session?.user?.name || 'BPI Member'}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-2">
                      {session?.user?.email}
                    </p>
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
                  </div>

                  <div className="space-y-1 text-left mt-3">
                    <ProfileField
                      label="First Name"
                      value={userProfile?.firstname || ''}
                      fieldKey="firstname"
                      icon={User}
                      isEditable={false}
                    />
                    <ProfileField
                      label="Last Name"
                      value={userProfile?.lastname || ''}
                      fieldKey="lastname"
                      icon={User}
                      isEditable={false}
                    />
                    <ProfileField
                      label="Email"
                      value={userProfile?.email || ''}
                      fieldKey="email"
                      icon={Mail}
                      isEditable={false}
                    />
                    <ProfileField
                      label="Phone"
                      value={userProfile?.mobile || ''}
                      fieldKey="mobile"
                      icon={Phone}
                      isEditable={false}
                    />
                    <ProfileField
                      label="SSC (Secured Secret)"
                      value={userProfile?.ssc || 'Not assigned'}
                      fieldKey="ssc"
                      icon={Shield}
                      isEditable={false}
                    />
                    <ProfileField
                      label="Address"
                      value={userProfile?.address || ''}
                      fieldKey="address"
                      icon={MapPin}
                      isEditable={false}
                    />
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/60 text-sm text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">
                        {[(userProfile as any)?.cityRelation?.name, (userProfile as any)?.stateRelation?.name, (userProfile as any)?.countryRelation?.name]
                          .filter(Boolean)
                          .join(', ') || 'Location not set'}
                      </span>
                    </div>
                    <ProfileField
                      label="Gender"
                      value={userProfile?.gender || ''}
                      fieldKey="gender"
                      icon={User}
                      isEditable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-9">{customContent}</div>
          </div>
        ) : (
          <>
        {/* Profile Completion Banner - Only show if membership is active */}
        {!needsActivation && !isProfileComplete && (
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

        <div className="grid grid-cols-12 gap-3 lg:gap-4 relative items-start">
          
          {/* Profile Incomplete Overlay - Only show if membership is active AND profile is incomplete */}
          {!needsActivation && !isProfileComplete && (
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
          
          <div className="hidden lg:block lg:col-span-1">{sidebarNav()}</div>

          {/* User Profile Column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full">
            {/* SSC badge (only when present) */}
            {userProfile?.ssc && (
              <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 sm:p-5 shadow-lg dark:shadow-none border border-emerald-100/80 dark:border-emerald-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">IDENTITY</span>
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">YOUR SSC</h3>
                <p className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-200 break-words">
                  {userProfile.ssc}
                </p>
                <hr className="my-3 border-gray-200 dark:border-bpi-dark-accent" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SSC stands for Social Security Code. It is unique to each user and serves as your identifier across the BPI digital ecosystem.
                </p>
              </div>
            )}

            {/* User Profile Card - ONLY this card elevated with z-20 when membership is active and profile incomplete */}
            <div className={`bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3 ${!needsActivation && !isProfileComplete ? 'relative z-20' : ''}`}>
              <h2 className="text-lg font-semibold text-foreground mb-3">User Profile</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-t-xl">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  {userProfile?.image && !avatarLoadError ? (
                    <img 
                      src={userProfile.image} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => {
                        console.error('Failed to load avatar:', userProfile.image);
                        setAvatarLoadError(true);
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {!readOnlyProfile && (
                    <>
                      <input
                        id="avatar-upload-input"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                      <button 
                        onClick={triggerFileInput}
                        disabled={isUploading}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-bpi-secondary hover:bg-bpi-primary text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-2.5 h-2.5" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Upload Progress */}
                {!readOnlyProfile && isUploading && (
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
                  {session?.user?.name || 'BPI Member'}
                </h2>
                <p className="text-xs text-muted-foreground mb-2">
                  {session?.user?.email}
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

                {/* Current Course Tracker */}
                {currentCourse && (
                  <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-emerald-900 dark:text-emerald-100 font-medium truncate">
                            {currentCourse.course.title}
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold ml-2">
                            {Math.round(((currentCourse as any).progressPercentage || currentCourse.progress || 0))}%
                          </span>
                        </div>
                        <div className="w-full bg-emerald-200 dark:bg-emerald-800/30 rounded-full h-1 mb-1">
                          <div 
                            className="bg-emerald-600 dark:bg-emerald-400 h-1 rounded-full transition-all"
                            style={{ width: `${((currentCourse as any).progressPercentage || currentCourse.progress || 0)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Last: {new Date(currentCourse.lastAccessedAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => {/* Open training modal */}}
                            className="text-emerald-700 dark:text-emerald-300 hover:underline font-medium"
                          >
                            Continue →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knowledge Rank Display - Commented out until endpoint is ready */}
                {/* {userKnowledgeRank && (
                  <div className="mb-2 px-2 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <div className="flex-1">
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                          {(userKnowledgeRank as any)?.rank?.title || 'Beginner'}
                        </div>
                        <div className="text-[9px] text-purple-500 dark:text-purple-500">
                          {(userKnowledgeRank as any)?.coursesCompleted || 0} courses • {(userKnowledgeRank as any)?.badgesEarned || 0} badges
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* Quick Actions */}
                <hr className="my-2 border-gray-200 dark:border-bpi-dark-accent" />
                
                {/* Profile Update Alert */}
                {!readOnlyProfile && alertState.show && (
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
                    isEditable={!readOnlyProfile}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Last Name */}
                  <ProfileField
                    label="Last Name"
                    value={userProfile?.lastname || ''}
                    fieldKey="lastname"
                    icon={User}
                    isEditable={!readOnlyProfile}
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
                    isEditable={!readOnlyProfile}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Address */}
                  <ProfileField
                    label="Address"
                    value={userProfile?.address || ''}
                    fieldKey="address"
                    icon={MapPin}
                    isEditable={!readOnlyProfile}
                    onUpdateStatus={handleUpdateStatus}
                  />
                  
                  {/* Location (Country, State, City) - Cascade Dropdown */}
                  {readOnlyProfile ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/60 text-sm text-foreground">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">
                        {[(userProfile as any)?.cityRelation?.name, (userProfile as any)?.stateRelation?.name, (userProfile as any)?.countryRelation?.name]
                          .filter(Boolean)
                          .join(', ') || 'Location not set'}
                      </span>
                    </div>
                  ) : (
                    <LocationCascadeField
                      countryValue={userProfile?.country || null}
                      stateValue={userProfile?.state || null}
                      cityValue={userProfile?.city || null}
                      countryName={(userProfile as any)?.countryRelation?.name || null}
                      stateName={(userProfile as any)?.stateRelation?.name || null}
                      cityName={(userProfile as any)?.cityRelation?.name || null}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  )}
                  
                  {/* Bank Details (Withdrawal) */}
                  {!readOnlyProfile && <BankDetailsField userId={session.user?.id || ''} />}
                  
                  {/* Gender */}
                  <ProfileField
                    label="Gender"
                    value={userProfile?.gender || ''}
                    fieldKey="gender"
                    icon={User}
                    isEditable={!readOnlyProfile}
                    onUpdateStatus={handleUpdateStatus}
                  />
                </div>

                {/* Earned Badges */}
                {myBadges && myBadges.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-bpi-dark-accent">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Achievements
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        {(myBadges as any)?.filter?.((b: any) => b.isDisplayed)?.length || 0}/{(myBadges as any)?.length || 0}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(myBadges as any)?.filter?.((b: any) => b.isDisplayed)?.slice(0, 6)?.map((userBadge: any) => (
                        <div
                          key={userBadge?.id}
                          className="group relative"
                          title={`${userBadge?.badge?.name}: ${userBadge?.badge?.description}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                            userBadge?.badge?.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-600' :
                            userBadge?.badge?.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400 to-pink-500 border-purple-600' :
                            userBadge?.badge?.rarity === 'rare' ? 'bg-gradient-to-br from-emerald-400 to-lime-500 border-emerald-600' :
                            'bg-gradient-to-br from-gray-300 to-gray-400 border-gray-500'
                          }`}>
                            {userBadge?.badge?.icon}
                          </div>
                        </div>
                      )) || []}
                      {((myBadges as any)?.filter?.((b: any) => b.isDisplayed)?.length || 0) > 6 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-green-900/30 border-2 border-gray-400 dark:border-green-700 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-gray-600 dark:text-emerald-200">
                            +{(myBadges as any)?.filter?.((b: any) => b.isDisplayed)?.length - 6}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2">
                  <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                    <Shield className="w-3 h-3" />
                    <span className="text-xs">Security</span>
                  </Button>
                </div>
              </div>
            </div>


            <CollapsibleSection
              title="Account Tools"
              icon={<Users className="w-5 h-5" />}
              defaultExpanded={false}
              storageKey="left-column-sections"
              badge={accountToolsBadge}
              badgeOnMobileOnly
              mobileOnly
            >

            {/* Account Statistics */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Account Statistics</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
              <h3 className="font-semibold text-foreground mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-t-xl">Account Activity</h3>
              <div className="space-y-3">
                {/* Total Referrals */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Total Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.totalreferrals || 0}
                  </span>
                </div>

                {/* Level 1 (Direct) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-bpi-primary" />
                    <span className="text-sm text-muted-foreground">Direct Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.activereferrals || 0}
                  </span>
                </div>

                {/* Level 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Level 2 Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.level2Count || 0}
                  </span>
                </div>

                {/* Level 3 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Level 3 Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.level3Count || 0}
                  </span>
                </div>

                {/* Level 4 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Level 4 Referrals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {referralStats?.level4Count || 0}
                  </span>
                </div>

                {/* Total Team Size */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Total Team Size</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {(referralStats?.totalreferrals || 0) + (referralStats?.level2Count || 0) + (referralStats?.level3Count || 0) + (referralStats?.level4Count || 0)}
                  </span>
                </div>

                {/* View Referral Details Button */}
                <div className="pt-2 border-t border-gray-200 dark:border-bpi-dark-accent">
                  <button
                    onClick={() => setShowReferralModal(true)}
                    className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-bpi-primary to-green-600 text-white rounded-lg font-medium text-sm hover:from-green-700 hover:to-bpi-primary transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isNavigating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        View Referral Details
                      </>
                    )}
                  </button>
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
            </div>

            {/* Membership Status */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Membership Status</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
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
                  ((walletBalances?.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0) > 0)
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Home className={`w-4 h-4 ${
                      ((walletBalances?.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0) > 0)
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      ((walletBalances?.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0) > 0)
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Shelter Activation</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    ((walletBalances?.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0) > 0)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {((walletBalances?.community.find(w => w.name.toLowerCase().includes('shelter'))?.balance || 0) > 0) ? 'Active' : 'Inactive'}
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
                  (referralStats?.activereferrals || 0) > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Award className={`w-4 h-4 ${
                      (referralStats?.activereferrals || 0) > 0
                        ? 'text-green-500 animate-pulse'
                        : 'text-red-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      (referralStats?.activereferrals || 0) > 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>Referral Program</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    (referralStats?.activereferrals || 0) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {(referralStats?.activereferrals || 0) > 0 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Referral System Cards */}
            {/* Auto Inviter */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Referral Tools</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
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
                      (walletBalances?.primary.bpiToken.balance || 0) < 0.5
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
                {(walletBalances?.primary.bpiToken.balance || 0) < 0.5 && (
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
            </div>

            {/* Referral Link */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Share Link</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
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
            </div>

            {/* Latest Invites */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Recent Referrals</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Latest Invites
              </h3>
              <div className="space-y-3">
                {/* Real referral data or empty state */}
                {recentReferralsData?.referrals && recentReferralsData.referrals.length > 0 ? (
                  <>
                    {recentReferralsData.referrals.slice(0, 2).map((referral: any) => {
                      const referredName = referral.referredUserName || 'Unknown User';
                      const joinedDate = new Date(referral.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      const status = referral.status === 'active' ? 'Active' : 'Pending';
                      
                      return (
                        <div key={referral.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-r from-bpi-primary to-bpi-secondary">
                            {referral.image ? (
                              <Image 
                                src={referral.image} 
                                alt={referredName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">{referredName.charAt(0).toUpperCase()}</span>
                            )}
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
                    
                    <Button 
                      variant="outline" 
                      className="w-full text-sm"
                      onClick={() => setShowReferralModal(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View All Referrals
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      You do not currently have any referrals. Use the auto-invite form to send out invites to your contacts or copy your ref link and share with your friends.
                    </p>
                  </div>
                )}
              </div>
            </div>

            </CollapsibleSection>
          </div>

          {/* Dashboard Content Wrapper - Conditional rendering based on profile completion */}
          {isProfileComplete ? (
            <>
          {/* Center Content */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 h-full">
            <CollapsibleSection
              title="Dashboard Sections"
              icon={<Grid3x3 className="w-5 h-5" />}
              defaultExpanded={false}
              storageKey="center-column-sections"
              badge={dashboardSectionsBadge}
              badgeOnMobileOnly
              mobileOnly
            >
            <div className="flex flex-col gap-3 mb-3">
              <Card className="p-4 sm:p-5 shadow-lg dark:shadow-none bg-white dark:bg-bpi-dark-card">
                <h2 className="text-lg font-semibold text-foreground">Dashboard Overview</h2>
              </Card>

            {/* Account Overview Section - Collapsible on Mobile */}
            <CollapsibleSection
              title="Account Overview"
              icon={<CircleDollarSign className="w-5 h-5" />}
              defaultExpanded={false}
              storageKey="account-overview"
              badge={accountOverviewBadge}
              badgeOnMobileOnly
              mobileOnly
            >
            {/* Hero - Portfolio Value Card */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-bpi-primary to-amber-800 text-white border-0 shadow-xl">
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
                  <h2 className="text-3xl font-bold mb-1">
                    {formatBalance(dashboardData?.portfolio.totalValue || 0)}
                  </h2>
                  {/* Wallet Breakdown */}
                  <div className="text-white/70 text-xs mb-2">
                    {showBalances && dashboardData?.wallets && (
                      <span>
                        (Main {formatAmount(dashboardData.wallets.primary.main.balance)} • 
                        Palliative {formatAmount((dashboardData.wallets as any).community?.[0]?.balance || 0)} • 
                        BPT {dashboardData.wallets.primary.bpiToken.balance.toFixed(2)} ({formatAmount(dashboardData.wallets.primary.bpiToken.balanceInNaira)}))
                      </span>
                    )}
                    {!showBalances && <span>(••••)</span>}
                  </div>
                  {/* 24h Change */}
                  <div className="flex items-center gap-2">
                    {portfolio24hChange.change > 0 ? (
                      <div className="flex items-center gap-1 text-green-100">
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          +{formatBalance(portfolio24hChange.change)} ({portfolio24hChange.percentage.toFixed(2)}%)
                        </span>
                      </div>
                    ) : portfolio24hChange.change < 0 ? (
                      <div className="flex items-center gap-1 text-red-100">
                        <ArrowDown className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {formatBalance(portfolio24hChange.change)} ({portfolio24hChange.percentage.toFixed(2)}%)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-white/80">
                        <span className="text-sm font-medium">{formatBalance(0)} (0.00%)</span>
                      </div>
                    )}
                    <span className="text-white/70 text-xs">24h</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CircleDollarSign className="w-7 h-7" />
                </div>
              </div>
              
              {/* Quick Portfolio Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 py-4 border-t border-white/20">
                <div className="text-center p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                  <p className="text-white/70 text-xs mb-1">BPI Token</p>
                  <p className="font-semibold text-sm">{showBalances ? `${dashboardData?.wallets.primary.bpiToken.balance.toFixed(2) || '0'} BPT` : '••••'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                  <p className="text-white/70 text-xs mb-1">Main</p>
                  <p className="font-semibold text-sm">{showBalances ? formatAmount(dashboardData?.wallets.primary.main.balance || 0) : `${currentCurrency?.sign || '₦'}••••`}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                  <p className="text-white/70 text-xs mb-1">Membership</p>
                  <p className="font-semibold text-sm">{showBalances ? formatAmount(dashboardData?.wallets.primary.locked.balance || 0) : `${currentCurrency?.sign || '₦'}••••`}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                  <p className="text-white/70 text-xs mb-1">Rewards</p>
                  <p className="font-semibold text-sm">{showBalances ? formatAmount(dashboardData?.wallets.primary.rewards.balance || 0) : `${currentCurrency?.sign || '₦'}••••`}</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/20">
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="flex flex-col items-center gap-1 p-2 bg-bpi-primary hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-xs font-medium">Deposit</span>
                </button>
                <button 
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="flex flex-col items-center gap-1 p-2 bg-bpi-secondary/50 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Withdraw</span>
                </button>
                <button 
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex flex-col items-center gap-1 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium">Transfer</span>
                </button>
              </div>
            </Card>
            </CollapsibleSection>

            {/* Wallets Section - Collapsible on Mobile */}
            <CollapsibleSection
              title="My Wallets"
              icon={<Wallet className="w-5 h-5" />}
              defaultExpanded={true}
              storageKey="wallets"
              badge={myWalletsBadge}
              badgeOnMobileOnly
              mobileOnly
            >
            {/* Primary Wallets Grid */}
            <div id="wallets-section" className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* BPI Token */}
              <Card 
                className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/10 dark:to-yellow-800/5 cursor-pointer"
                onClick={() => setIsBptTimelineOpen(true)}
              >
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
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500 mb-1">
                  {showBalances ? `${dashboardData?.wallets.primary.bpiToken.balance.toFixed(2) || '0'} BPT` : '••••••'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Click to view timeline</span>
                </div>
              </Card>

              {/* Main Wallet */}
              <Card 
                className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-bpi-primary bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 cursor-pointer"
                onClick={() => setIsWalletTimelineOpen(true)}
              >
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
                <p className="text-xl font-bold text-bpi-primary mb-1">
                  {formatBalance(dashboardData?.wallets.primary.main.balance || 0)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Click to view timeline</span>
                </div>
              </Card>

              {/* Palliative Wallet */}
              <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-700 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-700/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-700 dark:text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">Palliative Wallet</h3>
                <p className="text-xl font-bold text-green-700 dark:text-green-600 mb-1">
                  {formatBalance(dashboardData?.wallets.community?.find((w: any) => w.id === 'palliative')?.balance || 0)}
                </p>
                <button
                  onClick={() => setShowPalliativeDetails(!showPalliativeDetails)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  <span>Details</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPalliativeDetails ? 'rotate-180' : ''}`} />
                </button>
                {showPalliativeDetails && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-green-800/50">
                    <p className="text-xs text-muted-foreground">
                      Palliative Support fund
                    </p>
                  </div>
                )}
              </Card>

              {/* Taxes */}
              <Card 
                className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 cursor-pointer bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/5"
                onClick={() => setShowTaxesModal(true)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">Taxes</h3>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  {formatBalance(totalTaxes || 0)}
                </p>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
                  <span>View History</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </Card>
            </div>

            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Wallet Overview</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />

            {/* Categorized Wallets Tabs */}
            <Card className="p-4 sm:p-5 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-foreground">All Wallets</h3>
                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  <button
                    onClick={() => setActiveWalletTab('operational')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors w-full sm:w-auto text-center ${
                      activeWalletTab === 'operational'
                        ? 'bg-bpi-primary text-white'
                        : 'bg-gray-100 dark:bg-bpi-dark-accent text-muted-foreground hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/70'
                    }`}
                  >
                    Operational
                  </button>
                  <button
                    onClick={() => setActiveWalletTab('investment')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors w-full sm:w-auto text-center ${
                      activeWalletTab === 'investment'
                        ? 'bg-bpi-primary text-white'
                        : 'bg-gray-100 dark:bg-bpi-dark-accent text-muted-foreground hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/70'
                    }`}
                  >
                    Membership
                  </button>
                  <button
                    onClick={() => setActiveWalletTab('community')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors w-full sm:w-auto text-center ${
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
                        className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/10 dark:to-emerald-800/5 rounded-lg hover:shadow-md transition-all border border-emerald-200/50 dark:border-emerald-800/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
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
                      className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/5 rounded-lg hover:shadow-md transition-all border border-purple-200/50 dark:border-purple-800/20"
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
                      className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/5 rounded-lg hover:shadow-md transition-all border border-green-200/50 dark:border-green-800/20"
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

              <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">Active Package Summary</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />

            {/* Palliative System Section */}
            {userProfile && userDetails?.activeMembership ? (
              userProfile.palliativeActivated ? (
                <ActivatedPalliativeCard />
              ) : (
                <PalliativeJourneyCard 
                  onActivateClick={() => setIsPalliativeActivationModalOpen(true)}
                  membershipName={userDetails.activeMembership.name}
                  membershipAmount={userDetails.activeMembership.price}
                />
              )
            ) : null}

          {/* Membership Status & Upgrade Prompt */}
          {(() => {
            // Get user's active membership from dashboard data
            const activeMembership = dashboardData?.packages.active?.[0];
            
            if (!activeMembership) return null;

            // Define package hierarchy (should match your actual packages)
            const packageHierarchy = [
              "Associate", "Regular", "Regular Plus", "Platinum", "Gold", "Diamond"
            ];
            
            const currentPackageName = activeMembership.packageName;
            const currentIndex = packageHierarchy.findIndex(name => 
              currentPackageName.toLowerCase().includes(name.toLowerCase())
            );
            
            // Determine next package
            const nextPackage = currentIndex >= 0 && currentIndex < packageHierarchy.length - 1
              ? packageHierarchy[currentIndex + 1]
              : null;
            
            const isRegularPlus = currentPackageName.toLowerCase().includes("regular plus");
            const isBelowRegularPlus = currentIndex < packageHierarchy.indexOf("Regular Plus");
            const isAboveRegularPlus = currentIndex > packageHierarchy.indexOf("Regular Plus");
            const isHighest = currentIndex === packageHierarchy.length - 1;

            // Don't show if user is on highest plan
            if (isHighest) return null;

            let bgColor = "";
            let message = "";
            let buttonText = "";

            if (isBelowRegularPlus) {
              bgColor = "bg-gradient-to-r from-red-500 to-rose-600";
              message = "Upgrade to Regular Plus or higher to unlock more rewards and participate in the Leadership Pool!";
              buttonText = "Upgrade Membership Plan";
            } else if (isRegularPlus) {
              bgColor = "bg-gradient-to-r from-yellow-500 to-amber-600";
              message = "You're doing great! Go higher for even more rewards";
              buttonText = "Go Higher for More Rewards";
            } else if (isAboveRegularPlus && nextPackage) {
              bgColor = "bg-gradient-to-r from-green-500 to-emerald-600";
              message = "Keep climbing!";
              buttonText = `Go Farther with ${nextPackage}`;
            }

            return (
              <Card className={`p-6 ${bgColor} text-white mt-4 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      {isBelowRegularPlus ? "🚀 Unlock More Benefits" : 
                       isRegularPlus ? "⭐ You're on the Right Track!" : 
                       "🏆 Keep Rising to the Top!"}
                    </h3>
                    <p className="text-white/90 text-sm mb-4">{message}</p>
                    <Button 
                      className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                      size="lg"
                      onClick={() => {
                        setIsMembershipNavigating(true);
                        router.push('/membership');
                      }}
                      disabled={isMembershipNavigating}
                    >
                      {isMembershipNavigating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        buttonText
                      )}
                    </Button>
                  </div>
                  <div className="hidden md:block ml-6">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })()}

          </div>
          </CollapsibleSection>

            {/* YouTube Channel Section */}
           
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h2 className="text-lg font-semibold text-foreground mb-3">YouTube Builder</h2>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-6 bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">YouTube Channel</h3>
                    <p className="text-red-100 text-sm">Share with BPI Community</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-white/20 hover:bg-white/30 border-0"
                  onClick={() => setIsSubmitChannelModalOpen(true)}
                >
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
                <Button 
                  className="w-full bg-white/20 hover:bg-white/30 border-0"
                  onClick={() => setIsBrowseChannelsModalOpen(true)}
                >
                  Explore
                </Button>
              </Card>
            </div>
            </div>

            {/* BPI Services Grid */}
            <CollapsibleSection
              title="Community Features"
              icon={<Users className="w-5 h-5" />}
              defaultExpanded={false}
              storageKey="community-features"
              badge={communityFeaturesBadge}
              badgeOnMobileOnly
              mobileOnly
            >
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Community Features</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[460px] overflow-y-auto pr-1">
              {/* BPI Calculator Card - Admin Controlled */}
              {(adminSettings?.enableBpiCalculator === true || adminSettings?.enableBpiCalculator === undefined) && (
                <CommunityCard
                  title="BPI Calculator"
                  description="Calculate your potential earnings"
                  icon={Calculator}
                  state="active"
                  onClick={() => setIsCalculatorModalOpen(true)}
                />
              )}

              {/* Leadership Pool Card - Only show if enabled by admin */}
              {leadershipPoolSettings?.enabled && (
                <CommunityCard
                  title="Leadership Pool"
                  description="Join our elite program"
                  icon={Award}
                  state={leadershipProgress?.isQualified ? "active" : (leadershipProgress?.currentProgress.isRegularPlus ? "in-progress" : "locked")}
                  progress={Math.max(
                    leadershipProgress?.currentProgress.option1.percentage || 0,
                    leadershipProgress?.currentProgress.option2.percentage || 0
                  )}
                  badge={leadershipProgress?.isQualified 
                    ? "Qualified" 
                    : `${Math.max(
                        leadershipProgress?.currentProgress.option1.percentage || 0,
                        leadershipProgress?.currentProgress.option2.percentage || 0
                      ).toFixed(0)}% Complete`
                  }
                    onClick={() => setIsLeadershipPoolModalOpen(true)}
                />
              )}

              {/* EPC & EPP Card - Admin Controlled */}
              {adminSettings?.enableEpcEpp === true && (
                <CommunityCard
                  title="EPC & EPP"
                  description="Global promotion system"
                  icon={TrendingUpIcon}
                  state="active"
                  onClick={() => setIsEpcEppModalOpen(true)}
                />
              )}

              {/* Solar Assessment Card - Admin Controlled */}
              {adminSettings?.enableSolarAssessment === true && (
                <CommunityCard
                  title="Solar Assessment"
                  description="Energy consulting services"
                  icon={SolarIcon}
                  state="active"
                  onClick={() => setIsSolarAssessmentModalOpen(true)}
                />
              )}

              {/* Digital Farm Card - Admin Controlled */}
              {adminSettings?.enableDigitalFarm === true && (
                <CommunityCard
                  title="Digital Farm"
                  description="Virtual agriculture platform"
                  icon={Leaf}
                  state="active"
                  onClick={() => setIsDigitalFarmModalOpen(true)}
                />
              )}

              {/* Training Center Card - Admin Controlled */}
              {(adminSettings?.enableTrainingCenter === true || adminSettings?.enableTrainingCenter === undefined) && (
                <CommunityCard
                  title="Training Center"
                  description="Skill development courses"
                  icon={GraduationCap}
                  state="active"
                  onClick={() => setIsTrainingCenterModalOpen(true)}
                />
              )}

              {/* Promotional Materials Card - Admin Controlled */}
              {(adminSettings?.enablePromotionalMaterials === true || adminSettings?.enablePromotionalMaterials === undefined) && (
                <CommunityCard
                  title="Promotional Materials"
                  description="Download marketing assets"
                  icon={Download}
                  state="active"
                  badge="24 New"
                  onClick={() => setIsPromotionalMaterialsModalOpen(true)}
                />
              )}

              {/* Latest Updates Card - Admin Controlled */}
              {(adminSettings?.enableLatestUpdates === true || adminSettings?.enableLatestUpdates === undefined) && (
                <CommunityCard
                  title="Latest Updates"
                  description="Company news & announcements"
                  icon={Megaphone}
                  state="new"
                  badge={unreadUpdatesCount > 0 ? `${unreadUpdatesCount} New` : "New"}
                  onClick={() => setIsUpdatesModalOpen(true)}
                />
              )}

              {/* Best Deals Card - Admin Controlled */}
              {adminSettings?.enableBestDeals === true && (
                <CommunityCard
                  title="Best Deals"
                  description="Exclusive offers & promotions"
                  icon={Sparkles}
                  state="active"
                  badge="5 Active"
                  onClick={() => setIsDealsModalOpen(true)}
                />
              )}
            </div>
            </div>
            </CollapsibleSection>
            </div>
          </CollapsibleSection>
        </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full">
            <CollapsibleSection
              title="Alerts & Insights"
              icon={<Bell className="w-5 h-5" />}
              defaultExpanded={false}
              storageKey="right-column-sections"
              badge={alertsBadgeCount}
              badgeOnMobileOnly
              mobileOnly
            >
            
            {/* Smart Notifications & Alerts */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
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
                  <div 
                    onClick={() => setShowEmailVerificationDialog(true)}
                    className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Verify Your Email
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
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

              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-bpi-dark-accent">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-600 dark:text-orange-500" />
                    Recent Notifications
                  </h4>
                  <button
                    onClick={() => setShowNotificationsModal(true)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {isLoadingNotifications && (
                  <div className="p-3 text-sm text-muted-foreground">Loading notifications...</div>
                )}

                {!isLoadingNotifications && notificationsError && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400">
                    Failed to load notifications.
                  </div>
                )}

                {!isLoadingNotifications && !notificationsError && (!notifications || notifications.length === 0) && (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                )}

                {!isLoadingNotifications && !notificationsError && notifications && notifications.length > 0 && (
                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setShowNotificationsModal(true);
                        }}
                        className="w-full text-left flex gap-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl hover:shadow-md transition-all hover:scale-[1.02]"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-foreground text-sm mb-1">{n.title}</h5>
                          <p className="text-xs text-muted-foreground mb-2">{n.message}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-bpi-primary rounded-full mt-2 flex-shrink-0"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            </div>

             {/* Announcement (Community) - moved here from second column */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="text-base font-semibold text-foreground mb-3">Community Updates</h3>
              <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            {showAnnouncement && (
              <div className={`my-6 transform transition-all duration-300 ${isClosing ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className="relative bg-bpi-gradient-light dark:bg-bpi-gradient-dark text-foreground dark:text-bpi-dark-text rounded-2xl shadow-lg p-6 border border-bpi-border dark:border-bpi-dark-accent">
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 dark:bg-green-800/30 text-foreground hover:opacity-90"
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
                  <p className="mb-2">Hello {session?.user?.name?.split(' ')[0] || 'Member'}, Trust you are well!</p>
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
            </div>


             <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
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
                              {transaction.type === 'CONVERT_TO_CONTACT' || transaction.type.includes('REFERRAL_BPT_L') ? 
                                `${transaction.amount} BPT` :
                                transaction.currency === 'BPT' ? 
                                `${transaction.amount.toFixed(8)} BPT` :
                                formatAmount(transaction.amount)
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
                    
                    <Button 
                      variant="outline" 
                      className="w-full text-sm mt-4"
                      onClick={() => {
                        setIsNavigating(true);
                        router.push('/transactions');
                      }}
                      disabled={isNavigating}
                    >
                      {isNavigating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          View All Transactions
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-center">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium mb-1">
                      No Recent Transactions
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Your transaction history will appear here once you start making transfers, referrals, or package activations.
                    </p>
                  </div>
                )}
              </div>
            </Card>
            </div>
               {/* BPI Investment deals */}
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
              <h3 className="font-semibold text-foreground mb-4">BPI Investment Deals</h3>
              
              {/* Carousel Container */}
              <div 
                className="relative overflow-hidden rounded-xl"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
              >
                {/* Deal Card */}
                <div 
                  className="transition-all duration-500 ease-in-out cursor-pointer group"
                  onClick={() => handleDealClick(investmentDeals[currentDealIndex])}
                >
                  <div 
                    className="relative overflow-hidden p-6 rounded-xl border-2 hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${investmentDeals[currentDealIndex].color}25 0%, ${investmentDeals[currentDealIndex].color}45 50%, ${investmentDeals[currentDealIndex].color}25 100%)`,
                      borderColor: `${investmentDeals[currentDealIndex].color}60`
                    }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${investmentDeals[currentDealIndex].color}40, ${investmentDeals[currentDealIndex].color}60)`,
                        boxShadow: `0 4px 15px ${investmentDeals[currentDealIndex].color}30`
                      }}
                    >
                      {(() => {
                        const IconComponent = investmentDeals[currentDealIndex].icon;
                        return (
                          <IconComponent 
                            className="w-8 h-8"
                            style={{ color: investmentDeals[currentDealIndex].color }}
                          />
                        );
                      })()}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="relative z-10 flex justify-center mb-3">
                      <span 
                        className="text-xs font-bold px-4 py-1.5 rounded-full shadow-md backdrop-blur-sm"
                        style={{ 
                          background: `linear-gradient(90deg, ${investmentDeals[currentDealIndex].color}90, ${investmentDeals[currentDealIndex].color})`,
                          color: 'white',
                          boxShadow: `0 4px 12px ${investmentDeals[currentDealIndex].color}40`
                        }}
                      >
                        {investmentDeals[currentDealIndex].category}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h4 className="relative z-10 text-center font-bold text-lg text-foreground mb-3 group-hover:text-opacity-90 transition-opacity">
                      {investmentDeals[currentDealIndex].title}
                    </h4>
                    
                    {/* Description */}
                    <p className="text-center text-sm text-muted-foreground leading-relaxed min-h-[60px]">
                      {investmentDeals[currentDealIndex].description}
                    </p>
                    
                    {/* Learn More Link */}
                    <div 
                      className="relative z-10 flex items-center justify-center gap-2 mt-4 text-sm font-bold px-4 py-2 rounded-lg transition-all duration-300 group-hover:shadow-lg"
                      style={{ 
                        color: investmentDeals[currentDealIndex].color,
                        background: `linear-gradient(90deg, transparent, ${investmentDeals[currentDealIndex].color}10, transparent)`
                      }}
                    >
                      <span>Learn More</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                {/* Carousel Controls */}
                <div className="flex items-center justify-between mt-4 px-2">
                  {/* Previous Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevDeal(); }}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-bpi-dark-accent hover:bg-gray-300 dark:hover:bg-bpi-dark-accent/80 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-white" />
                  </button>
                  
                  {/* Pagination Dots */}
                  <div className="flex items-center gap-2">
                    {investmentDeals.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); setCurrentDealIndex(index); }}
                        className={`transition-all duration-300 rounded-full ${
                          index === currentDealIndex 
                            ? 'w-8 h-2' 
                            : 'w-2 h-2'
                        }`}
                        style={{
                          backgroundColor: index === currentDealIndex 
                            ? investmentDeals[currentDealIndex].color 
                            : '#D1D5DB'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Play/Pause & Next */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsCarouselPaused(!isCarouselPaused); }}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-bpi-dark-accent hover:bg-gray-300 dark:hover:bg-bpi-dark-accent/80 flex items-center justify-center transition-colors"
                    >
                      {isCarouselPaused ? (
                        <Play className="w-4 h-4 text-gray-700 dark:text-white" />
                      ) : (
                        <Pause className="w-4 h-4 text-gray-700 dark:text-white" />
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleNextDeal(); }}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-bpi-dark-accent hover:bg-gray-300 dark:hover:bg-bpi-dark-accent/80 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700 dark:text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

           

            {/* Student Palliative Card - Hidden for now */}
            {false && (
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
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
            )}

            {/* BPI Ticket Card - Hidden for now */}
            {false && (
            <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3">
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
            )}

          </CollapsibleSection>
        </div>
      </>
    ) : null}

      {/* Close main grid before new rows */}
      </div>

      {/* Separator before stats row (aligned with first column / referrals) */}
      <div className="grid grid-cols-12 gap-3 lg:gap-4 items-stretch col-span-12 mt-4">
        <div className="hidden lg:block lg:col-span-1" />
        <div className="col-span-12 lg:col-span-11">
          <hr className="border-gray-200 dark:border-bpi-dark-accent" />
        </div>
      </div>

      {/* Balanced row for Community Statistics (2 columns) and Third-Party Opportunities (1 column) */}
      <div className="col-span-12 grid grid-cols-12 gap-3 lg:gap-4 items-stretch">
        <div className="hidden lg:block lg:col-span-1" />
        <div className="col-span-12 lg:col-span-7 flex">
          <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3 w-full flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground">Community Statistics</h3>
                <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-100/60 dark:border-emerald-800/60">
                  Active Rate: {communityStats?.platform.activeRate || 0}%
                </span>
                <span className={`px-2 py-1 text-[11px] font-semibold rounded-full border ${growthDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800/60' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/60'}`}>
                  {growthDelta >= 0 ? '+' : ''}{growthDelta} vs prev day ({growthPct.toFixed(1)}%)
                </span>
                {topRegion && (
                  <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60">
                    Top Region: {topRegion}
                  </span>
                )}
                {topReferrer && (
                  <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800/60">
                    Top Referrer: {topReferrer}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {(dailySignups.slice(-8) || []).map((d, idx) => {
                    const maxVal = Math.max(...(dailySignups.slice(-8).map(ds => ds.signups)), 1);
                    const h = Math.max(6, (d.signups / maxVal) * 24);
                    return (
                      <span key={idx} className="inline-block w-1.5 rounded-sm bg-emerald-500/70" style={{ height: `${h}px` }} title={`${d.date}: ${d.signups} signups`} />
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowCommunityStatsModal(true)}
                  className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View Details
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-xs text-muted-foreground">Total Network</p>
                <p className="text-2xl font-bold text-foreground">{communityStats?.platform.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                <p className="text-xs text-muted-foreground">Level 1</p>
                <p className="text-2xl font-bold text-foreground">{communityStats?.levels.level1 || 0}</p>
              </div>
            </div>

            {/* Today snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
              {todayMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                const positive = (metric.delta || 0) >= 0;
                return (
                  <div
                    key={metric.label}
                    className="p-3 rounded-xl border border-gray-200 dark:border-bpi-dark-accent bg-white/80 dark:bg-bpi-dark-card/80 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <p className="text-xl font-semibold text-foreground">{metric.value}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-700" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold">
                      {positive ? (
                        <ArrowUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={positive ? 'text-green-700' : 'text-red-700'}>
                        {positive ? '+' : ''}{metric.delta || 0}
                      </span>
                      <span className="text-muted-foreground">vs prior</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Middle analytics strip */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
              <div className="hidden md:block bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 border border-gray-200 dark:border-bpi-dark-accent h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">Top Regions & Referrers</p>
                  <Flag className="w-4 h-4 text-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Regions</p>
                    {(regionBreakdown.length ? regionBreakdown : [{ name: 'No data', count: 0, share: 0 }]).map((region: any, idx: number) => (
                      <div key={`${region.name}-${idx}`} className="p-2 rounded-lg border border-gray-200 dark:border-bpi-dark-accent/70 bg-white dark:bg-bpi-dark-card/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{region.name}</span>
                          <span className="text-muted-foreground">{Math.round(region.share)}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(100, Math.max(0, region.share))}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground">{region.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Referrers</p>
                    {(referrerBreakdown.length ? referrerBreakdown : [{ name: 'No data', count: 0, share: 0 }]).map((ref: any, idx: number) => (
                      <div key={`${ref.name}-${idx}`} className="p-2 rounded-lg border border-gray-200 dark:border-bpi-dark-accent/70 bg-white dark:bg-bpi-dark-card/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{ref.name}</span>
                          <span className="text-muted-foreground">{Math.round(ref.share)}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, Math.max(0, ref.share))}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground">{ref.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden md:block bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 border border-gray-200 dark:border-bpi-dark-accent h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">Referral Funnel</p>
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {funnelSteps.map((step, idx) => {
                    const base = funnelSteps[0]?.value || 1;
                    const pct = base ? (step.value / base) * 100 : 0;
                    return (
                      <div key={step.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{step.label}</span>
                          <span className="text-muted-foreground">{step.value}</span>
                        </div>
                        <div className="h-3 bg-white dark:bg-bpi-dark-card rounded-full border border-gray-200 dark:border-bpi-dark-accent overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${step.color}`}
                            style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                          />
                        </div>
                        {idx < funnelSteps.length - 1 && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" />
                            <span>{step.value === 0 ? 'No flow yet' : `${Math.max(0, Math.round(pct))}% carry-over`}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:block bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 border border-gray-200 dark:border-bpi-dark-accent h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">7-Day Signals</p>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-foreground">Signups</span>
                      <span className="text-muted-foreground">Max {Math.max(...signupSeries.map(s => s.signups || 0), 0)}</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {((signupSeries.length ? signupSeries : [{ date: '', signups: 0 }]) as { date?: string; signups: number }[]).map((day, idx) => {
                        const baseSeries = signupSeries.length ? signupSeries : [{ date: '', signups: 0 }];
                        const maxVal = Math.max(...baseSeries.map(s => s.signups || 0), 1);
                        const height = maxVal ? (day.signups / maxVal) * 100 : 0;
                        return (
                          <div key={`signup-${idx}`} className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-sm" style={{ height: `${Math.max(8, height)}%` }} title={`${day.date || ''}: ${day.signups || 0} signups`} />
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-medium text-foreground">Active rate</span>
                      <span className="text-muted-foreground">{Math.min(...activeRateSeries) || 0}% - {Math.max(...activeRateSeries) || 0}%</span>
                    </div>
                    <div className="flex items-center gap-2 h-10">
                      {(activeRateSeries.length ? activeRateSeries : [0]).map((rate: number, idx: number) => {
                        const maxVal = Math.max(...(activeRateSeries.length ? activeRateSeries : [1]));
                        return (
                          <div key={`rate-${idx}`} className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-bpi-dark-accent overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${maxVal ? (rate / maxVal) * 100 : 0}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deeper breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
              <div className="hidden md:block bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 border border-gray-200 dark:border-bpi-dark-accent h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">Level distribution</p>
                  <Grid3x3 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {[{ label: 'L1', value: communityStats?.levels.level1 || 0, change: cs?.levelsDelta?.level1 || 0, color: 'from-orange-500 to-yellow-500' }, { label: 'L2', value: communityStats?.levels.level2 || 0, change: cs?.levelsDelta?.level2 || 0, color: 'from-emerald-500 to-lime-500' }, { label: 'L3', value: communityStats?.levels.level3 || 0, change: cs?.levelsDelta?.level3 || 0, color: 'from-blue-500 to-cyan-500' }, { label: 'L4', value: communityStats?.levels.level4 || 0, change: cs?.levelsDelta?.level4 || 0, color: 'from-purple-500 to-pink-500' }].map((level) => {
                    const total = (communityStats?.levels.level1 || 0) + (communityStats?.levels.level2 || 0) + (communityStats?.levels.level3 || 0) + (communityStats?.levels.level4 || 0);
                    const pct = total ? (level.value / total) * 100 : 0;
                    const positive = (level.change || 0) >= 0;
                    return (
                      <div key={level.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{level.label}</span>
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${positive ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800/60' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/60'}`}>
                            {positive ? '+' : ''}{level.change || 0}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-white dark:bg-bpi-dark-card rounded-full border border-gray-200 dark:border-bpi-dark-accent overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${level.color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground w-10 text-right">{level.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 border border-gray-200 dark:border-bpi-dark-accent h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground">Recent activity</p>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  {(activityFeed.length ? activityFeed : [{ referredUserName: 'No recent activity', createdAt: new Date().toISOString(), status: 'Pending' }]).map((item: any, idx: number) => {
                    const name = item?.name || item?.referredUserName || item?.email || `Member ${idx + 1}`;
                    const region = item?.region || item?.country || item?.location || topRegion || 'N/A';
                    const status = (item?.status || 'Joined').toString();
                    const joined = item?.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';
                    const isActive = status.toLowerCase().includes('active');
                    return (
                      <div key={`${name}-${idx}`} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-bpi-dark-accent">
                        <div className="w-8 h-8 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 text-[11px] font-bold text-emerald-700">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isActive ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800/60' : 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/60'}`}>
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{region}</span>
                            <span>{joined}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Three Charts in Horizontal Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
              {/* Chart 1: Level Distribution Bar */}
              <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 h-full">
                <p className="text-xs font-medium text-muted-foreground mb-3">Referral Levels</p>
                <div className="space-y-2">
                  {[
                    { label: 'L1', value: communityStats?.levels.level1 || 0, color: 'from-orange-500 to-yellow-500' },
                    { label: 'L2', value: communityStats?.levels.level2 || 0, color: 'from-emerald-500 to-lime-500' },
                    { label: 'L3', value: communityStats?.levels.level3 || 0, color: 'from-green-500 to-emerald-500' },
                    { label: 'L4', value: communityStats?.levels.level4 || 0, color: 'from-purple-500 to-pink-500' },
                  ].map((level) => {
                    const total = (communityStats?.levels.level1 || 0) + (communityStats?.levels.level2 || 0) + (communityStats?.levels.level3 || 0) + (communityStats?.levels.level4 || 0);
                    const percentage = total > 0 ? (level.value / total) * 100 : 0;
                    return (
                      <div key={level.label} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground w-6">{level.label}</span>
                        <div className="flex-1 h-4 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${level.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground w-8 text-right">{level.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Pie Chart - Active vs Inactive */}
              <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 h-full">
                <p className="text-xs font-medium text-muted-foreground mb-3">Network Overview</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-bpi-dark-accent" />
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="16" 
                        fill="none" 
                        stroke="url(#gradient-pie)" 
                        strokeWidth="4" 
                        strokeDasharray={`${communityStats?.platform.activeRate || 0} 100`}
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="gradient-pie">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground">{communityStats?.platform.activeRate || 0}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Active</span>
                      <span className="font-medium text-green-600">{communityStats?.platform.activeMembers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Palliative</span>
                      <span className="font-medium text-orange-600">{communityStats?.platform.palliativeActiveUsers || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 3: Column Chart - 7 Day Growth */}
              <div className="bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-xl p-3 h-full">
                <p className="text-xs font-medium text-muted-foreground mb-3">Growth Trend</p>
                <div className="flex items-end justify-between h-16 gap-1">
                  {(communityStats?.dailySignups || []).map((day, i) => {
                    const maxValue = Math.max(...(communityStats?.dailySignups || []).map(d => d.signups), 1);
                    const height = (day.signups / maxValue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t transition-all duration-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.date}: ${day.signups} signups`}
                        />
                        <span className="text-[9px] text-muted-foreground">{day.date.substring(0, 1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex">
          <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-3 sm:p-6 shadow-lg dark:shadow-none mb-3 w-full flex flex-col">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center justify-between">
              <span>Third-Party Opportunities</span>
              {summary && summary.pendingPlatforms > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {summary.pendingPlatforms} Pending
                </span>
              )}
            </h2>
            <hr className="border-gray-200 dark:border-bpi-dark-accent mb-4" />
            <Card className="p-5 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl mb-4 relative z-10 flex-1 flex flex-col gap-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Team Growth Platforms</h3>
                <p className="text-sm text-muted-foreground">
                  Grow your network across multiple platforms together
                </p>
              </div>

              {summary ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-xs text-muted-foreground mb-1">Completed</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {summary.completedPlatforms}/{summary.totalPlatforms}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="text-xs text-muted-foreground mb-1">Team Registered</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {summary.totalRegistrations}/{summary.totalDirectDownlines}
                      </div>
                    </div>
                  </div>

                  {summary.pendingPlatforms > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-orange-700 dark:text-orange-300">
                          {summary.pendingPlatforms} platform{summary.pendingPlatforms > 1 ? 's' : ''} awaiting your registration
                        </span>
                      </div>
                    </div>
                  )}

                  {!availablePlatforms || availablePlatforms.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 dark:bg-bpi-dark-accent/30 rounded-lg border border-gray-200 dark:border-bpi-dark-accent">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">No opportunities available</p>
                      <p className="text-xs text-muted-foreground">
                        Your upline hasn't shared any platform links yet
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setIsThirdPartyModalOpen(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Manage Opportunities
                    </Button>
                  )}

                  <hr className="border-gray-200 dark:border-bpi-dark-accent my-4" />
                  <div className="relative w-full aspect-square overflow-hidden rounded-xl">
                    <Image
                      src="/bpt.jpeg"
                      alt="BPT placeholder"
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority={false}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Loading platforms...</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Separator before blog section */}
      <div className="col-span-12 mt-4 grid grid-cols-12 gap-3 lg:gap-4 items-stretch">
        <div className="hidden lg:block lg:col-span-1" />
        <div className="col-span-12 lg:col-span-11">
          <hr className="border-gray-200 dark:border-bpi-dark-accent" />
        </div>
      </div>

      {/* Community Blog / Latest Posts - Aligned with first column (referrals) */}
      <div className="col-span-12 mt-4 lg:mt-6 grid grid-cols-12 gap-3 lg:gap-4 items-stretch">
        <div className="hidden lg:block lg:col-span-1" />
        <div className="col-span-12 lg:col-span-11">
          <div className="bg-white dark:bg-bpi-dark-card rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-none border border-border/70 dark:border-bpi-dark-accent/60">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">Community Blog</p>
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">Latest From Our Blog</h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                  {blogTotal} articles
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl">Deep dives, product drops, and community wins curated for you.</p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isBlogNavPending}
              onClick={() => startBlogNav(() => router.push("/blog"))}
            >
              {isBlogNavPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  View All Posts
                </>
              )}
            </Button>
          </div>

          {blogTotal > 0 ? (
            <div className="relative">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBlogSlide((current) => (current <= 0 ? maxBlogStart : Math.max(current - blogCardsPerView, 0)))}
                  className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow hover:border-emerald-500 hover:text-emerald-700 dark:bg-bpi-dark-card dark:border-bpi-dark-accent"
                  aria-label="Previous posts"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  ref={blogCarouselRef}
                  className="grid grid-flow-col auto-cols-[90%] sm:auto-cols-[55%] lg:auto-cols-[36%] xl:auto-cols-[28%] 2xl:auto-cols-[22%] gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pr-2"
                >
                  {blogPosts.map((post: any, idx: number) => {
                    const excerpt = (post.excerpt || "").slice(0, 140) + "...";
                    const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={post.id || idx}
                        className="group snap-center flex flex-col bg-white dark:bg-bpi-dark-card rounded-2xl overflow-hidden border border-border/40 dark:border-bpi-dark-accent/40 shadow-lg hover:shadow-2xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Image Section - Top Row */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
                          <img
                            src={post.image || post.imageUrl || "/img/blog-placeholder.jpg"}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                          
                          {/* Stats Overlay on Image */}
                          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/80 text-gray-700 dark:text-white/90 backdrop-blur-sm shadow-sm">
                              <Eye className="w-3 h-3" /> {post.viewCount ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 dark:bg-black/80 text-gray-700 dark:text-white/90 backdrop-blur-sm shadow-sm">
                              <MessageCircle className="w-3 h-3" /> {(post as any)._count?.comments || 0}
                            </span>
                          </div>

                          {/* Category Badge */}
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-md">
                              {post.categories?.[0]?.name || 'Article'}
                            </span>
                          </div>
                        </div>

                        {/* Content Section - Second, Third, Fourth Rows */}
                        <div className="flex flex-col flex-1 p-4 sm:p-5">
                          {/* Title - Second Row */}
                          <h4 className="text-base sm:text-lg font-bold leading-tight line-clamp-2 text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {post.title}
                          </h4>
                          
                          {/* Author & Date - Third Row */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/50">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" /> 
                              <span className="font-medium">{post.author?.name || "BPI Team"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                            </span>
                          </div>

                          {/* Preview Text - Fourth Row */}
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                            {excerpt}
                          </p>

                          {/* Read More Button */}
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Read Article
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setBlogSlide((current) => (current >= maxBlogStart ? 0 : Math.min(current + blogCardsPerView, maxBlogStart)))}
                  className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow hover:border-emerald-500 hover:text-emerald-700 dark:bg-bpi-dark-card dark:border-bpi-dark-accent"
                  aria-label="Next posts"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {Array.from({ length: blogPageCount }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBlogSlide(Math.min(idx * blogCardsPerView, maxBlogStart))}
                      className={`h-2.5 w-6 rounded-full transition-colors ${idx === blogCurrentPage ? "bg-emerald-600" : "bg-border"}`}
                      aria-label={`Go to blog page ${idx + 1}`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">
                  Page {blogCurrentPage + 1} of {blogPageCount} • {blogTotal} posts
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                The blog is currently not available. Check back soon for exciting updates and articles from the BPI community!
              </p>
            </div>
          )}
        </div>
      </div>

      </div>
        </>
        )}
    </main>


      {/* Community Updates Modal */}
      <UpdatesModal 
        isOpen={isUpdatesModalOpen} 
        onClose={() => setIsUpdatesModalOpen(false)} 
      />
      
      <CalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
      />
      
      <DealsModal
        isOpen={isDealsModalOpen}
        onClose={() => setIsDealsModalOpen(false)}
      />
      
      <LeadershipPoolModal
        isOpen={isLeadershipPoolModalOpen}
        onClose={() => setIsLeadershipPoolModalOpen(false)}
      />
      
      <EpcEppModal
        isOpen={isEpcEppModalOpen}
        onClose={() => setIsEpcEppModalOpen(false)}
      />
      
      <SolarAssessmentModal
        isOpen={isSolarAssessmentModalOpen}
        onClose={() => setIsSolarAssessmentModalOpen(false)}
      />
      
      <TrainingCenterModal
        isOpen={isTrainingCenterModalOpen}
        onClose={() => setIsTrainingCenterModalOpen(false)}
      />
      
      <DigitalFarmModal
        isOpen={isDigitalFarmModalOpen}
        onClose={() => setIsDigitalFarmModalOpen(false)}
      />
      
      <PromotionalMaterialsModal
        isOpen={isPromotionalMaterialsModalOpen}
        onClose={() => setIsPromotionalMaterialsModalOpen(false)}
      />
      
      <SubmitChannelModal
        isOpen={isSubmitChannelModalOpen}
        onClose={() => setIsSubmitChannelModalOpen(false)}
      />
      
      <BrowseChannelsModal
        isOpen={isBrowseChannelsModalOpen}
        onClose={() => setIsBrowseChannelsModalOpen(false)}
      />
      
      <ThirdPartyOpportunitiesModal
        isOpen={isThirdPartyModalOpen}
        onClose={() => setIsThirdPartyModalOpen(false)}
      />
      
      {/* Palliative Activation Modal */}
      {userProfile && !userProfile.palliativeActivated && (
        <PalliativeActivationModal
          isOpen={isPalliativeActivationModalOpen}
          onClose={() => setIsPalliativeActivationModalOpen(false)}
          currentBalance={userProfile.palliative || 0}
          onSuccess={() => {
            // Refresh user profile data
            utils.user.getDetails.invalidate();
          }}
        />
      )}
      
      {/* Investment Deal Modal */}
      {isDealModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={closeDealModal}
          />

          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl animate-fadeIn border border-bpi-border dark:border-bpi-dark-accent"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div
              className="sticky top-0 z-20 text-white overflow-hidden"
              style={{
                background: `linear-gradient(90deg, ${selectedDeal.color}, ${selectedDeal.color}cc)`
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at top right, #ffffff, transparent 60%)`
                }}
              />

              <div className="relative p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl ring-4 ring-white/25"
                      style={{
                        background: `linear-gradient(135deg, ${selectedDeal.color}, ${selectedDeal.color}dd)`,
                        boxShadow: `0 15px 40px ${selectedDeal.color}50`
                      }}
                    >
                      <selectedDeal.icon className="w-9 h-9 text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 border border-white/20 uppercase tracking-wider">
                          {selectedDeal.category}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black leading-tight">
                        {selectedDeal.fullTitle || selectedDeal.title}
                      </h2>
                      {selectedDeal.subtitle && (
                        <p className="mt-2 text-sm md:text-base text-white/85 italic font-medium">
                          {selectedDeal.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={closeDealModal}
                    className="p-2 hover:bg-white/15 rounded-full transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
            
            {/* ICT Skills for Teens Content */}
            {selectedDeal.id === 2 && (
              <>
                {/* Overview */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">Program Overview</h3>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed pl-7">
                    {selectedDeal.details.overview}
                  </p>
                </div>
                
                {/* ICT Program Options */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">ICT Program Options</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 pl-7">
                    {selectedDeal.details.ictOptions.map((option: string, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                          background: `linear-gradient(135deg, ${selectedDeal.color}05, ${selectedDeal.color}10)`,
                          borderColor: `${selectedDeal.color}40`
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${selectedDeal.color}20, ${selectedDeal.color}30)` }}
                        >
                          <Code className="w-5 h-5" style={{ color: selectedDeal.color }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground leading-tight">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Social Media Upskill Programs */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">Social Media Upskill Programs</h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 pl-7">
                    {selectedDeal.details.socialMediaOptions.map((option: string, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-4 rounded-xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                          background: `linear-gradient(135deg, ${selectedDeal.color}05, ${selectedDeal.color}10)`,
                          borderColor: `${selectedDeal.color}40`
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${selectedDeal.color}20, ${selectedDeal.color}30)` }}
                        >
                          <Sparkles className="w-5 h-5" style={{ color: selectedDeal.color }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground leading-tight">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Program Benefits */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">Program Benefits</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 pl-7">
                    {selectedDeal.details.benefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
                        <div className="w-8 h-8 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-foreground leading-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Pricing */}
                <div 
                  className="relative overflow-hidden rounded-2xl p-10 mb-8 border-2 shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedDeal.color}15, ${selectedDeal.color}25)`,
                    borderColor: `${selectedDeal.color}50`
                  }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at top right, ${selectedDeal.color}, transparent 70%)` }} />
                  <div className="relative text-center">
                    <p className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: selectedDeal.color }}>Investment Fee</p>
                    <p 
                      className="text-5xl font-black mb-2"
                      style={{ 
                        background: `linear-gradient(135deg, ${selectedDeal.color}, ${selectedDeal.color}cc)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {formatAmount(selectedDeal.price)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">One-time payment</p>
                  </div>
                </div>
                
                {/* Payment Buttons */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Pay From Wallet */}
                  <div className="relative">
                    <Button 
                      disabled={(walletBalances?.primary.main.balance || 0) < selectedDeal.price}
                      className="w-full flex items-center justify-center gap-3 text-white font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-2px] rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ 
                        background: `linear-gradient(135deg, ${selectedDeal.color}, ${selectedDeal.color}dd)`,
                        boxShadow: `0 10px 30px ${selectedDeal.color}40`
                      }}
                    >
                      <Wallet className="w-6 h-6" />
                      Pay From Wallet
                    </Button>
                    {(walletBalances?.primary.main.balance || 0) < selectedDeal.price && (
                      <div className="mt-2 text-center">
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          Insufficient Wallet Balance
                        </p>
                        <p className="text-[10px] text-red-500 dark:text-red-500 mt-0.5">
                          Current: ₦{(walletBalances?.primary.main.balance || 0).toLocaleString()} | Required: ₦{selectedDeal.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Claim With Cashback */}
                  <div className="relative">
                    <Button 
                      disabled={(walletBalances?.primary.rewards.breakdown.cashback || 0) < selectedDeal.price}
                      className="w-full flex items-center justify-center gap-3 font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-y-[-2px] border-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B15, #F59E0B25)',
                        borderColor: '#F59E0B',
                        color: '#F59E0B'
                      }}
                    >
                      <Gift className="w-6 h-6" />
                      Claim With Cashback
                    </Button>
                    {(walletBalances?.primary.rewards.breakdown.cashback || 0) < selectedDeal.price && (
                      <div className="mt-2 text-center">
                        <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                          Insufficient Cashback Balance
                        </p>
                        <p className="text-[10px] text-red-500 dark:text-red-500 mt-0.5">
                          Current: ₦{(walletBalances?.primary.rewards.breakdown.cashback || 0).toLocaleString()} | Required: ₦{selectedDeal.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* BPI BSC & Masters Content */}
            {selectedDeal.id === 1 && (
              <>
                {/* Overview */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">About This Program</h3>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed pl-7">
                    {selectedDeal.details.overview}
                  </p>
                </div>
                
                {/* Key Features */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-1 h-8 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                    <h3 className="text-xl font-black text-foreground uppercase tracking-wide">Key Features</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 pl-7">
                    {selectedDeal.details.keyFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-5 rounded-xl border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:translate-y-[-2px]" style={{
                        background: `linear-gradient(135deg, ${selectedDeal.color}05, ${selectedDeal.color}10)`,
                        borderColor: `${selectedDeal.color}40`
                      }}>
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${selectedDeal.color}20, ${selectedDeal.color}30)` }}
                        >
                          <Award className="w-5 h-5" style={{ color: selectedDeal.color }} />
                        </div>
                        <span className="text-sm font-semibold text-foreground leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Programs in 2-column layout */}
                <div className="mb-10">
                  <div className="grid md:grid-cols-2 gap-6 pl-7">
                    {/* BSc Programs */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                        <h3 className="text-lg font-black text-foreground uppercase tracking-wide">BSc Programs</h3>
                      </div>
                      <div 
                        className="rounded-xl p-5 border-2 shadow-lg h-full"
                        style={{
                          background: `linear-gradient(135deg, ${selectedDeal.color}05, ${selectedDeal.color}10)`,
                          borderColor: `${selectedDeal.color}40`
                        }}
                      >
                        <p className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: selectedDeal.color }}>Duration: {selectedDeal.details.duration.bsc}</p>
                        <div className="space-y-3">
                          {selectedDeal.details.bscPrograms.map((program: string, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ background: selectedDeal.color }}></div>
                              <span className="text-sm font-medium text-foreground">{program}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Master Programs */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: `linear-gradient(180deg, ${selectedDeal.color}, ${selectedDeal.color}80)` }} />
                        <h3 className="text-lg font-black text-foreground uppercase tracking-wide">MSc, MBA, MCA, MA</h3>
                      </div>
                      <div 
                        className="rounded-xl p-5 border-2 shadow-lg h-full"
                        style={{
                          background: `linear-gradient(135deg, ${selectedDeal.color}05, ${selectedDeal.color}10)`,
                          borderColor: `${selectedDeal.color}40`
                        }}
                      >
                        <p className="text-xs font-bold mb-4 uppercase tracking-wider" style={{ color: selectedDeal.color }}>Duration: {selectedDeal.details.duration.masters}</p>
                        <div className="grid grid-cols-1 gap-3">
                          {selectedDeal.details.masterPrograms.map((program: string, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ background: selectedDeal.color }}></div>
                              <span className="text-sm font-medium text-foreground">{program}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mission Statement */}
                <div 
                  className="relative overflow-hidden rounded-2xl p-10 mb-10 border-2 shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedDeal.color}15, ${selectedDeal.color}25)`,
                    borderColor: `${selectedDeal.color}50`
                  }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at bottom left, ${selectedDeal.color}, transparent 70%)` }} />
                  <p className="relative text-base text-foreground italic text-center leading-relaxed font-medium max-w-4xl mx-auto">
                    {selectedDeal.details.mission}
                  </p>
                </div>
                
                {/* Application Status */}
                <div 
                  className="relative overflow-hidden rounded-2xl p-12 border-2 text-center shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B15, #F59E0B25)',
                    borderColor: '#F59E0B60'
                  }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at center, #F59E0B, transparent 70%)' }} />
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: '#F59E0B20' }}>
                      <AlertCircle className="w-14 h-14 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-4 uppercase tracking-wide">Application Pending</p>
                    <p className="text-base text-foreground/80 max-w-2xl mx-auto font-medium">
                      Applications for this program are currently under review. Please check back later for updates.
                    </p>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Details Modal */}
      <ReferralDetailsModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* Taxes Modal */}
      <TaxesModal
        isOpen={showTaxesModal}
        onClose={() => setShowTaxesModal(false)}
      />

      {/* Wallet Operation Modals */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
      
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
      />
      
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {/* Wallet Timeline Modal */}
      <WalletTimelineModal
        isOpen={isWalletTimelineOpen}
        onClose={() => setIsWalletTimelineOpen(false)}
      />

      {/* BPT Timeline Modal */}
      <BptTimelineModal
        isOpen={isBptTimelineOpen}
        onClose={() => setIsBptTimelineOpen(false)}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications || []}
        onMarkAsRead={(ids) => {
          markMultipleAsRead.mutate(
            { notificationIds: ids },
            {
              onSuccess: () => {
                toast.success(`${ids.length} notification${ids.length > 1 ? 's' : ''} marked as read`);
              },
              onError: () => {
                toast.error('Failed to mark notifications as read');
              },
            }
          );
        }}
        onArchive={(ids) => {
          archiveNotifications.mutate(
            { notificationIds: ids },
            {
              onSuccess: () => {
                toast.success(`${ids.length} notification${ids.length > 1 ? 's' : ''} archived`);
              },
              onError: () => {
                toast.error('Failed to archive notifications');
              },
            }
          );
        }}
        onDelete={(ids) => {
          deleteNotifications.mutate(
            { notificationIds: ids },
            {
              onSuccess: () => {
                toast.success(`${ids.length} notification${ids.length > 1 ? 's' : ''} deleted`);
              },
              onError: () => {
                toast.error('Failed to delete notifications');
              },
            }
          );
        }}
      />

      {/* Community Stats Modal */}
      <CommunityStatsModal
        isOpen={showCommunityStatsModal}
        onClose={() => setShowCommunityStatsModal(false)}
        userProfile={userProfile}
        communityStats={communityStats}
      />

      {/* Footer */}
      <Footer
        onModalOpen={(modalName) => {
          switch(modalName) {
            case 'calculator':
              setIsCalculatorModalOpen(true);
              break;
            case 'deals':
              setIsDealsModalOpen(true);
              break;
            case 'leadership':
              setIsLeadershipPoolModalOpen(true);
              break;
            case 'updates':
              setIsUpdatesModalOpen(true);
              break;
            case 'training':
              setIsTrainingCenterModalOpen(true);
              break;
            case 'materials':
              setIsPromotionalMaterialsModalOpen(true);
              break;
            default:
              break;
          }
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        unreadNotifications={notifications?.filter(n => !n.isRead).length || 0}
        onWalletClick={() => {
          // Scroll to wallets section
          const walletsSection = document.getElementById('wallets-section');
          if (walletsSection) {
            walletsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
    </div>
    </div>
  );
}