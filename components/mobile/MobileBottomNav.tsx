"use client";

import { Home, Wallet, Settings, Menu, LifeBuoy, Store, Grid3x3, Wrench, User, HelpCircle, LogOut, BookOpen, Loader2 } from "lucide-react";
import { AiOutlineRobot } from "react-icons/ai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Inline cn utility to avoid import issues
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

interface MobileBottomNavProps {
  onWalletClick?: () => void;
  unreadNotifications?: number;
}

export default function MobileBottomNav({ 
  onWalletClick, 
  unreadNotifications = 0 
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [navLoadingHref, setNavLoadingHref] = useState<string | null>(null);

  useEffect(() => {
    setNavLoadingHref(null);
  }, [pathname]);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      onClick: undefined,
    },
    {
      icon: Wallet,
      label: "Wallets",
      href: "#wallets",
      onClick: onWalletClick,
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      onClick: undefined,
    },
    {
      icon: Menu,
      label: "Menu",
      href: "#menu",
      onClick: () => setShowMenu(!showMenu),
    },
  ];

  const mainNavItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "Blog", href: "/blog" },
    { icon: LifeBuoy, label: "BPI CSP", href: "/csp" },
    { icon: Store, label: "Store", href: "/store" },
    { icon: AiOutlineRobot, label: "Smart Help", href: "/help" },
    { icon: User, label: "Account", href: "/settings" },
    { icon: LogOut, label: "Logout", href: "/api/auth/signout" },
  ];

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-bpi-dark-card border-t border-gray-200 dark:border-bpi-dark-accent safe-area-bottom">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === pathname || (item.href === "/dashboard" && pathname === "/");
            
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                    return;
                  }
                  setNavLoadingHref(item.href);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors relative",
                  isActive
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <div className="relative">
                  {navLoadingHref === item.href ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-bpi-dark-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Menu</h3>
            </div>
            <nav className="p-4 space-y-2">
              {mainNavItems.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-green-800/50 text-sm text-gray-900 dark:text-white"
                  onClick={() => {
                    setNavLoadingHref(href);
                    setShowMenu(false);
                  }}
                >
                  {navLoadingHref === href ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

// Named export for consistency
export { MobileBottomNav };
