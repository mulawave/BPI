"use client";

import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  Coins, 
  CheckCircle,
  ArrowLeft,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
  Bitcoin,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import LoadingScreen from "@/components/LoadingScreen";

// Payment gateway options
type PaymentGateway = 'wallet' | 'bank-transfer' | 'paystack' | 'flutterwave' | 'utility-token' | 'crypto' | 'mock';

interface PaymentOption {
  id: PaymentGateway;
  name: string;
  description: string;
  icon: any;
  available: boolean;
  comingSoon?: boolean;
  regionRestricted?: 'nigeria' | 'foreign' | null;
}

export default function ActivateMembershipPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { formatAmount } = useCurrency();
  const packageId = params?.packageId as string;
  
  // Check if this is an upgrade
  const isUpgrade = searchParams?.get('upgrade') === 'true';
  const fromPackageId = searchParams?.get('from');
  
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch package details
  const { data: packages, isLoading: isLoadingPackages } = api.package.getPackages.useQuery();
  const selectedPackage = packages?.find(pkg => pkg.id === packageId);
  const fromPackage = packages?.find(pkg => pkg.id === fromPackageId);

  // Check if user has active membership
  const { data: activeMembership } = api.package.getUserActiveMembership.useQuery();

  const addonPackages = [
    "Travel & Tour Agent",
    "Basic Early Retirement",
    "Child Educational/Vocational Support",
  ];

  const isAddon = selectedPackage ? addonPackages.includes(selectedPackage.name) : false;
  const regularPlusPackage = packages?.find(pkg => pkg.name === "Regular Plus");
  const regularPlusTotal = regularPlusPackage ? regularPlusPackage.price + regularPlusPackage.vat : 0;
  const currentTotal = activeMembership?.package
    ? activeMembership.package.price + activeMembership.package.vat
    : 0;

  const activationCost = selectedPackage ? (selectedPackage.price + selectedPackage.vat) : 0;
  const adjustedActivationCost = (isAddon && regularPlusTotal > 0 && currentTotal >= regularPlusTotal)
    ? Math.max(0, activationCost - regularPlusTotal)
    : activationCost;

  // Calculate cost (upgrade shows differential, activation shows adjusted cost)
  const totalCost = isUpgrade && fromPackage && selectedPackage
    ? (isAddon
        ? adjustedActivationCost
        : (selectedPackage.price + selectedPackage.vat) - (fromPackage.price + fromPackage.vat))
    : adjustedActivationCost;

  // Fetch user details to check wallet balance
  const { data: userDetails } = api.user.getDetails.useQuery();
  const walletBalance = userDetails?.wallet || 0;
  const hasEnoughBalance = walletBalance >= totalCost;

  // Fetch live gateway configuration (DB-driven)
  const { data: gatewayConfigs } = api.payment.getPaymentGateways.useQuery();
  const gatewayEnabledByName = new Map(
    (gatewayConfigs ?? []).map((g) => [g.gatewayName, g.isActive] as const),
  );
  const dbEnabled = (gateway: PaymentGateway) => gatewayEnabledByName.get(gateway);
  const comingSoonFromDb = (gateway: PaymentGateway, fallback: boolean) => {
    const enabled = dbEnabled(gateway);
    if (enabled === undefined) return fallback;
    return !enabled;
  };

  // Process payment mutation
  const processMockPayment = api.package.processMockPayment.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setProcessing(false);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || 'Payment processing failed');
      setProcessing(false);
    }
  });

  // Process upgrade mutation
  const processUpgradeMutation = api.package.processUpgradePayment.useMutation({
    onSuccess: (data) => {
      setSuccess(true);
      setProcessing(false);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || 'Upgrade processing failed');
      setProcessing(false);
    }
  });

  // Define payment options
  const paymentOptions: PaymentOption[] = [
    {
      id: 'wallet' as PaymentGateway,
      name: 'Wallet Balance',
      description: hasEnoughBalance 
        ? `Pay from your wallet (Available: ${formatAmount(walletBalance)})`
        : `Insufficient balance (Available: ${formatAmount(walletBalance)}, Required: ${formatAmount(totalCost)})`,
      icon: Wallet,
      available: hasEnoughBalance,
      comingSoon: false
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer (Nigeria)',
      description: 'Direct bank transfer with automated verification',
      icon: Building2,
      available: true,
      regionRestricted: 'nigeria',
      comingSoon: comingSoonFromDb('bank-transfer', false)
    },
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Pay with cards, bank transfer, or USSD',
      icon: CreditCard,
      available: true,
      regionRestricted: 'nigeria',
      comingSoon: comingSoonFromDb('paystack', true)
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'International payments with currency conversion',
      icon: CreditCard,
      available: true,
      comingSoon: comingSoonFromDb('flutterwave', true)
    },
    {
      id: 'utility-token',
      name: 'Utility Tokens',
      description: 'Pay with approved utility tokens',
      icon: Coins,
      available: true,
      regionRestricted: 'nigeria',
      comingSoon: comingSoonFromDb('utility-token', true)
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, USDT, or other supported crypto',
      icon: Bitcoin,
      available: true,
      comingSoon: comingSoonFromDb('crypto', true)
    },
    {
      id: 'mock',
      name: 'Mock Payment (Testing)',
      description: 'Simulate successful payment for testing purposes',
      icon: Wallet,
      available: true,
      comingSoon: comingSoonFromDb('mock', false)
    }
  ];

  const handlePayment = async () => {
    if (!selectedGateway || !selectedPackage) return;

    setProcessing(true);
    setError(null);

    try {
      if (selectedGateway === 'wallet') {
        // Check wallet balance again
        if (!hasEnoughBalance) {
          setError(`Insufficient wallet balance. You have ${formatAmount(walletBalance)} but need ${formatAmount(totalCost)}`);
          setProcessing(false);
          return;
        }

        // Process wallet payment (activation or upgrade)
        if (isUpgrade && fromPackageId) {
          await processUpgradeMutation.mutateAsync({ 
            packageId: selectedPackage.id,
            currentPackageId: fromPackageId,
            paymentMethod: 'wallet',
            frontendCalculatedCost: totalCost // Cost validation
          });
        } else {
          await processMockPayment.mutateAsync({ 
            packageId: selectedPackage.id,
            paymentMethod: 'wallet'
          });
        }
      } else if (selectedGateway === 'bank-transfer') {
        // Redirect to bank transfer page with payment details
        router.push(`/membership/payment/bank-transfer?packageId=${selectedPackage.id}&amount=${totalCost}${isUpgrade ? `&upgrade=true&from=${fromPackageId}` : ''}`);
      } else if (selectedGateway === 'mock') {
        // Process mock payment (activation or upgrade)
        if (isUpgrade && fromPackageId) {
          await processUpgradeMutation.mutateAsync({ 
            packageId: selectedPackage.id,
            currentPackageId: fromPackageId,
            frontendCalculatedCost: totalCost // Cost validation
          });
        } else {
          await processMockPayment.mutateAsync({ 
            packageId: selectedPackage.id 
          });
        }
      } else {
        // Other payment gateways will be implemented here
        setError(`${paymentOptions.find(p => p.id === selectedGateway)?.name} integration coming soon!`);
        setProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setProcessing(false);
    }
  };

  if (isLoadingPackages) {
    return (
      <LoadingScreen 
        message="Loading Payment Options"
        subtitle="Preparing payment gateway selection..."
      />
    );
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white dark:bg-bpi-dark-card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Package Not Found</h2>
          <p className="text-muted-foreground mb-6">The selected membership package could not be found.</p>
          <Button 
            variant="outline"
            onClick={() => {
              setIsPlansLoading(true);
              router.push('/membership');
            }}
            disabled={isPlansLoading}
          >
            {isPlansLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4 mr-2" />
            )}
            {isPlansLoading ? 'Loading...' : 'Back to Membership Plans'}
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white dark:bg-bpi-dark-card p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isUpgrade ? 'Upgrade Successful!' : 'Membership Activated!'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isUpgrade 
              ? `Your membership has been upgraded to ${selectedPackage.name}. Redirecting to dashboard...`
              : `Your ${selectedPackage.name} membership is now active. Redirecting to dashboard...`
            }
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-bpi-primary" />
          </div>
        </Card>
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
              {activeMembership && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    setIsDashboardLoading(true);
                    router.push('/dashboard');
                  }}
                  disabled={isDashboardLoading || processing}
                >
                  {isDashboardLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">
                    {isDashboardLoading ? 'Loading...' : 'Dashboard'}
                  </span>
                </Button>
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
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setIsPlansLoading(true);
                  router.push('/membership');
                }}
                disabled={isPlansLoading || processing}
              >
                {isPlansLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                <span className="hidden md:inline">
                  {isPlansLoading ? 'Loading...' : 'Back to Plans'}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoggingOut(true);
                  signOut({ callbackUrl: '/login' });
                }}
                disabled={isLoggingOut || processing}
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {success ? (
          // Success Screen
          <Card className="bg-white dark:bg-bpi-dark-card p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {isUpgrade ? 'Upgrade Successful!' : 'Payment Successful!'}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {isUpgrade 
                ? `Your membership has been upgraded to ${selectedPackage.name} successfully.`
                : `Your ${selectedPackage.name} membership has been activated successfully.`
              }
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Redirecting you to your dashboard...
            </p>
            <Loader2 className="w-8 h-8 animate-spin text-bpi-primary mx-auto" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary - Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-bpi-dark-card p-6 sticky top-4">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {isUpgrade ? 'Upgrade Summary' : 'Order Summary'}
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isUpgrade ? 'Upgrading To' : 'Package'}</span>
                    <span className="font-semibold text-foreground">{selectedPackage.name}</span>
                  </div>
                  {isUpgrade && fromPackage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Plan</span>
                      <span className="font-semibold text-muted-foreground">{fromPackage.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isUpgrade ? 'New Package Price' : 'Base Price'}</span>
                    <span className="font-semibold text-foreground">{formatAmount(selectedPackage.price)}</span>
                  </div>
                  {isUpgrade && fromPackage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Package Price</span>
                      <span className="font-semibold text-muted-foreground line-through">{formatAmount(fromPackage.price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT Difference</span>
                    <span className="font-semibold text-foreground">
                      {isUpgrade && fromPackage 
                        ? formatAmount(selectedPackage.vat - fromPackage.vat)
                        : formatAmount(selectedPackage.vat)
                      }
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="font-bold text-foreground">
                        {isUpgrade ? 'Upgrade Cost' : 'Total'}
                      </span>
                      <span className="text-xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                        {formatAmount(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedGateway && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Selected Gateway
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {paymentOptions.find(p => p.id === selectedGateway)?.name}
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Payment Options - Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Select Payment Method</h2>
                <p className="text-muted-foreground">
                  {isUpgrade 
                    ? 'Choose how you\'d like to complete your membership upgrade'
                    : 'Choose how you\'d like to complete your membership activation'
                  }
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">Payment Error</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedGateway === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedGateway(option.id);
                        setError(null);
                      }}
                      disabled={!option.available || processing}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-bpi-primary bg-bpi-primary/5 dark:bg-bpi-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-bpi-primary/50'
                      } ${
                        !option.available || processing
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-bpi-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-foreground">{option.name}</h4>
                            {option.comingSoon && (
                              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded">
                                Coming Soon
                              </span>
                            )}
                            {option.regionRestricted && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded">
                                {option.regionRestricted === 'nigeria' ? 'Nigerian Users' : 'Foreign Users'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-bpi-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => {
                    setIsCancelling(true);
                    router.push('/membership');
                  }}
                  disabled={isCancelling || processing}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel'
                  )}
                </Button>
                
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handlePayment}
                  disabled={!selectedGateway || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Complete Payment (${formatAmount(totalCost)})`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
