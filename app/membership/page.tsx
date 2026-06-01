"use client";
import React, { useState } from "react";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Award, Check, TrendingUp, Users, Gift, Shield, Moon, Sun, LogOut, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Loader2, RefreshCw, Sparkles, Zap, Star, Flame, BadgePercent } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import LoadingScreen from "@/components/LoadingScreen";
import KycWarningBanner from "@/components/kyc/KycWarningBanner";
import MembershipRenewalPanel from "@/components/membership/MembershipRenewalPanel";
import toast from "react-hot-toast";

export default function MembershipPage() {
  const { data: packages, isLoading } = api.package.getPackages.useQuery();
  const { data: activeMembership, isLoading: loadingActive } = api.package.getUserActiveMembership.useQuery();
  const activateMutation = api.package.activateStandard.useMutation();
  const { theme, toggleTheme } = useTheme();
  const { formatAmount, selectedCurrency, currencies, setSelectedCurrencyId } = useCurrency();
  const selectedCurrencyId = selectedCurrency?.id || '';
  const router = useRouter();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [claimingPromo, setClaimingPromo] = useState<string | null>(null);
  const [promoClaimSuccess, setPromoClaimSuccess] = useState<{ packageName: string; expiresAt: Date } | null>(null);

  const { data: promoData } = api.promoCampaign.getActivePromo.useQuery(undefined, {
    enabled: !activeMembership,
  });
  const claimPromoMutation = api.promoCampaign.claimPromo.useMutation();

  const handleClaimPromo = async (packageId: string) => {
    if (!promoData) return;
    setClaimingPromo(packageId);
    const tid = toast.loading('Activating your free membership…');
    try {
      const result = await claimPromoMutation.mutateAsync({
        campaignId: promoData.id,
        packageId,
      });
      toast.dismiss(tid);
      const claimedPkg = packages?.find((p: any) => p.id === packageId);
      setPromoClaimSuccess({ packageName: claimedPkg?.name || 'Membership', expiresAt: result.expiresAt });
      setClaimingPromo(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim promo activation.', { id: tid });
      setClaimingPromo(null);
    }
  };

  const togglePackageDetails = (packageId: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };
  // Helper function to determine if a package is an addon (not a base tier upgrade)
  const isAddonPackage = (packageName: string): boolean => {
    const addonPackages = [
      'Travel & Tour Agent',
      'Basic Early Retirement',
      'Child Educational/Vocational Support'
    ];
    return addonPackages.includes(packageName);
  };
  const handleActivate = async (packageId: string, isUpgrade: boolean = false) => {
    // Set loading state immediately
    setActivatingId(packageId);
    
    // Navigate to payment page (both activation and upgrade use same payment gateway selection)
    if (isUpgrade && activeMembership?.package) {
      router.push(`/membership/activate/${packageId}?upgrade=true&from=${activeMembership.package.id}`);
    } else {
      router.push(`/membership/activate/${packageId}`);
    }
  };
  
  // Sort packages by price (ascending order)
  const sortedPackages = packages ? [...packages].sort((a, b) => a.price - b.price) : [];

  // Separate packages into tier upgrades and feature bundles using name-based detection
  const tierUpgrades = sortedPackages.filter(pkg => !isAddonPackage(pkg.name));
  const featureBundles = sortedPackages.filter(pkg => isAddonPackage(pkg.name));

  // Get current package index for comparison
  const currentPackageIndex = sortedPackages.findIndex(
    pkg => pkg.id === activeMembership?.package?.id
  );

  // Determine which packages get promo treatment
  const promoEligibleIds: Set<string> = new Set(
    promoData && promoData.remaining > 0
      ? promoData.targetPackageId
        ? [promoData.targetPackageId]
        : sortedPackages.filter((p) => !isAddonPackage(p.name)).map((p) => p.id)
      : []
  );

  // Render FREE promo card
  function renderPromoCard(pkg: any) {
    const isExpanded = expandedPackages[pkg.id] || false;
    return (
      <div key={`promo-${pkg.id}`} className="relative col-span-1 sm:col-span-2 lg:col-span-3">
        {/* Animated glow ring */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-500 opacity-60 blur-lg animate-pulse" />
        <div className="relative rounded-3xl overflow-hidden border-2 border-yellow-400/60 shadow-2xl">
          {/* Diagonal ribbon – top-right */}
          <div className="absolute top-0 right-0 z-20">
            <div className="relative overflow-hidden w-36 h-36">
              <div className="absolute top-5 right-[-30px] rotate-45 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[11px] font-black tracking-widest uppercase px-10 py-1.5 shadow-lg">
                FREE
              </div>
            </div>
          </div>

          {/* Hero gradient background */}
          <div className="bg-gradient-to-br from-[#012d18] via-[#014d28] to-[#023320] px-6 pt-8 pb-6 text-white">
            {/* Top labels row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50 px-3 py-1 text-xs font-black uppercase tracking-widest text-yellow-300">
                <Sparkles className="h-3.5 w-3.5" /> Promo Activation
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/20 border border-green-400/40 px-3 py-1 text-xs font-bold text-green-300">
                <Zap className="h-3.5 w-3.5 fill-green-300" />
                {promoData!.remaining.toLocaleString()} slots left
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 border border-red-400/40 px-3 py-1 text-xs font-bold text-red-300 animate-pulse">
                <Flame className="h-3.5 w-3.5" /> Limited Time
              </span>
            </div>

            {/* Content grid: info + price + CTA */}
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Left: icon + name */}
              <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl">
                  <Star className="h-8 w-8 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-yellow-300/80 mb-1">Free Membership</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{pkg.name}</h2>
                  <p className="text-sm text-white/60 mt-1">{promoData!.name}</p>
                </div>
              </div>

              {/* Center: price crossed out → FREE */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl line-through text-white/30 font-bold">{formatAmount(pkg.price + pkg.vat)}</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-green-300">FREE</span>
                </div>
                <p className="text-sm text-white/50">Zero payment · No credit card</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-green-400" /> Full membership access</span>
                  <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-green-400" /> Referral rewards active</span>
                  <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-green-400" /> No payment required</span>
                </div>
              </div>

              {/* Right: CTA */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => handleClaimPromo(pkg.id)}
                  disabled={!!claimingPromo}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-10 py-4 text-base font-black uppercase tracking-widest text-black shadow-2xl transition-all hover:from-yellow-300 hover:to-amber-400 hover:scale-105 active:scale-100 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {claimingPromo === pkg.id ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Activating…</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> Claim Free Membership</>
                  )}
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-bounce">!</span>
                </button>
                <p className="text-xs text-white/40">Spots filling fast — claim yours now</p>
              </div>
            </div>

            {/* Expand details */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <button
                onClick={() => togglePackageDetails(pkg.id)}
                className="flex w-full items-center justify-between text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2"><Gift className="h-4 w-4" />{isExpanded ? 'Hide' : 'View'} Package Details</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isExpanded && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Referral Rewards</h4>
                    <div className="space-y-2">
                      {[
                        { level: 'L1', cash: pkg.cash_l1, bpt: pkg.bpt_l1, palliative: pkg.palliative_l1, cashback: pkg.cashback_l1 },
                        { level: 'L2', cash: pkg.cash_l2, bpt: pkg.bpt_l2, palliative: pkg.palliative_l2, cashback: pkg.cashback_l2 },
                        { level: 'L3', cash: pkg.cash_l3, bpt: pkg.bpt_l3, palliative: pkg.palliative_l3, cashback: pkg.cashback_l3 },
                        { level: 'L4', cash: pkg.cash_l4, bpt: pkg.bpt_l4, palliative: pkg.palliative_l4, cashback: pkg.cashback_l4 },
                      ].map((reward) => (
                        <div key={reward.level} className="rounded-lg bg-white/10 px-3 py-2">
                          <p className="text-xs font-semibold text-white/80 mb-1">{reward.level}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {reward.cash > 0 && <span className="text-emerald-300">Cash: {formatAmount(reward.cash)}</span>}
                            {reward.palliative > 0 && <span className="text-blue-300">Pal: {formatAmount(reward.palliative)}</span>}
                            {reward.bpt > 0 && <span className="text-purple-300">BPT: {formatAmount(reward.bpt)}</span>}
                            {reward.cashback && reward.cashback > 0 && <span className="text-amber-300">CB: {formatAmount(reward.cashback)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {pkg.features && pkg.features.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Key Features</h4>
                      <div className="space-y-1.5">
                        {pkg.features.slice(0, 6).map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-white/60 leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render package card function
  function renderPackageCard(pkg: any, context: 'tier' | 'bundle' | 'new') {
    const isPopular = pkg.name === "Regular Plus";
    const isExpanded = expandedPackages[pkg.id] || false;
    const totalCost = pkg.price + pkg.vat;
    
    // Professional color scheme
    const packageColors = {
      "Regular": { gradient: 'from-slate-600 to-slate-800', accent: 'slate' },
      "Regular Plus": { gradient: 'from-emerald-600 to-teal-700', accent: 'emerald' },
      "Gold Plus": { gradient: 'from-amber-500 to-orange-600', accent: 'amber' },
      "Platinum Plus": { gradient: 'from-purple-600 to-indigo-700', accent: 'purple' },
      "Travel & Tour Agent": { gradient: 'from-cyan-600 to-blue-700', accent: 'cyan' },
      "Basic Early Retirement": { gradient: 'from-rose-600 to-pink-700', accent: 'rose' }
    };
    
    const colors = packageColors[pkg.name as keyof typeof packageColors] || { gradient: 'from-gray-600 to-gray-800', accent: 'gray' };

    const pkgIndex = sortedPackages.indexOf(pkg);
    const isCurrent = currentPackageIndex === pkgIndex;
    
    // For feature bundles, calculate cost differently
    let displayCost = 0;
    let costLabel = '';
    const isBundle = isAddonPackage(pkg.name);
    
    if (context === 'bundle') {
      const regularPlusPackage = packages?.find((p: { name: string }) => p.name === "Regular Plus");
      const regularPlusTotal = regularPlusPackage ? regularPlusPackage.price + regularPlusPackage.vat : 0;
      const currentTotal = activeMembership?.package
        ? activeMembership.package.price + activeMembership.package.vat
        : 0;
      const bundleTotal = pkg.price + pkg.vat;

      if (regularPlusTotal > 0 && currentTotal >= regularPlusTotal) {
        displayCost = Math.max(0, bundleTotal - regularPlusTotal);
        costLabel = 'Add-on Cost';
      } else {
        displayCost = bundleTotal;
        costLabel = 'Full Add-on Cost';
      }
    } else if (context === 'tier' && activeMembership?.package) {
      // Tier upgrade: show difference
      displayCost = (pkg.price + pkg.vat) - (activeMembership.package.price + activeMembership.package.vat);
      costLabel = 'Upgrade Cost';
    }

    const isLower = currentPackageIndex > -1 && pkgIndex <= currentPackageIndex && !isBundle;

    return (
      <Card 
        key={pkg.id} 
        className="relative bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full"
      >
        {isPopular && (
          <div className="absolute -top-1 -right-1 z-10">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-md">
              MOST POPULAR
            </div>
          </div>
        )}
        
        {/* Package Header */}
        <div className={`bg-gradient-to-br ${colors.gradient} p-6 text-white`}>
          <div className="text-center">
            <h3 className="text-xl font-bold mb-3 tracking-wide">{pkg.name}</h3>
            <div className="mb-2">
              <span className="text-4xl font-extrabold">{formatAmount(pkg.price)}</span>
            </div>
            <p className="text-sm text-white/80">
              + {formatAmount(pkg.vat)} VAT
            </p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-lg font-semibold">
                Total: {formatAmount(totalCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Package Body */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-4">
            <button
              onClick={() => togglePackageDetails(pkg.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                {isExpanded ? 'Hide' : 'View'} Package Details
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {isExpanded && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Referral Rewards
                  </h4>
                  <div className="space-y-2">
                    {[
                      { level: 'L1', cash: pkg.cash_l1, bpt: pkg.bpt_l1, palliative: pkg.palliative_l1, cashback: pkg.cashback_l1 },
                      { level: 'L2', cash: pkg.cash_l2, bpt: pkg.bpt_l2, palliative: pkg.palliative_l2, cashback: pkg.cashback_l2 },
                      { level: 'L3', cash: pkg.cash_l3, bpt: pkg.bpt_l3, palliative: pkg.palliative_l3, cashback: pkg.cashback_l3 },
                      { level: 'L4', cash: pkg.cash_l4, bpt: pkg.bpt_l4, palliative: pkg.palliative_l4, cashback: pkg.cashback_l4 }
                    ].map((reward) => (
                      <div key={reward.level} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-foreground mb-1">{reward.level}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {reward.cash > 0 && <span className="text-emerald-600 dark:text-emerald-400">Cash: {formatAmount(reward.cash)}</span>}
                          {reward.palliative > 0 && <span className="text-blue-600 dark:text-blue-400">Pal: {formatAmount(reward.palliative)}</span>}
                          {reward.bpt > 0 && <span className="text-purple-600 dark:text-purple-400">BPT: {formatAmount(reward.bpt)}</span>}
                          {reward.cashback && reward.cashback > 0 && <span className="text-amber-600 dark:text-amber-400">CB: {formatAmount(reward.cashback)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {pkg.features && pkg.features.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Key Features
                    </h4>
                    <div className="space-y-1.5">
                      {pkg.features.slice(0, 4).map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {pkg.hasRenewal && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Renewal:</span> Every 365 days at {formatAmount((pkg.renewalFee || 0) + ((pkg.renewalFee || 0) * 0.075))} (incl. VAT)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            {isCurrent && (
              <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg p-4 text-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="font-bold text-green-800 dark:text-green-300">ACTIVE PLAN</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {activeMembership?.expiresAt && `Expires: ${new Date(activeMembership.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
            )}

            {!isCurrent && isLower && !isBundle && (
              <Button
                disabled
                className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                size="lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                Lower Tier
              </Button>
            )}

            {!isCurrent && !isLower && (context === 'tier' || context === 'bundle') && activeMembership && (
              <div className="space-y-2">
                <div className={`${context === 'bundle' ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'} rounded-lg p-2 text-center`}>
                  <p className={`text-xs ${context === 'bundle' ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'} font-semibold`}>{costLabel}</p>
                  <p className={`text-lg font-bold ${context === 'bundle' ? 'text-purple-800 dark:text-purple-200' : 'text-blue-800 dark:text-blue-200'}`}>
                    {formatAmount(displayCost)}
                  </p>
                  {context === 'bundle' && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      {costLabel === 'Add-on Cost' ? 'Extra features only' : 'Includes Regular Plus membership'}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleActivate(pkg.id, true)}
                  className={`w-full bg-gradient-to-r ${context === 'bundle' ? 'from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800' : 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'} text-white border-0 shadow-md font-semibold`}
                  disabled={activatingId !== null}
                  size="lg"
                >
                  {activatingId === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {context === 'bundle' ? <Gift className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                      {context === 'bundle' ? 'ACTIVATE ADDON' : 'UPGRADE MEMBERSHIP'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {!isCurrent && !isLower && !((context === 'tier' || context === 'bundle') && activeMembership) && (
              <Button
                onClick={() => handleActivate(pkg.id, false)}
                className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white border-0 shadow-md font-semibold`}
                disabled={activatingId !== null}
                size="lg"
              >
                {activatingId === pkg.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Activate Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading || loadingActive) {
    return (
      <LoadingScreen 
        message="Loading Membership Packages"
        subtitle="Preparing your membership options..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">

      {/* ── Promo Claim Success Overlay ────────────────────────────────────── */}
      {promoClaimSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            {/* Ambient glow layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#011f10] via-[#013820] to-[#021c0c]" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-0 w-64 h-64 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-green-400" />

            {/* Main content */}
            <div className="relative z-10 px-8 pt-10 pb-8 text-center">
              {/* Success badge */}
              <div className="mb-1 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/15 border border-green-400/30 px-4 py-1 text-xs font-black uppercase tracking-widest text-green-300">
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Activation Successful
                </span>
              </div>

              {/* Big checkmark */}
              <div className="mx-auto my-6 relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 opacity-20 blur-xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl shadow-green-500/40">
                  <Check className="h-12 w-12 text-white stroke-[3]" />
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-4xl font-black text-white mb-1">You&apos;re In!</h2>
              <p className="text-white/50 text-sm mb-3">Your free membership is now active</p>

              {/* Package info pill */}
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-5 py-3 mb-6">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <div className="text-left">
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Active Plan</p>
                  <p className="text-base font-black text-white leading-tight">{promoClaimSuccess.packageName}</p>
                </div>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <div className="text-left">
                  <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Expires</p>
                  <p className="text-sm font-semibold text-white/80 leading-tight">
                    {new Date(promoClaimSuccess.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Features row */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {['Referral Rewards Active', 'Full Dashboard Access', 'Community Unlocked'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 text-xs text-white/50">
                    <Check className="h-3 w-3 text-green-400 stroke-[3]" /> {f}
                  </span>
                ))}
              </div>

              {/* PRIMARY CTA — Proceed to Dashboard */}
              <a
                href="/dashboard"
                className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-5 text-lg font-black uppercase tracking-widest text-black shadow-2xl shadow-amber-500/25 transition-all duration-200 hover:from-yellow-300 hover:to-amber-400 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-5 w-5" />
                Proceed to Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>

              <p className="mt-4 text-[11px] text-white/25 leading-relaxed">
                All features are ready — start exploring your BPI dashboard now.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/img/logo.png" alt="BPI Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                  BeepAgro Africa
                </h1>
                <p className="text-sm text-muted-foreground">Palliative Initiative</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {activeMembership && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden md:inline">Back to Dashboard</span>
                </Link>
              )}

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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoggingOut(true);
                  const baseUrl = resolveClientBaseUrl();
                  signOut({ callbackUrl: baseUrl ? `${baseUrl}/login` : "/login" });
                }}
                disabled={isLoggingOut}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden md:inline">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* KYC Warning Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <KycWarningBanner />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-2xl mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {activeMembership ? 'Upgrade Your Membership' : 'Activate Your Membership'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {activeMembership && activeMembership.package
              ? `You're currently on the ${activeMembership.package.name} plan. Take your journey further by upgrading to unlock greater rewards, higher referral bonuses, and enhanced community benefits.`
              : "Choose a membership plan that suits your goals and unlock access to BPI's powerful ecosystem of rewards, referrals, and community benefits."
            }
          </p>
        </div>

        {activeMembership?.package && (
          <div className="mb-12">
            <MembershipRenewalPanel />
          </div>
        )}

        {/* Promo chip — subtle announcement above grid */}
        {!activeMembership && promoData && promoData.remaining > 0 && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-1.5 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              <Sparkles className="h-4 w-4" />
              Free activation promo is live — scroll down to claim your spot
              <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-bold">{promoData.remaining.toLocaleString()} left</span>
            </span>
          </div>
        )}

        {/* Packages Grid */}
        {!packages || packages.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto bg-white dark:bg-bpi-dark-card backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent shadow-xl p-12">
              <div className="w-20 h-20 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                No Packages Available
              </h3>
              <p className="text-muted-foreground mb-6">
                Membership packages are currently being set up. Please check back soon or contact support for assistance.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Dashboard
                </Button>
              </Link>
            </Card>
          </div>
        ) : (
          <>
            {/* Membership Tier Upgrades Section */}
            {activeMembership && tierUpgrades.length > 0 && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <TrendingUp className="w-8 h-8 text-bpi-primary" />
                    Membership Tier Upgrades
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Upgrade to a higher membership tier for enhanced benefits, larger referral bonuses, and exclusive features.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {tierUpgrades.map((pkg) => renderPackageCard(pkg, 'tier'))}
                </div>
              </div>
            )}

            {/* Feature Bundles/Add-ons Section */}
            {activeMembership && featureBundles.length > 0 && (
              <div className="mb-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                    <Gift className="w-8 h-8 text-purple-600" />
                    Add-on Features
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Enhance your membership with specialized features. Pay only for the additional benefits on top of your current plan.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {featureBundles.map((pkg) => renderPackageCard(pkg, 'bundle'))}
                </div>
              </div>
            )}

            {/* All Packages for non-members */}
            {!activeMembership && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Promo cards first — full-width, visually dominant */}
                {sortedPackages
                  .filter((pkg) => promoEligibleIds.has(pkg.id))
                  .map((pkg) => renderPromoCard(pkg))}
                {/* Regular packages below */}
                {sortedPackages
                  .filter((pkg) => !promoEligibleIds.has(pkg.id))
                  .map((pkg) => renderPackageCard(pkg, 'new'))}
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border border-bpi-border dark:border-bpi-dark-accent rounded-2xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
            Why Activate Your Membership?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Referral Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Earn cash and BPI tokens for every member you refer across 4 levels
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Leadership Pool Access</h4>
              <p className="text-sm text-muted-foreground">
                Qualify for the prestigious BPI Leadership Pool with higher tier memberships
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Community Benefits</h4>
              <p className="text-sm text-muted-foreground">
                Access exclusive palliative programs, training, and support resources
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
