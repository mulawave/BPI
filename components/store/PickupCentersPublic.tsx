"use client";

import { useMemo, useState } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { MapPin, Phone, UserRound, RefreshCw, Eye, X } from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type PickupCenter = RouterOutputs["store"]["listPickupCentersPublic"][number];

export function PickupCentersPublic() {
  const centersQuery = api.store.listPickupCentersPublic.useQuery();
  const [selected, setSelected] = useState<PickupCenter | null>(null);

  const counts = useMemo(() => {
    const list = (centersQuery.data ?? []) as PickupCenter[];
    const active = list.filter((c) => (c as PickupCenter).isActive).length;
    return { active, total: list.length, inactive: list.length - active };
  }, [centersQuery.data]);

  const centers = centersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-muted-foreground">Pickup Centers</div>
          <h1 className="text-2xl font-bold text-foreground">Find a nearby fulfillment location</h1>
          <p className="text-sm text-muted-foreground">Browse active pickup centers and view their details before ordering.</p>
          {centersQuery.isFetching && <div className="text-[11px] text-muted-foreground">Refreshing centers…</div>}
        </div>
        <Button variant="outline" size="sm" onClick={() => centersQuery.refetch()} disabled={centersQuery.isFetching}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 space-y-1 border-emerald-100 dark:border-emerald-900/40">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Active</div>
          <div className="text-3xl font-bold">{counts.active}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Inactive</div>
          <div className="text-3xl font-bold">{counts.inactive}</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Total</div>
          <div className="text-3xl font-bold">{counts.total}</div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {centersQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => <Card key={idx} className="h-48 animate-pulse bg-muted" />)
        ) : centers.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No pickup centers available yet.</Card>
        ) : (
          centers.map((c: PickupCenter) => (
            <Card key={c.id} className="p-4 space-y-3 border-border/60 bg-card/60 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <Badge variant="outline" className={cn("text-[10px]", c.isActive ? "text-emerald-600 border-emerald-500/60" : "text-amber-600 border-amber-500/60")}>{c.isActive ? "active" : "inactive"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{c.addressLine1}{c.addressLine2 ? ", " + c.addressLine2 : ""}</div>
                </div>
              </div>

              <div className="text-sm text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{c.city}, {c.state}, {c.country}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <UserRound className="h-4 w-4" /> {c.contactName || "—"}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" /> {c.contactPhone || "—"}
              </div>

              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setSelected(c)}>
                  <Eye className="h-4 w-4" /> View
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{selected.name}</div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border">
                {selected.logoUrl ? <img src={selected.logoUrl} alt={selected.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No logo</div>}
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">{selected.addressLine1}{selected.addressLine2 ? ", " + selected.addressLine2 : ""}</div>
                <div className="font-medium text-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> {selected.city}, {selected.state}, {selected.country}</div>
                <div className="text-muted-foreground flex items-center gap-2"><UserRound className="h-4 w-4" /> {selected.contactName || "No contact"}</div>
                <div className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> {selected.contactPhone || "No phone"}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
