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
} from "react-icons/md";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = api.admin.getUserById.useQuery(
    { userId },
    { enabled: isOpen && !!userId }
  );

  if (!isOpen || !mounted) return null;

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
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
                                  user.city && user.state
                                    ? `${user.city}, ${user.state}`
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
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
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
                          )}
                        </div>

                        {/* Right Column - Wallets & Stats */}
                        <div className="space-y-6">
                          {/* Wallets */}
                          <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-6 text-white">
                            <h3 className="text-lg font-semibold mb-4">Wallets</h3>
                            <div className="space-y-3">
                              <WalletItem
                                label="Main Wallet"
                                value={user.wallet}
                              />
                              <WalletItem
                                label="Spendable"
                                value={user.spendable}
                              />
                              <WalletItem
                                label="BPI Tokens"
                                value={user.bpiTokenWallet}
                                isBpt
                              />
                            </div>
                          </div>

                          {/* Network Stats */}
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
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
                              className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Referrals
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              Referred By
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {(user as any).ReferredByUser
                                ? ([
                                    [
                                      (user as any).ReferredByUser.firstname,
                                      (user as any).ReferredByUser.lastname,
                                    ]
                                      .filter(Boolean)
                                      .join(" "),
                                    (user as any).ReferredByUser.name,
                                    (user as any).ReferredByUser.username,
                                    (user as any).ReferredByUser.email,
                                  ].filter(Boolean)[0] as string)
                                : user.referredBy
                                  ? "Linked (details unavailable)"
                                  : "None"}
                            </p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              Sponsor
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {(user as any).SponsorUser
                                ? ([
                                    [
                                      (user as any).SponsorUser.firstname,
                                      (user as any).SponsorUser.lastname,
                                    ]
                                      .filter(Boolean)
                                      .join(" "),
                                    (user as any).SponsorUser.name,
                                    (user as any).SponsorUser.username,
                                    (user as any).SponsorUser.email,
                                  ].filter(Boolean)[0] as string)
                                : user.sponsorId
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
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
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

function WalletItem({
  label,
  value,
  isBpt = false,
}: {
  label: string;
  value: number;
  isBpt?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm">
      <span className="text-sm opacity-90">{label}</span>
      <span className="font-semibold">
        {isBpt ? value.toLocaleString() : `₦${value.toLocaleString()}`}
      </span>
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
