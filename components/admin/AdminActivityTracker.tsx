"use client";

import { motion } from "framer-motion";
import { HiClock, HiUser, HiCog } from "react-icons/hi";
import { format } from "date-fns";
import { api } from "@/client/trpc";

interface ActivityItem {
  id: string;
  admin: string;
  action: string;
  target: string;
  timestamp: Date;
  status: "success" | "error" | "warning";
}

export default function AdminActivityTracker() {
  const { data: activities, isLoading } = api.admin.getAuditLogs.useQuery({
    limit: 20,
  });

  const getActivityIcon = (action: string) => {
    if (action.includes("USER")) return HiUser;
    if (action.includes("SETTING")) return HiCog;
    return HiClock;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Admin Activity Log
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Last 20 actions
        </span>
      </div>

      <div className="space-y-3">
        {activities && activities.logs && activities.logs.length > 0 ? (
          activities.logs.map((activity: any, index: number) => {
            const Icon = getActivityIcon(activity.action);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {activity.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {activity.entity} • {activity.entityId}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>By: {activity.userId}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(activity.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <p className="py-8 text-center text-slate-500 dark:text-slate-400">
            No recent activity
          </p>
        )}
      </div>
    </div>
  );
}
