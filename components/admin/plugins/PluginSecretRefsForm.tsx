"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FiKey, FiPlus, FiTrash2 } from "react-icons/fi";

type SecretRow = {
  settingKey: string;
  secretAlias: string;
};

export default function PluginSecretRefsForm({
  onApply,
  isSaving,
}: {
  onApply: (values: Record<string, string>) => Promise<void>;
  isSaving?: boolean;
}) {
  const [rows, setRows] = useState<SecretRow[]>([{ settingKey: "", secretAlias: "" }]);

  const updateRow = (index: number, updates: Partial<SecretRow>) => {
    setRows((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)));
  };

  const addRow = () => {
    setRows((previous) => [...previous, { settingKey: "", secretAlias: "" }]);
  };

  const removeRow = (index: number) => {
    setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const apply = async () => {
    const payload: Record<string, string> = {};

    for (const row of rows) {
      const key = row.settingKey.trim();
      const alias = row.secretAlias.trim();
      if (!key && !alias) continue;
      if (!key || !alias) {
        toast.error("Both setting key and secret alias are required");
        return;
      }

      payload[key] = `secret://${alias}`;
    }

    if (!Object.keys(payload).length) {
      toast.error("Add at least one secret reference");
      return;
    }

    await onApply(payload);
  };

  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
            <FiKey className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Secret References</h3>
            <p className="mt-1 text-xs text-muted-foreground">Store only references like secret://PAYMENT_API_KEY.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={`${row.settingKey}-${index}`} className="grid gap-2 rounded-xl border border-border bg-background/40 p-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={row.settingKey}
              onChange={(event) => updateRow(index, { settingKey: event.target.value })}
              placeholder="settings.apiKeyRef"
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
            />
            <input
              type="text"
              value={row.secretAlias}
              onChange={(event) => updateRow(index, { secretAlias: event.target.value })}
              placeholder="PAYMENT_API_KEY"
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-rose-500"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={apply}
        disabled={isSaving}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Applying..." : "Apply Secret Refs"}
      </button>
    </div>
  );
}
