"use client";

import { motion } from "framer-motion";
import { HiExclamation, HiInformationCircle, HiCheckCircle, HiX } from "react-icons/hi";
import { useState } from "react";
import Link from "next/link";

interface Alert {
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  action?: string;
  priority: "high" | "medium" | "low";
}

interface DashboardAlertsProps {
  alerts: Alert[];
}

export default function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const handleDismiss = (index: number) => {
    setDismissed(new Set([...dismissed, index]));
  };

  const visibleAlerts = alerts.filter((_, index) => !dismissed.has(index));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getAlertStyles = (type: string, priority: string) => {
    const baseStyles = "border-l-4 ";
    const typeStyles = {
      warning: "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
      info: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
      success: "bg-green-50 dark:bg-green-900/20 border-green-500",
      error: "bg-red-50 dark:bg-red-900/20 border-red-500",
    };
    return baseStyles + typeStyles[type as keyof typeof typeStyles];
  };

  const getIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "warning":
        return <HiExclamation className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
      case "info":
        return <HiInformationCircle className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
      case "success":
        return <HiCheckCircle className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case "error":
        return <HiExclamation className={`${iconClass} text-red-600 dark:text-red-400`} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`${getAlertStyles(alert.type, alert.priority)} rounded-xl p-4 shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {alert.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {alert.message}
                </p>
                {alert.action && (
                  <Link
                    href={alert.action}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                  >
                    Take Action →
                  </Link>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDismiss(index)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ml-2"
            >
              <HiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
