"use client";

import { useState } from "react";
import { Copy, CheckCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Bitcoin } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

interface CryptoTransferDetailsProps {
  showCopy?: boolean;
  className?: string;
  amount?: number;
  currency?: string;
}

function DetailRow({
  label,
  value,
  copied,
  onCopy,
  showCopy,
  emphasize,
  monospace,
  warning,
}: {
  label: string;
  value?: string | null;
  copied: string | null;
  onCopy?: (value: string, label: string) => void;
  showCopy: boolean;
  emphasize?: boolean;
  monospace?: boolean;
  warning?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={`p-4 rounded-lg ${warning ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-gray-800/50"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p
            className={`${emphasize ? "text-lg font-semibold" : "text-base font-medium"} text-foreground ${monospace ? "font-mono tracking-wide break-all" : ""}`}
          >
            {value}
          </p>
        </div>
        {showCopy && value ? (
          <button
            onClick={() => onCopy?.(value, label)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
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

export default function CryptoTransferDetails({
  showCopy = true,
  className,
  amount,
  currency = "USDT",
}: CryptoTransferDetailsProps) {
  const { data, isLoading, isError } = api.payment.getCryptoDepositInfo.useQuery();

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className={className || "space-y-3"}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading crypto details...</span>
        </div>
      </div>
    );
  }

  if (isError || !data?.available) {
    return (
      <div className={className || "space-y-3"}>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span>Crypto payments are not currently available.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className || "space-y-3"}>
      {/* Network badge */}
      <div className="flex items-center gap-2 mb-1">
        <Bitcoin className="w-5 h-5 text-orange-500" />
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          {data.tokenName} ({data.network})
        </span>
      </div>

      <DetailRow
        label="Deposit Address"
        value={data.depositAddress}
        copied={copied}
        onCopy={handleCopy}
        showCopy={showCopy}
        emphasize
        monospace
      />

      <DetailRow
        label="Network"
        value={data.network}
        copied={copied}
        onCopy={handleCopy}
        showCopy={false}
      />

      <DetailRow
        label="Token"
        value={`${data.tokenName} (${data.tokenSymbol})`}
        copied={copied}
        onCopy={handleCopy}
        showCopy={false}
      />

      {/* Prefer provider-supplied crypto amount when available, else use prop amount */}
      {(() => {
        const providerAmount = (data as any)?.amountCrypto as number | undefined;
        const displayAmount = typeof providerAmount === 'number' ? providerAmount : amount;
        if (displayAmount != null && displayAmount > 0) {
          return (
            <DetailRow
              label={`Amount to Send (${currency})`}
              value={`${Number(displayAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${currency}`}
              copied={copied}
              onCopy={(v) => handleCopy(String(displayAmount), "Amount")}
              showCopy={showCopy}
              emphasize
              warning
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
