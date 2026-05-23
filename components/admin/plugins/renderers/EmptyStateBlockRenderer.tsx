"use client";

export default function EmptyStateBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const title = typeof block.title === "string" ? block.title : "Nothing to display";
  const message = typeof block.message === "string" ? block.message : "";

  return (
    <div className="rounded-xl border border-dashed border-border bg-background/30 p-4 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {message ? <p className="mt-1 text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
