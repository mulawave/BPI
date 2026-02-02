"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  FileText,
  Store,
  ShieldCheck,
  TrendingUp,
  Package,
  Bell,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Banknote,
  Database,
  Globe,
  BookOpen,
  ExternalLink,
  Share2,
  Award,
  Palette,
  RadioTower,
  MapPin,
  ArrowDownToLine,
  Image,
  GraduationCap,
  Activity,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: LayoutDashboard,
    description: "Overview & KPIs"
  },
  { 
    name: "Users", 
    href: "/admin/users", 
    icon: Users,
    description: "User management"
  },
  { 
    name: "Referrals", 
    href: "/admin/referrals", 
    icon: Share2,
    description: "Network lineage & fixes"
  },
  { 
    name: "Documentation", 
    href: "/admin/documentation", 
    icon: BookOpen,
    description: "Project documentation"
  },
  { 
    name: "Help & Support", 
    href: "/admin/help/topics", 
    icon: BookOpen,
    description: "Smart Help topics"
  },
  { 
    name: "DB Audit Coverage", 
    href: "/admin/help/db-audit", 
    icon: FileText, 
    description: "User flow coverage map"
  },
  { 
    name: "Payments", 
    href: "/admin/payments", 
    icon: CreditCard,
    description: "Payment verification",
    badge: "pending"
  },
  { 
    name: "Withdrawals", 
    href: "/admin/withdrawals", 
    icon: ArrowDownToLine,
    description: "Approve withdrawal requests"
  },
  { 
    name: "Store", 
    href: "/admin/store", 
    icon: Store,
    description: "Products, rewards, limits"
  },
  { 
    name: "Pickup Centers", 
    href: "/admin/pickup-centers", 
    icon: MapPin,
    description: "Fulfillment locations"
  },
  { 
    name: "CSP Queue", 
    href: "/admin/csp", 
    icon: RadioTower,
    description: "Approve & extend CSP requests"
  },
  { 
    name: "Packages", 
    href: "/admin/packages", 
    icon: Package,
    description: "Membership packages"
  },
  { 
    name: "Analytics", 
    href: "/admin/analytics", 
    icon: TrendingUp,
    description: "System analytics"
  },
  { 
    name: "Bank Accounts", 
    href: "/admin/bank-accounts", 
    icon: Banknote,
    description: "User payout accounts"
  },
  { 
    name: "Financials", 
    href: "/admin/financials", 
    icon: Banknote,
    description: "Inflows & outflows"
  },
  { 
    name: "DB Maintenance", 
    href: "/admin/database", 
    icon: Database,
    description: "Truncate & reset tables"
  },
  { 
    name: "Reports", 
    href: "/admin/reports", 
    icon: FileText,
    description: "Data reports"
  },
  { 
    name: "Community", 
    href: "/admin/community", 
    icon: Bell,
    description: "Updates & deals"
  },
  { 
    name: "Newsletter", 
    href: "/admin/newsletter", 
    icon: Mail,
    description: "Email campaigns"
  },
  { 
    name: "Blog & News", 
    href: "/admin/blog", 
    icon: BookOpen,
    description: "Posts, categories, comments"
  },
  { 
    name: "Leadership Pool", 
    href: "/admin/leadership-pool", 
    icon: Award,
    description: "Manage pool & participants"
  },
  { 
    name: "Third-Party Platforms", 
    href: "/admin/third-party", 
    icon: ExternalLink,
    description: "External opportunities"
  },
  { 
    name: "Promotional Materials", 
    href: "/admin/promotional-materials", 
    icon: Image,
    description: "Marketing assets & downloads"
  },
  { 
    name: "Training Center", 
    href: "/admin/training", 
    icon: GraduationCap,
    description: "Courses & lessons"
  },
  { 
    name: "Logs", 
    href: "/admin/logs/deposits", 
    icon: Activity,
    description: "Transaction logs",
    submenu: [
      { name: "Deposit Logs", href: "/admin/logs/deposits" },
      { name: "Withdrawal Logs", href: "/admin/logs/withdrawals" },
    ]
  },
  { 
    name: "Audit Logs", 
    href: "/admin/audit", 
    icon: ScrollText,
    description: "Activity history"
  },
  { 
    name: "Localization", 
    href: "/admin/localization/countries", 
    icon: Globe,
    description: "Countries, states & cities",
    submenu: [
      { name: "Countries", href: "/admin/localization/countries" },
      { name: "States", href: "/admin/localization/states" },
      { name: "Cities", href: "/admin/localization/cities" },
      { name: "Banks", href: "/admin/localization/banks" },
    ]
  },
  { 
    name: "Settings", 
    href: "/admin/settings", 
    icon: Settings,
    description: "System config"
  },
  { 
    name: "App Design", 
    href: "/admin/design", 
    icon: Palette,
    description: "Pages, policies, home layout"
  },
];

