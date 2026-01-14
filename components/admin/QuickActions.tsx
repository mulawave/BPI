"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdCheckCircle,
  MdPeople,
  MdSettings,
  MdAssessment,
  MdChevronRight,
  MdCardGiftcard,
  MdCampaign,
  MdBarChart,
  MdSecurity,
} from "react-icons/md";

interface QuickActionsProps {
  pendingCount: number;
}

const actions = [
  {
    name: "Review Payments",
    href: "/admin/payments",
    icon: MdCheckCircle,
    color: "orange",
    hasBadge: true,
    description: "Approve pending transactions",
  },
  {
    name: "Manage Users",
    href: "/admin/users",
    icon: MdPeople,
    color: "blue",
    description: "View and edit user accounts",
  },
  {
    name: "View Reports",
    href: "/admin/reports",
    icon: MdAssessment,
    color: "purple",
    description: "Access analytics and insights",
  },
  {
    name: "Membership Packages",
    href: "/admin/packages",
    icon: MdCardGiftcard,
    color: "emerald",
    description: "Configure membership tiers",
  },
  {
    name: "Community Updates",
    href: "/admin/community",
    icon: MdCampaign,
    color: "indigo",
    description: "Post updates and deals",
  },
  {
    name: "Analytics Dashboard",
    href: "/admin/analytics",
    icon: MdBarChart,
    color: "violet",
    description: "View detailed charts",
  },
  {
    name: "Audit Logs",
    href: "/admin/audit",
    icon: MdSecurity,
    color: "rose",
    description: "Review system activity",
  },
  {
    name: "System Settings",
    href: "/admin/settings",
    icon: MdSettings,
    color: "green",
    description: "Configure application",
  },
];

const colorStyles = {
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-600 dark:text-orange-400",
    hover: "hover:bg-orange-200 dark:hover:bg-orange-900/40",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    hover: "hover:bg-blue-200 dark:hover:bg-blue-900/40",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-400",
    hover: "hover:bg-purple-200 dark:hover:bg-purple-900/40",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-950/30",
    text: "text-green-600 dark:text-green-400",
    hover: "hover:bg-green-200 dark:hover:bg-green-900/40",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:bg-emerald-200 dark:hover:bg-emerald-900/40",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-950/30",
    text: "text-indigo-600 dark:text-indigo-400",
    hover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/40",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-950/30",
    text: "text-violet-600 dark:text-violet-400",
    hover: "hover:bg-violet-200 dark:hover:bg-violet-900/40",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-950/30",
    text: "text-rose-600 dark:text-rose-400",
    hover: "hover:bg-rose-200 dark:hover:bg-rose-900/40",
  },
};

export default function QuickActions({ pendingCount }: QuickActionsProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
        Quick Actions
      </h3>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const styles = colorStyles[action.color as keyof typeof colorStyles];

          return (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={action.href}
                className={`group flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-all hover:scale-[1.01] hover:shadow-md dark:border-slate-800 ${styles.hover}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`rounded-lg p-2 ${styles.bg}`}>
                    <Icon className={`h-5 w-5 ${styles.text}`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {action.name}
                    </p>
                    {action.hasBadge && pendingCount > 0 ? (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        {pendingCount} pending
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {action.description}
                      </p>
                    )}
                  </div>
                </div>
                <MdChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Help Section */}
      <div className="mt-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:from-green-950/20 dark:to-emerald-950/20">
        <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
          Need Help?
        </h4>
        <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
          Access documentation and support resources
        </p>
        <Link
          href="/admin/help"
          className="inline-flex items-center text-xs font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
        >
          View Documentation
          <MdChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
