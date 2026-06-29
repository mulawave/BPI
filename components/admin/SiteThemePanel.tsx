"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { Award, Check, Loader2, Sparkles } from "lucide-react";

const ACTIVE_SITE_THEME_KEY = "active_site_theme";

type ThemeOption = {
  id: "default" | "emerald";
  name: string;
  description: string;
  swatches: string[];
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "default",
    name: "BeepAgro Classic",
    description: "The original BPI green & gold brand. Bright, friendly, familiar.",
    swatches: ["#2d7a4f", "#52a86b", "#f4d03f", "#f8f9fa"],
  },
  {
    id: "emerald",
    name: "Emerald Dynasty",
    description: "Regal. Timeless. Unmatched. Deep emeralds and champagne gold for a premium, luxury feel across the entire site.",
    swatches: ["#0A5E4E", "#093B33", "#D8C08A", "#F2EDE1"],
  },
];

/**
 * Admin control to select the site-wide brand theme. Writes the
 * `active_site_theme` AdminSetting; BrandThemeApplier picks it up on the next
 * load and re-skins the whole site. The classic look remains the safe fallback.
 */
export default function SiteThemePanel() {
  const utils = api.useUtils();
  const { data: activeTheme, isLoading } = api.config.getActiveTheme.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);

  const updateSetting = api.admin.updateSystemSetting.useMutation({
    onSuccess: async (_data, variables) => {
      const label = THEME_OPTIONS.find((t) => t.id === variables.settingValue)?.name ?? "Theme";
      toast.success(`${label} activated site-wide`);
      await utils.config.getActiveTheme.invalidate();
      setPendingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update theme: ${error.message}`);
      setPendingId(null);
    },
  });

  const current = activeTheme?.theme ?? "default";

  const handleSelect = (id: ThemeOption["id"]) => {
    if (id === current || updateSetting.isPending) return;
    setPendingId(id);
    updateSetting.mutate({
      settingKey: ACTIVE_SITE_THEME_KEY,
      settingValue: id,
      description: "Active site-wide brand theme",
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#D8C08A] via-[#0A5E4E] to-[#071B1E]" />
      <div className="relative p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#D8C08A]/40 bg-gradient-to-br from-[#0A5E4E] to-[#071B1E] text-[#D8C08A]">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Site Appearance</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D8C08A]/30 bg-[#D8C08A]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#9a7d2e]">
                <Sparkles className="h-3 w-3" /> Premium
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground leading-relaxed">
              Choose the brand theme applied across the entire platform. Changes take effect for
              every visitor on their next page load.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_OPTIONS.map((option) => {
            const isActive = current === option.id;
            const isBusy = updateSetting.isPending && pendingId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                disabled={updateSetting.isPending}
                aria-pressed={isActive}
                className={`group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "border-[#0A5E4E] ring-2 ring-[#0A5E4E]/30 shadow-lg"
                    : "border-border hover:border-[#0A5E4E]/50 hover:shadow-md"
                } ${updateSetting.isPending ? "cursor-wait" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{option.name}</span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0A5E4E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  ) : isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      Activate
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {option.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-7 w-7 rounded-md border border-black/10 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <p className="mt-3 text-xs text-muted-foreground">Loading current theme…</p>
        )}
      </div>
    </div>
  );
}
