"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TokenRate = RouterOutputs["store"]["listTokenRates"][number];
type ConfirmCheckoutIntent = RouterOutputs["store"]["confirmCheckoutIntent"];

interface Props {
  intentId: string;
  productId: string;
  quantity: number;
}

export default function CheckoutClient({ intentId, productId, quantity }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"fiat" | "hybrid" | "token">("fiat");
  const [error, setError] = useState<string | null>(null);

  const { data: product } = api.store.getProduct.useQuery({ id: productId }, { enabled: !!productId });
  const { data: tokenRates } = api.store.listTokenRates.useQuery(undefined, { enabled: !!product });
  const confirmCheckout = api.store.confirmCheckoutIntent.useMutation();

  const primaryToken = product?.accepted_tokens?.[0];
  const tokenLimit = primaryToken ? product?.token_payment_limits?.[primaryToken] ?? 0 : 0;
  const tokenRateEntry = primaryToken ? (tokenRates ?? []).find((r: TokenRate) => r.symbol === primaryToken) : undefined;
  const tokenRate = tokenRateEntry?.rate_to_fiat ?? 0;
  const tokenAllowed = primaryToken && tokenLimit > 0 && tokenRate > 0;
  const canTokenOnly = tokenAllowed && tokenLimit >= 1;

  useEffect(() => {
    // Default to hybrid when token is allowed; otherwise fiat-only.
    if (tokenAllowed) {
      setPaymentMode((prev) => (prev === "token" && !canTokenOnly ? "hybrid" : prev !== "fiat" ? prev : "hybrid"));
    } else {
      setPaymentMode("fiat");
    }
  }, [tokenAllowed, canTokenOnly]);

  const split = useMemo(() => {
    if (!product) return null;
    const qty = quantity || 1;
    const gross = product.base_price_fiat * qty;
    let tokenPortionFiat = 0;
    if (paymentMode === "hybrid" && tokenAllowed) {
      tokenPortionFiat = Math.max(0, Math.min(gross * tokenLimit, gross));
    } else if (paymentMode === "token" && canTokenOnly) {
      tokenPortionFiat = gross;
    }
    const fiatPortion = Math.max(0, gross - tokenPortionFiat);
    const tokenUnits = tokenRate > 0 ? tokenPortionFiat / tokenRate : 0;
    return { gross, tokenPortionFiat, fiatPortion, tokenUnits };
  }, [product, quantity, paymentMode, tokenAllowed, canTokenOnly, tokenLimit, tokenRate]);

  const isMissing = useMemo(() => !productId || !intentId || !product, [intentId, productId, product]);

  useEffect(() => {
    if (isMissing) {
      const msg = "Checkout intent is invalid or expired.";
      setError(msg);
      toast.error(msg);
    }
  }, [isMissing]);

  const handleConfirm = async (): Promise<void> => {
    if (isMissing || !product) {
      toast.error("Cannot confirm checkout.");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Confirming checkout...");
    try {
      const res: ConfirmCheckoutIntent = await confirmCheckout.mutateAsync({
        intentId,
        paymentMode: paymentMode.toUpperCase() as "FIAT" | "HYBRID" | "TOKEN",
      });

      const tokenMsg = split && split.tokenPortionFiat > 0 && primaryToken
        ? `Token ${primaryToken}: ${split.tokenUnits.toFixed(4)} (~${split.tokenPortionFiat.toFixed(2)} fiat), Fiat: ${split.fiatPortion.toFixed(2)}`
        : `Fiat only: ${split?.gross?.toFixed(2) ?? product.base_price_fiat.toFixed(2)}`;

      const claimMsg = res.claim_code ? `Claim code: ${res.claim_code}.` : "Claim code is being generated.";

      toast.success(`Order ${res.id ? "confirmed" : "processed"}. ${tokenMsg} ${claimMsg}`);
      router.push(`/store/orders${res.id ? `?orderId=${res.id}` : ""}`);
    } catch (err: any) {
      const message = err?.message || "Failed to confirm checkout";
      toast.error(message);
      setError(message);
    } finally {
      toast.dismiss(toastId);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-950/40 dark:via-emerald-900/30 dark:to-emerald-900/50 px-4 py-8 md:px-10 lg:px-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/store"><ArrowLeft className="h-4 w-4" /> Back to Store</Link>
          </Button>
          <div className="text-sm text-muted-foreground">Intent: {intentId || "—"}</div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white/90 dark:bg-bpi-dark-card/80 backdrop-blur shadow-2xl p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <div className="font-semibold">Checkout issue</div>
                <div>{error}</div>
              </div>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Checkout Review</p>
              <h1 className="text-2xl font-bold text-foreground">{product?.name || "Missing product"}</h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Confirm your order and proceed to payment. Rewards and token splits are applied per product guardrails.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Quantity</div>
              <div className="text-xl font-bold">{quantity || 1}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-900/20 p-4 text-sm text-emerald-900 dark:text-emerald-50 flex items-start gap-3">
            <Shield className="h-4 w-4 text-emerald-600" /> Hybrid checkout applies per-token caps and splits the payment across fiat and tokens.
          </div>

          {(!product || !primaryToken || !tokenAllowed) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 text-amber-900 px-3 py-2 text-sm flex gap-2 items-start dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>{!product ? "Product not found." : !primaryToken ? "No accepted token configured for this product." : "Token payment currently unavailable; defaulting to fiat."}</span>
            </div>
          )}

          <div className="rounded-2xl border border-border/50 bg-background/80 dark:bg-bpi-dark-card/70 backdrop-blur p-4 grid gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={paymentMode === "fiat" ? "default" : "outline"} onClick={() => setPaymentMode("fiat")}>Fiat only</Button>
              <Button size="sm" variant={paymentMode === "hybrid" ? "default" : "outline"} onClick={() => setPaymentMode("hybrid")} disabled={!tokenAllowed}>Hybrid (token + fiat)</Button>
              <Button size="sm" variant={paymentMode === "token" ? "default" : "outline"} onClick={() => setPaymentMode("token")} disabled={!canTokenOnly}>Token only</Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal (fiat peg)</span>
              <span className="font-semibold text-foreground">{split ? split.gross.toFixed(2) : "—"}</span>
            </div>
            {primaryToken && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token portion ({primaryToken} up to {(tokenLimit * 100).toFixed(0)}%)</span>
                <span className="font-semibold text-foreground">{split ? `${split.tokenUnits.toFixed(4)} ${primaryToken} (~${split.tokenPortionFiat.toFixed(2)})` : "—"}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fiat portion</span>
              <span className="font-semibold text-foreground">{split ? split.fiatPortion.toFixed(2) : "—"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
              onClick={handleConfirm}
              disabled={submitting || isMissing || !split}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming...
                </span>
              ) : (
                "Confirm and Pay"
              )}
            </Button>
            <Button variant="outline" disabled={submitting} onClick={() => router.push(`/store/${productId || ""}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
