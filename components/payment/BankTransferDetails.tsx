"use client";

import { useState } from "react";
import { Copy, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

type BankSettingValue = { value?: string } | undefined;

type BankSettings = {
  bank_name?: BankSettingValue;
  bank_account_number?: BankSettingValue;
  bank_account_name?: BankSettingValue;
};

interface BankTransferDetailsProps {
  bankDetails?: BankSettings | null;
  showCopy?: boolean;
  className?: string;
  onCopied?: (value: string, label: string) => void;
  reference?: string;
  referenceLabel?: string;
  showReference?: boolean;
}

function DetailRow({
  label,
  value,
  copied,
  onCopy,
  showCopy,
  emphasize,
  monospace,
}: {
  label: string;
  value?: string;
  copied: string | null;
  onCopy?: (value: string, label: string) => void;
  showCopy: boolean;
  emphasize?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p
            className={`${emphasize ? "text-lg font-semibold" : "text-base font-medium"} text-foreground ${monospace ? "font-mono tracking-wide" : ""}`}
          >
            {value || "Not configured"}
          </p>
        </div>
        {showCopy && value ? (
          <button
            onClick={() => onCopy?.(value, label)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={`Copy ${label}`}
          >
            {copied === label ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function BankTransferDetails({
  bankDetails,
  showCopy = true,
  className,
  onCopied,
  reference,
  referenceLabel = "Reference",
  showReference = false,
}: BankTransferDetailsProps) {
  const { data, isLoading, isError } = api.config.getPublicSettings.useQuery(undefined, {
    enabled: !bankDetails,
  });

  const resolved = bankDetails ?? data ?? undefined;
  const bankName = resolved?.bank_name?.value;
  const accountNumber = resolved?.bank_account_number?.value;
  const accountName = resolved?.bank_account_name?.value;

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    onCopied?.(value, label);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className={className || "space-y-3"}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading bank details...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className || "space-y-3"}>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span>Unable to load bank details. Please try again.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className || "space-y-3"}>
      {showReference && reference ? (
        <DetailRow
          label={referenceLabel}
          value={reference}
          copied={copied}
          onCopy={handleCopy}
          showCopy={showCopy}
          emphasize
          monospace
        />
      ) : null}

      <DetailRow
        label="Bank Name"
        value={bankName}
        copied={copied}
        onCopy={handleCopy}
        showCopy={showCopy}
        emphasize
      />

      <DetailRow
        label="Account Number"
        value={accountNumber}
        copied={copied}
        onCopy={handleCopy}
        showCopy={showCopy}
        emphasize
        monospace
      />

      <DetailRow
        label="Account Name"
        value={accountName}
        copied={copied}
        onCopy={handleCopy}
        showCopy={showCopy}
      />
    </div>
  );
}
