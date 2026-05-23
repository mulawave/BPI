"use client";

export default function HeroBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const title = typeof block.title === "string" ? block.title : "Plugin Hero";
  const subtitle = typeof block.subtitle === "string" ? block.subtitle : "";

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-[hsl(var(--primary))/0.12] to-[hsl(var(--secondary))/0.1] p-4">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
