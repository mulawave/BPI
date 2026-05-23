"use client";

import type { PluginPageBlock, PluginPageSchema } from "@/types/plugin-page-schema";
import HeroBlockRenderer from "@/components/admin/plugins/renderers/HeroBlockRenderer";
import StatGridBlockRenderer from "@/components/admin/plugins/renderers/StatGridBlockRenderer";
import SectionBlockRenderer from "@/components/admin/plugins/renderers/SectionBlockRenderer";
import InfoPanelBlockRenderer from "@/components/admin/plugins/renderers/InfoPanelBlockRenderer";
import ConfigFormBlockRenderer from "@/components/admin/plugins/renderers/ConfigFormBlockRenderer";
import TableBlockRenderer from "@/components/admin/plugins/renderers/TableBlockRenderer";
import AlertBlockRenderer from "@/components/admin/plugins/renderers/AlertBlockRenderer";
import EmptyStateBlockRenderer from "@/components/admin/plugins/renderers/EmptyStateBlockRenderer";
import ExternalLinkCardBlockRenderer from "@/components/admin/plugins/renderers/ExternalLinkCardBlockRenderer";

function toRecord(block: PluginPageBlock): Record<string, unknown> {
  return block as Record<string, unknown>;
}

export default function PluginPageRenderer({ schema }: { schema: PluginPageSchema }) {
  if (!schema.blocks.length) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-4 text-sm text-muted-foreground">No declarative blocks defined.</div>;
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {schema.blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "hero":
            return <HeroBlockRenderer key={key} block={toRecord(block)} />;
          case "stat-grid":
            return <StatGridBlockRenderer key={key} block={toRecord(block)} />;
          case "section":
            return <SectionBlockRenderer key={key} block={toRecord(block)} />;
          case "info-panel":
            return <InfoPanelBlockRenderer key={key} block={toRecord(block)} />;
          case "config-form":
            return <ConfigFormBlockRenderer key={key} block={toRecord(block)} />;
          case "table":
            return <TableBlockRenderer key={key} block={toRecord(block)} />;
          case "alert":
            return <AlertBlockRenderer key={key} block={toRecord(block)} />;
          case "empty-state":
            return <EmptyStateBlockRenderer key={key} block={toRecord(block)} />;
          case "external-link-card":
            return <ExternalLinkCardBlockRenderer key={key} block={toRecord(block)} />;
          default:
            // Fail closed: unsupported blocks never execute and are rendered as blocked placeholders.
            return (
              <div key={key} className="rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
                Block type is unsupported and has been safely ignored.
              </div>
            );
        }
      })}
    </div>
  );
}
