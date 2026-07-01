"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/Modal";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, MapPin, QrCode, Shield, User, Package2, ListChecks, CircleDollarSign } from "lucide-react";

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
  VERIFIED: "Verified",
  COMPLETED: "Completed",
};

const rewardLabels: Record<string, string> = {
  PENDING: "Pending",
  ISSUED: "Issued",
  FAILED: "Failed",
};

type RouterOutputs = inferRouterOutputs<AppRouter>;
type VerifiedOrder = RouterOutputs["store"]["verifyClaimCode"];
type QueueOrder = RouterOutputs["store"]["listPickupQueue"][number] & {
  customer: { id: string; name: string | null; email: string | null } | null;
};

export function PickupVerifyClient() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifiedOrder | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const verify = api.store.verifyClaimCode.useMutation();
  const complete = api.store.staffCompletePickup.useMutation();
  const queueQuery = api.store.listPickupQueue.useQuery(undefined, { refetchOnWindowFocus: false });
  const accessQuery = api.store.getPickupAccess.useQuery(undefined, { refetchOnWindowFocus: false });

  const verifyPending = verify.status === "pending";
  const completePending = complete.status === "pending";

  const handleVerifyCode = async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim().toUpperCase();
    const pattern = /^BPI-[0-9]{6}-PC$/;
    if (!trimmed) {
      toast.error("Enter a claim code");
      setInputError("Enter a claim code");
      return;
    }
    if (!pattern.test(trimmed)) {
      const msg = "Use format BPI-123456-PC";
      setInputError(msg);
      toast.error(msg);
      return;
    }
    if (busyKey) return;
    setInputError(null);
    setBusyKey(`verify:${trimmed}`);
    const toastId = toast.loading("Verifying code...");
    try {
      const res = await verify.mutateAsync({ code: trimmed });
      setResult(res);
      toast.success("Claim verified. Confirm handover to release rewards.");
      await queueQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
      setResult(null);
    } finally {
      toast.dismiss(toastId);
      setBusyKey(null);
    }
  };

  const handleManualVerify = async () => {
    if (verifyPending || completePending) return;
    await handleVerifyCode(code);
  };

  const handleCompletePickup = async (orderId: string) => {
    if (busyKey) return;
    setBusyKey(`complete:${orderId}`);
    const toastId = toast.loading("Completing handover...");
    try {
      const res = await complete.mutateAsync({ orderId });
      setResult(res as VerifiedOrder);
      toast.success("Pickup completed and rewards released.");
      await queueQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Unable to complete pickup");
    } finally {
      toast.dismiss(toastId);
      setBusyKey(null);
    }
  };

  const queue = (queueQuery.data ?? []) as QueueOrder[];
  const centers = accessQuery.data?.centers ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-800 to-emerald-600 text-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Shield className="h-4 w-4" /> Pickup staff portal</div>
            <h1 className="mt-2 text-3xl font-bold">Verify Claim Code</h1>
            <p className="text-sm text-white/80 max-w-3xl">Enter the customer claim code to verify pickup, then confirm handover and release rewards from the same screen.</p>
            {centers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
                <span className="font-semibold uppercase tracking-wide">Authorized centers</span>
                {centers.map((center) => (
                  <Badge key={center.id} variant="outline" className="border-white/30 bg-white/10 text-white">
                    {center.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Two-step verification</Badge>
        </div>
      </div>

      <Card className="p-5 space-y-4 border-border/70 bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Claim code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g., BPI-123456-PC"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {inputError && <div className="text-[11px] text-destructive">{inputError}</div>}
          <div className="text-[11px] text-muted-foreground">Ask the customer to show their code. Never accept screenshots alone.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
            onClick={handleManualVerify}
            disabled={verifyPending || completePending || Boolean(busyKey)}
          >
            {verifyPending && busyKey?.startsWith("verify:") ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span> : "Verify code"}
          </Button>
          {result && (
            <Badge variant="outline" className="text-[11px] flex items-center gap-1 border-emerald-500/60 text-emerald-700 dark:text-emerald-100">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
      </Card>

      <Card className="p-5 space-y-4 border-border/70 bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2"><ListChecks className="h-4 w-4 text-emerald-500" /> Pickup queue</div>
            <h2 className="text-lg font-bold text-foreground">Waiting and verified pickups</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => queueQuery.refetch()} disabled={queueQuery.isFetching}>Refresh</Button>
        </div>

        {queueQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">No pending pickup verifications right now.</div>
        ) : (
          <div className="space-y-3">
            {queue.map((order) => {
              const actionBusy = busyKey === `verify:${order.claim_code}` || busyKey === `complete:${order.id}`;
              return (
                <div key={order.id} className="rounded-2xl border border-border/70 p-4 bg-background/60 dark:bg-bpi-dark-card/60 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{order.claim_code}</span>
                        <Badge variant="outline" className="text-[11px]">{claimLabels[order.claim_status ?? ""] || order.claim_status}</Badge>
                        <Badge variant="outline" className="text-[11px]">Reward {rewardLabels[order.reward_settlement_state ?? ""] || order.reward_settlement_state}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <Package2 className="h-4 w-4" /> {order.product?.name || "Order item"}
                        <span className="inline-flex items-center gap-1"><User className="h-4 w-4" /> {order.customer?.name || order.customer?.email || order.user_id}</span>
                      </div>
                      {order.pickup_center?.name && (
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {order.pickup_center.name}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.claim_status === "CODE_ISSUED" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={actionBusy}
                          onClick={() => handleVerifyCode(order.claim_code ?? "")}
                        >
                          Verify
                        </Button>
                      )}
                      {order.claim_status === "VERIFIED" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={actionBusy}
                          onClick={() => handleCompletePickup(order.id)}
                        >
                          Complete & release rewards
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {result && (
        <Modal isOpen title="Pickup verified" onClose={() => setResult(null)} maxWidth="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><QrCode className="h-4 w-4 text-emerald-500" /> Code {result.claim_code}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-3 border-border/60">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Status</div>
                <div className="mt-1 text-sm text-foreground">{statusLabels[result.status] || result.status}</div>
                <div className="text-[11px] text-muted-foreground">Claim {claimLabels[result.claim_status ?? ""] || result.claim_status}</div>
              </Card>
              <Card className="p-3 border-border/60">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4" /> Customer</div>
                <div className="mt-1 text-sm text-foreground">{result.user_id?.slice(0, 10)}…</div>
                <div className="text-[11px] text-muted-foreground">{result.claim_status === "VERIFIED" ? "Confirm handover here to release rewards." : "Customer confirmation is complete."}</div>
              </Card>
              <Card className="p-3 border-border/60">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2"><CircleDollarSign className="h-4 w-4" /> Reward settlement</div>
                <div className="mt-1 text-sm text-foreground">{rewardLabels[result.reward_settlement_state ?? ""] || result.reward_settlement_state}</div>
                <div className="text-[11px] text-muted-foreground">Rewards are distributed automatically after handover completion.</div>
              </Card>
              <Card className="p-3 border-border/60">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Pickup center</div>
                <div className="mt-1 text-sm text-foreground">{result.pickup_center?.name || "Assigned center"}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">{result.pickup_center?.addressLine1}{result.pickup_center?.addressLine2 ? `, ${result.pickup_center.addressLine2}` : ""}</div>
                {result.pickup_center?.contactEmail && (
                  <div className="text-[11px] text-muted-foreground">Email: {result.pickup_center.contactEmail}</div>
                )}
              </Card>
            </div>
            {result.claim_status === "VERIFIED" && (
              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={Boolean(busyKey)}
                  onClick={() => handleCompletePickup(result.id)}
                >
                  Confirm handover & release rewards
                </Button>
                <div className="text-xs text-muted-foreground self-center">You can also let the customer confirm on their device.</div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
