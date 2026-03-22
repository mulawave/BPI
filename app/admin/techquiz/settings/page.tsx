"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import {
  Settings,
  Save,
  RefreshCw,
  ChevronLeft,
  Info,
  ToggleLeft,
  ToggleRight,
  Hash,
  DollarSign,
  Shield,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────
type SettingMeta = {
  key: string;
  label: string;
  description: string;
  type: "number" | "boolean" | "select" | "text";
  options?: string[];
  unit?: string;
  icon: React.ReactNode;
};

const SETTINGS_META: SettingMeta[] = [
  {
    key: "techquiz_default_top_qualifiers_per_school",
    label: "Top Qualifiers Per School",
    description: "Number of students from each school that qualify for Round 2.",
    type: "number",
    unit: "students",
    icon: <Hash size={16} />,
  },
  {
    key: "techquiz_default_min_students_per_school",
    label: "Minimum Students Per School",
    description: "Minimum applications a school must have to remain eligible for the event.",
    type: "number",
    unit: "students",
    icon: <Hash size={16} />,
  },
  {
    key: "techquiz_default_max_students_per_school",
    label: "Maximum Students Per School",
    description: "Maximum applications a school can accept for any event.",
    type: "number",
    unit: "students",
    icon: <Hash size={16} />,
  },
  {
    key: "techquiz_default_cbt_weight_pct",
    label: "CBT Weight (%)",
    description: "Default CBT component weight in final score computation. Must sum to 100 with onsite weight.",
    type: "number",
    unit: "%",
    icon: <Hash size={16} />,
  },
  {
    key: "techquiz_default_onsite_weight_pct",
    label: "Onsite Weight (%)",
    description: "Default onsite component weight in final score computation. Must sum to 100 with CBT weight.",
    type: "number",
    unit: "%",
    icon: <Hash size={16} />,
  },
  {
    key: "techquiz_default_sponsorship_price",
    label: "Sponsorship Price (₦ per child)",
    description: "Default cost per child-parent unit for sponsorship packages.",
    type: "number",
    unit: "₦",
    icon: <DollarSign size={16} />,
  },
  {
    key: "techquiz_cbt_tiebreak_method",
    label: "CBT Tiebreak Method",
    description: "Method used to resolve tied CBT scores during qualifier selection.",
    type: "select",
    options: ["SUBMISSION_TIME", "ROUND1_SCORE"],
    icon: <Settings size={16} />,
  },
  {
    key: "techquiz_required_membership_tier",
    label: "Required Membership Tier",
    description: "Minimum BPI membership tier required for a parent to apply for TechQuiz.",
    type: "select",
    options: ["REGULAR", "PREMIUM", "ELITE"],
    icon: <Shield size={16} />,
  },
  {
    key: "techquiz_sponsor_visibility_enabled",
    label: "Sponsor Visibility Enabled",
    description: "Show sponsor acknowledgment and branding on the BPI portal per event.",
    type: "boolean",
    icon: <ToggleRight size={16} />,
  },
  {
    key: "techquiz_certificate_generation_enabled",
    label: "Certificate Generation Enabled",
    description: "Enable certificate generation module for award recipients.",
    type: "boolean",
    icon: <ToggleRight size={16} />,
  },
  {
    key: "techquiz_blog_auto_publish_enabled",
    label: "Blog Auto-Publish Enabled",
    description: "Allow admin to auto-publish Round 1 summary and winner posts to BPI blog.",
    type: "boolean",
    icon: <ToggleRight size={16} />,
  },
];

// ─── Setting Row ─────────────────────────────────────────────────────────────
function SettingRow({
  meta,
  currentValue,
  onSave,
  isSaving,
}: {
  meta: SettingMeta;
  currentValue: string;
  onSave: (key: string, val: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue);

  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  function handleSave() {
    onSave(meta.key, draft);
    setEditing(false);
  }

  const isBoolean = meta.type === "boolean";
  const boolVal = currentValue === "true";

  if (isBoolean) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5">
            {meta.icon}
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{meta.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.description}</p>
          </div>
        </div>
        <button
          onClick={() => onSave(meta.key, boolVal ? "false" : "true")}
          disabled={isSaving}
          className="flex-shrink-0 mt-1"
        >
          {boolVal ? (
            <ToggleRight size={28} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ToggleLeft size={28} className="text-slate-400" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">{meta.label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{meta.description}</p>
          {editing ? (
            <div className="mt-2 flex items-center gap-2">
              {meta.type === "select" ? (
                <select
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {meta.options?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={meta.type === "number" ? "number" : "text"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-32"
                />
              )}
              {meta.unit && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{meta.unit}</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                <Save size={13} className="inline mr-1" />Save
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(currentValue); }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {currentValue}
              {meta.unit && <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">{meta.unit}</span>}
            </p>
          )}
        </div>
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition hover:bg-slate-200 dark:hover:bg-slate-600 mt-1"
        >
          Edit
        </button>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminTechQuizSettingsPage() {
  const utils = api.useUtils();
  const settingsQ = api.techquiz.getCmsSettings.useQuery();
  const updateMut = api.techquiz.updateCmsSetting.useMutation({
    onSuccess: () => {
      toast.success("Setting saved");
      utils.techquiz.getCmsSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const seedMut = api.techquiz.seedDefaultCmsSettings.useMutation({
    onSuccess: (d) => {
      toast.success(`Seeded ${d.created} default settings`);
      utils.techquiz.getCmsSettings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const settings = settingsQ.data ?? {};
  const isLoading = settingsQ.isPending;

  function handleSave(key: string, value: string) {
    updateMut.mutate({ key, value });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/techquiz"
              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center shadow-lg">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">TechQuiz Settings</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Global CMS configuration defaults</p>
            </div>
          </div>
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw size={15} className={seedMut.isPending ? "animate-spin" : ""} />
            Seed Defaults
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Info size={15} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            These settings serve as defaults when creating new events. Per-event overrides take precedence.
            Use <strong>Seed Defaults</strong> to create any missing keys without overwriting existing values.
          </p>
        </div>

        {/* Settings list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {SETTINGS_META.map((meta) => (
              <SettingRow
                key={meta.key}
                meta={meta}
                currentValue={settings[meta.key] ?? "—"}
                onSave={handleSave}
                isSaving={updateMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
