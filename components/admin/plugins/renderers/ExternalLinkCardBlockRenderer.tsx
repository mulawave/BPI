"use client";

import Link from "next/link";
import { FiExternalLink } from "react-icons/fi";

export default function ExternalLinkCardBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const label = typeof block.label === "string" ? block.label : "External link";
  const href = typeof block.href === "string" ? block.href : "";

  if (!href.startsWith("http://") && !href.startsWith("https://")) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">Invalid or missing external URL.</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <Link href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] hover:underline">
        {label}
        <FiExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
