"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import { Globe, Search, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function CountriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);

  const { data, isLoading, refetch } = api.adminLocation.getCountries.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
  });

  const createMutation = api.adminLocation.createCountry.useMutation({
    onSuccess: () => {
      toast.success("Country created successfully");
      setIsCreateModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.adminLocation.updateCountry.useMutation({
    onSuccess: () => {
      toast.success("Country updated successfully");
      setEditingCountry(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.adminLocation.deleteCountry.useMutation({
    onSuccess: () => {
      toast.success("Country deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-8 h-8 text-bpi-primary" />
          <h1 className="text-2xl font-bold text-foreground">Countries</h1>
        </div>
        <p className="text-muted-foreground">
          Manage countries for location cascading
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
          />
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-bpi-primary hover:bg-bpi-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Country
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-bpi-dark-card rounded-lg border border-bpi-border dark:border-bpi-dark-accent overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-bpi-dark-accent/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dial Code
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bpi-border dark:divide-bpi-dark-accent">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-bpi-primary" />
                </td>
              </tr>
            ) : data?.countries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No countries found
                </td>
              </tr>
            ) : (
              data?.countries.map((country: any) => (
                <tr key={country.id} className="hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30">
                  <td className="px-6 py-4 text-sm text-foreground">{country.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{country.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{country.code || "-"}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{country.dialCode || "-"}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => setEditingCountry(country)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${country.name}?`)) {
                          deleteMutation.mutate({ id: country.id });
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {data.pages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingCountry) && (
        <CountryModal
          country={editingCountry}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCountry(null);
          }}
          onSubmit={(data: any) => {
            if (editingCountry) {
              updateMutation.mutate({ ...data, id: editingCountry.id });
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

function CountryModal({ country, onClose, onSubmit, isLoading }: any) {
  const [name, setName] = useState(country?.name || "");
  const [code, setCode] = useState(country?.code || "");
  const [dialCode, setDialCode] = useState(country?.dialCode?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      code: code || undefined,
      dialCode: dialCode ? parseInt(dialCode) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {country ? "Edit Country" : "Add Country"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Code (e.g., US, NG)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Dial Code (e.g., 234)
            </label>
            <input
              type="number"
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-bpi-primary hover:bg-bpi-primary/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : country ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
