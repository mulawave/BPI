"use client";

import { Session } from "next-auth";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { evaluateMembershipAccess } from "@/lib/membershipAccess";
import {
  Wallet, Coins, Lock, Gift, ArrowUp, ArrowDown, RefreshCw, Settings,
  Eye, EyeOff, Users, Shield, Crown, Home, Store, LifeBuoy, Trophy,
  TrendingUp, Copy, Check, BookOpen, Calculator, ChevronRight, ChevronLeft,
  GraduationCap, Megaphone, Sparkles, Leaf, Download, Globe, Target, Pause,
  Sun as SolarIcon, Loader2, User, Award, FileText, Heart, Utensils, Home as HomeIcon,
  Car, Sun, ShieldCheck, Bell, Clock, AlertCircle, CheckCircle2, X,
  TrendingDown, Mail, Phone, MapPin, Camera, Edit, Share2, Zap, Send,
  Calendar, Radio, Activity,
} from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";
import toast from "react-hot-toast";
import KycWarningBanner from "@/components/kyc/KycWarningBanner";
import { Button } from "@/components/ui/button";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawalModal from "@/components/wallet/WithdrawalModal";
import UsdtWithdrawalHistory from "@/components/wallet/UsdtWithdrawalHistory";
import TransferModal from "@/components/wallet/TransferModal";
import WalletTimelineModal from "@/components/wallet/WalletTimelineModal";
import BptTimelineModal from "@/components/wallet/BptTimelineModal";
import NotificationsModal from "@/components/notifications/NotificationsModal";
import ReferralDetailsModal from "@/components/ReferralDetailsModal";
import TaxesModal from "@/components/TaxesModal";
import CommunityStatsModal from "@/components/community/CommunityStatsModal";
import UpdatesModal from "@/components/community/UpdatesModal";
import CalculatorModal from "@/components/community/CalculatorModal";
import DealsModal from "@/components/community/DealsModal";
import LeadershipPoolModal from "@/components/community/LeadershipPoolModal";
import EpcEppModal from "@/components/community/EpcEppModal";
import SolarAssessmentModal from "@/components/community/SolarAssessmentModal";
import TrainingCenterModal from "@/components/community/TrainingCenterModal";
import PromotionalMaterialsModal from "@/components/community/PromotionalMaterialsModal";
import DigitalFarmModal from "@/components/community/DigitalFarmModal";
import SubmitChannelModal from "@/components/community/SubmitChannelModal";
import BrowseChannelsModal from "@/components/community/BrowseChannelsModal";
import ThirdPartyOpportunitiesModal from "@/components/community/ThirdPartyOpportunitiesModal";
import ThirdPartyMatrixModal from "@/components/community/ThirdPartyMatrixModal";
import { PalliativeActivationModal } from "@/components/palliative/PalliativeActivationModal";
import { PalliativeJourneyCard } from "@/components/palliative/PalliativeJourneyCard";
import { ActivatedPalliativeCard } from "@/components/palliative/ActivatedPalliativeCard";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { CspSnapshotCard } from "@/components/dashboard/CspSnapshotCard";
import { PremiumProfileCard } from "@/components/dashboard/PremiumProfileCard";
import { SmartAlerts } from "@/components/dashboard/SmartAlerts";
import { MembershipStatusCard } from "@/components/dashboard/MembershipStatusCard";
import { CommunityStatsCard } from "@/components/dashboard/CommunityStatsCard";
import { ThirdPartyOpportunitiesCard } from "@/components/dashboard/ThirdPartyOpportunitiesCard";
import { BlogCarousel } from "@/components/dashboard/BlogCarousel";
import { checkProfileCompletion } from "@/lib/profile-completion";
import Link from "next/link";

interface PremiumDashboardProps {
  session: Session;
}

const bpiDeals = [
  { id: 2, title: 'ICT Skills for Teens', description: 'A digital skill journey from the ground up', icon: Sparkles, color: '#A855F7', category: 'Training & Skills', price: 20000, fullTitle: '21st Century ICT Skills for Teens (Ages 13-19)', subtitle: 'Empowering Pan-African Teens to Excel in ICT and Digital Skills' },
  { id: 1, title: 'BPI BSc & Masters', description: 'Enroll with BPI Strategic Partner Universities for BSc and Masters', icon: GraduationCap, color: '#2d7a4f', category: 'Education', status: 'application_pending', fullTitle: 'BPI BSc & MSc, MBA, MCA, MA Online Program', subtitle: 'Access to Higher Education Through Partner Universities' },
];

