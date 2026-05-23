"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type SettingItem = {
  key: string;
  valueJson: unknown;
  isSecretRef?: boolean;
};

type SchemaProperty = {
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  pattern?: string;
};

type ConfigSchema = {
  title?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, SchemaProperty>;
};

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed.length) return "";

  try {
    return JSON.parse(trimmed);
  } catch {
    return raw;
  }
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pickSchemaType(property: SchemaProperty): string {
  if (Array.isArray(property.type)) {
    if (property.type.includes("boolean")) return "boolean";
    if (property.type.includes("integer")) return "integer";
    if (property.type.includes("number")) return "number";
    if (property.type.includes("string")) return "string";
    return property.type[0] || "string";
  }

  return property.type || "string";
}

function parseByType(raw: string, property: SchemaProperty): unknown {
  const fieldType = pickSchemaType(property);

  if (fieldType === "boolean") {
    return raw === "true";
  }

  if (fieldType === "integer") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (fieldType === "number") {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (fieldType === "object" || fieldType === "array") {
    return parseValue(raw);
  }

  return raw;
}

function buildInitialValues(settings: SettingItem[], configSchema?: ConfigSchema): Record<string, unknown> {
  const fromSaved = settings.reduce<Record<string, unknown>>((acc, item) => {
    if (!item.key || item.isSecretRef) return acc;
    acc[item.key] = item.valueJson;
    return acc;
  }, {});

  const schemaProps = configSchema?.properties ? Object.entries(configSchema.properties) : [];
  if (!schemaProps.length) {
    return fromSaved;
  }

  const withDefaults: Record<string, unknown> = {};
  for (const [key, property] of schemaProps) {
    if (Object.prototype.hasOwnProperty.call(fromSaved, key)) {
      withDefaults[key] = fromSaved[key];
      continue;
    }
    if (property.default !== undefined) {
      withDefaults[key] = property.default;
      continue;
    }
    if (pickSchemaType(property) === "boolean") {
      withDefaults[key] = false;
      continue;
    }
    withDefaults[key] = "";
  }

  return withDefaults;
}

export default function PluginSettingsForm({
  settings,
  configSchema,
  onSubmit,
  isSaving,
}: {
  settings: SettingItem[];
  configSchema?: ConfigSchema;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
}) {
  const [schemaValues, setSchemaValues] = useState<Record<string, unknown>>(() => buildInitialValues(settings, configSchema));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const schemaEntries = useMemo(() => {
    if (!configSchema?.properties) return [];
    return Object.entries(configSchema.properties);
  }, [configSchema]);

  const requiredSet = useMemo(() => new Set(configSchema?.required ?? []), [configSchema]);

  const hasSchema = schemaEntries.length > 0;

  const save = async () => {
    if (!hasSchema) {
      toast.error("This plugin must declare a settings schema before configuration can be edited.");
      return;
    }

    const errors: Record<string, string> = {};
    const payload: Record<string, unknown> = {};

    for (const [key, property] of schemaEntries) {
      const rawValue = schemaValues[key];
      const fieldType = pickSchemaType(property);

      const asString = stringifyValue(rawValue).trim();
      const isRequired = requiredSet.has(key);

      if (isRequired && (rawValue === "" || rawValue === undefined || rawValue === null)) {
        errors[key] = "This field is required.";
        continue;
      }

      if (!isRequired && asString.length === 0) {
        continue;
      }

      if ((fieldType === "integer" || fieldType === "number") && typeof rawValue === "number") {
        if (property.minimum !== undefined && rawValue < property.minimum) {
          errors[key] = `Minimum value is ${property.minimum}.`;
          continue;
        }
        if (property.maximum !== undefined && rawValue > property.maximum) {
          errors[key] = `Maximum value is ${property.maximum}.`;
          continue;
        }
      }

      if (fieldType === "string" && property.pattern && asString.length > 0) {
        try {
          const regex = new RegExp(property.pattern);
          if (!regex.test(asString)) {
            errors[key] = "Value does not match required format.";
            continue;
          }
        } catch {
          // Ignore invalid pattern definitions to avoid blocking settings save.
        }
      }

      if (Array.isArray(property.enum) && property.enum.length > 0) {
        const match = property.enum.some((option) => String(option) === String(rawValue));
        if (!match) {
          errors[key] = "Select one of the allowed options.";
          continue;
        }
      }

      payload[key] = rawValue;
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    await onSubmit(payload);
  };

  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Plugin Settings</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {configSchema?.description || "Use the guided form fields to configure this plugin."}
          </p>
        </div>
      </div>

      {hasSchema ? (
        <div className="space-y-3">
          {schemaEntries.map(([key, property]) => {
            const fieldType = pickSchemaType(property);
            const value = schemaValues[key];
            const error = fieldErrors[key];
            const recommendedBits = [
              property.default !== undefined ? `Recommended default: ${stringifyValue(property.default)}` : null,
              property.minimum !== undefined || property.maximum !== undefined
                ? `Allowed range: ${property.minimum ?? "-inf"} to ${property.maximum ?? "+inf"}`
                : null,
            ].filter(Boolean);

            return (
              <div key={key} className="rounded-xl border border-border bg-background/40 p-3">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{property.title || key}</p>
                    <p className="text-[11px] text-muted-foreground">{key}</p>
                  </div>
                  {requiredSet.has(key) ? (
                    <span className="rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300">
                      Required
                    </span>
                  ) : null}
                </div>

                {property.description ? <p className="mb-2 text-xs text-muted-foreground">{property.description}</p> : null}

                {Array.isArray(property.enum) && property.enum.length > 0 ? (
                  <select
                    value={stringifyValue(value)}
                    onChange={(event) => {
                      setSchemaValues((previous) => ({
                        ...previous,
                        [key]: parseByType(event.target.value, property),
                      }));
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
                  >
                    {property.enum.map((option) => (
                      <option key={`${key}-${String(option)}`} value={String(option)}>
                        {String(option)}
                      </option>
                    ))}
                  </select>
                ) : fieldType === "boolean" ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => {
                        setSchemaValues((previous) => ({ ...previous, [key]: event.target.checked }));
                      }}
                      className="h-4 w-4 rounded border-border text-[hsl(var(--primary))]"
                    />
                    {Boolean(value) ? "Enabled" : "Disabled"}
                  </label>
                ) : fieldType === "integer" || fieldType === "number" ? (
                  <input
                    type="number"
                    value={typeof value === "number" ? String(value) : ""}
                    min={property.minimum}
                    max={property.maximum}
                    step={fieldType === "integer" ? 1 : "any"}
                    onChange={(event) => {
                      const parsed = parseByType(event.target.value, property);
                      setSchemaValues((previous) => ({ ...previous, [key]: parsed }));
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
                  />
                ) : (
                  <input
                    type={property.pattern?.includes("@") ? "email" : "text"}
                    value={stringifyValue(value)}
                    onChange={(event) => {
                      setSchemaValues((previous) => ({ ...previous, [key]: event.target.value }));
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:outline-none"
                  />
                )}

                {recommendedBits.length > 0 ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">{recommendedBits.join(" | ")}</p>
                ) : null}
                {error ? <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p> : null}
              </div>
            );
          })}

          <div className="rounded-xl border border-border bg-background/30 p-3">
            <p className="text-xs font-semibold text-foreground">Applied Configuration Snapshot</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {schemaEntries.map(([key, property]) => (
                <div key={`summary-${key}`} className="rounded-lg border border-border bg-background/50 px-3 py-2 text-xs">
                  <p className="text-muted-foreground">{property.title || key}</p>
                  <p className="mt-1 font-semibold text-foreground break-all">{stringifyValue(schemaValues[key]) || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-semibold">Settings schema required</p>
          <p className="mt-1 text-xs">
            This plugin does not provide a settings schema. Upload a plugin version that declares
            <span className="font-semibold"> settings.schemaPath </span>
            so configuration can be managed with guided form controls.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={isSaving || !hasSchema}
        className="mt-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : hasSchema ? "Save Settings" : "Schema Required"}
      </button>
    </div>
  );
}
