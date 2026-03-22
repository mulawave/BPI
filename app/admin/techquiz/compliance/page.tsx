"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Shield,
  ChevronLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  X,
  Plus,
  ChevronRight,
  Users,
  ScrollText,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────
type ComplianceTab = "legal" | "audit" | "consent";

const TABS: { id: ComplianceTab; label: string; icon: React.ReactNode }[] = [
  { id: "legal",   label: "Legal Events",  icon: <AlertTriangle size={14} /> },
  { id: "audit",   label: "Audit Log",     icon: <Activity size={14} /> },
  { id: "consent", label: "Consent Log",   icon: <ScrollText size={14} /> },
];

function fmt(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr as string), "dd MMM yyyy, HH:mm"); } catch { return "—"; }
}

// ─── Raise Legal Event Modal ─────────────────────────────────────────────────
function RaiseLegalModal({
  eventId,
  onClose,
  onCreated,
}: {
  eventId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [desc, setDesc] = useState("");
  const createMut = api.techquiz.createLegalEvent.useMutation({
    onSuccess: () => {
      toast.success("Legal event raised");
      onCreated();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Raise Legal Event
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <X size={18} />
          </button>
        </div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
        <textarea
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe the compliance concern in detail (min 10 chars)…"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => createMut.mutate({ eventId, description: desc })}
            disabled={createMut.isPending || desc.length < 10}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {createMut.isPending ? "Raising…" : "Raise Legal Event"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Resolve Legal Event Modal ───────────────────────────────────────────────
function ResolveModal({
  legalEventId,
  onClose,
  onResolved,
}: {
  legalEventId: string;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [resolution, setResolution] = useState("");
  const resolveMut = api.techquiz.resolveLegalEvent.useMutation({
    onSuccess: () => {
      toast.success("Legal event resolved");
      onResolved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            Resolve Legal Event
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            <X size={18} />
          </button>
        </div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Resolution Notes</label>
        <textarea
          rows={4}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Describe how this was resolved (min 5 chars)…"
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => resolveMut.mutate({ legalEventId, resolution })}
            disabled={resolveMut.isPending || resolution.length < 5}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {resolveMut.isPending ? "Resolving…" : "Resolve"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTechQuizCompliancePage() {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [activeTab, setActiveTab] = useState<ComplianceTab>("legal");
  const [auditPage, setAuditPage] = useState(1);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const utils = api.useUtils();

  const eventsQ = api.techquiz.adminListEvents.useQuery({ page: 1, perPage: 100 });
  const legalQ = api.techquiz.adminListLegalEvents.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId && activeTab === "legal" }
  );
  const auditQ = api.techquiz.getAuditLog.useQuery(
    { eventId: selectedEventId, page: auditPage, perPage: 50 },
    { enabled: !!selectedEventId && activeTab === "audit" }
  );
  const consentQ = api.techquiz.adminConsentLogExport.useQuery(
    { eventId: selectedEventId },
    { enabled: !!selectedEventId && activeTab === "consent" }
  );

  const events = eventsQ.data?.events ?? [];
  const legalEvents = legalQ.data ?? [];
  const auditLogs = auditQ.data?.logs ?? [];
  const auditTotal = auditQ.data?.total ?? 0;
  const consentLogs = consentQ.data ?? [];

  function invalidateAll() {
    utils.techquiz.adminListLegalEvents.invalidate({ eventId: selectedEventId });
  }

  function handleExportCSV(rows: any[], filename: string, headers: string[], rowFn: (r: any) => string[]) {
    const csv = [headers.join(","), ...rows.map((r) => rowFn(r).map((v) => `"${v ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/techquiz"
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Compliance</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Legal events, audit trail, consent records</p>
            </div>
          </div>
        </div>

        {/* Event Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => { setSelectedEventId(e.target.value); setAuditPage(1); }}
            className="w-full max-w-md border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">— Choose an event —</option>
            {events.map((ev: any) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.state}) — {ev.status}
              </option>
            ))}
          </select>
        </div>

        {!selectedEventId && (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select an event to view compliance data</p>
          </div>
        )}

        {selectedEventId && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === t.id
                      ? "bg-amber-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Legal Events Tab ── */}
            <AnimatePresence mode="wait">
              {activeTab === "legal" && (
                <motion.div key="legal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Legal Events
                      <span className="ml-2 text-xs font-normal text-slate-500">({legalEvents.length})</span>
                    </p>
                    <button
                      onClick={() => setShowRaiseModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                    >
                      <Plus size={14} />
                      Raise Issue
                    </button>
                  </div>
                  {legalQ.isPending ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      ))}
                    </div>
                  ) : legalEvents.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                      <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30 text-emerald-500" />
                      <p className="text-sm">No compliance issues raised for this event</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {legalEvents.map((le: any) => (
                        <motion.div
                          key={le.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border ${le.resolvedAt ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {le.resolvedAt ? (
                                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">{le.description}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Raised: {fmt(le.raisedAt)}
                                </p>
                                {le.resolvedAt && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    Resolved: {fmt(le.resolvedAt)} — {le.resolution}
                                  </p>
                                )}
                              </div>
                            </div>
                            {!le.resolvedAt && (
                              <button
                                onClick={() => setResolveId(le.id)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                              >
                                <CheckCircle2 size={13} />
                                Resolve
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Audit Log Tab ── */}
              {activeTab === "audit" && (
                <motion.div key="audit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Audit Log
                      <span className="ml-2 text-xs font-normal text-slate-500">({auditTotal} entries)</span>
                    </p>
                    <button
                      onClick={() => auditQ.refetch()}
                      disabled={auditQ.isFetching}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      <RefreshCw size={13} className={auditQ.isFetching ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>

                  {auditQ.isPending ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      ))}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                      <Activity size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No audit log entries found</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Timestamp</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Actor</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Action</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Entity</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Metadata</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map((log: any) => (
                                <tr
                                  key={log.id}
                                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                                >
                                  <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmt(log.createdAt)}</td>
                                  <td className="px-4 py-2.5">
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100">{log.actor?.name ?? log.actorId}</p>
                                    <p className="text-xs text-slate-400">{log.actor?.role ?? log.actorRole}</p>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                                    {log.entityType}
                                    {log.entityId && <span className="text-slate-400 ml-1 font-mono text-[10px]">{log.entityId.slice(0, 8)}…</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-slate-400 font-mono max-w-xs truncate">
                                    {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination */}
                      {auditTotal > 50 && (
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Page {auditPage} of {Math.ceil(auditTotal / 50)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                              disabled={auditPage === 1}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              onClick={() => setAuditPage((p) => p + 1)}
                              disabled={auditPage >= Math.ceil(auditTotal / 50)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Consent Log Tab ── */}
              {activeTab === "consent" && (
                <motion.div key="consent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Consent Records
                      <span className="ml-2 text-xs font-normal text-slate-500">({consentLogs.length})</span>
                    </p>
                    <button
                      onClick={() =>
                        handleExportCSV(
                          consentLogs,
                          `consent-log-${selectedEventId}.csv`,
                          ["Child Name", "Parent Name", "Parent Email", "Consent Version", "Consent Given At", "IP Address"],
                          (r) => [
                            r.childBeneficiary?.childName,
                            r.parent?.name,
                            r.parent?.email,
                            r.consentVersion,
                            fmt(r.consentGivenAt),
                            r.ipAddress,
                          ]
                        )
                      }
                      disabled={consentLogs.length === 0}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      <FileText size={14} />
                      Export CSV
                    </button>
                  </div>

                  {consentQ.isPending ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                      ))}
                    </div>
                  ) : consentLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                      <ScrollText size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No consent records found for this event</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Child Name</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Parent</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Version</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Consented At</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">IP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {consentLogs.map((log: any) => (
                              <tr
                                key={log.id}
                                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                              >
                                <td className="px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {log.childBeneficiary?.childName ?? "—"}
                                </td>
                                <td className="px-4 py-2.5">
                                  <p className="text-xs text-slate-700 dark:text-slate-200">{log.parent?.name ?? "—"}</p>
                                  <p className="text-xs text-slate-400">{log.parent?.email ?? ""}</p>
                                </td>
                                <td className="px-4 py-2.5 text-xs font-mono text-slate-600 dark:text-slate-300">{log.consentVersion}</td>
                                <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{fmt(log.consentGivenAt)}</td>
                                <td className="px-4 py-2.5 text-xs font-mono text-slate-400">{log.ipAddress ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Modals */}
      {showRaiseModal && (
        <RaiseLegalModal
          eventId={selectedEventId}
          onClose={() => setShowRaiseModal(false)}
          onCreated={invalidateAll}
        />
      )}
      {resolveId && (
        <ResolveModal
          legalEventId={resolveId}
          onClose={() => setResolveId(null)}
          onResolved={invalidateAll}
        />
      )}
    </div>
  );
}
