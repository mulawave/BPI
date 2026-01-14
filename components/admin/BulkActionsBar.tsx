"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  HiCheckCircle,
  HiXCircle,
  HiTrash,
  HiMail,
  HiDownload,
  HiX,
} from "react-icons/hi";
import toast from "react-hot-toast";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "success" | "danger" | "warning" | "info";
    confirmMessage?: string;
  }[];
}

export default function BulkActionsBar({
  selectedCount,
  onClear,
  actions,
}: BulkActionsBarProps) {
  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-orange-600 hover:bg-orange-700 text-white";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      default:
        return "bg-slate-600 hover:bg-slate-700 text-white";
    }
  };

  const handleAction = (action: typeof actions[0]) => {
    if (action.confirmMessage) {
      const toastId = toast.custom(
        (t) => (
          <div className="w-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {action.confirmMessage}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  action.onClick();
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${getVariantStyles(action.variant)}`}
              >
                Confirm
              </button>
            </div>
          </div>
        ),
        { duration: 8000 },
      );
      if (!toastId) return;
      return;
    }
    action.onClick();
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {/* Selection Count */}
            <div className="flex items-center space-x-2 border-r border-slate-200 pr-4 dark:border-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                selected
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction(action)}
                    className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${getVariantStyles(action.variant)}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Clear Selection */}
            <button
              onClick={onClear}
              className="ml-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
