"use client";

import { FiAlertTriangle, FiCheckCircle, FiShield } from "react-icons/fi";

type ValidationReportProps = {
  passed: boolean;
  validationErrors: unknown;
};

function normalizeIssues(validationErrors: unknown): string[] {
  if (!validationErrors) return [];

  if (typeof validationErrors === "string") return [validationErrors];

  if (Array.isArray(validationErrors)) {
    return validationErrors.map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        const issue = entry as { code?: string; message?: string };
        return `${issue.code || "VALIDATION"}: ${issue.message || "Unknown validation issue"}`;
      }
      return "Unknown validation issue";
    });
  }

  if (typeof validationErrors === "object") {
    const payload = validationErrors as { code?: string; message?: string; issues?: unknown[] };
    if (Array.isArray(payload.issues)) {
      return payload.issues.map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const issue = entry as { code?: string; message?: string };
          return `${issue.code || "VALIDATION"}: ${issue.message || "Unknown validation issue"}`;
        }
        return "Unknown validation issue";
      });
    }

    if (payload.code || payload.message) {
      return [`${payload.code || "VALIDATION"}: ${payload.message || "Unknown validation issue"}`];
    }
  }

  return ["Unknown validation payload"]; 
}

export default function PluginValidationReport({ passed, validationErrors }: ValidationReportProps) {
  const issues = normalizeIssues(validationErrors);

  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
            <FiShield className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Validation Report</h3>
        </div>
        {passed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
            <FiCheckCircle className="h-3.5 w-3.5" />
            Passed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-900/35 dark:text-rose-300">
            <FiAlertTriangle className="h-3.5 w-3.5" />
            Failed
          </span>
        )}
      </div>

      {passed && issues.length === 0 ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          Manifest and compatibility checks passed for this version.
        </p>
      ) : (
        <div className="rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
          <p className="mb-1 font-semibold">Validation blockers</p>
          <ul className="list-disc space-y-1 pl-4 text-xs">
            {issues.length ? issues.map((issue) => <li key={issue}>{issue}</li>) : <li>No issue details were provided.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
