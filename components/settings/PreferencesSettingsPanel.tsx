'use client';

import { Palette, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function PreferencesSettingsPanel() {
  const { data: settings, isLoading } = api.user.getSettings.useQuery();
  const utils = api.useUtils();
  const [prefs, setPrefs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings?.preferences) setPrefs(settings.preferences as Record<string, string>);
  }, [settings]);

  const mutation = api.user.updatePreferences.useMutation({
    onSuccess: () => { toast.success('Preferences saved'); utils.user.getSettings.invalidate(); },
    onError: (e) => toast.error(e.message || 'Failed to save'),
  });

  const update = (key: string, value: string) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    mutation.mutate({ [key]: value } as any);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display Preferences</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize your platform experience</p>
        </div>
      </div>

      <div className="space-y-5">
        <SelectField
          label="Theme"
          desc="Choose your preferred color scheme"
          value={prefs.theme ?? 'system'}
          onChange={(v) => update('theme', v)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System Default' },
          ]}
        />
        <SelectField
          label="Language"
          desc="Display language for the platform"
          value={prefs.language ?? 'en'}
          onChange={(v) => update('language', v)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'fr', label: 'French' },
            { value: 'es', label: 'Spanish' },
            { value: 'pt', label: 'Portuguese' },
            { value: 'sw', label: 'Swahili' },
            { value: 'ha', label: 'Hausa' },
            { value: 'yo', label: 'Yoruba' },
            { value: 'ig', label: 'Igbo' },
          ]}
        />
        <SelectField
          label="Date Format"
          desc="How dates are displayed"
          value={prefs.dateFormat ?? 'DD/MM/YYYY'}
          onChange={(v) => update('dateFormat', v)}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
          ]}
        />
        <SelectField
          label="Email Digest Frequency"
          desc="How often you receive summary emails"
          value={prefs.emailDigestFrequency ?? 'weekly'}
          onChange={(v) => update('emailDigestFrequency', v)}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'never', label: 'Never' },
          ]}
        />
      </div>
    </div>
  );
}

function SelectField({ label, desc, value, onChange, options }: { label: string; desc: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{desc}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
