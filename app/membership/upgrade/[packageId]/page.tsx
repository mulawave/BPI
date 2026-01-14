"use client";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ArrowLeft, Check, TrendingUp, Shield, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import toast from "react-hot-toast";

export default function UpgradePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  
  const packageId = params.packageId as string;
  const fromPackageId = searchParams.get("from");
  
  const { data: newPackage, isLoading: loadingNew } = api.package.getPackages.useQuery(undefined, {
    select: (packages) => packages.find(p => p.id === packageId),
  });
  
  const { data: currentPackage, isLoading: loadingCurrent } = api.package.getPackages.useQuery(undefined, {
    select: (packages) => packages.find(p => p.id === fromPackageId),
    enabled: !!fromPackageId,
  });
  
  const upgradeMutation = api.package.processUpgradePayment.useMutation();
  const [processing, setProcessing] = useState(false);

  const upgradeCost = newPackage && currentPackage 
    ? (newPackage.price + newPackage.vat) - (currentPackage.price + currentPackage.vat)
    : 0;

  const handleUpgrade = async () => {
    if (!newPackage || !currentPackage || !fromPackageId) return;
    
    setProcessing(true);
    try {
      const result = await upgradeMutation.mutateAsync({
        packageId: newPackage.id,
        currentPackageId: fromPackageId,
      });

      toast.success(
        `${result.message} • Upgrade Cost: ${formatAmount(result.upgradeCost)} • New Expiry: ${new Date(result.newExpiry).toLocaleDateString()}`
      );
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(`Upgrade failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loadingNew || loadingCurrent) {
    return (
      <LoadingScreen 
        message="Loading Upgrade Details"
        subtitle="Calculating upgrade cost and benefits..."
      />
    );
  }

  if (!newPackage || !currentPackage) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-red-600 mb-4">Package not found</p>
          <Link href="/membership">
            <Button>Back to Membership</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Header */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/membership">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Upgrade Your Membership</h1>
          <p className="text-muted-foreground">
            Enhance your experience with {newPackage.name}
          </p>
        </div>

        {/* Upgrade Comparison */}
        <Card className="p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Current Package */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Current Plan</p>
              <h3 className="text-2xl font-bold text-foreground mb-2">{currentPackage.name}</h3>
              <p className="text-3xl font-extrabold text-gray-600 dark:text-gray-400">
                {formatAmount(currentPackage.price + currentPackage.vat)}
              </p>
            </div>

            {/* New Package */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-500">
              <p className="text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">Upgrading To</p>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">{newPackage.name}</h3>
              <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">
                {formatAmount(newPackage.price + newPackage.vat)}
              </p>
            </div>
          </div>

          {/* Upgrade Cost */}
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">
              You Only Pay The Difference
            </p>
            <p className="text-5xl font-extrabold text-green-800 dark:text-green-300 mb-2">
              {formatAmount(upgradeCost)}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              ({formatAmount(newPackage.price + newPackage.vat)} - {formatAmount(currentPackage.price + currentPackage.vat)})
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="font-semibold text-foreground mb-4">What You Get:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-foreground">Fresh 1-year validity period from upgrade date</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-foreground">Differential bonuses paid to your referrers (L1-L4)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-foreground">Access to all {newPackage.name} tier benefits and features</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-foreground">Increased referral rewards for future referrals</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handleUpgrade}
            disabled={processing}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Upgrade...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay {formatAmount(upgradeCost)} & Upgrade Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Mock payment gateway - Upgrade will be processed immediately
          </p>
        </Card>
      </main>
    </div>
  );
}
