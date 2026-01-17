'use client';

import { useState } from 'react';
import { Session } from 'next-auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, X, Shield, User, Bell, Palette, Globe, 
  Lock, CreditCard, Database, Settings as SettingsIcon,
  ChevronRight, Home
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserSecuritySettingsPanel from '@/components/user/SecuritySettingsPanel';
import Footer from '@/components/Footer';

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      available: false,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Email and push notification preferences',
      available: false,
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Palette,
      description: 'Theme, language, and display options',
      available: false,
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Lock,
      description: 'Data privacy and account visibility',
      available: false,
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      description: 'Payment methods and transaction history',
      available: false,
    },
  ];

  const handleClose = () => {
    router.push('/dashboard');
  };

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
      default:
        return (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This section is currently under development
            </p>
          </div>
        );
    }
  };

  const activeTabConfig = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </button>
              
              {/* Breadcrumbs */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-gray-400" />
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="text-gray-600 dark:text-gray-400">Settings</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="text-gray-900 dark:text-white font-medium">
                  {activeTabConfig?.label}
                </span>
              </div>
            </div>

            {/* Center: Title */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Account Settings
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
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
                    <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Visit Help Center →
                    </button>
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
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    {activeTabConfig && (
                      <>
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl flex items-center justify-center">
                          <activeTabConfig.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {activeTabConfig.label}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
