"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Clock3 } from "lucide-react";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${n.toLocaleString()}`;

/**
 * Buy a CSP time extension (follow-up Q13, 07/10/2026). `requestId` is the
 * member's own live request to extend; omit it to buy a pre-extension
 * before making a request (valid only for the member's next one).
 */
export default function CspTopUpButton({ requestId }: { requestId?: string }) {
  const { data: settings } = api.csp.getTopUpSettings.useQuery();
  const [open, setOpen] = useState(false);

  const purchase = api.csp.purchaseTopUp.useMutation({
    onSuccess: (res) => {
      toast.success(`Bought a time extension for ${naira(res.amountPaid)}. Contribute that amount to a live campaign before it ends to activate it.`);
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!settings?.enabled) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
      >
        <Clock3 className="h-3.5 w-3.5" />
        {requestId ? "Extend time" : "Buy a pre-extension"}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 text-xs text-muted-foreground">
            The fee goes to your Community Wallet. {requestId ? "Contribute it to a live campaign before this countdown ends to add the hours." : "This is held for your next request."}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => purchase.mutate({ hours: 24, requestId })}
              disabled={purchase.isPending}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              +24 hours — {naira(settings.price24h)}
            </button>
            <button
              onClick={() => purchase.mutate({ hours: 48, requestId })}
              disabled={purchase.isPending}
              className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              +48 hours — {naira(settings.price48h)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
