"use client";

import { useMemo, useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import AdminPageGuide from "@/components/admin/AdminPageGuide";
import {
  Banknote,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Wand2,
  Pencil,
  Star,
} from "lucide-react";

const cardBase = "rounded-2xl border border-emerald-500/30 bg-white/95 p-4 shadow-2xl backdrop-blur-xl xl:p-5 dark:border-emerald-400/40 dark:bg-green-900/85";
const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-white/10";

type FormState = {
  id?: number;
  userId?: string;
  bankId?: number | null;
  bankName?: string;
  accountName: string;
  accountNumber: string;
  bvn?: string;
  isDefault?: boolean;
};

function SummaryCard({ title, value, sub, icon: Icon, tone = "emerald" }: { title: string; value: string; sub?: string; icon: any; tone?: "emerald" | "amber" | "red" | "blue" }) {
  const toneClasses: Record<string, string> = {
    emerald: "from-emerald-500/90 to-emerald-600/80 text-emerald-50",
    amber: "from-amber-500/90 to-amber-600/80 text-amber-50",
    red: "from-rose-500/90 to-rose-600/80 text-rose-50",
    blue: "from-cyan-500/90 to-sky-600/80 text-cyan-50",
  };
  return (
    <div className={`${cardBase} bg-gradient-to-br ${toneClasses[tone]} border-emerald-500/40`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-white/60">{sub}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function BankAccountsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState("");
  const [bankFilter, setBankFilter] = useState<number | undefined>(undefined);
  const [onlyMissingBankMap, setOnlyMissingBankMap] = useState(false);
  const [missingPage, setMissingPage] = useState(1);
  const [missingSearch, setMissingSearch] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [creatingForUser, setCreatingForUser] = useState<FormState | null>(null);

  const stats = api.adminBank.getBankRecordStats.useQuery();
  const banks = api.adminBank.getBanks.useQuery({ page: 1, perPage: 200 });
  const records = api.adminBank.getUserBankRecords.useQuery({
    page,
    perPage,
    search: search || undefined,
    bankId: bankFilter,
    missingBankId: onlyMissingBankMap || undefined,
  });

  const missingUsers = api.adminBank.getUsersWithoutBankRecords.useQuery({
    page: missingPage,
    perPage: 15,
    search: missingSearch || undefined,
  });

  const setDefault = api.adminBank.setDefaultBankRecord.useMutation({
    onSuccess: () => {
      toast.success("Default bank updated");
      records.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRecord = api.adminBank.updateUserBankRecord.useMutation({
    onSuccess: () => {
      toast.success("Bank record updated");
      setEditing(null);
      records.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const createRecord = api.adminBank.createUserBankRecord.useMutation({
    onSuccess: () => {
      toast.success("Bank record created");
      setCreatingForUser(null);
      records.refetch();
      missingUsers.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const isSaving = updateRecord.isPending || createRecord.isPending;

  const bankOptions = useMemo(() => banks.data?.banks ?? [], [banks.data]);

  const handleSave = (form: FormState) => {
    if (form.id) {
      updateRecord.mutate({
        id: form.id,
        bankId: form.bankId ?? undefined,
        bankName: form.bankName || undefined,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        bvn: form.bvn || undefined,
        isDefault: form.isDefault,
      });
    } else if (form.userId) {
      createRecord.mutate({
        userId: form.userId,
        bankId: form.bankId ?? undefined,
        bankName: form.bankName || undefined,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        bvn: form.bvn || undefined,
        isDefault: form.isDefault,
      });
    }
  };

  const maskAccount = (acc: string) => acc && acc.length > 4 ? `${acc.slice(0, 2)}***${acc.slice(-4)}` : acc;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin · Bank Accounts</p>
          <h1 className="text-2xl font-bold text-foreground">Bank Records Management</h1>
          <p className="text-sm text-muted-foreground">Audit payouts, defaults, and fill gaps for users without bank records.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => records.refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-border transition hover:bg-white dark:bg-green-900/50 dark:text-white"
          >
            {records.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="Bank Records Management Guide"
        sections={[
          {
            title: "Bank Records Overview",
            icon: <Banknote className="w-5 h-5 text-blue-600" />,
            items: [
              "Manage <strong>user bank account information</strong> for withdrawals",
              "<strong>Audit payout readiness</strong> - verify all users have bank details",
              "Set <strong>default bank accounts</strong> for automatic withdrawals",
              "<strong>Fill gaps</strong> - add bank records for users without them",
              "<strong>Map bank codes to banks</strong> - link legacy data to bank database",
              "<strong>Masked account numbers</strong> for security (show first 2 + last 4 digits)"
            ]
          },
          {
            title: "Adding Bank Records",
            icon: <UserPlus className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Identify users without banks</strong> - Check 'Users without Bank Records' card",
              "<strong>Click 'Add Bank Record'</strong> - Opens form for new bank account",
              "<strong>Select user</strong> - Choose from users missing bank records",
              "<strong>Select bank</strong> - Choose from bank dropdown (Nigeria banks)",
              "<strong>Enter account name</strong> - Full name matching bank account",
              "<strong>Enter account number</strong> - 10-digit NUBAN account number",
              "<strong>BVN (optional)</strong> - Bank Verification Number for verification",
              "<strong>Set as default</strong> - Toggle to make this the primary withdrawal account"
            ]
          },
          {
            title: "Editing Bank Records",
            icon: <Pencil className="w-5 h-5 text-orange-600" />,
            items: [
              "<strong>Click Edit</strong> - Opens bank record editing form",
              "<strong>Update bank</strong> - Change bank if user switched accounts",
              "<strong>Correct account details</strong> - Fix typos in name or number",
              "<strong>Add BVN</strong> - Include BVN if initially missing",
              "<strong>Changes save immediately</strong> - Affects future withdrawals only",
              "<strong>Cannot edit account number</strong> - Delete and recreate if wrong"
            ]
          },
          {
            title: "Setting Default Accounts",
            icon: <Star className="w-5 h-5 text-purple-600" />,
            items: [
              "<strong>Default account</strong> used for <strong>automatic withdrawals</strong>",
              "Users can have <strong>multiple bank accounts</strong>, only one default",
              "<strong>Click 'Set as Default'</strong> button on bank record",
              "<strong>Previous default</strong> automatically unmarked",
              "Users without default account <strong>cannot withdraw</strong> - prompt them to set one"
            ]
          },
          {
            title: "Bank Mapping & Legacy Data",
            icon: <Wand2 className="w-5 h-5 text-blue-600" />,
            items: [
              "<strong>Records Missing Bank Link</strong> - Old records with bank codes but no bank ID",
              "<strong>Map codes to banks</strong> - Match legacy bank codes (e.g., '044') to database banks",
              "Use <strong>'Missing bank mapping only'</strong> filter to find unmapped records",
              "<strong>Bulk mapping</strong> - Update multiple records at once (if available)",
              "<strong>Improves data quality</strong> for accurate withdrawal processing"
            ]
          },
          {
            title: "Security & Compliance",
            icon: <ShieldCheck className="w-5 h-5 text-red-600" />,
            items: [
              "<strong>Account numbers masked</strong> in UI (XX***XXXX) for privacy",
              "<strong>BVN verification</strong> recommended for high-value withdrawals",
              "<strong>Audit trail</strong> - All changes logged in system",
              "<strong>Restrict access</strong> - Only authorized admins should manage bank records",
              "<strong>Verify account ownership</strong> before adding records to prevent fraud",
              "<strong>Compliance</strong> with Nigerian banking regulations"
            ]
          }
        ]}
        features={[
          "View all user bank records",
          "Add bank records for users",
          "Edit existing bank details",
          "Set/change default accounts",
          "Search by user, email, account number",
          "Filter by bank",
          "Missing bank mapping detection",
          "Masked account numbers for security"
        ]}
        proTip="For <strong>withdrawal readiness</strong>, focus on filling gaps for <strong>active users first</strong> - check 'Users without Bank Records' card. Use <strong>bank filter</strong> to audit specific banks (e.g., 'GTBank only'). <strong>Verify account names match user names</strong> to prevent withdrawal failures. Set up <strong>BVN verification</strong> for amounts above ₦50,000 to reduce fraud. <strong>Export bank records monthly</strong> for compliance reporting."
        warning="<strong>Never add fake bank accounts</strong> - this enables withdrawal fraud and damages user trust. <strong>Deleting bank records is permanent</strong> and may affect historical withdrawal data - only delete duplicates or confirmed fraudulent accounts. <strong>Account number typos</strong> cause withdrawal failures - double-check before saving. <strong>BVN is sensitive data</strong> - handle with extreme care and encrypt in database. <strong>Default account changes</strong> affect immediate next withdrawal - notify users if you change their default."
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Users with Bank Records"
          value={stats.data ? stats.data.usersWithBanks.toLocaleString() : "..."}
          sub={`${stats.data ? ((stats.data.usersWithBanks / (stats.data.totalUsers || 1)) * 100).toFixed(1) : "-"}% coverage`}
          icon={Banknote}
        />
        <SummaryCard
          title="Users without Bank Records"
          value={stats.data ? stats.data.usersWithoutBanks.toLocaleString() : "..."}
          sub="Prioritize these for onboarding"
          icon={UserMinus}
          tone="red"
        />
        <SummaryCard
          title="Defaults Set"
          value={stats.data ? (stats.data.totalRecords - stats.data.usersWithBanksNoDefault).toLocaleString() : "..."}
          sub={stats.data ? `${stats.data.usersWithBanksNoDefault} pending defaults` : ""}
          icon={ShieldCheck}
          tone="amber"
        />
        <SummaryCard
          title="Records Missing Bank Link"
          value={stats.data ? stats.data.recordsMissingBankId.toLocaleString() : "..."}
          sub="Map codes to banks"
          icon={Wand2}
          tone="blue"
        />
      </div>

      {/* Controls */}
      <div className={`${cardBase} flex flex-col gap-3`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search user, email, account number"
              className="w-full rounded-lg border border-border bg-background/60 pl-10 pr-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <select
            value={bankFilter ?? ""}
            onChange={(e) => { setPage(1); setBankFilter(e.target.value ? Number(e.target.value) : undefined); }}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">All Banks</option>
            {bankOptions.map((b: any) => (
              <option key={b.id} value={b.id}>{b.bankName} ({b.bankCode})</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={onlyMissingBankMap}
              onChange={(e) => { setPage(1); setOnlyMissingBankMap(e.target.checked); }}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
            Missing bank mapping only
          </label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {[25, 50, 100].map((n) => (<option key={n} value={n}>{n} / page</option>))}
          </select>
        </div>
      </div>

      {/* Records table */}
      <div className={`${cardBase} overflow-hidden`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">User Bank Records</h2>
            <p className="text-sm text-muted-foreground">Paginated view with quick actions.</p>
          </div>
          {records.isFetching && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">User</th>
                <th className="px-3 py-2 text-left font-semibold">Bank</th>
                <th className="px-3 py-2 text-left font-semibold">Account</th>
                <th className="px-3 py-2 text-left font-semibold">BVN</th>
                <th className="px-3 py-2 text-left font-semibold">Default</th>
                <th className="px-3 py-2 text-left font-semibold">Created</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.data?.records.map((r: any) => (
                <tr key={r.id} className="hover:bg-background/50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{r.user?.name || r.user?.email || r.user?.username || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{r.bank?.bankName || r.bankName || "Unmapped"}</span>
                      {r.bank?.bankCode && <span className={`${pill} bg-emerald-500/90 text-white ring-emerald-200/80`}>{r.bank.bankCode}</span>}
                      {!r.bank && <span className={`${pill} bg-amber-500/90 text-white ring-amber-200/80`}>Missing bank link</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-foreground font-medium">{r.accountName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{maskAccount(r.accountNumber)}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{r.bvn || "-"}</td>
                  <td className="px-3 py-2">
                    {r.isDefault ? (
                      <span className={`${pill} bg-emerald-500/90 text-white ring-emerald-200/80`}><Star className="h-4 w-4" /> Default</span>
                    ) : (
                      <button
                        onClick={() => setDefault.mutate({ id: r.id })}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-emerald-500 hover:text-emerald-500"
                      >
                        <Star className="h-4 w-4" /> Set default
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{format(new Date(r.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing({
                          id: r.id,
                          userId: r.userId,
                          bankId: r.bankId ?? undefined,
                          bankName: r.bankName ?? undefined,
                          accountName: r.accountName,
                          accountNumber: r.accountNumber,
                          bvn: r.bvn ?? undefined,
                          isDefault: r.isDefault,
                        })}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-emerald-500 hover:text-emerald-500"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!records.data?.records?.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {records.isLoading ? "Loading..." : "No records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          <div>
            Page {records.data?.page || 1} / {records.data?.totalPages || 1} · {records.data?.total || 0} records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= (records.data?.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Users without bank records */}
      <div className={`${cardBase} overflow-hidden`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Users Without Bank Records</h2>
            <p className="text-sm text-muted-foreground">Create bank records and mark defaults directly.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={missingSearch}
              onChange={(e) => { setMissingPage(1); setMissingSearch(e.target.value); }}
              placeholder="Search by name, email, legacyId"
              className="w-full rounded-lg border border-border bg-background/60 pl-10 pr-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">User</th>
                <th className="px-3 py-2 text-left font-semibold">Legacy ID</th>
                <th className="px-3 py-2 text-left font-semibold">Created</th>
                <th className="px-3 py-2 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {missingUsers.data?.users.map((u: any) => (
                <tr key={u.id} className="hover:bg-background/50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{u.name || u.email || u.username || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{u.legacyId || "-"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{format(new Date(u.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setCreatingForUser({ userId: u.id, accountName: "", accountNumber: "", bankId: undefined })}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                    >
                      <UserPlus className="h-4 w-4" /> Add bank record
                    </button>
                  </td>
                </tr>
              ))}
              {!missingUsers.data?.users?.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {missingUsers.isLoading ? "Loading..." : "All users have bank records"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          <div>
            Page {missingUsers.data?.page || 1} / {missingUsers.data?.totalPages || 1} · {missingUsers.data?.total || 0} users
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={missingPage <= 1}
              onClick={() => setMissingPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={missingPage >= (missingUsers.data?.totalPages || 1)}
              onClick={() => setMissingPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(editing || creatingForUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-2xl border border-border bg-background/90 p-5 shadow-2xl backdrop-blur"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{editing ? "Edit bank record" : "Create bank record"}</p>
                <h3 className="text-lg font-semibold text-foreground">{editing ? "Update payout details" : "Add payout account"}</h3>
              </div>
              <button
                onClick={() => { setEditing(null); setCreatingForUser(null); }}
                className="rounded-lg border border-border px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = editing ?? creatingForUser;
                if (!form) return;
                if (!form.accountName || !form.accountNumber) {
                  toast.error("Account name and number are required");
                  return;
                }
                handleSave(form);
              }}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Bank</label>
                  <select
                    value={(editing ?? creatingForUser)?.bankId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, bankId: value, bankName: value ? undefined : prev?.bankName } : prev);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">Unmapped / manual entry</option>
                    {bankOptions.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.bankName} ({b.bankCode})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Bank Name (if unmapped)</label>
                  <input
                    value={(editing ?? creatingForUser)?.bankName ?? ""}
                    onChange={(e) => {
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, bankName: e.target.value } : prev);
                    }}
                    placeholder="e.g. Sterling Bank"
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Account Name</label>
                  <input
                    value={(editing ?? creatingForUser)?.accountName ?? ""}
                    onChange={(e) => {
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, accountName: e.target.value } : prev);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Account Number</label>
                  <input
                    value={(editing ?? creatingForUser)?.accountNumber ?? ""}
                    onChange={(e) => {
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, accountNumber: e.target.value } : prev);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">BVN (optional)</label>
                  <input
                    value={(editing ?? creatingForUser)?.bvn ?? ""}
                    onChange={(e) => {
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, bvn: e.target.value } : prev);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="col-span-1 flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={(editing ?? creatingForUser)?.isDefault || false}
                    onChange={(e) => {
                      const updater = editing ? setEditing : setCreatingForUser;
                      updater((prev) => prev ? { ...prev, isDefault: e.target.checked } : prev);
                    }}
                    className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-foreground">Set as default for this user</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditing(null); setCreatingForUser(null); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-emerald-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
