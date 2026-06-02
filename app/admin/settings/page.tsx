"use client";

import { useEffect, useState } from "react";
import { api } from "../../../client/trpc";
import { motion } from "framer-motion";
import {
  Settings as HiCog,
  RefreshCw as HiRefresh,
  Save as HiSave,
  CreditCard as HiCreditCard,
  Bell as HiBell,
  ShieldCheck as HiShieldCheck,
  Database as HiDatabase,
  CheckCircle as HiCheckCircle,
  XCircle as HiXCircle,
  Cloud as HiCloud,
  Key as HiKey,
  Eye as HiEye,
  EyeOff as HiEyeOff,
  Wifi as HiStatusOnline,
  WifiOff as HiStatusOffline,
  Lock as HiLockClosed,
  Globe as HiGlobeAlt,
} from "lucide-react";
import toast from "react-hot-toast";
import BackupRestorePanel from "@/components/admin/BackupRestorePanel";
import SecuritySettingsPanel from "@/components/admin/SecuritySettingsPanel";
import CommunityFeaturesPanel from "@/components/admin/CommunityFeaturesPanel";
import StatsCard from "@/components/admin/StatsCard";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type TabType = "general" | "payments" | "notifications" | "security" | "integrations" | "backup";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [gatewayEdits, setGatewayEdits] = useState({} as any);
  // Maintenance mode state — seeded from systemSettings once loaded
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceUntil, setMaintenanceUntil] = useState("");
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
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

  // Seed maintenance state from DB once settings load
  useEffect(() => {
    if (!systemSettings) return;
    setMaintenanceEnabled(systemSettings?.maintenance_mode?.value === "true");
    setMaintenanceUntil(systemSettings?.maintenance_until?.value ?? "");
  }, [systemSettings]);
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

  const handleToggleMaintenance = async (enabled: boolean) => {
    setMaintenanceSaving(true);
    try {
      await updateSettingMutation.mutateAsync({
        settingKey: "maintenance_mode",
        settingValue: enabled ? "true" : "false",
        description: "Controls whether the site is in maintenance mode",
      });
      if (maintenanceUntil) {
        await updateSettingMutation.mutateAsync({
          settingKey: "maintenance_until",
          settingValue: maintenanceUntil,
          description: "ISO datetime when maintenance ends",
        });
      }
      setMaintenanceEnabled(enabled);
      // Bust the middleware cache immediately
      try { await fetch("/api/internal/maintenance", { method: "POST" }); } catch {}
      toast.success(enabled ? "🔒 Maintenance mode ENABLED — site is now offline for users" : "✅ Site is now LIVE for all users");
      refetchSettings();
    } catch (err: any) {
      toast.error(`Failed to update site status: ${err.message}`);
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleSaveMaintenanceUntil = async () => {
    if (!maintenanceUntil) return;
    setMaintenanceSaving(true);
    try {
      await updateSettingMutation.mutateAsync({
        settingKey: "maintenance_until",
        settingValue: maintenanceUntil,
        description: "ISO datetime when maintenance ends",
      });
      try { await fetch("/api/internal/maintenance", { method: "POST" }); } catch {}
      toast.success("Estimated return time saved");
      refetchSettings();
    } catch (err: any) {
      toast.error(`Failed to save return time: ${err.message}`);
    } finally {
      setMaintenanceSaving(false);
    }
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
    | "cryptoDepositAddress"
    | "cryptoNetwork"
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
        cryptoDepositAddress: edits.cryptoDepositAddress ?? gateway.cryptoDepositAddress ?? undefined,
        cryptoNetwork: edits.cryptoNetwork ?? gateway.cryptoNetwork ?? undefined,
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

        {/* User Guide */}
        <AdminPageGuide
          title="System Settings Guide"
          sections={[
            {
              title: "System Settings Overview",
              icon: <HiCog className="w-5 h-5 text-blue-600" />,
              items: [
                "Configure <strong>global system behavior</strong> and preferences",
                "Manage <strong>payment gateway integrations</strong> (Paystack, Flutterwave)",
                "Control <strong>notification settings</strong> for user alerts",
                "Set <strong>security policies</strong> (passwords, sessions, 2FA)",
                "Configure <strong>third-party integrations</strong> (Firebase, email providers)",
                "<strong>Backup and restore</strong> database and configuration"
              ]
            },
            {
              title: "General Settings Configuration",
              icon: <HiDatabase className="w-5 h-5 text-green-600" />,
              items: [
                "<strong>Site Name</strong> - Public-facing application name",
                "<strong>Site URL</strong> - Base URL for all links and redirects",
                "<strong>Support Email</strong> - Contact email for user inquiries",
                "<strong>Max Referral Levels</strong> - Depth of referral network (default 10)",
                "<strong>Default Currency</strong> - Primary currency for transactions (NGN, USD, etc.)",
                "<strong>Min/Max Withdrawal</strong> - Withdrawal limits in default currency",
                "Changes take effect <strong>immediately</strong> across the system"
              ]
            },
            {
              title: "Payment Gateway Management",
              icon: <HiCreditCard className="w-5 h-5 text-orange-600" />,
              type: "ol",
              items: [
                "<strong>Paystack</strong> - Nigerian payment processor (cards, bank transfers, USSD)",
                "<strong>Flutterwave</strong> - Multi-currency payment gateway (Africa-focused)",
                "<strong>Enable/disable gateways</strong> - Toggle availability without losing config",
                "<strong>Set API keys</strong> - Public and secret keys from gateway dashboard",
                "<strong>Test mode</strong> - Use test keys for sandbox testing before live",
                "<strong>Webhook URLs</strong> - Configure payment confirmation callbacks",
                "Always <strong>verify keys</strong> before saving - invalid keys break payments"
              ]
            },
            {
              title: "Notification Settings",
              icon: <HiBell className="w-5 h-5 text-purple-600" />,
              items: [
                "<strong>Email notifications</strong> - Configure SMTP server and sender",
                "<strong>Push notifications</strong> - Set up Firebase Cloud Messaging (FCM)",
                "<strong>SMS notifications</strong> - Integrate SMS provider (Twilio, etc.)",
                "<strong>Notification templates</strong> - Customize message content",
                "<strong>User preferences</strong> - Allow users to control notification types",
                "<strong>Initialize defaults</strong> - Click to set up standard notification rules"
              ]
            },
            {
              title: "Security & Integrations",
              icon: <HiShieldCheck className="w-5 h-5 text-red-600" />,
              items: [
                "<strong>Password policies</strong> - Minimum length, complexity requirements",
                "<strong>Session timeout</strong> - Auto-logout after inactivity period",
                "<strong>2FA settings</strong> - Enable two-factor authentication",
                "<strong>Firebase config</strong> - Push notifications and analytics",
                "<strong>Email provider</strong> - SMTP or service (SendGrid, Mailgun)",
                "<strong>Backup settings</strong> - Schedule automatic database backups"
              ]
            },
            {
              title: "Backup & Restore",
              icon: <HiCloud className="w-5 h-5 text-blue-600" />,
              items: [
                "<strong>Create backup</strong> - Export full database snapshot",
                "<strong>Download backup</strong> - Save .sql file locally",
                "<strong>Restore from backup</strong> - Upload and restore previous state",
                "<strong>Schedule backups</strong> - Daily/weekly automated backups",
                "<strong>Backup retention</strong> - Keep last 7/30 days",
                "Always <strong>test backups</strong> periodically to ensure they work"
              ]
            }
          ]}
          features={[
            "General system configuration",
            "Payment gateway integration",
            "Notification management",
            "Security policy settings",
            "Third-party integrations (Firebase, SMTP)",
            "Database backup & restore",
            "API key management",
            "Currency & withdrawal limits"
          ]}
          proTip="For <strong>production environments</strong>, always use <strong>live API keys</strong> (not test keys) for payment gateways. Set up <strong>daily automated backups</strong> and store them <strong>off-site</strong>. Use <strong>strong SMTP credentials</strong> and enable <strong>2FA for admin accounts</strong>. Test all settings in <strong>staging environment first</strong> before applying to live systems. Keep a <strong>settings change log</strong> to track modifications."
          warning="<strong>Changing payment gateway keys affects all transactions immediately</strong> - invalid keys will break checkout. <strong>Restoring from backup overwrites all data</strong> - confirm you have the correct backup file before proceeding. <strong>Security settings apply globally</strong> - overly strict policies may lock out legitimate users. <strong>Firebase config changes</strong> require app restart to take effect. Always keep <strong>backup copies of settings</strong> before major changes."
        />

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
            {/* ── Site Status (Maintenance Mode) ── */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-500">
              {/* Left accent stripe — status color only here, not the whole card */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-colors duration-500 ${
                maintenanceEnabled ? "bg-red-500" : "bg-[hsl(var(--primary))]"
              }`} />
              {/* Very subtle ambient glow behind the card */}
              <div className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl transition-colors duration-500 ${
                maintenanceEnabled ? "bg-red-500/5" : "bg-[hsl(var(--primary))]/5"
              }`} />

              {/* Top row: icon + info + toggle */}
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 pl-7 pr-6 pt-6 pb-0">
                {/* Left — status info */}
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors duration-300 ${
                    maintenanceEnabled
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
                  }`}>
                    {maintenanceEnabled
                      ? <HiLockClosed className="h-6 w-6" />
                      : <HiGlobeAlt className="h-6 w-6" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="text-base font-bold text-foreground">Site Status</h2>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border transition-colors duration-300 ${
                        maintenanceEnabled
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${maintenanceEnabled ? "bg-red-500 animate-pulse" : "bg-[hsl(var(--primary))]"}`} />
                        {maintenanceEnabled ? "Offline — Maintenance" : "Live"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                      {maintenanceEnabled
                        ? "The platform is currently offline. Only admins can access it. Users see the maintenance page."
                        : "The platform is live and accessible to all users."
                      }
                    </p>
                  </div>
                </div>

                {/* Right — toggle + label */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    role="switch"
                    aria-checked={maintenanceEnabled}
                    onClick={() => handleToggleMaintenance(!maintenanceEnabled)}
                    disabled={maintenanceSaving}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed ${
                      maintenanceEnabled
                        ? "bg-red-500 focus-visible:ring-red-500"
                        : "bg-[hsl(var(--primary))] focus-visible:ring-[hsl(var(--primary))]"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      maintenanceEnabled ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                  <span className={`min-w-[80px] text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                    maintenanceSaving
                      ? "text-muted-foreground animate-pulse"
                      : maintenanceEnabled
                        ? "text-red-500"
                        : "text-[hsl(var(--primary))]"
                  }`}>
                    {maintenanceSaving ? "Saving…" : maintenanceEnabled ? "Maintenance" : "Live"}
                  </span>
                </div>
              </div>

              {/* Return time picker */}
              <div className="relative ml-7 mr-6 mt-5 mb-6 pt-4 border-t border-border">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Estimated Return Time
                  <span className="ml-1.5 normal-case font-normal text-muted-foreground/60">(shown on maintenance page)</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="datetime-local"
                    value={maintenanceUntil ? maintenanceUntil.slice(0, 16) : ""}
                    onChange={(e) => setMaintenanceUntil(e.target.value ? new Date(e.target.value).toISOString() : "")}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-[hsl(var(--primary))]/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]/30 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <button
                    onClick={handleSaveMaintenanceUntil}
                    disabled={maintenanceSaving || !maintenanceUntil}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted hover:bg-muted/80 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <HiSave className="h-4 w-4" />
                    Save time
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                General Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Application Base URL"
                  settingKey="app_base_url"
                  description="Base URL for emails and redirects (e.g., https://beepagro.com)"
                  currentValue={systemSettings?.app_base_url?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
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
                  currencies={currencies ?? []}
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

            {/* Company Information Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Company Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This information will appear in the app footer and email templates
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Company Address"
                  settingKey="company_address"
                  description="Full company address"
                  currentValue={systemSettings?.company_address?.value || ""}
                  onSave={handleSaveGeneralSetting}
                  multiline
                />
                <SettingField
                  label="Company Phone"
                  settingKey="company_phone"
                  description="Contact phone number"
                  currentValue={systemSettings?.company_phone?.value || ""}
                  type="tel"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Company Email"
                  settingKey="company_email"
                  description="Contact email address"
                  currentValue={systemSettings?.company_email?.value || ""}
                  type="email"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Facebook URL"
                  settingKey="social_facebook"
                  description="Facebook page link"
                  currentValue={systemSettings?.social_facebook?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Twitter URL"
                  settingKey="social_twitter"
                  description="Twitter profile link"
                  currentValue={systemSettings?.social_twitter?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Instagram URL"
                  settingKey="social_instagram"
                  description="Instagram profile link"
                  currentValue={systemSettings?.social_instagram?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="LinkedIn URL"
                  settingKey="social_linkedin"
                  description="LinkedIn page link"
                  currentValue={systemSettings?.social_linkedin?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="YouTube URL"
                  settingKey="social_youtube"
                  description="YouTube channel link"
                  currentValue={systemSettings?.social_youtube?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>

            {/* Bank Account Information Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Bank Account for Deposits
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Bank account details displayed to users for bank transfer deposits
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Bank Name"
                  settingKey="bank_name"
                  description="Name of the bank"
                  currentValue={systemSettings?.bank_name?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Account Number"
                  settingKey="bank_account_number"
                  description="Bank account number"
                  currentValue={systemSettings?.bank_account_number?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Account Name"
                  settingKey="bank_account_name"
                  description="Account holder name"
                  currentValue={systemSettings?.bank_account_name?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>

            {/* Original Company Info Fields (keeping for backward compatibility) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm" style={{ display: 'none' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingField
                  label="Company Phone"
                  settingKey="company_phone"
                  description="Contact phone number"
                  currentValue={systemSettings?.company_phone?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Company Email"
                  settingKey="company_email"
                  description="Public contact email"
                  currentValue={systemSettings?.company_email?.value || ""}
                  type="email"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Facebook URL"
                  settingKey="social_facebook"
                  description="Facebook page URL"
                  currentValue={systemSettings?.social_facebook?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Twitter URL"
                  settingKey="social_twitter"
                  description="Twitter/X profile URL"
                  currentValue={systemSettings?.social_twitter?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="Instagram URL"
                  settingKey="social_instagram"
                  description="Instagram profile URL"
                  currentValue={systemSettings?.social_instagram?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="LinkedIn URL"
                  settingKey="social_linkedin"
                  description="LinkedIn page URL"
                  currentValue={systemSettings?.social_linkedin?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="YouTube URL"
                  settingKey="social_youtube"
                  description="YouTube channel URL"
                  currentValue={systemSettings?.social_youtube?.value || ""}
                  type="url"
                  onSave={handleSaveGeneralSetting}
                />
              </div>
            </div>

            <CommunityFeaturesPanel />

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
            {/* USD Withdrawal Settings */}
            <UsdWithdrawalSettingsCard
              systemSettings={systemSettings}
              onSave={handleSaveGeneralSetting}
              isSaving={updateSettingMutation.isPending}
            />

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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                            <select
                              value={gatewayEdits[gateway.id]?.apiProvider ?? gateway.apiProvider ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "apiProvider", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
                            >
                              <option value="">Select provider</option>
                              <option value="nowpayments">NowPayments</option>
                              <option value="coinbase_commerce">Coinbase Commerce</option>
                              <option value="binance_pay">Binance Pay</option>
                              <option value="basqet">Basqet</option>
                            </select>
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
                            />
                          </div>

                          <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Manual Crypto Deposit Settings</p>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Deposit Wallet Address (USDT TRC-20)
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.cryptoDepositAddress ?? gateway.cryptoDepositAddress ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "cryptoDepositAddress", e.target.value)}
                              placeholder="e.g. TXyz1234...abcd"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white font-mono text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Network
                            </label>
                            <input
                              value={gatewayEdits[gateway.id]?.cryptoNetwork ?? gateway.cryptoNetwork ?? ""}
                              onChange={(e) => setGatewayEdit(gateway.id, "cryptoNetwork", e.target.value)}
                              placeholder="e.g. TRC-20"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white"
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
            <SecuritySettingsPanel />

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                System Security Settings
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
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl">
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
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl">
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
                    <span className="rounded-full bg-gray-100 dark:bg-green-900/30/60 px-3 py-1">
                      Source: {firebaseConfigStatus.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-green-900/30/40 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Project</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {firebaseConfigStatus?.config?.projectId || "Not set"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Used by live ticker & Firestore listeners.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-green-900/30/40 p-4">
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
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-green-900/30/40 p-4">
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
                <span className="text-xs rounded-full bg-gray-100 dark:bg-green-900/30/60 px-3 py-1 text-gray-600 dark:text-gray-300">
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

            {/* SMTP Email Configuration */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                    <HiBell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Email Configuration (SMTP)
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure SMTP settings for sending system emails
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingField
                  label="SMTP Host"
                  settingKey="smtpHost"
                  description="SMTP server hostname (e.g., smtp.gmail.com)"
                  currentValue={systemSettings?.smtpHost?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="SMTP Port"
                  settingKey="smtpPort"
                  description="SMTP server port (e.g., 587 for TLS, 465 for SSL)"
                  currentValue={systemSettings?.smtpPort?.value || "587"}
                  type="number"
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="SMTP Username"
                  settingKey="smtpUser"
                  description="SMTP authentication username"
                  currentValue={systemSettings?.smtpUser?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SecretSettingField
                  label="SMTP Password"
                  settingKey="smtpPassword"
                  placeholder="••••••••"
                  currentValue={systemSettings?.smtpPassword?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="From Email"
                  settingKey="smtpFromEmail"
                  description="Default sender email address"
                  currentValue={systemSettings?.smtpFromEmail?.value || ""}
                  onSave={handleSaveGeneralSetting}
                />
                <SettingField
                  label="From Name"
                  settingKey="smtpFromName"
                  description="Default sender name"
                  currentValue={systemSettings?.smtpFromName?.value || "BPI Team"}
                  onSave={handleSaveGeneralSetting}
                />
                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-green-900/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={(systemSettings?.smtpSecure?.value || "false") === "true"}
                    onChange={(e) => handleSaveGeneralSetting("smtpSecure", String(e.target.checked), "Use TLS/SSL")}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="smtpSecure" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                    Use TLS/SSL
                  </label>
                </div>
              </div>

            </div>

            {/* Test SMTP Configuration - Standalone Card */}
            <div 
              className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950 dark:via-gray-800 dark:to-indigo-950 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-8 shadow-xl"
              style={{ minHeight: "200px" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <HiBell className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    🧪 Test SMTP Configuration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Send a test email to verify your SMTP settings are working correctly. This will help you confirm that emails can be sent successfully before running campaigns or sending user notifications.
                  </p>
                </div>
              </div>
              <SmtpTestForm />
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
  multiline = false,
  onSave,
}: {
  label: string;
  settingKey: string;
  description?: string;
  currentValue: string;
  type?: string;
  multiline?: boolean;
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
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            value={isEditing ? value : currentValue}
            onChange={(e) => {
              setValue(e.target.value);
              setIsEditing(true);
            }}
            rows={3}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white resize-none"
          />
        ) : (
          <input
            type={type}
            value={isEditing ? value : currentValue}
            onChange={(e) => {
              setValue(e.target.value);
              setIsEditing(true);
            }}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white"
          />
        )}
        {isEditing && (
          <button
            onClick={handleSave}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-1"
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
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white"
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

// USD Withdrawal Settings Card for admin-managed fee and threshold
function UsdWithdrawalSettingsCard({
  systemSettings,
  onSave,
  isSaving,
}: {
  systemSettings: any;
  onSave: (key: string, value: string, description?: string) => void;
  isSaving: boolean;
}) {
  const currentFee = systemSettings?.['USD_WITHDRAWAL_FEE']?.value ?? '2';
  const currentMin = systemSettings?.['USD_MIN_WITHDRAWAL']?.value ?? '10';

  const [feeValue, setFeeValue] = useState(currentFee);
  const [minValue, setMinValue] = useState(currentMin);

  useEffect(() => {
    setFeeValue(systemSettings?.['USD_WITHDRAWAL_FEE']?.value ?? '2');
    setMinValue(systemSettings?.['USD_MIN_WITHDRAWAL']?.value ?? '10');
  }, [systemSettings]);

  const fee = parseFloat(feeValue) || 0;
  const min = parseFloat(minValue) || 0;
  const unlockThreshold = min + fee + 1;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
          <HiCreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">USD Withdrawal Settings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Shared USD processing fee for USDT deposits and withdrawals, plus the withdrawal threshold
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processing Fee */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Processing Fee (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="2.00"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Flat fee used for both USD deposits and USD withdrawals. Default: $2.00
          </p>
        </div>

        {/* Minimum Threshold */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Minimum Withdrawal (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="10.00"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Users cannot withdraw less than this amount. Default: $10.00
          </p>
        </div>
      </div>

      {/* Preview of unlock threshold */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Unlock threshold preview:</strong> Users need at least{' '}
          <span className="font-bold">${unlockThreshold.toFixed(2)}</span>{' '}
          (${min.toFixed(2)} min + ${fee.toFixed(2)} fee + $1.00 buffer) before the withdrawal button enables.
        </p>
        <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
          <strong>Deposit preview:</strong> A $100.00 USD crypto deposit is invoiced as{' '}
          <span className="font-bold">${(100 + (100 * 0.075) + fee).toFixed(2)}</span>{' '}
          ($100.00 base + $7.50 VAT + ${fee.toFixed(2)} shared fee).
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => {
            onSave('USD_WITHDRAWAL_FEE', feeValue, 'USD withdrawal processing fee in dollars');
            onSave('USD_MIN_WITHDRAWAL', minValue, 'Minimum USD withdrawal threshold in dollars');
          }}
          disabled={isSaving}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium text-sm shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <HiSave className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save USD Settings'}
        </button>
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
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-gray-900 dark:text-white"
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

// SMTP Test Form Component
function SmtpTestForm() {
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const testSmtpMutation = api.admin.testSmtpConnection.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTestEmail("");
      setIsSending(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send test email");
      setIsSending(false);
    },
  });

  const handleSendTest = () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    testSmtpMutation.mutate({ testEmail });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
      <div className="flex-1 w-full">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test Email Address
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Enter email to receive test message"
          disabled={isSending}
          className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <button
        onClick={handleSendTest}
        disabled={isSending || !testEmail}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed"
      >
        {isSending ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <HiBell className="w-5 h-5" />
            Send Test Email
          </>
        )}
      </button>
    </div>
  );
}
