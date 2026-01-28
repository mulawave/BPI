"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  MdClose,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdAccountBalanceWallet,
  MdVerified,
  MdCancel,
  MdEvent,
  MdGroup,
  MdStar,
  MdEdit,
  MdHistory,
  MdTrendingUp,
  MdLink,
  MdCardMembership,
  MdCalendarToday,
  MdSwapHoriz,
  MdArrowUpward,
  MdArrowDownward,
  MdAdd,
  MdRefresh,
} from "react-icons/md";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AssignMembershipModal from "./AssignMembershipModal";
import ExtendMembershipModal from "./ExtendMembershipModal";
import SwapSponsorModal from "./SwapSponsorModal";
import toast from "react-hot-toast";

const walletLabelMap: Record<string, string> = {
  wallet: "Main Wallet",
  spendable: "Spendable",
  palliative: "Palliative",
  cashback: "Cashback",
  studentCashback: "Student Cashback",
  community: "Community",
  shareholder: "Shareholder",
  shelter: "Shelter",
  shelterWallet: "Shelter (Legacy)",
  education: "Education",
  car: "Car",
  business: "Business",
  solar: "Solar",
  legals: "Legals",
  land: "Land",
  meal: "Meal",
  health: "Health",
  security: "Security",
  socialMedia: "Social Media",
  empowermentSponsorReward: "Empowerment Sponsor Reward",
  retirement: "Retirement",
  travelTour: "Travel & Tour",
  bpiTokenWallet: "BPI Token",
};

const formatWalletValue = (key: string, value: number) =>
  key === "bpiTokenWallet"
    ? `${value.toLocaleString()} BPT`
    : `₦${value.toLocaleString()}`;

interface UserDetailsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (userId: string) => void;
}

