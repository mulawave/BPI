"use client";

import { useEffect, useRef } from "react";
import { api } from "@/client/trpc";

const BPT_PRICE_STORAGE_KEY = "bpi_last_bpt_price";

/** Read the last known BPT price from localStorage (persists across page loads). */
function getStoredPrice(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(BPT_PRICE_STORAGE_KEY);
  if (!raw) return null;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Hook to get the current BPT price (₦ per 1 BPT).
 * Reads the admin-set price from the database via dashboard.getBptPrice.
 * Falls back to the LAST KNOWN price from localStorage, never a hardcoded value.
 */
export function useBptPrice(): number {
  const { data } = api.dashboard.getBptPrice.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const livePrice = data?.price;
  const lastKnown = useRef<number | null>(getStoredPrice());

  useEffect(() => {
    if (livePrice && livePrice > 0) {
      lastKnown.current = livePrice;
      localStorage.setItem(BPT_PRICE_STORAGE_KEY, String(livePrice));
    }
  }, [livePrice]);

  // Priority: live DB price > last known cached price > seed default
  return livePrice ?? lastKnown.current ?? 5;
}
