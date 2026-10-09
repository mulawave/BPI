"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Heart, Plus, Search } from "lucide-react";
import { api } from "@/client/trpc";

const naira = (n: number) => `₦${n.toLocaleString()}`;

function SettingsCard() {
  const utils = api.useUtils();
  const { data, isLoading } = api.healthcare.adminGetSettings.useQuery();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = api.healthcare.adminSaveSettings.useMutation({
    onSuccess: () => {
      toast.success("Healthcare card settings saved");
      utils.healthcare.adminGetSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !form) return <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />;

  const field = (key: string, label: string, step = 1) => (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Card settings</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {field("price", "Subscription price (₦/year)", 1000)}
        {field("coverAmount", "Yearly cover (₦)", 10000)}
        {field("communityShare", "Share to Community Wallet (₦)")}
        {field("monthlyMinPct", "Monthly usage min (%)")}
        {field("monthlyMaxPct", "Monthly usage max (%)")}
        {field("requireRegularPlusFromTier", "Require Regular Plus from tier #")}
        {field("discountTier1to3Pct", "Discount, tiers 1-3 (%)")}
        {field("discountTier4to6Pct", "Discount, tiers 4-6 (%)")}
        {field("discountTier7PlusPct", "Discount, tier 7+ (%)")}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        The rest of the price (price − Community Wallet share) goes to the BPI Health &amp; Project Account.
      </p>
      <div className="flex justify-end">
        <button
          onClick={() => save.mutate(form)}
          disabled={save.isPending}
          className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
        >
          {save.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function CentresCard() {
  const utils = api.useUtils();
  const { data, isLoading } = api.healthcare.adminListCentres.useQuery();
  const [showCentreForm, setShowCentreForm] = useState(false);
  const [centreName, setCentreName] = useState("");
  const [centreLocation, setCentreLocation] = useState("");
  const [serviceForm, setServiceForm] = useState<{ centreId: string; name: string; price: number; discountOnly: boolean } | null>(null);

  const createCentre = api.healthcare.adminCreateCentre.useMutation({
    onSuccess: () => { toast.success("Centre added"); setShowCentreForm(false); setCentreName(""); setCentreLocation(""); utils.healthcare.adminListCentres.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const createService = api.healthcare.adminCreateService.useMutation({
    onSuccess: () => { toast.success("Service added"); setServiceForm(null); utils.healthcare.adminListCentres.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const toggleCentre = api.healthcare.adminToggleCentre.useMutation({
    onSuccess: () => utils.healthcare.adminListCentres.invalidate(),
  });
  const toggleService = api.healthcare.adminToggleService.useMutation({
    onSuccess: () => utils.healthcare.adminListCentres.invalidate(),
  });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">Centres &amp; services</h2>
        <button onClick={() => setShowCentreForm((v) => !v)} className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
          <Plus className="w-4 h-4" /> New centre
        </button>
      </div>

      {showCentreForm && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <input value={centreName} onChange={(e) => setCentreName(e.target.value)} placeholder="Centre name (e.g. BPI-CHS Lagos)" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
          <input value={centreLocation} onChange={(e) => setCentreLocation(e.target.value)} placeholder="Location (optional)" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
          <button
            onClick={() => createCentre.mutate({ name: centreName, location: centreLocation || undefined })}
            disabled={createCentre.isPending || centreName.trim().length < 2}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium disabled:opacity-50"
          >
            Add centre
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900" />
      ) : (
        (data ?? []).map((centre: any) => (
          <div key={centre.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{centre.name}</div>
                {centre.location && <div className="text-xs text-gray-500">{centre.location}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setServiceForm({ centreId: centre.id, name: "", price: 0, discountOnly: false })} className="text-xs text-sky-600 hover:underline">
                  + service
                </button>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={centre.isActive} onChange={(e) => toggleCentre.mutate({ centreId: centre.id, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
            </div>
            {serviceForm && serviceForm.centreId === centre.id && (
              <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 p-2 space-y-2">
                <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm!, name: e.target.value })} placeholder="Service name" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                <input type="number" min={0} value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm!, price: Math.max(0, Math.round(Number(e.target.value) || 0)) })} placeholder="Price" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={serviceForm.discountOnly} onChange={(e) => setServiceForm({ ...serviceForm!, discountOnly: e.target.checked })} />
                  Discount only (product — no cover deduction, member pays provider)
                </label>
                <button
                  onClick={() => createService.mutate(serviceForm!)}
                  disabled={createService.isPending || serviceForm.name.trim().length < 2}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium disabled:opacity-50"
                >
                  Add service
                </button>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {(centre.Services ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{s.name} {s.discountOnly && <em className="text-xs text-gray-400">(discount only)</em>} — {naira(s.price)}</span>
                  <input type="checkbox" checked={s.isActive} onChange={(e) => toggleService.mutate({ serviceId: s.id, isActive: e.target.checked })} />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function RedeemCard() {
  const [ssc, setSsc] = useState("");
  const [lookupSsc, setLookupSsc] = useState("");
  const [centreId, setCentreId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const { data: centres } = api.healthcare.adminListCentres.useQuery();
  const { data: lookup, isLoading } = api.healthcare.adminLookupCard.useQuery({ sscCode: lookupSsc }, { enabled: lookupSsc.length >= 3 });
  const redeem = api.healthcare.adminRedeemCard.useMutation({
    onSuccess: (res) => toast.success(`Recorded: ${res.discountPct}% discount, member pays ${naira(res.memberPays)}${res.coveredAmount > 0 ? `, ₦${res.coveredAmount.toLocaleString()} from cover` : ""}`),
    onError: (err) => toast.error(err.message),
  });
  const services = (centres ?? []).find((c: any) => c.id === centreId)?.Services ?? [];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Search className="w-4 h-4" /> Record a card use</h2>
      <div className="flex gap-2">
        <input value={ssc} onChange={(e) => setSsc(e.target.value)} placeholder="Scan or type the SSC code" className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
        <button onClick={() => setLookupSsc(ssc.trim())} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Find</button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Looking up...</p>}
      {lookupSsc && !isLoading && lookup === null && <p className="text-sm text-rose-600">No card found for that code.</p>}
      {lookup && (
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {lookup.card.User.name || lookup.card.User.email} — discount {lookup.discountPct}%, cover left {naira(lookup.card.coverAmount - lookup.card.coverUsed)}
          </p>
          <select value={centreId} onChange={(e) => { setCentreId(e.target.value); setServiceId(""); }} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
            <option value="">Select centre...</option>
            {(centres ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {centreId && (
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
              <option value="">Select service (optional)...</option>
              {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {naira(s.price)}</option>)}
            </select>
          )}
          <button
            onClick={() => redeem.mutate({ sscCode: lookup.card.sscCode, centreId, serviceId: serviceId || undefined })}
            disabled={redeem.isPending || !centreId}
            className="w-full py-2 rounded-lg bg-rose-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {redeem.isPending ? "Recording..." : "Record use"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminHealthcarePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Healthcare Card</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-600" />
            Healthcare Card
          </h1>
        </div>
        <SettingsCard />
        <CentresCard />
        <RedeemCard />
      </div>
    </div>
  );
}
