"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Calendar, Moon, Sun, RefreshCw, Settings, LogOut, User } from "lucide-react";

interface AppHeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
}

export function AppHeader({ pageTitle = "BeepAgro Africa", pageSubtitle = "Palliative Initiative" }: AppHeaderProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { selectedCurrency: currentCurrency, currencies, setSelectedCurrencyId } = useCurrency();
  const selectedCurrencyId = currentCurrency?.id || "";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userAvatar = session?.user?.image;
  const avatarSrc = userAvatar && !avatarLoadError ? userAvatar : "/img/logo.png";

  return (
    <header className="sticky top-0 z-40 border-b border-bpi-border dark:border-bpi-dark-accent bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-lg shadow-sm">
      <div className="w-full bg-gradient-to-r from-white/60 to-white/80 dark:from-bpi-dark-card/60 dark:to-bpi-dark-card/80">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <img src="/img/logo.png" alt="BPI" className="h-11 w-11 rounded-xl border border-border object-cover flex-shrink-0" />
            <div className="hidden sm:block truncate">
              <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{pageTitle}</p>
              <h1 className="text-lg font-bold text-foreground truncate">{pageSubtitle}</h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(currentTime, "PP")}</span>
              <span className="font-mono">{format(currentTime, "p")}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2 bg-white dark:bg-green-900/40 hover:bg-accent border-gray-300 dark:border-green-700/50"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span className="hidden md:inline">{theme === "light" ? "Dark" : "Light"}</span>
            </Button>

            <div className="relative">
              <select
                value={selectedCurrencyId}
                onChange={(e) => setSelectedCurrencyId(e.target.value)}
                className="h-9 px-3 pr-8 text-sm font-medium bg-white dark:bg-green-900/40 hover:bg-accent border border-gray-300 dark:border-green-700/50 rounded-md appearance-none cursor-pointer transition-colors text-gray-900 dark:text-white"
                disabled={!currencies || currencies.length === 0}
              >
                {currencies?.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.symbol || currency.name}
                  </option>
                ))}
              </select>
              <RefreshCw className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={avatarSrc}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover"
                  onError={() => setAvatarLoadError(true)}
                />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-foreground truncate">{session?.user?.name || session?.user?.email || "Guest"}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email || "Member"}</p>
              </div>
            </div>

            {session?.user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-green-900/40 border-gray-300 dark:border-green-700/50">
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline">Settings</span>
                  </Button>
                </Link>
                <Link href="/api/auth/signout">
                  <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-green-900/40 border-gray-300 dark:border-green-700/50">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Sign Out</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-green-900/40 border-gray-300 dark:border-green-700/50">
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
