"use client";

import React from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Heart, Shield } from "lucide-react";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${n.toLocaleString()}`;

export default function HealthcareCardPage() {
  const utils = api.useUtils();
  const { data, isLoading } = api.healthcare.getMyCard.useQuery();
  const { data: promoEnabled } = api.healthcare.getPromoBundleEnabled.useQuery();

  const subscribe = api.healthcare.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Healthcare card activated!");
      utils.healthcare.getMyCard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const subscribePromo = api.healthcare.subscribePromoBundle.useMutation({
    onSuccess: () => {
      toast.success("Promotional bundle activated!");
      utils.healthcare.getMyCard.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !data) {
    return <div className="max-w-xl mx-auto p-6"><div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /></div>;
  }

  const card = data.card;
  const isActive = card && card.status === "active" && new Date(card.expiresAt) > new Date();
  const coverRemaining = card ? card.coverAmount - card.coverUsed : data.coverAmount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <Heart className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BPI National Healthcare and Neuro Therapy SPA Card</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {naira(data.price)}/year for {naira(data.coverAmount)} of health cover at BPI-affiliated centres, plus a
            {" "}{data.discountPct}% discount on covered services.
          </p>
        </div>

        {!data.eligible && !isActive && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
            Regular Plus or a higher membership package is required for the healthcare card at your current tier.
          </div>
        )}

        {isActive ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center space-y-4">
            {data.qrDataUrl && (
              <Image src={data.qrDataUrl} alt="Card QR code" width={180} height={180} className="mx-auto rounded-lg" unoptimized />
            )}
            <div>
              <div className="text-xs uppercase text-gray-400 tracking-wide">BPI Social Security Code</div>
              <div className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{card!.sscCode}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Cover remaining</div>
                <div className="font-semibold text-gray-900 dark:text-white">{naira(coverRemaining)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">Your discount</div>
                <div className="font-semibold text-gray-900 dark:text-white">{data.discountPct}%</div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Valid until {new Date(card!.expiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.
              Renew any time to reset your cover.
            </p>
            <button
              onClick={() => subscribe.mutate()}
              disabled={subscribe.isPending}
              className="w-full py-2.5 rounded-lg border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
            >
              {subscribe.isPending ? "Renewing..." : `Renew now (${naira(data.price)})`}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center space-y-4">
            <Shield className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {card ? "Your card has expired. Renew to get a fresh cover." : "You don't have a healthcare card yet."}
            </p>
            <button
              onClick={() => subscribe.mutate()}
              disabled={subscribe.isPending || !data.eligible}
              className="w-full py-2.5 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
            >
              {subscribe.isPending ? "Processing..." : `Subscribe for ${naira(data.price)}`}
            </button>
            {promoEnabled && (
              <>
                <p className="text-xs text-gray-400">or</p>
                <button
                  onClick={() => subscribePromo.mutate()}
                  disabled={subscribePromo.isPending}
                  className="w-full py-2.5 rounded-lg border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                >
                  {subscribePromo.isPending ? "Processing..." : `Promotional Activation — ${naira(data.price)} (includes free membership if you have none)`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
