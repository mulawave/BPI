"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, Home, BookOpen, LifeBuoy, Store, User, GraduationCap, Crown, Trophy, Puzzle } from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";

export const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/csp", label: "CSP", icon: LifeBuoy },
  { href: "/store", label: "Store", icon: Store },
  { href: "/help", label: "Help", icon: AiOutlineRobot },
  { href: "/settings", label: "Account", icon: User },
];

export const extensionNavItems = [
  { href: "/empowerment", label: "Empowerment", icon: GraduationCap },
  { href: "/elite-club", label: "Elite Club", icon: Crown },
  { href: "/techquiz", label: "TechQuiz", icon: Trophy },
];

export const allNavItems = [...mainNavItems, ...extensionNavItems];

interface ShellNavProps {
  isActive: (href: string) => boolean;
  navLoadingHref: string | null;
  handleNavClick: (href: string) => void;
}

export function DesktopNav({ isActive, navLoadingHref, handleNavClick }: ShellNavProps) {
  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const extensionsRef = useRef<HTMLDivElement>(null);

  const isExtensionActive = extensionNavItems.some((item) => isActive(item.href));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (extensionsRef.current && !extensionsRef.current.contains(e.target as Node)) {
        setExtensionsOpen(false);
      }
    };
    if (extensionsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [extensionsOpen]);

  return (
    <nav className="hidden lg:flex items-center gap-0.5">
      {mainNavItems.map((item) => {
        const active = isActive(item.href);
        const loading = navLoadingHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => handleNavClick(item.href)}
            className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              active
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <item.icon className="w-3.5 h-3.5" />}
            <span>{item.label}</span>
            {active && (
              <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" />
            )}
          </Link>
        );
      })}

      <div ref={extensionsRef} className="relative">
        <button
          onClick={() => setExtensionsOpen((v) => !v)}
          className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            isExtensionActive
              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span>Extensions</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${extensionsOpen ? "rotate-180" : ""}`} />
          {isExtensionActive && (
            <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" />
          )}
        </button>
        {extensionsOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-800/40 shadow-2xl dark:shadow-emerald-950/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
            <div className="p-1.5">
              {extensionNavItems.map((item) => {
                const active = isActive(item.href);
                const loading = navLoadingHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      handleNavClick(item.href);
                      setExtensionsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <item.icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function MobileNavItems({ isActive, navLoadingHref, handleNavClick }: ShellNavProps) {
  return (
    <>
      {allNavItems.map((item) => {
        const active = isActive(item.href);
        const loading = navLoadingHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => handleNavClick(item.href)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              active
                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <item.icon className="w-3 h-3" />}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
