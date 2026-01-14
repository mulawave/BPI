"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiFilter, HiX, HiCheck } from "react-icons/hi";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  name: string;
  label: string;
  type: "select" | "date" | "text" | "number";
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  onApply: (filters: Record<string, any>) => void;
  onClear: () => void;
}

export default function AdvancedFilters({
  fields,
  onApply,
  onClear,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleChange = (name: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = () => {
    const activeFilters = Object.entries(filters).filter(
      ([_, value]) => value !== "" && value !== undefined && value !== null,
    );
    setActiveFiltersCount(activeFilters.length);
    onApply(
      Object.fromEntries(activeFilters.map(([key, value]) => [key, value])),
    );
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setFilters({});
    setActiveFiltersCount(0);
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        <HiFilter className="h-4 w-4" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Advanced Filters
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Fields */}
              <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {field.label}
                    </label>

                    {field.type === "select" && field.options && (
                      <select
                        value={filters[field.name] || ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">All</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "date" && (
                      <input
                        type="date"
                        value={filters[field.name] || ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    )}

                    {(field.type === "text" || field.type === "number") && (
                      <input
                        type={field.type}
                        value={filters[field.name] || ""}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-700">
                <button
                  onClick={handleClearAll}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApply}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <HiCheck className="h-4 w-4" />
                  <span>Apply Filters</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