export default function PremiumDashboard({ session }: PremiumDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatAmount, convertAmount, selectedCurrency } = useCurrency();
  const utils = api.useUtils();

  const [showBalance, setShowBalance] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState<'primary' | 'operational' | 'investment' | 'community' | 'promotional' | 'rewards'>('primary');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTaxesModal, setShowTaxesModal] = useState(false);
  const [showCommunityStatsModal, setShowCommunityStatsModal] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isUsdtHistoryOpen, setIsUsdtHistoryOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isWalletTimelineOpen, setIsWalletTimelineOpen] = useState(false);
  const [isBptTimelineOpen, setIsBptTimelineOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const [isLeadershipPoolModalOpen, setIsLeadershipPoolModalOpen] = useState(false);
  const [isEpcEppModalOpen, setIsEpcEppModalOpen] = useState(false);
  const [isSolarAssessmentModalOpen, setIsSolarAssessmentModalOpen] = useState(false);
  const [isTrainingCenterModalOpen, setIsTrainingCenterModalOpen] = useState(false);
  const [isPromoMaterialsModalOpen, setIsPromoMaterialsModalOpen] = useState(false);
  const [isDigitalFarmModalOpen, setIsDigitalFarmModalOpen] = useState(false);
  const [isSubmitChannelModalOpen, setIsSubmitChannelModalOpen] = useState(false);
  const [isBrowseChannelsModalOpen, setIsBrowseChannelsModalOpen] = useState(false);
  const [isThirdPartyModalOpen, setIsThirdPartyModalOpen] = useState(false);
  const [isThirdPartyMatrixModalOpen, setIsThirdPartyMatrixModalOpen] = useState(false);
  const [isPalliativeActivationModalOpen, setIsPalliativeActivationModalOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'success' | 'error'>('idle');
  const [lastEmailReminderTime, setLastEmailReminderTime] = useState(Date.now());
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [portfolio24hChange, setPortfolio24hChange] = useState({ change: 0, percentage: 0 });
  const [isMembershipNavigating, setIsMembershipNavigating] = useState(false);

  const { data: userProfile, isLoading: isLoadingProfile } = api.user.getDetails.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: dashboardData, isLoading: isLoadingWallets } = api.dashboard.getOverview.useQuery(undefined, { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: referralStats } = api.referral.getReferralStats.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: referralLinkData } = api.referral.getMyReferralLink.useQuery(undefined, { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: notifications } = api.notification.getMyNotifications.useQuery(undefined, { staleTime: 1 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: communityStats } = api.community.getStats.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: leadershipProgress } = api.leadership.getMyProgress.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: totalTaxes } = api.taxes.getTotalTaxes.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: latestBlogPosts } = api.blog.getLatestPosts.useQuery({ limit: 12 }, { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: unreadUpdatesCount = 0 } = api.communityUpdates.getUnreadCount.useQuery();
  const { data: walletHealth } = api.dashboard.getWalletHealth.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: featureToggles } = api.config.getFeatureToggles.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: thirdPartySummary } = api.thirdPartyPlatforms.getSummary.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: availablePlatforms } = api.thirdPartyPlatforms.getAvailablePlatforms.useQuery(undefined, { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: myTrainingProgress } = api.trainingCenter.getMyProgress.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: myBadges } = api.trainingCenter.getMyBadges.useQuery(undefined, { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: inviteCount } = api.referral.getDailyInviteCount.useQuery(undefined, { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: recentReferralsData } = api.referral.getRecentReferrals.useQuery(undefined, { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: usdWithdrawalConfig } = api.wallet.getUsdWithdrawalConfig.useQuery();
  const { data: leadershipPoolSettings } = api.leadershipPool.getPoolSettings.useQuery(undefined, { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false });
  const { data: cspEligibility } = api.csp.getEligibility.useQuery(undefined, { staleTime: 2 * 60 * 1000, refetchOnWindowFocus: false, retry: false });
  const { data: cspBroadcasts } = api.csp.listBroadcasts.useQuery(undefined, { staleTime: 60 * 1000, refetchOnWindowFocus: false, retry: false });
  const { data: cspLiveStatus } = api.csp.getLiveStatus.useQuery(undefined, { staleTime: 60 * 1000, refetchOnWindowFocus: false, retry: false });

  const markMultipleAsRead = api.notification.markMultipleAsRead.useMutation({ onSuccess: () => utils.notification.getMyNotifications.invalidate() });
  const archiveNotifications = api.notification.archiveNotifications.useMutation({ onSuccess: () => utils.notification.getMyNotifications.invalidate() });
  const deleteNotifications = api.notification.deleteNotifications.useMutation({ onSuccess: () => utils.notification.getMyNotifications.invalidate() });
  const sendVerificationEmail = api.user.sendVerificationEmail.useMutation();
  const verifyEmailCode = api.user.verifyEmailCode.useMutation();
  const sendReferralInvite = api.referral.sendReferralInvite.useMutation();
  // QUERIES_END
  const ud = userProfile as any;
  const pV = dashboardData?.portfolio?.totalValue ?? 0;
  const pD = showBalance ? formatAmount(convertAmount(pV)) : '••••••';
  const bptP = dashboardData?.bptPrice ?? 0;
  const bptB = dashboardData?.wallets?.primary?.bpiToken?.balance ?? 0;
  const bptN = dashboardData?.wallets?.primary?.bpiToken?.balanceInNaira ?? 0;
  const mB = dashboardData?.wallets?.primary?.main?.balance ?? 0;
  const lB = dashboardData?.wallets?.primary?.locked?.balance ?? 0;
  const rB = dashboardData?.wallets?.primary?.rewards?.balance ?? 0;
  const txs = dashboardData?.transactions ?? [];
  const aPkg = dashboardData?.packages?.active?.[0] ?? null;
  const mN = ud?.activeMembership?.name ?? "No Membership";
  const rL = referralLinkData?.referralLink || '';
  const tR = referralStats?.totalreferrals ?? 0;
  const aR = referralStats?.activereferrals ?? 0;
  const rE = referralStats?.totalEarnings ?? 0;
  const uN = notifications?.filter((n: any) => !n.isRead).length ?? 0;
  const tP = totalTaxes ?? 0;
  const iL = isLoadingProfile || isLoadingWallets;
  const isAdmin = ud?.role === 'admin' || ud?.role === 'super_admin';
  const isUsdMode = selectedCurrency?.symbol !== 'NGN' && selectedCurrency?.symbol != null;
  const isNigerian = !isAdmin && !ud?.allowUsdFeatures && (ud?.country?.toLowerCase() === 'nigeria' || ud?.hasBankAccounts === true);
  const isUsdBlocked = isUsdMode && isNigerian;
  const isWithdrawBanned = ud?.withdrawBanned === true;
  const membershipAccess = evaluateMembershipAccess({ activeMembershipPackageId: ud?.activeMembershipPackageId, membershipActivatedAt: ud?.membershipActivatedAt, membershipExpiresAt: ud?.membershipExpiresAt, renewalCycleDays: ud?.activeMembership?.renewalCycle });
  const isImpersonating = (session.user as any)?.isImpersonation === true;
  const needsActivation = !isImpersonating && !isLoadingProfile && !!ud && !membershipAccess.membershipValid;
  const profileCompleteStatus = checkProfileCompletion({ firstname: ud?.firstname, lastname: ud?.lastname, email: ud?.email, mobile: ud?.mobile, address: ud?.address, city: ud?.city, state: ud?.state, country: ud?.country, gender: ud?.gender, image: ud?.image });
  const profileComplete = profileCompleteStatus.isComplete;
  const currentCourse = myTrainingProgress?.find((p: any) => !p.completedAt);
  const recentReferrals = (recentReferralsData as any)?.referrals ?? [];
  const blogPosts = latestBlogPosts?.posts ?? [];
  const blogTotal = latestBlogPosts?.total ?? 0;
  // DERIVED_END
  useEffect(() => { if (!iL) { setLoadingTimedOut(false); return; } const t = setTimeout(() => setLoadingTimedOut(true), 10000); return () => clearTimeout(t); }, [iL]);
  useEffect(() => { if (searchParams.get("open") !== "third-party-matrix") return; setIsThirdPartyMatrixModalOpen(true); const n = new URLSearchParams(searchParams.toString()); n.delete("open"); router.replace(`${window.location.pathname}?${n.toString()}`); }, [searchParams, router]);
  const copyRef = () => { if (!rL) return; navigator.clipboard.writeText(rL); setCopiedReferral(true); toast.success("Referral link copied!"); setTimeout(() => setCopiedReferral(false), 2000); };
  const f = (v: number) => showBalance ? formatAmount(convertAmount(v)) : '••••••';
  const fS = (v: number) => { if (!showBalance) return '••••'; const c = convertAmount(v); if (c >= 1_000_000) return `${(c / 1_000_000).toFixed(1)}M`; if (c >= 1_000) return `${(c / 1_000).toFixed(1)}K`; return formatAmount(c); };
  useEffect(() => { if (!isImpersonating && !isLoadingProfile && ud?.activeMembershipPackageId && !membershipAccess.membershipValid) router.replace("/membership"); }, [isImpersonating, isLoadingProfile, membershipAccess.membershipValid, router, ud?.activeMembershipPackageId]);
  // EFFECTS_END
  useEffect(() => { try { const v = localStorage.getItem('bpi:announcement:closed'); if (!v) return; if (v === 'never') { setShowAnnouncement(false); return; } const o = JSON.parse(v); if (o?.ts && o?.days && Date.now() < o.ts + o.days * 86400000) setShowAnnouncement(false); } catch {} }, []);
  const wTabs = [
    { id: 'primary' as const, label: 'Primary', icon: Wallet },
    { id: 'operational' as const, label: 'Operational', icon: Coins },
    { id: 'investment' as const, label: 'Investment', icon: Lock },
    { id: 'community' as const, label: 'Community', icon: Users },
    { id: 'promotional' as const, label: 'Promotional', icon: Gift },
    { id: 'rewards' as const, label: 'Rewards', icon: Award },
  ];
  useEffect(() => { if (!isLoadingProfile && ud && !ud.emailVerified && !showEmailVerificationDialog) { const i = setInterval(() => { if (Date.now() - lastEmailReminderTime >= 30000) { setShowEmailVerificationDialog(true); setLastEmailReminderTime(Date.now()); } }, 30000); return () => clearInterval(i); } }, [isLoadingProfile, ud?.emailVerified, showEmailVerificationDialog, lastEmailReminderTime]);
  // WTABS_END
  const featCards = [
    { label: 'Calculator', desc: 'Earnings calculator', icon: Calculator, onClick: () => setIsCalculatorModalOpen(true), badge: null as string | null },
    { label: 'Leadership Pool', desc: 'View progress', icon: TrendingUp, onClick: () => setIsLeadershipPoolModalOpen(true), badge: null },
    { label: 'EPC & EPP', desc: 'Global promotion', icon: Globe, onClick: () => setIsEpcEppModalOpen(true), badge: null },
    { label: 'Solar Assessment', desc: 'Energy consulting', icon: SolarIcon, onClick: () => setIsSolarAssessmentModalOpen(true), badge: null },
    { label: 'Digital Farm', desc: 'Virtual agriculture', icon: Leaf, onClick: () => setIsDigitalFarmModalOpen(true), badge: null },
    { label: 'Training Center', desc: 'Skill development', icon: GraduationCap, onClick: () => setIsTrainingCenterModalOpen(true), badge: null },
  ];
  useEffect(() => { if (dashboardData?.portfolio?.totalValue === undefined) return; const now = Date.now(); const cv = dashboardData.portfolio.totalValue; const snaps = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('bpi:portfolioSnapshots') || '[]') : []; const upd = [...snaps, { timestamp: now, value: cv }].filter((s: any) => now - s.timestamp < 25 * 3600000); const old = upd.find((s: any) => s.timestamp <= now - 24 * 3600000) || upd.at(-1); if (old) { const ch = cv - old.value; setPortfolio24hChange({ change: ch, percentage: old.value > 0 ? (ch / old.value) * 100 : 0 }); } if (typeof window !== 'undefined') localStorage.setItem('bpi:portfolioSnapshots', JSON.stringify(upd)); }, [dashboardData?.portfolio?.totalValue]);
  useEffect(() => { if (!isCarouselPaused) { const i = setInterval(() => setCurrentDealIndex(p => (p + 1) % bpiDeals.length), 5000); return () => clearInterval(i); } }, [isCarouselPaused]);
  // FEAT1_END
  const featCards2 = [
    { label: 'Promo Materials', desc: 'Marketing assets', icon: Download, onClick: () => setIsPromoMaterialsModalOpen(true), badge: null },
    { label: 'Community Updates', desc: 'Latest announcements', icon: Megaphone, onClick: () => setIsUpdatesModalOpen(true), badge: unreadUpdatesCount > 0 ? `${unreadUpdatesCount} New` : 'New' },
    { label: 'BPI Deals', desc: 'Exclusive opportunities', icon: Sparkles, onClick: () => setIsDealsModalOpen(true), badge: null },
    { label: 'Third-Party Ops', desc: 'External platforms', icon: Target, onClick: () => setIsThirdPartyModalOpen(true), badge: null },
    { label: 'Submit Channel', desc: 'Share your channel', icon: AiOutlineRobot, onClick: () => setIsSubmitChannelModalOpen(true), badge: null },
    { label: 'Browse Channels', desc: 'Explore channels', icon: BookOpen, onClick: () => setIsBrowseChannelsModalOpen(true), badge: null },
  ];
  const allFeatCards = [...featCards, ...featCards2];
  // FEAT2_END
  if (iL && !loadingTimedOut) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-0 mb-0">
      <KycWarningBanner />
      {showAnnouncement && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4 text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-100">BPI Community Support Launch — August 20, 2026</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Exclusive rewards and new features coming soon!</p>
            </div>
            <button onClick={() => { localStorage.setItem('bpi:announcement:closed', JSON.stringify({ ts: Date.now(), days: 7 })); setShowAnnouncement(false); }} className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {/* JSX_END_PART1 */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-amber-300/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-[26rem] h-[26rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,215,140,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-amber-200/90">Total Portfolio</span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-emerald-200/60 hover:text-emerald-200">
                  {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">{pD}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300"><Shield className="w-3 h-3" />{mN}</span>
                <span className="text-emerald-200/30">•</span>
                <span className="text-xs font-medium text-emerald-100/60">BPT: {showBalance ? formatAmount(convertAmount(bptP)) : '••••'}</span>
                {portfolio24hChange.percentage !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums tracking-tight ${portfolio24hChange.change >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                    {portfolio24hChange.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {portfolio24hChange.change >= 0 ? '+' : ''}{portfolio24hChange.percentage.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsDepositModalOpen(true)} className="rounded-xl border-amber-300/30 bg-white/10 text-amber-100 hover:bg-white/15 hover:shadow-md ring-1 ring-amber-300/20"><ArrowDown className="w-3.5 h-3.5 mr-1.5" />Deposit</Button>
              <Button variant="outline" size="sm" onClick={() => { if (isWithdrawBanned) { toast.error("Withdrawals are temporarily restricted on your account. Please contact support."); return; } if (isUsdBlocked) { toast.error("USD withdrawals are not available for your region."); return; } setIsWithdrawalModalOpen(true); }} className="rounded-xl border-amber-300/30 bg-white/10 text-amber-100 hover:bg-white/15 hover:shadow-md ring-1 ring-amber-300/20"><ArrowUp className="w-3.5 h-3.5 mr-1.5" />Withdraw</Button>
              <Button variant="outline" size="sm" onClick={() => setIsTransferModalOpen(true)} className="rounded-xl border-amber-300/30 bg-white/10 text-amber-100 hover:bg-white/15 hover:shadow-md ring-1 ring-amber-300/20"><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Transfer</Button>
            </div>
          </div>
          {/* AUTO_DEBIT_BUTTON */}
          <div className="mt-4 mb-6 flex flex-wrap gap-3 justify-start">
            <button
              onClick={() => router.push('/wallet/settings')}
              className="inline-flex items-center gap-3 rounded-xl border border-amber-300/30 bg-gradient-to-r from-amber-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 px-4 py-3 transition-all ring-1 ring-amber-300/20 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center ring-1 ring-amber-300/30">
                <Settings className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-amber-100">Auto-Debit Settings</p>
                <p className="text-[10px] text-amber-200/60">Configure automatic deductions & scheduled payments</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-300/60 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => router.push('/elite-club')}
              className="inline-flex items-center gap-3 rounded-xl border border-purple-300/30 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 hover:from-purple-500/25 hover:to-fuchsia-500/25 px-4 py-3 transition-all ring-1 ring-purple-300/20 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-400/20 flex items-center justify-center ring-1 ring-purple-300/30">
                <Crown className="w-4 h-4 text-purple-300" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-purple-100">Membership Upgrade</p>
                <p className="text-[10px] text-purple-200/60">Unlock higher tiers & exclusive benefits</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          {/* HERO_STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'BPI Token', v: fS(bptN), s: `${bptB} BPT`, i: Coins, a: 'text-amber-600 dark:text-amber-400' },
              { l: 'Main Wallet', v: fS(mB), s: 'Available', i: Wallet, a: 'text-emerald-600 dark:text-emerald-400' },
              { l: 'Membership License', v: fS(lB), s: aPkg ? aPkg.packageName : 'No package', i: Lock, a: 'text-blue-600 dark:text-blue-400' },
              { l: 'Rewards', v: fS(rB), s: 'Cashback + Edu', i: Gift, a: 'text-purple-600 dark:text-purple-400' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-400/15 flex items-center justify-center`}>
                    <s.i className={`w-3.5 h-3.5 ${s.a}`} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-100/70">{s.l}</span>
                </div>
                <p className="text-base font-bold text-white tabular-nums tracking-tight">{s.v}</p>
                <p className="text-[10px] text-emerald-200/50 mt-0.5">{s.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* HERO_END */}
      {/* FOUR_CARD_GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: BPI Deals */}
        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden flex flex-col h-full" onMouseEnter={() => setIsCarouselPaused(true)} onMouseLeave={() => setIsCarouselPaused(false)}>
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">BPI Deals</h2>
            <button onClick={() => setIsDealsModalOpen(true)} className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline">View All →</button>
          </div>
          <div className="relative flex-1 flex flex-col">
            <div className="flex transition-transform duration-500 ease-out flex-1" style={{ transform: `translateX(-${currentDealIndex * 100}%)` }}>
              {bpiDeals.map((deal) => (
                <div key={deal.id} className="min-w-full p-4 flex flex-col">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-950/30 dark:to-slate-900/20 p-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer flex-1" onClick={() => { setSelectedDeal(deal); setIsDealModalOpen(true); }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-amber-400/10 dark:from-emerald-500/15 dark:to-amber-400/15 flex items-center justify-center shrink-0 ring-1 ring-amber-300/20" style={{ backgroundColor: `${deal.color}20` }}>
                      <deal.icon className="w-4 h-4" style={{ color: deal.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${deal.color}20`, color: deal.color }}>{deal.category}</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{deal.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{deal.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 pb-3">
              {bpiDeals.map((_, i) => (
                <button key={i} onClick={() => setCurrentDealIndex(i)} className={`h-1.5 rounded-full transition-all ${currentDealIndex === i ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'}`} />
              ))}
            </div>
          </div>
        </div>
        {/* CARD 2: SSC */}
        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">IDENTITY</span>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">YOUR SSC</h3>
            <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-200 break-words">{ud?.ssc || 'Not assigned'}</p>
            <hr className="my-3 border-slate-200 dark:border-slate-800" />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">SSC stands for Social Security Code. It is unique to each user and serves as your identifier across the BPI digital ecosystem.</p>
          </div>
        </div>
        {/* CARD 3: Account Statistics */}
        <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Account Statistics</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-emerald-500" /><span className="text-slate-500 dark:text-slate-400">Total Referrals</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{referralStats?.totalreferrals || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-emerald-600" /><span className="text-slate-500 dark:text-slate-400">Direct</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{referralStats?.activereferrals || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-purple-500" /><span className="text-slate-500 dark:text-slate-400">Level 2</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{referralStats?.level2Count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-orange-500" /><span className="text-slate-500 dark:text-slate-400">Level 3</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{referralStats?.level3Count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-red-500" /><span className="text-slate-500 dark:text-slate-400">Level 4</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{referralStats?.level4Count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-green-500" /><span className="text-slate-500 dark:text-slate-400">Team Size</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{(referralStats?.totalreferrals || 0) + (referralStats?.level2Count || 0) + (referralStats?.level3Count || 0) + (referralStats?.level4Count || 0)}</span>
            </div>
            <button onClick={() => setShowReferralModal(true)} className="w-full mt-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium text-[11px] hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-1.5">
              <Users className="w-3 h-3" /> View Referral Details
            </button>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-pink-500" /><span className="text-slate-500 dark:text-slate-400">Member Since</span></div>
              <span className="font-semibold text-slate-900 dark:text-white">{ud?.createdAt ? new Date(ud.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
            </div>
          </div>
        </div>
        {/* CARD 4: CSP Snapshot */}
        <CspSnapshotCard cspEligibility={cspEligibility} cspBroadcasts={cspBroadcasts} cspLiveStatus={cspLiveStatus} formatAmount={formatAmount} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN_GRID_END */}
        <div className="lg:col-span-2 space-y-6">
          <div id="wallets-section" className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20">
            <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
            <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
            <div className="relative flex items-center justify-between p-5 border-b border-emerald-300/15">
              <h2 className="text-sm font-bold text-white">Wallets</h2>
              <button onClick={() => setIsWalletTimelineOpen(true)} className="text-xs font-medium text-amber-200/80 hover:text-amber-200 hover:underline">View Timeline</button>
            </div>
            <div className="relative flex items-center gap-1 px-5 pt-4 border-b border-emerald-300/15 overflow-x-auto no-scrollbar">
              {wTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveWalletTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors ${activeWalletTab === tab.id ? 'text-amber-200 border-b-2 border-amber-400' : 'text-emerald-100/60 hover:text-emerald-100'}`}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
            <div className="relative p-5">
              {activeWalletTab === 'primary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'BPI Token (BPT)', bal: bptN, sub: `${bptB} units`, ic: Coins, tl: () => setIsBptTimelineOpen(true) },
                    { name: 'Main Wallet', bal: mB, sub: 'Spendable funds', ic: Wallet, tl: () => setIsWalletTimelineOpen(true) },
                    { name: 'Membership License', bal: lB, sub: aPkg ? aPkg.packageName : 'No active package', ic: Lock, tl: null },
                    { name: 'Total Rewards', bal: rB, sub: 'Cashback + Student + Edu', ic: Gift, tl: null },
                  ].map((w) => (
                    <div key={w.name} className="group rounded-xl border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 hover:border-amber-300/30 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-400/15 flex items-center justify-center ring-1 ring-amber-300/20">
                            <w.ic className="w-4 h-4 text-emerald-300" />
                          </div>
                          <span className="text-xs font-semibold text-emerald-100/80">{w.name}</span>
                        </div>
                        {w.tl && <button onClick={w.tl} className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-200/70 hover:text-amber-200 transition-opacity">History</button>}
                      </div>
                      <p className="text-lg font-bold text-white tabular-nums tracking-tight">{f(w.bal)}</p>
                      <p className="text-[10px] text-emerald-200/50 mt-0.5">{w.sub}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeWalletTab === 'promotional' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Car Wallet', bal: (dashboardData?.wallets?.promotional as any)?.car?.balance ?? 0, sub: 'Vehicle savings', ic: Car },
                    { name: 'Solar Wallet', bal: (dashboardData?.wallets?.promotional as any)?.solar?.balance ?? 0, sub: 'Energy savings', ic: Sun },
                    { name: 'Security Wallet', bal: (dashboardData?.wallets?.promotional as any)?.security?.balance ?? 0, sub: 'Safety savings', ic: ShieldCheck },
                  ].map((w) => (
                    <div key={w.name} className="rounded-xl border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-400/15 flex items-center justify-center ring-1 ring-amber-300/20"><w.ic className="w-4 h-4 text-emerald-300" /></div>
                        <span className="text-xs font-semibold text-emerald-100/80">{w.name}</span>
                      </div>
                      <p className="text-lg font-bold text-white tabular-nums tracking-tight">{f(w.bal)}</p>
                      <p className="text-[10px] text-emerald-200/50 mt-0.5">{w.sub}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeWalletTab === 'rewards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Cashback Rewards', bal: (dashboardData?.wallets?.primary?.rewards as any)?.breakdown?.cashback ?? 0, sub: 'From purchases', ic: Gift },
                    { name: 'Student Rewards', bal: (dashboardData?.wallets?.primary?.rewards as any)?.breakdown?.studentCashback ?? 0, sub: 'Educational earnings', ic: GraduationCap },
                    { name: 'Edu Rewards', bal: (dashboardData?.wallets?.primary?.rewards as any)?.breakdown?.education ?? 0, sub: 'Learning incentives', ic: BookOpen },
                    { name: 'Total Rewards', bal: rB, sub: 'All reward types', ic: Award },
                  ].map((w) => (
                    <div key={w.name} className="rounded-xl border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-amber-400/15 flex items-center justify-center ring-1 ring-amber-300/20"><w.ic className="w-4 h-4 text-purple-300" /></div>
                        <span className="text-xs font-semibold text-emerald-100/80">{w.name}</span>
                      </div>
                      <p className="text-lg font-bold text-white tabular-nums tracking-tight">{f(w.bal)}</p>
                      <p className="text-[10px] text-emerald-200/50 mt-0.5">{w.sub}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeWalletTab !== 'primary' && activeWalletTab !== 'promotional' && activeWalletTab !== 'rewards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(dashboardData?.wallets?.[activeWalletTab] as any[])?.map((w: any) => (
                    <div key={w.id} className="rounded-xl border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-4">
                      <span className="text-xs font-semibold text-emerald-100/80">{w.name}</span>
                      <p className="text-lg font-bold text-white tabular-nums tracking-tight mt-1">{f(w.balance)}</p>
                      <p className="text-[10px] text-emerald-200/50">{w.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* WALLETS_END */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">{txs.length} transactions</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {txs.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-slate-400 dark:text-slate-500">No transactions yet</p></div>
              ) : txs.slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-amber-300/15 ${tx.transactionType === 'credit' ? 'bg-gradient-to-br from-emerald-500/15 to-amber-400/10 dark:from-emerald-500/20 dark:to-amber-400/15' : 'bg-gradient-to-br from-red-500/15 to-amber-400/10 dark:from-red-500/20 dark:to-amber-400/15'}`}>
                      {tx.transactionType === 'credit' ? <ArrowDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowUp className="w-4 h-4 text-red-600 dark:text-red-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(tx.createdAt).toLocaleDateString()} · {tx.status}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-bold tabular-nums tracking-tight ${tx.transactionType === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.transactionType === 'credit' ? '+' : '-'}{formatAmount(convertAmount(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
            {txs.length > 5 && (
              <button onClick={() => setIsWalletTimelineOpen(true)} className="w-full p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors border-t border-slate-100 dark:border-slate-800">View All Transactions →</button>
            )}
          </div>
          {/* TX_END */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Ecosystem</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
              {allFeatCards.map((fc) => (
                <button key={fc.label} onClick={fc.onClick} className="group flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-amber-400/10 dark:from-emerald-500/15 dark:to-amber-400/15 group-hover:from-emerald-500/20 group-hover:to-amber-400/20 flex items-center justify-center ring-1 ring-amber-300/20 transition-all">
                      <fc.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    </div>
                    {fc.badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{fc.badge}</span>}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fc.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{fc.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {/* FEATURES_END */}
          <div className="space-y-4">
            <PalliativeJourneyCard />
            <ActivatedPalliativeCard />
          </div>
          {currentCourse && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-slate-950/30 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/15 to-amber-400/10 flex items-center justify-center ring-1 ring-amber-300/20"><GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /></div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Training in Progress</h2></div>
                <button onClick={() => setIsTrainingCenterModalOpen(true)} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Continue →</button>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{(currentCourse as any)?.course?.title ?? 'In Progress'}</p>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-2"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(currentCourse as any)?.progress ?? 0}%` }} /></div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{(currentCourse as any)?.progress ?? 0}% complete</p>
            </div>
          )}
          <CommunityStatsCard
            communityStats={communityStats}
            onShowDetails={() => setShowCommunityStatsModal(true)}
          />
          <BlogCarousel posts={blogPosts} total={blogTotal} />
        </div>
        {/* RIGHT_COL */}
        <div className="space-y-6">
          {/* RIGHT_END */}
          {needsActivation && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-bold text-amber-900 dark:text-amber-100">Membership Activation Required</p>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-3">Your membership needs to be activated to access all features.</p>
              <Link href="/membership" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-3 py-1.5 text-xs font-semibold transition-all shadow-md ring-1 ring-amber-300/30"><Crown className="w-3.5 h-3.5" />Activate Now</Link>
            </div>
          )}
          <PremiumProfileCard
            session={session}
            userProfile={userProfile}
            communityStats={communityStats}
            totalTaxes={tP}
            formatAmount={fS}
            isImpersonating={isImpersonating}
            needsActivation={needsActivation}
            onShowCommunityStats={() => setShowCommunityStatsModal(true)}
            onShowTaxes={() => setShowTaxesModal(true)}
          />
          {/* PROFILE_END */}
          <SmartAlerts
            walletHealth={walletHealth}
            dashboardData={dashboardData}
            profileComplete={profileComplete}
            emailVerified={!!ud?.emailVerified}
            onVerifyEmail={() => setShowEmailVerificationDialog(true)}
          />
          <MembershipStatusCard
            userProfile={ud}
            profileComplete={profileComplete}
            onVerifyEmail={() => setShowEmailVerificationDialog(true)}
          />
          <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h2>
              {uN > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{uN}</span>}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {notifications && notifications.length > 0 ? notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className={`px-5 py-3 ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              )) : <div className="p-6 text-center"><p className="text-xs text-slate-400 dark:text-slate-500">No notifications</p></div>}
            </div>
            {notifications && notifications.length > 0 && (
              <button onClick={() => setShowNotifications(true)} className="w-full p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors border-t border-slate-100 dark:border-slate-800">View All</button>
            )}
          </div>
          {/* NOTIF_END */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Referrals</h2></div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-950/30 dark:to-slate-900/20 p-2"><p className="text-lg font-bold text-slate-900 dark:text-white">{tR}</p><p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Total</p></div>
                <div className="text-center rounded-lg border border-emerald-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900/20 p-2"><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{aR}</p><p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Active</p></div>
                <div className="text-center rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900/20 p-2"><p className="text-lg font-bold text-amber-600 dark:text-amber-400">{fS(rE)}</p><p className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Earned</p></div>
              </div>
              {rL && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"><p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{rL}</p></div>
                  <button onClick={copyRef} className="shrink-0 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white p-2 transition-all shadow-md ring-1 ring-amber-300/20">{copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                </div>
              )}
              <button onClick={() => setShowReferralModal(true)} className="w-full text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">View All Referrals →</button>
              {recentReferrals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Recent Referrals</p>
                  {recentReferrals.slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {r.image ? <img src={r.image} alt="" className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 truncate">{r.referredUserName || r.referredUserEmail || r.name || r.email || 'Unknown'}</span>
                      {r.status === 'active' && <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Invite by Email (0.5 BPT per invite)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="First name" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <input value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Last name" className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={() => { if (!inviteFirstName || !inviteEmail) { toast.error("Please enter first name and email"); return; } setInviteStatus('sending'); sendReferralInvite.mutate({ firstname: inviteFirstName, lastname: inviteLastName, email: inviteEmail }, { onSuccess: () => { setInviteStatus('success'); setInviteMessage('Invitation sent!'); setInviteFirstName(''); setInviteLastName(''); setInviteEmail(''); setTimeout(() => { setInviteStatus('idle'); setInviteMessage(''); }, 3000); }, onError: (err: any) => { setInviteStatus('error'); setInviteMessage(err.message || 'Failed to send'); setTimeout(() => { setInviteStatus('idle'); setInviteMessage(''); }, 3000); } }); }} disabled={inviteStatus === 'sending'} className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold transition-all shadow-md ring-1 ring-amber-300/20">
                  {inviteStatus === 'sending' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
                </button>
                {inviteMessage && <p className={`text-[10px] font-medium ${inviteStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{inviteMessage}</p>}
                <p className="text-[9px] text-slate-400 dark:text-slate-500">Daily limit: {(inviteCount as any)?.used ?? 0}/{(inviteCount as any)?.limit ?? 10} invites</p>
              </div>
            </div>
          </div>
          {/* REFERRAL_END */}
          {leadershipProgress && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5 min-h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/15 to-amber-400/10 dark:from-emerald-500/20 dark:to-amber-400/15 flex items-center justify-center ring-1 ring-amber-300/20"><Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /></div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Leadership Pool Progress</h2>
                </div>
                <button onClick={() => setIsLeadershipPoolModalOpen(true)} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Details →</button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Current Rank</span><span className="font-semibold text-slate-900 dark:text-white">{(leadershipProgress as any)?.qualificationRank ?? '—'}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Pool Share</span><span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">{(leadershipProgress as any)?.poolShare ?? 0}%</span></div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${(leadershipProgress as any)?.poolShare ?? 0}%` }} /></div>
              </div>
            </div>
          )}
          <ThirdPartyOpportunitiesCard
            summary={thirdPartySummary}
            availablePlatforms={availablePlatforms}
            onOpenModal={() => setIsThirdPartyModalOpen(true)}
            onOpenMatrix={() => setIsThirdPartyMatrixModalOpen(true)}
          />
        </div>
      </div>
      {/* MODALS_START */}
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
      <WithdrawalModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} onOpenUsdtHistory={() => setIsUsdtHistoryOpen(true)} />
      <UsdtWithdrawalHistory isOpen={isUsdtHistoryOpen} onClose={() => setIsUsdtHistoryOpen(false)} />
      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
      <WalletTimelineModal isOpen={isWalletTimelineOpen} onClose={() => setIsWalletTimelineOpen(false)} />
      <BptTimelineModal isOpen={isBptTimelineOpen} onClose={() => setIsBptTimelineOpen(false)} />
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications || []}
        onMarkAsRead={(ids) => markMultipleAsRead.mutate({ notificationIds: ids })}
        onArchive={(ids) => archiveNotifications.mutate({ notificationIds: ids })}
        onDelete={(ids) => deleteNotifications.mutate({ notificationIds: ids })}
      />
      <ReferralDetailsModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} />
      <TaxesModal isOpen={showTaxesModal} onClose={() => setShowTaxesModal(false)} />
      <CommunityStatsModal isOpen={showCommunityStatsModal} onClose={() => setShowCommunityStatsModal(false)} userProfile={userProfile} communityStats={communityStats} />
      <UpdatesModal isOpen={isUpdatesModalOpen} onClose={() => setIsUpdatesModalOpen(false)} />
      <CalculatorModal isOpen={isCalculatorModalOpen} onClose={() => setIsCalculatorModalOpen(false)} />
      <DealsModal isOpen={isDealsModalOpen} onClose={() => setIsDealsModalOpen(false)} />
      <LeadershipPoolModal isOpen={isLeadershipPoolModalOpen} onClose={() => setIsLeadershipPoolModalOpen(false)} />
      <EpcEppModal isOpen={isEpcEppModalOpen} onClose={() => setIsEpcEppModalOpen(false)} />
      <SolarAssessmentModal isOpen={isSolarAssessmentModalOpen} onClose={() => setIsSolarAssessmentModalOpen(false)} />
      <TrainingCenterModal isOpen={isTrainingCenterModalOpen} onClose={() => setIsTrainingCenterModalOpen(false)} />
      <PromotionalMaterialsModal isOpen={isPromoMaterialsModalOpen} onClose={() => setIsPromoMaterialsModalOpen(false)} />
      <DigitalFarmModal isOpen={isDigitalFarmModalOpen} onClose={() => setIsDigitalFarmModalOpen(false)} />
      <SubmitChannelModal isOpen={isSubmitChannelModalOpen} onClose={() => setIsSubmitChannelModalOpen(false)} />
      <BrowseChannelsModal isOpen={isBrowseChannelsModalOpen} onClose={() => setIsBrowseChannelsModalOpen(false)} />
      <ThirdPartyOpportunitiesModal isOpen={isThirdPartyModalOpen} onClose={() => setIsThirdPartyModalOpen(false)} />
      <ThirdPartyMatrixModal isOpen={isThirdPartyMatrixModalOpen} onClose={() => setIsThirdPartyMatrixModalOpen(false)} />
      <PalliativeActivationModal isOpen={isPalliativeActivationModalOpen} onClose={() => setIsPalliativeActivationModalOpen(false)} currentBalance={mB} />
      {showEmailVerificationDialog && ud && !ud.emailVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEmailVerificationDialog(false)}>
          <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 p-6 max-w-md w-full shadow-2xl dark:shadow-emerald-950/50 ring-1 ring-amber-300/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center ring-1 ring-amber-300/30"><Mail className="w-4 h-4 text-white" /></div><p className="text-sm font-bold text-slate-900 dark:text-white">Verify Your Email</p></div>
            <p className="text-xs text-slate-500 mb-4">{ud.email}</p>
            {!emailSent ? (
              <button onClick={() => sendVerificationEmail.mutate(undefined, { onSuccess: () => { setEmailSent(true); toast.success("Email sent!"); }, onError: () => toast.error("Failed") })} className="w-full rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-2 text-sm font-semibold shadow-md ring-1 ring-amber-300/20 transition-all">Send Verification Email</button>
            ) : (<div className="space-y-2">
              <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="Code" className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm" />
              <button onClick={() => verifyEmailCode.mutate({ code: verificationCode }, { onSuccess: () => { setShowEmailVerificationDialog(false); toast.success("Verified!"); }, onError: () => toast.error("Invalid") })} className="w-full rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white py-2 text-sm font-semibold shadow-md ring-1 ring-amber-300/20 transition-all">Verify</button>
            </div>)}
          </div>
        </div>
      )}
      <MobileBottomNav unreadNotifications={uN} onWalletClick={() => { const el = document.getElementById('wallets-section'); el?.scrollIntoView({ behavior: 'smooth' }); }} />
    </div>
  );
}
