"use client";

import { useEffect, useMemo, useState } from "react";
import { FiMaximize2, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "viewportFitBannerDismissed:v1";

function canRequestFullscreen() {
  return typeof document !== "undefined" && !!document.documentElement?.requestFullscreen;
}

export default function ViewportFitBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isDismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    setDismissed(isDismissed);

    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const shouldShow = useMemo(() => {
    // Only suggest fullscreen on larger devices; on small/mobile screens this isn't useful.
    const isSmall = viewport.width > 0 && (viewport.width < 1024 || viewport.height < 700);
    const isVerySmall = viewport.width > 0 && viewport.width < 768;
    return !dismissed && isSmall && !isVerySmall && !document.fullscreenElement;
  }, [dismissed, viewport.width, viewport.height]);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  const enterFullscreen = async () => {
    if (!canRequestFullscreen()) return;

    try {
      await document.documentElement.requestFullscreen();
      dismiss();
    } catch {
      // If the browser blocks it, just keep the banner.
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] w-[min(720px,calc(100%-2rem))] -translate-x-1/2">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 shadow">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Better fit available</p>
          <p className="text-xs text-muted-foreground">
            For the best experience, use full screen or enlarge your window.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={enterFullscreen} disabled={!canRequestFullscreen()}>
            <FiMaximize2 className="mr-2 h-4 w-4" />
            Enter full screen
          </Button>
          <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss">
            <FiX className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
