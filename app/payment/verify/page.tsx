"use client";

import { api } from "@/client/trpc";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import toast from "react-hot-toast";
import { PaymentGateway } from "@/server/services/payment/types";

type VerifyStatus = "verifying" | "success" | "error" | "missing-params";

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();

  const gateway = searchParams?.get("gateway") as string | null;
  const reference = searchParams?.get("ref") as string | null;
  const errorMessage = searchParams?.get("message") as string | null;

  const [status, setStatus] = useState<VerifyStatus>(
    errorMessage ? "error" : !gateway || !reference ? "missing-params" : "verifying"
  );
  const [message, setMessage] = useState(errorMessage || "");
  const [transactionType, setTransactionType] = useState<string | null>(null);
  const verifyAttempted = useRef(false);

  const verifyMutation = api.package.verifyExternalPayment.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setTransactionType(data.transactionType);
      if (data.alreadyProcessed) {
        setMessage(data.message || "Payment already processed.");
        toast.success("Payment already activated!");
      } else {
        setMessage(data.message || "Payment verified and activated!");
        toast.success(data.message || "Payment activated successfully!");
      }
      // Redirect to dashboard after showing success
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Payment verification failed. Please contact support.");
      toast.error(err.message || "Verification failed");
    },
  });

  useEffect(() => {
    if (verifyAttempted.current) return;
    if (!gateway || !reference) return;
    if (errorMessage) return;

    verifyAttempted.current = true;

    // Map gateway string to PaymentGateway enum
    const gatewayMap: Record<string, PaymentGateway> = {
      paystack: PaymentGateway.PAYSTACK,
      flutterwave: PaymentGateway.FLUTTERWAVE,
    };

    const gatewayEnum = gatewayMap[gateway.toLowerCase()];
    if (!gatewayEnum) {
      setStatus("error");
      setMessage(`Unknown payment gateway: ${gateway}`);
      return;
    }

    verifyMutation.mutate({ gateway: gatewayEnum, reference });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, reference, errorMessage]);

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white dark:bg-bpi-dark-card p-8 text-center shadow-xl border border-bpi-border/30 dark:border-bpi-dark-accent/30">
        {/* Verifying State */}
        {status === "verifying" && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-white dark:bg-bpi-dark-card rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-bpi-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Verifying Your Payment
            </h2>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your payment with{" "}
              {gateway === "paystack" ? "Paystack" : "Flutterwave"}...
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {message}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Redirecting to dashboard...
            </div>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Payment Verification Issue
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {message || "We couldn't verify your payment. If you were charged, please contact support with your reference number."}
            </p>
            {reference && (
              <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted/50 dark:bg-muted/20 rounded px-3 py-2">
                Ref: {reference}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-to-r from-bpi-primary to-bpi-secondary text-white"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/membership")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Membership
              </Button>
            </div>
          </>
        )}

        {/* Missing Params State */}
        {status === "missing-params" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Invalid Payment Link
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This payment verification link is missing required information. If you completed a payment, please check your dashboard or contact support.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-bpi-primary to-bpi-secondary text-white"
            >
              Go to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
