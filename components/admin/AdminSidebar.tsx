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
  GitBranch,
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
  Gift,
  Crown,
  Trophy,
  School,
  Menu,
  X,
} from "lucide-react";
import { FiBookOpen } from "react-icons/fi";
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
    name: "KYC", 
    href: "/admin/kyc", 
    icon: ShieldCheck,
    description: "Identity verification",
    badge: "pending"
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
    name: "CSP Donations", 
    href: "/admin/csp-donations", 
    icon: Award,
    description: "Record donations & badge tiers"
  },
  { 
    name: "Packages", 
    href: "/admin/packages", 
    icon: Package,
    description: "Membership packages"
  },
  { 
    name: "Empowerment", 
    href: "/admin/empowerment", 
    icon: FiBookOpen,
    description: "Manage empowerment lifecycle"
  },
  { 
    name: "Elite Club", 
    href: "/admin/elite-club", 
    icon: Crown,
    description: "Elite Club management & CMS"
  },
  {
    name: "TechQuiz",
    href: "/admin/techquiz",
    icon: Trophy,
    description: "STEM competition platform",
    submenu: [
      { name: "Events", href: "/admin/techquiz" },
      { name: "Schools", href: "/admin/techquiz/schools" },
      { name: "Reports", href: "/admin/techquiz/reports" },
      { name: "Sponsorship", href: "/admin/techquiz/sponsorship" },
      { name: "Compliance", href: "/admin/techquiz/compliance" },
      { name: "Settings", href: "/admin/techquiz/settings" },
    ],
  },
  { 
    name: "Palliatives", 
    href: "/admin/palliatives", 
    icon: Gift,
    description: "Palliative catalogue & pricing"
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
    name: "Finance Command", 
    href: "/admin/financials", 
    icon: Banknote,
    description: "Ledger remediation & audit"
  },
  { 
    name: "Revenue Pools", 
    href: "/admin/revenue-pools", 
    icon: Activity,
    description: "50/30/20 allocation & distributions"
  },
  { 
    name: "Currency Manager", 
    href: "/admin/currency", 
    icon: TrendingUp,
    description: "Exchange rates & BPToken price"
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
    name: "Third-Party Matrix",
    href: "/admin/third-party-matrix",
    icon: GitBranch,
    description: "Matrix controls & sponsor tree"
  },
  {
    name: "Promo Campaigns",
    href: "/admin/promo-campaigns",
    icon: Gift,
    description: "Free activation campaigns"
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
    name: "Plugins", 
    href: "/admin/plugins", 
    icon: Package,
    description: "Upload and manage plugins"
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
  pendingKycCount?: number;
}

export default function AdminSidebar({ pendingCount = 0, pendingWithdrawalsCount = 0, pendingKycCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); // Default collapsed

  useEffect(() => {
    setPendingHref(null);
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Nav Trigger */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card/95 text-foreground shadow-lg backdrop-blur lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close admin navigation overlay"
          />

          <div className="absolute right-0 top-0 h-full w-[88%] max-w-[340px] border-l border-border bg-card/95 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-semibold premium-gradient-text">Admin Menu</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-xl border border-border bg-background/60 p-1.5 text-foreground/70"
                aria-label="Close admin menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="h-[calc(100%-8rem)] space-y-1 overflow-y-auto p-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href || item.submenu?.some((sub) => pathname === sub.href);
                const Icon = item.icon;
                const itemBadgeCount = item.name === "Payments" ? pendingCount : item.name === "KYC" ? pendingKycCount : item.name === "Withdrawals" ? pendingWithdrawalsCount : 0;
                const showBadge = (item.badge === "pending" || item.name === "Withdrawals") && itemBadgeCount > 0;
                const isExpanded = expandedMenus.includes(item.name);
                const hasSubmenu = !!item.submenu;

                return (
                  <div key={`mobile-${item.name}`}>
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasSubmenu) {
                          e.preventDefault();
                          setExpandedMenus((prev) =>
                            prev.includes(item.name) ? prev.filter((n) => n !== item.name) : [...prev, item.name]
                          );
                        } else if (item.href !== pathname) {
                          setPendingHref(item.href);
                        }
                      }}
                      className={`group relative flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white shadow-md"
                          : "text-foreground/80 hover:bg-background/70 hover:text-foreground"
                      }`}
                    >
                      <Icon className="mt-0.5 h-4.5 w-4.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {showBadge && (
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                              {itemBadgeCount > 99 ? "99+" : itemBadgeCount}
                            </span>
                          )}
                          {hasSubmenu && (
                            <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          )}
                        </div>
                        <p className={`mt-0.5 text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>{item.description}</p>
                      </div>
                    </Link>

                    {hasSubmenu && isExpanded && (
                      <div className="ml-7 mt-1 space-y-1">
                        {item.submenu?.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={`mobile-${subItem.href}`}
                              href={subItem.href}
                              onClick={() => {
                                if (subItem.href !== pathname) {
                                  setPendingHref(subItem.href);
                                }
                              }}
                              className={`flex items-center rounded-lg px-3 py-1.5 text-sm transition-all ${
                                isSubActive
                                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-medium"
                                  : "text-foreground/65 hover:bg-background/60 hover:text-foreground"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 transition-all hover:bg-background/60 hover:text-foreground"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>User Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}

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
              const itemBadgeCount = item.name === "Payments" ? pendingCount : item.name === "KYC" ? pendingKycCount : item.name === "Withdrawals" ? pendingWithdrawalsCount : 0;
              const showBadge = (item.badge === "pending" || item.name === "Withdrawals") && itemBadgeCount > 0;
              const badgeCount = itemBadgeCount;
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
                            {showBadge && badgeCount > 0 && (
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
                    {collapsed && showBadge && badgeCount > 0 && (
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
