// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Settings, Zap, ToggleLeft, ToggleRight, Info, History, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function CspAutoContributeSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [minAmountPerRequest, setMinAmountPerRequest] = useState(500);
  const [maxAmountPerRequest, setMaxAmountPerRequest] = useState(1000);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const utils = api.useUtils();

  const { data: settings, isLoading } = api.csp.getAutoContributeSettings.useQuery();
  const { data: logs } = api.csp.getAutoContributeLogs.useQuery(
    { limit: 10 },
    { enabled: showLogs }
  );

  const saveMutation = api.csp.saveAutoContributeSettings.useMutation({
    onSuccess: () => {
      toast.success('CSP auto-contribute settings saved!');
      setHasChanges(false);
      utils.csp.getAutoContributeSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled);
      setMinAmountPerRequest(settings.minAmountPerRequest);
      setMaxAmountPerRequest(settings.maxAmountPerRequest);
    }
  }, [settings]);

  const handleSave = () => {
    if (minAmountPerRequest < 100) {
      toast.error('Minimum amount per request must be at least ₦100');
      return;
    }
    if (maxAmountPerRequest < minAmountPerRequest) {
      toast.error('Maximum amount must be greater than or equal to minimum');
      return;
    }
    saveMutation.mutate({ isEnabled, minAmountPerRequest, maxAmountPerRequest });
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
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto-Contribute Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically contribute from your community wallet to CSP requests
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Auto-Contribute</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contribute to CSP requests automatically on your behalf
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange(setIsEnabled, !isEnabled)}
            className="focus:outline-none"
          >
            {isEnabled ? (
              <ToggleRight className="w-10 h-10 text-purple-500" />
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
            {/* Min Amount Per Request */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Amount Per Contribution (₦)
              </label>
              <input
                type="number"
                min="100"
                value={minAmountPerRequest}
                onChange={(e) => handleChange(setMinAmountPerRequest, Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The minimum amount to contribute per request each round
              </p>
            </div>

            {/* Max Amount Per Request */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Amount Per Request (₦)
              </label>
              <input
                type="number"
                min="100"
                value={maxAmountPerRequest}
                onChange={(e) => handleChange(setMaxAmountPerRequest, Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum total amount auto-contributed to a single request from your account
              </p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">
              <Info className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <p>
                  Auto-contribute uses your <strong>Community Wallet</strong> balance to contribute 
                  to up to 10 active CSP requests in a fair round-robin order.
                </p>
                <p>
                  If your community wallet runs out of funds, auto-contribute will be paused 
                  automatically. Re-enable it once you have sufficient balance.
                </p>
                <p>
                  Tip: Enable <strong>Wallet Auto-Debit</strong> in your wallet settings to 
                  automatically fund your community wallet from rewards and deposits.
                </p>
              </div>
            </div>

            {/* Warning if insufficient balance */}
            {!settings?.isEnabled && isEnabled && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Make sure your community wallet has sufficient funds before enabling.
                  Minimum balance required: ₦{minAmountPerRequest.toLocaleString()}.
                </p>
              </div>
            )}
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
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Auto-Contribute Settings'}
            </button>
          </motion.div>
        )}

        {/* Logs toggle */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            <History className="w-4 h-4" />
            {showLogs ? 'Hide' : 'View'} Recent Auto-Contributions
          </button>

          {showLogs && logs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-2"
            >
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No auto-contributions yet.
                </p>
              ) : (
                logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₦{log.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.Request?.purpose?.slice(0, 40) || 'CSP Request'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
