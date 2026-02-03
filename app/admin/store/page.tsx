"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { api } from "@/client/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import toast from "react-hot-toast";
import {
  Coins,
  Filter,
  Gift,
  Loader2,
  MapPin,
  Package,
  PauseCircle,
  Pencil,
  Percent,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  Shield,
  Tags,
  X,
} from "lucide-react";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

// Prisma-backed types inferred from tRPC router
export type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];
type TokenRate = RouterOutputs["store"]["listTokenRates"][number];
type Order = RouterOutputs["store"]["listOrders"][number];
type UpsertProductInput = RouterInputs["store"]["adminUpsertProduct"] & { images?: string[] };

type EditableProduct = Omit<
  Product,
  | "product_id"
  | "created_at"
  | "updated_at"
  | "reward_config"
> & {
  product_id?: string;
  reward_config?: Product["reward_config"];
  images?: string[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);

const newProductTemplate = (): EditableProduct => ({
  product_id: "new-product",
  name: "",
  description: "",
  product_type: "physical",
  base_price_fiat: 0,
  accepted_tokens: ["BPT"],
  token_payment_limits: { BPT: 0.2 },
  reward_config: [],
  inventory_type: "unlimited",
  status: "active",
  hero_badge: "",
  images: [],
  featured: false,
  pickup_center_id: undefined,
  reward_center_id: undefined,
  delivery_required: false,
  tags: [],
});

export default function AdminStorePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderQuery, setOrderQuery] = useState<string>("");
  const [debouncedOrderQuery, setDebouncedOrderQuery] = useState<string>("");
  const [orderPage, setOrderPage] = useState<number>(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrderQuery(orderQuery), 250);
    return () => clearTimeout(t);
  }, [orderQuery]);

  const productsQuery = api.store.listProducts.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
      query: debouncedQuery || undefined,
    }
  );
  const tokenRatesQuery = api.store.listTokenRates.useQuery();
  const rewardConfigsQuery = api.store.listRewardConfigs.useQuery();
  const pickupCentersQuery = api.store.listPickupCenters.useQuery();
  const rewardCentersQuery = api.store.listRewardCenters.useQuery();
  const ordersQuery = api.store.listOrders.useQuery({
    status: orderStatusFilter === "all" ? undefined : [orderStatusFilter.toUpperCase() as Order["status"]],
  });

  const upsertProduct = api.store.adminUpsertProduct.useMutation();
  const upsertTokenRate = api.store.adminUpsertTokenRate.useMutation();
  const upsertRewardConfig = api.store.adminUpsertRewardConfig.useMutation();
  const upsertPickupCenter = api.store.adminUpsertPickupCenter.useMutation();
  const upsertRewardCenter = api.store.adminUpsertRewardCenter.useMutation();
  const updateOrderStatus = api.store.adminUpdateOrderStatus.useMutation();

  const products = (productsQuery.data ?? []) as Product[];
  const activeCount = useMemo(() => products.filter((p: Product) => p.status === "active").length, [products]);
  const pausedCount = useMemo(() => products.filter((p: Product) => p.status === "paused").length, [products]);

  const handlePauseToggle = async (product: Product, nextStatus: "ACTIVE" | "PAUSED") => {
    try {
      const payload: UpsertProductInput = {
        id: product.product_id,
        name: product.name,
        description: product.description,
        productType: product.product_type.toUpperCase() as any,
        basePriceFiat: product.base_price_fiat,
        acceptedTokens: product.accepted_tokens,
        tokenPaymentLimits: product.token_payment_limits || {},
        rewardConfigId: product.reward_config?.[0]?.reward_id,
        inventoryType: (product.inventory_type || "UNLIMITED").toUpperCase() as any,
        status: nextStatus,
        pickupCenterId: product.pickup_center_id || undefined,
        rewardCenterId: product.reward_center_id || undefined,
        deliveryRequired: Boolean(product.delivery_required),
        heroBadge: product.hero_badge || undefined,
        images: product.images ?? [],
        featured: Boolean(product.featured),
      };

      await upsertProduct.mutateAsync(payload);
      toast.success(`Product ${nextStatus === "PAUSED" ? "paused" : "resumed"}`);
      await productsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name || !editingProduct.description) {
      toast.error("Name and description are required");
      return;
    }
    if (!editingProduct.accepted_tokens?.length) {
      toast.error("At least one token required");
      return;
    }
    if (!editingProduct.images || editingProduct.images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    try {
      const payload: UpsertProductInput = {
        id: editingProduct.product_id === "new-product" ? undefined : editingProduct.product_id,
        name: editingProduct.name,
        description: editingProduct.description,
        productType: (editingProduct.product_type || "physical").toUpperCase() as any,
        basePriceFiat: editingProduct.base_price_fiat || 0,
        acceptedTokens: editingProduct.accepted_tokens,
        tokenPaymentLimits: editingProduct.token_payment_limits || {},
        rewardConfigId: editingProduct.reward_config?.[0]?.reward_id,
        inventoryType: (editingProduct.inventory_type || "unlimited").toUpperCase() as any,
        status: (editingProduct.status || "active").toUpperCase() as any,
        pickupCenterId: editingProduct.pickup_center_id || undefined,
        rewardCenterId: editingProduct.reward_center_id || undefined,
        deliveryRequired: Boolean(editingProduct.delivery_required),
        heroBadge: editingProduct.hero_badge || undefined,
        images: editingProduct.images ?? [],
        featured: Boolean(editingProduct.featured),
      };

      await upsertProduct.mutateAsync(payload);
      toast.success("Product saved");
      await productsQuery.refetch();
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product");
    }
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const uploads: string[] = [];
      let processed = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || !json?.url) {
          throw new Error(json?.error || "Upload failed");
        }
        uploads.push(json.url as string);
        processed += 1;
        setUploadProgress(Math.round((processed / files.length) * 100));
      }
      setEditingProduct((prev) => prev ? { ...prev, images: [...(prev.images ?? []), ...uploads] } : prev);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (url: string) => {
    setEditingProduct((prev) => prev ? { ...prev, images: (prev.images ?? []).filter((img) => img !== url) } : prev);
  };

  const handleRewardSettlementChange = async (order: Order, nextState: Order["reward_settlement_state"]) => {
    try {
      setUpdatingOrderId(order.id);
      await updateOrderStatus.mutateAsync({ id: order.id, status: order.status, rewardSettlementState: nextState });
      toast.success("Reward settlement updated");
      ordersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update reward settlement");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    setOrderPage(1);
  }, [orderStatusFilter, debouncedOrderQuery]);

  const filteredOrders = useMemo(() => {
    const source = ordersQuery.data ?? [];
    if (!debouncedOrderQuery) return source;
    const q = debouncedOrderQuery.toLowerCase();
    return source.filter((o: Order) => {
      const idMatch = o.id.toLowerCase().includes(q);
      const userMatch = (o.user_id || "").toLowerCase().includes(q);
      const productMatch = o.product?.name?.toLowerCase?.().includes(q) ?? false;
      return idMatch || userMatch || productMatch;
    });
  }, [ordersQuery.data, debouncedOrderQuery]);

  const pageSize = 10;
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const orderSliceStart = (orderPage - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(orderSliceStart, orderSliceStart + pageSize);

  const handleOrderStatusChange = async (orderId: string, nextStatus: Order["status"]) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus.mutateAsync({ id: orderId, status: nextStatus });
      toast.success("Order status updated");
      ordersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">BPI Store Admin</div>
          <h1 className="text-2xl font-bold text-foreground">Products, token limits, rewards</h1>
          <p className="text-sm text-muted-foreground">Manage listings, hybrid token/fiat limits, reward configs, and centers.</p>
          {productsQuery.isFetching && <div className="text-[11px] text-muted-foreground">Refreshing products…</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setTypeFilter("all");
              setQuery("");
              productsQuery.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white" onClick={() => setEditingProduct(newProductTemplate())}>
            Add Product
          </Button>
        </div>
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="BPI Store Management Guide"
        sections={[
          {
            title: "Store Management Features",
            icon: <Package className="w-5 h-5 text-blue-600" />,
            items: [
              "Manage product listings (physical, digital, licenses, services, utilities)",
              "Set hybrid pricing: fiat (NGN) + token (BPT) payment options",
              "Configure token payment limits per product",
              "Define reward structures (cash, cashback, BPT, utility tokens)",
              "Control inventory (unlimited, limited, or out of stock)",
              "Assign products to pickup or reward centers"
            ]
          },
          {
            title: "Product Management",
            icon: <Pencil className="w-5 h-5 text-green-600" />,
            items: [
              { label: "Add Product", text: "Click 'Add Product' to create new listings" },
              { label: "Edit Product", text: "Click pencil icon to modify existing products" },
              { label: "Product Types", text: "Physical, Digital, License, Service, Utility" },
              { label: "Pricing", text: "Set base price in NGN and token payment caps" },
              { label: "Images", text: "Upload product images (drag & drop or click)" },
              { label: "Status", text: "Active (visible), Paused (hidden), or Retired" }
            ]
          },
          {
            title: "Hybrid Payment System",
            icon: <Coins className="w-5 h-5 text-purple-600" />,
            items: [
              "<strong>Token Payment Limits</strong> - Set max % of price payable in tokens",
              "<strong>Example:</strong> ₦10,000 product with 20% BPT limit = Up to ₦2,000 in tokens",
              "Remaining balance must be paid in fiat (NGN)",
              "Token rates are snapshot at checkout time",
              "System automatically calculates split at purchase"
            ]
          },
          {
            title: "Reward Configuration",
            icon: <Gift className="w-5 h-5 text-orange-600" />,
            items: [
              "Define rewards users earn when purchasing products",
              "<strong>Cash rewards</strong> - Direct NGN credited to wallet",
              "<strong>Cashback</strong> - Percentage of purchase returned",
              "<strong>BPT rewards</strong> - Token rewards",
              "<strong>Utility tokens</strong> - Special purpose tokens",
              "Multiple reward types can be combined per product"
            ]
          },
          {
            title: "Order Management",
            icon: <Shield className="w-5 h-5 text-red-600" />,
            items: [
              "View all customer orders in real-time",
              "Filter by status: Pending, Confirmed, Shipped, Delivered, Cancelled",
              "Search orders by customer name or order ID",
              "Update order status as fulfillment progresses",
              "Track pickup center assignments",
              "Monitor payment split (fiat vs token)"
            ]
          }
        ]}
        features={[
          "Hybrid fiat/token payments",
          "Product image uploads",
          "Inventory management",
          "Reward configurations",
          "Pickup/Reward center assignment",
          "Order tracking & fulfillment",
          "Token rate snapshots",
          "Search & filter products"
        ]}
        proTip="Use <strong>token payment limits</strong> strategically to encourage token usage while maintaining fiat revenue. A 20-30% token limit is optimal for most products. Remember to set <strong>reward configs</strong> to incentivize purchases and build loyalty."
        warning="Product changes affect <strong>future orders only</strong>. Existing orders use the snapshot of pricing and rewards at the time of purchase. Always verify <strong>token rates</strong> and <strong>payment limits</strong> before activating new products."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-2 border-emerald-100 dark:border-emerald-900/40">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" /> Active Listings</div>
          <div className="text-3xl font-bold">{activeCount}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><PauseCircle className="h-4 w-4" /> Paused</div>
          <div className="text-3xl font-bold">{pausedCount}</div>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Gift className="h-4 w-4" /> Reward Types</div>
          <div className="text-sm text-muted-foreground">Cash, Cashback, BPT, Utility tokens</div>
        </Card>
      </div>

      <Card className="p-4 space-y-2 bg-foreground/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Percent className="h-4 w-4" /> Checkout Split (DB-backed)</div>
        <div className="text-sm text-muted-foreground">Uses product token caps and fixed rates; final split is snapshot per order.</div>
        <div className="text-xs text-muted-foreground">Hook: integrate with checkout engine to compute fiat/token portions before payment intent.</div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Filter className="h-4 w-4" /> Filters</div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "paused", "retired"].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-wrap gap-2">
            {["all", "physical", "digital", "license", "service", "utility"].map((t) => (
              <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All Types" : t}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-12 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground px-4 py-2">
            <div className="col-span-3">Product</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-3">Tokens / Limits</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/60">
            {productsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-16 bg-muted animate-pulse" />)
            ) : products.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No products found.</div>
            ) : (
              products.map((p: Product) => (
                <div key={p.product_id} className="grid grid-cols-12 items-center px-4 py-3 bg-card/40 backdrop-blur">
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{p.name}</span>
                      <Badge variant="outline" className={cn("text-[10px]", p.status === "active" ? "text-emerald-600 border-emerald-500/60" : "text-amber-600 border-amber-500/60")}>{p.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                    <div className="flex gap-1 text-[11px] text-muted-foreground">
                      <Tags className="h-3 w-3" /> {p.tags?.slice(0, 3).join(" • ")}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm capitalize text-foreground">{p.product_type}</div>
                  <div className="col-span-2 text-sm font-semibold text-foreground">{formatCurrency(p.base_price_fiat)}</div>
                  <div className="col-span-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {p.accepted_tokens.map((t: string) => (
                        <Badge key={t} variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                          <Coins className="h-3 w-3" /> {t} {Math.round((p.token_payment_limits?.[t] || 0) * 100)}%
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.reward_config?.map((r: Product["reward_config"][number]) => (
                        <Badge
                          key={r.reward_id}
                          variant={r.is_active ? "outline" : "destructive"}
                          className="text-[10px]"
                        >
                          <Gift className="h-3 w-3" /> {r.reward_value}{r.reward_value_type === "PERCENTAGE" ? "%" : ""} {r.reward_type?.toLowerCase?.()} {r.is_active ? "" : "(paused)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingProduct({ ...p, product_id: p.product_id })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {p.status === "active" ? (
                      <Button size="sm" variant="ghost" onClick={() => handlePauseToggle(p, "PAUSED")}>
                        <PauseCircle className="h-4 w-4 text-amber-500" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handlePauseToggle(p, "ACTIVE")}>
                        <PlayCircle className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Percent className="h-4 w-4" /> Token Rates</div>
          <Button size="sm" variant="ghost" onClick={() => tokenRatesQuery.refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tokenRatesQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="h-24 rounded-xl bg-muted animate-pulse" />)
          ) : (
            (tokenRatesQuery.data ?? []).map((r: TokenRate) => (
              <Card key={r.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <span>{r.symbol}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{r.source}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">1 {r.symbol} =</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={r.rate_to_fiat}
                    onBlur={async (e) => {
                      const val = Number(e.target.value || 0);
                      try {
                        await upsertTokenRate.mutateAsync({ id: r.id, symbol: r.symbol, rateToFiat: val, source: r.source as any, effectiveAt: r.effective_at as any });
                        toast.success("Rate saved");
                        tokenRatesQuery.refetch();
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to save rate");
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">NGN</span>
                </div>
                <div className="text-[11px] text-muted-foreground">Effective: {new Date(r.effective_at as any).toLocaleString()}</div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Shield className="h-4 w-4" /> Orders & Settlement</div>
          <div className="flex flex-wrap gap-2 items-center">
            {(["all", "PENDING", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "FAILED", "REFUNDED"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={orderStatusFilter === s ? "default" : "outline"}
                onClick={() => setOrderStatusFilter(s)}
              >
                {s === "all" ? "All" : s}
              </Button>
            ))}
            <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Search order, user, product"
                className="bg-transparent text-sm focus:outline-none"
              />
            </div>
            <Button size="sm" variant="ghost" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
              <RefreshCw className="h-4 w-4" /> {ordersQuery.isFetching ? "Refreshing" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-12 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground px-4 py-2">
            <div className="col-span-3">Order</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-3">Payment & Rewards</div>
            <div className="col-span-2">Claim</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/60">
            {ordersQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-16 bg-muted animate-pulse" />)
            ) : pagedOrders.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No orders found.</div>
            ) : (
              pagedOrders.map((o: Order) => {
                const payment = (o.payment_breakdown as any) || {};
                const tokenPart = payment?.token;
                const fiatPart = payment?.fiat;
                return (
                  <div key={o.id} className="grid grid-cols-12 items-center px-4 py-3 bg-card/40 backdrop-blur gap-2">
                    <div className="col-span-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{o.id.slice(0, 8)}…</span>
                        <Badge variant="outline" className="text-[10px]">{new Date(o.created_at as any).toLocaleDateString()}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">User: {o.user_id.slice(0, 10)}…</div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase",
                          o.status === "COMPLETED" ? "border-emerald-500/60 text-emerald-600" :
                          o.status === "PAID" ? "border-blue-500/60 text-blue-600" :
                          o.status === "PROCESSING" ? "border-amber-500/60 text-amber-700" :
                          o.status === "DELIVERED" ? "border-indigo-500/60 text-indigo-600" :
                          o.status === "FAILED" ? "border-rose-500/60 text-rose-600" :
                          o.status === "REFUNDED" ? "border-amber-500/60 text-amber-600" :
                          "border-gray-400/60 text-foreground"
                        )}
                      >
                        {o.status}
                      </Badge>
                    </div>
                    <div className="col-span-3 space-y-1 text-sm">
                      <div className="font-semibold text-foreground">{o.product?.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">Qty {o.quantity}</div>
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground space-y-1">
                      <div>Fiat: {typeof fiatPart === "number" ? formatCurrency(fiatPart) : "—"}</div>
                      {tokenPart ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Coins className="h-3 w-3" /> {tokenPart.symbol} {tokenPart.amount?.toFixed?.(4)} (~{tokenPart.fiat_value})
                        </div>
                      ) : (
                        <div className="text-xs">Token: —</div>
                      )}
                      <div className="flex flex-col gap-1 text-xs">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase w-fit",
                            o.reward_settlement_state === "ISSUED" ? "border-emerald-500/60 text-emerald-600" :
                            o.reward_settlement_state === "FAILED" ? "border-rose-500/60 text-rose-600" :
                            "border-gray-400/60 text-foreground"
                          )}
                        >
                          Rewards: {o.reward_settlement_state}
                        </Badge>
                        <select
                          value={o.reward_settlement_state}
                          onChange={(e) => handleRewardSettlementChange(o, e.target.value as Order["reward_settlement_state"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                          disabled={updatingOrderId === o.id}
                        >
                          {(["PENDING", "ISSUED", "FAILED"] as const).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase",
                            o.claim_status === "COMPLETED" ? "border-emerald-500/60 text-emerald-600" :
                            o.claim_status === "VERIFIED" ? "border-blue-500/60 text-blue-600" :
                            o.claim_status === "CODE_ISSUED" ? "border-amber-500/60 text-amber-700" :
                            "border-gray-400/60 text-foreground"
                          )}
                        >
                          Claim: {o.claim_status || "-"}
                        </Badge>
                        {o.claim_code ? <Badge variant="outline" className="text-[11px]">{o.claim_code}</Badge> : <Badge variant="secondary" className="text-[11px]">Awaiting code</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">Pickup: {o.pickup_center?.name || "—"}</div>
                    </div>
                    <div className="col-span-1 flex justify-end gap-2 items-center">
                      <select
                        value={o.status}
                        onChange={(e) => handleOrderStatusChange(o.id, e.target.value as Order["status"])}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        disabled={updatingOrderId === o.id}
                      >
                        {(["PENDING", "PAID", "PROCESSING", "DELIVERED", "COMPLETED", "FAILED", "REFUNDED"] as const).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="outline" onClick={() => ordersQuery.refetch()} disabled={updatingOrderId === o.id}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {pagedOrders.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: totalOrderPages }).map((_, idx) => {
              const page = idx + 1;
              const isActive = page === orderPage;
              return (
                <Button
                  key={page}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={isActive ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white" : ""}
                  onClick={() => setOrderPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-800/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Shield className="h-4 w-4" /> Compliance & Controls</div>
        <div className="text-sm text-muted-foreground">
          Token % caps, reward issuance, and checkout guardrails are enforced per product. Admin kill switches (pause product/rewards/checkout) must be wired to backend when live.
        </div>
        <div className="text-xs text-muted-foreground">
          DB-backed data via Prisma + tRPC. Persist token rates, reward configs, and order snapshots for auditability.
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Gift className="h-4 w-4" /> Reward Configs</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Create Reward Config</div>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const rewardType = (form.get("rewardType") as string) || "CASH";
                const rewardValue = Number(form.get("rewardValue") || 0);
                const rewardValueType = (form.get("rewardValueType") as string) || "FIXED";
                const vestingRule = (form.get("vestingRule") as string) || "instant";
                const maxRewardCap = form.get("maxRewardCap") ? Number(form.get("maxRewardCap")) : null;
                const utilityTokenSymbol = (form.get("utilityTokenSymbol") as string) || undefined;
                try {
                  await upsertRewardConfig.mutateAsync({
                    rewardType: rewardType as any,
                    rewardValue,
                    rewardValueType: rewardValueType as any,
                    vestingRule,
                    maxRewardCap: maxRewardCap ?? undefined,
                    utilityTokenSymbol,
                    isActive: true,
                  });
                  toast.success("Reward config saved");
                  rewardConfigsQuery.refetch();
                  (e.currentTarget as HTMLFormElement).reset();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to save reward config");
                }
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                <select name="rewardType" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="CASH">
                  {["CASH", "CASHBACK", "BPT", "UTILITY_TOKEN"].map((r) => <option key={r}>{r}</option>)}
                </select>
                <select name="rewardValueType" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="FIXED">
                  {["FIXED", "PERCENTAGE"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <input name="rewardValue" type="number" placeholder="Reward value" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="maxRewardCap" type="number" placeholder="Max cap (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="utilityTokenSymbol" placeholder="Utility token symbol (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="vestingRule" placeholder="Vesting rule (e.g., instant)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" /> Active
              </label>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white w-full">
                Save Config
              </Button>
            </form>
          </Card>
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Existing Configs</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(rewardConfigsQuery.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">None yet.</div>
              ) : (
                (rewardConfigsQuery.data ?? []).map((r: RouterOutputs["store"]["listRewardConfigs"][number]) => (
                  <div key={r.reward_id} className="rounded-lg border border-border/70 p-2 space-y-1">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{r.reward_type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{r.reward_value_type}</Badge>
                        <Badge variant={r.is_active ? "secondary" : "destructive"} className="text-[10px] uppercase">
                          {r.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-foreground">Value: {r.reward_value}{r.reward_value_type === "PERCENTAGE" ? "%" : ""}</div>
                    <div className="text-xs text-muted-foreground">Vesting: {r.vesting_rule}</div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await upsertRewardConfig.mutateAsync({
                              id: r.reward_id,
                              rewardType: r.reward_type as any,
                              rewardValue: r.reward_value,
                              rewardValueType: r.reward_value_type as any,
                              vestingRule: r.vesting_rule,
                              maxRewardCap: r.max_reward_cap ?? undefined,
                              utilityTokenSymbol: r.utility_token_symbol ?? undefined,
                              isActive: !r.is_active,
                            });
                            toast.success("Reward config updated");
                            rewardConfigsQuery.refetch();
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to update config");
                          }
                        }}
                      >
                        {r.is_active ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="h-4 w-4" /> Centers</div>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Add Pickup Center</div>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                try {
                  await upsertPickupCenter.mutateAsync({
                    name: (form.get("name") as string) || "",
                    addressLine1: (form.get("addressLine1") as string) || "",
                    addressLine2: (form.get("addressLine2") as string) || undefined,
                    city: (form.get("city") as string) || "",
                    state: (form.get("state") as string) || "",
                    country: (form.get("country") as string) || "",
                    contactName: (form.get("contactName") as string) || undefined,
                    contactPhone: (form.get("contactPhone") as string) || undefined,
                    isActive: true,
                  });
                  toast.success("Pickup center saved");
                  pickupCentersQuery.refetch();
                  (e.currentTarget as HTMLFormElement).reset();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to save center");
                }
              }}
            >
              <input name="name" placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="addressLine1" placeholder="Address line 1" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <input name="addressLine2" placeholder="Address line 2" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <input name="city" placeholder="City" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input name="state" placeholder="State" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input name="country" placeholder="Country" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="contactName" placeholder="Contact name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input name="contactPhone" placeholder="Contact phone" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white w-full">Save Pickup Center</Button>
            </form>
            <div className="text-xs text-muted-foreground">Existing: {pickupCentersQuery.data?.length ?? 0}</div>
          </Card>
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Add Reward Center</div>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                try {
                  await upsertRewardCenter.mutateAsync({
                    name: (form.get("name") as string) || "",
                    description: (form.get("description") as string) || undefined,
                    isActive: true,
                  });
                  toast.success("Reward center saved");
                  rewardCentersQuery.refetch();
                  (e.currentTarget as HTMLFormElement).reset();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to save center");
                }
              }}
            >
              <input name="name" placeholder="Name" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="description" placeholder="Description (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} />
              <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white w-full">Save Reward Center</Button>
            </form>
            <div className="text-xs text-muted-foreground">Existing: {rewardCentersQuery.data?.length ?? 0}</div>
          </Card>
        </div>
      </Card>

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{editingProduct.product_id === "new-product" ? "Add Product" : "Edit Product"}</div>
              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={editingProduct.product_type}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, product_type: e.target.value as Product["product_type"] } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["physical", "digital", "license", "service", "utility"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Price (NGN)</label>
                <input
                  type="number"
                  value={editingProduct.base_price_fiat}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, base_price_fiat: Number(e.target.value || 0) } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, status: e.target.value as Product["status"] } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["active", "paused", "retired"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Accepted Tokens (comma)</label>
                <input
                  value={editingProduct.accepted_tokens.join(",")}
                  onChange={(e) => {
                    const parts = e.target.value.split(",").map((p) => p.trim()).filter(Boolean);
                    setEditingProduct((prev) => prev ? { ...prev, accepted_tokens: parts } : prev);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="text-[11px] text-muted-foreground">List tokens, then set per-token % caps below.</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hero badge</label>
                <input
                  value={editingProduct.hero_badge ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, hero_badge: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Limited"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Images (min 1)</label>
                <div className="flex flex-wrap gap-3">
                  {(editingProduct.images ?? []).map((img) => (
                    <div key={img} className="relative h-20 w-28 overflow-hidden rounded-lg border border-border">
                      <img src={img} alt="Product" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-20 w-28 flex flex-col items-center justify-center gap-1"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Uploading… {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">＋</span>
                        <span className="text-xs">Add picture</span>
                      </>
                    )}
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageFiles(e.target.files)}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">Upload at least one image. Add more pictures as needed.</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Featured</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.featured)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingProduct((prev) => prev ? { ...prev, featured: e.target.checked } : prev)}
                  />
                  <span className="text-sm text-muted-foreground">Show in featured carousel</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Required</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.delivery_required)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingProduct((prev) => prev ? { ...prev, delivery_required: e.target.checked } : prev)}
                  />
                  <span className="text-sm text-muted-foreground">Require fulfillment / shipping</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pickup Center</label>
                <select
                  value={editingProduct.pickup_center_id ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, pickup_center_id: e.target.value || undefined } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {(pickupCentersQuery.data ?? []).map((c: RouterOutputs["store"]["listPickupCenters"][number]) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reward Center</label>
                <select
                  value={editingProduct.reward_center_id ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, reward_center_id: e.target.value || undefined } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {(rewardCentersQuery.data ?? []).map((c: RouterOutputs["store"]["listRewardCenters"][number]) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Token % caps</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {editingProduct.accepted_tokens.map((token: string) => (
                    <div key={token} className="space-y-1">
                      <div className="text-xs font-semibold text-foreground">{token}</div>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={editingProduct.token_payment_limits?.[token] ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value || 0);
                          setEditingProduct((prev) => prev ? {
                            ...prev,
                            token_payment_limits: { ...(prev.token_payment_limits || {}), [token]: val },
                          } : prev);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <div className="text-[11px] text-muted-foreground">0.2 = 20%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Reward Config</label>
                <select
                  value={editingProduct.reward_config?.[0]?.reward_id ?? ""}
                  onChange={(e) => {
                    const selected = (rewardConfigsQuery.data ?? []).find((r: RouterOutputs["store"]["listRewardConfigs"][number]) => r.reward_id === e.target.value);
                    setEditingProduct((prev) => prev ? { ...prev, reward_config: selected ? [selected as any] : [] } : prev);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {(rewardConfigsQuery.data ?? []).map((r: RouterOutputs["store"]["listRewardConfigs"][number]) => (
                    <option key={r.reward_id} value={r.reward_id}>
                      {r.reward_type} · {r.reward_value}{r.reward_value_type === "PERCENTAGE" ? "%" : ""} {r.is_active ? "" : "(paused)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-500 text-white" onClick={handleSaveProduct}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
