"use client";

import { useState, useEffect, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Inline cn utility
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
  icon?: ReactNode;
  badge?: number | string;
  badgeOnMobileOnly?: boolean;
  mobileOnly?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  storageKey,
  icon,
  badge,
  badgeOnMobileOnly,
  mobileOnly,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`bpi:section:${storageKey}`);
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    }
  }, [storageKey]);

  // Save state to localStorage when changed
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`bpi:section:${storageKey}`, String(newState));
    }
  };

  if (mobileOnly) {
    return (
      <div
        className={cn(
          "overflow-hidden border-0 rounded-none bg-transparent lg:border lg:border-gray-200 lg:dark:border-green-800/50 lg:rounded-lg",
          className
        )}
      >
        {/* Mobile header */}
        <button
          onClick={toggleExpanded}
          className="lg:hidden w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-800/60 dark:to-emerald-700/60 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-700/70 dark:hover:to-emerald-600/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon && <div className="text-green-600 dark:text-green-400">{icon}</div>}
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h2>
            {badge !== undefined && (
              <span className={cn(
                "bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full",
                badgeOnMobileOnly ? "lg:hidden" : undefined
              )}>
                {badge}
              </span>
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Mobile content */}
        <div
          className={cn(
            "lg:hidden transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-3 sm:p-4 bg-white dark:bg-bpi-dark-card">
            {children}
          </div>
        </div>

        {/* Desktop: always expanded, no header */}
        <div className="hidden lg:block p-0 bg-transparent">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-gray-200 dark:border-green-800/50 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-800/60 dark:to-emerald-700/60 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-700/70 dark:hover:to-emerald-600/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-green-600 dark:text-green-400">{icon}</div>}
          <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{title}</h2>
          {badge !== undefined && (
            <span className={cn(
              "bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full",
              badgeOnMobileOnly ? "lg:hidden" : undefined
            )}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 bg-white dark:bg-bpi-dark-card">
          {children}
        </div>
      </div>
    </div>
  );
}

// Named export for consistency
export { CollapsibleSection };
