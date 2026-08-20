"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  Coins,
  Gift,
  CreditCard,
  Wallet,
  X,
  TrendingUp,
  Package,
  ArrowRight,
} from "lucide-react";
import { api } from "@/client/trpc";
import ProductCard, { formatProductPrice } from "./ProductCard";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];

type SortOption = "newest" | "price-low" | "price-high" | "featured";
type ViewMode = "grid" | "list";

const PRODUCT_TYPES = [
  { label: "All Products", value: "all" },
  { label: "Physical", value: "physical" },
  { label: "Digital", value: "digital" },
  { label: "License", value: "license" },
  { label: "Service", value: "service" },
  { label: "Utility", value: "utility" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Featured", value: "featured" },
];

const PAGE_SIZE = 12;

export function StoreExperience() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedToken, setSelectedToken] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: productsData, isLoading } = api.store.listProducts.useQuery({
    status: "active",
  });

  const products: Product[] = productsData ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: Product) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const tokens = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: Product) => {
      p.accepted_tokens.forEach((t: string) => set.add(t));
    });
    return Array.from(set).sort();
  }, [products]);

  const featuredProducts = useMemo(
    () => products.filter((p: Product) => p.featured && p.status === "active").slice(0, 6),
    [products],
  );

  const filtered = useMemo(() => {
    let result = products.filter((p: Product) => {
      if (p.status !== "active") return false;
      const matchesType = selectedType === "all" || p.product_type === selectedType;
      const matchesToken =
        selectedToken === "all" || p.accepted_tokens.includes(selectedToken.toUpperCase());
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesToken && matchesCategory && matchesSearch;
    });

    switch (sort) {
      case "price-low":
        result = [...result].sort((a, b) => a.base_price_fiat - b.base_price_fiat);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.base_price_fiat - a.base_price_fiat);
        break;
      case "newest":
        result = [...result].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "featured":
        result = [...result].sort(
          (a, b) => Number(b.featured) - Number(a.featured),
        );
        break;
    }

    return result;
  }, [products, selectedType, selectedToken, selectedCategory, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const resetFilters = useCallback(() => {
    setSelectedType("all");
    setSelectedToken("all");
    setSelectedCategory("all");
    setSearch("");
    setSort("featured");
    setPage(1);
  }, []);

  const activeFilterCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedToken !== "all" ? 1 : 0) +
    (selectedCategory !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl shadow-xl ring-1 ring-amber-300/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-[26rem] h-[26rem] rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,215,140,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

        <div className="relative px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300/15 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-amber-100 shadow-md ring-1 ring-amber-300/20">
              <Sparkles className="h-3.5 w-3.5" />
              Hybrid Commerce • Rewards on Every Purchase
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
              The BPI Superstore
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
              Shop premium products, licenses, and services. Pay with fiat, tokens, or a hybrid split.
              Earn cashback, BPT, and utility rewards on every order.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white ring-1 ring-amber-300/20">
                <CreditCard className="h-3.5 w-3.5 text-amber-200" /> Hybrid checkout
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white ring-1 ring-amber-300/20">
                <Wallet className="h-3.5 w-3.5 text-emerald-300" /> Token payments
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white ring-1 ring-amber-300/20">
                <Gift className="h-3.5 w-3.5 text-amber-200" /> Multi-tier rewards
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white ring-1 ring-amber-300/20">
                <Shield className="h-3.5 w-3.5 text-emerald-300" /> Secure & auditable
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Strip */}
      {featuredProducts.length > 0 && !search && selectedType === "all" && selectedCategory === "all" && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Featured Products
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSort("featured")}
              className="text-emerald-600 hover:text-emerald-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProducts.map((product: Product) => (
              <Link
                key={product.product_id}
                href={`/store/${product.product_id}`}
                className="group flex-shrink-0 w-64 rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md ring-1 ring-amber-300/10 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={product.images?.[0] || "/img/default.jpg"}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/img/default.jpg";
                    }}
                  />
                  {product.hero_badge && (
                    <span className="absolute top-2 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {product.hero_badge}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>
                  <div className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                    {formatProductPrice(product)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Layout: Sidebar + Products */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" /> Categories
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedCategory("all"); setPage(1); }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      selectedCategory === "all"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setPage(1); }}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        selectedCategory === cat
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product Type */}
            <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Product Type
              </h3>
              <div className="space-y-1">
                {PRODUCT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setSelectedType(t.value); setPage(1); }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      selectedType === t.value
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Token Filter */}
            {tokens.length > 0 && (
              <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-500" /> Accepted Tokens
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedToken("all"); setPage(1); }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      selectedToken === "all"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    All Tokens
                  </button>
                  {tokens.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setSelectedToken(t); setPage(1); }}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        selectedToken === t
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
                size="sm"
              >
                <X className="h-3.5 w-3.5" /> Clear all filters
              </Button>
            )}
          </div>
        </aside>

        {/* Products Area */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* View toggle */}
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setView("grid")}
                  className={cn(
                    "p-2 transition-colors",
                    view === "grid"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "p-2 transition-colors",
                    view === "list"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="lg:hidden rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md ring-1 ring-amber-300/10 p-4 space-y-4">
              {categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedCategory("all"); setPage(1); }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedCategory === "all"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                      )}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setPage(1); }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedCategory === cat
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Product Type</h3>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setSelectedType(t.value); setPage(1); }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedType === t.value
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {tokens.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Tokens</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedToken("all"); setPage(1); }}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        selectedToken === "all"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                      )}
                    >
                      All
                    </button>
                    {tokens.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setSelectedToken(t); setPage(1); }}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedToken === t
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={resetFilters} size="sm" className="w-full">
                  <X className="h-3.5 w-3.5" /> Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? (
                "Loading products..."
              ) : (
                <>
                  <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span>
                  {" "}product{filtered.length !== 1 ? "s" : ""}
                  {activeFilterCount > 0 && " found"}
                </>
              )}
            </p>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div
              className={cn(
                "grid gap-4",
                view === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1",
              )}
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 animate-pulse",
                    view === "grid" ? "h-72" : "h-32",
                  )}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-amber-300/40 dark:border-amber-400/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 ring-1 ring-amber-300/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">No products found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your filters or search terms.
                </p>
              </div>
              {activeFilterCount > 0 && (
                <Button onClick={resetFilters} variant="outline">
                  <X className="h-4 w-4" /> Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-4",
                  view === "grid"
                    ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1",
                )}
              >
                {pageItems.map((product: Product) => (
                  <ProductCard key={product.product_id} product={product} view={view} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "h-9 min-w-[2.25rem] rounded-lg text-sm font-semibold transition-colors",
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 7 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
            {[
              { icon: Shield, label: "Secure Checkout", desc: "Encrypted payments" },
              { icon: Gift, label: "Rewards on Every Order", desc: "Cashback, BPT, utility" },
              { icon: CreditCard, label: "Hybrid Payments", desc: "Fiat + token split" },
              { icon: TrendingUp, label: "Fair Pricing", desc: "Transparent token rates" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-start gap-2.5 rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <badge.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{badge.label}</p>
                  <p className="text-[11px] text-slate-400">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
