'use client';

import { useState } from 'react';
import { Shield, Lock, Key, QrCode, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';
import Image from 'next/image';

export default function SecuritySettingsPanel() {
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });

  const [twoFAData, setTwoFAData] = useState({
    verificationCode: '',
  });

  const [disable2FAData, setDisable2FAData] = useState({
    pin: '',
    code: '',
  });

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const utils = api.useUtils();

  // Get security status
  const { data: securityStatus, isLoading } = api.security.getSecurityStatus.useQuery();

  // Setup PIN mutation
  const setupPinMutation = api.security.setupPin.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowPinSetup(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      utils.security.getSecurityStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Setup 2FA mutation
  const setup2FAMutation = api.security.setup2FA.useMutation({
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCode);
      setSecret(data.secret);
      toast.success('Scan the QR code with Google Authenticator');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Verify 2FA mutation
  const verify2FAMutation = api.security.verify2FA.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShow2FASetup(false);
      setQrCodeUrl(null);
      setSecret(null);
      setTwoFAData({ verificationCode: '' });
      utils.security.getSecurityStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Disable 2FA mutation
  const disable2FAMutation = api.security.disable2FA.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowDisable2FA(false);
      setDisable2FAData({ pin: '', code: '' });
      utils.security.getSecurityStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetupPin = () => {
    if (pinData.newPin !== pinData.confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(pinData.newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    setupPinMutation.mutate({
      newPin: pinData.newPin,
      currentPin: securityStatus?.hasPin ? pinData.currentPin : undefined,
    });
  };

  const handleSetup2FA = () => {
    if (!qrCodeUrl) {
      setup2FAMutation.mutate();
    }
  };

  const handleVerify2FA = () => {
    if (!/^\d{6}$/.test(twoFAData.verificationCode)) {
      toast.error('Verification code must be 6 digits');
      return;
    }

    verify2FAMutation.mutate({
      code: twoFAData.verificationCode,
    });
  };

  const handleDisable2FA = () => {
    if (!/^\d{4}$/.test(disable2FAData.pin)) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (!/^\d{6}$/.test(disable2FAData.code)) {
      toast.error('2FA code must be 6 digits');
      return;
    }

    disable2FAMutation.mutate({
      pin: disable2FAData.pin,
      code: disable2FAData.code,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PIN Setup Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile PIN</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                4-digit PIN for secure transactions
              </p>
            </div>
          </div>
          <div>
            {securityStatus?.hasPin ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Enabled
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Not Set
              </div>
            )}
          </div>
        </div>

        {!showPinSetup ? (
          <button
            onClick={() => setShowPinSetup(true)}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {securityStatus?.hasPin ? 'Update PIN' : 'Setup PIN'}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 mt-4"
          >
            {securityStatus?.hasPin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinData.currentPin}
                    onChange={(e) => setPinData({ ...pinData, currentPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="••••"
                    maxLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New PIN
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                value={pinData.newPin}
                onChange={(e) => setPinData({ ...pinData, newPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New PIN
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                value={pinData.confirmPin}
                onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••"
                maxLength={4}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSetupPin}
                disabled={setupPinMutation.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {setupPinMutation.isPending ? 'Saving...' : 'Save PIN'}
              </button>
              <button
                onClick={() => {
                  setShowPinSetup(false);
                  setPinData({ currentPin: '', newPin: '', confirmPin: '' });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 2FA Setup Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Google Authenticator for extra security
              </p>
            </div>
          </div>
          <div>
            {securityStatus?.has2FA ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Enabled
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Disabled
              </div>
            )}
          </div>
        </div>

        {securityStatus?.has2FA ? (
          !showDisable2FA ? (
            <button
              onClick={() => setShowDisable2FA(true)}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 mt-4"
            >
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Disabling 2FA will reduce your account security. You'll need both your PIN and current 2FA code.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your PIN
                </label>
                <input
                  type="password"
                  value={disable2FAData.pin}
                  onChange={(e) => setDisable2FAData({ ...disable2FAData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2FA Code
                </label>
                <input
                  type="text"
                  value={disable2FAData.code}
                  onChange={(e) => setDisable2FAData({ ...disable2FAData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDisable2FA}
                  disabled={disable2FAMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button
                  onClick={() => {
                    setShowDisable2FA(false);
                    setDisable2FAData({ pin: '', code: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )
        ) : (
          !show2FASetup ? (
            <button
              onClick={() => {
                setShow2FASetup(true);
                handleSetup2FA();
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Enable 2FA
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 mt-4"
            >
              {setup2FAMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
              ) : qrCodeUrl ? (
                <>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      1. Install Google Authenticator on your phone<br />
                      2. Scan this QR code or enter the secret manually<br />
                      3. Enter the 6-digit code from the app below
                    </p>
                    <div className="flex justify-center my-4">
                      <div className="p-4 bg-white rounded-lg">
                        {qrCodeUrl && (
                          <Image
                            src={qrCodeUrl}
                            alt="2FA QR Code"
                            width={200}
                            height={200}
                          />
                        )}
                      </div>
                    </div>
                    {secret && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manual Entry:</p>
                        <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm break-all">
                          {secret}
                        </code>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={twoFAData.verificationCode}
                      onChange={(e) => setTwoFAData({ verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleVerify2FA}
                      disabled={verify2FAMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {verify2FAMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        setQrCodeUrl(null);
                        setSecret(null);
                        setTwoFAData({ verificationCode: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
