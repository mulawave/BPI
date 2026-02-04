"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdVisibility,
  MdToggleOn,
  MdToggleOff,
  MdPeople,
  MdAttachMoney,
  MdRefresh,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDelete,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PackageDetailsModal from "@/components/admin/PackageDetailsModal";
import PackageEditModal from "@/components/admin/PackageEditModal";
import PackageCreateModal from "@/components/admin/PackageCreateModal";
import PackageAnalytics from "@/components/admin/PackageAnalytics";
import ExportButton from "@/components/admin/ExportButton";
import StatsCard from "@/components/admin/StatsCard";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type Package = {
  id: string;
  name: string;
  price: number;
  vat: number;
  packageType: string;
  isActive: boolean;
  hasRenewal: boolean;
  renewalFee: number | null;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
  activeSubscriptions: number;
  totalRevenue: number;
};

export default function PackagesPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [confirmState, setConfirmState] = useState<null | {
    title: string;
    description: string;
    confirmText?: string;
    onConfirm: () => void;
  }>(null);

  const { data: packages, isLoading, refetch } = api.admin.getPackages.useQuery({
    isActive: activeFilter,
    search: search || undefined,
  });

  const toggleStatusMutation = api.admin.togglePackageStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(`Package ${updated.isActive ? "activated" : "deactivated"} successfully`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const bulkUpdateMutation = api.admin.bulkUpdatePackages.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully ${result.action} ${result.count} package(s)`);
      setSelectedIds([]);
      setBulkMode(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Bulk operation failed");
    },
  });

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPackages?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPackages?.map((p) => p.id) || []);
    }
  };

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    if (selectedIds.length === 0) {
      toast.error("No packages selected");
      return;
    }

    const confirmMessage =
      action === "delete"
        ? `Are you sure you want to DELETE ${selectedIds.length} package(s)? This action cannot be undone!`
        : `Are you sure you want to ${action} ${selectedIds.length} package(s)?`;

    setConfirmState({
      title: action === "delete" ? "Delete selected packages?" : "Confirm bulk update",
      description: confirmMessage,
      confirmText: action === "delete" ? "Yes, delete" : `Yes, ${action}`,
      onConfirm: () => bulkUpdateMutation.mutate({ packageIds: selectedIds, action }),
    });
  };

  const handleToggleStatus = (pkg: Package) => {
    if (!pkg.isActive) {
      toggleStatusMutation.mutate({
        packageId: pkg.id,
        isActive: true,
      });
      return;
    }

    setConfirmState({
      title: "Deactivate package?",
      description: `Are you sure you want to deactivate "${pkg.name}"? Users with this package will keep their membership, but new activations will be blocked.`,
      confirmText: "Yes, deactivate",
      onConfirm: () =>
        toggleStatusMutation.mutate({
          packageId: pkg.id,
          isActive: false,
        }),
    });
  };

  const filteredPackages = packages?.filter((pkg) =>
    search ? pkg.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const totalPackages = filteredPackages?.length || 0;
  const activePackages = filteredPackages?.filter((p) => p.isActive).length || 0;
  const totalSubscribers =
    filteredPackages?.reduce((sum, p) => sum + (p.activeSubscriptions || 0), 0) || 0;
  const totalRevenueM =
    (filteredPackages?.reduce((sum, p) => sum + (p.totalRevenue || 0), 0) || 0) / 1000000;
  const activeFiltersCount = (search ? 1 : 0) + (activeFilter !== undefined ? 1 : 0);

  return (
    <div className="min-h-screen pb-12">
      <ConfirmDialog
        isOpen={!!confirmState}
        title={confirmState?.title || "Confirm"}
        description={confirmState?.description}
        confirmText={confirmState?.confirmText || "Confirm"}
        cancelText="Cancel"
        onClose={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
      />
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl dark:opacity-5" />
        <div className="absolute bottom-0 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl dark:opacity-5" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-8 shadow-xl shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
        >
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] shadow-lg shadow-black/10"
              >
                <MdAttachMoney className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="premium-gradient-text text-4xl font-bold">
                  Membership Packages
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                  Manage membership packages, pricing, and features
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton type="packages" label="Export Packages" />
              {packages && (
                <div className="px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl shadow-sm">
                  <span className="text-sm font-semibold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent">
                    {packages.filter((p) => p.isActive).length} active package
                    {packages.filter((p) => p.isActive).length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBulkMode(!bulkMode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg ${
                  bulkMode
                    ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white"
                    : "border-2 border-border bg-background/40 text-foreground/80 hover:bg-background"
                }`}
              >
                {bulkMode ? <MdCheckBox size={20} /> : <MdCheckBoxOutlineBlank size={20} />}
                <span>Bulk Mode</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="premium-button flex items-center gap-2 px-5 py-2.5 text-white rounded-xl shadow-lg font-semibold"
              >
                <MdAdd size={20} />
                <span>New Package</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Packages" value={totalPackages} icon={MdAttachMoney} color="green" />
          <StatsCard title="Active" value={activePackages} icon={MdCheckCircle} color="orange" />
          <StatsCard title="Subscribers" value={totalSubscribers} icon={MdPeople} color="blue" />
          <StatsCard title="Revenue" value={`₦${totalRevenueM.toFixed(1)}M`} icon={MdAttachMoney} color="purple" badge={activeFiltersCount > 0 ? "Filtered" : undefined} />
        </div>

        {/* Bulk Action Bar */}
        {bulkMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[hsl(var(--secondary))]/10 border border-[hsl(var(--secondary))]/25 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]/15 rounded-lg transition-colors"
                >
                  {selectedIds.length === filteredPackages?.length && filteredPackages.length > 0 ? (
                    <>
                      <MdCheckBox size={18} />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <MdCheckBoxOutlineBlank size={18} />
                      <span>Select All</span>
                    </>
                  )}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedIds.length} selected
                </span>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("activate")}
                    disabled={bulkUpdateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <MdCheckCircle size={18} />
                    <span>Activate</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("deactivate")}
                    disabled={bulkUpdateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <MdCancel size={18} />
                    <span>Deactivate</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    disabled={bulkUpdateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <MdDelete size={18} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <div className="rounded-2xl border border-border bg-card/75 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages..."
                className="w-full rounded-xl border-2 border-border bg-background/50 py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--secondary))]/20 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={activeFilter === undefined ? "" : String(activeFilter)}
              onChange={(e) =>
                setActiveFilter(e.target.value === "" ? undefined : e.target.value === "true")
              }
              className="rounded-xl border-2 border-border bg-background/50 px-4 py-3 text-foreground"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border-2 border-border bg-background/40 px-5 py-3 font-medium text-foreground/80 transition-all hover:bg-background hover:text-foreground"
            >
              <MdRefresh size={20} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPackages && filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-card/75 rounded-xl border-2 overflow-hidden backdrop-blur-sm ${
                  pkg.isActive
                    ? "border-[hsl(var(--primary))]/25"
                    : "border-border opacity-75"
                }`}
              >
                {/* Header */}
                <div
                  className={`p-6 ${
                    pkg.isActive
                      ? "bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--secondary))]/12 dark:from-[hsl(var(--primary))]/12 dark:to-[hsl(var(--secondary))]/10"
                      : "bg-[hsl(var(--muted))]/35"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {bulkMode && (
                        <button
                          onClick={() => handleToggleSelection(pkg.id)}
                          className="mt-1 p-1 hover:bg-background/50 rounded transition-colors"
                        >
                          {selectedIds.includes(pkg.id) ? (
                            <MdCheckBox size={24} className="text-[hsl(var(--primary))]" />
                          ) : (
                            <MdCheckBoxOutlineBlank size={24} className="text-gray-400" />
                          )}
                        </button>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {pkg.name}
                        </h3>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {pkg.packageType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(pkg)}
                        className={`p-2 rounded-lg transition-colors ${
                          pkg.isActive
                            ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                            : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {pkg.isActive ? <MdToggleOn size={24} /> : <MdToggleOff size={24} />}
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₦{pkg.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        + ₦{pkg.vat.toLocaleString()} VAT
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total: ₦{(pkg.price + pkg.vat).toLocaleString()}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/60 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <MdPeople className="text-[hsl(var(--primary))]" size={16} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Subscribers
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pkg.activeSubscriptions}
                      </div>
                    </div>

                    <div className="bg-background/60 rounded-lg p-3 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <MdAttachMoney className="text-green-600" size={16} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₦{(pkg.totalRevenue / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="p-6 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Features
                    </h4>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {pkg.features.length} total
                    </span>
                  </div>
                  <div className="space-y-1">
                    {pkg.features.slice(0, 3).map((feature: string, i: number) => (
                      <div key={i} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        • {feature}
                      </div>
                    ))}
                    {pkg.features.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{pkg.features.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-[hsl(var(--muted))]/35 border-t border-border flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowAnalytics(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/30 rounded-lg hover:bg-[hsl(var(--primary))]/10 transition-colors"
                  >
                    <MdRefresh size={18} />
                    <span>Analytics</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <MdVisibility size={18} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowEditModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MdEdit size={18} />
                    <span>Edit</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSearch size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No packages found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Modals */}
        {selectedPackage && (
          <>
            <PackageDetailsModal
              packageId={selectedPackage.id}
              isOpen={showDetailsModal}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedPackage(null);
              }}
              onEdit={() => {
                setShowDetailsModal(false);
                setShowEditModal(true);
              }}
            />
            <PackageEditModal
              packageId={selectedPackage.id}
              isOpen={showEditModal}
              onClose={() => {
                refetch();
                setShowEditModal(false);
                setSelectedPackage(null);
              }}
            />
          </>
        )}
        
        {/* Create Modal */}
        <PackageCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />

        {/* Analytics Modal */}
        {selectedPackage && (
          <PackageAnalytics
            packageId={selectedPackage.id}
            isOpen={showAnalytics}
            onClose={() => {
              setShowAnalytics(false);
              setSelectedPackage(null);
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
