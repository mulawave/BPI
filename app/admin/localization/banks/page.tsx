"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit, Trash2, Loader2, Building2, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBanksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<{ source: string; totalFetched: number; created: number; updated: number; unchanged: number } | null>(null);

  const { data, isLoading, refetch } = api.adminBank.getBanks.useQuery({
    page,
    perPage: 25,
    search: search || undefined,
  });

  const createMutation = api.adminBank.createBank.useMutation({
    onSuccess: () => {
      toast.success("Bank created successfully");
      setIsCreateModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.adminBank.updateBank.useMutation({
    onSuccess: () => {
      toast.success("Bank updated successfully");
      setEditingBank(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.adminBank.deleteBank.useMutation({
    onSuccess: () => {
      toast.success("Bank deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const syncPaystackMutation = api.adminBank.syncBanksFromPaystack.useMutation({
    onSuccess: (result) => {
      toast.success(`Synced from Paystack: ${result.created} added, ${result.updated} updated`);
      setSyncResult(result);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Paystack sync failed");
    },
  });

  const syncFlutterwaveMutation = api.adminBank.syncBanksFromFlutterwave.useMutation({
    onSuccess: (result) => {
      toast.success(`Synced from Flutterwave: ${result.created} added, ${result.updated} updated`);
      setSyncResult(result);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Flutterwave sync failed");
    },
  });

  const isSyncing = syncPaystackMutation.isPending || syncFlutterwaveMutation.isPending;

  const handleDelete = (bank: any) => {
    toast.custom((t) => (
      <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
        <div className="text-sm text-foreground">Delete "{bank.bankName}"?</div>
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              deleteMutation.mutate({ id: bank.id });
            }}
            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Banks Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Nigerian banks available for user withdrawals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => syncPaystackMutation.mutate()}
            disabled={isSyncing}
            title="Sync bank list from Paystack"
          >
            {syncPaystackMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Paystack
          </Button>
          <Button
            variant="outline"
            onClick={() => syncFlutterwaveMutation.mutate()}
            disabled={isSyncing}
            title="Sync bank list from Flutterwave"
          >
            {syncFlutterwaveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Flutterwave
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-bpi-primary hover:bg-bpi-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bank
          </Button>
        </div>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold capitalize">{syncResult.source}</span> sync complete —{" "}
            <span className="font-medium">{syncResult.totalFetched}</span> banks fetched,{" "}
            <span className="font-medium">{syncResult.created}</span> added,{" "}
            <span className="font-medium">{syncResult.updated}</span> updated,{" "}
            <span className="font-medium">{syncResult.unchanged}</span> unchanged.
          </div>
          <button
            className="ml-auto text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
            onClick={() => setSyncResult(null)}
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search banks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bpi-primary bg-card text-foreground"
          />
        </div>
      </div>

      {/* Banks Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Bank Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Bank Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : data?.banks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No banks found
                </td>
              </tr>
            ) : (
              data?.banks.map((bank: any) => (
                <tr key={bank.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-foreground">{bank.id}</td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{bank.bankName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{bank.bankCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBank(bank)}
                        className="p-1.5 hover:bg-bpi-primary/10 text-bpi-primary rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data.banks.length} of {data.total} banks
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-foreground">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingBank) && (
        <BankModal
          bank={editingBank}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingBank(null);
          }}
          onSubmit={(data: any) => {
            if (editingBank) {
              updateMutation.mutate({ ...data, id: editingBank.id });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Bank Modal Component
function BankModal({ bank, onClose, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    bankName: bank?.bankName || "",
    bankCode: bank?.bankCode || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {bank ? "Edit Bank" : "Add New Bank"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Bank Name
            </label>
            <input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bpi-primary bg-background text-foreground"
              required
              disabled={isLoading}
              placeholder="e.g., Access Bank"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Bank Code
            </label>
            <input
              type="text"
              value={formData.bankCode}
              onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bpi-primary bg-background text-foreground"
              required
              disabled={isLoading}
              placeholder="e.g., 044"
              maxLength={10}
            />
          </div>

          <div className="flex items-center gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-bpi-primary hover:bg-bpi-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{bank ? "Update" : "Create"} Bank</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
