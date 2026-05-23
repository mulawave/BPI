"use client";

const ALERT_STYLE: Record<string, string> = {
  info: "border-blue-300/50 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300",
  warning: "border-amber-300/50 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300",
  error: "border-rose-300/50 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300",
  success: "border-emerald-300/50 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300",
};

export default function AlertBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const tone = typeof block.tone === "string" && block.tone in ALERT_STYLE ? block.tone : "info";
  const title = typeof block.title === "string" ? block.title : "Notice";
  const message = typeof block.message === "string" ? block.message : "";

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${ALERT_STYLE[tone]}`}>
      <p className="font-semibold">{title}</p>
      {message ? <p className="mt-1">{message}</p> : null}
    </div>
  );
}
