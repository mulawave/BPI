// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import Link from "next/link";
import { format } from "date-fns";
import { Award, ScrollText, Plus, Save, RefreshCw, Gift } from "lucide-react";

export default function AdminCspDonationsPage() {
  const [page, setPage] = useState(1);
  const donationsQuery = api.csp.adminListCspDonations.useQuery({ page, limit: 20 });
  const categoriesQuery = api.csp.adminListDonationBadgeCategories.useQuery();

  // Record-donation form
  const [form, setForm] = useState({
    donorName: "",
    amount: "",
    donorEmail: "",
    organization: "",
    donorUserId: "",
    recognitionPref: "public" as "public" | "private" | "anonymous",
  });

  const recordMutation = api.csp.recordCspDonation.useMutation({
    onSuccess: () => {
      toast.success("Donation recorded and badge issued");
      setForm({ donorName: "", amount: "", donorEmail: "", organization: "", donorUserId: "", recognitionPref: "public" });
      donationsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Badge categories editor
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    if (categoriesQuery.data) setCategories(categoriesQuery.data.map((c: any) => ({ ...c })));
  }, [categoriesQuery.data]);

  const upsertCategoriesMutation = api.csp.adminUpsertDonationBadgeCategories.useMutation({
    onSuccess: () => {
      toast.success("Badge categories saved");
      categoriesQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCategory = (idx: number, field: string, value: any) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      { name: "", minAmount: 0, maxAmount: null, badgeType: "", coolingReductionMonths: 0, isActive: true, sortOrder: prev.length },
    ]);
  };

  const saveCategories = () => {
    const payload = categories.map((c) => ({
      id: c.id,
      name: c.name.trim(),
      minAmount: Number(c.minAmount) || 0,
      maxAmount: c.maxAmount === null || c.maxAmount === "" ? null : Number(c.maxAmount),
      badgeType: c.badgeType.trim(),
      coolingReductionMonths: Number(c.coolingReductionMonths) || 0,
      isActive: !!c.isActive,
      sortOrder: c.sortOrder,
    }));
    if (payload.some((c) => !c.name || !c.badgeType)) {
      toast.error("Each category needs a name and badge type");
      return;
    }
    upsertCategoriesMutation.mutate({ categories: payload });
  };

  const submitDonation = () => {
    const amount = Number(form.amount);
    if (!form.donorName.trim() || form.donorName.trim().length < 2) return toast.error("Donor name required");
    if (!amount || amount <= 0) return toast.error("Amount must be greater than 0");
    recordMutation.mutate({
      donorName: form.donorName.trim(),
      amount,
      donorEmail: form.donorEmail.trim() || null,
      organization: form.organization.trim() || null,
      donorUserId: form.donorUserId.trim() || null,
      recognitionPref: form.recognitionPref,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">CSP Donations</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            CSP Donations & Recognition Badges
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record philanthropic donations, issue permanent Time Reduction Badges, and manage badge tiers.
          </p>
        </div>

        {/* Record a donation */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-500" /> Record a Donation
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Donor Name *">
              <input className={inputCls} value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} placeholder="Full name or organization contact" />
            </Field>
            <Field label="Amount (₦) *">
              <input type="number" min={0} className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" />
            </Field>
            <Field label="Donor Email">
              <input className={inputCls} value={form.donorEmail} onChange={(e) => setForm({ ...form, donorEmail: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Organization">
              <input className={inputCls} value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Link to Member (User ID)">
              <input className={inputCls} value={form.donorUserId} onChange={(e) => setForm({ ...form, donorUserId: e.target.value })} placeholder="Optional — assigns badge to this member" />
            </Field>
            <Field label="Recognition">
              <select className={inputCls} value={form.recognitionPref} onChange={(e) => setForm({ ...form, recognitionPref: e.target.value as any })}>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              onClick={submitDonation}
              disabled={recordMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> {recordMutation.isPending ? "Recording..." : "Record Donation"}
            </button>
          </div>
        </div>

        {/* Badge categories */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Badge Tiers</h2>
            <div className="flex items-center gap-2">
              <button onClick={addCategory} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Plus className="w-4 h-4" /> Add tier
              </button>
              <button onClick={saveCategories} disabled={upsertCategoriesMutation.isPending} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60">
                <Save className="w-4 h-4" /> {upsertCategoriesMutation.isPending ? "Saving..." : "Save tiers"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Badge Type</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Min ₦</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Max ₦</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Reduction (mo)</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {categories.map((c, idx) => (
                  <tr key={c.id ?? idx}>
                    <td className="px-3 py-2"><input className={cellCls} value={c.name} onChange={(e) => updateCategory(idx, "name", e.target.value)} /></td>
                    <td className="px-3 py-2"><input className={cellCls} value={c.badgeType} onChange={(e) => updateCategory(idx, "badgeType", e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" min={0} className={cellCls} value={c.minAmount} onChange={(e) => updateCategory(idx, "minAmount", e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" min={0} className={cellCls} value={c.maxAmount ?? ""} placeholder="∞" onChange={(e) => updateCategory(idx, "maxAmount", e.target.value === "" ? null : e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" min={0} className={cellCls} value={c.coolingReductionMonths} onChange={(e) => updateCategory(idx, "coolingReductionMonths", e.target.value)} /></td>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={!!c.isActive} onChange={(e) => updateCategory(idx, "isActive", e.target.checked)} className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No badge tiers yet. Add one to enable donation badges.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donations list */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recorded Donations</h2>
            <button onClick={() => donationsQuery.refetch()} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Donor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(donationsQuery.data?.donations ?? []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{format(new Date(d.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{d.donorName}</p>
                      <p className="text-xs text-gray-500">{d.Donor?.email || d.donorEmail || (d.organization ?? "—")}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₦{d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{d.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      {d.certificateUrl && (
                        <a href={d.certificateUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline">
                          <ScrollText className="w-4 h-4" /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {(!donationsQuery.data?.donations || donationsQuery.data.donations.length === 0) && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No donations recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {donationsQuery.data && donationsQuery.data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">Page {donationsQuery.data.page} of {donationsQuery.data.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded border disabled:opacity-30">Prev</button>
                <button onClick={() => setPage(Math.min(donationsQuery.data.totalPages, page + 1))} disabled={page >= donationsQuery.data.totalPages} className="px-3 py-1 text-sm rounded border disabled:opacity-30">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none";
const cellCls = "w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
