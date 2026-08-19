'use client';

import { useState, useEffect } from 'react';
import { Settings, Zap, ToggleLeft, ToggleRight, Info, History, AlertCircle, Sparkles, Gem } from 'lucide-react';
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

  const handleChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 shadow-lg"
    >
      {/* Ornamental top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

      {/* Header */}
      <div className="relative p-5 border-b border-slate-100 dark:border-slate-800/70">
        <div className="flex items-start gap-2.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-md ring-1 ring-amber-300/30">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-emerald-700/80 dark:text-emerald-300/70">Automated Stewardship</p>
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Auto-Contribute Settings
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-md">
              Let your community wallet flow to active CSP requests on your behalf.
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-5 space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-slate-50/60 to-white dark:from-slate-900/40 dark:to-slate-950 border border-slate-200/70 dark:border-slate-800/70 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40">
              <Settings className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">Enable Auto-Contribute</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Contribute to CSP requests automatically
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange(setIsEnabled, !isEnabled)}
            className="focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-full"
            aria-label="Toggle auto-contribute"
          >
            {isEnabled ? (
              <ToggleRight className="w-10 h-10 text-emerald-600 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-400 dark:text-slate-600" />
            )}
          </button>
        </div>

        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            {/* Min & Max Amount */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400">
                  Min Per Contribution (₦)
                </label>
                <input
                  type="number"
                  min="100"
                  value={minAmountPerRequest}
                  onChange={(e) => handleChange(setMinAmountPerRequest, Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-3 py-2.5 text-sm font-serif font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  Minimum per request each round
                </p>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400">
                  Max Per Request (₦)
                </label>
                <input
                  type="number"
                  min="100"
                  value={maxAmountPerRequest}
                  onChange={(e) => handleChange(setMaxAmountPerRequest, Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 px-3 py-2.5 text-sm font-serif font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  Max total per single request
                </p>
              </div>
            </div>

            {/* Info banner */}
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50/70 to-amber-50/40 dark:from-emerald-950/20 dark:via-slate-950 dark:to-amber-950/10 border border-emerald-200/60 dark:border-emerald-800/40 p-3">
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-sm shrink-0">
                  <Info className="w-3 h-3 text-amber-200" />
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1 leading-relaxed">
                  <p>
                    Draws from <strong className="text-emerald-700 dark:text-emerald-300">Community Wallet</strong> to serve up to 10 active CSP requests in fair round-robin order.
                  </p>
                  <p>
                    Pauses automatically if wallet runs dry. Re-enable once balance is restored.
                  </p>
                  <p className="pt-1 border-t border-emerald-200/50 dark:border-emerald-800/30">
                    <Sparkles className="inline h-2.5 w-2.5 text-amber-500 mr-1" />
                    Enable <strong className="text-emerald-700 dark:text-emerald-300">Wallet Auto-Debit</strong> in wallet settings to keep coffers replenished.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning if insufficient balance */}
            {!settings?.isEnabled && isEnabled && (
              <div className="rounded-lg bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/40 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shrink-0">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    Ensure your community wallet holds sufficient funds. Minimum required: <strong>₦{minAmountPerRequest.toLocaleString()}</strong>.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Save button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4 border-t border-slate-100 dark:border-slate-800/70"
          >
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md ring-1 ring-emerald-400/30 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Gem className="w-3.5 h-3.5 relative" />
              <span className="relative">{saveMutation.isPending ? 'Saving…' : 'Save Settings'}</span>
            </button>
          </motion.div>
        )}

        {/* Logs toggle */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/70">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
          >
            <History className="w-3 h-3" />
            {showLogs ? 'Hide' : 'View'} Recent Auto-Contributions
          </button>

          {showLogs && logs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2"
            >
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                  No auto-contributions yet.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/40 dark:to-slate-950 hover:border-emerald-300/60 dark:hover:border-emerald-700/40 transition-colors"
                  >
                    <div>
                      <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                        ₦{log.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                        {log.Request?.purpose?.slice(0, 40) || 'CSP Request'}
                      </p>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2">
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
