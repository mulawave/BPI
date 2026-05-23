"use client";

type StatItem = {
  label?: string;
  value?: string | number;
};

export default function StatGridBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const items = Array.isArray(block.items) ? (block.items as StatItem[]) : [];

  if (!items.length) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">No stats declared.</div>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <div key={`${item.label || "stat"}-${index}`} className="rounded-xl border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">{item.label || `Metric ${index + 1}`}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{item.value ?? "-"}</p>
        </div>
      ))}
    </div>
  );
}
