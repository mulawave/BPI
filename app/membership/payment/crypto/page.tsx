"use client";

import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AlertCircle,
  ArrowLeft,
  Bitcoin,
  CheckCircle,
  Copy,
  Loader2,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Wallet,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

const ACTIVE_STATUSES = new Set(["pending", "processing", "blockchain_awaiting"]);

function getStatusPresentation(status: string | undefined) {
  switch (status) {
    case "completed":
    case "approved":
      return {
        label: "Payment confirmed",
        accent: "text-emerald-600 dark:text-emerald-400",
        surface: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900",
        icon: CheckCircle,
        description: "Your payment has been confirmed. Your membership flow is being completed.",
      };
    case "blockchain_awaiting":
      return {
        label: "Awaiting confirmations",
        accent: "text-amber-600 dark:text-amber-400",
        surface: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
        icon: RefreshCw,
        description: "The blockchain transaction has been detected. We are waiting for final confirmations from the provider.",
      };
    case "overpaid":
    case "underpaid":
    case "rejected":
    case "abandoned":
      return {
        label: "Needs attention",
        accent: "text-rose-600 dark:text-rose-400",
        surface: "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900",
        icon: XCircle,
        description: "This payment could not be completed automatically. Contact support with your reference if you already sent funds.",
      };
    default:
      return {
        label: "Awaiting payment",
        accent: "text-bpi-primary",
        surface: "bg-bpi-primary/5 border-bpi-primary/20",
        icon: Loader2,
        description: "Send the exact provider amount to the provider-generated address shown below.",
      };
  }
}

