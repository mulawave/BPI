"use client";

type Field = {
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
};

export default function ConfigFormBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const fields = Array.isArray(block.fields) ? (block.fields as Field[]) : [];

  if (!fields.length) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">No config fields defined.</div>;
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-background/40 p-3">
      <p className="text-xs font-semibold text-foreground">Declarative config fields</p>
      <div className="space-y-1">
        {fields.map((field, index) => (
          <div key={`${field.key || "field"}-${index}`} className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{field.label || field.key || `Field ${index + 1}`}</span>
            <span> · {field.type || "string"}</span>
            {field.required ? <span> · required</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
