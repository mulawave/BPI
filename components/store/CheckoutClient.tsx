"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Shield,
  ArrowLeft,
  AlertTriangle,
  Wallet,
  Bitcoin,
  CheckCircle2,
  ShoppingBag,
  Coins,
  Tag,
  Lock,
} from "lucide-react";
import { api } from "@/client/trpc";
import { useCart } from "@/lib/cart-context";
import { useCurrency } from "@/contexts/CurrencyContext";
import toast from "react-hot-toast";
import { PaymentPurpose } from "@/server/services/payment";
import CryptoTransferDetails from "@/components/payment/CryptoTransferDetails";
import { Input } from "@/components/ui/input";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TokenRate = RouterOutputs["store"]["listTokenRates"][number];
type Product = RouterOutputs["store"]["getProduct"];
type ConfirmCheckoutIntent = RouterOutputs["store"]["confirmCheckoutIntent"];

interface Props {
  intentId?: string;
  productId?: string;
  quantity?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

type PaymentMode = "fiat" | "hybrid" | "token" | "crypto";

export default function CheckoutClient({ intentId = "", productId = "", quantity = 1 }: Props) {
  const router = useRouter();
  const { selectedCurrency } = useCurrency();
  const isCryptoAllowed = selectedCurrency?.symbol !== "NGN";
  const { items, clearCart, totalItems, totalPrice } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("fiat");
  const [cashbackInsufficient, setCashbackInsufficient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cryptoTxHash, setCryptoTxHash] = useState("");
  const [successResults, setSuccessResults] = useState<{ orderId: string; claimCode?: string }[]>([]);

  const isCartCheckout = !intentId && !productId;
  const hasIntent = !!intentId && !!productId;

  const { data: product, isLoading: productLoading } = api.store.getProduct.useQuery(
    { id: productId },
    { enabled: !!productId },
  );
  const { data: tokenRates } = api.store.listTokenRates.useQuery(undefined, {
    enabled: !!product || isCartCheckout,
  });
  const confirmCheckout = api.store.confirmCheckoutIntent.useMutation();
  const createIntent = api.store.createCheckoutIntent.useMutation();
  const submitCryptoProof = api.payment.submitCryptoProof.useMutation({
    onSuccess: () => {
      toast.success("Crypto proof submitted. Awaiting admin approval for your order.");
      router.push("/store/orders");
    },
    onError: (err) => {
      toast.error(err.message);
      setSubmitting(false);
    },
  });

  // Single-product token info
  const primaryToken = product?.accepted_tokens?.[0];
  const tokenLimit = primaryToken ? product?.token_payment_limits?.[primaryToken] ?? 0 : 0;
  const tokenRateEntry = primaryToken
    ? (tokenRates ?? []).find((r: TokenRate) => r.symbol === primaryToken)
    : undefined;
  const tokenRate = tokenRateEntry?.rate_to_fiat ?? 0;
  const tokenAllowed = !!primaryToken && tokenLimit > 0 && tokenRate > 0;
  const canTokenOnly = tokenAllowed && tokenLimit >= 1;

  useEffect(() => {
    if (tokenAllowed) {
      setPaymentMode((prev) => (prev === "token" && !canTokenOnly ? "hybrid" : prev !== "fiat" ? prev : "hybrid"));
    } else {
      setPaymentMode("fiat");
    }
  }, [tokenAllowed, canTokenOnly]);

  const split = useMemo(() => {
    if (isCartCheckout) {
      const gross = totalPrice;
      return { gross, tokenPortionFiat: 0, fiatPortion: gross, tokenUnits: 0 };
    }
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
  }, [isCartCheckout, totalPrice, product, quantity, paymentMode, tokenAllowed, canTokenOnly, tokenLimit, tokenRate]);

  const isMissing = useMemo(
    () => !isCartCheckout && !productLoading && (!productId || !intentId || !product),
    [isCartCheckout, productId, intentId, product, productLoading],
  );

  useEffect(() => {
    if (isMissing) {
      setError("Checkout intent is invalid or expired.");
    }
  }, [isMissing]);

  // Cart checkout: process each item sequentially
  const handleCartCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessResults([]);
    const results: { orderId: string; claimCode?: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const toastId = toast.loading(`Processing ${item.name} (${i + 1}/${items.length})...`);
      try {
        const intent = await createIntent.mutateAsync({
          productId: item.productId,
          quantity: item.quantity,
        });

        const res: ConfirmCheckoutIntent = await confirmCheckout.mutateAsync({
          intentId: intent.intentId,
          paymentMode: "FIAT",
          paymentSource: "cashback",
        });

        results.push({
          orderId: res.id,
          claimCode: res.claim_code,
        });
        toast.dismiss(toastId);
      } catch (err: any) {
        toast.dismiss(toastId);
        const message = err?.message || `Failed to checkout ${item.name}`;
        const isInsufficient =
          message.toLowerCase().includes("cashback") &&
          (message.toLowerCase().includes("insufficient") || message.toLowerCase().includes("balance"));
        if (isInsufficient) {
          setCashbackInsufficient(true);
          toast.error("Insufficient Cashback Wallet balance. Transfer from Main Wallet first.");
          setError(message);
          break;
        }
        toast.error(message);
        setError(message);
        break;
      }
    }

    if (results.length === items.length) {
      clearCart();
      toast.success(`All ${results.length} order(s) confirmed!`);
      setSuccessResults(results);
      setTimeout(() => {
        router.push("/store/orders");
      }, 2000);
    } else if (results.length > 0) {
      toast.success(`${results.length} order(s) confirmed. ${items.length - results.length} failed.`);
      setSuccessResults(results);
    }

    setSubmitting(false);
  };

