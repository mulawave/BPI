"use client";

export default function InfoPanelBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const title = typeof block.title === "string" ? block.title : "Information";
  const body = typeof block.body === "string" ? block.body : "";

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{body || "No content provided."}</p>
    </div>
  );
}
