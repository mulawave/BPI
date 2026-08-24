"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { api } from "@/client/trpc";
import {
  Key,
  Plus,
  Copy,
  Check,
  Ban,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
} from "lucide-react";

export default function AdminApiKeysPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRate, setNewKeyRate] = useState(60);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logFilter, setLogFilter] = useState<string | undefined>(undefined);

  const { data: keys, isLoading, refetch } = api.apiKeys.list.useQuery();
  const { data: logs } = api.apiKeys.getRequestLogs.useQuery({
    apiKeyId: logFilter,
    page: logPage,
    pageSize: 15,
  });

  const createMutation = api.apiKeys.create.useMutation({
    onSuccess: (res) => {
      setCreatedKey(res.rawKey);
      setCopied(false);
      refetch();
      toast.success("API key created");
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeMutation = api.apiKeys.revoke.useMutation({
    onSuccess: () => { toast.success("Key revoked"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const reactivateMutation = api.apiKeys.reactivate.useMutation({
    onSuccess: () => { toast.success("Key reactivated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function handleCreate() {
    if (newKeyName.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    createMutation.mutate({ name: newKeyName.trim(), rateLimit: newKeyRate });
  }

  function copyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeCreate() {
    setShowCreate(false);
    setNewKeyName("");
    setNewKeyRate(60);
    setCreatedKey(null);
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">API Keys</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-emerald-600" />
            API Keys
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage API keys for external applications to verify SSC codes and fetch member details.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600"
        >
          <Plus className="h-4 w-4" /> Create Key
        </button>
      </div>

      {/* Keys table */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading API keys…</p>
        ) : !keys || keys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Prefix</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Rate Limit</th>
                  <th className="pb-2 pr-3">Requests</th>
                  <th className="pb-2 pr-3">Last Used</th>
                  <th className="pb-2 pr-3">Created</th>
                  <th className="pb-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-foreground">{k.name}</p>
                      <p className="text-xs text-muted-foreground">{k.createdByName}</p>
                    </td>
                    <td className="py-3 pr-3"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{k.keyPrefix}…</code></td>
                    <td className="py-3 pr-3">
                      {k.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Active</span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Revoked</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{k.rateLimit}/min</td>
                    <td className="py-3 pr-3 text-muted-foreground">{k.totalRequests}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{k.lastUsedAt ? format(new Date(k.lastUsedAt), "MMM d, HH:mm") : "—"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{format(new Date(k.createdAt), "MMM d, yyyy")}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        {k.isActive ? (
                          <button onClick={() => revokeMutation.mutate({ id: k.id })} disabled={revokeMutation.isPending} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                            <Ban className="inline h-3 w-3" /> Revoke
                          </button>
                        ) : (
                          <button onClick={() => reactivateMutation.mutate({ id: k.id })} disabled={reactivateMutation.isPending} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                            <RotateCcw className="inline h-3 w-3" /> Activate
                          </button>
                        )}
                        <button onClick={() => { setLogFilter(k.id); setLogPage(1); }} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted/60">
                          <Activity className="inline h-3 w-3" /> Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request logs */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-foreground">Request Logs</h3>
          {logFilter && (
            <button onClick={() => { setLogFilter(undefined); setLogPage(1); }} className="ml-auto rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-muted/60">Clear filter</button>
          )}
        </div>
        {!logs || logs.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No API requests logged yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">Key</th>
                    <th className="pb-2 pr-3">SSC</th>
                    <th className="pb-2 pr-3">Matched User</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.logs.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-3 text-muted-foreground"><Clock className="inline h-3 w-3 mr-1" />{format(new Date(l.createdAt), "MMM d, HH:mm:ss")}</td>
                      <td className="py-2 pr-3"><span className="text-xs">{l.keyName}</span></td>
                      <td className="py-2 pr-3"><code className="text-xs">{l.sscQueried ?? "—"}</code></td>
                      <td className="py-2 pr-3">{l.matchedUserName ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${l.status === 200 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : l.status === 404 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : l.status === 401 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>{l.status}</span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground text-xs">{l.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logs.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3">
                <button onClick={() => setLogPage((p) => Math.max(1, p - 1))} disabled={logPage <= 1} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm text-muted-foreground">Page {logPage} of {logs.totalPages}</span>
                <button onClick={() => setLogPage((p) => Math.min(logs.totalPages, p + 1))} disabled={logPage >= logs.totalPages} className="rounded-lg border border-border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {createdKey ? (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-2">API Key Created</h3>
                <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-900/20 p-3 mb-4">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2">⚠️ Copy your API key now. It will not be shown again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs break-all">{createdKey}</code>
                    <button onClick={copyKey} className="rounded-lg border border-border p-2 hover:bg-muted/60">
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Done</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-4">Create API Key</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Application Name</label>
                    <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Partner Portal" className="mt-1 w-full rounded-xl border-2 border-border bg-background/70 px-3 py-2 text-foreground focus:border-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Rate Limit (requests/minute)</label>
                    <input type="number" value={newKeyRate} onChange={(e) => setNewKeyRate(Number(e.target.value))} min={1} max={10000} className="mt-1 w-full rounded-xl border-2 border-border bg-background/70 px-3 py-2 text-foreground focus:border-emerald-500 focus:outline-none" />
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={closeCreate} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60">Cancel</button>
                  <button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {createMutation.isPending ? "Creating…" : "Create Key"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
