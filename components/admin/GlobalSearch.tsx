"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSearch, HiX, HiUser, HiCreditCard, HiCog } from "react-icons/hi";
import { useRouter } from "next/navigation";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Open search with Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Quick actions for empty search
  const quickActions = [
    {
      name: "Review Payments",
      icon: HiCreditCard,
      href: "/admin/payments",
      category: "Actions",
    },
    {
      name: "Manage Users",
      icon: HiUser,
      href: "/admin/users",
      category: "Actions",
    },
    {
      name: "System Settings",
      icon: HiCog,
      href: "/admin/settings",
      category: "Settings",
    },
  ];

  // Search results (mock for now - can be replaced with real search)
  const filteredActions = query
    ? quickActions.filter((action) =>
        action.name.toLowerCase().includes(query.toLowerCase()),
      )
    : quickActions;

  const handleSelect = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-600 backdrop-blur-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <HiSearch className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-2 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-800">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Search Panel */}
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-[10vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="relative w-full max-w-2xl"
              >
                <div className="mx-4 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                  {/* Search Input */}
                  <div className="flex items-center border-b border-slate-200 p-4 dark:border-slate-800">
                    <HiSearch className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search admin panel..."
                      className="ml-3 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                      autoFocus
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <HiX className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Results */}
                  <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredActions.length > 0 ? (
                      <div className="space-y-1">
                        {filteredActions.map((action, index) => {
                          const Icon = action.icon;
                          return (
                            <motion.button
                              key={action.href}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => handleSelect(action.href)}
                              className="group flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {action.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {action.category}
                                </p>
                              </div>
                              <kbd className="hidden rounded border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-600 group-hover:block dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                ↵
                              </kbd>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                          No results found for "{query}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 dark:border-slate-600 dark:bg-slate-800">
                          ↑
                        </kbd>
                        <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 dark:border-slate-600 dark:bg-slate-800">
                          ↓
                        </kbd>
                        <span className="ml-1">to navigate</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 dark:border-slate-600 dark:bg-slate-800">
                          ↵
                        </kbd>
                        <span className="ml-1">to select</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 dark:border-slate-600 dark:bg-slate-800">
                        esc
                      </kbd>
                      <span className="ml-1">to close</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
