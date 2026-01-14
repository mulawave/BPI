"use client";

import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { MdTrendingUp, MdTrendingDown } from "react-icons/md";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: IconType;
  color: "blue" | "green" | "orange" | "purple" | "red";
  badge?: string;
}

const colorStyles = {
  blue: {
    bg: "from-blue-500 to-blue-600",
    light: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    shadow: "shadow-blue-500/20",
  },
  green: {
    bg: "from-green-500 to-green-600",
    light: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-600 dark:text-green-400",
    shadow: "shadow-green-500/20",
  },
  orange: {
    bg: "from-orange-500 to-orange-600",
    light: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-600 dark:text-orange-400",
    shadow: "shadow-orange-500/20",
  },
  purple: {
    bg: "from-purple-500 to-purple-600",
    light: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-400",
    shadow: "shadow-purple-500/20",
  },
  red: {
    bg: "from-red-500 to-red-600",
    light: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    shadow: "shadow-red-500/20",
  },
};

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  badge,
}: StatsCardProps) {
  const styles = colorStyles[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="premium-stat-card relative overflow-hidden rounded-2xl border border-border bg-card/75 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
    >
      {/* Gradient Background Accent */}
      <div
        className={`absolute right-0 top-0 h-full w-2 bg-gradient-to-b ${styles.bg}`}
      />

      {/* Icon */}
      <div className={`mb-4 inline-flex rounded-xl ${styles.light} p-3`}>
        <Icon className={`h-6 w-6 ${styles.text}`} />
      </div>

      {/* Content */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <div className="mt-2 flex items-baseline justify-between">
          <h3 className="text-3xl font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </h3>

          {/* Change Indicator or Badge */}
          {change !== undefined && (
            <div
              className={`flex items-center space-x-1 text-sm font-semibold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isPositive ? (
                <MdTrendingUp className="h-4 w-4" />
              ) : (
                <MdTrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}

          {badge && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Decorative blur */}
      <div
        className={`absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br ${styles.bg} opacity-10 blur-3xl`}
      />
    </motion.div>
  );
}
