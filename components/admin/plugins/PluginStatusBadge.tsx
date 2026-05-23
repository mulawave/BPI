"use client";

type PluginStatus =
  | "DRAFT"
  | "VALIDATED"
  | "REJECTED"
  | "INSTALLED"
  | "CONFIG_REQUIRED"
  | "DISABLED"
  | "ENABLED"
  | "ERROR"
  | "REMOVED";

const STATUS_STYLES: Record<PluginStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  VALIDATED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  INSTALLED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CONFIG_REQUIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DISABLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ENABLED: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  REMOVED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300",
};

function toReadable(status: PluginStatus) {
  return status
    .split("_")
    .map((segment) => segment[0] + segment.slice(1).toLowerCase())
    .join(" ");
}

export default function PluginStatusBadge({ status }: { status: PluginStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {toReadable(status)}
    </span>
  );
}
