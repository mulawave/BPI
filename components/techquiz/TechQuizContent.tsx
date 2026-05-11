"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  BookOpen,
  Users,
  FileText,
  Trophy,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Star,
  Award,
  GraduationCap,
  Calendar,
  MapPin,
  ArrowRight,
  RefreshCw,
  User,
  School,
  Loader2,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "events" | "children" | "applications" | "results";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  APPLIED:         { label: "Applied",           color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Clock },
  SLOT_RESERVED:   { label: "Slot Reserved",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: BadgeCheck },
  VERIFIED:        { label: "School Verified",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  REJECTED:        { label: "Rejected",          color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", icon: XCircle },
  ROUND1_ELIGIBLE: { label: "Round 1 Eligible",  color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", icon: Star },
  QUALIFIER:       { label: "Qualifier!",        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Trophy },
  ROUND2_ELIGIBLE: { label: "Round 2 Eligible",  color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300", icon: Award },
  PAID:            { label: "Paid",              color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  PENDING:         { label: "Pending Payment",   color: "bg-amber-100 text-amber-700", icon: Clock },
};

const APPLICATION_STEPS = [
  { key: "APPLIED",         label: "Applied" },
  { key: "SLOT_RESERVED",   label: "Slot Reserved" },
  { key: "VERIFIED",        label: "School Verified" },
  { key: "ROUND1_ELIGIBLE", label: "CBT Round 1" },
  { key: "QUALIFIER",       label: "Qualified" },
  { key: "ROUND2_ELIGIBLE", label: "Round 2" },
];

const STEP_ORDER_MAP: Record<string, number> = {
  APPLIED: 0, SLOT_RESERVED: 1, VERIFIED: 2,
  ROUND1_ELIGIBLE: 3, QUALIFIER: 4, ROUND2_ELIGIBLE: 5,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status, color: "bg-gray-100 text-gray-700", icon: AlertCircle,
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function ApplicationTracker({ status }: { status: string }) {
  const currentStep = STEP_ORDER_MAP[status] ?? -1;
  const isRejected = status === "REJECTED";
  return (
    <div className="relative flex items-center gap-0 overflow-x-auto pb-1">
      {APPLICATION_STEPS.map((step, idx) => {
        const done = !isRejected && currentStep >= idx;
        const active = !isRejected && currentStep === idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center min-w-[70px]">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                  ${done ? "bg-emerald-500 border-emerald-500 text-white" : active ? "bg-white border-emerald-500 text-emerald-600" : "bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-600"}`}
              >
                {done && !active ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${done ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                {step.label}
              </span>
            </div>
            {idx < APPLICATION_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-14px] min-w-[8px] transition-colors ${done && currentStep > idx ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </React.Fragment>
        );
      })}
      {isRejected && (
        <div className="ml-3 flex items-center gap-1 text-xs text-rose-600 font-semibold">
          <XCircle size={14} /> Rejected
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, max, color }: { label: string; value: number | null | undefined; max?: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="text-xs text-current opacity-70 mb-1">{label}</div>
      <div className="text-xl font-bold">
        {value != null ? value.toString() : "—"}
        {max != null && value != null && <span className="text-sm font-normal opacity-60"> /{max}</span>}
      </div>
    </div>
  );
}

function EventCard({
  event,
  onApply,
}: {
  event: any;
  onApply: (event: any) => void;
}) {
  const now = new Date();
  const windowOpen = event.applicationWindowStart ? new Date(event.applicationWindowStart) <= now : true;
  const windowClosed = event.applicationWindowEnd ? new Date(event.applicationWindowEnd) < now : false;
  const canApply = windowOpen && !windowClosed && event.status === "PUBLISHED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{event.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={11} /> {event.state}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
          event.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
          event.status === "COMPLETED" ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400" :
          "bg-amber-100 text-amber-700"
        }`}>{event.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {event.applicationWindowStart && (
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-2">
            <div className="text-slate-400 dark:text-slate-500 mb-0.5">App. Opens</div>
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              {format(new Date(event.applicationWindowStart), "MMM d, yyyy")}
            </div>
          </div>
        )}
        {event.applicationWindowEnd && (
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-2">
            <div className="text-slate-400 dark:text-slate-500 mb-0.5">App. Closes</div>
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              {format(new Date(event.applicationWindowEnd), "MMM d, yyyy")}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {event._count?.applications ?? 0} applicants · {event.eventSchools?.length ?? 0} schools
        </div>
        {canApply ? (
          <button
            onClick={() => onApply(event)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Apply <ArrowRight size={12} />
          </button>
        ) : windowClosed ? (
          <span className="flex items-center gap-1 text-xs text-slate-400"><Lock size={11} /> Closed</span>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Apply Modal ─────────────────────────────────────────────────────────────

function ApplyModal({
  event,
  childList,
  onClose,
}: {
  event: any;
  childList: any[];
  onClose: () => void;
}) {
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const applyMutation = api.techquiz.applyForTechQuiz.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const schools = event.eventSchools ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return toast.error("Select a child");
    if (!selectedSchool) return toast.error("Select a school");
    if (!paymentRef) return toast.error("Enter payment reference");
    applyMutation.mutate({
      eventId: event.id,
      childBeneficiaryId: selectedChild,
      schoolId: selectedSchool,
      paymentReference: paymentRef,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Apply for TechQuiz</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{event.title} · {event.state}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Select Child
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Choose a child...</option>
              {childList.map((c) => (
                <option key={c.id} value={c.id}>{c.childName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Select School
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Choose a school...</option>
              {schools.map((es: any) => (
                <option key={es.schoolId} value={es.schoolId}>
                  {es.school?.name ?? es.schoolId}
                  {es.participationStatus === "CLOSED" ? " (Full)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Payment Reference
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. TRX-20240226-001"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
            ₦{Number(event.sponsorshipPackagePrice || 18000).toLocaleString()} per child (TechQuiz license fee)
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {applyMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Application"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Child Modal ─────────────────────────────────────────────────────────

function AddChildModal({ onClose }: { onClose: () => void }) {
  const utils = api.useUtils();
  const [form, setForm] = useState({
    childName: "", dateOfBirth: "", email: "", state: "", consent: false,
  });
  const createChild = api.techquiz.createChildBeneficiary.useMutation({
    onSuccess: () => {
      toast.success("Child profile created!");
      utils.techquiz.myChildBeneficiaries.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consent) return toast.error("Parental consent is required");
    createChild.mutate({
      childName: form.childName,
      dateOfBirth: form.dateOfBirth || undefined,
      email: form.email || undefined,
      state: form.state || undefined,
      parentalConsentGiven: true,
    });
  };

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#232323] dark:text-white placeholder-[#b0b0b0] focus:outline-none focus:border-[#0d3b29] transition-colors"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register Child Beneficiary</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add a child to your TechQuiz profile</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field("childName", "Child's Full Name", "text", "e.g. Adeola Johnson")}
          {field("dateOfBirth", "Date of Birth", "date")}
          {field("email", "Child's Email (optional)", "email", "child@example.com")}
          {field("state", "State", "text", "e.g. Lagos")}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
            <strong>Child Data Protection:</strong> By registering, you confirm this is your child and consent to their personal data being used solely for the BPI TechQuiz Competition.
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
              className="mt-0.5 accent-emerald-600"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              I give parental consent for my child's data to be processed for BPI TechQuiz and confirm I am their legal guardian.
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createChild.isPending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {createChild.isPending ? <><Loader2 size={14} className="animate-spin" />Creating...</> : "Register Child"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TechQuizContent() {
  const [tab, setTab] = useState<Tab>("overview");
  const [applyEvent, setApplyEvent] = useState<any | null>(null);
  const [showAddChild, setShowAddChild] = useState(false);

  const eligibilityQuery = api.techquiz.checkParentEligibility.useQuery();
  const childrenQuery = api.techquiz.myChildBeneficiaries.useQuery();
  const cbtAvailabilityQuery = api.techquiz.getCbtPortalAvailability.useQuery();
  const eventsQuery = api.techquiz.adminListEvents.useQuery(
    { status: "PUBLISHED" },
    { enabled: tab === "events" || tab === "overview" }
  );
  const myApplicationsQuery = api.techquiz.adminListApplications.useQuery(
    { eventId: "" },
    { enabled: false } // loaded per-event; use child query instead
  );

  const eligibility = eligibilityQuery.data;
  const children = childrenQuery.data ?? [];
  const events = eventsQuery.data?.events ?? [];
  const cbtAvailability = cbtAvailabilityQuery.data;
  const cbtPortalEnabled = cbtAvailability?.enabled ?? false;
  const loading = eligibilityQuery.isLoading || childrenQuery.isLoading;

  // Collect all applications from children
  const allApplications = children.flatMap((c: any) => c.applications ?? []);

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "overview",      label: "Overview",      icon: BookOpen },
    { key: "events",        label: "Events",        icon: Calendar,    count: events.length },
    { key: "children",      label: "My Children",   icon: Users,       count: children.length },
    { key: "applications",  label: "Applications",  icon: FileText,    count: allApplications.length },
    { key: "results",       label: "Results",       icon: Trophy },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-[#0d3b29] to-emerald-800 p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-emerald-400" size={20} />
              <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">BPI TechQuiz Competition</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">STEM Competition Portal</h1>
            <p className="text-emerald-200/80 text-sm max-w-lg">
              Register your child for the BPI TechQuiz — a state-based secondary school STEM competition with scholarships and BPI activation prizes.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {!cbtAvailabilityQuery.isLoading && (
              <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border ${
                cbtPortalEnabled
                  ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-100"
                  : "bg-amber-500/10 border-amber-400/30 text-amber-100"
              }`}>
                {cbtPortalEnabled ? <BadgeCheck size={13} className="text-cyan-300" /> : <Clock size={13} className="text-amber-300" />}
                {cbtPortalEnabled ? "CBT Portal Live" : "CBT Portal Paused"}
              </div>
            )}
            {eligibility?.isEligible ? (
              <div className="flex items-center gap-1.5 bg-emerald-700/50 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold">
                <CheckCircle2 size={13} className="text-emerald-400" /> Eligible to Apply
              </div>
            ) : eligibility ? (
              <div className="flex items-center gap-1.5 bg-rose-700/30 border border-rose-500/40 rounded-xl px-3 py-1.5 text-xs font-semibold">
                <Lock size={13} className="text-rose-400" /> Membership Required
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Eligibility Banner */}
      <AnimatePresence>
        {!eligibilityQuery.isLoading && eligibility && !eligibility.isEligible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="text-amber-600 shrink-0" size={18} />
            <div className="flex-1">
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Membership Required: </span>
              <span className="text-sm text-amber-700 dark:text-amber-300">{eligibility.reason}</span>
            </div>
            <a href="/membership" className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
              Upgrade <ArrowRight size={11} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.key
                    ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={15} />
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className="ml-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full px-1.5 py-0.5 font-normal">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div className="space-y-6">
                {!cbtAvailabilityQuery.isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
                      cbtPortalEnabled
                        ? "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 dark:border-cyan-900/60 dark:from-cyan-950/20 dark:via-slate-900 dark:to-emerald-950/20"
                        : "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900/60 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20"
                    }`}
                  >
                    <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl ${
                      cbtPortalEnabled ? "bg-cyan-200/50 dark:bg-cyan-500/10" : "bg-amber-200/50 dark:bg-amber-500/10"
                    }`} />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                          cbtPortalEnabled
                            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          {cbtPortalEnabled ? <BadgeCheck size={22} /> : <Clock size={22} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">CBT access</p>
                          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {cbtPortalEnabled ? "Verified CBT sessions are live" : "Verified CBT sessions are paused"}
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {cbtAvailability?.message || "TechQuiz CBT availability updates will appear here."}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 lg:items-end">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          cbtPortalEnabled
                            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          {cbtPortalEnabled ? <BadgeCheck size={13} /> : <Clock size={13} />}
                          {cbtPortalEnabled ? "Portal live" : "Portal unavailable"}
                        </span>
                        <Link
                          href="/techquiz/cbt"
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                            cbtPortalEnabled
                              ? "bg-cyan-600 text-white hover:bg-cyan-700"
                              : "bg-white text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-50 dark:bg-slate-900/70 dark:text-amber-300 dark:ring-amber-800/60 dark:hover:bg-amber-950/20"
                          }`}
                        >
                          {cbtPortalEnabled ? "Open CBT Portal" : "Review CBT Status"}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "My Children", value: children.length, icon: Users, color: "text-violet-600" },
                    { label: "Applications", value: allApplications.length, icon: FileText, color: "text-blue-600" },
                    { label: "Active Events", value: events.length, icon: Calendar, color: "text-emerald-600" },
                    {
                      label: "Qualifiers",
                      value: allApplications.filter((a: any) => a.status === "QUALIFIER" || a.status === "ROUND2_ELIGIBLE").length,
                      icon: Trophy,
                      color: "text-amber-600",
                    },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <Icon size={18} className={`${stat.color} mb-2`} />
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick actions */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTab("events")}
                    className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">Browse Open Events</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Apply for upcoming TechQuiz competitions</div>
                    </div>
                    <ChevronRight size={18} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => { setTab("children"); setShowAddChild(true); }}
                    className="flex items-center justify-between p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-left hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-violet-800 dark:text-violet-200 text-sm">Register a Child</div>
                      <div className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">Add a child beneficiary to your profile</div>
                    </div>
                    <ChevronRight size={18} className="text-violet-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Recent applications */}
                {allApplications.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 text-sm">Recent Applications</h3>
                    <div className="space-y-3">
                      {allApplications.slice(0, 3).map((app: any) => {
                        const child = children.find((c: any) => c.id === app.childBeneficiaryId);
                        return (
                          <div key={app.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                {child?.childName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{child?.childName ?? "Child"}</div>
                                <div className="text-xs text-slate-400">{app.event?.title ?? app.eventId}</div>
                              </div>
                            </div>
                            <StatusBadge status={app.status} />
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setTab("applications")} className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── EVENTS ── */}
            {tab === "events" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-slate-900 dark:text-white">Published Events</h2>
                  <button onClick={() => eventsQuery.refetch()} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <RefreshCw size={13} className={eventsQuery.isFetching ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
                {eventsQuery.isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No published events at the moment.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {events.map((ev: any) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onApply={(e) => {
                          if (!eligibility?.isEligible) {
                            toast.error("Active BPI membership required to apply");
                            return;
                          }
                          if (children.length === 0) {
                            toast.error("Register a child first before applying");
                            setTab("children");
                            return;
                          }
                          setApplyEvent(e);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CHILDREN ── */}
            {tab === "children" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-slate-900 dark:text-white">My Children</h2>
                  <button
                    onClick={() => setShowAddChild(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add Child
                  </button>
                </div>
                {childrenQuery.isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
                ) : children.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <User size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm mb-3">No children registered yet.</p>
                    <button
                      onClick={() => setShowAddChild(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg"
                    >
                      <Plus size={14} /> Register First Child
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {children.map((child: any) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {child.childName[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{child.childName}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {child.dateOfBirth ? `Born ${format(new Date(child.dateOfBirth), "MMM d, yyyy")}` : "DOB not set"}
                              {child.state && ` · ${child.state}`}
                            </div>
                          </div>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                            child.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            child.status === "TECH_QUIZ_ENABLED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          }`}>
                            {child.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {(child.applications ?? []).length} application{(child.applications ?? []).length !== 1 ? "s" : ""}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── APPLICATIONS ── */}
            {tab === "applications" && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-900 dark:text-white mb-2">Application Status Tracker</h2>
                {allApplications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No applications yet. Browse events to apply.</p>
                    <button onClick={() => setTab("events")} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg">
                      Browse Events <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (
                  allApplications.map((app: any) => {
                    const child = children.find((c: any) => c.id === app.childBeneficiaryId);
                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {child?.childName?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{child?.childName ?? "Child"}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{app.event?.title ?? "Event"} · {app.state}</div>
                            </div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        <ApplicationTracker status={app.status} />

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div>Applied: {app.appliedAt ? format(new Date(app.appliedAt), "MMM d, yyyy") : "—"}</div>
                          <div className="text-right">
                            Payment: <span className={app.paymentStatus === "PAID" ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                              {app.paymentStatus}
                            </span>
                          </div>
                          {app.status === "REJECTED" && app.rejectionReason && (
                            <div className="col-span-2 text-rose-600 dark:text-rose-400">
                              Reason: {app.rejectionReason}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── RESULTS ── */}
            {tab === "results" && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-900 dark:text-white mb-2">Results & Rankings</h2>
                {allApplications.filter((a: any) => a.result).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Results will appear here once published.</p>
                  </div>
                ) : (
                  allApplications
                    .filter((a: any) => a.result && (a.result.round1Published || a.result.finalPublished))
                    .map((app: any) => {
                      const r = app.result;
                      const child = children.find((c: any) => c.id === app.childBeneficiaryId);
                      return (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {child?.childName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{child?.childName ?? "Child"}</div>
                                <div className="text-xs text-slate-400">{app.event?.title ?? "Event"}</div>
                              </div>
                            </div>
                            {r.finalRank && (
                              <div className="text-center">
                                <div className="text-3xl font-black text-amber-600 dark:text-amber-400">#{r.finalRank}</div>
                                <div className="text-xs text-slate-400">Final Rank</div>
                              </div>
                            )}
                          </div>

                          {r.awardBracket && (
                            <div className="mb-4 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                              <Award className="text-amber-600" size={16} />
                              <div>
                                <div className="text-xs font-bold text-amber-800 dark:text-amber-200">{r.awardBracket} Prize</div>
                                {r.bpiActivationGranted && <div className="text-xs text-amber-600 dark:text-amber-400">BPI Activation Granted ✓</div>}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <ScoreCard label="Round 1 Score" value={r.round1Score != null ? Number(r.round1Score) : null} color="bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300" />
                            <ScoreCard label="School Rank" value={r.intraSchoolRank} color="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" />
                            {r.round2CbtScore != null && (
                              <ScoreCard label="R2 CBT Score" value={Number(r.round2CbtScore)} color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" />
                            )}
                            {r.finalScore != null && (
                              <ScoreCard label="Final Score" value={parseFloat(Number(r.finalScore).toFixed(1))} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" />
                            )}
                          </div>

                          {r.finalPublished && (
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              <a
                                href={`/techquiz/results/${app.eventId}`}
                                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                              >
                                View Full Leaderboard <ChevronRight size={12} />
                              </a>
                              {r.finalRank && (
                                <button
                                  onClick={() => window.open(`/api/certificate/techquiz/${app.id}`, "_blank")}
                                  className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-semibold border border-amber-300 dark:border-amber-600 rounded-lg px-2.5 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                                >
                                  <Award size={12} /> Download Certificate
                                </button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {applyEvent && (
          <ApplyModal
            event={applyEvent}
            childList={children}
            onClose={() => setApplyEvent(null)}
          />
        )}
        {showAddChild && (
          <AddChildModal onClose={() => setShowAddChild(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
