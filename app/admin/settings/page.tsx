"use client";

import { useEffect, useState } from "react";
import { api } from "../../../client/trpc";
import { motion } from "framer-motion";
import {
  HiCog,
  HiRefresh,
  HiSave,
  HiCreditCard,
  HiBell,
  HiShieldCheck,
  HiDatabase,
  HiCheckCircle,
  HiXCircle,
  HiCloud,
  HiKey,
  HiEye,
  HiEyeOff,
} from "react-icons/hi";
import toast from "react-hot-toast";
import BackupRestorePanel from "@/components/admin/BackupRestorePanel";
import StatsCard from "@/components/admin/StatsCard";

type TabType = "general" | "payments" | "notifications" | "security" | "integrations" | "backup";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [gatewayEdits, setGatewayEdits] = useState({} as any);
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "",
    siteUrl: "",
    supportEmail: "",
    maxReferralLevels: "10",
    defaultCurrency: "USD",
    minWithdrawal: "50",
    maxWithdrawal: "10000",
  });

  // API Queries
  const { data: systemSettings, refetch: refetchSettings } = api.admin.getSystemSettings.useQuery();
  const { data: paymentGateways, refetch: refetchGateways } = api.admin.getPaymentGateways.useQuery();
  const { data: notificationSettings, refetch: refetchNotifications } = api.admin.getNotificationSettings.useQuery();
  const { data: firebaseConfigStatus, isLoading: firebaseConfigLoading } = api.config.getFirebaseConfig.useQuery();
  const { data: currencies = [] } = api.currency.getAll.useQuery();
  const { data: defaultCurrency } = api.currency.getDefault.useQuery();

  const updateSettingMutation = api.admin.updateSystemSetting.useMutation({
    onSuccess: () => {
      toast.success("Setting updated successfully");
      refetchSettings();
    },
    onError: (error: any) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });

  const updateGatewayMutation = api.admin.updatePaymentGateway.useMutation({
    onSuccess: () => {
      toast.success("Payment gateway updated successfully");
      refetchGateways();
    },
    onError: (error: any) => {
      toast.error(`Failed to update gateway: ${error.message}`);
    },
  });

  const updateNotificationMutation = api.admin.updateNotificationSetting.useMutation({
    onSuccess: () => {
      toast.success("Notification setting updated successfully");
      refetchNotifications();
    },
    onError: (error: any) => {
      toast.error(`Failed to update notification: ${error.message}`);
    },
  });

  const initializeNotificationMutation = api.admin.initializeNotificationSettings.useMutation({
    onSuccess: () => {
      toast.success("Notification defaults initialized");
      refetchNotifications();
    },
    onError: (error: any) => {
      toast.error(`Failed to initialize notifications: ${error.message}`);
    },
  });

  const handleSaveGeneralSetting = (key: string, value: string, description?: string) => {
    updateSettingMutation.mutate({
      settingKey: key,
      settingValue: value,
      description,
    });
  };

  const handleToggleGateway = (gatewayId: string, currentStatus: boolean) => {
    updateGatewayMutation.mutate({
      id: gatewayId,
      isActive: !currentStatus,
    });
  };

  type GatewayEditField =
    | "publicKey"
    | "secretKey"
    | "merchantId"
    | "webhookUrl"
    | "callbackUrl"
    | "apiProvider"
    | "merchantKey"
    | "cryptoPublicKey"
    | "cryptoSecretKey"
    | "bankName"
    | "bankAccount"
    | "bankAccountName"
    | "tokenName"
    | "tokenSymbol"
    | "tokenContractAddress"
    | "tokenomicsUrl"
    | "homePageUrl"
    | "currentPriceNgn"
    | "currentPriceUsd";

  const setGatewayEdit = (gatewayId: string, field: GatewayEditField, value: string) => {
    setGatewayEdits((prev: any) => ({
      ...prev,
      [gatewayId]: {
        ...(prev[gatewayId] ?? {}),
        [field]: value,
      },
    }));
  };

  const handleSaveGateway = (gateway: any) => {
    const edits = gatewayEdits[gateway.id] ?? {};
    const gatewayName = gateway.gatewayName as string;

    const base = {
      id: gateway.id,
    };

    if (gatewayName === "paystack" || gatewayName === "flutterwave") {
      updateGatewayMutation.mutate({
        ...base,
        publicKey: edits.publicKey ?? gateway.publicKey ?? undefined,
        secretKey: edits.secretKey ?? gateway.secretKey ?? undefined,
        merchantId: edits.merchantId ?? gateway.merchantId ?? undefined,
        webhookUrl: edits.webhookUrl ?? gateway.webhookUrl ?? undefined,
        callbackUrl: edits.callbackUrl ?? gateway.callbackUrl ?? undefined,
      });
      return;
    }

    if (gatewayName === "bank-transfer") {
      updateGatewayMutation.mutate({
        ...base,
        bankName: edits.bankName ?? gateway.bankName ?? undefined,
        bankAccount: edits.bankAccount ?? gateway.bankAccount ?? undefined,
        bankAccountName: edits.bankAccountName ?? gateway.bankAccountName ?? undefined,
      });
      return;
    }

    if (gatewayName === "utility-token") {
      const priceNgnRaw = edits.currentPriceNgn ?? gateway.currentPriceNgn;
      const priceUsdRaw = edits.currentPriceUsd ?? gateway.currentPriceUsd;
      const currentPriceNgn =
        priceNgnRaw === "" || priceNgnRaw === null || priceNgnRaw === undefined
          ? undefined
          : Number(priceNgnRaw);
      const currentPriceUsd =
        priceUsdRaw === "" || priceUsdRaw === null || priceUsdRaw === undefined
          ? undefined
          : Number(priceUsdRaw);

      updateGatewayMutation.mutate({
        ...base,
        tokenName: edits.tokenName ?? gateway.tokenName ?? undefined,
        tokenSymbol: edits.tokenSymbol ?? gateway.tokenSymbol ?? undefined,
        tokenContractAddress: edits.tokenContractAddress ?? gateway.tokenContractAddress ?? undefined,
        tokenomicsUrl: edits.tokenomicsUrl ?? gateway.tokenomicsUrl ?? undefined,
        homePageUrl: edits.homePageUrl ?? gateway.homePageUrl ?? undefined,
        currentPriceNgn,
        currentPriceUsd,
      });
      return;
    }

    if (gatewayName === "crypto") {
      updateGatewayMutation.mutate({
        ...base,
        apiProvider: edits.apiProvider ?? gateway.apiProvider ?? undefined,
        merchantKey: edits.merchantKey ?? gateway.merchantKey ?? undefined,
        cryptoPublicKey: edits.cryptoPublicKey ?? gateway.cryptoPublicKey ?? undefined,
        cryptoSecretKey: edits.cryptoSecretKey ?? gateway.cryptoSecretKey ?? undefined,
      });
      return;
    }
  };

  const handleToggleNotification = (settingId: string, field: string, currentValue: boolean) => {
    updateNotificationMutation.mutate({
      id: settingId,
      [field]: !currentValue,
    } as any);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl dark:opacity-5" />
        <div className="absolute bottom-0 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl dark:opacity-5" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
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
                <HiCog className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="premium-gradient-text text-4xl font-bold">
                  System Settings
                </h1>
                <p className="text-muted-foreground mt-1 font-medium">
                  Configure system behavior, integrations, and preferences
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                refetchSettings();
                refetchGateways();
                refetchNotifications();
              }}
              className="p-3.5 bg-background/60 backdrop-blur-sm border-2 border-border rounded-xl hover:bg-background shadow-lg transition-all"
            >
              <HiRefresh className="w-5 h-5 text-foreground/70" />
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatsCard
            title="Settings Keys"
            value={Object.keys(systemSettings ?? {}).length}
            icon={HiDatabase as any}
            color="green"
          />
          <StatsCard
            title="Gateways"
            value={paymentGateways?.length || 0}
            icon={HiCreditCard as any}
            color="orange"
          />
          <StatsCard
            title="Notifications"
            value={Array.isArray(notificationSettings) ? notificationSettings.length : 0}
            icon={HiBell as any}
            color="blue"
          />
          <StatsCard
            title="Firebase Config"
            value={firebaseConfigLoading ? "Loading" : firebaseConfigStatus?.missing?.length ? "Needs setup" : "Ready"}
            icon={HiCloud as any}
            color="teal"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "general"
                ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white"
                : "bg-card/75 backdrop-blur-sm text-muted-foreground hover:bg-background/60 border border-border"
            }`}
          >
            <HiCog className="w-5 h-5" />
            General
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "payments"
                ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-white"
                : "bg-card/75 backdrop-blur-sm text-muted-foreground hover:bg-background/60 border border-border"
            }`}
          >
            <HiCreditCard className="w-5 h-5" />
            Payment Gateways
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "notifications"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-purple-500/30"
                : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50"
            }`}
          >
            <HiBell className="w-5 h-5" />
            Notifications
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "security"
                ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/30"
                : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50"
            }`}
          >
            <HiShieldCheck className="w-5 h-5" />
            Security
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "integrations"
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-500/30"
                : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50"
            }`}
          >
            <HiCloud className="w-5 h-5" />
            Integrations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab("backup")}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
              activeTab === "backup"
                ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-indigo-500/30"
                : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50"
            }`}
          >
            <HiDatabase className="w-5 h-5" />
            Backup
          </motion.button>
        </motion.div>

        {/* Content */}
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                General Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Site Name"
                  settingKey="site_name"
                  description="The name of your platform"
                  currentValue={systemSettings?.site_name?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Support Email"
                  settingKey="support_email"
                  description="Contact email for support"
                  currentValue={systemSettings?.support_email?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                
                <CurrencySettingField
                  label="Default Currency (from DB)"
                  settingKey="default_currency"
                  description="Select from available currencies"
                  currentValue={systemSettings?.default_currency?.value || defaultCurrency?.symbol || "USD"}
                  currencies={currencies}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Max Referral Levels"
                  settingKey="max_referral_levels"
                  description="Maximum depth of referral tree"
                  currentValue={systemSettings?.max_referral_levels?.value || "10"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Min Withdrawal Amount"
                  settingKey="min_withdrawal"
                  description="Minimum withdrawal limit"
                  currentValue={systemSettings?.min_withdrawal?.value || "50"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Max Withdrawal Amount"
                  settingKey="max_withdrawal"
                  description="Maximum withdrawal limit"
                  currentValue={systemSettings?.max_withdrawal?.value || "10000"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                System Limits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Registration Limit Per Day"
                  settingKey="registration_limit_daily"
                  description="Max new accounts per day (0 = unlimited)"
                  currentValue={systemSettings?.registration_limit_daily?.value || "0"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Login Attempts Before Lockout"
                  settingKey="max_login_attempts"
                  description="Failed login threshold"
                  currentValue={systemSettings?.max_login_attempts?.value || "5"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "payments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {paymentGateways && paymentGateways.length > 0 ? (
              paymentGateways.map((gateway: any) => (
                <div
                  key={gateway.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {gateway.logo && (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <HiCreditCard className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {gateway.displayName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {gateway.description || gateway.provider}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleGateway(gateway.id, gateway.isActive)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        gateway.isActive
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {gateway.isActive ? (
                        <>
                          <HiCheckCircle className="w-5 h-5" />
                          Active
                        </>
                      ) : (
                        <>
                          <HiXCircle className="w-5 h-5" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Currency:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {gateway.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Provider:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {gateway.provider}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Methods:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {gateway.supportedMethods?.join(", ") || "N/A"}
                      </span>
                    </div>
                  </div>

                  {gateway.gatewayName === "mock" ? (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mock payment does not require any configuration.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {gateway.gatewayName === "utility-token"
                            ? "Utility Token Settings"
                            : gateway.gatewayName === "bank-transfer"
                              ? "Bank Transfer Settings"
                              : gateway.gatewayName === "crypto"
                                ? "Crypto Settings"
                                : "Gateway Credentials & URLs"}
                        </h4>
                        <button
                          onClick={() => handleSaveGateway(gateway)}
                          disabled={updateGatewayMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <HiSave className="w-5 h-5" />
                          Save
                        </button>
                      </div>

                      {(gateway.gatewayName === "paystack" || gateway.gatewayName === "flutterwave") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Public Key
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.publicKey ?? gateway.publicKey ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "publicKey", e.target.value)}
                              placeholder="Enter public key"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Secret Key
                            </label>
                            <input
                              type="password"
                              value={gatewayEdits[gateway.id]?.secretKey ?? gateway.secretKey ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "secretKey", e.target.value)}
                              placeholder="Enter secret key"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Merchant ID
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.merchantId ?? gateway.merchantId ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "merchantId", e.target.value)}
                              placeholder="Enter merchant ID"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Webhook URL
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.webhookUrl ?? gateway.webhookUrl ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "webhookUrl", e.target.value)}
                              placeholder="https://.../api/webhooks/..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Callback URL
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.callbackUrl ?? gateway.callbackUrl ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "callbackUrl", e.target.value)}
                              placeholder="https://.../api/webhooks/.../callback"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {gateway.gatewayName === "bank-transfer" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Bank Name
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.bankName ?? gateway.bankName ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "bankName", e.target.value)}
                              placeholder="Enter bank name"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Bank Account
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.bankAccount ?? gateway.bankAccount ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "bankAccount", e.target.value)}
                              placeholder="Enter account number"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Bank Account Name
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.bankAccountName ?? gateway.bankAccountName ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "bankAccountName", e.target.value)}
                              placeholder="Enter account name"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {gateway.gatewayName === "utility-token" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Token Name
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.tokenName ?? gateway.tokenName ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "tokenName", e.target.value)}
                              placeholder="Enter token name"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Token Symbol
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.tokenSymbol ?? gateway.tokenSymbol ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "tokenSymbol", e.target.value)}
                              placeholder="Enter token symbol"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Token Contract Address
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.tokenContractAddress ?? gateway.tokenContractAddress ?? ""}
                              onChange={(e) =>
                                setGatewayEdit(gateway.id, "tokenContractAddress", e.target.value)
                              }
                              placeholder="Enter contract address"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Tokenomics Page
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.tokenomicsUrl ?? gateway.tokenomicsUrl ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "tokenomicsUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Home Page
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.homePageUrl ?? gateway.homePageUrl ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "homePageUrl", e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Current Price (Naira)
                            </label>
                            <input
                              type="number"
                              value={
                                gatewayEdits[gateway.id]?.currentPriceNgn ??
                                (gateway.currentPriceNgn ?? "")
                              }
                              onChange={(e) =>
                                setGatewayEdit(gateway.id, "currentPriceNgn", e.target.value)
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Current Price (USD)
                            </label>
                            <input
                              type="number"
                              value={
                                gatewayEdits[gateway.id]?.currentPriceUsd ??
                                (gateway.currentPriceUsd ?? "")
                              }
                              onChange={(e) =>
                                setGatewayEdit(gateway.id, "currentPriceUsd", e.target.value)
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {gateway.gatewayName === "crypto" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              API Provider
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.apiProvider ?? gateway.apiProvider ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "apiProvider", e.target.value)}
                              placeholder="Enter API provider"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Merchant Key
                            </label>
                            <input
                              type="password"
                              value={gatewayEdits[gateway.id]?.merchantKey ?? gateway.merchantKey ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "merchantKey", e.target.value)}
                              placeholder="Enter merchant key"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Public Key
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.cryptoPublicKey ?? gateway.cryptoPublicKey ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "cryptoPublicKey", e.target.value)}
                              placeholder="Enter public key"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Secret Key
                            </label>
                            <input
                              type="password"
                              value={gatewayEdits[gateway.id]?.cryptoSecretKey ?? gateway.cryptoSecretKey ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "cryptoSecretKey", e.target.value)}
                              placeholder="Enter secret key"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                <HiCreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No Payment Gateways Configured
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Configure payment gateways in your database
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Notification Channels
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage which system events send notifications
              </p>
              <button
                onClick={() => {
                  const t = toast.loading("Initializing notification defaults...");
                  initializeNotificationMutation.mutate(undefined as any, {
                    onSettled: () => toast.dismiss(t),
                  });
                }}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Initialize Defaults
              </button>
            </div>
            {notificationSettings && notificationSettings.length > 0 ? (
              <div className="space-y-4">
                {notificationSettings.map((setting: any) => (
                  <div
                    key={setting.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {setting.notificationType.replace(/_/g, " ").toUpperCase()}
                      </h3>
                      <button
                        onClick={() => handleToggleNotification(setting.id, "enabled", setting.enabled)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          setting.enabled
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {setting.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.emailEnabled}
                          onChange={() => handleToggleNotification(setting.id, "emailEnabled", setting.emailEnabled)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.smsEnabled}
                          onChange={() => handleToggleNotification(setting.id, "smsEnabled", setting.smsEnabled)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.pushEnabled}
                          onChange={() => handleToggleNotification(setting.id, "pushEnabled", setting.pushEnabled)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No Notification Settings
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Notification settings will appear here
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const t = toast.loading("Initializing notification defaults...");
                      initializeNotificationMutation.mutate(undefined as any, {
                        onSettled: () => toast.dismiss(t),
                      });
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Initialize Defaults
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Security & Access Control
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Session Timeout (minutes)"
                  settingKey="session_timeout"
                  description="Auto logout after inactivity"
                  currentValue={systemSettings?.session_timeout?.value || "30"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Password Min Length"
                  settingKey="password_min_length"
                  description="Minimum password characters"
                  currentValue={systemSettings?.password_min_length?.value || "8"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Two-Factor Required"
                  settingKey="require_2fa"
                  description="Enforce 2FA for all users"
                  currentValue={systemSettings?.require_2fa?.value || "false"}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="IP Whitelist"
                  settingKey="admin_ip_whitelist"
                  description="Allowed admin IPs (comma-separated)"
                  currentValue={systemSettings?.admin_ip_whitelist?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <HiDatabase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  System Maintenance
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Clear Cache</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Clear all system caches
                    </p>
                  </div>
                  <button
                    onClick={() => toast.success("Cache cleared successfully")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Database Backup</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a full database backup
                    </p>
                  </div>
                  <button
                    onClick={() => toast.success("Backup initiated")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Backup Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "integrations" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                    <HiKey className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Firebase Credentials
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store and manage client-safe Firebase config without redeploys.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${
                    firebaseConfigStatus?.missing?.length
                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                      : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200"
                  }`}>
                    <HiCloud className="w-4 h-4" />
                    {firebaseConfigLoading
                      ? "Checking..."
                      : firebaseConfigStatus?.missing?.length
                        ? `${firebaseConfigStatus.missing.length} missing`
                        : "Ready"}
                  </span>
                  {firebaseConfigStatus?.source && (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-900/60 px-3 py-1">
                      Source: {firebaseConfigStatus.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Project</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {firebaseConfigStatus?.config?.projectId || "Not set"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used by live ticker & Firestore listeners.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Keys saved (incl. optional)</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {firebaseConfigStatus?.config
                      ? Object.values(firebaseConfigStatus.config).filter(Boolean).length
                      : 0} / 7
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Persists in AdminSettings; falls back to env if missing.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Missing</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {firebaseConfigLoading
                      ? "Loading..."
                      : firebaseConfigStatus?.missing?.length
                        ? firebaseConfigStatus.missing.join(", ")
                        : "None"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Six keys required for Firestore; measurementId is optional (analytics).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Firebase Web Config</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Updates take effect immediately for Hero Ticker and other Firestore clients.
                  </p>
                </div>
                <span className="text-xs rounded-full bg-gray-100 dark:bg-gray-900/60 px-3 py-1 text-gray-600 dark:text-gray-300">
                  Stored in AdminSettings
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "API Key", key: "firebase_api_key", placeholder: "AIza..." },
                  { label: "Auth Domain", key: "firebase_auth_domain", placeholder: "your-app.firebaseapp.com" },
                  { label: "Project ID", key: "firebase_project_id", placeholder: "your-app" },
                  { label: "Storage Bucket", key: "firebase_storage_bucket", placeholder: "your-app.appspot.com" },
                  { label: "Messaging Sender ID", key: "firebase_messaging_sender_id", placeholder: "1234567890" },
                  { label: "App ID", key: "firebase_app_id", placeholder: "1:1234567890:web:abcdef" },
                  { label: "Measurement ID", key: "firebase_measurement_id", placeholder: "G-XXXXXXX" },
                ].map((field) => (
                  <SecretSettingField
                    key={field.key}
                    label={field.label}
                    settingKey={field.key}
                    placeholder={field.placeholder}
                    currentValue={systemSettings?.[field.key as keyof typeof systemSettings]?.value || ""}
                    onSave={handleSaveGeneralSetting}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "backup" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BackupRestorePanel />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Reusable Setting Field Component
function SettingField({
  label,
  settingKey,
  description,
  currentValue,
  type = "text",
  onSave,
}: {
  label: string;
  settingKey: string;
  description?: string;
  currentValue: string;
  type?: string;
  onSave: (key: string, value: string, description?: string) => void;
}) {
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(currentValue);
    setIsEditing(false);
  }, [currentValue]);

  useEffect(() => {
    setValue(currentValue);
    setIsEditing(false);
  }, [currentValue]);

  const handleSave = () => {
    onSave(settingKey, value, description);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={isEditing ? value : currentValue}
          onChange={(e) => {
            setValue(e.target.value);
            setIsEditing(true);
          }}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white"
        />
        {isEditing && (
          <button
            onClick={handleSave}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiSave className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Currency Setting Field Component backed by DB currencies
function CurrencySettingField({
  label,
  settingKey,
  description,
  currentValue,
  currencies,
  onSave,
}: {
  label: string;
  settingKey: string;
  description?: string;
  currentValue: string;
  currencies: Array<{ id: string; name: string; symbol: string; sign?: string | null }>;
  onSave: (key: string, value: string, description?: string) => void;
}) {
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(settingKey, value, description);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <select
          value={isEditing ? value : currentValue}
          onChange={(e) => {
            setValue(e.target.value);
            setIsEditing(true);
          }}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white"
        >
          {currencies.map((c) => (
            <option key={c.id} value={c.symbol}>
              {c.name} ({c.symbol})
            </option>
          ))}
        </select>
        {isEditing && (
          <button
            onClick={handleSave}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiSave className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Masked setting field for secrets that should remain client-safe
function SecretSettingField({
  label,
  settingKey,
  currentValue,
  placeholder,
  onSave,
}: {
  label: string;
  settingKey: string;
  currentValue: string;
  placeholder?: string;
  onSave: (key: string, value: string, description?: string) => void;
}) {
  const [value, setValue] = useState(currentValue);
  const [isEditing, setIsEditing] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setValue(currentValue);
    setIsEditing(false);
  }, [currentValue]);

  const handleSave = () => {
    onSave(settingKey, value);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={show ? "text" : "password"}
          value={isEditing ? value : currentValue}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setIsEditing(true);
          }}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {show ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
        </button>
        {isEditing && (
          <button
            onClick={handleSave}
            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <HiSave className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}