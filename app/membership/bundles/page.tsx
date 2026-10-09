"use client";

import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Gift, Heart, ArrowLeft } from "lucide-react";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${n.toLocaleString()}`;

export default function MembershipBundlesPage() {
  const utils = api.useUtils();

  const { data: regularPlusPackage } = api.package.getPackages.useQuery(undefined, {
    select: (packages) => packages.find((p: any) => p.name === "Regular Plus") ?? null,
  });

  const { data: promoEnabled, isLoading: loadingPromoEnabled } = api.healthcare.getPromoBundleEnabled.useQuery();
  const { data: healthcareSettings } = api.healthcare.getSettings.useQuery();

  const cspBundle = api.package.purchaseCspActivationBundleViaWallet.useMutation({
    onSuccess: () => {
      toast.success("CSP Activation bundle complete!");
      utils.package.getUserActiveMembership.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const healthcareBundle = api.healthcare.subscribePromoBundle.useMutation({
    onSuccess: () => {
      toast.success("Promotional Healthcare Card activated!");
      utils.healthcare.getMyCard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const cspBundleTotal = regularPlusPackage ? regularPlusPackage.price + regularPlusPackage.vat + 10000 : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/membership" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-4 h-4" /> Back to membership
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Two Ways to Begin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Paid from your Main Wallet balance. Deposit funds first from Wallet → Deposit if you need to.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-rose-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Option 1: BPI Regular Plus and CSP Activation {cspBundleTotal ? `— ${naira(cspBundleTotal)}` : ""}
            </h2>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
            <li>BPI Regular Plus Membership (normal referral commissions apply)</li>
            <li>A ₦10,000 CSP contribution, credited to your Community Wallet</li>
            <li>Access to the CSP qualification process once KYC and Auto-Debit/Auto-Contribute are active</li>
          </ul>
          <button
            onClick={() => cspBundle.mutate()}
            disabled={cspBundle.isPending || !regularPlusPackage}
            className="w-full py-2.5 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
          >
            {cspBundle.isPending ? "Processing..." : "Activate Option 1"}
          </button>
        </div>

        {!loadingPromoEnabled && promoEnabled && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Option 2: Promotional Healthcare Card Activation {healthcareSettings ? `— ${naira(healthcareSettings.price)}` : ""}
              </h2>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
              <li>Activate the BPI National Healthcare and Neuro Therapy SPA Card</li>
              <li>Free promotional BPI Regular Membership, if you don't already have one</li>
              <li>Eligible centre-use benefits of up to {healthcareSettings ? naira(healthcareSettings.coverAmount) : "₦300,000"}</li>
              <li>₦10,000 credited to your Community Wallet towards CSP activation</li>
            </ul>
            <button
              onClick={() => healthcareBundle.mutate()}
              disabled={healthcareBundle.isPending}
              className="w-full py-2.5 rounded-lg border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
            >
              {healthcareBundle.isPending ? "Processing..." : "Activate Option 2"}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400">
          The promotional offer is limited and remains subject to availability and applicable terms.
        </p>
      </div>
    </div>
  );
}
