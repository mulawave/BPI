"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { TimerReset, Search } from "lucide-react";
import { api } from "@/client/trpc";

const fmt = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * Admin tool: reduce one member's CSP waiting period manually, e.g. to support
 * a member in an emergency. The reason is recorded in the CSP rule log.
 */
export default function CspWaitingPeriodTool() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"end_now" | "months">("months");
  const [months, setMonths] = useState(6);
  const [reason, setReason] = useState("");

  const lookup = api.csp.adminLookupWaitingPeriod.useQuery({ query }, { enabled: query.length >= 2 });
  const reduce = api.csp.adminReduceWaitingPeriod.useMutation({
    onSuccess: () => {
      toast.success("Waiting period reduced");
      setReason("");
      lookup.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const member = lookup.data;

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <TimerReset className="h-5 w-5 text-amber-600" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Reduce a member&apos;s waiting period</h2>
          <p className="text-sm text-muted-foreground">For special cases such as emergencies. Only shortens the waiting period; the reason is recorded.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(queryInput.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Member email, username or ID"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
          Find
        </button>
      </form>

      {query && lookup.isLoading && <p className="text-sm text-muted-foreground">Looking up…</p>}
      {query && !lookup.isLoading && member === null && <p className="text-sm text-muted-foreground">No member found.</p>}

      {member && (
        <div className="space-y-4 rounded-xl border border-border bg-background p-4">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Member</div>
              <div className="font-semibold">{member.user.name || member.user.username || member.user.email}</div>
              <div className="text-xs text-muted-foreground">{member.user.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Support released</div>
              <div className="font-semibold">{fmt(member.releasedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Waiting period ends</div>
              <div className="font-semibold">{member.inWaitingPeriod ? fmt(member.currentEndsAt) : "Not in a waiting period"}</div>
            </div>
          </div>

          {member.inWaitingPeriod && (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={mode === "months"} onChange={() => setMode("months")} />
                  Set to
                  <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    disabled={mode !== "months"}
                    className="rounded-lg border border-border bg-background px-2 py-1"
                  >
                    {[12, 6, 3, 1].map((m) => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                  from release
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={mode === "end_now"} onChange={() => setMode("end_now")} />
                  End it now
                </label>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Reason (required), e.g. medical emergency approved by management"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => reduce.mutate({ userId: member.user.id, mode, months: mode === "months" ? months : undefined, reason })}
                disabled={reduce.isPending || reason.trim().length < 5}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {reduce.isPending ? "Saving…" : "Reduce waiting period"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
