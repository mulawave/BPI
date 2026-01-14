"use client";

import { motion } from "framer-motion";
import { MdPerson, MdPayment, MdSettings, MdNotifications } from "react-icons/md";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  entity: string;
  user?: { name: string };
  createdAt: Date;
  status?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ElementType> = {
  user: MdPerson,
  payment: MdPayment,
  settings: MdSettings,
  notification: MdNotifications,
};

const statusColors: Record<string, string> = {
  success: "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
  pending: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  failed: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm font-medium text-green-600 transition-colors hover:text-green-700 dark:text-green-400">
          View All
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No recent activity
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity, index) => {
            const Icon = activityIcons[activity.entity.toLowerCase()] || MdSettings;
            const statusColor = activity.status
              ? statusColors[activity.status.toLowerCase()] || statusColors.pending
              : "";

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-4 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {activity.user?.name || "System"} •{" "}
                    {formatDistanceToNow(new Date(activity.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Status Badge */}
                {activity.status && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
                  >
                    {activity.status}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
