"use client";

import { useState, useEffect } from "react";
import { FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { Wallet, CreditCard, Bitcoin, CheckCircle, Loader2, AlertTriangle, Building, BadgeCheck, DollarSign, Copy, ExternalLink, Settings } from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUsdtHistory?: () => void;
}

type WithdrawalType = 'cash' | 'bpt' | 'usdt';
type Step = 'type' | 'details' | 'summary' | 'processing' | 'success' | 'error' | 'wallet-gate';

export default function WithdrawalModal({ isOpen, onClose, onOpenUsdtHistory }: WithdrawalModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatAmount, selectedCurrency, convertToNGN } = useCurrency();
  const isUsdMode = selectedCurrency?.symbol !== 'NGN' && selectedCurrency?.symbol != null;

  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>(isUsdMode ? 'usdt' : 'cash');
  const [currentStep, setCurrentStep] = useState<Step>('type');
  
  // Form fields
  const [amount, setAmount] = useState<string>('');
  // Note: Withdrawals only come from Main Wallet (user.wallet field)
  
  // Bank account selection
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  const [bnbWallet, setBnbWallet] = useState<string>('');
  const [usdtAddress, setUsdtAddress] = useState<string>('');
  const [pin, setPin] = useState<string>('');

  // Check USDT eligibility (non-Nigerian users only)
  const { data: usdtEligibility } = api.wallet.canWithdrawUsdt.useQuery();

  // Fetch USD withdrawal config (fee + minimum threshold) from admin settings
  const { data: usdConfig } = api.wallet.getUsdWithdrawalConfig.useQuery();
  const usdFee = usdConfig?.feeUsd ?? 2;
  const usdMinWithdrawal = usdConfig?.minWithdrawalUsd ?? 10;

  // Fetch saved USDT wallet address
  const { data: savedWallet } = api.security.getUsdtWallet.useQuery();

  // Check withdrawal ban status
  const { data: userDetails } = api.user.getDetails.useQuery();
  const isWithdrawalBanned = userDetails?.withdrawBan === 1;

  // Auto-populate USDT address from saved wallet
  useEffect(() => {
    if (savedWallet?.usdtAddress && !usdtAddress) {
      setUsdtAddress(savedWallet.usdtAddress);
    }
  }, [savedWallet?.usdtAddress]);

  // For USD-mode users: if they open the modal but have no saved wallet, show gating
  useEffect(() => {
    if (isOpen && isUsdMode && savedWallet !== undefined && !savedWallet?.usdtAddress) {
      setCurrentStep('wallet-gate');
    }
  }, [isOpen, isUsdMode, savedWallet]);

  // Keep withdrawal type in sync with currency mode
  useEffect(() => {
    if (isUsdMode) {
      setWithdrawalType('usdt');
    }
  }, [isUsdMode]);

  // Fetch user's bank accounts
  const { data: bankAccounts } = api.bank.getUserBankRecords.useQuery();
  const defaultAccount = bankAccounts?.find((acc: any) => acc.isDefault);
  
  // Set default account on load
  if (defaultAccount && !selectedBankAccountId) {
    setSelectedBankAccountId(defaultAccount.id);
  }

  const selectedBankAccount = bankAccounts?.find((acc: any) => acc.id === selectedBankAccountId);

  
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const CASH_FEE = 100; // ₦100
  const BPT_FEE = 0; // ₦0
  const AUTO_APPROVAL_THRESHOLD = 100000; // ₦100k

  const withdrawalMutation = api.wallet.withdraw.useMutation({
    onSuccess: (data: any) => {
      setSuccessData(data);
      setCurrentStep('success');
    },
    onError: (error: any) => {
      setError(error.message);
      setCurrentStep('error');
    }
  });

  // Fetch wallet balance
  const { data: dashboardData } = api.dashboard.getOverview.useQuery();
  const mainWalletBalance = dashboardData?.wallets?.primary?.main?.balance || 0;

  // User enters amount in the selected currency; convert to NGN for all calculations
  const numAmountRaw = parseFloat(amount) || 0;
  const numAmount = convertToNGN(numAmountRaw);
  // USD fee converted to NGN for USDT withdrawals
  const usdFeeInNgn = convertToNGN(usdFee);
  const fee = withdrawalType === 'usdt' ? usdFeeInNgn : withdrawalType === 'cash' ? CASH_FEE : BPT_FEE;
  const totalDebit = numAmount + fee; // Total amount debited from wallet (withdrawal + fee) — in NGN
  const requiresApproval = withdrawalType === 'usdt' ? true : numAmount >= AUTO_APPROVAL_THRESHOLD;

  const handleTypeNext = () => {
    setError('');
    setCurrentStep('details');
  };

  const handleDetailsNext = () => {
    if (numAmount < 1) {
      setError(`Please enter an amount of at least ${formatAmount(1)}`);
      return;
    }

    // USDT-specific minimum check (in the user's entered USD amount)
    if (withdrawalType === 'usdt' && numAmountRaw < usdMinWithdrawal) {
      setError(`Minimum USDT withdrawal is $${usdMinWithdrawal.toFixed(2)}`);
      return;
    }

    if (totalDebit > mainWalletBalance) {
      setError('Insufficient balance (including fee)');
      return;
    }

    if (withdrawalType === 'cash') {
      if (!selectedBankAccountId || !selectedBankAccount) {
        setError('Please select a bank account');
        return;
      }
    } else if (withdrawalType === 'usdt') {
      if (!usdtAddress || !usdtAddress.startsWith('T') || usdtAddress.length !== 34) {
        setError('Please enter a valid USDT TRC-20 wallet address (starts with T, 34 characters)');
        return;
      }
    } else {
      if (!bnbWallet) {
        setError('Please enter your BNB wallet address');
        return;
      }
      if (!bnbWallet.startsWith('0x')) {
        setError('BNB wallet address must start with 0x');
        return;
      }
    }

    if (!/^[0-9]{4}$/.test(pin)) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setError('');
    setCurrentStep('summary');
  };

  const handleConfirm = () => {
    setCurrentStep('processing');
    
    let payload: any;
    if (withdrawalType === 'cash') {
      payload = {
        withdrawalType: 'cash' as const,
        amount: numAmount,
        sourceWallet: 'wallet' as const,
        bankCode: selectedBankAccount?.bank?.bankCode || '',
        accountNumber: selectedBankAccount?.accountNumber || '',
        accountName: selectedBankAccount?.accountName || '',
        pin,
      };
    } else if (withdrawalType === 'usdt') {
      payload = {
        withdrawalType: 'usdt' as const,
        amount: numAmount,
        sourceWallet: 'wallet' as const,
        usdtAddress,
        pin,
      };
    } else {
      payload = {
        withdrawalType: 'bpt' as const,
        amount: numAmount,
        sourceWallet: 'wallet' as const,
        bnbWalletAddress: bnbWallet,
        pin,
      };
    }

    withdrawalMutation.mutate(payload);
  };

  const handleReset = () => {
    setCurrentStep(isUsdMode && !savedWallet?.usdtAddress ? 'wallet-gate' : 'type');
    setAmount('');
    setSelectedBankAccountId(null);
    setBnbWallet('');
    setUsdtAddress(savedWallet?.usdtAddress || '');
    setPin('');
    setError('');
    setSuccessData(null);
    if (isUsdMode) setWithdrawalType('usdt');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  // Withdrawal ban — show forbidden screen
  if (isWithdrawalBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card overflow-y-auto">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Withdrawals Restricted</h1>
                  <p className="text-red-100 text-sm">Your withdrawal access is currently suspended</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <FiX className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Withdrawal Access Denied</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your account has been restricted from making withdrawals by administration. All other features remain accessible.
            </p>
          </div>
          <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 mb-6">
            <div className="space-y-3 text-sm text-red-800 dark:text-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p>Cash, BPT, and USDT withdrawals are all currently unavailable on your account.</p>
              </div>
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p>Please contact <strong>support</strong> or reach out via the Help Center to resolve this restriction.</p>
              </div>
            </div>
          </div>
          <Button onClick={handleClose} variant="outline" className="w-full py-6 text-lg" size="lg">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Withdraw Funds</h1>
                <p className="text-indigo-100 text-sm">
                  {isUsdMode ? 'Withdraw USDT to your TRC-20 wallet' : 'Cash out to your bank or BNB wallet'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Tabs — hide cash/BPT for USD-mode users */}
          <div className="flex gap-2 mt-6">
            {!isUsdMode && (
              <>
                <button
                  onClick={() => setWithdrawalType('cash')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    withdrawalType === 'cash'
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building className="w-5 h-5" />
                    <span>Cash</span>
                  </div>
                </button>
                <button
                  onClick={() => setWithdrawalType('bpt')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    withdrawalType === 'bpt'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Bitcoin className="w-5 h-5" />
                    <span>BPT</span>
                  </div>
                </button>
              </>
            )}
            {(usdtEligibility?.eligible || isUsdMode) && (
              <button
                onClick={() => setWithdrawalType('usdt')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  withdrawalType === 'usdt'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>USDT</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step: Wallet Gate — USD users must set a USDT wallet first */}
        {currentStep === 'wallet-gate' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">USDT Wallet Required</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your account is set to USD currency. To withdraw funds, you must first set up a USDT TRC-20 wallet address in your account settings.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                <div className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>You need a valid <strong>USDT TRC-20 wallet address</strong> saved to your account before you can initiate withdrawals.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p>Go to <strong>Settings &rarr; Billing</strong> to set your wallet address. Your transaction PIN{savedWallet?.has2FA ? ' and 2FA code' : ''} will be required.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  handleClose();
                  router.push('/settings');
                }}
                className="w-full py-6 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                size="lg"
              >
                <Settings className="w-5 h-5 mr-2" />
                Go to Wallet Settings
              </Button>

              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full py-6"
                size="lg"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Step: Type Selection */}
        {currentStep === 'type' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                withdrawalType === 'usdt'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                {withdrawalType === 'cash' ? (
                  <Building className="w-10 h-10 text-white" />
                ) : withdrawalType === 'usdt' ? (
                  <DollarSign className="w-10 h-10 text-white" />
                ) : (
                  <Bitcoin className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {withdrawalType === 'cash' ? 'Bank Withdrawal' : withdrawalType === 'usdt' ? 'USDT TRC-20 Withdrawal' : 'BPT Token Withdrawal'}
              </h2>
              <p className="text-muted-foreground">
                {withdrawalType === 'cash' 
                  ? 'Withdraw funds directly to your bank account'
                  : withdrawalType === 'usdt'
                  ? 'Withdraw via USDT to your TRC-20 wallet'
                  : 'Transfer BPT tokens to your BNB wallet'
                }
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className={`p-6 rounded-2xl border ${
                withdrawalType === 'usdt'
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    withdrawalType === 'usdt' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}>
                    <FiAlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">Important Information</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {withdrawalType === 'usdt' ? (
                        <>
                          <li>• Network: <strong className="text-emerald-600">TRON (TRC-20)</strong></li>
                          <li>• Processing Fee: <strong className="text-orange-600">${usdFee.toFixed(2)} USD</strong></li>
                          <li>• Minimum Withdrawal: <strong className="text-foreground">${usdMinWithdrawal.toFixed(2)} USD</strong></li>
                          <li>• All USDT withdrawals require <strong>admin approval</strong></li>
                          <li>• Admin will send USDT and provide a transaction hash</li>
                          <li>• You can track your payment using the hash</li>
                          <li>• Ensure your TRC-20 address is correct — cannot be reversed</li>
                        </>
                      ) : (
                        <>
                          <li>• Processing Fee: <strong className={withdrawalType === 'cash' ? 'text-orange-600' : 'text-green-600'}>
                            {withdrawalType === 'cash' ? formatAmount(CASH_FEE) : 'FREE'}
                          </strong></li>
                          <li>• Amounts under {formatAmount(AUTO_APPROVAL_THRESHOLD)} are auto-approved</li>
                          <li>• Larger amounts require admin approval (1-2 business days)</li>
                          {withdrawalType === 'bpt' && <li>• Ensure your BNB wallet address is correct</li>}
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleTypeNext}
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Withdrawal Details</h2>
              <p className="text-muted-foreground">Enter the amount and destination</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount to Withdraw</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">{selectedCurrency?.sign || '₦'}</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-12 pr-4 py-6 text-2xl font-bold text-center"
                  />
                </div>
              </div>

              {/* Info: Withdrawals from Main Wallet only */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Withdrawing from: <strong className="text-foreground">Main Wallet</strong>
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatAmount(mainWalletBalance)}
                  </p>
                </div>
              </div>

              {/* Cash-specific fields */}
              {withdrawalType === 'cash' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Select Bank Account
                  </h3>
                  
                  {bankAccounts && bankAccounts.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Withdrawal Account
                      </label>
                      <select
                        value={selectedBankAccountId || ''}
                        onChange={(e) => setSelectedBankAccountId(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-gray-300 dark:border-green-800/50 rounded-lg text-foreground focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select an account</option>
                        {bankAccounts.map((account: any) => (
                          <option key={account.id} value={account.id}>
                            {account.bank?.bankName || 'Unknown Bank'} --- {account.accountNumber.slice(-4)}
                            {account.isDefault && ' (Default)'}
                          </option>
                        ))}
                      </select>
                      
                      {selectedBankAccount && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-2">
                            <BadgeCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900 dark:text-green-200">
                              Account Details
                            </span>
                          </div>
                          <div className="text-sm space-y-1 text-green-800 dark:text-green-300">
                            <div><strong>Bank:</strong> {selectedBankAccount.bank?.bankName}</div>
                            <div><strong>Account Name:</strong> {selectedBankAccount.accountName}</div>
                            <div><strong>Account Number:</strong> {selectedBankAccount.accountNumber}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        No bank accounts found. Please add a bank account in your profile settings first.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* BPT-specific fields */}
              {withdrawalType === 'bpt' && (
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Bitcoin className="w-5 h-5" />
                    BNB Wallet Address
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">BNB Address</label>
                    <Input
                      type="text"
                      value={bnbWallet}
                      onChange={(e) => setBnbWallet(e.target.value)}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ensure this is your correct BNB wallet address. Transactions cannot be reversed.
                    </p>
                  </div>
                </div>
              )}

              {/* USDT TRC-20 fields */}
              {withdrawalType === 'usdt' && (
                <div className="space-y-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    USDT TRC-20 Wallet Address
                  </h3>
                  
                  {savedWallet?.usdtAddress ? (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Saved TRC-20 Address</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white dark:bg-gray-900/50 px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                          {savedWallet.usdtAddress}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Using your saved wallet address. <button onClick={() => { handleClose(); router.push('/settings'); }} className="text-emerald-600 dark:text-emerald-400 underline hover:no-underline">Change in Settings</button>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">TRC-20 Address</label>
                      <Input
                        type="text"
                        value={usdtAddress}
                        onChange={(e) => setUsdtAddress(e.target.value)}
                        placeholder="TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your TRON (TRC-20) USDT wallet address (starts with T, 34 characters). Double-check — transactions cannot be reversed.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Network: TRON (TRC-20) only.</strong> Sending to a wrong network will result in permanent loss of funds.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Transaction PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                />
              </div>

              {/* Fee Display */}
              {numAmount > 0 && (
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Withdrawal Amount:</span>
                      <span className="font-semibold">{formatAmount(numAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processing Fee:</span>
                      <span className={`font-semibold ${fee > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        +{formatAmount(fee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-300 dark:border-green-800/50">
                      <div className="flex justify-between">
                        <span className="font-bold">Total Debit from Wallet:</span>
                        <span className="font-bold text-lg text-red-600">{formatAmount(totalDebit)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      You receive {formatAmount(numAmount)}
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
                  className="flex-1 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
              <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Withdrawal</h2>
              <p className="text-muted-foreground">Review the details before proceeding</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              {/* Summary Card */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-purple-200 dark:border-purple-700">
                    <span className="text-muted-foreground">Withdrawal Amount</span>
                    <span className="text-2xl font-bold text-purple-600">{formatAmount(numAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold text-orange-600">+{formatAmount(fee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Debit</span>
                    <span className="font-semibold text-red-600">{formatAmount(totalDebit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Source Wallet</span>
                    <span className="font-semibold">Main Wallet</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-purple-200 dark:border-purple-700">
                    <span className="font-bold text-lg">You Will Receive</span>
                    <span className="font-bold text-2xl text-green-600">{formatAmount(numAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Destination Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-foreground mb-3">Destination</h3>
                {withdrawalType === 'cash' ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-semibold">{selectedBankAccount?.bank?.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono font-semibold">{selectedBankAccount?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-semibold">{selectedBankAccount?.accountName}</span>
                    </div>
                  </div>
                ) : withdrawalType === 'usdt' ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-semibold text-emerald-600">TRON (TRC-20)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token:</span>
                      <span className="font-semibold">USDT</span>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Wallet Address:</p>
                      <p className="font-mono text-xs bg-white dark:bg-gray-900/30 p-2 rounded border break-all">
                        {usdtAddress}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">BNB Wallet:</p>
                      <p className="font-mono text-xs bg-white dark:bg-green-900/30 p-2 rounded border break-all">
                        {bnbWallet}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval Notice */}
              {requiresApproval && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-semibold mb-1">Manual Approval Required</p>
                    <p className="text-xs">
                      Withdrawals of {formatAmount(AUTO_APPROVAL_THRESHOLD)} or more require admin approval.
                      This may take 1-2 business days.
                    </p>
                  </div>
                </div>
              )}

              {!requiresApproval && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex gap-3">
                  <BadgeCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800 dark:text-green-300">
                    <p className="font-semibold mb-1">Auto-Approval</p>
                    <p className="text-xs">
                      Your withdrawal will be processed automatically within minutes.
                    </p>
                  </div>
                </div>
              )}

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
                  className="flex-1 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <Loader2 className="w-20 h-20 text-purple-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Withdrawal...</h2>
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
              <h2 className="text-3xl font-bold text-green-600 mb-2">Withdrawal Submitted!</h2>
              <p className="text-muted-foreground">{successData.message}</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Requested</span>
                    <span className="font-bold text-green-600">{formatAmount(successData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-semibold">-{formatAmount(successData.fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      successData.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {successData.status === 'completed' ? 'Auto-Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-green-200 dark:border-green-700">
                    <div className="flex justify-between">
                      <span className="font-bold">You Will Receive</span>
                      <span className="font-bold text-lg">{formatAmount(successData.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {successData.status === 'pending' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-foreground mb-2">What&apos;s Next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Your withdrawal request has been received</li>
                    <li>✓ Admin will review within 1-2 business days</li>
                    <li>✓ You&apos;ll receive email notification upon approval</li>
                    {withdrawalType === 'usdt' ? (
                      <>
                        <li>✓ Admin will send USDT to your TRC-20 address</li>
                        <li>✓ You&apos;ll receive a transaction hash to track your payment</li>
                        <li>✓ Check your USDT withdrawal history for updates</li>
                      </>
                    ) : (
                      <li>✓ Funds will be transferred to your account</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <Button
                onClick={handleClose}
                className="flex-1 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                Done
              </Button>
              {withdrawalType === 'usdt' && onOpenUsdtHistory ? (
                <Button
                  onClick={() => { handleClose(); onOpenUsdtHistory(); }}
                  variant="outline"
                  className="flex-1 py-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                  size="lg"
                >
                  View USDT History
                </Button>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 py-6"
                  size="lg"
                >
                  Make Another Withdrawal
                </Button>
              )}
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
              <h2 className="text-3xl font-bold text-red-600 mb-2">Withdrawal Failed</h2>
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
