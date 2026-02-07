"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiCreditCard, FiSearch, FiUser, FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";

type EmpowermentType = "CHILD_EDUCATION" | "VOCATIONAL_SKILL";
type Gateway = "wallet" | "paystack" | "flutterwave";

const PACKAGE_FEE = 330000;
const VAT = 24750;
const TOTAL_COST = PACKAGE_FEE + VAT;

export default function EmpowermentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatAmount } = useCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    screenName?: string | null;
  } | null>(null);
  const [empowermentType, setEmpowermentType] = useState<EmpowermentType>("CHILD_EDUCATION");
  const [gateway, setGateway] = useState<Gateway>("wallet");
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [pendingGateway, setPendingGateway] = useState<Gateway | null>(null);

  const { data: gatewayConfigs } = api.payment.getPaymentGateways.useQuery();
  const enabledByName = useMemo(
    () => new Map((gatewayConfigs ?? []).map((g) => [g.gatewayName, g.isActive] as const)),
    [gatewayConfigs]
  );

  const isEnabled = (gatewayKey: Gateway, fallback: boolean) => {
    const enabled = enabledByName.get(gatewayKey);
    if (enabled === undefined) return fallback;
    return enabled;
  };

  const { data: searchResults = [], isFetching: isSearching } = api.user.searchUsers.useQuery(
    { term: searchTerm.trim(), limit: 8 },
    { enabled: searchTerm.trim().length >= 2 }
  );

  const activateEmpowerment = api.package.activateEmpowerment.useMutation({
    onSuccess: (data: any) => {
      if (data?.paymentUrl) {
        setPendingReference(data.reference || null);
        setPendingGateway((data.gateway as Gateway) || null);
        toast.success("Payment initiated. Complete payment to activate the package.");
        window.open(data.paymentUrl, "_blank");
        return;
      }
      toast.success(data?.message || "Empowerment package activated successfully.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate empowerment package.");
    },
  });

  const verifyEmpowerment = api.package.verifyEmpowermentPayment.useMutation({
    onSuccess: (data) => {
      toast.success(data?.message || "Empowerment package activated successfully.");
      setPendingReference(null);
      setPendingGateway(null);
      router.replace("/empowerment");
    },
    onError: (error) => {
      toast.error(error.message || "Payment verification failed.");
    },
  });

  useEffect(() => {
    const gatewayParam = searchParams?.get("gateway") as Gateway | null;
    const referenceParam =
      searchParams?.get("reference") ||
      searchParams?.get("tx_ref") ||
      searchParams?.get("trxref") ||
      searchParams?.get("ref");
    const status = searchParams?.get("status");

    if (!gatewayParam || !referenceParam) return;
    if (status && status !== "successful" && status !== "success") return;

    verifyEmpowerment.mutate({
      gateway: gatewayParam === "paystack" ? "paystack" : "flutterwave",
      reference: referenceParam,
    });
  }, [searchParams, verifyEmpowerment, router]);

  const canSubmit = selectedUser && !activateEmpowerment.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-bpi-dark-bg dark:via-bpi-dark-card/40 dark:to-bpi-dark-bg">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-600/80 dark:text-emerald-300">Empowerment activation</p>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Child Educational / Vocational Support Package</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sponsor a beneficiary, choose the empowerment type, and complete payment to activate the 24-month empowerment cycle.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-emerald-200/40 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-emerald-700/40 dark:bg-bpi-dark-card/70">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                <FiUser />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Select beneficiary</h2>
                <p className="text-xs text-muted-foreground">Search by name, email, or username.</p>
              </div>
            </div>

            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Start typing to search beneficiaries"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm.trim().length >= 2 && (
              <div className="mt-4 space-y-3">
                {isSearching ? (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches found.</p>
                ) : (
                  <div className="grid gap-3">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          selectedUser?.id === user.id
                            ? "border-emerald-500 bg-emerald-50/70 dark:border-emerald-400 dark:bg-emerald-900/30"
                            : "border-emerald-100/60 bg-white/80 hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-bpi-dark-card/60"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        {selectedUser?.id === user.id && (
                          <FiCheckCircle className="text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedUser && (
              <div className="mt-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-100">
                <div className="flex items-center gap-3">
                  <FiUserPlus />
                  <div>
                    <p className="font-semibold">Selected beneficiary</p>
                    <p className="text-xs opacity-80">{selectedUser.name || selectedUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Empowerment type</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "CHILD_EDUCATION", label: "Child Education" },
                    { id: "VOCATIONAL_SKILL", label: "Vocational Skill" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setEmpowermentType(option.id as EmpowermentType)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        empowermentType === option.id
                          ? "border-emerald-500 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-100"
                          : "border-emerald-100/60 bg-white/80 text-foreground hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-bpi-dark-card/60"
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-muted-foreground">24-month empowerment cycle</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Payment gateway</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "wallet", label: "Wallet" },
                    { id: "paystack", label: "Paystack" },
                    { id: "flutterwave", label: "Flutterwave" },
                  ].map((option) => {
                    const available = option.id === "wallet" ? true : isEnabled(option.id as Gateway, false);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={!available}
                        onClick={() => setGateway(option.id as Gateway)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          gateway === option.id
                            ? "border-emerald-500 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-100"
                            : "border-emerald-100/60 bg-white/80 text-foreground hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-bpi-dark-card/60"
                        } ${!available ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <FiCreditCard className="text-base" />
                          <span className="font-semibold">{option.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {available ? "Available" : "Unavailable"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Total due</p>
                <p className="text-2xl font-semibold text-foreground">{formatAmount(TOTAL_COST, 0)}</p>
                <p className="text-xs text-muted-foreground">Includes VAT ({formatAmount(VAT, 0)})</p>
              </div>
              <Button
                size="lg"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!canSubmit}
                onClick={() => {
                  if (!selectedUser) {
                    toast.error("Select a beneficiary to continue.");
                    return;
                  }
                  activateEmpowerment.mutate({
                    beneficiaryId: selectedUser.id,
                    empowermentType,
                    gateway,
                  });
                }}
              >
                <FiCreditCard /> Activate empowerment
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-200/40 bg-white/80 p-6 shadow-xl backdrop-blur dark:border-emerald-700/40 dark:bg-bpi-dark-card/70">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                <FiCheckCircle />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Verification</h2>
                <p className="text-xs text-muted-foreground">Confirm completed Paystack or Flutterwave payments.</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                After completing payment, return here to confirm activation. If your gateway redirected you back,
                verification will run automatically.
              </p>
            </div>

            {pendingReference && pendingGateway && (
              <div className="mt-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/30 dark:text-emerald-100">
                <p className="font-semibold">Pending payment detected</p>
                <p className="text-xs opacity-80">Reference: {pendingReference}</p>
                <Button
                  className="mt-3 w-full gap-2"
                  onClick={() =>
                    verifyEmpowerment.mutate({
                      gateway: pendingGateway,
                      reference: pendingReference,
                      beneficiaryId: selectedUser?.id,
                      empowermentType,
                    })
                  }
                  disabled={verifyEmpowerment.isLoading}
                >
                  <FiCheckCircle /> Verify payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}