export default function CryptoPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { formatAmount } = useCurrency();
  const reference = searchParams?.get("reference") || "";

  const paymentQuery = api.package.getMembershipCryptoPayment.useQuery(
    { reference },
    {
      enabled: !!reference,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status && ACTIVE_STATUSES.has(status) ? 10000 : false;
      },
      retry: false,
    }
  );

  const payment = paymentQuery.data;
  const statusInfo = getStatusPresentation(payment?.status);
  const StatusIcon = statusInfo.icon;
  const isCompleted = payment?.status === "completed" || payment?.status === "approved";
  const isActive = payment?.status ? ACTIVE_STATUSES.has(payment.status) : false;

  useEffect(() => {
    if (!isCompleted) return;

    const timer = window.setTimeout(() => {
      router.push("/membership");
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isCompleted, router]);

  const copyValue = async (value: string | null | undefined, label: string) => {
    if (!value) {
      toast.error(`${label} is not available yet.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}.`);
    }
  };

  const title = payment?.transactionType === "MEMBERSHIP_UPGRADE"
    ? "Membership Upgrade"
    : "Membership Activation";

  if (!reference) {
    return (
      <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white dark:bg-bpi-dark-card p-8 text-center border border-bpi-border/30 dark:border-bpi-dark-accent/30">
          <XCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid crypto payment link</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This page requires a payment reference. Start the membership payment flow again to generate a Basqet payment session.
          </p>
          <Button onClick={() => router.push("/membership")} className="w-full bg-gradient-to-r from-bpi-primary to-bpi-secondary text-white">
            Back to Membership
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                  BeepAgro Africa
                </h1>
                <p className="text-sm text-muted-foreground">Automated USDT payment</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push("/membership")}>
                <ArrowLeft className="w-4 h-4" />
                Membership
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Bitcoin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{title} via Basqet</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This is an automated provider-generated USDT payment. Do not use the manual admin USDT address for this payment.
          </p>
        </div>

        {paymentQuery.isLoading ? (
          <Card className="max-w-xl mx-auto bg-white dark:bg-bpi-dark-card p-8 text-center border border-bpi-border/30 dark:border-bpi-dark-accent/30">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-bpi-primary mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading payment details</h2>
            <p className="text-sm text-muted-foreground">Fetching the provider address, amount, and payment status for reference {reference}.</p>
          </Card>
        ) : paymentQuery.error || !payment ? (
          <Card className="max-w-xl mx-auto bg-white dark:bg-bpi-dark-card p-8 text-center border border-rose-200 dark:border-rose-900">
            <XCircle className="w-10 h-10 mx-auto text-rose-500 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Payment not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {paymentQuery.error?.message || "We could not load this crypto membership payment."}
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-muted/40 dark:bg-muted/10 rounded-lg px-4 py-3 mb-6">
              Ref: {reference}
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => paymentQuery.refetch()} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              <Button onClick={() => router.push("/membership")} className="w-full bg-gradient-to-r from-bpi-primary to-bpi-secondary text-white">
                Back to Membership
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
            <Card className="bg-white dark:bg-bpi-dark-card p-6 border border-bpi-border/30 dark:border-bpi-dark-accent/30 shadow-xl shadow-black/5 dark:shadow-black/20">
              <div className={`rounded-2xl border px-4 py-4 mb-6 ${statusInfo.surface}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`w-5 h-5 mt-0.5 ${statusInfo.accent} ${payment?.status === "pending" ? "animate-spin" : ""}`} />
                  <div>
                    <h2 className={`text-lg font-semibold ${statusInfo.accent}`}>{statusInfo.label}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{statusInfo.description}</p>
                    {payment.reviewNotes ? (
                      <p className="text-xs text-muted-foreground mt-3">{payment.reviewNotes}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-bpi-border/30 dark:border-bpi-dark-accent/30 p-5 bg-muted/30 dark:bg-muted/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-2">Provider amount</p>
                  <p className="text-3xl font-bold text-foreground">
                    {payment.cryptoDetails.amountCrypto != null ? `${payment.cryptoDetails.amountCrypto} ${payment.cryptoDetails.cryptoCurrency}` : "Pending"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Membership value: {formatAmount(payment.amountNgn)}
                  </p>
                </div>
                <div className="rounded-2xl border border-bpi-border/30 dark:border-bpi-dark-accent/30 p-5 bg-muted/30 dark:bg-muted/10">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-2">Network guidance</p>
                  <p className="text-xl font-semibold text-foreground">
                    {payment.cryptoDetails.cryptoNetwork || "Provider supplied"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {payment.cryptoDetails.networkInstruction || "Use the network compatible with this provider-generated address."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-bpi-border/30 dark:border-bpi-dark-accent/30 p-5 bg-white/60 dark:bg-bpi-dark/20 mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Provider-generated address</p>
                    <p className="text-sm text-muted-foreground mt-1">Send only the exact provider amount to this address.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => copyValue(payment.cryptoDetails.address, "Payment address")}
                    disabled={!payment.cryptoDetails.address}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-xl bg-muted/50 dark:bg-black/20 border border-dashed border-bpi-border/40 dark:border-bpi-dark-accent/40 px-4 py-4 font-mono text-sm break-all text-foreground">
                  {payment.cryptoDetails.address || "Waiting for provider address"}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => copyValue(payment.reference, "Reference")}
                >
                  <Copy className="w-4 h-4" />
                  Copy Reference
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => paymentQuery.refetch()}
                  disabled={paymentQuery.isFetching}
                >
                  {paymentQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh Status
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="bg-white dark:bg-bpi-dark-card p-6 border border-bpi-border/30 dark:border-bpi-dark-accent/30 shadow-xl shadow-black/5 dark:shadow-black/20">
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="w-5 h-5 text-bpi-primary" />
                  <h3 className="text-lg font-semibold text-foreground">QR and payment check</h3>
                </div>

                {payment.cryptoDetails.qrCode ? (
                  <div className="rounded-2xl border border-bpi-border/30 dark:border-bpi-dark-accent/30 p-4 bg-muted/20 dark:bg-black/10">
                    <img
                      src={payment.cryptoDetails.qrCode}
                      alt="Provider payment QR code"
                      className="w-full max-w-[260px] mx-auto rounded-xl bg-white p-3"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-bpi-border/30 dark:border-bpi-dark-accent/30 p-6 text-center text-sm text-muted-foreground">
                    QR code not available for this payment session.
                  </div>
                )}

                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 mt-0.5 text-bpi-primary" />
                    <p>Use this provider session only. Manual admin USDT instructions do not apply here.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-bpi-primary" />
                    <p>Send the exact provider amount shown on this page. Underpayments and overpayments can require manual review.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-4 h-4 mt-0.5 text-bpi-primary" />
                    <p>We refresh the payment status automatically while the payment remains active.</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white dark:bg-bpi-dark-card p-6 border border-bpi-border/30 dark:border-bpi-dark-accent/30 shadow-xl shadow-black/5 dark:shadow-black/20">
                <h3 className="text-lg font-semibold text-foreground mb-4">Session details</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-1">Reference</p>
                    <p className="font-mono text-foreground break-all">{payment.reference}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-1">Provider</p>
                    <p className="text-foreground">{payment.cryptoDetails.provider || "Basqet"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-1">Address source</p>
                    <p className="text-foreground">{payment.cryptoDetails.addressSource || "provider"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-1">Status</p>
                    <p className="text-foreground">{payment.status}</p>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-300">
                    Payment confirmed. Redirecting you back to membership.
                  </div>
                ) : isActive ? (
                  <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-4 text-sm text-amber-700 dark:text-amber-300">
                    Waiting for provider confirmation. Keep this page open or return later with your reference.
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 px-4 py-4 text-sm text-rose-700 dark:text-rose-300">
                    This payment session is no longer active. Contact support if funds were already sent.
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
