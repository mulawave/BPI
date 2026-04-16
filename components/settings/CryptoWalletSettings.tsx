'use client';

import { useState } from 'react';
import { Shield, Wallet, CheckCircle2, AlertTriangle, Copy, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/client/trpc';

export default function CryptoWalletSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [pin, setPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  const utils = api.useUtils();

  const { data: walletData, isLoading } = api.security.getUsdtWallet.useQuery();
  const { data: securityFeatures } = api.security.getSecurityFeatureFlags.useQuery();

  const saveMutation = api.security.saveUsdtWallet.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsEditing(false);
      setNewAddress('');
      setPin('');
      setTwoFactorCode('');
      utils.security.getUsdtWallet.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!newAddress || !newAddress.startsWith('T') || newAddress.length !== 34) {
      toast.error('Please enter a valid TRC-20 address (starts with T, 34 characters)');
      return;
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      toast.error('Please enter your 4-digit transaction PIN');
      return;
    }

    if (walletData?.has2FA && !twoFactorCode) {
      toast.error('Please enter your 2FA code');
      return;
    }

    saveMutation.mutate({
      usdtAddress: newAddress,
      pin,
      twoFactorCode: walletData?.has2FA ? twoFactorCode : undefined,
    });
  };

  const handleCopy = () => {
    if (walletData?.usdtAddress) {
      navigator.clipboard.writeText(walletData.usdtAddress);
      toast.success('Address copied to clipboard');
    }
  };

  const maskAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* USDT TRC-20 Wallet Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">USDT Wallet (TRC-20)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your default withdrawal address for USDT payments
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Network Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-200">Network: TRON (TRC-20) Only</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Only set a valid TRON TRC-20 address here. Sending USDT to an incorrect network address will result in permanent loss of funds.
              </p>
            </div>
          </div>

          {/* Current Saved Address */}
          {walletData?.usdtAddress && !isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Saved Wallet Address</span>
              </div>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white dark:bg-gray-900/50 px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                  {walletData.usdtAddress}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2.5 bg-white dark:bg-gray-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setNewAddress(walletData.usdtAddress || '');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Update Address
                </button>
                <a
                  href={`https://tronscan.org/#/address/${walletData.usdtAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on TronScan
                </a>
              </div>
            </motion.div>
          )}

          {/* No Address Set */}
          {!walletData?.usdtAddress && !isEditing && (
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Wallet Address Set</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Set your USDT TRC-20 wallet address to enable crypto withdrawals
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25"
              >
                Set Wallet Address
              </button>
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* PIN requirement check */}
              {!walletData?.hasPin && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">Transaction PIN Required</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        You must set up a transaction PIN in the Security settings before you can save a wallet address.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {walletData?.hasPin && (
                <>
                  {/* Address Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      USDT TRC-20 Address
                    </label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value.trim())}
                      placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                      maxLength={34}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Must start with &ldquo;T&rdquo; and be exactly 34 characters
                      </p>
                      <span className={`text-xs font-mono ${newAddress.length === 34 ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {newAddress.length}/34
                      </span>
                    </div>
                    {newAddress && (!newAddress.startsWith('T') || newAddress.length !== 34) && newAddress.length > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        {!newAddress.startsWith('T') ? 'Address must start with T' : `Address must be 34 characters (currently ${newAddress.length})`}
                      </p>
                    )}
                  </div>

                  {/* PIN Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Enter 4-digit PIN"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2FA Input (if enabled) */}
                  {walletData?.has2FA && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        2FA Verification Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code from authenticator"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      For your security, your transaction PIN{walletData?.has2FA ? ' and 2FA code are' : ' is'} required to update your withdrawal wallet address. 
                      This address will be used for all future USDT withdrawals.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNewAddress('');
                        setPin('');
                        setTwoFactorCode('');
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saveMutation.isPending || !newAddress || newAddress.length !== 34 || !newAddress.startsWith('T') || pin.length !== 4}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Save Wallet Address'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
