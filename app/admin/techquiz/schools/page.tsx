"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  School,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  ShieldOff,
  FileCheck,
  FileX,
  Users,
  Trophy,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Search,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type SchoolStatus = "PENDING" | "APPROVED" | "SUSPENDED";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const STATUS_BADGE: Record<SchoolStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  APPROVED:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── SchoolFormModal ──────────────────────────────────────────────────────────
interface SchoolFormProps {
  mode: "create" | "edit";
  school?: any;
  onClose: () => void;
  onDone: () => void;
}
function SchoolFormModal({ mode, school, onClose, onDone }: SchoolFormProps) {
  const [form, setForm] = useState({
    name: school?.name ?? "",
    state: school?.state ?? "",
    contactName: school?.contactName ?? "",
    contactEmail: school?.contactEmail ?? "",
    contactPhone: school?.contactPhone ?? "",
  });

  const createMut = api.techquiz.createSchool.useMutation({
    onSuccess: () => { toast.success("School created successfully"); onDone(); },
    onError: (e) => toast.error(e.message),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim() || !form.state) return toast.error("Name and state are required");
    createMut.mutate({
      name: form.name.trim(),
      state: form.state,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
    });
  };

  const busy = createMut.isPending;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {mode === "create" ? "Register New School" : "Edit School"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* School Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">School Name *</label>
            <input
              value={form.name}
              onChange={f("name")}
              placeholder="e.g. Kings' College Lagos"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] text-sm focus:outline-none focus:border-[#0d3b29]"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">State *</label>
            <select
              value={form.state}
              onChange={f("state")}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white text-sm focus:outline-none focus:border-[#0d3b29]"
            >
              <option value="">Select state…</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contact Name</label>
              <input
                value={form.contactName}
                onChange={f("contactName")}
                placeholder="Principal / Admin"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] text-sm focus:outline-none focus:border-[#0d3b29]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contact Phone</label>
              <input
                value={form.contactPhone}
                onChange={f("contactPhone")}
                placeholder="+234…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] text-sm focus:outline-none focus:border-[#0d3b29]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contact Email</label>
            <input
              value={form.contactEmail}
              onChange={f("contactEmail")}
              placeholder="school@example.com"
              type="email"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] text-sm focus:outline-none focus:border-[#0d3b29]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !form.name.trim() || !form.state}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#0d3b29] hover:bg-[#0a2f21] disabled:opacity-50 transition"
          >
            {busy ? "Saving…" : mode === "create" ? "Register School" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SchoolDetailPanel ────────────────────────────────────────────────────────
interface DetailPanelProps { school: any; onClose: () => void; onRefresh: () => void; }
type DetailTab = "info" | "admins";

function SchoolDetailPanel({ school, onClose, onRefresh }: DetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>("info");
  const [adminEmailQuery, setAdminEmailQuery] = useState("");
  const [adminSearchQ, setAdminSearchQ] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string | null; email: string; role: string } | null>(null);
  const adminSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const approveMut = api.techquiz.approveSchool.useMutation({
    onSuccess: () => { toast.success("School approved"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const suspendMut = api.techquiz.suspendSchool.useMutation({
    onSuccess: () => { toast.success("School suspended"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const mouMut = api.techquiz.updateSchoolMoU.useMutation({
    onSuccess: () => { toast.success("MoU status updated"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const createAdminMut = api.techquiz.createSchoolAdminProfile.useMutation({
    onSuccess: () => {
      toast.success("School admin profile created");
      setAdminEmailQuery("");
      setAdminSearchQ("");
      setSelectedUser(null);
      onRefresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const userSearchQuery = api.techquiz.searchUsersByEmail.useQuery(
    { email: adminSearchQ },
    { enabled: adminSearchQ.length >= 2, staleTime: 10_000 },
  );
  useEffect(() => {
    if (adminSearchTimer.current) clearTimeout(adminSearchTimer.current);
    if (adminEmailQuery.length < 2) { setAdminSearchQ(""); return; }
    adminSearchTimer.current = setTimeout(() => setAdminSearchQ(adminEmailQuery), 300);
    return () => { if (adminSearchTimer.current) clearTimeout(adminSearchTimer.current); };
  }, [adminEmailQuery]);

  const DETAIL_TABS: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: "info",   label: "Info",    icon: <School size={13} /> },
    { id: "admins", label: "Admins",  icon: <Users size={13} /> },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[school.status as SchoolStatus]}`}>
                {school.status}
              </span>
              {school.mouSigned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
                  <FileCheck size={10} /> MoU Signed
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mt-1">{school.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {school.state}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mt-1">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex-wrap">
          {school.status === "PENDING" && (
            <button
              onClick={() => approveMut.mutate({ schoolId: school.id, mouSigned: school.mouSigned })}
              disabled={approveMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <CheckCircle2 size={13} />
              {approveMut.isPending ? "Approving…" : "Approve School"}
            </button>
          )}
          {school.status === "APPROVED" && (
            <button
              onClick={() => { if (confirm("Suspend this school?")) suspendMut.mutate({ schoolId: school.id }); }}
              disabled={suspendMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
            >
              <ShieldOff size={13} />
              {suspendMut.isPending ? "Suspending…" : "Suspend"}
            </button>
          )}
          {school.status === "SUSPENDED" && (
            <button
              onClick={() => approveMut.mutate({ schoolId: school.id, mouSigned: school.mouSigned })}
              disabled={approveMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <CheckCircle2 size={13} />
              {approveMut.isPending ? "Reinstating…" : "Reinstate"}
            </button>
          )}
          <button
            onClick={() => mouMut.mutate({ schoolId: school.id, mouSigned: !school.mouSigned })}
            disabled={mouMut.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
              school.mouSigned
                ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {school.mouSigned ? <FileCheck size={13} /> : <FileX size={13} />}
            {mouMut.isPending ? "Updating…" : school.mouSigned ? "MoU: Signed" : "Mark MoU Signed"}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          {DETAIL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                tab === t.id
                  ? "bg-[#0d3b29] text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === "info" && (
            <div className="space-y-5">
              {/* Identity */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">School Identity</h3>
                <InfoRow icon={<School size={14} />} label="Name" value={school.name} />
                <InfoRow icon={<MapPin size={14} />} label="State" value={school.state} />
                <InfoRow icon={<Trophy size={14} />} label="Applications" value={String(school._count?.applications ?? 0)} />
                <InfoRow icon={<User size={14} />} label="Status" value={school.status} />
                {school.mouSigned && school.mouSignedAt && (
                  <InfoRow icon={<FileCheck size={14} />} label="MoU Signed At" value={new Date(school.mouSignedAt).toLocaleDateString()} />
                )}
                <InfoRow label="Registered" value={new Date(school.createdAt).toLocaleDateString()} />
              </div>

              {/* Contact */}
              {(school.contactName || school.contactEmail || school.contactPhone) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Details</h3>
                  {school.contactName  && <InfoRow icon={<User size={14} />}  label="Contact"  value={school.contactName} />}
                  {school.contactEmail && <InfoRow icon={<Mail size={14} />}  label="Email"    value={school.contactEmail} />}
                  {school.contactPhone && <InfoRow icon={<Phone size={14} />} label="Phone"    value={school.contactPhone} />}
                </div>
              )}
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-5">
              {/* Linked Admin Profiles */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Linked School Admins</h3>
                {school.adminProfiles?.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No school admins linked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {school.adminProfiles?.map((ap: any) => (
                      <div key={ap.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{ap.user?.name ?? "—"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{ap.user?.email ?? ap.userId}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ap.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                          {ap.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Admin */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Link New Admin</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search by email to find and select a BPI member to assign as school admin.
                </p>
                {/* Email search input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    value={adminEmailQuery}
                    onChange={(e) => { setAdminEmailQuery(e.target.value); setSelectedUser(null); }}
                    placeholder="Search by email…"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white placeholder-[#b0b0b0] text-sm focus:outline-none focus:border-[#0d3b29]"
                  />
                </div>
                {/* Search results */}
                {adminSearchQ.length >= 2 && !selectedUser && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {userSearchQuery.isLoading ? (
                      <p className="text-xs text-slate-400 px-4 py-3">Searching…</p>
                    ) : userSearchQuery.data?.length === 0 ? (
                      <p className="text-xs text-slate-400 px-4 py-3">No users found for &ldquo;{adminSearchQ}&rdquo;</p>
                    ) : (
                      userSearchQuery.data?.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser({ ...u, email: u.email ?? "" }); setAdminEmailQuery(u.email ?? ""); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#0d3b29]/5 dark:hover:bg-[#0d3b29]/20 transition text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{u.name ?? "—"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 capitalize">
                            {(u.role ?? "user").toLowerCase()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {/* Selected user chip */}
                {selectedUser && (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-[#0d3b29]/20 border border-emerald-200 dark:border-[#0d3b29]/30 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{selectedUser.name ?? "—"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedUser(null); setAdminEmailQuery(""); setAdminSearchQ(""); }}
                      className="text-slate-400 hover:text-red-500 transition ml-3 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (!selectedUser) return toast.error("Select a user first");
                    createAdminMut.mutate({ userId: selectedUser.id, schoolId: school.id });
                  }}
                  disabled={createAdminMut.isPending || !selectedUser}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-white bg-[#0d3b29] hover:bg-[#0a2f21] disabled:opacity-50 transition"
                >
                  {createAdminMut.isPending ? "Linking…" : "Link as School Admin"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── InfoRow helper ─────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>}
      <span className="text-xs text-slate-500 dark:text-slate-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 dark:text-white flex-1 break-all">{value}</span>
    </div>
  );
}

// ─── SchoolRow ────────────────────────────────────────────────────────────────
interface SchoolRowProps { school: any; onDetail: (s: any) => void; onRefresh: () => void; }
function SchoolRow({ school, onDetail, onRefresh }: SchoolRowProps) {
  const approveMut = api.techquiz.approveSchool.useMutation({
    onSuccess: () => { toast.success("School approved"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const suspendMut = api.techquiz.suspendSchool.useMutation({
    onSuccess: () => { toast.success("School suspended"); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-[#0d3b29]/10 dark:bg-[#0d3b29]/20 flex items-center justify-center flex-shrink-0">
        <School size={18} className="text-[#0d3b29] dark:text-emerald-400" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{school.name}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[school.status as SchoolStatus]}`}>
            {school.status}
          </span>
          {school.mouSigned && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FileCheck size={9} /> MoU
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
            <MapPin size={10} /> {school.state}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
            <Trophy size={10} /> {school._count?.applications ?? 0} applications
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
            <Users size={10} /> {school.adminProfiles?.length ?? 0} admin{school.adminProfiles?.length !== 1 ? "s" : ""}
          </span>
          {school.contactEmail && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
              {school.contactEmail}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {school.status === "PENDING" && (
          <button
            onClick={() => approveMut.mutate({ schoolId: school.id, mouSigned: school.mouSigned })}
            disabled={approveMut.isPending}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <CheckCircle2 size={11} />
            {approveMut.isPending ? "…" : "Approve"}
          </button>
        )}
        {school.status === "APPROVED" && (
          <button
            onClick={() => { if (confirm(`Suspend "${school.name}"?`)) suspendMut.mutate({ schoolId: school.id }); }}
            disabled={suspendMut.isPending}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 disabled:opacity-50 transition"
          >
            <ShieldOff size={11} />
            {suspendMut.isPending ? "…" : "Suspend"}
          </button>
        )}
        {school.status === "SUSPENDED" && (
          <button
            onClick={() => approveMut.mutate({ schoolId: school.id, mouSigned: school.mouSigned })}
            disabled={approveMut.isPending}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <CheckCircle2 size={11} />
            {approveMut.isPending ? "…" : "Reinstate"}
          </button>
        )}
        <button
          onClick={() => onDetail(school)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
        >
          <Eye size={11} /> Details
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTechQuizSchoolsPage() {
  const [page, setPage] = useState(1);
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState<SchoolStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailTarget, setDetailTarget] = useState<any | null>(null);

  const schoolsQ = api.techquiz.adminListSchools.useQuery(
    { page, perPage: 20, state: filterState || undefined, status: (filterStatus as SchoolStatus) || undefined }
  );

  const schools = schoolsQ.data?.schools ?? [];
  const total = schoolsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const refresh = () => { void schoolsQ.refetch(); };

  // Stats
  const allSchoolsQ = api.techquiz.adminListSchools.useQuery({ page: 1, perPage: 1000 });
  const allSchools = allSchoolsQ.data?.schools ?? [];
  const totalCount     = allSchoolsQ.data?.total ?? 0;
  const approvedCount  = allSchools.filter((s: any) => s.status === "APPROVED").length;
  const pendingCount   = allSchools.filter((s: any) => s.status === "PENDING").length;
  const suspendedCount = allSchools.filter((s: any) => s.status === "SUSPENDED").length;
  const mouSignedCount = allSchools.filter((s: any) => s.mouSigned).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/techquiz"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft size={14} /> Events
          </Link>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0d3b29]/10 dark:bg-[#0d3b29]/20 flex items-center justify-center">
              <School size={16} className="text-[#0d3b29] dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none">School Partners</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage participating schools & admin accounts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={schoolsQ.isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={schoolsQ.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0d3b29] hover:bg-[#0a2f21] transition"
          >
            <Plus size={14} /> Register School
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Schools"  value={totalCount}     color="text-slate-800 dark:text-white" />
        <StatCard label="Approved"       value={approvedCount}  color="text-emerald-600 dark:text-emerald-400" sub="active in system" />
        <StatCard label="Pending"        value={pendingCount}   color="text-amber-600 dark:text-amber-400"    sub="awaiting review" />
        <StatCard label="MoU Signed"     value={mouSignedCount} color="text-indigo-600 dark:text-indigo-400"  sub={`${suspendedCount} suspended`} />
      </div>

      {/* Filters + List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Search size={13} />
            {total} school{total !== 1 ? "s" : ""}
          </div>
          <div className="flex-1" />
          <select
            value={filterState}
            onChange={(e) => { setFilterState(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white text-xs focus:outline-none focus:border-[#0d3b29]"
          >
            <option value="">All States</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as SchoolStatus | ""); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white text-xs focus:outline-none focus:border-[#0d3b29]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* List */}
        <div className="p-4 space-y-2 min-h-[200px]">
          {schoolsQ.isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-600 text-sm">Loading…</div>
          ) : schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <School size={40} className="text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No schools found. Register the first school partner.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0d3b29] hover:bg-[#0a2f21] transition"
              >
                <Plus size={13} /> Register School
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {schools.map((s: any) => (
                <SchoolRow key={s.id} school={s} onDetail={setDetailTarget} onRefresh={refresh} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <SchoolFormModal
            mode="create"
            onClose={() => setShowCreate(false)}
            onDone={() => { setShowCreate(false); refresh(); }}
          />
        )}
        {detailTarget && (
          <SchoolDetailPanel
            school={detailTarget}
            onClose={() => setDetailTarget(null)}
            onRefresh={() => { refresh(); setDetailTarget(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
