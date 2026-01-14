// Payment Modal Component
// Modal for processing payments with method selection and status

"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "./PaymentMethodSelector";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  purpose: string;
  packageName?: string;
  walletBalance?: number;
  availableMethods?: PaymentMethod[];
  recommendedMethod?: PaymentMethod;
  testMode?: boolean;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: string) => void;
  processPayment: (method: PaymentMethod) => Promise<any>;
}

type PaymentState = "selecting" | "processing" | "success" | "error";

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  currency = "NGN",
  purpose,
  packageName,
  walletBalance = 0,
  availableMethods,
  recommendedMethod,
  testMode = true,
  onPaymentSuccess,
  onPaymentError,
  processPayment,
}: PaymentModalProps) {
  const { formatAmount } = useCurrency();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(
    recommendedMethod
  );
  const [paymentState, setPaymentState] = useState<PaymentState>("selecting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  if (!isOpen) return null;

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      setErrorMessage("Please select a payment method");
      return;
    }

    setPaymentState("processing");
    setErrorMessage("");

    try {
      const result = await processPayment(selectedMethod);

      if (result.success) {
        setPaymentState("success");
        setPaymentResult(result);
        onPaymentSuccess?.(result);
      } else {
        setPaymentState("error");
        setErrorMessage(result.error || result.message || "Payment failed");
        onPaymentError?.(result.error || "Payment failed");
      }
    } catch (error) {
      setPaymentState("error");
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(errorMsg);
      onPaymentError?.(errorMsg);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setPaymentState("selecting");
    setSelectedMethod(recommendedMethod);
    setErrorMessage("");
    setPaymentResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={paymentState === "processing"}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Package Details */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">You are paying for:</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {packageName || purpose}
            </p>
          </div>

          {/* Payment Selection State */}
          {paymentState === "selecting" && (
            <>
              <PaymentMethodSelector
                methods={availableMethods || []}
                selectedMethod={selectedMethod?.id}
                onSelect={(methodId) => {
                  const method = (availableMethods || []).find(m => m.id === methodId);
                  setSelectedMethod(method);
                }}
              />

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={!selectedMethod}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Proceed to Pay
                </button>
              </div>
            </>
          )}

          {/* Processing State */}
          {paymentState === "processing" && (
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mx-auto" />
              <p className="text-lg font-semibold text-gray-900 mt-4">
                Processing Payment...
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Please wait while we process your payment
              </p>
            </div>
          )}

          {/* Success State */}
          {paymentState === "success" && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-4">
                Payment Successful!
              </p>
              <p className="text-gray-600 mt-2">
                Your payment of {formatAmount(amount)} has been processed successfully.
              </p>

              {paymentResult?.balanceAfter !== undefined && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">New Wallet Balance</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatAmount(paymentResult.balanceAfter)}
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error State */}
          {paymentState === "error" && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-4">
                Payment Failed
              </p>
              <p className="text-red-600 mt-2">{errorMessage}</p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPaymentState("selecting")}
                  className="flex-1 rounded-lg border border-emerald-600 px-4 py-3 font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
