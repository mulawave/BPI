"use client";

import { useState } from "react";
import { HiDownload } from "react-icons/hi";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

interface ExportButtonProps {
  type: "users" | "payments" | "packages";
  filters?: any;
  label?: string;
}

export default function ExportButton({
  type,
  filters,
  label = "Export CSV",
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportUsers = api.admin.exportUsersToCSV.useQuery(
    { filters },
    { enabled: false },
  );

  const exportPayments = api.admin.exportPaymentsToCSV.useQuery(
    { filters },
    { enabled: false },
  );

  const exportPackages = api.admin.exportPackagesToCSV.useQuery(undefined, {
    enabled: false,
  });

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let result;

      if (type === "users") {
        result = await exportUsers.refetch();
      } else if (type === "payments") {
        result = await exportPayments.refetch();
      } else {
        result = await exportPackages.refetch();
      }

      if (result.data) {
        // Create blob and download
        const blob = new Blob([result.data.data], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", result.data.filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(
          `Exported ${result.data.count} ${type} to ${result.data.filename}`,
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <HiDownload
        className={`h-4 w-4 ${isExporting ? "animate-bounce" : ""}`}
      />
      <span>{isExporting ? "Exporting..." : label}</span>
    </button>
  );
}