  const handleSingleConfirm = async () => {
    if (isMissing || !product) {
      toast.error("Cannot confirm checkout.");
      return;
    }

    if (paymentMode === "crypto") {
      if (!cryptoTxHash.trim()) {
        toast.error("Please enter your transaction hash.");
        return;
      }
      setSubmitting(true);
      const toastId = toast.loading("Submitting crypto proof...");
      try {
        await submitCryptoProof.mutateAsync({
          amount: split?.gross ?? product.base_price_fiat * (quantity || 1),
          currency: "USDT",
          purpose: PaymentPurpose.STORE_PURCHASE,
          txHash: cryptoTxHash.trim(),
          metadata: { intentId, productId, quantity },
        });
      } catch {
        // handled by onError
      } finally {
        toast.dismiss(toastId);
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Confirming checkout...");
    try {
      const res: ConfirmCheckoutIntent = await confirmCheckout.mutateAsync({
        intentId,
        paymentMode: paymentMode.toUpperCase() as "FIAT" | "HYBRID" | "TOKEN",
        paymentSource: "cashback",
      });

      const tokenMsg =
        split && split.tokenPortionFiat > 0 && primaryToken
          ? `Token ${primaryToken}: ${split.tokenUnits.toFixed(4)}, Cashback: ${formatCurrency(split.fiatPortion)}`
          : `Cashback Wallet: ${formatCurrency(split?.gross ?? product.base_price_fiat)}`;

      const claimMsg = res.claim_code ? `Claim code: ${res.claim_code}.` : "Claim code is being generated.";
      toast.success(`Order confirmed. ${tokenMsg} ${claimMsg}`);
      router.push(`/store/orders${res.id ? `?orderId=${res.id}` : ""}`);
    } catch (err: any) {
      const message = err?.message || "Failed to confirm checkout";
      const isInsufficientCashback =
        message.toLowerCase().includes("cashback") &&
        (message.toLowerCase().includes("insufficient") || message.toLowerCase().includes("balance"));
      if (isInsufficientCashback) setCashbackInsufficient(true);
      toast.error(
        isInsufficientCashback
          ? "Insufficient Cashback Wallet balance. Transfer from Main Wallet first."
          : message,
      );
      setError(message);
    } finally {
      toast.dismiss(toastId);
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (isCartCheckout) {
      handleCartCheckout();
    } else {
      handleSingleConfirm();
    }
  };

  // Success state
  if (successResults.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-8 text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-600">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Order{successResults.length > 1 ? "s" : ""} Confirmed!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {successResults.length} order{successResults.length > 1 ? "s" : ""} successfully placed. Redirecting to your orders...
          </p>
          <div className="space-y-2 text-left max-w-sm mx-auto">
            {successResults.map((r) => (
              <div key={r.orderId} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 p-3 text-sm">
                <span className="text-slate-500">Order ID:</span>{" "}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{r.orderId.slice(0, 12)}...</span>
                {r.claimCode && (
                  <div className="mt-1">
                    <span className="text-slate-500">Claim code:</span>{" "}
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{r.claimCode}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={() => router.push("/store/orders")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            View Orders
          </Button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isCartCheckout && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Your cart is empty</p>
            <p className="text-sm text-slate-400 mt-1">Add some products before checking out.</p>
          </div>
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Link href="/store">Browse Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayItems = isCartCheckout
    ? items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
        productType: i.productType,
      }))
    : [
        {
          name: product?.name || "Product",
          quantity: quantity || 1,
          price: product?.base_price_fiat ?? 0,
          image: product?.images?.[0] || "/img/default.jpg",
          productType: product?.product_type ?? "",
        },
      ];

  const grossTotal = isCartCheckout ? totalPrice : split?.gross ?? 0;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/store">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          Secure Checkout
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Items + Payment */}
        <div className="space-y-4">
          {/* Cashback insufficient warning */}
          {cashbackInsufficient && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 px-4 py-3 text-sm dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
              <Wallet className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Insufficient Cashback Wallet balance</div>
                <div className="mt-0.5">
                  Your Cashback Wallet balance is too low. Transfer funds from your{" "}
                  <strong>Main Wallet</strong> to your <strong>Cashback Wallet</strong> first.
                </div>
                <Link
                  href="/dashboard?tab=wallet"
                  className="mt-1.5 inline-block text-amber-700 dark:text-amber-300 underline font-medium"
                >
                  Go to Wallet →
                </Link>
              </div>
            </div>
          )}

          {error && !cashbackInsufficient && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <div className="font-semibold">Checkout issue</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                Order Items ({displayItems.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 p-4">
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/img/default.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs uppercase text-slate-400 mt-0.5">{item.productType}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method (single-item only — cart uses fiat) */}
          {!isCartCheckout && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payment Method</h2>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setPaymentMode("fiat"); setCashbackInsufficient(false); }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all",
                    paymentMode === "fiat"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300",
                  )}
                >
                  <Wallet className="h-4 w-4" /> 100% Cashback
                </button>
                <button
                  onClick={() => { setPaymentMode("hybrid"); setCashbackInsufficient(false); }}
                  disabled={!tokenAllowed}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    paymentMode === "hybrid"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300",
                  )}
                >
                  <Coins className="h-4 w-4" /> BPT + Cashback
                </button>
                <button
                  onClick={() => { setPaymentMode("token"); setCashbackInsufficient(false); }}
                  disabled={!canTokenOnly}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    paymentMode === "token"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300",
                  )}
                >
                  <Coins className="h-4 w-4" /> 100% BPT
                </button>
                <button
                  onClick={() => { setPaymentMode("crypto"); setCashbackInsufficient(false); }}
                  disabled={!isCryptoAllowed}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    paymentMode === "crypto"
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300",
                  )}
                  title={!isCryptoAllowed ? "Switch currency to USD to unlock crypto" : ""}
                >
                  <Bitcoin className="h-4 w-4" /> Crypto (USDT)
                </button>
              </div>

