'use client';

import { Lock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

const PRIVACY_TOGGLES = [
  { key: 'showWalletBalance', label: 'Show Wallet Balance', desc: 'Allow others to see your wallet balance' },
  { key: 'showReferralStats', label: 'Show Referral Stats', desc: 'Allow others to see your referral count' },
  { key: 'showActivityStatus', label: 'Show Activity Status', desc: 'Show when you are online or active' },
  { key: 'allowDirectMessages', label: 'Allow Direct Messages', desc: 'Allow other members to message you directly' },
  { key: 'dataSharingOptIn', label: 'Data Sharing Opt-In', desc: 'Allow anonymized data to be used for platform improvement' },
] as const;

export default function PrivacySettingsPanel() {
  const { data: settings, isLoading } = api.user.getSettings.useQuery();
  const utils = api.useUtils();
  const [privacy, setPrivacy] = useState<Record<string, boolean | string>>({});

  useEffect(() => {
    if (settings?.privacy) setPrivacy(settings.privacy as Record<string, boolean | string>);
  }, [settings]);

  const mutation = api.user.updatePrivacy.useMutation({
    onSuccess: () => { toast.success('Privacy settings saved'); utils.user.getSettings.invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to save'),
  });

  const toggle = (key: string, val: boolean) => {
    const next = { ...privacy, [key]: val };
    setPrivacy(next);
    mutation.mutate({ [key]: val } as any);
  };

  const setVisibility = (val: string) => {
    setPrivacy({ ...privacy, profileVisibility: val });
    mutation.mutate({ profileVisibility: val as any } as any);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Visibility</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'public', label: 'Public', desc: 'Anyone can view' },
            { value: 'members', label: 'Members Only', desc: 'Only BPI members' },
            { value: 'private', label: 'Private', desc: 'Only you can see' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVisibility(opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${privacy.profileVisibility === opt.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            >
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Toggles */}
      <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Controls</h3>
        <div className="space-y-4">
          {PRIVACY_TOGGLES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key, !privacy[key])}
                disabled={mutation.isPending}
                className={`relative w-12 h-6 rounded-full transition-colors ${privacy[key] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${privacy[key] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
