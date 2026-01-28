"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Shield, ArrowLeft, Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
type RouterOutputs = inferRouterOutputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

type Props = { product: Product };

export default function StoreDetailClient({ product }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const checkoutMutation = api.store.createCheckoutIntent.useMutation();
  const { data: catalog } = api.store.listProducts.useQuery({ status: "all" });
  const catalogProducts: Product[] = catalog ?? [];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    const toastId = toast.loading("Opening checkout...");
    try {
      const res = await checkoutMutation.mutateAsync({ productId: product.product_id, quantity: 1 });
      const redirect = res.redirectUrl || `/checkout?intent=${res.intentId}&productId=${product.product_id}&quantity=1`;
      router.replace(redirect);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start checkout");
    } finally {
      toast.dismiss(toastId);
      setCheckoutLoading(false);
    }
  }, [checkoutMutation, product.product_id, router]);

  // Auto-trigger when arriving with checkout=1 (from Quick Buy)
  useEffect(() => {
    if (searchParams.get("checkout") === "1" && !checkoutLoading) {
      startCheckout();
    }
  }, [checkoutLoading, searchParams, startCheckout]);

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

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (!galleryImages.length || !selectedImage) return;
    const idx = galleryImages.indexOf(selectedImage);
    if (idx === -1) return;
    const nextIdx = direction === "left" ? (idx + 1) % galleryImages.length : (idx - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[nextIdx]);
  }, [galleryImages, selectedImage]);

  const featuredProducts = useMemo<Product[]>(
    () => catalogProducts.filter((p: Product) => p.featured && p.product_id !== product.product_id).slice(0, 6),
    [catalogProducts, product.product_id]
  );
  const similarProducts = useMemo<Product[]>(
    () => catalogProducts.filter((p: Product) => p.product_type === product.product_type && p.product_id !== product.product_id).slice(0, 4),
    [catalogProducts, product.product_id, product.product_type]
  );

  const rewards = useMemo(() => product.reward_config, [product.reward_config]);

  return (
    <div className="px-4 pt-0 pb-8 md:px-10 lg:px-16 space-y-8">
      <div className="rounded-3xl border border-white/10 bg-card/70 backdrop-blur shadow-lg p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <div
              className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-foreground/5 relative"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
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
                  const target = e.target as HTMLImageElement;
                  target.src = "/img/default.jpg";
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img: string) => (
                <button
                  key={img}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-24 rounded-lg overflow-hidden border ${selectedImage === img ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-white/20"}`}
                >
                  <img
                    src={img}
                    alt="Product thumbnail"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/img/default.jpg";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                <p className="text-muted-foreground max-w-2xl">{product.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">From</div>
                <div className="text-3xl font-bold">{formatCurrency(product.base_price_fiat)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {product.accepted_tokens.map((t: string) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
                  <Coins className="h-3 w-3" /> {t} up to {Math.round((product.token_payment_limits[t] || 0) * 100)}%
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2"><Gift className="h-4 w-4" /> Reward Config</div>
              <div className="flex flex-wrap gap-2">
                {rewards.map((reward: Product["reward_config"][number]) => (
                  <Badge key={reward.reward_id} variant="outline" className="border-emerald-400/50 text-emerald-700 dark:text-emerald-100">
                    {reward.reward_value}{reward.reward_value_type === "PERCENTAGE" ? "%" : ""} {reward.reward_type === "CASH" ? "Cash" : reward.reward_type === "CASHBACK" ? "Cashback" : reward.reward_type === "BPT" ? "BPT" : reward.utility_token_symbol || "Utility"} • {reward.vesting_rule}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-foreground/5 p-4 text-sm text-foreground flex items-start gap-3">
              <Shield className="h-4 w-4 text-emerald-500" /> Hybrid checkout: token % caps enforced; fiat balance covers remainder. Rewards are issued post-confirmation.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
                onClick={startCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening...
                  </span>
                ) : (
                  "Start Checkout"
                )}
              </Button>
              <Button variant="outline" disabled={checkoutLoading}>Save for later</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/store"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <Badge variant="outline" className="uppercase text-[10px]">{product.product_type}</Badge>
        {product.hero_badge && <Badge variant="secondary">{product.hero_badge}</Badge>}
      </div>

      {featuredProducts.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-card/70 backdrop-blur shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-emerald-500" /> Storefront highlights
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow hover:border-emerald-500 hover:text-emerald-700"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!carouselRef.current) return;
                  carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow hover:border-emerald-500 hover:text-emerald-700"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link href="/store" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all</Link>
            </div>
          </div>
          <div
            ref={carouselRef}
            className="grid grid-flow-col auto-cols-[90%] sm:auto-cols-[55%] lg:auto-cols-[36%] xl:auto-cols-[28%] 2xl:auto-cols-[22%] gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pr-2 scrollbar-hide"
          >
            {featuredProducts.map((fp: Product) => (
              <Link key={fp.product_id} href={`/store/${fp.product_id}`} className="snap-center rounded-2xl border border-white/10 bg-background/80 dark:bg-bpi-dark-card/80 shadow hover:-translate-y-1 transition-all">
                <div className="aspect-[16/10] overflow-hidden rounded-t-2xl">
                  <img src={fp.images?.[0] || "/img/default.jpg"} alt={fp.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/img/default.jpg"; }} />
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-xs uppercase text-muted-foreground">{fp.product_type}</div>
                  <div className="text-base font-semibold text-foreground line-clamp-2">{fp.name}</div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(fp.base_price_fiat)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {similarProducts.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-card/70 backdrop-blur shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Similar picks</h2>
            <span className="text-sm text-muted-foreground">Based on {product.product_type}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((sp: Product) => (
              <Link key={sp.product_id} href={`/store/${sp.product_id}`} className="rounded-xl border border-white/10 bg-background/80 dark:bg-bpi-dark-card/80 shadow hover:-translate-y-1 transition-all">
                <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                  <img src={sp.images?.[0] || "/img/default.jpg"} alt={sp.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/img/default.jpg"; }} />
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-xs uppercase text-muted-foreground">{sp.product_type}</div>
                  <div className="text-sm font-semibold text-foreground line-clamp-2">{sp.name}</div>
                  <div className="text-sm font-bold text-foreground">{formatCurrency(sp.base_price_fiat)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>
    );
  }
