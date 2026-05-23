"use client";

type SectionItem = {
  label?: string;
  description?: string;
};

export default function SectionBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const title = typeof block.title === "string" ? block.title : "Section";
  const items = Array.isArray(block.items) ? (block.items as SectionItem[]) : [];

  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">No section items declared.</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={`${item.label || "section-item"}-${index}`} className="rounded-xl border border-border bg-background/50 p-3">
            <p className="text-sm font-semibold text-foreground">{item.label || `Item ${index + 1}`}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description || "No description provided."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}