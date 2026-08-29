"use client";

import { Session } from "next-auth";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/client/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Crown, User, Moon, Sun, LogOut, Settings, Wallet, Gem,
} from "lucide-react";
import { DesktopNav, MobileNavItems } from "@/components/shared/ShellNav";
import { signOut } from "next-auth/react";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";
import { abortAllInFlightTrpcRequests } from "@/lib/trpcNavAbort";
import Footer from "@/components/Footer";

function formatAmountShort(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

interface TechQuizShellProps {
  session: Session;
  children: ReactNode;
}

export default function TechQuizShell({ session, children }: TechQuizShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [navLoadingHref, setNavLoadingHref] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: userDetails } = api.user.getDetails.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const currentPath = pathname || "";
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);

  const handleNavClick = useCallback((href: string) => {
    abortAllInFlightTrpcRequests();
    setNavLoadingHref(href);
  }, []);

  useEffect(() => { setNavLoadingHref(null); }, [currentPath]);
  useEffect(() => {
    if (!navLoadingHref) return;
    const t = setTimeout(() => setNavLoadingHref(null), 12000);
    return () => clearTimeout(t);
  }, [navLoadingHref]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const profile = userDetails as any;
  const membershipName = profile?.activeMembership?.name ?? "No Membership";
  const walletBalance = profile?.wallet ?? 0;
  const tierName = profile?.rank ?? "—";
  const profileImage = profile?.image || profile?.profilePic || null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 transition-colors duration-500">
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-xl dark:shadow-emerald-950/50" : "bg-white/60 dark:bg-slate-950/60 backdrop-blur-md shadow-lg dark:shadow-emerald-950/30"} border-b border-slate-200/60 dark:border-emerald-800/40`}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" onClick={() => handleNavClick("/dashboard")} className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-amber-300/30 shadow-lg shrink-0">
                <img src="/img/logo.png" alt="BPI Logo" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className="font-serif text-lg font-bold text-slate-900 dark:text-white">BPI</span>
                <span className="ml-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-600 dark:text-emerald-400">TechQuiz</span>
              </div>
            </Link>
            <DesktopNav isActive={isActive} navLoadingHref={navLoadingHref} handleNavClick={handleNavClick} />
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
                  aria-label="Toggle profile panel"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{session?.user?.name || "Member"}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{membershipName}</p>
                  </div>
                  <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md">
                    {profileImage ? <img src={profileImage} alt="" className="h-9 w-9 rounded-full object-cover" /> : <User className="w-4 h-4 text-white" />}
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-72 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-800/40 shadow-2xl dark:shadow-emerald-950/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-2 ring-amber-300/30 shadow-md shrink-0">
                          {profileImage ? <img src={profileImage} alt="" className="h-12 w-12 rounded-full object-cover" /> : <User className="w-5 h-5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{session?.user?.name || "Member"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session?.user?.email || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-800/40">
                          <Crown className="h-3 w-3" />
                          {membershipName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Wallet</p>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{formatAmountShort(walletBalance)}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Gem className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Tier</p>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{tierName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Link href="/settings" onClick={() => { setProfileOpen(false); handleNavClick("/settings"); }} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <Settings className="w-3.5 h-3.5" />
                          Settings
                        </Link>
                        <button onClick={() => signOut({ callbackUrl: `${resolveClientBaseUrl()}/login` })} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800/40 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav className="lg:hidden sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 no-scrollbar">
          <MobileNavItems isActive={isActive} navLoadingHref={navLoadingHref} handleNavClick={handleNavClick} />
        </div>
      </nav>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 pb-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
