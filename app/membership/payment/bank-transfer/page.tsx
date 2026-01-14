"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Building2, 
  Copy, 
  CheckCircle, 
  ArrowLeft, 
  Moon, 
  Sun, 
  Loader2,
  AlertCircle,
  Upload
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { PaymentPurpose } from "@/server/services/payment";

type UploadSuccess = { success: true; proofUrl: string; message?: string };

function isUploadSuccess(value: unknown): value is UploadSuccess {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.success === true && typeof v.proofUrl === "string" && v.proofUrl.length > 0;
}

function getUploadError(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  return typeof v.error === "string" ? v.error : null;
}

export default function BankTransferPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { formatAmount } = useCurrency();

  const packageId = searchParams?.get('packageId');
  const amount = Number(searchParams?.get('amount') || 0);
  const isUpgrade = searchParams?.get('upgrade') === 'true';
  const [copied, setCopied] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const submitProofMutation = api.payment.submitBankTransferProof.useMutation({
    onSuccess: () => {
      toast.success("Proof submitted. Awaiting admin verification.");
      router.push("/membership");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  // BeepAgro Bank Details (Nigeria)
  const bankDetails = {
    bankName: "First Bank of Nigeria",
    accountNumber: "2013456789",
    accountName: "BeepAgro Africa Ltd",
    swiftCode: "FBNINGLA",
    sortCode: "011152305"
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleProofUpload = async () => {
    if (!packageId || !amount) {
      toast.error("Missing payment details. Please go back and try again.");
      return;
    }

    if (!proofFile) {
      toast.error("Please select a receipt file to upload.");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Uploading proof...");

    try {
      const form = new FormData();
      form.append("proof", proofFile);

      const res = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: form,
      });

      const json = (await res.json()) as unknown;

      if (!res.ok || !isUploadSuccess(json)) {
        toast.dismiss(loadingToast);
        toast.error(getUploadError(json) || "Failed to upload proof");
        return;
      }

      toast.dismiss(loadingToast);

      const purpose = isUpgrade ? PaymentPurpose.UPGRADE : PaymentPurpose.MEMBERSHIP;

      await submitProofMutation.mutateAsync({
        amount,
        currency: "NGN",
        purpose,
        packageId,
        isUpgrade,
        fromPackageId: searchParams?.get("from") || undefined,
        proofUrl: json.proofUrl,
      });
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Header */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                  BeepAgro Africa
                </h1>
                <p className="text-sm text-muted-foreground">Bank Transfer Payment</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bank Transfer Payment</h1>
          <p className="text-muted-foreground">
            Transfer {formatAmount(amount)} to complete your {isUpgrade ? 'membership upgrade' : 'membership activation'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-bpi-dark-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Transfer To:</h2>
              
              <div className="space-y-4">
                {/* Amount to Transfer */}
                <div className="p-4 bg-gradient-to-r from-bpi-primary/10 to-bpi-secondary/10 rounded-lg border-2 border-bpi-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount to Transfer</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">
                        {formatAmount(amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(amount.toString(), 'Amount')}
                      className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      {copied === 'Amount' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
                      <p className="text-lg font-semibold text-foreground">{bankDetails.bankName}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(bankDetails.bankName, 'Bank Name')}
                      className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied === 'Bank Name' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Number */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                      <p className="text-lg font-semibold text-foreground font-mono">{bankDetails.accountNumber}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(bankDetails.accountNumber, 'Account Number')}
                      className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied === 'Account Number' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Name */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                      <p className="text-lg font-semibold text-foreground">{bankDetails.accountName}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(bankDetails.accountName, 'Account Name')}
                      className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copied === 'Account Name' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Proof of Payment */}
              <div className="mt-8">
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-bpi-primary/10 file:text-bpi-primary hover:file:bg-bpi-primary/20"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Accepted: JPG/PNG/GIF/WEBP or PDF (max 10MB)
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={handleProofUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Payment Proof
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-bpi-dark-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Important Instructions</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-bpi-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Transfer the <strong className="text-foreground">exact amount</strong> shown above to avoid delays
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-bpi-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use your <strong className="text-foreground">registered name</strong> or email as transfer reference
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-bpi-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload proof of payment after completing the transfer
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-bpi-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    4
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your membership will be activated within <strong className="text-foreground">24 hours</strong> after verification
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Need Help?
                  </p>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Contact support@beepagro.africa if you encounter any issues
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
