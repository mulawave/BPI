"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/client/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import toast from "react-hot-toast";
import AdminPageGuide from "@/components/admin/AdminPageGuide";
import {
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X
} from "lucide-react";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
type PickupCenter = RouterOutputs["store"]["listPickupCenters"][number];

const emptyCenter: PickupCenter = {
  id: "new",
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  contactName: "",
  contactPhone: "",
  logoUrl: "",
  isActive: true,
  createdAt: new Date().toISOString() as unknown as Date,
  updatedAt: new Date().toISOString() as unknown as Date,
};

export default function PickupCentersAdminPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<PickupCenter | null>(null);
  const [viewing, setViewing] = useState<PickupCenter | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const centersQuery = api.store.listPickupCenters.useQuery();
  const upsert = api.store.adminUpsertPickupCenter.useMutation();
  const countriesQuery = api.location.getCountries.useQuery();
  const statesQuery = api.location.getStates.useQuery(
    { countryId: selectedCountryId ?? 0 },
    { enabled: Boolean(selectedCountryId) }
  );
  const citiesQuery = api.location.getCities.useQuery(
    { stateId: selectedStateId ?? 0 },
    { enabled: Boolean(selectedStateId) }
  );

  const resolveOptionName = (value: string, list: { id: number; name: string }[] | undefined) => {
    if (!value) return "";
    const numeric = Number(value);
    const match = list?.find((item) => item.name.toLowerCase() === value.toLowerCase() || (!Number.isNaN(numeric) && item.id === numeric));
    return match?.name || value;
  };

  const formatLocation = (center: PickupCenter) => {
    const countryName = resolveOptionName(center.country, countriesQuery.data);
    const stateName = resolveOptionName(center.state, statesQuery.data);
    const cityName = resolveOptionName(center.city, citiesQuery.data);
    return {
      country: countryName,
      state: stateName,
      city: cityName,
    };
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editing) return;
    setUploadingLogo(true);
    setLogoProgress(0);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pickup-centers");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setLogoProgress(percent);
          }
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && json?.url) {
              setEditing({ ...editing, logoUrl: json.url as string });
              toast.success("Logo uploaded");
              resolve();
            } else {
              reject(new Error(json?.error || "Upload failed"));
            }
          } catch (err) {
            reject(err);
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      setLogoProgress(0);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (!editing) {
      setSelectedCountryId(null);
      setSelectedStateId(null);
      setSelectedCityId(null);
      return;
    }

    if (countriesQuery.data?.length) {
      const numericCountry = Number(editing.country);
      const matchCountry = countriesQuery.data.find((c) => (!Number.isNaN(numericCountry) && c.id === numericCountry) || c.name.toLowerCase() === editing.country.toLowerCase());
      setSelectedCountryId(matchCountry?.id ?? (Number.isNaN(numericCountry) ? null : numericCountry));
    }
  }, [editing, countriesQuery.data]);

  useEffect(() => {
    if (!editing || !statesQuery.data?.length) return;
    const numericState = Number(editing.state);
    const matchState = statesQuery.data.find((s) => (!Number.isNaN(numericState) && s.id === numericState) || s.name.toLowerCase() === editing.state.toLowerCase());
    setSelectedStateId(matchState?.id ?? (Number.isNaN(numericState) ? null : numericState));
  }, [editing, statesQuery.data]);

  useEffect(() => {
    if (!editing || !citiesQuery.data?.length) return;
    const numericCity = Number(editing.city);
    const matchCity = citiesQuery.data.find((c) => (!Number.isNaN(numericCity) && c.id === numericCity) || c.name.toLowerCase() === editing.city.toLowerCase());
    setSelectedCityId(matchCity?.id ?? (Number.isNaN(numericCity) ? null : numericCity));
  }, [editing, citiesQuery.data]);

  const centers = useMemo<PickupCenter[]>(() => {
    const list = centersQuery.data ?? [];
    return list.filter((c: PickupCenter) => {
      const matchSearch = search
        ? `${c.name} ${c.city} ${c.state} ${c.country}`.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchStatus = statusFilter === "all" ? true : statusFilter === "active" ? c.isActive : !c.isActive;
      return matchSearch && matchStatus;
    });
  }, [centersQuery.data, search, statusFilter]);

  const activeCount = useMemo(() => (centersQuery.data ?? []).filter((c: PickupCenter) => c.isActive).length, [centersQuery.data]);
  const inactiveCount = useMemo(() => (centersQuery.data ?? []).filter((c: PickupCenter) => !c.isActive).length, [centersQuery.data]);

  const handleToggleActive = async (center: PickupCenter) => {
    try {
      await upsert.mutateAsync({
        id: center.id === "new" ? undefined : center.id,
        name: center.name,
        addressLine1: center.addressLine1,
        addressLine2: center.addressLine2 || undefined,
        city: center.city,
        state: center.state,
        country: center.country,
        contactName: center.contactName || undefined,
        contactPhone: center.contactPhone || undefined,
        logoUrl: center.logoUrl || undefined,
        isActive: !center.isActive,
      });
      toast.success(`Pickup center ${center.isActive ? "paused" : "activated"}`);
      centersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update center");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.addressLine1.trim() || !editing.city.trim() || !editing.state.trim() || !editing.country.trim()) {
      toast.error("Name, address, city, state, and country are required");
      return;
    }
    const countryName = countriesQuery.data?.find((c) => c.id === selectedCountryId)?.name || resolveOptionName(editing.country, countriesQuery.data);
    const stateName = statesQuery.data?.find((s) => s.id === selectedStateId)?.name || resolveOptionName(editing.state, statesQuery.data);
    const cityName = citiesQuery.data?.find((c) => c.id === selectedCityId)?.name || resolveOptionName(editing.city, citiesQuery.data);
    try {
      await upsert.mutateAsync({
        id: editing.id === "new" ? undefined : editing.id,
        name: editing.name,
        addressLine1: editing.addressLine1,
        addressLine2: editing.addressLine2 || undefined,
        city: cityName,
        state: stateName,
        country: countryName,
        contactName: editing.contactName || undefined,
        contactPhone: editing.contactPhone || undefined,
        logoUrl: editing.logoUrl || undefined,
        isActive: editing.isActive,
      });
      toast.success("Pickup center saved");
      setEditing(null);
      centersQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save center");
    }
  };

  return (
    <div className="space-y-6 px-4 pt-2 pb-8 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">Pickup Centers</div>
          <h1 className="text-2xl font-bold text-foreground">Manage fulfillment locations</h1>
          <p className="text-sm text-muted-foreground">Add or edit pickup centers for store orders and logistics.</p>
          {centersQuery.isFetching && <div className="text-[11px] text-muted-foreground">Refreshing centers…</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => centersQuery.refetch()}
            disabled={centersQuery.isFetching}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-600 to-green-500 text-white"
            onClick={() => {
              setSelectedCountryId(null);
              setSelectedStateId(null);
              setSelectedCityId(null);
              setEditing({ ...emptyCenter });
            }}
          >
            <Plus className="h-4 w-4" /> Add Pickup Center
          </Button>
        </div>
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="Pickup Centers Guide"
        sections={[
          {
            title: "Pickup Centers Overview",
            icon: <Building2 className="w-5 h-5 text-blue-600" />,
            items: [
              "Manage <strong>physical locations</strong> where users collect store orders",
              "Add <strong>complete address details</strong> (street, city, state, country)",
              "Store <strong>contact information</strong> for each center",
              "Upload <strong>center logos</strong> for branding",
              "<strong>Activate/deactivate</strong> centers without deleting data",
              "Users select pickup center during <strong>checkout process</strong>"
            ]
          },
          {
            title: "Adding New Pickup Centers",
            icon: <Plus className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Click 'Add Pickup Center'</strong> - Opens center creation form",
              "<strong>Enter center name</strong> - e.g., 'Lagos Island Office', 'Abuja Hub'",
              "<strong>Address Line 1</strong> - Street address with building number",
              "<strong>Address Line 2</strong> - Apartment, suite, or additional directions (optional)",
              "<strong>Select country</strong> - Choose from dropdown (loads states)",
              "<strong>Select state</strong> - Choose state/province (loads cities)",
              "<strong>Select city</strong> - Choose city from loaded options",
              "<strong>Contact name</strong> - Person in charge at center",
              "<strong>Contact phone</strong> - Direct phone line for inquiries",
              "<strong>Upload logo</strong> - Center/branch logo image (optional)",
              "<strong>Set active status</strong> - Toggle on to make available for orders"
            ]
          },
          {
            title: "Location Selection Workflow",
            icon: <MapPin className="w-5 h-5 text-orange-600" />,
            items: [
              "<strong>Step 1: Country</strong> - Select country (Nigeria, USA, UK, etc.)",
              "<strong>Step 2: State</strong> - Dropdown populates with states from selected country",
              "<strong>Step 3: City</strong> - Dropdown populates with cities from selected state",
              "<strong>Cascading dropdowns</strong> ensure accurate location data",
              "If location not found, <strong>type manually</strong> as fallback"
            ]
          },
          {
            title: "Logo Upload & Branding",
            icon: <Building2 className="w-5 h-5 text-purple-600" />,
            items: [
              "<strong>Click upload button</strong> - Select logo from device",
              "<strong>Supported formats</strong> - JPG, JPEG, PNG (max 2MB)",
              "<strong>Recommended size</strong> - 300x300px for best display",
              "<strong>Upload progress</strong> - Real-time percentage indicator",
              "<strong>Auto-optimization</strong> - Images compressed for fast loading",
              "Logo displays on <strong>user checkout page</strong> for center recognition"
            ]
          },
          {
            title: "Editing & Managing Centers",
            icon: <Pencil className="w-5 h-5 text-blue-600" />,
            items: [
              "<strong>Click Edit</strong> - Modify any center details",
              "<strong>Update address</strong> - Change location if center relocates",
              "<strong>Change contact info</strong> - Update person in charge or phone number",
              "<strong>Toggle active/inactive</strong> - Hide from checkout without deleting",
              "<strong>View details</strong> - See full center information",
              "<strong>Inactive centers</strong> remain in database but aren't available for new orders"
            ]
          }
        ]}
        features={[
          "Add/edit pickup center locations",
          "Complete address management",
          "Country/State/City cascading selection",
          "Contact information storage",
          "Logo upload for centers",
          "Active/inactive status toggle",
          "Search & filter centers",
          "Real-time location validation"
        ]}
        proTip="For <strong>optimal user experience</strong>, add centers in <strong>high-traffic areas</strong> (city centers, shopping districts). Keep <strong>contact phone numbers updated</strong> - users often call before pickup. Use <strong>clear, recognizable names</strong> like 'Lagos Island - Marina Office' instead of vague codes. <strong>Upload logos</strong> to build brand familiarity. Review inactive centers quarterly and <strong>delete</strong> if permanently closed."
        warning="<strong>Deactivating a center hides it from new orders</strong> but existing orders with that center remain valid - ensure fulfillment for pending pickups. <strong>Deleting a center is permanent</strong> and may affect historical order records - use deactivation instead unless absolutely necessary. <strong>Always verify address accuracy</strong> - wrong addresses frustrate users and damage trust."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 space-y-1 border-emerald-100 dark:border-emerald-900/40">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Active</div>
          <div className="text-3xl font-bold">{activeCount}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><X className="h-4 w-4" /> Inactive</div>
          <div className="text-3xl font-bold">{inactiveCount}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Total</div>
          <div className="text-3xl font-bold">{centersQuery.data?.length ?? 0}</div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="h-4 w-4" /> Filters</div>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-background">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / city / state"
              className="bg-transparent text-sm focus:outline-none"
            />
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s as any)}>
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-12 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground px-4 py-2">
            <div className="col-span-4">Center</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/60">
            {centersQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-16 bg-muted animate-pulse" />)
            ) : centers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No pickup centers found.</div>
            ) : (
              centers.map((c: PickupCenter) => {
                const loc = formatLocation(c);
                return (
                  <div key={c.id} className="grid grid-cols-12 items-center px-4 py-3 bg-card/40 backdrop-blur">
                    <div className="col-span-4 space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {c.logoUrl ? (
                            <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{c.name}</span>
                            <Badge variant="outline" className={cn("text-[10px]", c.isActive ? "text-emerald-600 border-emerald-500/60" : "text-amber-600 border-amber-500/60")}>{c.isActive ? "active" : "inactive"}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{c.addressLine1}{c.addressLine2 ? ", " + c.addressLine2 : ""}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-foreground">
                      <div>{loc.city || c.city}</div>
                      <div className="text-xs text-muted-foreground">{loc.state || c.state}, {loc.country || c.country}</div>
                    </div>
                    <div className="col-span-3 text-sm text-foreground">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><UserRound className="h-3 w-3" /> {c.contactName || "—"}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {c.contactPhone || "—"}</div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing({ ...c })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(c)}
                        disabled={upsert.isPending}
                      >
                        {c.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{editing.id === "new" ? "Add Pickup Center" : "Edit Pickup Center"}</div>
              <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <input
                  value={editing.contactPhone || ""}
                  onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, contactPhone: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="e.g., 0803…"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo</label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg overflow-hidden border border-border bg-muted">
                    {editing.logoUrl ? (
                      <img src={editing.logoUrl} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-2"
                      >
                        {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploadingLogo ? "Uploading..." : "Upload logo"}
                      </Button>
                      {editing.logoUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing((prev: PickupCenter | null) => prev ? { ...prev, logoUrl: "" } : prev)}
                          disabled={uploadingLogo}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files)}
                    />
                    {uploadingLogo && (
                      <div className="w-full max-w-xs">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{logoProgress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${logoProgress}%` }} />
                        </div>
                      </div>
                    )}
                    <span className="text-[11px] text-muted-foreground">PNG/JPG recommended. Max ~5MB.</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Address line 1</label>
                <input
                  value={editing.addressLine1}
                  onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, addressLine1: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Address line 2 (optional)</label>
                <input
                  value={editing.addressLine2 || ""}
                  onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, addressLine2: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <select
                  value={selectedCityId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedCityId(id);
                    const name = citiesQuery.data?.find((c) => c.id === id)?.name || editing.city;
                    setEditing((prev: PickupCenter | null) => prev ? { ...prev, city: name } : prev);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!selectedStateId || citiesQuery.isLoading}
                >
                  <option value="">{citiesQuery.isLoading ? "Loading cities..." : "Select city"}</option>
                  {(citiesQuery.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <select
                  value={selectedStateId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedStateId(id);
                    setSelectedCityId(null);
                    const name = statesQuery.data?.find((s) => s.id === id)?.name || editing.state;
                    setEditing((prev: PickupCenter | null) => prev ? { ...prev, state: name } : prev);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={!selectedCountryId || statesQuery.isLoading}
                >
                  <option value="">{statesQuery.isLoading ? "Loading states..." : "Select state"}</option>
                  {(statesQuery.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <select
                  value={selectedCountryId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setSelectedCountryId(id);
                    setSelectedStateId(null);
                    setSelectedCityId(null);
                    const name = countriesQuery.data?.find((c) => c.id === id)?.name || editing.country;
                    setEditing((prev: PickupCenter | null) => prev ? { ...prev, country: name } : prev);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  disabled={countriesQuery.isLoading}
                >
                  <option value="">{countriesQuery.isLoading ? "Loading countries..." : "Select country"}</option>
                  {(countriesQuery.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact name</label>
                <input
                  value={editing.contactName || ""}
                  onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, contactName: e.target.value } : prev)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing((prev: PickupCenter | null) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                  />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-500 text-white" onClick={handleSave} disabled={upsert.isPending}>
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Pickup Center Details</div>
              <Button variant="ghost" size="icon" onClick={() => setViewing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border">
                {viewing.logoUrl ? <img src={viewing.logoUrl} alt={viewing.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-foreground">{viewing.name}</h3>
                  <Badge variant="outline" className={cn("text-[10px]", viewing.isActive ? "text-emerald-600 border-emerald-500/60" : "text-amber-600 border-amber-500/60")}>{viewing.isActive ? "active" : "inactive"}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{viewing.addressLine1}{viewing.addressLine2 ? ", " + viewing.addressLine2 : ""}</div>
                <div className="text-sm text-foreground">
                  {formatLocation(viewing).city || viewing.city}, {formatLocation(viewing).state || viewing.state}, {formatLocation(viewing).country || viewing.country}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2"><UserRound className="h-4 w-4" /> {viewing.contactName || "No contact"}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> {viewing.contactPhone || "No phone"}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button onClick={() => { setEditing({ ...viewing }); setViewing(null); }}>Edit</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
