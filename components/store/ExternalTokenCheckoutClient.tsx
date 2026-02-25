"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Shield, AlertTriangle, Coins } from "lucide-react";
import toast from "react-hot-toast";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value || 0);

export default function ExternalTokenCheckoutClient({ orderId }: { orderId: string }) {
  const [txHash, setTxHash] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const intent = api.store.getExternalTokenCheckoutIntent.useQuery(
    { orderId },
    {
      enabled: !!orderId,
      refetchOnWindowFocus: false,
    }
  );

  const submitTx = api.store.submitExternalTokenPaymentTxHash.useMutation();

  const isExpired = useMemo(() => {
    const expires = intent.data?.expiresAt ? new Date(intent.data.expiresAt).getTime() : null;
    return expires != null ? expires < Date.now() : false;
  }, [intent.data?.expiresAt]);

  const canSubmit = useMemo(() => {
    if (!intent.data) return false;
    const status = String(intent.data.pendingPaymentStatus ?? "").toLowerCase();
    return status === "pending" && !isExpired;
  }, [intent.data, isExpired]);

  const handleSubmit = async () => {
    if (!intent.data?.pendingPaymentId) {
      toast.error("Missing pending payment.");
      return;
    }
    const hash = txHash.trim();
    if (hash.length < 6) {
      toast.error("Enter a valid transaction hash.");
      return;
    }

    const toastId = toast.loading("Submitting transaction hash...");
    try {
      await submitTx.mutateAsync({
        pendingPaymentId: intent.data.pendingPaymentId,
        txHash: hash,
        note: note.trim() ? note.trim() : undefined,
      });
      toast.success("Submitted. Awaiting admin verification.");
      setTxHash("");
      setNote("");
      await intent.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit transaction hash");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8 md:px-10 lg:px-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/store" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Link>
          </Button>
          <Badge variant="outline" className="uppercase text-[10px]">External token checkout</Badge>
        </div>

        <Card className="p-6 rounded-3xl border border-white/10 bg-card/70 backdrop-blur shadow-lg space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xl font-semibold text-foreground">Deposit instructions</div>
              <div className="text-sm text-muted-foreground">
                Send the exact amount to the address below, then submit your transaction hash.
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-emerald-500" /> Admin verification required
            </div>
          </div>

          {intent.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading payment intent...
            </div>
          ) : intent.error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" /> {intent.error.message}
            </div>
          ) : !intent.data ? (
            <div className="text-sm text-muted-foreground">No intent found.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-foreground/5 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Deposit address</div>
                <div className="mt-1 text-sm font-mono break-all text-foreground">{intent.data.depositAddress ?? "—"}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-foreground/5 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount</div>
                <div className="mt-1 text-lg font-semibold text-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  {intent.data.expectedTokenAmount != null && intent.data.tokenSymbol
                    ? `${Number(intent.data.expectedTokenAmount).toFixed(6)} ${String(intent.data.tokenSymbol).toUpperCase()}`
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Fiat peg: {intent.data.expectedFiat != null ? formatCurrency(Number(intent.data.expectedFiat)) : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-foreground/5 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Expires</div>
                <div className="mt-1 text-sm text-foreground">
                  {intent.data.expiresAt ? new Date(intent.data.expiresAt).toLocaleString() : "—"}
                </div>
                {isExpired && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" /> Payment request expired
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-foreground/5 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                <div className="mt-1 text-sm text-foreground">
                  Pending payment: {String(intent.data.pendingPaymentStatus ?? "—")}
                </div>
                <div className="mt-1 text-sm text-foreground">Order: {String(intent.data.status ?? "—")}</div>
                {intent.data.txHash && (
                  <div className="mt-2 text-xs text-muted-foreground break-all">
                    Submitted hash: <span className="font-mono">{intent.data.txHash}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-3xl border border-white/10 bg-card/70 backdrop-blur shadow-lg space-y-4">
          <div className="text-lg font-semibold text-foreground">Submit transaction hash</div>
          <div className="grid gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction hash</label>
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste your tx hash"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={!canSubmit || submitTx.isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any extra context for the admin review"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                disabled={!canSubmit || submitTx.isPending}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Submitting the hash does not instantly confirm the order.
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
                onClick={handleSubmit}
                disabled={!canSubmit || submitTx.isPending}
              >
                {submitTx.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
