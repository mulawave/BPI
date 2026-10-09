"use client";

import React, { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { HeartHandshake, Plus } from "lucide-react";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

export default function AdminSpecialSupportPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.csp.listSpecialSupportRequests.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(100000);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const create = api.csp.createSpecialSupportRequest.useMutation({
    onSuccess: () => {
      toast.success("Special Community Support campaign created");
      setShowForm(false);
      setPurpose("");
      setNotes("");
      utils.csp.listSpecialSupportRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Special Community Support</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-rose-600" />
              Special Community Support
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Admin-only, no profit motive (e.g. a borehole for a state or LGA). 100% of what is raised goes to the
              BPI project account, with no fee. Contributions don&apos;t count toward a contributor&apos;s own CSP
              eligibility and aren&apos;t picked up by Auto-Contribute.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="self-start inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700"
          >
            <Plus className="w-4 h-4" /> New campaign
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Target amount (₦)</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.round(Number(e.target.value) || 0)))}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</span>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Borehole for Ajegunle community, Lagos State"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
                Cancel
              </button>
              <button
                onClick={() => create.mutate({ amount, purpose, notes: notes || undefined })}
                disabled={create.isPending || purpose.trim().length < 3}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {create.isPending ? "Creating..." : "Create campaign"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ) : (data?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No Special Community Support campaigns yet.</p>
          ) : (
            data!.map((r) => (
              <div key={r.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{r.purpose}</h3>
                    {r.notes && <p className="text-sm text-gray-500 dark:text-gray-400">{r.notes}</p>}
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  {naira(r.raisedAmount)} raised of {naira(r.thresholdAmount)} target
                  {r.releasedAt && <span> · released {format(new Date(r.releasedAt), "dd MMM yyyy")}</span>}
                </div>
                {r.supporters.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Supporters</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {r.supporters.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                          <span className="text-gray-900 dark:text-white font-medium">{naira(s.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
