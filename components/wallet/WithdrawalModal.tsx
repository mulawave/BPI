"use client";

import { useState } from "react";
import { FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { Wallet, CreditCard, Bitcoin, CheckCircle, Loader2, AlertTriangle, Building, BadgeCheck } from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSession } from "next-auth/react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WithdrawalType = 'cash' | 'bpt';
type Step = 'type' | 'details' | 'summary' | 'processing' | 'success' | 'error';

export default function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const { data: session } = useSession();
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('cash');
  const [currentStep, setCurrentStep] = useState<Step>('type');
  
  // Form fields
  const [amount, setAmount] = useState<string>('');
  // Note: Withdrawals only come from Main Wallet (user.wallet field)
  
  /**
   * FUTURE IMPLEMENTATION: Flutterwave Bank Verification API
   * 
   * Bank Selection Flow:
   * 1. Fetch bank list from Flutterwave API endpoint
   *    - Endpoint: GET https://api.flutterwave.com/v3/banks/NG
   *    - Returns: { id, code, name } for all Nigerian banks
   *    - Display banks in dropdown for user selection
   * 
   * 2. User selects bank and enters account number (10 digits)
   * 
   * 3. Query Flutterwave Account Verification API
   *    - Endpoint: POST https://api.flutterwave.com/v3/accounts/resolve
   *    - Payload: { account_number, account_bank (bank_code) }
   *    - Returns: { account_number, account_name, bank_code }
   *    - Auto-populate account_name field with verified name
   * 
   * 4. User confirms withdrawal with verified details
   * 
   * Current Implementation: Mock test using manual bank entry for validation
   */
  const [bankName, setBankName] = useState<string>(''); // Will become bank_code from Flutterwave
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>(''); // Will be auto-filled from verification
  const [bnbWallet, setBnbWallet] = useState<string>('');

  
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { formatAmount } = useCurrency();
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

  const numAmount = parseFloat(amount) || 0;
  const fee = withdrawalType === 'cash' ? CASH_FEE : BPT_FEE;
  const totalDebit = numAmount + fee; // Total amount debited from wallet (withdrawal + fee)
  const requiresApproval = numAmount >= AUTO_APPROVAL_THRESHOLD;

  const handleTypeNext = () => {
    setError('');
    setCurrentStep('details');
  };

  const handleDetailsNext = () => {
    if (numAmount < 1) {
      setError('Please enter an amount of at least ₦1');
      return;
    }

    if (withdrawalType === 'cash') {
      if (!bankName || !accountNumber || !accountName) {
        setError('Please fill in all bank details');
        return;
      }
      if (accountNumber.length < 10) {
        setError('Account number must be at least 10 digits');
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

    setError('');
    setCurrentStep('summary');
  };

  const handleConfirm = () => {
    setCurrentStep('processing');
    
    const payload = withdrawalType === 'cash'
      ? {
          withdrawalType: 'cash' as const,
          amount: numAmount,
          sourceWallet: 'wallet' as const,
          bankName,
          accountNumber,
          accountName
        }
      : {
          withdrawalType: 'bpt' as const,
          amount: numAmount,
          sourceWallet: 'wallet' as const,
          bnbWalletAddress: bnbWallet
        };

    withdrawalMutation.mutate(payload);
  };

  const handleReset = () => {
    setCurrentStep('type');
    setAmount('');
    setError('');
    setSuccessData(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

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
                <p className="text-indigo-100 text-sm">Cash out to your bank or BNB wallet</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
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
                <span>Cash Withdrawal</span>
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
                <span>BPT Withdrawal</span>
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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {withdrawalType === 'cash' ? (
                  <Building className="w-10 h-10 text-white" />
                ) : (
                  <Bitcoin className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {withdrawalType === 'cash' ? 'Bank Withdrawal' : 'BPT Token Withdrawal'}
              </h2>
              <p className="text-muted-foreground">
                {withdrawalType === 'cash' 
                  ? 'Withdraw funds directly to your bank account'
                  : 'Transfer BPT tokens to your BNB wallet'
                }
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">Important Information</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Processing Fee: <strong className={withdrawalType === 'cash' ? 'text-orange-600' : 'text-green-600'}>
                        {withdrawalType === 'cash' ? formatAmount(CASH_FEE) : 'FREE'}
                      </strong></li>
                      <li>• Amounts under {formatAmount(AUTO_APPROVAL_THRESHOLD)} are auto-approved</li>
                      <li>• Larger amounts require admin approval (1-2 business days)</li>
                      {withdrawalType === 'bpt' && <li>• Ensure your BNB wallet address is correct</li>}
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₦</span>
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
                    Bank Account Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Bank Name</label>
                    <Input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. First Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Account Number</label>
                    <Input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Account Name</label>
                    <Input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Full name as per bank"
                    />
                  </div>
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
                    <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
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
                      <span className="font-semibold">{bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span className="font-mono font-semibold">{accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-semibold">{accountName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">BNB Wallet:</p>
                      <p className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border break-all">
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
                  <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Your withdrawal request has been received</li>
                    <li>✓ Admin will review within 1-2 business days</li>
                    <li>✓ You'll receive email notification upon approval</li>
                    <li>✓ Funds will be transferred to your account</li>
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
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 py-6"
                size="lg"
              >
                Make Another Withdrawal
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
