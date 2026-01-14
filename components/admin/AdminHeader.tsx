"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "../../contexts/ThemeContext";

interface AdminHeaderProps {
  admin: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Page Title (can be customized per page) */}
        <div>
          <h1 className="text-2xl font-bold premium-gradient-text">
            Admin Dashboard
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-border bg-card/60 p-2 text-foreground/70 shadow-sm transition-all hover:bg-card hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative rounded-xl border border-border bg-card/60 p-2 text-foreground/70 shadow-sm transition-all hover:bg-card hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Admin Profile Dropdown */}
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-3 py-2 shadow-sm backdrop-blur">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
              {admin.image ? (
                <Image
                  src={admin.image}
                  alt={admin.name || "Admin"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {admin.name || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground">
                {admin.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="ml-2 rounded-xl border border-transparent p-1.5 text-foreground/60 transition-all hover:border-border hover:bg-background/60 hover:text-red-600"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Brand Accent Line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[hsl(var(--secondary))] to-transparent opacity-60" />
    </header>
  );
}