export default function UserDetailsModal({
  userId,
  isOpen,
  onClose,
  onEdit,
}: UserDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "network">(
    "overview"
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showSwapSponsorModal, setShowSwapSponsorModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletInputs, setWalletInputs] = useState<Record<string, string>>({});
  const [walletRemarks, setWalletRemarks] = useState<Record<string, string>>({});
  const [selectedWalletKey, setSelectedWalletKey] = useState<string>("wallet");
  const [addAmount, setAddAmount] = useState<string>("");
  const [addRemark, setAddRemark] = useState<string>("");
  const [addingWallet, setAddingWallet] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading, isFetching, refetch } = api.admin.getUserById.useQuery(
    { userId },
    {
      enabled: isOpen && !!userId,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: isOpen ? 8000 : false,
    }
  );

  const displayName =
    user
      ? [user.firstname, user.lastname].filter(Boolean).join(" ") ||
        user.name ||
        user.username ||
        user.email ||
        "User"
      : "Loading...";

  const avatarUrl = user?.image || user?.profilePic;
  const isEmailVerified = Boolean(user?.emailVerified);
  const isKycVerified = Boolean(user?.verified);

  const networkStats = (user as any)?.networkStats as
    | { level1?: number; level2?: number; level3?: number; level4?: number }
    | undefined;
  const level1Network = networkStats?.level1 ?? user?.level1Count ?? 0;
  const level2Network = networkStats?.level2 ?? user?.level2Count ?? 0;
  const level3Network = networkStats?.level3 ?? user?.level3Count ?? 0;
  const level4Network = networkStats?.level4 ?? user?.level4Count ?? 0;

  const walletEntries = useMemo(() => {
    if (!user) return [];
    const wallets = (user as any)?.wallets ?? {};

    return Object.entries(walletLabelMap).map(([key, label]) => {
      const rawValue = (wallets as Record<string, number>)[key] ?? (user as any)[key] ?? 0;
      const value = Number(rawValue) || 0;
      return { key, label, value };
    });
  }, [user]);

  const visibleWallets = useMemo(
    () => walletEntries.filter((wallet) => Math.abs(wallet.value) > 0),
    [walletEntries]
  );

  const walletOptions = useMemo(
    () => Object.entries(walletLabelMap).map(([key, label]) => ({ key, label })),
    []
  );

  const adjustWalletMutation = api.admin.adjustUserWallet.useMutation({
    onError: (error) => toast.error(error.message),
  });

  const addWalletMutation = api.admin.addUserWallet.useMutation({
    onError: (error) => toast.error(error.message),
  });

  if (!mounted || !isOpen) return null;

  const handleAdjust = async (
    walletKey: string,
    direction: "credit" | "debit",
    remark?: string
  ) => {
    const amountInput = walletInputs[walletKey] ?? "";
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const entry = walletEntries.find((w) => w.key === walletKey);
    if (!entry) {
      toast.error("Wallet not found");
      return;
    }

    const delta = direction === "credit" ? amount : -amount;
    const newBalance = entry.value + delta;

    setEditingWallet(walletKey);
    try {
      await adjustWalletMutation.mutateAsync({
        userId,
        walletKey: walletKey as any,
        newBalance,
        remark: remark?.trim() || undefined,
      });
      toast.success(delta >= 0 ? "Wallet credited" : "Wallet debited");
      setWalletInputs((prev) => ({ ...prev, [walletKey]: "" }));
      await refetch();
    } finally {
      setEditingWallet(null);
    }
  };

  const handleAddWallet = async () => {
    const amount = Number(addAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setAddingWallet(true);
    try {
      await addWalletMutation.mutateAsync({
        userId,
        walletKey: selectedWalletKey as any,
        amount,
        remark: addRemark.trim() || undefined,
      });
      toast.success("Wallet updated");
      setAddAmount("");
      setAddRemark("");
      await refetch();
    } finally {
      setAddingWallet(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          >
            <div className="bg-white/95 dark:bg-green-900/30/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full h-[94vh] max-w-none overflow-hidden flex flex-col border border-white/20 dark:border-gray-800">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{displayName?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium"
                    title="Assign Membership Package"
                  >
                    <MdCardMembership size={20} />
                    <span>Assign Package</span>
                  </button>
                  {user?.activeMembershipPackageId && (
                    <button
                      onClick={() => setShowExtendModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors font-medium"
                      title="Extend Membership Expiration"
                    >
                      <MdCalendarToday size={20} />
                      <span>Extend</span>
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(userId)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MdEdit size={24} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 border-b border-gray-200 dark:border-gray-700 flex gap-4">
                {[
                  { id: "overview", label: "Overview", icon: MdPerson },
                  { id: "activity", label: "Activity", icon: MdHistory },
                  { id: "network", label: "Referrals", icon: MdGroup },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-green-600 text-green-600"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <tab.icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {activeTab === "overview" && user && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Basic Info */}
                          <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Basic Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <InfoItem
                                icon={MdPerson}
                                label="Full Name"
                                value={displayName}
                              />
                              <InfoItem
                                icon={MdPerson}
                                label="Username"
                                value={user.username || "N/A"}
                              />
                              <InfoItem
                                icon={MdEmail}
                                label="Email"
                                value={user.email || "N/A"}
                              />
                              <InfoItem
                                icon={MdPhone}
                                label="Mobile"
                                value={user.mobile || "N/A"}
                              />
                              <InfoItem
                                icon={MdLink}
                                label="Referral Link"
                                value={user.referralLink || "N/A"}
                              />
                              <InfoItem
                                icon={MdLocationOn}
                                label="Location"
                                value={
                                  user.cityRelation?.name || user.stateRelation?.name || user.countryRelation?.name
                                    ? [
                                        user.cityRelation?.name,
                                        user.stateRelation?.name,
                                        user.countryRelation?.name,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")
                                    : "N/A"
                                }
                              />
                              <InfoItem
                                icon={MdEvent}
                                label="Joined"
                                value={format(new Date(user.createdAt), "MMM d, yyyy")}
                              />
                              <InfoItem
                                icon={MdEvent}
                                label="Last Login"
                                value={format(new Date(user.lastLogin), "MMM d, yyyy HH:mm")}
                              />
                            </div>
                          </div>

                          {/* Account Status */}
                          <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Account Status
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <StatusBadge
                                icon={user.activated ? MdVerified : MdCancel}
                                label="Activation"
                                value={user.activated ? "Active" : "Inactive"}
                                active={user.activated}
                              />
                              <StatusBadge
                                icon={isEmailVerified ? MdVerified : MdCancel}
                                label="Email Verified"
                                value={isEmailVerified ? "Verified" : "Unverified"}
                                active={isEmailVerified}
                              />
                              <StatusBadge
                                icon={isKycVerified ? MdVerified : MdCancel}
                                label="KYC Verified"
                                value={isKycVerified ? "Verified" : "Unverified"}
                                active={isKycVerified}
                              />
                              <InfoItem
                                icon={MdStar}
                                label="Rank"
                                value={user.rank}
                              />
                              <InfoItem
                                icon={MdPerson}
                                label="Role"
                                value={user.role.replace("_", " ").toUpperCase()}
                              />
                            </div>
                          </div>

                          {/* Membership */}
                          {user.activeMembershipPackageId && (
                            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Membership
                              </h3>
                              <div className="space-y-4">
                                <InfoItem
                                  icon={MdCardMembership}
                                  label="Plan"
                                  value={
                                    (user as any).MembershipPackage?.name || "Unknown Package"
                                  }
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <InfoItem
                                    icon={MdEvent}
                                    label="Activated"
                                    value={
                                      user.membershipActivatedAt
                                        ? format(
                                            new Date(user.membershipActivatedAt),
                                            "MMM d, yyyy"
                                          )
                                        : "N/A"
                                    }
                                  />
                                  <InfoItem
                                    icon={MdEvent}
                                    label="Expires"
                                    value={
                                      user.membershipExpiresAt
                                        ? format(
                                            new Date(user.membershipExpiresAt),
                                            "MMM d, yyyy"
                                          )
                                        : "N/A"
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Wallets & Stats */}
                        <div className="space-y-6">
                          {/* Wallets */}
                          <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                                  <MdAccountBalanceWallet size={22} />
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-white/70">Wallets</p>
                                  <p className="text-2xl font-bold leading-tight">
                                    {visibleWallets.length > 0
                                      ? `${visibleWallets.length} active`
                                      : "No active balances"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => refetch()}
                                disabled={isFetching || isLoading}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition disabled:opacity-60"
                              >
                                <MdRefresh
                                  size={18}
                                  className={isFetching ? "animate-spin" : ""}
                                />
                                <span className="text-sm font-semibold">Refresh</span>
                              </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 max-h-[380px] min-h-[200px]">
                              {visibleWallets.length > 0 ? (
                                visibleWallets.map((wallet) => (
                                  <div
                                    key={wallet.key}
                                    className="rounded-xl bg-white/10 border border-white/20 p-4 flex flex-col gap-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs uppercase tracking-wide text-white/70">
                                          {wallet.label}
                                        </p>
                                        <p className="text-xl font-bold leading-tight">
                                          {formatWalletValue(wallet.key, wallet.value)}
                                        </p>
                                      </div>
                                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] uppercase tracking-wide text-white/80">
                                        {wallet.key}
                                      </span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
                                        placeholder="Amount"
                                        value={walletInputs[wallet.key] ?? ""}
                                        onChange={(e) =>
                                          setWalletInputs((prev) => ({
                                            ...prev,
                                            [wallet.key]: e.target.value,
                                          }))
                                        }
                                      />
                                      <input
                                        type="text"
                                        className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
                                        placeholder="Optional remark"
                                        value={walletRemarks[wallet.key] ?? ""}
                                        onChange={(e) =>
                                          setWalletRemarks((prev) => ({
                                            ...prev,
                                            [wallet.key]: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() =>
                                          handleAdjust(
                                            wallet.key,
                                            "credit",
                                            walletRemarks[wallet.key]
                                          )
                                        }
                                        disabled={editingWallet === wallet.key || adjustWalletMutation.isPending}
                                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-green-700 font-semibold hover:bg-green-50 transition disabled:opacity-60"
                                      >
                                        {editingWallet === wallet.key ? (
                                          <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <MdArrowUpward size={18} />
                                        )}
                                        <span>Credit</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleAdjust(
                                            wallet.key,
                                            "debit",
                                            walletRemarks[wallet.key]
                                          )
                                        }
                                        disabled={editingWallet === wallet.key || adjustWalletMutation.isPending}
                                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition disabled:opacity-60"
                                      >
                                        {editingWallet === wallet.key ? (
                                          <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <MdArrowDownward size={18} />
                                        )}
                                        <span>Debit</span>
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 flex flex-col items-center justify-center gap-2 py-10 rounded-xl bg-white/5 border border-white/10 text-white/80">
                                  <MdAccountBalanceWallet size={28} />
                                  <p className="font-semibold">No wallet balances yet</p>
                                  <p className="text-sm text-white/70">
                                    Add a balance below to initialize a wallet.
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-3">
                                Add Wallet Balance
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  value={selectedWalletKey}
                                  onChange={(e) => setSelectedWalletKey(e.target.value)}
                                  className="w-full sm:w-48 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                                >
                                  {walletOptions.map((option) => (
                                    <option key={option.key} value={option.key} className="text-gray-900">
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  placeholder="Amount"
                                  value={addAmount}
                                  onChange={(e) => setAddAmount(e.target.value)}
                                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                <input
                                  type="text"
                                  placeholder="Optional remark"
                                  value={addRemark}
                                  onChange={(e) => setAddRemark(e.target.value)}
                                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
                                />
                                <button
                                  onClick={handleAddWallet}
                                  disabled={addingWallet || addWalletMutation.isPending}
                                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition disabled:opacity-60"
                                >
                                  {addingWallet ? (
                                    <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <MdAdd size={18} />
                                  )}
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Network Stats */}
                          <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Network
                            </h3>
                            <div className="space-y-3">
                              <NetworkStat
                                label="Level 1"
                                value={level1Network}
                              />
                              <NetworkStat
                                label="Level 2"
                                value={level2Network}
                              />
                              <NetworkStat
                                label="Level 3"
                                value={level3Network}
                              />
                              <NetworkStat
                                label="Level 4"
                                value={level4Network}
                              />
                              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <NetworkStat
                                  label="Total Network"
                                  value={
                                    level1Network +
                                    level2Network +
                                    level3Network +
                                    level4Network
                                  }
                                  highlighted
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "activity" && user && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Recent Activity
                        </h3>
                        {(user as any).AuditLog && (user as any).AuditLog.length > 0 ? (
                          (user as any).AuditLog.map((log: any, idx: number) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl"
                            >
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <MdHistory className="text-green-600" size={20} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {log.action}
                                  </h4>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(log.createdAt), "MMM d, HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {log.entity} - {log.status}
                                </p>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No activity recorded
                          </p>
                        )}
                      </div>
                    )}

                    {activeTab === "network" && user && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Referrals
                          </h3>
                          <button
                            onClick={() => setShowSwapSponsorModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-colors font-medium"
                          >
                            <MdSwapHoriz size={20} />
                            <span>Swap Sponsor</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              Referred By (Sponsor)
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {(user as any).SponsorUser || (user as any).ReferredByUser
                                ? ([
                                    [
                                      ((user as any).SponsorUser || (user as any).ReferredByUser).firstname,
                                      ((user as any).SponsorUser || (user as any).ReferredByUser).lastname,
                                    ]
                                      .filter(Boolean)
                                      .join(" "),
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).name,
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).username,
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).email,
                                  ].filter(Boolean)[0] as string)
                                : user.sponsorId || user.referredBy
                                  ? "Linked (details unavailable)"
                                  : "None"}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              Sponsor (Same as Referred By)
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {(user as any).SponsorUser || (user as any).ReferredByUser
                                ? ([
                                    [
                                      ((user as any).SponsorUser || (user as any).ReferredByUser).firstname,
                                      ((user as any).SponsorUser || (user as any).ReferredByUser).lastname,
                                    ]
                                      .filter(Boolean)
                                      .join(" "),
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).name,
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).username,
                                    ((user as any).SponsorUser || (user as any).ReferredByUser).email,
                                  ].filter(Boolean)[0] as string)
                                : user.sponsorId || user.referredBy
                                  ? "Linked (details unavailable)"
                                  : "None"}
                            </p>
                          </div>
                        </div>
                        {(user as any).ReferredUsers && (user as any).ReferredUsers.length > 0 ? (
                          (user as any).ReferredUsers.map((referral: any, idx: number) => (
                            <motion.div
                              key={referral.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                  {(referral.image || referral.profilePic) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={referral.image || referral.profilePic}
                                      alt={
                                        [referral.firstname, referral.lastname]
                                          .filter(Boolean)
                                          .join(" ") ||
                                        referral.name ||
                                        referral.username ||
                                        referral.email ||
                                        "User"
                                      }
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span>
                                      {(
                                        [referral.firstname, referral.lastname]
                                          .filter(Boolean)
                                          .join(" ") ||
                                        referral.name ||
                                        referral.username ||
                                        referral.email ||
                                        "U"
                                      )?.[0]?.toUpperCase() || "U"}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {[referral.firstname, referral.lastname]
                                      .filter(Boolean)
                                      .join(" ") ||
                                      referral.name ||
                                      referral.username ||
                                      referral.email ||
                                      "Unknown"}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {referral.email}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  {referral.activated ? (
                                    <MdVerified className="text-green-500" size={18} />
                                  ) : (
                                    <MdCancel className="text-red-500" size={18} />
                                  )}
                                  {referral.emailVerified ? (
                                    <MdVerified className="text-green-500" size={18} />
                                  ) : (
                                    <MdCancel className="text-red-500" size={18} />
                                  )}
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {format(new Date(referral.createdAt), "MMM d, yyyy")}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No referrals yet
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Assignment Modal */}
          <AssignMembershipModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onSuccess={() => {
              refetch();
              setShowAssignModal(false);
            }}
            mode="single"
            preSelectedUserId={userId}
          />

          {/* Extend Modal */}
          {user && (
            <ExtendMembershipModal
              isOpen={showExtendModal}
              onClose={() => setShowExtendModal(false)}
              onSuccess={() => {
                refetch();
                setShowExtendModal(false);
              }}
              userId={userId}
              currentExpiration={user.membershipExpiresAt ? new Date(user.membershipExpiresAt) : null}
              userName={displayName}
              userEmail={user.email || ""}
            />
          )}

          {/* Swap Sponsor Modal */}
          {user && (
            <SwapSponsorModal
              isOpen={showSwapSponsorModal}
              onClose={() => setShowSwapSponsorModal(false)}
              onSuccess={() => {
                refetch();
                setShowSwapSponsorModal(false);
              }}
              userId={userId}
              userName={displayName}
              userEmail={user.email || ""}
              currentSponsor={{
                id: (user as any).SponsorUser?.id || user.sponsorId || null,
                name: (user as any).SponsorUser?.name || null,
                email: (user as any).SponsorUser?.email || null,
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Helper Components
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
        <Icon className="text-green-600" size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: any;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          active
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-red-100 dark:bg-red-900/30"
        }`}
      >
        <Icon className={active ? "text-green-600" : "text-red-600"} size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function NetworkStat({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        highlighted ? "text-green-600 font-semibold" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={highlighted ? "text-lg" : ""}>{value.toLocaleString()}</span>
        {highlighted && <MdTrendingUp size={20} />}
      </div>
    </div>
  );
}
