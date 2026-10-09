"use client";

import { Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${Math.round(n).toLocaleString()}`;

/**
 * Renewal Reserve balance card. Fed automatically by a share of Auto-Debit
 * on referral commissions and the CSP sponsor share; pays membership
 * renewals first, before the Main Wallet. Members may only move the amount
 * above the admin-set floor to their Main Wallet (corporate decision,
 * follow-up Q5-Q7).
 */
export default function RenewalReserveCard() {
  const utils = api.useUtils();
  const { data, isLoading } = api.wallet.getReserveBalance.useQuery();
  const withdraw = api.wallet.withdrawReserve.useMutation({
    onSuccess: (res) => {
      toast.success(`Moved ₦${res.amount.toLocaleString()} to your Main Wallet`);
      utils.wallet.getReserveBalance.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !data) {
    return <div className="animate-pulse h-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Renewal Reserve</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pays your membership renewal before your Main Wallet</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{naira(data.balance)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            You can move {naira(data.withdrawable)} to your Main Wallet. The first {naira(data.withdrawalFloor)} always stays
            in the Reserve for your next renewal.
          </p>
        </div>
        <button
          onClick={() => withdraw.mutate()}
          disabled={data.withdrawable <= 0 || withdraw.isPending}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {withdraw.isPending ? "Moving..." : "Move to Main Wallet"}
        </button>
      </div>
    </div>
  );
}
