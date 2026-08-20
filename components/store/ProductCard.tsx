"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ArrowRight,
  Loader2,
  Sparkles,
  Coins,
  Eye,
} from "lucide-react";
import { api } from "@/client/trpc";
import { useCart } from "@/lib/cart-context";
import toast from "react-hot-toast";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export function formatProductPrice(product: Product): string {
  const mode = String((product as any).pricing_mode ?? "fiat").toLowerCase();
  if (mode === "token_unit") {
    const symbol = String((product as any).token_unit_symbol ?? "").toUpperCase();
    const amount = Number((product as any).token_unit_amount ?? 0);
    if (symbol && Number.isFinite(amount) && amount > 0)
      return `${amount} ${symbol}`;
    return "Token-unit";
  }
  return formatCurrency(product.base_price_fiat);
}

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
}

export default function ProductCard({ product, view = "grid" }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const checkoutMutation = api.store.createCheckoutIntent.useMutation();

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setAdding(true);
      addItem({
        productId: product.product_id,
        name: product.name,
        price: product.base_price_fiat,
        image: product.images?.[0] || "/img/default.jpg",
        productType: product.product_type,
        pricingMode: String((product as any).pricing_mode ?? "fiat"),
      });
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAdding(false), 600);
    },
    [addItem, product],
  );

  const handleQuickBuy = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setAdding(true);
      const loadingId = toast.loading(`Opening checkout for ${product.name}...`);
      try {
        const res = await checkoutMutation.mutateAsync({
          productId: product.product_id,
          quantity: 1,
        });
        const redirect =
          res.redirectUrl ||
          `/checkout?intent=${res.intentId}&productId=${product.product_id}&quantity=1`;
        router.push(redirect);
      } catch (err: any) {
        toast.error(err?.message || "Failed to start checkout");
      } finally {
        toast.dismiss(loadingId);
        setAdding(false);
      }
    },
    [checkoutMutation, product, router],
  );

  const handleViewDetails = useCallback(() => {
    setNavigating(true);
    router.push(`/store/${product.product_id}`);
  }, [router, product.product_id]);

  const productTypeLabel =
    product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1);

  if (view === "list") {
    return (
      <div
        className="group flex gap-4 rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md ring-1 ring-amber-300/10 p-3 hover:shadow-lg transition-all cursor-pointer"
        onClick={handleViewDetails}
      >
        {/* Image */}
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
          <img
            src={product.images?.[0] || "/img/default.jpg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/img/default.jpg";
            }}
          />
          {product.inventory_type === "limited" && (
            <span className="absolute left-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
              Limited
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">
                {product.description}
              </p>
            </div>
            <span className="flex-shrink-0 text-sm sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatProductPrice(product)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-auto">
            <Badge variant="outline" className="text-[10px] uppercase">
              {productTypeLabel}
            </Badge>
            {product.hero_badge && (
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {product.hero_badge}
              </Badge>
            )}
            {product.accepted_tokens.slice(0, 2).map((t: string) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-400"
              >
                <Coins className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={adding}
              className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-8"
            >
              {adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickBuy}
              disabled={adding}
              className="text-xs h-8"
            >
              Quick Buy
            </Button>
            {navigating && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex flex-col rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 overflow-hidden hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
      onClick={handleViewDetails}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={product.images?.[0] || "/img/default.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/img/default.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.hero_badge && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-md">
              {product.hero_badge}
            </span>
          )}
          {product.inventory_type === "limited" && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-md">
              <Sparkles className="h-2.5 w-2.5" /> Limited
            </span>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span className="rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:text-slate-300 shadow-sm">
            {productTypeLabel}
          </span>
        </div>

        {/* Quick view overlay */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur p-1.5 shadow-md">
            <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 flex-1">
          {product.description}
        </p>

        {/* Token chips */}
        {product.accepted_tokens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.accepted_tokens.slice(0, 3).map((t: string) => (
              <span
                key={t}
                className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"
              >
                <Coins className="h-2.5 w-2.5" /> {t}
              </span>
            ))}
          </div>
        )}

        {/* Price + Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <div className="text-[10px] text-slate-400">Price</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatProductPrice(product)}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            aria-label="Add to cart"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
