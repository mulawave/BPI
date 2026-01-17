'use client';

import { Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function SecuritySettingsPanel() {
  const utils = api.useUtils();

  // Get system settings for PIN and 2FA
  const { data: systemSettings, isLoading } = api.admin.getSystemSettings.useQuery();

  // Update system setting mutation
  const updateSettingMutation = api.admin.updateSystemSetting.useMutation({
    onSuccess: () => {
      toast.success('Setting updated successfully');
      utils.admin.getSystemSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update setting');
    },
  });

  const handleToggleSetting = (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSettingMutation.mutate({
      settingKey: key,
      settingValue: newValue,
      description: key === 'pin_enabled' ? 'Enable PIN feature for users' : 'Enable 2FA feature for users',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pinEnabled = systemSettings?.pin_enabled?.value === 'true';
  const twoFAEnabled = systemSettings?.two_factor_enabled?.value === 'true';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Security Features Control
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enable or disable security features system-wide. Users can only set up features that are enabled here.
        </p>

        <div className="space-y-6">
          {/* PIN Feature Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile PIN Feature</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow users to set up a 4-digit PIN for secure transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pinEnabled ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Enabled
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Disabled
                </div>
              )}
              <button
                onClick={() => handleToggleSetting('pin_enabled', systemSettings?.pin_enabled?.value || 'false')}
                disabled={updateSettingMutation.isPending}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center ${
                  pinEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {updateSettingMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  pinEnabled ? 'Disable' : 'Enable'
                )}
              </button>
            </div>
          </div>

          {/* 2FA Feature Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication Feature</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow users to enable 2FA with Google Authenticator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {twoFAEnabled ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Enabled
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Disabled
                </div>
              )}
              <button
                onClick={() => handleToggleSetting('two_factor_enabled', systemSettings?.two_factor_enabled?.value || 'false')}
                disabled={updateSettingMutation.isPending}
                className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center ${
                  twoFAEnabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {updateSettingMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  twoFAEnabled ? 'Disable' : 'Enable'
                )}
              </button>
            </div>
          </div>
        </div>

        {!pinEnabled && !twoFAEnabled && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Both security features are currently disabled. Users will not be able to set up PIN or 2FA until you enable them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
