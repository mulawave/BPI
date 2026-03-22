"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Trophy,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  ArrowRight,
  X,
  Calendar,
  MapPin,
  School,
  Settings,
  BarChart3,
  Users,
  ClipboardList,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  Trash2,
  Star,
  Award,
  Sliders,
  BookOpen,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "events";
type EventStatus = "DRAFT" | "APPROVED" | "PUBLISHED" | "COMPLETED" | "ARCHIVED";
type Freq = "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "ANNUAL";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const STATUS_BADGE: Record<EventStatus, string> = {
  DRAFT:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  APPROVED:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  COMPLETED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200",
  ARCHIVED:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
};
const STATUS_NEXT: Partial<Record<EventStatus, EventStatus>> = {
  DRAFT: "APPROVED",
  APPROVED: "PUBLISHED",
  PUBLISHED: "COMPLETED",
  COMPLETED: "ARCHIVED",
};
const STATUS_NEXT_LABEL: Partial<Record<EventStatus, string>> = {
  DRAFT: "Approve",
  APPROVED: "Publish",
  PUBLISHED: "Mark Complete",
  COMPLETED: "Archive",
};

const TABS = [
  { id: "overview" as Tab, label: "Overview", icon: <BarChart3 size={15} /> },
  { id: "events" as Tab, label: "Events", icon: <Trophy size={15} /> },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────
function Pill({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status as EventStatus] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────
type EventFormData = {
  title: string;
  state: string;
  frequencyType: Freq;
  applicationWindowStart: string;
  applicationWindowEnd: string;
  sponsorshipPackagePrice: number;
  topQualifiersPerSchool: number;
  cbtWeightPct: number;
  onsiteWeightPct: number;
  isZonalOrNational: boolean;
};
const DEFAULT_FORM: EventFormData = {
  title: "",
  state: "",
  frequencyType: "ANNUAL",
  applicationWindowStart: "",
  applicationWindowEnd: "",
  sponsorshipPackagePrice: 18000,
  topQualifiersPerSchool: 4,
  cbtWeightPct: 55,
  onsiteWeightPct: 45,
  isZonalOrNational: false,
};

function EventFormModal({
  mode,
  event,
  onClose,
  onDone,
}: {
  mode: "create" | "edit";
  event?: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<EventFormData>(() =>
    mode === "edit" && event
      ? {
          title: event.title ?? "",
          state: event.state ?? "",
          frequencyType: event.frequencyType ?? "ANNUAL",
          applicationWindowStart: event.applicationWindowStart
            ? format(new Date(event.applicationWindowStart), "yyyy-MM-dd'T'HH:mm")
            : "",
          applicationWindowEnd: event.applicationWindowEnd
            ? format(new Date(event.applicationWindowEnd), "yyyy-MM-dd'T'HH:mm")
            : "",
          sponsorshipPackagePrice: Number(event.sponsorshipPackagePrice) || 18000,
          topQualifiersPerSchool: event.topQualifiersPerSchool || 4,
          cbtWeightPct: event.cbtWeightPct || 55,
          onsiteWeightPct: event.onsiteWeightPct || 45,
          isZonalOrNational: event.isZonalOrNational || false,
        }
      : DEFAULT_FORM
  );

  const createMut = api.techquiz.createEvent.useMutation({
    onSuccess: () => { toast.success("Event created!"); onDone(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = api.techquiz.updateEvent.useMutation({
    onSuccess: () => { toast.success("Event updated!"); onDone(); },
    onError: (e) => toast.error(e.message),
  });

  const handle = (k: keyof EventFormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim() || !form.state) return toast.error("Title and State are required");
    if (form.cbtWeightPct + form.onsiteWeightPct !== 100) return toast.error("CBT % + Onsite % must equal 100");
    if (mode === "create") {
      createMut.mutate({
        ...form,
        applicationWindowStart: form.applicationWindowStart || undefined,
        applicationWindowEnd: form.applicationWindowEnd || undefined,
      });
    } else {
      updateMut.mutate({
        eventId: event.id,
        ...form,
        applicationWindowStart: form.applicationWindowStart || undefined,
        applicationWindowEnd: form.applicationWindowEnd || undefined,
      });
    }
  };

  const busy = createMut.isPending || updateMut.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === "create" ? "Create TechQuiz Event" : "Edit Event"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === "create" ? "Configure a new competition event" : `Editing: ${event?.title}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title + State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Event Title *</label>
              <input
                value={form.title}
                onChange={(e) => handle("title", e.target.value)}
                placeholder="e.g. Lagos TechQuiz Q1 2026"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">State *</label>
              <select
                value={form.state}
                onChange={(e) => handle("state", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Frequency + Zonal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Frequency</label>
              <select
                value={form.frequencyType}
                onChange={(e) => handle("frequencyType", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"] as Freq[]).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => handle("isZonalOrNational", !form.isZonalOrNational)}
                  className={`w-10 h-6 rounded-full transition-colors ${form.isZonalOrNational ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"} relative cursor-pointer`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isZonalOrNational ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Zonal / National event</span>
              </label>
            </div>
          </div>

          {/* Application Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Application Window</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={form.applicationWindowStart}
                onChange={(e) => handle("applicationWindowStart", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="datetime-local"
                value={form.applicationWindowEnd}
                onChange={(e) => handle("applicationWindowEnd", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Start → End</p>
          </div>

          {/* Sponsorship price + Qualifiers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Sponsorship Price (₦)</label>
              <input
                type="number"
                value={form.sponsorshipPackagePrice}
                onChange={(e) => handle("sponsorshipPackagePrice", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Top Qualifiers / School</label>
              <input
                type="number"
                value={form.topQualifiersPerSchool}
                min={1}
                onChange={(e) => handle("topQualifiersPerSchool", Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* CBT/Onsite weights */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Scoring Weights <span className="text-slate-400 font-normal">(CBT% + Onsite% must = 100)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-slate-500 mb-1">CBT Weight %</p>
                <input
                  type="number"
                  value={form.cbtWeightPct}
                  min={1} max={99}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    handle("cbtWeightPct", v);
                    handle("onsiteWeightPct", 100 - v);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-1">Onsite Weight %</p>
                <input
                  type="number"
                  value={form.onsiteWeightPct}
                  min={1} max={99}
                  readOnly
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-500 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${form.cbtWeightPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>CBT {form.cbtWeightPct}%</span>
              <span>Onsite {form.onsiteWeightPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-5 py-2 text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition"
          >
            {busy ? "Saving…" : mode === "create" ? "Create Event" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Event Detail Panel ────────────────────────────────────────────────────────
function EventDetailPanel({ event, onClose, onRefresh }: { event: any; onClose: () => void; onRefresh: () => void }) {
  const [activeSection, setActiveSection] = useState<"info" | "schedule" | "schools" | "brackets" | "rubric" | "apps" | "ops" | "results">("info");
  const [appsPage, setAppsPage] = useState(1);
  const [appsStatusFilter, setAppsStatusFilter] = useState("");
  const [leaderboardSchoolFilter, setLeaderboardSchoolFilter] = useState("");

  // Round1 schedule form
  const [r1, setR1] = useState({ venueDescription: "", cbtWindowStart: "", cbtWindowEnd: "", notes: "" });
  // Round2 schedule form
  const [r2, setR2] = useState({ venueDescription: "", cbtWindowStart: "", cbtWindowEnd: "", onsiteDate: "", notes: "" });
  // Scoring rubric
  const [rubric, setRubric] = useState({ maxPresentation: 40, maxLogicalReasoning: 30, maxUseCase: 30 });
  // Award brackets (default 3)
  const [brackets, setBrackets] = useState([
    { minRank: 1, maxRank: 3, bracketLabel: "Major", awardDescription: "1st–3rd Prize" , bpiActivationGranted: true },
    { minRank: 4, maxRank: 10, bracketLabel: "Merit", awardDescription: "4th–10th Prize", bpiActivationGranted: true },
    { minRank: 11, maxRank: 20, bracketLabel: "Consolation", awardDescription: "11th–20th Prize", bpiActivationGranted: true },
  ]);
  // School assign
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolMin, setSchoolMin] = useState(10);
  const [schoolMax, setSchoolMax] = useState(12);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  // Prefill from existing data
  useEffect(() => {
    if (event.round1Schedules?.length > 0) {
      const s = event.round1Schedules[0];
      setR1({
        venueDescription: s.venueDescription || "",
        cbtWindowStart: s.cbtWindowStart ? format(new Date(s.cbtWindowStart), "yyyy-MM-dd'T'HH:mm") : "",
        cbtWindowEnd: s.cbtWindowEnd ? format(new Date(s.cbtWindowEnd), "yyyy-MM-dd'T'HH:mm") : "",
        notes: s.notes || "",
      });
    }
    if (event.round2Schedules?.length > 0) {
      const s = event.round2Schedules[0];
      setR2({
        venueDescription: s.venueDescription || "",
        cbtWindowStart: s.cbtWindowStart ? format(new Date(s.cbtWindowStart), "yyyy-MM-dd'T'HH:mm") : "",
        cbtWindowEnd: s.cbtWindowEnd ? format(new Date(s.cbtWindowEnd), "yyyy-MM-dd'T'HH:mm") : "",
        onsiteDate: s.onsiteDate ? format(new Date(s.onsiteDate), "yyyy-MM-dd'T'HH:mm") : "",
        notes: s.notes || "",
      });
    }
    if (event.scoringRubric) {
      setRubric({
        maxPresentation: event.scoringRubric.maxPresentation,
        maxLogicalReasoning: event.scoringRubric.maxLogicalReasoning,
        maxUseCase: event.scoringRubric.maxUseCase,
      });
    }
    if (event.awardBrackets?.length > 0) {
      setBrackets(event.awardBrackets.map((b: any) => ({
        minRank: b.minRank,
        maxRank: b.maxRank,
        bracketLabel: b.bracketLabel,
        awardDescription: b.awardDescription || "",
        bpiActivationGranted: b.bpiActivationGranted,
      })));
    }
  }, [event]);

  // Schools picker query
  const schoolsQ = api.techquiz.adminListSchools.useQuery(
    { page: 1, perPage: 100, status: "APPROVED", state: event.state },
    { enabled: activeSection === "schools" }
  );

  const r1Mut = api.techquiz.upsertRound1Schedule.useMutation({ onSuccess: () => { toast.success("Round 1 schedule saved"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const r2Mut = api.techquiz.upsertRound2Schedule.useMutation({ onSuccess: () => { toast.success("Round 2 schedule saved"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const rubricMut = api.techquiz.upsertScoringRubric.useMutation({ onSuccess: () => { toast.success("Rubric saved"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const bracketMut = api.techquiz.upsertAwardBrackets.useMutation({ onSuccess: () => { toast.success("Award brackets saved"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const assignMut = api.techquiz.assignSchoolToEvent.useMutation({ onSuccess: () => { toast.success("School assigned"); onRefresh(); schoolsQ.refetch(); }, onError: (e) => toast.error(e.message) });
  const removeMut = api.techquiz.removeSchoolFromEvent.useMutation({ onSuccess: () => { toast.success("School removed"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const quotaMut = api.techquiz.updateSchoolQuota.useMutation({ onSuccess: () => { toast.success("Quota updated"); onRefresh(); }, onError: (e) => toast.error(e.message) });

  // Apps tab query
  const appsQ = api.techquiz.adminListApplications.useQuery(
    { eventId: event.id, page: appsPage, perPage: 15, status: (appsStatusFilter as any) || undefined },
    { enabled: activeSection === "apps" }
  );

  // Leaderboard query
  const leaderboardQ = api.techquiz.adminGetLeaderboard.useQuery(
    { eventId: event.id, schoolId: leaderboardSchoolFilter || undefined },
    { enabled: activeSection === "results" }
  );

  // Operations mutations
  const issueCBTMut     = api.techquiz.issueCBTAccess.useMutation({ onSuccess: (d) => { toast.success(`CBT access issued to ${(d as any).issued} applications`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const computeR1Mut    = api.techquiz.computeRound1Rankings.useMutation({ onSuccess: (d) => { toast.success(`Round 1 rankings computed. ${(d as any).qualifiersSelected} qualifiers selected`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const issueR2Mut      = api.techquiz.issueRound2Access.useMutation({ onSuccess: (d) => { toast.success(`Round 2 access issued to ${(d as any).issued} qualifiers`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const computeFinalMut = api.techquiz.computeFinalScores.useMutation({ onSuccess: (d) => { toast.success(`Final scores computed for ${(d as any).ranked} participants`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const lockOnsiteMut   = api.techquiz.lockOnsiteScores.useMutation({ onSuccess: () => { toast.success("Onsite scores locked"); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const checkMinMut     = api.techquiz.checkSchoolMinimumStatus.useMutation({ onSuccess: (d: any) => { if (d.notReached.length === 0) { toast.success("All schools have reached minimum quota"); } else { toast.error(`${d.notReached.length} school(s) below minimum`); } }, onError: (e) => toast.error(e.message) });

  // Results mutations
  const publishR1Mut       = api.techquiz.publishRound1Results.useMutation({ onSuccess: (d) => { toast.success(`Round 1 results published to ${(d as any).published} participants`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const publishFinalMut    = api.techquiz.publishFinalResults.useMutation({ onSuccess: (d) => { toast.success(`Final results published to ${(d as any).published} participants`); onRefresh(); }, onError: (e) => toast.error(e.message) });
  const r1BlogMut          = api.techquiz.publishRound1BlogPost.useMutation({ onSuccess: (d: any) => toast.success(`Blog post published — ${d.qualifiers} qualifiers listed`), onError: (e) => toast.error(e.message) });
  const finalBlogMut       = api.techquiz.publishFinalBlogPost.useMutation({ onSuccess: (d: any) => toast.success(`Winners blog post published — Top ${d.winners} announced`), onError: (e) => toast.error(e.message) });

  const SECTIONS = [
    { id: "info" as const, label: "Settings", icon: <Settings size={13} /> },
    { id: "schedule" as const, label: "Schedules", icon: <Calendar size={13} /> },
    { id: "schools" as const, label: "Schools", icon: <School size={13} /> },
    { id: "brackets" as const, label: "Awards", icon: <Award size={13} /> },
    { id: "rubric" as const, label: "Rubric", icon: <Sliders size={13} /> },
    { id: "apps" as const, label: "Applications", icon: <ClipboardList size={13} /> },
    { id: "ops" as const, label: "Operations", icon: <Layers size={13} /> },
    { id: "results" as const, label: "Results", icon: <BarChart3 size={13} /> },
  ];

  const assignedIds = new Set<string>(event.eventSchools?.map((es: any) => es.schoolId));
  const filteredSchools = (schoolsQ.data?.schools || []).filter(
    (s: any) => !assignedIds.has(s.id) && s.name.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Pill status={event.status} />
                {event.frequencyType && (
                  <span className="text-xs text-slate-500">{event.frequencyType}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{event.title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin size={12} /> {event.state}
                <span className="mx-1">·</span>
                <Users size={12} /> {event._count?.applications ?? 0} applications
                <span className="mx-1">·</span>
                <School size={12} /> {event.eventSchools?.length ?? 0} schools
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400"><X size={18} /></button>
          </div>

          {/* Section pills */}
          <div className="flex gap-1.5 mt-4 flex-wrap">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeSection === s.id ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info */}
          {activeSection === "info" && (
            <div className="space-y-4 text-sm">
              <Row label="Event ID" value={event.id} mono />
              <Row label="Status" value={<Pill status={event.status} />} />
              <Row label="Created" value={format(new Date(event.createdAt), "dd MMM yyyy")} />
              {event.publishedAt && <Row label="Published" value={format(new Date(event.publishedAt), "dd MMM yyyy HH:mm")} />}
              {event.applicationWindowStart && (
                <Row label="App Window Opens" value={format(new Date(event.applicationWindowStart), "dd MMM yyyy HH:mm")} />
              )}
              {event.applicationWindowEnd && (
                <Row label="App Window Closes" value={format(new Date(event.applicationWindowEnd), "dd MMM yyyy HH:mm")} />
              )}
              <Row label="Sponsorship Price" value={`₦${Number(event.sponsorshipPackagePrice).toLocaleString()}`} />
              <Row label="Top Qualifiers/School" value={event.topQualifiersPerSchool} />
              <Row label="CBT Weight" value={`${event.cbtWeightPct}%`} />
              <Row label="Onsite Weight" value={`${event.onsiteWeightPct}%`} />
              <Row label="Zonal/National" value={event.isZonalOrNational ? "Yes" : "No"} />
            </div>
          )}

          {/* Schedules */}
          {activeSection === "schedule" && (
            <div className="space-y-6">
              {/* Round 1 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen size={15} className="text-emerald-500" /> Round 1 — CBT Schedule</h3>
                <Field label="Venue / Description" value={r1.venueDescription} onChange={(v) => setR1(s => ({ ...s, venueDescription: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CBT Window Start" type="datetime-local" value={r1.cbtWindowStart} onChange={(v) => setR1(s => ({ ...s, cbtWindowStart: v }))} />
                  <Field label="CBT Window End" type="datetime-local" value={r1.cbtWindowEnd} onChange={(v) => setR1(s => ({ ...s, cbtWindowEnd: v }))} />
                </div>
                <Field label="Notes" value={r1.notes} onChange={(v) => setR1(s => ({ ...s, notes: v }))} />
                <button
                  onClick={() => r1Mut.mutate({ eventId: event.id, ...r1, cbtWindowStart: r1.cbtWindowStart || undefined, cbtWindowEnd: r1.cbtWindowEnd || undefined })}
                  disabled={r1Mut.isPending}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition"
                >
                  {r1Mut.isPending ? "Saving…" : "Save Round 1 Schedule"}
                </button>
              </div>

              {/* Round 2 */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BookOpen size={15} className="text-blue-500" /> Round 2 — CBT + Onsite</h3>
                <Field label="Venue / Description" value={r2.venueDescription} onChange={(v) => setR2(s => ({ ...s, venueDescription: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CBT Window Start" type="datetime-local" value={r2.cbtWindowStart} onChange={(v) => setR2(s => ({ ...s, cbtWindowStart: v }))} />
                  <Field label="CBT Window End" type="datetime-local" value={r2.cbtWindowEnd} onChange={(v) => setR2(s => ({ ...s, cbtWindowEnd: v }))} />
                </div>
                <Field label="Onsite Date" type="datetime-local" value={r2.onsiteDate} onChange={(v) => setR2(s => ({ ...s, onsiteDate: v }))} />
                <Field label="Notes" value={r2.notes} onChange={(v) => setR2(s => ({ ...s, notes: v }))} />
                <button
                  onClick={() => r2Mut.mutate({ eventId: event.id, ...r2, cbtWindowStart: r2.cbtWindowStart || undefined, cbtWindowEnd: r2.cbtWindowEnd || undefined, onsiteDate: r2.onsiteDate || undefined })}
                  disabled={r2Mut.isPending}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition"
                >
                  {r2Mut.isPending ? "Saving…" : "Save Round 2 Schedule"}
                </button>
              </div>
            </div>
          )}

          {/* Schools */}
          {activeSection === "schools" && (
            <div className="space-y-5">
              {/* Assigned schools */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Assigned Schools ({event.eventSchools?.length ?? 0})</h3>
                {event.eventSchools?.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No schools assigned yet</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {event.eventSchools?.map((es: any) => (
                      <SchoolQuotaRow
                        key={es.schoolId}
                        es={es}
                        eventStatus={event.status}
                        onRemove={() => removeMut.mutate({ eventId: event.id, schoolId: es.schoolId })}
                        onUpdateQuota={(min: number, max: number) => quotaMut.mutate({ eventId: event.id, schoolId: es.schoolId, minStudents: min, maxStudents: max })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Assign new school */}
              {(event.status === "DRAFT" || event.status === "APPROVED") && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Assign School</h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      placeholder="Search approved schools…"
                      className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  {schoolsQ.isPending && <p className="text-xs text-slate-400">Loading schools…</p>}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredSchools.map((s: any) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSchoolId(s.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition ${selectedSchoolId === s.id ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-400" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        <span className="text-slate-800 dark:text-white font-medium">{s.name}</span>
                        <span className="text-xs text-slate-400">{s.state}</span>
                      </div>
                    ))}
                    {filteredSchools.length === 0 && !schoolsQ.isPending && (
                      <p className="text-xs text-slate-400 text-center py-2">No approved schools found for {event.state}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1 block">Min Students</label>
                      <input type="number" value={schoolMin} min={1} onChange={(e) => setSchoolMin(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1 block">Max Students</label>
                      <input type="number" value={schoolMax} min={1} onChange={(e) => setSchoolMax(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <button
                    disabled={!selectedSchoolId || assignMut.isPending}
                    onClick={() => assignMut.mutate({ eventId: event.id, schoolId: selectedSchoolId, minStudents: schoolMin, maxStudents: schoolMax })}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 transition"
                  >
                    {assignMut.isPending ? "Assigning…" : "Assign Selected School"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Award Brackets */}
          {activeSection === "brackets" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure award brackets (rank ranges + label). Add or remove rows as needed.</p>
              {brackets.map((b, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Bracket {i + 1}</span>
                    <button onClick={() => setBrackets((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 transition"><Trash2 size={13} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1 block">Min Rank</label>
                      <input type="number" value={b.minRank} min={1} onChange={(e) => setBrackets((prev) => prev.map((x, j) => j === i ? { ...x, minRank: Number(e.target.value) } : x))} className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 mb-1 block">Max Rank</label>
                      <input type="number" value={b.maxRank} min={1} onChange={(e) => setBrackets((prev) => prev.map((x, j) => j === i ? { ...x, maxRank: Number(e.target.value) } : x))} className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <input value={b.bracketLabel} onChange={(e) => setBrackets((prev) => prev.map((x, j) => j === i ? { ...x, bracketLabel: e.target.value } : x))} placeholder="Label (e.g. Major, Merit, Consolation)" className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                  <input value={b.awardDescription} onChange={(e) => setBrackets((prev) => prev.map((x, j) => j === i ? { ...x, awardDescription: e.target.value } : x))} placeholder="Award description" className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500" />
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={b.bpiActivationGranted} onChange={(e) => setBrackets((prev) => prev.map((x, j) => j === i ? { ...x, bpiActivationGranted: e.target.checked } : x))} className="rounded" />
                    Grant BPI Regular Activation
                  </label>
                </div>
              ))}
              <button onClick={() => setBrackets((prev) => [...prev, { minRank: 1, maxRank: 1, bracketLabel: "", awardDescription: "", bpiActivationGranted: true }])} className="w-full py-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition flex items-center justify-center gap-2">
                <Plus size={14} /> Add Bracket
              </button>
              <button
                onClick={() => bracketMut.mutate({ eventId: event.id, brackets })}
                disabled={bracketMut.isPending}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {bracketMut.isPending ? "Saving…" : "Save Award Brackets"}
              </button>
            </div>
          )}

          {/* Scoring Rubric */}
          {activeSection === "rubric" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Define max scores per onsite component. Assessors will enter scores within these limits.</p>
              {[
                { key: "maxPresentation" as const, label: "Max Presentation Score" },
                { key: "maxLogicalReasoning" as const, label: "Max Logical Reasoning Score" },
                { key: "maxUseCase" as const, label: "Max Use-Case / Innovation Score" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{item.label}</label>
                  <input
                    type="number"
                    min={1}
                    value={rubric[item.key]}
                    onChange={(e) => setRubric((r) => ({ ...r, [item.key]: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300">
                Total max onsite: <strong>{rubric.maxPresentation + rubric.maxLogicalReasoning + rubric.maxUseCase}</strong> pts
              </div>
              <button
                onClick={() => rubricMut.mutate({ eventId: event.id, ...rubric })}
                disabled={rubricMut.isPending}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {rubricMut.isPending ? "Saving…" : "Save Scoring Rubric"}
              </button>
            </div>
          )}

          {/* Applications */}
          {activeSection === "apps" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-500">{appsQ.data?.total ?? 0} applications</span>
                <div className="flex-1" />
                <select
                  value={appsStatusFilter}
                  onChange={(e) => { setAppsStatusFilter(e.target.value); setAppsPage(1); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#232323] dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Statuses</option>
                  {["APPLIED","SLOT_RESERVED","VERIFIED","REJECTED","ROUND1_ELIGIBLE","QUALIFIER","ROUND2_ELIGIBLE"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              {appsQ.isLoading ? (
                <p className="text-sm text-slate-400 py-6 text-center">Loading…</p>
              ) : (appsQ.data?.applications ?? []).length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center italic">No applications found.</p>
              ) : (
                <div className="space-y-2">
                  {(appsQ.data?.applications ?? []).map((app: any) => (
                    <div key={app.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{app.childBeneficiary?.childName ?? "—"}</p>
                          <p className="text-xs text-slate-500">{app.parent?.name} · {app.school?.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                          app.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                          app.status === "REJECTED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          app.status.includes("ELIGIBLE") ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                          app.status === "QUALIFIER" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        }`}>{app.status.replace(/_/g, " ")}</span>
                      </div>
                      {app.result && (
                        <div className="flex gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                          {app.result.round1Score !== null && <span>R1: {app.result.round1Score}</span>}
                          {app.result.intraSchoolRank !== null && <span>School Rank: #{app.result.intraSchoolRank}</span>}
                          {app.result.finalScore !== null && <span>Final: {Number(app.result.finalScore).toFixed(2)}</span>}
                          {app.result.finalRank !== null && <span className="font-semibold text-emerald-600">Rank #{app.result.finalRank}</span>}
                          {app.result.awardBracket && <span className="text-violet-600">{app.result.awardBracket}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination */}
              {(appsQ.data?.total ?? 0) > 15 && (
                <div className="flex items-center justify-between">
                  <button onClick={() => setAppsPage((p) => Math.max(1, p - 1))} disabled={appsPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><ChevronLeft size={13} /></button>
                  <span className="text-xs text-slate-500">Page {appsPage}</span>
                  <button onClick={() => setAppsPage((p) => p + 1)} disabled={(appsQ.data?.applications ?? []).length < 15} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><ChevronRight size={13} /></button>
                </div>
              )}
            </div>
          )}

          {/* Operations */}
          {activeSection === "ops" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin-triggered operations that advance the event lifecycle. Each operation is irreversible — confirm before proceeding.</p>
              {([
                {
                  label: "Issue Round 1 CBT Access",
                  description: "Sets all VERIFIED applications (in ELIGIBLE schools) to ROUND1_ELIGIBLE and notifies parents.",
                  color: "bg-blue-600 hover:bg-blue-700",
                  mut: issueCBTMut,
                  action: () => issueCBTMut.mutate({ eventId: event.id }),
                },
                {
                  label: "Check School Minimum Status",
                  description: "Alerts admin if any schools have not reached their minimum verified candidates.",
                  color: "bg-amber-500 hover:bg-amber-600",
                  mut: checkMinMut,
                  action: () => checkMinMut.mutate({ eventId: event.id }),
                },
                {
                  label: "Compute Round 1 Rankings",
                  description: "Ranks students intra-school by Round 1 score and selects top-N qualifiers per school.",
                  color: "bg-violet-600 hover:bg-violet-700",
                  mut: computeR1Mut,
                  action: () => computeR1Mut.mutate({ eventId: event.id }),
                },
                {
                  label: "Issue Round 2 Access",
                  description: "Sets all QUALIFIER applications to ROUND2_ELIGIBLE and notifies qualifiers of Round 2 details.",
                  color: "bg-indigo-600 hover:bg-indigo-700",
                  mut: issueR2Mut,
                  action: () => issueR2Mut.mutate({ eventId: event.id }),
                },
                {
                  label: "Lock Onsite Scores",
                  description: "Prevents further edits to onsite scores. Run after all assessors have submitted.",
                  color: "bg-orange-500 hover:bg-orange-600",
                  mut: lockOnsiteMut,
                  action: () => lockOnsiteMut.mutate({ eventId: event.id }),
                },
                {
                  label: "Compute Final Scores & Rankings",
                  description: "Calculates weighted final score (CBT weight + onsite weight) and assigns global rankings 1–N with award brackets.",
                  color: "bg-emerald-600 hover:bg-emerald-700",
                  mut: computeFinalMut,
                  action: () => computeFinalMut.mutate({ eventId: event.id }),
                },
              ] as const).map((op: any, i: number) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{op.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{op.description}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Proceed: ${op.label}?`)) op.action(); }}
                      disabled={op.mut.isPending}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition ${op.color}`}
                    >
                      {op.mut.isPending ? "Running…" : "Run"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {activeSection === "results" && (
            <div className="space-y-5">
              {/* Publish actions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Round 1 Results</p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mb-3">Publish Round 1 scores to parent & school dashboards.</p>
                  <button
                    onClick={() => { if (confirm("Publish Round 1 results to all participants?")) publishR1Mut.mutate({ eventId: event.id }); }}
                    disabled={publishR1Mut.isPending}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {publishR1Mut.isPending ? "Publishing…" : "Publish Round 1"}
                  </button>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 mb-1">Final Results</p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 mb-3">Publish final rankings. Event will auto-complete.</p>
                  <button
                    onClick={() => { if (confirm("Publish FINAL results and complete event?")) publishFinalMut.mutate({ eventId: event.id }); }}
                    disabled={publishFinalMut.isPending}
                    className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {publishFinalMut.isPending ? "Publishing…" : "Publish Final"}
                  </button>
                </div>
              </div>

              {/* Blog Publish */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Round 1 Blog Post</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mb-3">Auto-generate a qualifier summary post on the public blog.</p>
                  <button
                    onClick={() => { if (confirm("Publish Round 1 qualifier summary to the blog?")) r1BlogMut.mutate({ eventId: event.id }); }}
                    disabled={r1BlogMut.isPending}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {r1BlogMut.isPending ? "Publishing…" : "Post to Blog"}
                  </button>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Winners Blog Post</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3">Auto-generate a Top-20 winners announcement post.</p>
                  <button
                    onClick={() => { if (confirm("Publish Top-20 winners announcement to the blog?")) finalBlogMut.mutate({ eventId: event.id }); }}
                    disabled={finalBlogMut.isPending}
                    className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 transition"
                  >
                    {finalBlogMut.isPending ? "Publishing…" : "Post Winners"}
                  </button>
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Leaderboard ({leaderboardQ.data?.length ?? 0})</h3>
                  <button onClick={() => leaderboardQ.refetch()} disabled={leaderboardQ.isFetching} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <RefreshCw size={11} className={leaderboardQ.isFetching ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
                {leaderboardQ.isLoading ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Loading leaderboard…</p>
                ) : (leaderboardQ.data ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center italic">No ranked results yet. Run Operations → Compute Final Scores first.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(leaderboardQ.data ?? []).slice(0, 25).map((r: any) => (
                      <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                        r.finalRank === 1 ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" :
                        r.finalRank === 2 ? "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" :
                        r.finalRank === 3 ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" :
                        "bg-slate-50 dark:bg-slate-800/50"
                      }`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          r.finalRank === 1 ? "bg-amber-400 text-white" :
                          r.finalRank === 2 ? "bg-slate-400 text-white" :
                          r.finalRank === 3 ? "bg-orange-400 text-white" :
                          "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>{r.finalRank ?? "—"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{r.application?.childBeneficiary?.childName ?? "—"}</p>
                          <p className="text-[10px] text-slate-500 truncate">{r.application?.school?.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {r.finalScore !== null && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{Number(r.finalScore).toFixed(1)}</p>}
                          {r.awardBracket && <p className="text-[10px] text-violet-600 dark:text-violet-400">{r.awardBracket}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Tiny helpers inside EventDetailPanel
function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 text-xs">{label}</span>
      <span className={`text-slate-800 dark:text-white font-medium text-xs text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[11px] text-slate-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
      />
    </div>
  );
}
function SchoolQuotaRow({ es, eventStatus, onRemove, onUpdateQuota }: { es: any; eventStatus: string; onRemove: () => void; onUpdateQuota: (min: number, max: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [min, setMin] = useState(es.minStudents);
  const [max, setMax] = useState(es.maxStudents);
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
      <School size={14} className="text-slate-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{es.school?.name}</p>
        <p className="text-xs text-slate-400">{es.school?.state} · Status: {es.participationStatus}</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none" />
            <span className="text-xs text-slate-400">–</span>
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none" />
            <button onClick={() => { onUpdateQuota(min, max); setEditing(false); }} className="text-xs text-emerald-600 font-semibold hover:underline">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:underline">Cancel</button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">Quota: {es.minStudents}–{es.maxStudents} · Enrolled: {es.enrolledCount}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {(eventStatus === "DRAFT" || eventStatus === "APPROVED") && !editing && (
          <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition"><Edit2 size={12} /></button>
        )}
        {(eventStatus === "DRAFT" || eventStatus === "APPROVED") && (
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition"><Trash2 size={12} /></button>
        )}
      </div>
    </div>
  );
}

// ─── Status Transition Button ─────────────────────────────────────────────────
function StatusTransitionBtn({ event, onDone }: { event: any; onDone: () => void }) {
  const next = STATUS_NEXT[event.status as EventStatus];
  const nextLabel = STATUS_NEXT_LABEL[event.status as EventStatus];
  const [confirming, setConfirming] = useState(false);

  const mut = api.techquiz.updateEventStatus.useMutation({
    onSuccess: () => { toast.success(`Event status updated to ${next}`); onDone(); setConfirming(false); },
    onError: (e) => { toast.error(e.message); setConfirming(false); },
  });

  if (!next) return null;

  const ICON_MAP: Record<string, React.ReactNode> = {
    APPROVED: <CheckCircle2 size={13} />,
    PUBLISHED: <Globe size={13} />,
    COMPLETED: <Star size={13} />,
    ARCHIVED: <Archive size={13} />,
  };
  const COLOR: Record<string, string> = {
    APPROVED: "bg-blue-600 hover:bg-blue-700",
    PUBLISHED: "bg-emerald-600 hover:bg-emerald-700",
    COMPLETED: "bg-violet-600 hover:bg-violet-700",
    ARCHIVED: "bg-orange-500 hover:bg-orange-600",
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Confirm {nextLabel}?</span>
        <button onClick={() => mut.mutate({ eventId: event.id, status: next as "APPROVED" | "PUBLISHED" | "COMPLETED" | "ARCHIVED" })} disabled={mut.isPending} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition ${COLOR[next]}`}>
          {mut.isPending ? "…" : "Yes, proceed"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition ${COLOR[next]}`}
    >
      {ICON_MAP[next]} {nextLabel}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTechQuizPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [page, setPage] = useState(1);
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [detailTarget, setDetailTarget] = useState<any | null>(null);

  const eventsQ = api.techquiz.adminListEvents.useQuery(
    { page, perPage: 15, state: filterState || undefined, status: (filterStatus as EventStatus) || undefined }
  );

  const events = eventsQ.data?.events ?? [];
  const total = eventsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 15));

  // Overview stats
  const statusCounts = events.reduce((acc: Record<string, number>, ev: any) => {
    acc[ev.status] = (acc[ev.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const totalApplications = events.reduce((s: number, ev: any) => s + (ev._count?.applications ?? 0), 0);
  const totalSchools = events.reduce((s: number, ev: any) => s + (ev.eventSchools?.length ?? 0), 0);

  const refresh = () => { eventsQ.refetch(); setDetailTarget(null); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Trophy size={14} className="text-emerald-500" />
            Admin
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">TechQuiz CMS</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage competition events, schedules, schools, and scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => eventsQ.refetch()} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <RefreshCw size={13} className={eventsQ.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-slate-800/50 rounded-xl p-1 w-fit border border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Trophy size={20} className="text-emerald-600" />} label="Total Events" value={total} color="bg-emerald-50 dark:bg-emerald-900/20" />
            <StatCard icon={<Globe size={20} className="text-blue-600" />} label="Published" value={statusCounts["PUBLISHED"] ?? 0} color="bg-blue-50 dark:bg-blue-900/20" />
            <StatCard icon={<Users size={20} className="text-violet-600" />} label="Applications" value={totalApplications} color="bg-violet-50 dark:bg-violet-900/20" />
            <StatCard icon={<School size={20} className="text-amber-600" />} label="Schools Assigned" value={totalSchools} color="bg-amber-50 dark:bg-amber-900/20" />
          </div>

          {/* Status breakdown */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">Events by Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["DRAFT", "APPROVED", "PUBLISHED", "COMPLETED", "ARCHIVED"] as EventStatus[]).map((s) => (
                <div key={s} className={`rounded-xl p-3 text-center ${STATUS_BADGE[s]}`}>
                  <p className="text-2xl font-black">{statusCounts[s] ?? 0}</p>
                  <p className="text-[11px] font-semibold mt-0.5 opacity-80">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent events */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Recent Events</h2>
              <button onClick={() => setTab("events")} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {events.slice(0, 5).map((ev: any) => (
                <EventRow key={ev.id} ev={ev} onEdit={() => setEditTarget(ev)} onDetail={() => setDetailTarget(ev)} onRefresh={refresh} />
              ))}
              {events.length === 0 && (
                <div className="py-10 text-center text-slate-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No events yet. Create your first TechQuiz event.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {tab === "events" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setPage(1); }}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All States</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value as EventStatus | ""); setPage(1); }}
              className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              {(["DRAFT","APPROVED","PUBLISHED","COMPLETED","ARCHIVED"] as EventStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(filterState || filterStatus) && (
              <button onClick={() => { setFilterState(""); setFilterStatus(""); setPage(1); }} className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear filters</button>
            )}
            <span className="ml-auto text-xs text-slate-500">{total} event{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {eventsQ.isPending ? (
                <div className="py-12 text-center text-slate-400">Loading…</div>
              ) : events.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No events match your filters.</p>
                </div>
              ) : events.map((ev: any) => (
                <EventRow key={ev.id} ev={ev} onEdit={() => setEditTarget(ev)} onDetail={() => setDetailTarget(ev)} onRefresh={refresh} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <EventFormModal
            mode="create"
            onClose={() => setShowCreate(false)}
            onDone={() => { setShowCreate(false); eventsQ.refetch(); }}
          />
        )}
        {editTarget && (
          <EventFormModal
            mode="edit"
            event={editTarget}
            onClose={() => setEditTarget(null)}
            onDone={() => { setEditTarget(null); eventsQ.refetch(); }}
          />
        )}
        {detailTarget && (
          <EventDetailPanel
            event={detailTarget}
            onClose={() => setDetailTarget(null)}
            onRefresh={() => { eventsQ.refetch(); setDetailTarget(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Event Row ─────────────────────────────────────────────────────────────────
function EventRow({ ev, onEdit, onDetail, onRefresh }: { ev: any; onEdit: () => void; onDetail: () => void; onRefresh: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{ev.title}</p>
          <Pill status={ev.status} />
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><MapPin size={10} /> {ev.state}</span>
          <span className="flex items-center gap-1"><School size={10} /> {ev.eventSchools?.length ?? 0} schools</span>
          <span className="flex items-center gap-1"><ClipboardList size={10} /> {ev._count?.applications ?? 0} apps</span>
          {ev.applicationWindowEnd && (
            <span className="flex items-center gap-1"><Calendar size={10} /> Closes {format(new Date(ev.applicationWindowEnd), "dd MMM")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusTransitionBtn event={ev} onDone={onRefresh} />
        {(ev.status === "DRAFT" || ev.status === "APPROVED") && (
          <button onClick={onEdit} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition" title="Edit">
            <Edit2 size={14} />
          </button>
        )}
        <button onClick={onDetail} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition" title="Configure">
          <Settings size={14} />
        </button>
      </div>
    </motion.div>
  );
}
