"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LayoutDashboard, Users, BookOpen, Home, Loader2 } from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Community", href: "/community", icon: Users },
  { label: "Blog & News", href: "/blog", icon: BookOpen },
  { label: "Smart Help", href: "/help", icon: AiOutlineRobot },
  { label: "About", href: "/about", icon: Home },
];

interface AppNavProps {
  activePath?: string;
}

export function AppNav({ activePath }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current = activePath || pathname || "";

  return (
    <div className="hidden md:block border-b border-bpi-border/70 dark:border-bpi-dark-accent/70 bg-white/90 dark:bg-bpi-dark-card/80 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = current === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${active ? "border-emerald-700 text-emerald-800 bg-emerald-50 shadow-sm dark:border-emerald-400/80 dark:text-emerald-50 dark:bg-emerald-900/40" : "border-border text-foreground hover:border-emerald-500 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="gap-2"
          disabled={isPending}
          onClick={() => startTransition(() => router.push("/dashboard"))}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Go to Dashboard"
          )}
        </Button>
      </div>
    </div>
  );
}
