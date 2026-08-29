'use client';

import { useState } from 'react';
import { Session } from 'next-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, User, Bell, Palette, Globe, ChevronRight,
  Lock, CreditCard, Settings as SettingsIcon
} from 'lucide-react';
import Link from 'next/link';
import UserSecuritySettingsPanel from '@/components/user/SecuritySettingsPanel';
import CryptoWalletSettings from '@/components/settings/CryptoWalletSettings';
import ProfileSettingsPanel from '@/components/settings/ProfileSettingsPanel';
import NotificationsSettingsPanel from '@/components/settings/NotificationsSettingsPanel';
import PreferencesSettingsPanel from '@/components/settings/PreferencesSettingsPanel';
import PrivacySettingsPanel from '@/components/settings/PrivacySettingsPanel';
import KycWarningBanner from '@/components/kyc/KycWarningBanner';
import { api } from '@/client/trpc';

interface SettingsLayoutProps {
  session: Session;
}

type SettingsTab = 'security' | 'profile' | 'notifications' | 'preferences' | 'privacy' | 'billing';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: any;
  description: string;
  available: boolean;
}

export default function SettingsLayout({ session }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Query user details for Nigerian user detection
  const { data: userDetails } = api.user.getDetails.useQuery();
  const isAdmin = userDetails?.role === 'admin' || userDetails?.role === 'super_admin';
  const isNigerianUser = !isAdmin && !userDetails?.allowUsdFeatures && (
    userDetails?.country?.toLowerCase() === 'nigeria' ||
    userDetails?.countryRelation?.name?.toLowerCase() === 'nigeria' ||
    userDetails?.hasBankAccounts === true
  );

  const tabs: TabConfig[] = [
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'PIN and two-factor authentication',
      available: true,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Personal information and photo',
      available: true,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Email and push notification preferences',
      available: true,
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Palette,
      description: 'Theme, language, and display options',
      available: true,
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Lock,
      description: 'Data privacy and account visibility',
      available: true,
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      description: 'Crypto wallet & payment settings',
      available: !isNigerianUser,
    },
  ];

  const handleTabClick = (tabId: SettingsTab, available: boolean) => {
    if (available) {
      setActiveTab(tabId);
      setIsMobileMenuOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'security':
        return <UserSecuritySettingsPanel />;
      case 'profile':
        return <ProfileSettingsPanel />;
      case 'notifications':
        return <NotificationsSettingsPanel />;
      case 'preferences':
        return <PreferencesSettingsPanel />;
      case 'privacy':
        return <PrivacySettingsPanel />;
      case 'billing':
        return <CryptoWalletSettings />;
      default:
        return null;
    }
  };

  const activeTabConfig = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen w-full">
      {/* Account Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818] p-8 shadow-xl ring-1 ring-amber-300/20 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-1 ring-white/20">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Account Settings</h1>
            <p className="text-sm text-emerald-100/80">{session.user?.email}</p>
          </div>
        </div>
      </section>

      {/* KYC Warning Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <KycWarningBanner />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTabConfig && (
                  <>
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <activeTabConfig.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeTabConfig.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tap to switch section</p>
                    </div>
                  </>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-[60] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close settings sections"
              />

              <motion.div
                className="absolute bottom-0 left-0 right-0 max-h-[78vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                initial={{ y: 120 }}
                animate={{ y: 0 }}
                exit={{ y: 120 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-2 flex items-center justify-between px-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Settings Sections</h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close settings menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={`mobile-${tab.id}`}
                        onClick={() => handleTabClick(tab.id, tab.available)}
                        disabled={!tab.available}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                            : tab.available
                              ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{tab.label}</div>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            {tab.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id, tab.available)}
                      disabled={!tab.available}
                      className={`
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25' 
                          : tab.available
                            ? 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isActive 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 dark:bg-gray-700'
                        }
                      `}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium mb-0.5 flex items-center gap-2">
                          {tab.label}
                          {!tab.available && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                          {tab.description}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-1 h-full bg-white rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Help Section */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Need Help?
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      Check our help center for guides and tutorials
                    </p>
                    <Link
                      href="/help"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Visit Help Center →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Tab Header */}
                <div className="mb-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    {activeTabConfig && (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl flex items-center justify-center">
                          <activeTabConfig.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {activeTabConfig.label}
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {activeTabConfig.description}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

    </div>
  );
}