              {/* Crypto details */}
              {paymentMode === "crypto" && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <CryptoTransferDetails className="space-y-3" />
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Transaction Hash *
                    </label>
                    <Input
                      type="text"
                      value={cryptoTxHash}
                      onChange={(e) => setCryptoTxHash(e.target.value)}
                      placeholder="Paste your transaction hash here"
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Send the exact USDT amount, then paste the tx hash above.
                    </p>
                  </div>
                </div>
              )}

              {/* Token warning */}
              {(!product || !primaryToken || !tokenAllowed) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 text-amber-900 px-3 py-2 text-xs flex gap-2 items-start dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
                  <span>
                    {!product
                      ? "Product not found."
                      : !primaryToken
                        ? "No accepted token configured for this product."
                        : "Token payment currently unavailable; defaulting to fiat."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cart checkout info */}
          {isCartCheckout && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
              <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>
                Cart checkout processes each item as a separate order using your <strong>Cashback Wallet</strong>.
                Make sure you have sufficient balance. Token-based checkout is available on individual product pages.
              </span>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-500" /> Order Summary
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Items ({isCartCheckout ? totalItems : quantity || 1})
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(grossTotal)}
                </span>
              </div>

              {!isCartCheckout && split && split.tokenPortionFiat > 0 && primaryToken && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Token ({primaryToken})
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {split.tokenUnits.toFixed(4)} {primaryToken}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Token fiat value</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      −{formatCurrency(split.tokenPortionFiat)}
                    </span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    isCartCheckout
                      ? totalPrice
                      : split?.fiatPortion ?? grossTotal,
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              {isCartCheckout
                ? "Paid via Cashback Wallet"
                : paymentMode === "crypto"
                  ? "Crypto payment — admin verified"
                  : "Hybrid checkout with token support"}
            </div>

            <Button
              onClick={handleConfirm}
              disabled={submitting || (isCartCheckout && items.length === 0) || (!isCartCheckout && isMissing)}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              size="lg"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isCartCheckout ? "Processing..." : "Confirming..."}
                </span>
              ) : (
                <>
                  {isCartCheckout ? `Pay ${formatCurrency(totalPrice)}` : "Confirm and Pay"}
                  <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => router.push("/store")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
