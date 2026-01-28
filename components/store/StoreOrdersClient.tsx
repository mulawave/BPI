"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/client/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/Modal";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Loader2,
  MapPin,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Order = RouterOutputs["store"]["listMyOrders"][number];

type RatingState = {
  open: boolean;
  orderId: string | null;
  rating: number;
  comment: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const claimLabels: Record<string, string> = {
  NOT_READY: "Not ready",
  CODE_ISSUED: "Code issued",
  VERIFIED: "Verified at pickup",
  COMPLETED: "Completed",
};

export function StoreOrdersClient({ focusOrderId }: { focusOrderId?: string }) {
  const router = useRouter();
  const [ratingState, setRatingState] = useState<RatingState>({ open: false, orderId: null, rating: 5, comment: "" });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const ordersQuery = api.store.listMyOrders.useQuery();
  const completeClaim = api.store.completeClaim.useMutation();
  const submitRating = api.store.submitPickupRating.useMutation();
  const submitRatingPending = submitRating.status === "pending";
  const ordersError = ordersQuery.error;

  const orders: Order[] = ordersQuery.data ?? [];

  useEffect(() => {
    if (focusOrderId && orders.length) {
      const target = orders.find((o: Order) => o.id === focusOrderId);
      if (target?.claim_code) {
        toast.success(`Claim code ready: ${target.claim_code}`);
      }
    }
  }, [focusOrderId, orders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const ready = orders.filter((o: Order) => o.claim_status === "CODE_ISSUED").length;
    const verified = orders.filter((o: Order) => o.claim_status === "VERIFIED").length;
    const completed = orders.filter((o: Order) => o.claim_status === "COMPLETED").length;
    return { total, ready, verified, completed };
  }, [orders]);

  const handleCopyCode = async (code?: string | null) => {
    if (!code) {
      toast.error("No claim code available yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Claim code copied");
    } catch (err: any) {
      toast.error(err?.message || "Unable to copy code");
    }
  };

  const handleConfirmPickup = async (order: Order) => {
    if (confirmingId === order.id) return;
    setConfirmingId(order.id);
    const toastId = toast.loading("Confirming pickup...");
    try {
      await completeClaim.mutateAsync({ orderId: order.id });
      toast.success("Pickup confirmed. Thank you!");
      ordersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Unable to confirm pickup");
    } finally {
      toast.dismiss(toastId);
      setConfirmingId(null);
    }
  };

  const openRating = (order: Order) => {
    setRatingState({ open: true, orderId: order.id, rating: 5, comment: "" });
  };

  const handleSubmitRating = async () => {
    if (!ratingState.orderId) return;
    const toastId = toast.loading("Submitting feedback...");
    try {
      await submitRating.mutateAsync({ orderId: ratingState.orderId, rating: ratingState.rating, comment: ratingState.comment || undefined });
      toast.success("Feedback saved. Thanks for sharing.");
      setRatingState({ open: false, orderId: null, rating: 5, comment: "" });
      ordersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Unable to submit feedback");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const renderTimeline = (order: Order) => {
    const steps = [
      { label: "Code issued", done: Boolean(order.claim_code), icon: <Shield className="h-4 w-4" /> },
      { label: "Verified at pickup", done: order.claim_status === "VERIFIED" || order.claim_status === "COMPLETED", icon: <ClipboardCheck className="h-4 w-4" /> },
      { label: "Completed", done: order.claim_status === "COMPLETED", icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "Rated", done: Boolean(order.pickup_experience_rating), icon: <Star className="h-4 w-4" /> },
    ];

    return (
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {steps.map((step) => (
          <div key={step.label} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 border ${step.done ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-100" : "border-border"}`}>
            {step.icon}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderOrder = (order: Order) => {
    const isConfirmable = order.claim_status === "VERIFIED";
    const isRateable = order.claim_status === "COMPLETED" && !order.pickup_experience_rating;
    const statusLabel = statusLabels[order.status] || order.status;
    const claimLabel = claimLabels[order.claim_status ?? ""] || order.claim_status || "";

    return (
      <Card key={order.id} className="p-5 space-y-4 border-border/70 bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{order.product?.name || "Order"}</h3>
              <Badge variant="outline" className="text-[10px] uppercase">Qty {order.quantity}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Order {order.id.slice(0, 10)}… • {new Date(order.created_at as any).toLocaleString()}</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] uppercase border-emerald-500/60 text-emerald-700 dark:text-emerald-100">{statusLabel}</Badge>
              {order.claim_status && (
                <Badge variant="outline" className="text-[10px] uppercase border-blue-500/60 text-blue-700 dark:text-blue-100">{claimLabel}</Badge>
              )}
              {order.reward_settlement_state && (
                <Badge variant="outline" className="text-[10px] uppercase">Rewards: {order.reward_settlement_state}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.claim_code ? (
              <Button variant="outline" size="sm" onClick={() => handleCopyCode(order.claim_code)}>
                <Copy className="h-4 w-4" /> Copy Claim Code
              </Button>
            ) : (
              <Badge variant="secondary" className="text-[11px] flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting code</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-3 bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-100 flex items-center gap-2"><Shield className="h-4 w-4" /> Claim Code</div>
            <div className="mt-1 text-sm font-mono text-foreground">{order.claim_code || "—"}</div>
            <div className="text-[11px] text-muted-foreground">Present this code at the pickup center.</div>
          </Card>
          <Card className="p-3 border-border/60">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Pickup Center</div>
            <div className="mt-1 text-sm text-foreground">{order.pickup_center?.name || "Assigned center"}</div>
            <div className="text-[11px] text-muted-foreground line-clamp-2">{order.pickup_center?.addressLine1}{order.pickup_center?.addressLine2 ? `, ${order.pickup_center.addressLine2}` : ""}</div>
            <div className="text-[11px] text-muted-foreground">{order.pickup_center?.contactPhone || "Phone shared on claim code"}</div>
            {order.pickup_center?.contactEmail && (
              <div className="text-[11px] text-muted-foreground">Email: {order.pickup_center.contactEmail}</div>
            )}
          </Card>
          <Card className="p-3 border-border/60">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4" /> Rewards</div>
            {order.reward_config_snapshot ? (
              <div className="mt-1 text-sm text-foreground">
                {order.reward_config_snapshot.reward_value}
                {order.reward_config_snapshot.reward_value_type === "PERCENTAGE" ? "%" : ""}
                {" "}
                {order.reward_config_snapshot.reward_type?.toLowerCase?.()}
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Configured per product</div>
            )}
            <div className="text-[11px] text-muted-foreground">Issued after completion and checks.</div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {renderTimeline(order)}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
            disabled={!isConfirmable || confirmingId === order.id}
            onClick={() => handleConfirmPickup(order)}
          >
            {confirmingId === order.id ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Confirming...</span>
            ) : (
              "Confirm Pickup"
            )}
          </Button>
          <Button
            variant="outline"
            disabled={!isRateable}
            onClick={() => openRating(order)}
          >
            {isRateable ? "Rate Pickup" : "Awaiting completion"}
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/store/${order.product_id}`)}>Buy again</Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 text-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Shield className="h-4 w-4" /> Secure claim flow</div>
            <h1 className="mt-2 text-3xl font-bold">My Store Orders</h1>
            <p className="text-sm text-white/80 max-w-3xl">Track your checkout → claim → verification → rating journey. Present your claim code at pickup, then confirm and rate your experience.</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Total {stats.total}</Badge>
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Codes {stats.ready}</Badge>
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Verified {stats.verified}</Badge>
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Completed {stats.completed}</Badge>
          </div>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="h-48 animate-pulse bg-muted" />
            ))}
        </div>
      ) : ordersError ? (
        <Card className="p-6 flex flex-col items-start gap-3 border-destructive/60 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Unable to load orders</div>
          <p className="text-sm text-muted-foreground">{ordersError.message || "Please retry in a moment."}</p>
          <Button variant="outline" onClick={() => ordersQuery.refetch()}>Retry</Button>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div className="text-lg font-semibold text-foreground">No orders yet</div>
          <p className="text-sm text-muted-foreground">Start in the store to place your first order and receive a claim code.</p>
          <Button className="bg-gradient-to-r from-emerald-600 to-green-500 text-white" onClick={() => router.push("/store")}>
            Go to Store <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map(renderOrder)}
        </div>
      )}

      <Modal
        isOpen={ratingState.open}
        title="Rate your pickup experience"
        onClose={() => setRatingState({ open: false, orderId: null, rating: 5, comment: "" })}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-emerald-500" /> We value your feedback. Share how the pickup went.
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, idx) => {
              const score = idx + 1;
              const active = ratingState.rating >= score;
              return (
                <button
                  key={score}
                  onClick={() => setRatingState((prev) => ({ ...prev, rating: score }))}
                  className={`p-2 rounded-full border ${active ? "bg-amber-100 border-amber-400 text-amber-700" : "border-border text-muted-foreground"}`}
                  aria-label={`Rate ${score}`}
                >
                  <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-500" : ""}`} />
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Comments (optional)</label>
            <textarea
              value={ratingState.comment}
              onChange={(e) => setRatingState((prev) => ({ ...prev, comment: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Share any issues or highlights from pickup"
              maxLength={1000}
            />
            <div className="text-[11px] text-muted-foreground">Max 1000 characters.</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRatingState({ open: false, orderId: null, rating: 5, comment: "" })}>Cancel</Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
              disabled={submitRatingPending}
              onClick={handleSubmitRating}
            >
              {submitRatingPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
