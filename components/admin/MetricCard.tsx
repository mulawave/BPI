"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: "blue" | "green" | "orange" | "purple" | "red";
  subtitle?: string;
}

const colorClasses = {
  blue: {
    gradient: "from-[hsl(var(--primary))] to-[hsl(var(--secondary))]",
    bg: "bg-[hsl(var(--accent))] dark:bg-[hsl(var(--secondary))]/10",
    text: "text-[hsl(var(--primary))] dark:text-[hsl(var(--secondary))]",
  },
  green: {
    gradient: "from-[hsl(var(--primary))] to-[hsl(var(--secondary))]",
    bg: "bg-[hsl(var(--muted))] dark:bg-[hsl(var(--primary))]/25",
    text: "text-[hsl(var(--primary))] dark:text-[hsl(var(--secondary))]",
  },
  orange: {
    gradient: "from-[hsl(var(--secondary))] to-[hsl(var(--primary))]",
    bg: "bg-[hsl(var(--secondary))]/15 dark:bg-[hsl(var(--secondary))]/15",
    text: "text-[hsl(var(--secondary))] dark:text-[hsl(var(--secondary))]",
  },
  purple: {
    gradient: "from-[hsl(var(--primary))] to-[hsl(var(--secondary))]",
    bg: "bg-[hsl(var(--accent))] dark:bg-[hsl(var(--primary))]/22",
    text: "text-[hsl(var(--primary))] dark:text-[hsl(var(--secondary))]",
  },
  red: {
    gradient: "from-red-500 to-rose-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
  },
};

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  subtitle,
}: MetricCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-stat-card overflow-hidden rounded-2xl border border-border bg-card/75 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
            {trend && (
              <p className={`mt-2 text-sm font-medium ${colors.text}`}>
                {trend}
              </p>
            )}
          </div>
          <div
            className={`rounded-2xl border border-border/60 p-3 ${colors.bg}`}
          >
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
        </div>
      </div>
      <div className={`h-1.5 bg-gradient-to-r ${colors.gradient}`} />
    </motion.div>
  );
}
