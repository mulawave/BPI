"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import { MapPin, Search, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function CitiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStateId, setFilterStateId] = useState<number | undefined>();
  const [filterCountryId, setFilterCountryId] = useState<number | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);

  const { data: countries } = api.location.getCountries.useQuery();
  const { data: filterStates } = api.location.getStates.useQuery(
    { countryId: filterCountryId! },
    { enabled: !!filterCountryId }
  );
  const { data, isLoading, refetch } = api.adminLocation.getCities.useQuery({
    page,
    pageSize: 25,
    search: search || undefined,
    stateId: filterStateId,
  });

  const createMutation = api.adminLocation.createCity.useMutation({
    onSuccess: () => {
      toast.success("City created successfully");
      setIsCreateModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateMutation = api.adminLocation.updateCity.useMutation({
    onSuccess: () => {
      toast.success("City updated successfully");
      setEditingCity(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = api.adminLocation.deleteCity.useMutation({
    onSuccess: () => {
      toast.success("City deleted successfully");
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
          <MapPin className="w-8 h-8 text-bpi-primary" />
          <h1 className="text-2xl font-bold text-foreground">Cities</h1>
        </div>
        <p className="text-muted-foreground">
          Manage cities for location cascading
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cities..."
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
            setFilterStateId(undefined);
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
        {filterCountryId && (
          <select
            value={filterStateId || ""}
            onChange={(e) => {
              setFilterStateId(e.target.value ? parseInt(e.target.value) : undefined);
              setPage(1);
            }}
            className="px-4 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
          >
            <option value="">All States</option>
            {filterStates?.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        )}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-bpi-primary hover:bg-bpi-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add City
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
                State
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
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-bpi-primary" />
                </td>
              </tr>
            ) : data?.cities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No cities found
                </td>
              </tr>
            ) : (
              data?.cities.map((city: any) => (
                <tr key={city.id} className="hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30">
                  <td className="px-6 py-4 text-sm text-foreground">{city.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{city.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{city.state.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{city.state.country.name}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => setEditingCity(city)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${city.name}?`)) {
                          deleteMutation.mutate({ id: city.id });
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
      {(isCreateModalOpen || editingCity) && (
        <CityModal
          city={editingCity}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingCity(null);
          }}
          onSubmit={(data: any) => {
            if (editingCity) {
              updateMutation.mutate({ ...data, id: editingCity.id });
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

function CityModal({ city, onClose, onSubmit, isLoading }: any) {
  const [name, setName] = useState(city?.name || "");
  const [countryId, setCountryId] = useState(city?.state?.country?.id?.toString() || "");
  const [stateId, setStateId] = useState(city?.stateId?.toString() || "");

  const { data: countries } = api.location.getCountries.useQuery();
  const { data: states } = api.location.getStates.useQuery(
    { countryId: parseInt(countryId) },
    { enabled: !!countryId }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateId) {
      toast.error("Please select a state");
      return;
    }
    onSubmit({
      name,
      stateId: parseInt(stateId),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {city ? "Edit City" : "Add City"}
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
              onChange={(e) => {
                setCountryId(e.target.value);
                setStateId(""); // Reset state when country changes
              }}
              required
              className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
            >
              <option value="">Select Country</option>
              {countries?.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {countryId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                State *
              </label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:border-bpi-primary"
              >
                <option value="">Select State</option>
                {states?.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              City Name *
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : city ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
