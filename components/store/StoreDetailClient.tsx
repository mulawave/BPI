"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Gift,
  Shield,
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  MapPin,
} from "lucide-react";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { useCart } from "@/lib/cart-context";
import { formatProductPrice } from "./ProductCard";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];

type Props = { product: Product };

type Tab = "description" | "rewards" | "shipping";

export default function StoreDetailClient({ product }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem, openCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const autoCheckoutTriggered = useRef(false);
  const touchStartX = useRef<number | null>(null);

  const checkoutMutation = api.store.createCheckoutIntent.useMutation();
  const externalCheckoutMutation = api.store.createExternalTokenCheckoutIntent.useMutation();
  const { data: catalog } = api.store.listProducts.useQuery({ status: "active" });
  const catalogProducts: Product[] = catalog ?? [];

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    const toastId = toast.loading("Opening checkout...");
    try {
      const isTokenUnit =
        String((product as any).pricing_mode ?? "fiat").toLowerCase() === "token_unit";
      const res = isTokenUnit
        ? await externalCheckoutMutation.mutateAsync({
            productId: product.product_id,
            quantity,
          })
        : await checkoutMutation.mutateAsync({
            productId: product.product_id,
            quantity,
          });
      const redirect =
        res.redirectUrl ||
        `/checkout?intent=${res.intentId}&productId=${product.product_id}&quantity=${quantity}`;
      router.replace(redirect);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start checkout");
    } finally {
      toast.dismiss(toastId);
      setCheckoutLoading(false);
    }
  }, [checkoutMutation, externalCheckoutMutation, product, quantity, router]);

  useEffect(() => {
    if (searchParams.get("checkout") === "1" && !autoCheckoutTriggered.current) {
      autoCheckoutTriggered.current = true;
      startCheckout();
    }
  }, [searchParams, startCheckout]);

  const galleryImages = useMemo<string[]>(() => {
    const primary = product?.images?.[0] || "/img/default.jpg";
    const extras = catalogProducts
      .filter((p: Product) => p.product_id !== product.product_id)
      .slice(0, 4)
      .map((p: Product) => p.images?.[0] || "/img/default.jpg");
    const images = [primary, ...extras];
    return Array.from(new Set<string>(images));
  }, [catalogProducts, product]);

  useEffect(() => {
    if (!selectedImage && galleryImages.length) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages, selectedImage]);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!galleryImages.length || !selectedImage) return;
      const idx = galleryImages.indexOf(selectedImage);
      if (idx === -1) return;
      const nextIdx =
        direction === "left"
          ? (idx + 1) % galleryImages.length
          : (idx - 1 + galleryImages.length) % galleryImages.length;
      setSelectedImage(galleryImages[nextIdx]);
    },
    [galleryImages, selectedImage],
  );

  const similarProducts = useMemo<Product[]>(
    () =>
      catalogProducts
        .filter(
          (p: Product) =>
            p.status === "active" &&
            p.product_type === product.product_type &&
            p.product_id !== product.product_id,
        )
        .slice(0, 4),
    [catalogProducts, product.product_id, product.product_type],
  );

  const rewards = useMemo(() => product.reward_config, [product.reward_config]);

  const handleAddToCart = useCallback(() => {
    setAddingToCart(true);
    addItem(
      {
        productId: product.product_id,
        name: product.name,
        price: product.base_price_fiat,
        image: product.images?.[0] || "/img/default.jpg",
        productType: product.product_type,
        pricingMode: String((product as any).pricing_mode ?? "fiat"),
      },
      quantity,
    );
    toast.success(`${quantity} × ${product.name} added to cart`);
    setTimeout(() => setAddingToCart(false), 600);
  }, [addItem, product, quantity]);

  const productTypeLabel =
    product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1);

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "description", label: "Description", icon: Package },
    { id: "rewards", label: "Rewards", icon: Gift },
    { id: "shipping", label: "Pickup & Shipping", icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/store"
          className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 30) {
                handleSwipe(delta < 0 ? "left" : "right");
              }
              touchStartX.current = null;
            }}
          >
            <img
              src={selectedImage || product.images?.[0] || "/img/default.jpg"}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/img/default.jpg";
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />

            {/* Nav arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => handleSwipe("right")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur p-2 shadow-md hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </button>
                <button
                  onClick={() => handleSwipe("left")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur p-2 shadow-md hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.hero_badge && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-md">
                  {product.hero_badge}
                </span>
              )}
              {product.inventory_type === "limited" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-md">
                  <Sparkles className="h-3 w-3" /> Limited
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img: string) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    selectedImage === img
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300",
                  )}
                >
                  <img
                    src={img}
                    alt="Product thumbnail"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/img/default.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Title + Type */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase">
                {productTypeLabel}
              </Badge>
              {product.category && (
                <Badge variant="outline" className="text-[10px]">
                  {product.category}
                </Badge>
              )}
              {product.vendor && (
                <span className="text-xs text-slate-400">by {product.vendor}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatProductPrice(product)}
            </span>
            {String((product as any).pricing_mode ?? "fiat").toLowerCase() === "fiat" && (
              <span className="text-sm text-slate-400">per unit</span>
            )}
          </div>

          {/* Short description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* Accepted tokens */}
          {product.accepted_tokens.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.accepted_tokens.map((t: string) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  <Coins className="h-3.5 w-3.5 text-emerald-500" />
                  {t} up to {Math.round((product.token_payment_limits[t] || 0) * 100)}%
                </span>
              ))}
            </div>
          )}

          {/* Reward chips */}
          {rewards.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-500" /> Rewards
              </div>
              <div className="flex flex-wrap gap-2">
                {rewards.map((reward: Product["reward_config"][number]) => (
                  <Badge
                    key={reward.reward_id}
                    variant="outline"
                    className="border-emerald-400/50 text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"
                  >
                    {reward.reward_value}
                    {reward.reward_value_type === "PERCENTAGE" ? "%" : ""}{" "}
                    {reward.reward_type === "CASH"
                      ? "Cash"
                      : reward.reward_type === "CASHBACK"
                        ? "Cashback"
                        : reward.reward_type === "BPT"
                          ? "BPT"
                          : reward.utility_token_symbol || "Utility"}
                    {" • "}
                    {reward.vesting_rule}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</span>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-base font-bold text-slate-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart}
              variant="outline"
              size="lg"
              className="flex-1 min-w-[140px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              {addingToCart ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </>
              )}
            </Button>
            <Button
              onClick={startCheckout}
              disabled={checkoutLoading}
              size="lg"
              className="flex-1 min-w-[140px] bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {checkoutLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Opening...
                </span>
              ) : (
                <>
                  Buy Now <CheckCircle2 className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>

          {/* Security note */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              Hybrid checkout: token % caps enforced per product. Fiat balance covers the remainder.
              Rewards are issued post-confirmation.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-300"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 sm:p-6">
          {activeTab === "description" && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.description}
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Type</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {productTypeLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Inventory</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 capitalize">
                    {product.inventory_type}
                  </p>
                </div>
                {product.vendor && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Vendor</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {product.vendor}
                    </p>
                  </div>
                )}
                {product.category && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Category</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {product.category}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-4">
              {rewards.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No reward configuration for this product.
                </p>
              ) : (
                rewards.map((reward: Product["reward_config"][number]) => (
                  <div
                    key={reward.reward_id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {reward.reward_value}
                          {reward.reward_value_type === "PERCENTAGE" ? "%" : ""}{" "}
                          {reward.reward_type === "CASH"
                            ? "Cash"
                            : reward.reward_type === "CASHBACK"
                              ? "Cashback"
                              : reward.reward_type === "BPT"
                                ? "BPT"
                                : reward.utility_token_symbol || "Utility"}
                        </span>
                        {reward.is_active && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Vesting: {reward.vesting_rule}
                        {reward.max_reward_cap && ` • Cap: ₦${reward.max_reward_cap.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Rewards are issued after order completion and verification checks.
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {product.delivery_required ? "Delivery Required" : "Pickup Center"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {product.delivery_required
                      ? "This product requires delivery to your address."
                      : "Visit a pickup center to collect your order with your claim code."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pickup Centers
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Browse available pickup centers near you.
                  </p>
                  <Link
                    href="/store/pickup-centers"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    View pickup centers <ArrowLeft className="h-3 w-3 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Similar Products
            </h2>
            <span className="text-sm text-slate-400">
              More in {productTypeLabel}
            </span>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {similarProducts.map((sp: Product) => (
              <Link
                key={sp.product_id}
                href={`/store/${sp.product_id}`}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={sp.images?.[0] || "/img/default.jpg"}
                    alt={sp.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/img/default.jpg";
                    }}
                  />
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {sp.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{sp.description}</p>
                  <div className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                    {formatProductPrice(sp)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
