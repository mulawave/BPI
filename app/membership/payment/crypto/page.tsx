"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Bitcoin,
  CheckCircle,
  ArrowLeft,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { PaymentPurpose } from "@/server/services/payment";
import CryptoTransferDetails from "@/components/payment/CryptoTransferDetails";

export default function CryptoPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { formatAmount } = useCurrency();

  const packageId = searchParams?.get("packageId");
  const amount = Number(searchParams?.get("amount") || 0);
  const isUpgrade = searchParams?.get("upgrade") === "true";
  const purposeParam = searchParams?.get("purpose");
  const empowermentType = searchParams?.get("empowermentType");
  const beneficiaryId = searchParams?.get("beneficiaryId");

  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitCryptoProof = api.payment.submitCryptoProof.useMutation({
    onSuccess: () => {
      toast.success("Transaction hash submitted. Awaiting admin verification.");
      router.push(
        purposeParam === "empowerment" ? "/empowerment" : "/membership"
      );
    },
    onError: (e) => {
      toast.error(e.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!txHash.trim()) {
      toast.error("Please enter your transaction hash.");
      return;
    }
    if (!amount) {
      toast.error("Missing payment amount. Please go back and try again.");
      return;
    }

    if (purposeParam === "empowerment" && (!beneficiaryId || !empowermentType)) {
      toast.error("Missing empowerment details. Please go back and try again.");
      return;
    }

    setIsSubmitting(true);

    const purpose =
      purposeParam === "empowerment"
        ? PaymentPurpose.EMPOWERMENT
        : isUpgrade
          ? PaymentPurpose.UPGRADE
          : PaymentPurpose.MEMBERSHIP;

    const resolvedPackageId =
      packageId ||
      (purpose === PaymentPurpose.EMPOWERMENT ? "empowerment" : undefined);

    submitCryptoProof.mutate({
      amount,
      currency: "USDT",
      purpose,
      txHash: txHash.trim(),
      packageId: resolvedPackageId,
      isUpgrade,
      fromPackageId: searchParams?.get("from") || undefined,
      metadata:
        purpose === PaymentPurpose.EMPOWERMENT
          ? { beneficiaryId, empowermentType }
          : undefined,
    });
  };

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
                <p className="text-sm text-muted-foreground">
                  Crypto Payment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bitcoin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Crypto Payment
          </h1>
          <p className="text-muted-foreground">
            Send {formatAmount(amount)} worth of USDT to complete your{" "}
            {purposeParam === "empowerment"
              ? "empowerment activation"
              : isUpgrade
                ? "membership upgrade"
                : "membership activation"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crypto Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-bpi-dark-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Send USDT To:
              </h2>

              <div className="space-y-4">
                {/* Amount Summary */}
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg border-2 border-orange-500">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Amount to Send
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      {formatAmount(amount)}
                    </p>
                  </div>
                </div>

                {/* Crypto Deposit Info */}
                <CryptoTransferDetails className="space-y-4" />
              </div>

              {/* Transaction Hash Input */}
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Transaction Hash *
                  </label>
                  <Input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Paste your transaction hash here"
                    className="font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Find this in your wallet&apos;s transaction history after
                    sending
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !txHash.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-bpi-dark-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Important Instructions
              </h3>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send the{" "}
                    <strong className="text-foreground">exact amount</strong> of
                    USDT shown above
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use only the{" "}
                    <strong className="text-foreground">TRC-20 network</strong>{" "}
                    — other networks will result in lost funds
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copy the transaction hash from your wallet after the
                    transfer confirms
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    4
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paste the hash and submit — your membership will be
                    activated within{" "}
                    <strong className="text-foreground">24 hours</strong> after
                    verification
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    Need Help?
                  </p>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Contact support@beepagro.africa if you encounter any issues
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
