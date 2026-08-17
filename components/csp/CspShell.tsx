"use client";

import { Session } from "next-auth";
import Link from "next/link";
import { useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/client/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Home, BookOpen, LifeBuoy, Store, User, GraduationCap,
  Crown, Trophy, Moon, Sun, Loader2, Shield, LogOut,
} from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";
import { signOut } from "next-auth/react";

interface CspShellProps {
  session: Session;
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/csp", label: "CSP", icon: LifeBuoy },
  { href: "/store", label: "Store", icon: Store },
  { href: "/help", label: "Help", icon: AiOutlineRobot },
  { href: "/empowerment", label: "Empowerment", icon: GraduationCap },
  { href: "/elite-club", label: "Elite Club", icon: Crown },
  { href: "/techquiz", label: "TechQuiz", icon: Trophy },
  { href: "/settings", label: "Account", icon: User },
];

export default function CspShell({ session, children }: CspShellProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [navLoadingHref, setNavLoadingHref] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { data: userDetails } = api.user.getDetails.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const currentPath = pathname || "";
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);

  const handleNavClick = useCallback((href: string) => {
    void queryClient.cancelQueries();
    setNavLoadingHref(href);
  }, [queryClient]);

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

  const profile = (userDetails as any)?.user ?? userDetails;
  const membershipName = (userDetails as any)?.activeMembership?.name ?? "No Membership";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-amber-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 transition-colors duration-500">
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-lg" : "bg-white/60 dark:bg-slate-950/60 backdrop-blur-md"} border-b border-slate-200/60 dark:border-slate-800/60`}>
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" onClick={() => handleNavClick("/dashboard")} className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 shadow-lg ring-1 ring-amber-300/30">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div className="hidden sm:block">
                <span className="font-serif text-lg font-bold text-slate-900 dark:text-white">BPI</span>
                <span className="ml-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-600 dark:text-emerald-400">CSP</span>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const loading = navLoadingHref === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => handleNavClick(item.href)} className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${active ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-900/20" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40"}`}>
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <item.icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                    {active && <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" />}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{session?.user?.name || "Member"}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{membershipName}</p>
                </div>
                <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md">
                  {profile?.image ? <img src={profile.image} alt="" className="h-9 w-9 rounded-full object-cover" /> : <User className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav className="lg:hidden sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const loading = navLoadingHref === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => handleNavClick(item.href)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${active ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-600 dark:text-slate-400"}`}>
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <item.icon className="w-3 h-3" />}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
