"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import { Flag, Search, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function StatesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<number | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<any>(null);

  const { data: countries } = api.location.getCountries.useQuery();
  const { data, isLoading, refetch } = api.adminLocation.getStates.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    countryId: filterCountryId,
  });

  const createMutation = api.adminLocation.createState.useMutation({
    onSuccess: () => {
      toast.success("State created successfully");
      setIsCreateModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.adminLocation.updateState.useMutation({
    onSuccess: () => {
      toast.success("State updated successfully");
      setEditingState(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.adminLocation.deleteState.useMutation({
    onSuccess: () => {
      toast.success("State deleted successfully");
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
          <Flag className="w-8 h-8 text-bpi-primary" />
          <h1 className="text-2xl font-bold text-foreground">States/Provinces</h1>
        </div>
        <p className="text-muted-foreground">
          Manage states and provinces for location cascading
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search states..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
          />
        </div>
        <select
          value={filterCountryId || ""}
          onChange={(e) => {
            setFilterCountryId(e.target.value ? parseInt(e.target.value) : undefined);
            setPage(1);
          }}
          className="px-4 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
        >
          <option value="">All Countries</option>
          {countries?.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-bpi-primary hover:bg-bpi-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add State
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
                Country
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bpi-border dark:divide-bpi-dark-accent">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-bpi-primary" />
                </td>
              </tr>
            ) : data?.states.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                  No states found
                </td>
              </tr>
            ) : (
              data?.states.map((state: any) => (
                <tr key={state.id} className="hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30">
                  <td className="px-6 py-4 text-sm text-foreground">{state.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{state.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{state.country.name}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => setEditingState(state)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        toast.custom((t) => (
                          <div className="w-full max-w-sm rounded-lg border border-bpi-border bg-white p-3 shadow-lg dark:border-bpi-dark-accent dark:bg-bpi-dark-card">
                            <div className="text-sm text-foreground">Delete {state.name}?</div>
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
                                  deleteMutation.mutate({ id: state.id });
                                }}
                                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ));
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
      {(isCreateModalOpen || editingState) && (
        <StateModal
          state={editingState}
          countries={countries || []}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingState(null);
          }}
          onSubmit={(data: any) => {
            if (editingState) {
              updateMutation.mutate({ ...data, id: editingState.id });
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

function StateModal({ state, countries, onClose, onSubmit, isLoading }: any) {
  const [name, setName] = useState(state?.name || "");
  const [countryId, setCountryId] = useState(state?.countryId?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryId) {
      toast.error("Please select a country");
      return;
    }
    onSubmit({
      name,
      countryId: parseInt(countryId),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {state ? "Edit State" : "Add State"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Country *
            </label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
            >
              <option value="">Select Country</option>
              {countries.map((country: any) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              State Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : state ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
