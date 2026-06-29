"use client";

import { useEffect } from "react";
import { api } from "@/client/trpc";

/**
 * Applies the admin-selected site brand theme by toggling `data-brand` on the
 * <html> element. When the active theme is "emerald" the Emerald Dynasty luxury
 * palette (styles/emerald-theme.css) takes over site-wide; otherwise the default
 * BPI brand is left untouched.
 *
 * Rendered once near the root (inside Providers) so it applies on every page.
 */
export default function BrandThemeApplier() {
  const { data } = api.config.getActiveTheme.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const theme = data?.theme ?? "default";

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "emerald") {
      root.setAttribute("data-brand", "emerald");
    } else {
      root.removeAttribute("data-brand");
    }
  }, [theme]);

  return null;
}
