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
import { AlertCircle, CheckCircle2, Loader2, MapPin, QrCode, Shield, User } from "lucide-react";

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

type RouterOutputs = inferRouterOutputs<AppRouter>;
type VerifiedOrder = RouterOutputs["store"]["verifyClaimCode"];

export function PickupVerifyClient() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifiedOrder | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const verify = api.store.verifyClaimCode.useMutation();
  const verifyPending = verify.status === "pending";

  const handleVerify = async () => {
    if (verifyPending) return;
    const trimmed = code.trim().toUpperCase();
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
    setInputError(null);
    const toastId = toast.loading("Verifying code...");
    try {
      const res = await verify.mutateAsync({ code: trimmed });
      setResult(res);
      toast.success("Claim verified. Ask customer to confirm pickup.");
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
      setResult(null);
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-800 to-emerald-600 text-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Shield className="h-4 w-4" /> Pickup staff portal</div>
            <h1 className="mt-2 text-3xl font-bold">Verify Claim Code</h1>
            <p className="text-sm text-white/80 max-w-3xl">Enter the customer claim code to mark the pickup as verified. The customer must confirm on their device after you hand over the item.</p>
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
            onClick={handleVerify}
            disabled={verifyPending}
          >
            {verifyPending ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span> : "Verify code"}
          </Button>
          {result && (
            <Badge variant="outline" className="text-[11px] flex items-center gap-1 border-emerald-500/60 text-emerald-700 dark:text-emerald-100">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
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
                <div className="text-[11px] text-muted-foreground">Ask them to confirm completion on their device.</div>
              </Card>
              <Card className="p-3 border-border/60">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Next step</div>
                <div className="mt-1 text-sm text-foreground">Hand over the item and remind the customer to tap "Confirm Pickup" in their orders screen.</div>
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
          </div>
        </Modal>
      )}
    </div>
  );
}
