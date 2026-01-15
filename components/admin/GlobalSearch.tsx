"use client";

import { useState, useEffect, useMemo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSearch, HiX, HiUser, HiCreditCard, HiCog } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { api } from "@/client/trpc";

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
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

  // Debounce query for search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isFetching, error } = api.admin.globalSearch.useQuery(
    { q: debounced || "", limit: 6 },
    { enabled: debounced.length >= 2 }
  );

  const hasSearch = debounced.length >= 2;

  const visibleItems = useMemo(() => {
    if (!hasSearch) {
      return filteredActions.map((action) => ({
        href: action.href,
        label: action.name,
      }));
    }
    const items: { href: string; label: string }[] = [];
    results?.users.forEach((u) => {
      items.push({
        href: `/admin/users?search=${encodeURIComponent(
          u.email || u.username || u.name || "",
        )}`,
        label: u.name || u.username || u.email || "User",
      });
    });
    results?.payments.forEach((p) => {
      items.push({
        href: `/admin/payments?search=${encodeURIComponent(p.reference || p.description || "")}`,
        label: p.reference || p.transactionType || "Payment",
      });
    });
    results?.packages.forEach((pkg) => {
      items.push({
        href: `/admin/packages?search=${encodeURIComponent(pkg.name)}`,
        label: pkg.name,
      });
    });
    return items;
  }, [filteredActions, hasSearch, results]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
    }
  }, [isOpen, debounced, results]);

  const totalItems = visibleItems.length;

  const handleArrowNavigation = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!totalItems) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalItems);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = visibleItems[activeIndex];
      if (item) handleSelect(item.href);
    }
  };

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
                      onKeyDown={handleArrowNavigation}
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
                  <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
                    {debounced.length < 2 ? (
                      filteredActions.length > 0 ? (
                        <div className="space-y-1">
                          {filteredActions.map((action, index) => {
                            const Icon = action.icon;
                            const isActive = activeIndex === index;
                            return (
                              <motion.button
                                key={action.href}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => handleSelect(action.href)}
                                className={`group flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                  isActive ? "ring-2 ring-[hsl(var(--primary))]/70" : ""
                                }`}
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
                            No quick actions available
                          </p>
                        </div>
                      )
                    ) : isFetching ? (
                      <div className="flex justify-center py-10">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[hsl(var(--primary))]" />
                      </div>
                    ) : error ? (
                      <div className="py-12 text-center text-sm text-red-500">
                        Search failed. Please try again.
                      </div>
                    ) : results && (results.users.length + results.payments.length + results.packages.length > 0) ? (
                      <div className="space-y-4">
                        {results.users.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase text-slate-500">Users</div>
                            <div className="space-y-1">
                              {results.users.map((u, idx) => {
                                const currentIndex = idx;
                                const isActive = activeIndex === currentIndex;
                                return (
                                  <button
                                    key={u.id}
                                    onClick={() => handleSelect(`/admin/users?search=${encodeURIComponent(u.email || u.username || u.name || "")}`)}
                                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                      isActive ? "ring-2 ring-[hsl(var(--primary))]/70" : ""
                                    }`}
                                  >
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                      <HiUser className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 dark:text-white">{u.name || u.username || "Unnamed"}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.email || "No email"}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {u.role}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {results.payments.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase text-slate-500">Payments</div>
                            <div className="space-y-1">
                              {results.payments.map((p, idx) => {
                                const currentIndex = (results.users?.length || 0) + idx;
                                const isActive = activeIndex === currentIndex;
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => handleSelect(`/admin/payments?search=${encodeURIComponent(p.reference || p.description || "")}`)}
                                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                      isActive ? "ring-2 ring-[hsl(var(--primary))]/70" : ""
                                    }`}
                                  >
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                      <HiCreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 dark:text-white">{p.reference || p.transactionType || "Payment"}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.User?.name || p.User?.email || "No user"}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {p.status}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {results.packages.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase text-slate-500">Packages</div>
                            <div className="space-y-1">
                              {results.packages.map((pkg, idx) => {
                                const currentIndex = (results.users?.length || 0) + (results.payments?.length || 0) + idx;
                                const isActive = activeIndex === currentIndex;
                                return (
                                  <button
                                    key={pkg.id}
                                    onClick={() => handleSelect(`/admin/packages?search=${encodeURIComponent(pkg.name)}`)}
                                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                      isActive ? "ring-2 ring-[hsl(var(--primary))]/70" : ""
                                    }`}
                                  >
                                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                                      <HiCog className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-slate-900 dark:text-white">{pkg.name}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{pkg.isActive ? "Active" : "Inactive"}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      ₦{(pkg.price || 0).toLocaleString()}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">No results for "{query}"</p>
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
