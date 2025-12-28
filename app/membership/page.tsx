"use client";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Award, Check, TrendingUp, Users, Gift, Shield, Moon, Sun, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MembershipPage() {
  const { data: packages, isLoading } = api.package.getPackages.useQuery();
  const activateMutation = api.package.activateStandard.useMutation();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  const togglePackageDetails = (packageId: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [packageId]: !prev[packageId]
    }));
  };

  const handleActivate = async (packageId: string) => {
    setActivatingId(packageId);
    try {
      await activateMutation.mutateAsync({ packageId });
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      console.error('Activation failed:', error);
      setActivatingId(null);
    }
  };
  
  // Sort packages by price (ascending order)
  const sortedPackages = packages ? [...packages].sort((a, b) => a.price - b.price) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-bpi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Loading membership packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Header */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-4">
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
              
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-2xl mb-6">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Activate Your Membership
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a membership plan that suits your goals and unlock access to BPI's powerful ecosystem of rewards, referrals, and community benefits.
          </p>
        </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {sortedPackages.map((pkg) => {
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
                
                {/* Package Header - Fixed Height */}
                <div className={`bg-gradient-to-br ${colors.gradient} p-6 text-white`}>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-3 tracking-wide">{pkg.name}</h3>
                    <div className="mb-2">
                      <span className="text-4xl font-extrabold">₦{pkg.price.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white/80">
                      + ₦{pkg.vat.toLocaleString()} VAT
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-lg font-semibold">
                        Total: ₦{totalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Body - Flexible Height */}
                <div className="p-6 flex-1 flex flex-col">
                  
                  {/* Expandable Details Section */}
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
                    
                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Referral Rewards */}
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
                                  {reward.cash > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400">Cash: ₦{reward.cash.toLocaleString()}</span>
                                  )}
                                  {reward.palliative > 0 && (
                                    <span className="text-blue-600 dark:text-blue-400">Pal: ₦{reward.palliative.toLocaleString()}</span>
                                  )}
                                  {reward.bpt > 0 && (
                                    <span className="text-purple-600 dark:text-purple-400">BPT: ₦{reward.bpt.toLocaleString()}</span>
                                  )}
                                  {reward.cashback && reward.cashback > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400">CB: ₦{reward.cashback.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Features */}
                        {pkg.features && pkg.features.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                              Key Features
                            </h4>
                            <div className="space-y-1.5">
                              {pkg.features.slice(0, 4).map((feature, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground leading-tight">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Renewal Info */}
                        {pkg.hasRenewal && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">Renewal:</span> Every 365 days at ₦{((pkg.renewalFee || 0) + ((pkg.renewalFee || 0) * 0.075)).toLocaleString()} (incl. VAT)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button - Always at bottom */}
                  <div className="mt-auto">
                    <Button
                      onClick={() => handleActivate(pkg.id)}
                      className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white border-0 shadow-md font-semibold`}
                      disabled={activatingId !== null}
                      size="lg"
                    >
                      {activatingId === pkg.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Activate Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
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