interface AdminSidebarProps {
  pendingCount?: number;
  pendingWithdrawalsCount?: number;
}

export default function AdminSidebar({ pendingCount = 0, pendingWithdrawalsCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); // Default collapsed

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        className="fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-card/70 backdrop-blur-xl lg:block"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold premium-gradient-text">
                  Admin Panel
                </span>
              </motion.div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-xl border border-border bg-background/60 p-1.5 text-foreground/70 transition-all hover:bg-background hover:text-foreground"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav
            className={`flex-1 space-y-1 overflow-y-auto p-4 ${
              pendingHref ? "pointer-events-none" : ""
            }`}
            aria-busy={pendingHref ? true : undefined}
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href || item.submenu?.some(sub => pathname === sub.href);
              const Icon = item.icon;
              const showBadge = item.badge === "pending" && pendingCount > 0;
              const showWithdrawalBadge = item.name === "Withdrawals" && pendingWithdrawalsCount > 0;
              const badgeCount = item.badge === "pending" ? pendingCount : item.name === "Withdrawals" ? pendingWithdrawalsCount : 0;
              const isPending = pendingHref === item.href;
              const isExpanded = expandedMenus.includes(item.name);
              const hasSubmenu = !!item.submenu;

              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (hasSubmenu && !collapsed) {
                        e.preventDefault();
                        setExpandedMenus(prev => 
                          prev.includes(item.name) 
                            ? prev.filter(n => n !== item.name)
                            : [...prev, item.name]
                        );
                      } else if (item.href !== pathname) {
                        setPendingHref(item.href);
                      }
                    }}
                    className={`
                      group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                      ${
                        isActive
                          ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-md"
                          : "text-foreground/75 hover:bg-background/60 hover:text-foreground"
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className="h-5 w-5" />
                      {isPending && (
                        <Loader2 className="absolute -right-2 -top-2 h-4 w-4 animate-spin text-[hsl(var(--secondary))]" />
                      )}
                    </div>
                    {!collapsed && (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            {isPending && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--secondary))]/15 px-2 py-0.5 text-xs font-semibold text-[hsl(var(--secondary))]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading
                              </span>
                            )}
                            {(showBadge || showWithdrawalBadge) && badgeCount > 0 && (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                                {badgeCount}
                              </span>
                            )}
                            {hasSubmenu && (
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            )}
                          </div>
                          {!isActive && (
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {collapsed && (showBadge || showWithdrawalBadge) && badgeCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Submenu */}
                  {hasSubmenu && isExpanded && !collapsed && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        const isSubPending = pendingHref === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => {
                              if (subItem.href !== pathname) {
                                setPendingHref(subItem.href);
                              }
                            }}
                            className={`
                              flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-all
                              ${
                                isSubActive
                                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium"
                                  : "text-foreground/60 hover:bg-background/60 hover:text-foreground"
                              }
                            `}
                          >
                            <span>{subItem.name}</span>
                            {isSubPending && (
                              <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--secondary))]" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 transition-all hover:bg-background/60 hover:text-foreground"
            >
              <LayoutDashboard className="h-5 w-5" />
              {!collapsed && <span>User Dashboard</span>}
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" style={{ width: collapsed ? 80 : 280 }} />
    </>
  );
}
