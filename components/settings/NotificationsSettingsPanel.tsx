'use client';

import { Bell, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

const NOTIF_KEYS = [
  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
  { key: 'transactionAlerts', label: 'Transaction Alerts', desc: 'Get notified about all wallet transactions' },
  { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important security-related notifications' },
  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional offers and platform updates' },
  { key: 'referralUpdates', label: 'Referral Updates', desc: 'Notifications when referrals join or activate' },
  { key: 'packageReminders', label: 'Package Reminders', desc: 'Reminders about package expiry and renewals' },
] as const;

export default function NotificationsSettingsPanel() {
  const { data: settings, isLoading } = api.user.getSettings.useQuery();
  const utils = api.useUtils();
  const [values, setValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings?.notifications) setValues(settings.notifications as Record<string, boolean>);
  }, [settings]);

  const mutation = api.user.updateNotifications.useMutation({
    onSuccess: () => { toast.success('Notification preferences saved'); utils.user.getSettings.invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to save'),
  });

  const toggle = (key: string, val: boolean) => {
    const next = { ...values, [key]: val };
    setValues(next);
    mutation.mutate({ [key]: val } as any);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choose what you want to be notified about</p>
        </div>
      </div>
      <div className="space-y-4">
        {NOTIF_KEYS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key, !values[key])}
              disabled={mutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors ${values[key] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${values[key] ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
