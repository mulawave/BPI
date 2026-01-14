"use client";

import { useState } from "react";
import { FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { Wallet, ArrowRightLeft, Users, CheckCircle, Loader2, AlertTriangle, BadgeCheck } from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransferType = 'inter-wallet' | 'user-to-user';
type WalletType = 'wallet' | 'spendable' | 'shareholder' | 'cashback' | 'community' | 'education' | 'car' | 'business';
type Step = 'type' | 'details' | 'summary' | 'processing' | 'success' | 'error';

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [transferType, setTransferType] = useState<TransferType>('inter-wallet');
  const [currentStep, setCurrentStep] = useState<Step>('type');
  
  // Form fields
  const [amount, setAmount] = useState<string>('');
  const [fromWallet, setFromWallet] = useState<WalletType>('wallet');
  const [toWallet, setToWallet] = useState<WalletType>('spendable');
  const [recipientIdentifier, setRecipientIdentifier] = useState<string>('');
  
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { formatAmount } = useCurrency();
  const MAX_TRANSFER = 500000; // ₦500k

  // Fetch user wallet balances directly
  const { data: userProfile } = api.user.getDetails.useQuery();
  
  // Helper to get wallet balance from user profile
  const getWalletBalance = (walletKey: WalletType): number => {
    if (!userProfile) return 0;
    return (userProfile as any)[walletKey] || 0;
  };

  const transferInterWalletMutation = api.wallet.transferInterWallet.useMutation({
    onSuccess: (data: any) => {
      setSuccessData(data);
      setCurrentStep('success');
    },
    onError: (error: any) => {
      setError(error.message);
      setCurrentStep('error');
    }
  });

  const transferToUserMutation = api.wallet.transferToUser.useMutation({
    onSuccess: (data: any) => {
      setSuccessData(data);
      setCurrentStep('success');
    },
    onError: (error: any) => {
      setError(error.message);
      setCurrentStep('error');
    }
  });

  const numAmount = parseFloat(amount) || 0;

  const handleTypeNext = () => {
    setError('');
    setCurrentStep('details');
  };

  const handleDetailsNext = () => {
    if (numAmount < 1) {
      setError('Please enter an amount of at least ₦1');
      return;
    }

    if (numAmount > MAX_TRANSFER) {
      setError(`Maximum transfer amount is ${formatAmount(MAX_TRANSFER)}`);
      return;
    }

    if (transferType === 'inter-wallet') {
      if (fromWallet === toWallet) {
        setError('Please select different wallets for transfer');
        return;
      }
    } else {
      if (!recipientIdentifier.trim()) {
        setError('Please enter recipient username or email');
        return;
      }
    }

    setError('');
    setCurrentStep('summary');
  };

  const handleConfirm = () => {
    setCurrentStep('processing');
    
    if (transferType === 'inter-wallet') {
      transferInterWalletMutation.mutate({
        amount: numAmount,
        fromWallet: fromWallet as any,
        toWallet: toWallet as any
      });
    } else {
      transferToUserMutation.mutate({
        amount: numAmount,
        recipientIdentifier,
        sourceWallet: fromWallet as any
      });
    }
  };

  const handleReset = () => {
    setCurrentStep('type');
    setAmount('');
    setFromWallet('wallet');
    setToWallet('spendable');
    setRecipientIdentifier('');
    setError('');
    setSuccessData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const walletOptions = [
    { value: 'wallet', label: 'Main Wallet', description: 'Primary cash wallet', balance: getWalletBalance('wallet') },
    { value: 'spendable', label: 'Spendable Wallet', description: 'Available for spending', balance: getWalletBalance('spendable') },
    { value: 'shareholder', label: 'Shareholder Wallet', description: 'Shareholder funds', balance: getWalletBalance('shareholder') },
    { value: 'cashback', label: 'Cashback Wallet', description: 'Earned cashback', balance: getWalletBalance('cashback') },
    { value: 'community', label: 'Community Wallet', description: 'Community support', balance: getWalletBalance('community') },
    { value: 'education', label: 'Education Wallet', description: 'Education fund', balance: getWalletBalance('education') },
    { value: 'car', label: 'Car Wallet', description: 'Car savings', balance: getWalletBalance('car') },
    { value: 'business', label: 'Business Wallet', description: 'Business capital', balance: getWalletBalance('business') }
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <ArrowRightLeft className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Transfer Funds</h1>
                <p className="text-amber-100 text-sm">Move money between wallets or send to users</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setTransferType('inter-wallet')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                transferType === 'inter-wallet'
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Inter-Wallet Transfer</span>
              </div>
            </button>
            <button
              onClick={() => setTransferType('user-to-user')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                transferType === 'user-to-user'
                  ? 'bg-white text-amber-600 shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>Send to User</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step: Type Selection */}
        {currentStep === 'type' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {transferType === 'inter-wallet' ? (
                  <Wallet className="w-10 h-10 text-white" />
                ) : (
                  <Users className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {transferType === 'inter-wallet' ? 'Inter-Wallet Transfer' : 'Send to Another User'}
              </h2>
              <p className="text-muted-foreground">
                {transferType === 'inter-wallet' 
                  ? 'Move funds between your own wallets'
                  : 'Transfer money to another BPI member'
                }
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">Transfer Information</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>No fees</strong> for transfers</li>
                      <li>• Maximum per transaction: <strong>{formatAmount(MAX_TRANSFER)}</strong></li>
                      <li>• Palliative wallet is exempt from transfers</li>
                      <li>• Transfers are instant and cannot be reversed</li>
                      {transferType === 'user-to-user' && <li>• Recipient receives funds immediately</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleTypeNext}
                className="w-full py-6 text-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Enter Details */}
        {currentStep === 'details' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Transfer Details</h2>
              <p className="text-muted-foreground">Enter the amount and destination</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount to Transfer</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₦</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-12 pr-4 py-6 text-2xl font-bold text-center"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  Maximum: {formatAmount(MAX_TRANSFER)}
                </p>
              </div>

              {/* Inter-Wallet Transfer Fields */}
              {transferType === 'inter-wallet' && (
                <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Select Wallets
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Transfer From</label>
                    <select
                      value={fromWallet}
                      onChange={(e) => setFromWallet(e.target.value as WalletType)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background"
                    >
                      {walletOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({formatAmount(option.balance)}) - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Transfer To</label>
                    <select
                      value={toWallet}
                      onChange={(e) => setToWallet(e.target.value as WalletType)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background"
                    >
                      {walletOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({formatAmount(option.balance)}) - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* User-to-User Transfer Fields */}
              {transferType === 'user-to-user' && (
                <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Recipient & Source
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Recipient (Username or Email)</label>
                    <Input
                      type="text"
                      value={recipientIdentifier}
                      onChange={(e) => setRecipientIdentifier(e.target.value)}
                      placeholder="username or email@example.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the username or email of the BPI member you want to send money to
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Send From</label>
                    <select
                      value={fromWallet}
                      onChange={(e) => setFromWallet(e.target.value as WalletType)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background"
                    >
                      {walletOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({formatAmount(option.balance)}) - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Amount Display */}
              {numAmount > 0 && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transfer Amount:</span>
                      <span className="font-semibold">{formatAmount(numAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transfer Fee:</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                    <div className="pt-2 border-t border-green-300 dark:border-green-700">
                      <div className="flex justify-between">
                        <span className="font-bold">
                          {transferType === 'inter-wallet' ? 'Destination Receives:' : 'Recipient Receives:'}
                        </span>
                        <span className="font-bold text-lg text-green-600">{formatAmount(numAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <FiAlertCircle />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('type')}
                  variant="outline"
                  className="flex-1 py-6"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={handleDetailsNext}
                  className="flex-1 py-6 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
                  size="lg"
                >
                  Continue to Summary
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {currentStep === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Transfer</h2>
              <p className="text-muted-foreground">Review the details before proceeding</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* Summary Card */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-orange-200 dark:border-orange-700">
                    <span className="text-muted-foreground">Transfer Amount</span>
                    <span className="text-2xl font-bold text-orange-600">{formatAmount(numAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  {transferType === 'inter-wallet' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">From Wallet</span>
                        <span className="font-semibold capitalize">{fromWallet}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">To Wallet</span>
                        <span className="font-semibold capitalize">{toWallet}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">From Wallet</span>
                        <span className="font-semibold capitalize">{fromWallet}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Recipient</span>
                        <span className="font-semibold">{recipientIdentifier}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-orange-200 dark:border-orange-700">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-2xl text-green-600">{formatAmount(numAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Notice */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3">
                <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">Instant Transfer</p>
                  <p className="text-xs">
                    {transferType === 'inter-wallet' 
                      ? `Funds will be moved from your ${fromWallet} wallet to your ${toWallet} wallet immediately.`
                      : `${recipientIdentifier} will receive the funds in their savings wallet immediately.`
                    }
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Transfers cannot be reversed once confirmed</li>
                    <li>• Please verify all details are correct</li>
                    {transferType === 'user-to-user' && <li>• Ensure recipient identifier is accurate</li>}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('details')}
                  variant="outline"
                  className="flex-1 py-6"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 py-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                  size="lg"
                >
                  Confirm Transfer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <Loader2 className="w-20 h-20 text-orange-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Transfer...</h2>
            <p className="text-muted-foreground">Please wait while we process your request</p>
          </div>
        )}

        {/* Success */}
        {currentStep === 'success' && successData && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">Transfer Successful!</h2>
              <p className="text-muted-foreground">{successData.message}</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Transferred</span>
                    <span className="font-bold text-green-600">{formatAmount(successData.amount)}</span>
                  </div>
                  {transferType === 'inter-wallet' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">From</span>
                        <span className="font-semibold capitalize">{successData.fromWallet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">To</span>
                        <span className="font-semibold capitalize">{successData.toWallet}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">From Wallet</span>
                        <span className="font-semibold capitalize">{successData.fromWallet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient</span>
                        <span className="font-semibold">{successData.recipientName || recipientIdentifier}</span>
                      </div>
                    </>
                  )}
                  <div className="pt-3 border-t border-green-200 dark:border-green-700">
                    <div className="flex justify-between">
                      <span className="font-bold">Status</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Transfer Complete</p>
                    <p className="text-muted-foreground text-xs">
                      {transferType === 'inter-wallet' 
                        ? 'Your wallets have been updated'
                        : 'Recipient has been notified'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                Done
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 py-6"
                size="lg"
              >
                Make Another Transfer
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {currentStep === 'error' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-red-600 mb-2">Transfer Failed</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <Button
                onClick={handleReset}
                className="flex-1 py-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                size="lg"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 py-6"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
