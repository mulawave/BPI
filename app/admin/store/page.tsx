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
  Building2,
  CheckCircle2,
  Coins,
  Filter,
  Gift,
  Loader2,
  MapPin,
  Package,
  PauseCircle,
  Pencil,
  Percent,
  Phone,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  Shield,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

// Prisma-backed types inferred from tRPC router
export type RouterOutputs = inferRouterOutputs<AppRouter>;
type RouterInputs = inferRouterInputs<AppRouter>;
type Product = RouterOutputs["store"]["listProducts"][number];
type TokenRate = RouterOutputs["store"]["listTokenRates"][number];
type Order = RouterOutputs["store"]["listOrders"][number];
type StoreRewardConfig = RouterOutputs["store"]["listStoreRewardConfigs"][number];
type UpsertProductInput = RouterInputs["store"]["adminUpsertProduct"] & { images?: string[] };

type EditableProduct = Omit<
  Product,
  | "product_id"
  | "created_at"
  | "updated_at"
  | "reward_config"
  | "store_reward_config_id"
> & {
  product_id?: string;
  reward_config?: Product["reward_config"];
  store_reward_config_id?: string | null;
  images?: string[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);

const formatProductPrice = (product: Product): string => {
  const mode = String((product as any).pricing_mode ?? "fiat").toLowerCase();
  if (mode === "token_unit") {
    const symbol = String((product as any).token_unit_symbol ?? "").toUpperCase();
    const amount = Number((product as any).token_unit_amount ?? 0);
    if (symbol && Number.isFinite(amount) && amount > 0) return `${amount} ${symbol}`;
    return "Token-unit";
  }
  return formatCurrency(product.base_price_fiat);
};

const newProductTemplate = (): EditableProduct => ({
  product_id: "new-product",
  name: "",
  description: "",
  vendor: null,
  category: null,
  product_type: "physical",
  pricing_mode: "fiat",
  base_price_fiat: 0,
  token_unit_symbol: null,
  token_unit_amount: null,
  accepted_tokens: ["BPT"],
  token_payment_limits: { BPT: 0.2 },
  reward_config: [],
  store_reward_config_id: null,
  inventory_type: "unlimited",
  status: "active",
  hero_badge: "",
  images: [],
  featured: false,
  pickup_center_id: undefined,
  delivery_required: false,
  tags: [],
});

export default function AdminStorePage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderQuery, setOrderQuery] = useState<string>("");
  const [debouncedOrderQuery, setDebouncedOrderQuery] = useState<string>("");
  const [orderPage, setOrderPage] = useState<number>(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [pausingProductId, setPausingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [togglingConfigId, setTogglingConfigId] = useState<string | null>(null);
  const [togglingStoreConfigId, setTogglingStoreConfigId] = useState<string | null>(null);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);
  const [deletingLevelId, setDeletingLevelId] = useState<string | null>(null);
  const [previewCenterId, setPreviewCenterId] = useState<string | null>(null);

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
      vendor: vendorFilter || undefined,
      category: categoryFilter || undefined,
    }
  );
  const tokenRatesQuery = api.store.listTokenRates.useQuery();
  const rewardConfigsQuery = api.store.listRewardConfigs.useQuery();
  const storeRewardConfigsQuery = api.store.listStoreRewardConfigs.useQuery();
  const pickupCentersQuery = api.store.listPickupCenters.useQuery();
  const ordersQuery = api.store.listOrders.useQuery({
    status: orderStatusFilter === "all" ? undefined : [orderStatusFilter.toUpperCase() as Order["status"]],
  });

  const upsertProduct = api.store.adminUpsertProduct.useMutation();
  const deleteProduct = api.store.adminDeleteProduct.useMutation();
  const upsertTokenRate = api.store.adminUpsertTokenRate.useMutation();
  const upsertRewardConfig = api.store.adminUpsertRewardConfig.useMutation();
  const updateOrderStatus = api.store.adminUpdateOrderStatus.useMutation();
  const upsertStoreRewardConfig = api.store.adminUpsertStoreRewardConfig.useMutation();
  const deleteStoreRewardConfig = api.store.adminDeleteStoreRewardConfig.useMutation();
  const linkProductReferralConfig = api.store.adminLinkProductReferralConfig.useMutation();
  const upsertStoreRewardLevel = api.store.adminUpsertStoreRewardLevel.useMutation();
  const deleteStoreRewardLevel = api.store.adminDeleteStoreRewardLevel.useMutation();

  const products = (productsQuery.data ?? []) as Product[];
  const activeCount = useMemo(() => products.filter((p: Product) => p.status === "active").length, [products]);
  const pausedCount = useMemo(() => products.filter((p: Product) => p.status === "paused").length, [products]);

  const handlePauseToggle = async (product: Product, nextStatus: "ACTIVE" | "PAUSED") => {
    try {
      setPausingProductId(product.product_id);
      const payload: UpsertProductInput = {
        id: product.product_id,
        name: product.name,
        description: product.description,
        productType: product.product_type.toUpperCase() as any,
        pricingMode: (product.pricing_mode || "fiat").toUpperCase() as any,
        basePriceFiat: product.base_price_fiat,
        tokenUnitSymbol: (product as any).token_unit_symbol ?? null,
        tokenUnitAmount: (product as any).token_unit_amount ?? null,
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
    } finally {
      setPausingProductId(null);
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editingProduct.name || !editingProduct.description) {
      toast.error("Name and description are required");
      return;
    }
    if (!editingProduct.images || editingProduct.images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    try {
      const acceptedTokens = (editingProduct.accepted_tokens ?? []).filter(Boolean);
      const tokenPaymentLimits = acceptedTokens.length
        ? acceptedTokens.reduce((acc: Record<string, number>, token: string) => {
            acc[token] = editingProduct.token_payment_limits?.[token] ?? 0;
            return acc;
          }, {} as Record<string, number>)
        : {};

      const payload: UpsertProductInput = {
        id: editingProduct.product_id === "new-product" ? undefined : editingProduct.product_id,
        name: editingProduct.name,
        description: editingProduct.description,
        vendor: (editingProduct as any).vendor ?? null,
        category: (editingProduct as any).category ?? null,
        productType: (editingProduct.product_type || "physical").toUpperCase() as any,
        pricingMode: (editingProduct.pricing_mode || "fiat").toUpperCase() as any,
        basePriceFiat: editingProduct.base_price_fiat || 0,
        tokenUnitSymbol: (editingProduct as any).token_unit_symbol ?? null,
        tokenUnitAmount: (editingProduct as any).token_unit_amount ?? null,
        acceptedTokens,
        tokenPaymentLimits,
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

      const saved = await upsertProduct.mutateAsync(payload);
      // Link (or unlink) the selected store referral config to this product
      await linkProductReferralConfig.mutateAsync({
        productId: saved.product_id,
        configId: editingProduct.store_reward_config_id ?? null,
      });
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
              setVendorFilter("");
              setCategoryFilter("");
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
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
            <Tags className="h-4 w-4 text-muted-foreground" />
            <input
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              placeholder="Filter by vendor"
              className="bg-transparent text-sm focus:outline-none w-28"
            />
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <input
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Filter by category"
              className="bg-transparent text-sm focus:outline-none w-32"
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
                    <div className="flex gap-2 text-[11px] text-muted-foreground">
                      {(p as any).vendor && <span><span className="font-medium">Vendor:</span> {(p as any).vendor}</span>}
                      {(p as any).category && <span><span className="font-medium">Cat:</span> {(p as any).category}</span>}
                      {!((p as any).vendor) && !((p as any).category) && p.tags?.length > 0 && <span><Tags className="h-3 w-3 inline" /> {p.tags?.slice(0, 3).join(" • ")}</span>}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm capitalize text-foreground">{p.product_type}</div>
                  <div className="col-span-2 text-sm font-semibold text-foreground">{formatProductPrice(p)}</div>
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
                  <div className="col-span-2 flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { setConfirmDeleteProductId(null); setEditingProduct({ ...p, product_id: p.product_id }); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {p.status === "active" ? (
                      <Button size="sm" variant="ghost" onClick={() => handlePauseToggle(p, "PAUSED")} disabled={pausingProductId === p.product_id}>
                        {pausingProductId === p.product_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4 text-amber-500" />}
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handlePauseToggle(p, "ACTIVE")} disabled={pausingProductId === p.product_id}>
                        {pausingProductId === p.product_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 text-emerald-500" />}
                      </Button>
                    )}
                    {confirmDeleteProductId === p.product_id ? (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingProductId === p.product_id}
                          onClick={async () => {
                            try {
                              setDeletingProductId(p.product_id);
                              await deleteProduct.mutateAsync({ id: p.product_id });
                              toast.success("Product deleted");
                              productsQuery.refetch();
                            } catch (err: any) {
                              toast.error(err?.message || "Failed to delete product");
                            } finally {
                              setDeletingProductId(null);
                              setConfirmDeleteProductId(null);
                            }
                          }}
                        >
                          {deletingProductId === p.product_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteProductId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteProductId(p.product_id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
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
                const formEl = e.currentTarget as HTMLFormElement;
                const form = new FormData(formEl);
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
                  formEl.reset();
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
              <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white w-full" disabled={upsertRewardConfig.isPending && togglingConfigId === null}>
                {upsertRewardConfig.isPending && togglingConfigId === null ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Save Config"}
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
                        disabled={togglingConfigId === r.reward_id}
                        onClick={async () => {
                          try {
                            setTogglingConfigId(r.reward_id);
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
                          } finally {
                            setTogglingConfigId(null);
                          }
                        }}
                      >
                        {togglingConfigId === r.reward_id ? <Loader2 className="h-4 w-4 animate-spin" /> : (r.is_active ? "Pause" : "Activate")}
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
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Gift className="h-4 w-4" /> Store Referral Rewards</div>
        <div className="text-sm text-muted-foreground">
          Configure sponsor payouts (L1–L4). Settlement runs after <strong>completeClaim</strong> and is idempotent per (order, recipient, level).
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Create / Update Config</div>
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const formEl = e.currentTarget as HTMLFormElement;
                const form = new FormData(formEl);
                const id = (form.get("id") as string) || undefined;
                const productIdRaw = (form.get("productId") as string) || "";
                const isActive = Boolean(form.get("isActive"));
                const startsAtRaw = (form.get("startsAt") as string) || "";
                const endsAtRaw = (form.get("endsAt") as string) || "";

                try {
                  await upsertStoreRewardConfig.mutateAsync({
                    id,
                    productId: productIdRaw ? productIdRaw : null,
                    isActive,
                    startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
                    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
                  });
                  toast.success("Store reward config saved");
                  storeRewardConfigsQuery.refetch();
                  formEl.reset();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to save store reward config");
                }
              }}
            >
              <input name="id" placeholder="Config ID (leave blank to create new)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Scope (optional)</div>
                <select name="productId" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Global (all products)</option>
                  {(productsQuery.data ?? []).map((p: Product) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-muted-foreground">
                  If set, this config applies only to that product and overrides the global config.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Starts at (optional)</div>
                  <input name="startsAt" type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Ends at (optional)</div>
                  <input name="endsAt" type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input name="isActive" type="checkbox" className="h-4 w-4" /> Set active (auto-deactivates others)
              </label>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white w-full" disabled={upsertStoreRewardConfig.isPending && togglingStoreConfigId === null}>
                {upsertStoreRewardConfig.isPending && togglingStoreConfigId === null ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Save Config"}
              </Button>
            </form>
          </Card>

          <Card className="p-3 space-y-2">
            <div className="text-sm font-semibold">Existing Configs</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(storeRewardConfigsQuery.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">None yet.</div>
              ) : (
                (storeRewardConfigsQuery.data ?? []).map((cfg: StoreRewardConfig) => (
                  <div key={cfg.id} className="rounded-lg border border-border/70 p-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold truncate">{cfg.id}</div>
                      <Badge variant={cfg.is_active ? "secondary" : "outline"} className="text-[10px] uppercase">
                        {cfg.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scope: {(() => {
                        const pid = (cfg as any).product_id as string | null | undefined;
                        if (!pid) return "Global";
                        const name = (productsQuery.data ?? []).find((p: Product) => p.product_id === pid)?.name;
                        return name ? `Product • ${name}` : `Product • ${pid}`;
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Window: {cfg.starts_at ? new Date(cfg.starts_at).toLocaleString() : "—"} → {cfg.ends_at ? new Date(cfg.ends_at).toLocaleString() : "—"}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={togglingStoreConfigId === cfg.id}
                        onClick={async () => {
                          try {
                            setTogglingStoreConfigId(cfg.id);
                            await upsertStoreRewardConfig.mutateAsync({
                              id: cfg.id,
                              productId: ((cfg as any).product_id as any) ?? null,
                              isActive: !cfg.is_active,
                              startsAt: cfg.starts_at ?? null,
                              endsAt: cfg.ends_at ?? null,
                            });
                            toast.success(cfg.is_active ? "Deactivated" : "Activated");
                            storeRewardConfigsQuery.refetch();
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to update config");
                          } finally {
                            setTogglingStoreConfigId(null);
                          }
                        }}
                      >
                        {togglingStoreConfigId === cfg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (cfg.is_active ? "Deactivate" : "Activate")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingConfigId === cfg.id}
                        onClick={async () => {
                          try {
                            setDeletingConfigId(cfg.id);
                            await deleteStoreRewardConfig.mutateAsync({ id: cfg.id });
                            toast.success("Config deleted");
                            storeRewardConfigsQuery.refetch();
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to delete config");
                          } finally {
                            setDeletingConfigId(null);
                          }
                        }}
                      >
                        {deletingConfigId === cfg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="p-3 space-y-3">
          <div className="text-sm font-semibold">Levels (L1–L4)</div>
          <div className="text-sm text-muted-foreground">Add or update a level on a config. If the level already exists, it will be updated.</div>
          <form
            className="grid gap-2 md:grid-cols-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget as HTMLFormElement;
              const form = new FormData(formEl);
              const configId = (form.get("configId") as string) || "";
              const level = Number(form.get("level") || 1);
              const rewardBasis = (form.get("rewardBasis") as string) || "PROFIT";
              const rewardValueType = (form.get("rewardValueType") as string) || "PERCENTAGE";
              const rewardValue = Number(form.get("rewardValue") || 0);
              const payoutType = (form.get("payoutType") as string) || "CASH";
              const maxRewardCap = (form.get("maxRewardCap") as string) ? Number(form.get("maxRewardCap")) : null;
              const utilityTokenSymbol = (form.get("utilityTokenSymbol") as string) || null;

              if (!configId) {
                toast.error("Select a config");
                return;
              }

              try {
                await upsertStoreRewardLevel.mutateAsync({
                  configId,
                  level,
                  rewardBasis: rewardBasis as any,
                  rewardValueType: rewardValueType as any,
                  rewardValue,
                  payoutType: payoutType as any,
                  maxRewardCap,
                  utilityTokenSymbol,
                });
                toast.success("Level saved");
                storeRewardConfigsQuery.refetch();
                formEl.reset();
              } catch (err: any) {
                toast.error(err?.message || "Failed to save level");
              }
            }}
          >
            <select name="configId" className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2" defaultValue="">
              <option value="" disabled>
                Select config
              </option>
              {(storeRewardConfigsQuery.data ?? []).map((cfg: StoreRewardConfig) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.is_active ? "(ACTIVE) " : ""}{cfg.id}
                </option>
              ))}
            </select>
            <select name="level" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="1">
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  L{n}
                </option>
              ))}
            </select>
            <select name="rewardBasis" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="PROFIT">
              {["PROFIT", "GROSS"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select name="rewardValueType" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="PERCENTAGE">
              {["PERCENTAGE", "FIXED"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select name="payoutType" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" defaultValue="CASH">
              {["CASH", "CASHBACK", "BPT", "UTILITY_TOKEN"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <input name="rewardValue" type="number" placeholder="Value" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input name="maxRewardCap" type="number" placeholder="Cap (opt)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input name="utilityTokenSymbol" placeholder="Utility symbol (opt)" className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
            <Button type="submit" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-500 text-white md:col-span-2" disabled={upsertStoreRewardLevel.isPending}>
              {upsertStoreRewardLevel.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Save Level"}
            </Button>
          </form>

          <Separator />

          <div className="space-y-3">
            {(storeRewardConfigsQuery.data ?? []).map((cfg: StoreRewardConfig) => (
              <div key={cfg.id} className="rounded-xl border border-border/70 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold truncate">{cfg.id}</div>
                  <Badge variant={cfg.is_active ? "secondary" : "outline"} className="text-[10px] uppercase">
                    {cfg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {(cfg.levels ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">No levels yet.</div>
                ) : (
                  <div className="space-y-2">
                    {(cfg.levels ?? []).map((lvl: any) => (
                      <div key={lvl.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2">
                        <div className="text-sm">
                          <span className="font-semibold">L{lvl.level}</span> · {lvl.reward_basis} · {lvl.reward_value_type} {lvl.reward_value}{lvl.reward_value_type === "PERCENTAGE" ? "%" : ""} · {lvl.payout_type}{lvl.utility_token_symbol ? ` (${lvl.utility_token_symbol})` : ""}
                          {lvl.max_reward_cap != null ? <span className="text-muted-foreground"> · cap {lvl.max_reward_cap}</span> : null}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingLevelId === lvl.id}
                          onClick={async () => {
                            try {
                              setDeletingLevelId(lvl.id);
                              await deleteStoreRewardLevel.mutateAsync({ id: lvl.id });
                              toast.success("Level deleted");
                              storeRewardConfigsQuery.refetch();
                            } catch (err: any) {
                              toast.error(err?.message || "Failed to delete level");
                            } finally {
                              setDeletingLevelId(null);
                            }
                          }}
                        >
                          {deletingLevelId === lvl.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="h-4 w-4" /> Pickup Centers</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{pickupCentersQuery.data?.length ?? 0} centers</span>
            <Button size="sm" variant="ghost" onClick={() => pickupCentersQuery.refetch()} disabled={pickupCentersQuery.isFetching}>
              <RefreshCw className={cn("h-4 w-4", pickupCentersQuery.isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Select a pickup center to preview its details. To add or manage centers, visit the <strong>Pickup Centers</strong> admin page.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left: selector + list */}
          <Card className="p-3 space-y-3">
            <div className="text-sm font-semibold">Select a Center</div>
            <select
              value={previewCenterId ?? ""}
              onChange={(e) => setPreviewCenterId(e.target.value || null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Choose a pickup center —</option>
              {(pickupCentersQuery.data ?? []).map((c: RouterOutputs["store"]["listPickupCenters"][number]) => (
                <option key={c.id} value={c.id}>{c.name} {!c.isActive ? "(Inactive)" : ""}</option>
              ))}
            </select>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pickupCentersQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)
              ) : (pickupCentersQuery.data ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No pickup centers found. Add them from the Pickup Centers page.</div>
              ) : (
                (pickupCentersQuery.data ?? []).map((c: RouterOutputs["store"]["listPickupCenters"][number]) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPreviewCenterId(c.id)}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                      previewCenterId === c.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{c.name}</span>
                      <Badge variant={c.isActive ? "secondary" : "outline"} className="text-[10px] shrink-0">
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{[c.city, c.state, c.country].filter(Boolean).join(", ")}</div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Right: details panel */}
          <Card className="p-3 space-y-3">
            <div className="text-sm font-semibold">Center Details</div>
            {(() => {
              const center = (pickupCentersQuery.data ?? []).find(
                (c: RouterOutputs["store"]["listPickupCenters"][number]) => c.id === previewCenterId
              );
              if (!center) {
                return (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <Building2 className="h-8 w-8 opacity-30" />
                    <span className="text-sm">Select a center to view details</span>
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {center.logoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={center.logoUrl} alt={center.name} className="h-14 w-14 rounded-xl object-cover border border-border" />
                      <div>
                        <div className="font-semibold text-foreground">{center.name}</div>
                        <Badge variant={center.isActive ? "secondary" : "outline"} className="text-[10px] mt-1">
                          {center.isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" />Active</> : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl border border-border bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{center.name}</div>
                        <Badge variant={center.isActive ? "secondary" : "outline"} className="text-[10px] mt-1">
                          {center.isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" />Active</> : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2 text-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <div>{center.addressLine1}</div>
                        {center.addressLine2 && <div>{center.addressLine2}</div>}
                        <div className="text-muted-foreground">{[center.city, center.state, center.country].filter(Boolean).join(", ")}</div>
                      </div>
                    </div>
                    {(center.contactName || center.contactPhone) && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{[center.contactName, center.contactPhone].filter(Boolean).join(" · ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                    ID: <span className="font-mono">{center.id}</span>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      </Card>

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto">
          <Card className="w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                  onChange={(e) => setEditingProduct((prev) => {
                    if (!prev) return prev;
                    const t = e.target.value as Product["product_type"];
                    return {
                      ...prev,
                      product_type: t,
                      pickup_center_id: ["digital", "license"].includes(t) ? undefined : prev.pickup_center_id,
                    };
                  })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["physical", "digital", "license", "service", "utility"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor</label>
                <input
                  value={(editingProduct as any).vendor ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, vendor: e.target.value || null } as any : prev)}
                  placeholder="Supplier / brand name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <input
                  value={(editingProduct as any).category ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, category: e.target.value || null } as any : prev)}
                  placeholder="e.g. Electronics, Apparel"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pricing Mode</label>
                <select
                  value={(editingProduct as any).pricing_mode ?? "fiat"}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    setEditingProduct((prev) => prev
                      ? {
                          ...prev,
                          pricing_mode: mode,
                          token_unit_symbol: mode === "token_unit" ? (prev as any).token_unit_symbol : null,
                          token_unit_amount: mode === "token_unit" ? (prev as any).token_unit_amount : null,
                        }
                      : prev
                    );
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="fiat">Fiat</option>
                  <option value="token_unit">Token unit</option>
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
              {String((editingProduct as any).pricing_mode ?? "fiat") === "token_unit" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Unit Symbol</label>
                    <input
                      value={(editingProduct as any).token_unit_symbol ?? ""}
                      onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, token_unit_symbol: e.target.value.toUpperCase() } : prev)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g., USDT"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Units Per Item</label>
                    <input
                      type="number"
                      value={Number((editingProduct as any).token_unit_amount ?? 0)}
                      onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, token_unit_amount: Number(e.target.value || 0) } : prev)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="e.g., 10"
                    />
                  </div>
                </>
              )}
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
                <label className="text-sm font-medium">Accepted Tokens (comma, optional)</label>
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
                <label className="text-sm font-medium">Hero badge (optional)</label>
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
              {!["digital", "license"].includes(editingProduct.product_type) ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pickup Center <span className="text-muted-foreground font-normal">(optional)</span></label>
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
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pickup Center</label>
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground italic">
                    Not required — digital products are delivered instantly to the account.
                  </div>
                </div>
              )}
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
                <label className="text-sm font-medium">Store Referral Reward Config <span className="text-muted-foreground font-normal">(optional)</span></label>
                <p className="text-xs text-muted-foreground">Select which L1–L4 referral payout structure applies when this product is purchased via a referral link. Configs are created in the Store Referral Rewards section below.</p>
                <select
                  value={editingProduct.store_reward_config_id ?? ""}
                  onChange={(e) => setEditingProduct((prev) => prev ? { ...prev, store_reward_config_id: e.target.value || null } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">None — no referral rewards for this product</option>
                  {(storeRewardConfigsQuery.data ?? []).map((cfg: StoreRewardConfig) => (
                    <option key={cfg.id} value={cfg.id}>
                      {cfg.id.slice(0, 10)}… · {cfg.levels.length} level{cfg.levels.length !== 1 ? "s" : ""} {cfg.is_active ? "✓ Active" : "(Inactive)"}{cfg.product_id ? " · linked" : " · global"}
                    </option>
                  ))}
                </select>
                {editingProduct.store_reward_config_id && (() => {
                  const cfg = (storeRewardConfigsQuery.data ?? []).find((c: StoreRewardConfig) => c.id === editingProduct.store_reward_config_id);
                  if (!cfg || cfg.levels.length === 0) return <p className="text-xs text-muted-foreground">No levels configured on this config yet.</p>;
                  return (
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-3 space-y-2">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Referral Payout Levels</div>
                      <div className="grid gap-1.5">
                        {cfg.levels.map((lvl: any) => (
                          <div key={lvl.id} className="flex items-center justify-between text-xs border-b border-emerald-100 dark:border-emerald-800/40 pb-1 last:border-0 last:pb-0">
                            <span className="font-bold text-foreground">L{lvl.level}</span>
                            <span className="text-muted-foreground">{lvl.reward_basis} · {lvl.reward_value_type === "PERCENTAGE" ? `${Number(lvl.reward_value) * 100}%` : `₦${lvl.reward_value}`} → {lvl.payout_type}{lvl.utility_token_symbol ? ` (${lvl.utility_token_symbol})` : ""}{lvl.max_reward_cap ? ` · cap ₦${lvl.max_reward_cap}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Reward Config (optional)</label>
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
              <Button variant="outline" onClick={() => setEditingProduct(null)} disabled={upsertProduct.isPending}>Cancel</Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-500 text-white" onClick={handleSaveProduct} disabled={upsertProduct.isPending}>
                {upsertProduct.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
