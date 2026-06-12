// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Settings, Wallet, ArrowRight, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function WalletAutoDebitSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [applyToRewards, setApplyToRewards] = useState(true);
  const [applyToDeposits, setApplyToDeposits] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const utils = api.useUtils();

  const { data: settings, isLoading } = api.wallet.getAutoDebitSettings.useQuery();

  const saveMutation = api.wallet.saveAutoDebitSettings.useMutation({
    onSuccess: () => {
      toast.success('Wallet auto-debit settings saved successfully!');
      setHasChanges(false);
      utils.wallet.getAutoDebitSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled);
      setPercentage(settings.percentage);
      setApplyToRewards(settings.applyToRewards);
      setApplyToDeposits(settings.applyToDeposits);
    }
  }, [settings]);

  const handleSave = () => {
    if (percentage < 1 || percentage > 100) {
      toast.error('Percentage must be between 1% and 100%');
      return;
    }
    saveMutation.mutate({ isEnabled, percentage, applyToRewards, applyToDeposits });
  };

  const handleChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto-Debit to Community Wallet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically transfer a percentage from your cash wallet to community wallet
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Auto-Debit</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically move funds to your community wallet
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange(setIsEnabled, !isEnabled)}
            className="focus:outline-none"
          >
            {isEnabled ? (
              <ToggleRight className="w-10 h-10 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-400" />
            )}
          </button>
        </div>

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            {/* Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Debit Percentage
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => handleChange(setPercentage, Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="w-16 text-center">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {percentage}%
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {percentage}% of each qualifying credit will be moved to your Community Wallet
              </p>
            </div>

            {/* Apply to options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Apply Auto-Debit On:
              </h3>

              {/* Rewards */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Referral Rewards & Cash Credits
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When rewards are paid to your cash/main wallet
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleChange(setApplyToRewards, !applyToRewards)}
                  className="focus:outline-none"
                >
                  {applyToRewards ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Deposits */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Deposits & Top-Ups
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When you deposit or top-up your cash/main wallet
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleChange(setApplyToDeposits, !applyToDeposits)}
                  className="focus:outline-none"
                >
                  {applyToDeposits ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Changes take effect immediately. Every qualifying credit to your cash wallet will automatically 
                have {percentage}% transferred to your Community Wallet. This funds your CSP auto-contributions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Save button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
