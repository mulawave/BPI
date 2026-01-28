"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
type RouterOutputs = inferRouterOutputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Filter, ArrowRight, Shield, Coins, Percent, CheckCircle2, MapPin, Gift, Wallet, CreditCard, Star, ChevronLeft, ChevronRight, ShoppingCart, Loader2 } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

function FeaturedCarouselCard({ product, detailLoading, onViewDetails }: { product: Product; detailLoading: string | null; onViewDetails: (product: Product) => void; }) {
  const productTypeLabel = product.product_type.charAt(0).toUpperCase() + product.product_type.slice(1);
  
  return (
    <div className="group snap-center flex flex-col bg-white dark:bg-bpi-dark-card rounded-2xl overflow-hidden border border-border/40 dark:border-bpi-dark-accent/40 shadow-lg hover:shadow-2xl dark:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Image Section - Row 1 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
        <img
          src={product.images?.[0] || "/img/default.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/img/default.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        
        {/* Badges Overlay on Image */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2">
          {product.hero_badge && (
            <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-md">
              {product.hero_badge}
            </span>
          )}
          <Badge variant="outline" className="bg-white/90 dark:bg-black/80 text-gray-700 dark:text-white/90 backdrop-blur-sm text-[10px] uppercase">
            {productTypeLabel}
          </Badge>
        </div>

        {/* Inventory Badge */}
        {product.inventory_type === "limited" && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase rounded-full bg-amber-600 text-white shadow-md">
              <Sparkles className="h-3 w-3" /> Limited
            </span>
          </div>
        )}
      </div>

      {/* Content Section - Rows 2-4 */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Product Name (Title) - Row 2 */}
        <h4 className="text-base sm:text-lg font-bold leading-tight line-clamp-2 text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h4>
        
        {/* Product Type (Subtitle) & Rating - Row 3 */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{productTypeLabel}</span>
          {product.rating && <RatingStars rating={product.rating} />}
        </div>

        {/* Product Brief (Body) - Row 4 */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
          {product.description}
        </p>

        {/* Token Limits */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.accepted_tokens.slice(0, 2).map((t: string) => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] rounded-full bg-foreground/5 px-2 py-1 text-muted-foreground">
              <Coins className="h-3 w-3" /> {t}
            </span>
          ))}
        </div>

        {/* Amount & See Details Button - Row 5 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">From</div>
            <div className="text-xl font-bold text-foreground">{formatCurrency(product.base_price_fiat)}</div>
          </div>
          <Button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => onViewDetails(product)}
            disabled={detailLoading === product.product_id}
          >
            {detailLoading === product.product_id ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              <>
                See Details
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RewardChips({ product }: { product: Product }) {
  return (
    <div className="flex flex-wrap gap-2">
      {product.reward_config.map((reward: Product["reward_config"][number]) => {
        const label = `${reward.reward_value}${reward.reward_value_type === "PERCENTAGE" ? "%" : ""} ${reward.reward_type === "CASH" ? "Cash" : reward.reward_type === "CASHBACK" ? "Cashback" : reward.reward_type === "BPT" ? "BPT" : reward.utility_token_symbol || "Utility"}`;
        return (
          <Badge key={reward.reward_id} variant="outline" className="border-emerald-400/50 text-emerald-600 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30">
            {label}
          </Badge>
        );
      })}
    </div>
  );
}

function TokenLimits({ product }: { product: Product }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {product.accepted_tokens.map((t: string) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1">
          <Coins className="h-3 w-3" /> {t} up to {Math.round((product.token_payment_limits[t] || 0) * 100)}%
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, quickBuyLoading, detailLoading, onQuickBuy, onViewDetails }: { product: Product; quickBuyLoading: string | null; detailLoading: string | null; onQuickBuy: (product: Product) => void; onViewDetails: (product: Product) => void; }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/70 dark:bg-bpi-dark-card/80 backdrop-blur shadow-lg overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all">
      {/* Product Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
        <img
          src={product.images?.[0] || "/img/default.jpg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/img/default.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2">
          {product.hero_badge && (
            <Badge variant="secondary" className="bg-emerald-600 text-white shadow-md">{product.hero_badge}</Badge>
          )}
          <Badge variant="outline" className="bg-white/90 dark:bg-black/80 text-gray-700 dark:text-white/90 backdrop-blur-sm uppercase text-[10px] tracking-[0.08em]">{product.product_type}</Badge>
        </div>

        {/* Inventory Badge */}
        {product.inventory_type === "limited" && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-amber-600 text-white border-0 text-[10px] shadow-md">{product.inventory_type}</Badge>
          </div>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="absolute bottom-3 right-3">
            <div className="inline-flex items-center gap-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-foreground">{product.rating.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">From</div>
          <div className="text-xl font-bold text-foreground">{formatCurrency(product.base_price_fiat)}</div>
        </div>

      <TokenLimits product={product} />
      <RewardChips product={product} />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Hybrid checkout (fiat + tokens)</div>
        <div className="flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Rewards configured</div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          className="flex-1 justify-between bg-gradient-to-r from-emerald-600 to-green-500 text-white"
          onClick={() => onQuickBuy(product)}
          disabled={quickBuyLoading === product.product_id}
        >
          {quickBuyLoading === product.product_id ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing...
            </span>
          ) : (
            <>
              Quick Buy
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="flex-1 justify-between"
          onClick={() => onViewDetails(product)}
          disabled={detailLoading === product.product_id}
        >
          {detailLoading === product.product_id ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <>
              View Details
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      </div>
    </div>
  );
}

function MobileProductCard({ product, quickBuyLoading, detailLoading, onQuickBuy, onViewDetails }: { product: Product; quickBuyLoading: string | null; detailLoading: string | null; onQuickBuy: (product: Product) => void; onViewDetails: (product: Product) => void; }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/80 dark:bg-bpi-dark-card/90 backdrop-blur overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
        <img
          src={product.images?.[0] || "/img/default.jpg"}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/img/default.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-white/90 dark:bg-black/80 backdrop-blur-sm text-[10px] uppercase">{product.product_type}</Badge>
          {product.hero_badge && <Badge variant="secondary" className="bg-emerald-600 text-white text-[10px]">{product.hero_badge}</Badge>}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="absolute bottom-2 right-2">
            <div className="inline-flex items-center gap-1 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-foreground">{product.rating.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground line-clamp-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          </div>
          <div className="text-right text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(product.base_price_fiat)}</div>
        </div>
      <TokenLimits product={product} />
      <RewardChips product={product} />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 text-white"
          onClick={() => onQuickBuy(product)}
          disabled={quickBuyLoading === product.product_id}
        >
          {quickBuyLoading === product.product_id ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing...
            </span>
          ) : (
            "Quick Buy"
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails(product)}
          disabled={detailLoading === product.product_id}
        >
          {detailLoading === product.product_id ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            "Details"
          )}
        </Button>
      </div>
      </div>
    </div>
  );
}

export function StoreExperience() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedToken, setSelectedToken] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [desktopPage, setDesktopPage] = useState(1);
  const [mobilePage, setMobilePage] = useState(1);
  const [featuredSlide, setFeaturedSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [quickBuyLoading, setQuickBuyLoading] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const router = useRouter();
  const checkoutMutation = api.store.createCheckoutIntent.useMutation();

  // Fetch the full catalog once; filters/search are applied client-side so the featured carousel stays unfiltered.
  const { data: productsData, isLoading } = api.store.listProducts.useQuery({
    status: "all",
  });

  const products: Product[] = productsData ?? [];
  const featuredProducts = useMemo<Product[]>(() => products.filter((p: Product) => p.featured), [products]);
  const cardsPerView = 4;
  const maxFeaturedStart = Math.max(0, featuredProducts.length - cardsPerView);

  const filtered = useMemo<Product[]>(() => {
    return products.filter((p: Product) => {
      const matchesType = selectedType === "all" || p.product_type === selectedType;
      const matchesToken = selectedToken === "all" || p.accepted_tokens.includes(selectedToken.toUpperCase());
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesToken && matchesSearch;
    });
  }, [products, selectedType, selectedToken, search]);

  const desktopPageSize = 9;
  const mobilePageSize = 5;
  const desktopTotalPages = Math.max(1, Math.ceil(filtered.length / desktopPageSize));
  const mobileTotalPages = Math.max(1, Math.ceil(filtered.length / mobilePageSize));

  if (desktopPage > desktopTotalPages) setDesktopPage(desktopTotalPages);
  if (mobilePage > mobileTotalPages) setMobilePage(mobileTotalPages);

  const desktopSliceStart = (desktopPage - 1) * desktopPageSize;
  const mobileSliceStart = (mobilePage - 1) * mobilePageSize;
  const desktopPageItems = filtered.slice(desktopSliceStart, desktopSliceStart + desktopPageSize);
  const mobilePageItems = filtered.slice(mobileSliceStart, mobileSliceStart + mobilePageSize);

  const handleQuickBuy = useCallback(async (product: Product) => {
    setQuickBuyLoading(product.product_id);
    const loadingId = toast.loading(`Opening checkout for ${product.name}...`);
    try {
      const res = await checkoutMutation.mutateAsync({ productId: product.product_id, quantity: 1 });
      const qty = 1;
      const redirect = res.redirectUrl || `/checkout?intent=${res.intentId}&productId=${product.product_id}&quantity=${qty}`;
      router.push(redirect);
    } catch (err: any) {
      const message = err?.message || "Failed to start checkout";
      toast.error(message);
    } finally {
      toast.dismiss(loadingId);
      setQuickBuyLoading(null);
    }
  }, [checkoutMutation, router]);

  const handleViewDetails = useCallback((product: Product) => {
    setDetailLoading(product.product_id);
    router.push(`/store/${product.product_id}`);
  }, [router]);

  const typeFilters: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Physical", value: "physical" },
    { label: "Digital", value: "digital" },
    { label: "License", value: "license" },
    { label: "Service", value: "service" },
    { label: "Utility", value: "utility" },
  ];

  const tokens = useMemo<string[]>(() => {
    const tokenSet = new Set<string>(products.flatMap((p: Product) => p.accepted_tokens));
    return Array.from(tokenSet);
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/10 dark:to-background">
      <div className="space-y-10 px-4 sm:px-6 md:px-10 lg:px-16">
      {/* Hero Slide */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 text-white relative shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10" aria-hidden />
        <div className="p-8 md:p-12 lg:p-16 relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium shadow-lg">
            <ShoppingCart className="h-4 w-4" /> Hybrid Commerce • Rewards First
          </div>
          <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-black leading-tight max-w-4xl">
            Welcome to the BPI Store
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/90 max-w-3xl leading-relaxed">
            Shop premium products, licenses, and services with flexible fiat + token checkout. Earn cashback, BPT, and utility rewards on every purchase—built for the community, by the community.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 shadow-md"><CreditCard className="h-4 w-4" /> Hybrid checkout</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 shadow-md"><Wallet className="h-4 w-4" /> Token limits enforced</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 shadow-md"><Gift className="h-4 w-4" /> Multi-tier rewards</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 shadow-md"><Shield className="h-4 w-4" /> Auditable & compliant</span>
          </div>
          <div className="mt-8">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-bold shadow-xl">
              Browse All Products <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-emerald-500" /> Featured Products
              </div>
              <h2 className="text-2xl font-bold text-foreground">Curated picks for you</h2>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFeaturedSlide((current) => (current <= 0 ? maxFeaturedStart : Math.max(current - cardsPerView, 0)))}
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow hover:border-emerald-500 hover:text-emerald-700 dark:bg-bpi-dark-card dark:border-bpi-dark-accent"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={carouselRef}
                className="grid grid-flow-col auto-cols-[90%] sm:auto-cols-[55%] lg:auto-cols-[36%] xl:auto-cols-[28%] 2xl:auto-cols-[22%] gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-4 pr-2 scrollbar-hide"
              >
                {featuredProducts.map((product: Product) => (
                  <FeaturedCarouselCard
                    key={product.product_id}
                    product={product}
                    detailLoading={detailLoading}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFeaturedSlide((current) => (current >= maxFeaturedStart ? 0 : Math.min(current + cardsPerView, maxFeaturedStart)))}
                className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow hover:border-emerald-500 hover:text-emerald-700 dark:bg-bpi-dark-card dark:border-bpi-dark-accent"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Filters and Product Grid */}
      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4" /> Filters</div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedType("all"); setSelectedToken("all"); setSearch(""); }}>Reset</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <Button key={f.value} size="sm" variant={selectedType === f.value ? "default" : "outline"} onClick={() => setSelectedType(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={selectedToken === "all" ? "default" : "outline"} onClick={() => setSelectedToken("all")}>
              All Tokens
            </Button>
            {tokens.map((t: string) => (
              <Button key={t} size="sm" variant={selectedToken === t ? "default" : "outline"} onClick={() => setSelectedToken(t)}>
                {t}
              </Button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, licenses, services"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3 text-sm text-emerald-900 dark:text-emerald-100 flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5" /> Token usage and rewards are enforced per product to protect pools and users.
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 hidden md:block">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {desktopPageItems.map((product: Product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    quickBuyLoading={quickBuyLoading}
                    detailLoading={detailLoading}
                    onQuickBuy={handleQuickBuy}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: desktopTotalPages }).map((_, idx) => {
                  const page = idx + 1;
                  const isActive = page === desktopPage;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={isActive ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white" : ""}
                      onClick={() => setDesktopPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Mobile-first list distinct from desktop grid */}
      <section className="md:hidden space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-emerald-500" /> Curated for mobile — quick actions & compact cards
        </div>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))
          ) : (
            <>
              {mobilePageItems.map((product: Product) => (
                <MobileProductCard
                  key={product.product_id}
                  product={product}
                  quickBuyLoading={quickBuyLoading}
                  detailLoading={detailLoading}
                  onQuickBuy={handleQuickBuy}
                  onViewDetails={handleViewDetails}
                />
              ))}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: mobileTotalPages }).map((_, idx) => {
                  const page = idx + 1;
                  const isActive = page === mobilePage;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={isActive ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white" : ""}
                      onClick={() => setMobilePage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Shield className="h-4 w-4" /> Checkout Guardrails</div>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Per-token % caps enforced per product; hybrid split auto-calculated.</li>
            <li>Token valuation via fixed internal rates (snapshot per order).</li>
            <li>Idempotent payment intents; rollback on token/fiat failure.</li>
            <li>Admin switches: pause product, rewards, checkout.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Gift className="h-4 w-4" /> Reward Engine</div>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Reward types: Cash, Cashback, BPT, Utility tokens (e.g., PACT).</li>
            <li>Value modes: Fixed or % of order total; optional caps.</li>
            <li>Vesting: instant, delayed, or milestone-based with audit log.</li>
            <li>Separate pools for cashback, BPT, and utility rewards.</li>
          </ul>
        </div>
      </section>
      </div>
    </div>
  );
}
