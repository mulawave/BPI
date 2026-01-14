"use client";

import { useState } from "react";
import { FiX, FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";
import { Wallet, CreditCard, DollarSign, CheckCircle, Loader2, AlertTriangle, Building2, Coins, Bitcoin } from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentGateway = 'paystack' | 'flutterwave' | 'bank-transfer' | 'utility-token' | 'crypto' | 'mock';
type Step = 'amount' | 'gateway' | 'summary' | 'processing' | 'success' | 'error';

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { formatAmount } = useCurrency();
  const VAT_RATE = 0.075; // 7.5%

  const { data: gatewayConfigs } = api.payment.getPaymentGateways.useQuery(undefined, {
    enabled: isOpen,
  });
  const enabledByName = new Map(
    (gatewayConfigs ?? []).map((g) => [g.gatewayName, g.isActive] as const),
  );
  const isEnabled = (gateway: PaymentGateway, fallback: boolean) => {
    const enabled = enabledByName.get(gateway);
    if (enabled === undefined) return fallback;
    return enabled;
  };

  const depositMutation = api.wallet.deposit.useMutation({
    onSuccess: (data) => {
      setSuccessData(data);
      setCurrentStep('success');
    },
    onError: (error) => {
      setError(error.message);
      setCurrentStep('error');
    }
  });

  const gateways = [
    {
      id: 'paystack' as PaymentGateway,
      name: 'Paystack',
      description: 'Cards, Bank Transfer, USSD',
      icon: CreditCard,
      available: isEnabled('paystack', false),
      badge: isEnabled('paystack', false) ? 'Active' : 'Coming Soon'
    },
    {
      id: 'flutterwave' as PaymentGateway,
      name: 'Flutterwave',
      description: 'International Payments',
      icon: DollarSign,
      available: isEnabled('flutterwave', false),
      badge: isEnabled('flutterwave', false) ? 'Active' : 'Coming Soon'
    },
    {
      id: 'bank-transfer' as PaymentGateway,
      name: 'Bank Transfer',
      description: 'Direct bank transfer with verification',
      icon: Building2,
      available: isEnabled('bank-transfer', false),
      badge: isEnabled('bank-transfer', false) ? 'Active' : 'Coming Soon'
    },
    {
      id: 'utility-token' as PaymentGateway,
      name: 'Utility Tokens',
      description: 'Approved utility token payment',
      icon: Coins,
      available: isEnabled('utility-token', false),
      badge: isEnabled('utility-token', false) ? 'Active' : 'Coming Soon'
    },
    {
      id: 'crypto' as PaymentGateway,
      name: 'Cryptocurrency',
      description: 'BTC, USDT, and supported crypto',
      icon: Bitcoin,
      available: isEnabled('crypto', false),
      badge: isEnabled('crypto', false) ? 'Active' : 'Coming Soon'
    },
    {
      id: 'mock' as PaymentGateway,
      name: 'Mock Payment',
      description: 'Testing Only - Instant',
      icon: Wallet,
      available: isEnabled('mock', true),
      badge: isEnabled('mock', true) ? 'Active' : 'Coming Soon'
    }
  ];

  const numAmount = parseFloat(amount) || 0;
  const vatAmount = numAmount * VAT_RATE;
  const totalAmount = numAmount + vatAmount;

  const handleAmountNext = () => {
    if (numAmount < 1) {
      setError('Please enter an amount of at least ₦1');
      return;
    }
    setError('');
    setCurrentStep('gateway');
  };

  const handleGatewayNext = () => {
    if (!selectedGateway) {
      setError('Please select a payment gateway');
      return;
    }
    setError('');
    setCurrentStep('summary');
  };

  const handleConfirm = () => {
    if (!selectedGateway) return;
    setCurrentStep('processing');
    depositMutation.mutate({
      amount: numAmount,
      paymentGateway: selectedGateway,
      reference: `DEP-${Date.now()}`
    });
  };

  const handleReset = () => {
    setCurrentStep('amount');
    setAmount('');
    setSelectedGateway(null);
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
      <div className="sticky top-0 z-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Deposit Funds</h1>
                <p className="text-emerald-100 text-sm">Add money to your BPI wallet instantly</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            <div className={`flex items-center gap-2 ${currentStep === 'amount' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'amount' ? 'bg-white text-green-600' : 
                ['gateway', 'summary', 'processing', 'success'].includes(currentStep) ? 'bg-white/30' : 'bg-white/10'
              }`}>
                {['gateway', 'summary', 'processing', 'success'].includes(currentStep) ? <FiCheck /> : '1'}
              </div>
              <span className="text-sm font-medium">Amount</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-2 ${currentStep === 'gateway' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'gateway' ? 'bg-white text-green-600' : 
                ['summary', 'processing', 'success'].includes(currentStep) ? 'bg-white/30' : 'bg-white/10'
              }`}>
                {['summary', 'processing', 'success'].includes(currentStep) ? <FiCheck /> : '2'}
              </div>
              <span className="text-sm font-medium">Gateway</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-2 ${currentStep === 'summary' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'summary' ? 'bg-white text-green-600' : 
                ['processing', 'success'].includes(currentStep) ? 'bg-white/30' : 'bg-white/10'
              }`}>
                {['processing', 'success'].includes(currentStep) ? <FiCheck /> : '3'}
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step 1: Enter Amount */}
        {currentStep === 'amount' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">How much would you like to deposit?</h2>
              <p className="text-muted-foreground">Enter the amount you want to add to your wallet</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₦</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-12 pr-4 py-6 text-3xl font-bold text-center"
                  autoFocus
                />
              </div>

              {numAmount > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit Amount:</span>
                      <span className="font-semibold">{formatAmount(numAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT (7.5%):</span>
                      <span className="font-semibold text-orange-600">+{formatAmount(vatAmount)}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-300 dark:border-blue-700">
                      <div className="flex justify-between">
                        <span className="font-bold">Total to Pay:</span>
                        <span className="font-bold text-lg text-green-600">{formatAmount(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <FiAlertCircle />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleAmountNext}
                className="w-full mt-6 py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="lg"
              >
                Continue to Payment Gateway
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Gateway */}
        {currentStep === 'gateway' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Payment Gateway</h2>
              <p className="text-muted-foreground">Select your preferred payment method</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {gateways.map((gateway) => {
                const Icon = gateway.icon;
                const isSelected = selectedGateway === gateway.id;
                
                return (
                  <button
                    key={gateway.id}
                    onClick={() => gateway.available && setSelectedGateway(gateway.id)}
                    disabled={!gateway.available}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : gateway.available
                        ? 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{gateway.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{gateway.description}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        gateway.available
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {gateway.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 max-w-3xl mx-auto">
                <FiAlertCircle />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-4 max-w-3xl mx-auto">
              <Button
                onClick={() => setCurrentStep('amount')}
                variant="outline"
                className="flex-1 py-6"
                size="lg"
              >
                Back
              </Button>
              <Button
                onClick={handleGatewayNext}
                className="flex-1 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                Continue to Summary
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {currentStep === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Your Deposit</h2>
              <p className="text-muted-foreground">Review the details before proceeding</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-green-200 dark:border-green-700">
                    <span className="text-muted-foreground">Deposit Amount</span>
                    <span className="text-2xl font-bold text-green-600">{formatAmount(numAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">VAT (7.5%)</span>
                    <span className="font-semibold text-orange-600">+{formatAmount(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-green-200 dark:border-green-700">
                    <span className="font-bold text-lg">Total to Pay</span>
                    <span className="font-bold text-2xl text-green-600">{formatAmount(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  {selectedGateway && (
                    <>
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment via</p>
                        <p className="font-bold text-foreground">{gateways.find(g => g.id === selectedGateway)?.name}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Funds will be added to your main wallet</li>
                    <li>• VAT will be recorded in your tax history</li>
                    <li>• Transaction cannot be reversed after confirmation</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setCurrentStep('gateway')}
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
                  Confirm & Pay
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {currentStep === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
            <Loader2 className="w-20 h-20 text-green-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Payment...</h2>
            <p className="text-muted-foreground">Please wait while we process your deposit</p>
          </div>
        )}

        {/* Success */}
        {currentStep === 'success' && successData && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">Deposit Successful!</h2>
              <p className="text-muted-foreground">{successData.message}</p>
            </div>

            <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Deposited</span>
                  <span className="font-bold text-green-600">{formatAmount(successData.depositedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT Paid</span>
                  <span className="font-semibold">{formatAmount(successData.vatAmount)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-green-200 dark:border-green-700">
                  <span className="font-bold">Total Paid</span>
                  <span className="font-bold text-lg">{formatAmount(successData.totalPaid)}</span>
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
                Make Another Deposit
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
              <h2 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h2>
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
