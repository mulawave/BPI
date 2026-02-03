"use client";

import { api } from "@/client/trpc";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

export default function AdminHelpPage() {
  const { data, isLoading, error } = api.admin.getAdminWiringStatus.useQuery();

  const statusConfig: Record<string, { label: string; badge: string; accent: string }> = {
    wired: {
      label: "Wired",
      badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
      accent: "border-emerald-500/40",
    },
    partial: {
      label: "Partial",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
      accent: "border-amber-500/40",
    },
    pending: {
      label: "Pending",
      badge: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
      accent: "border-rose-500/40",
    },
  };

  const grouped = (data?.features || []).reduce(
    (acc: any, feature: any) => {
      (acc[feature.status] = acc[feature.status] || []).push(feature);
      return acc;
    },
    { wired: [], partial: [], pending: [] }
  );

  const copyProcedures = async (procedures: string[]) => {
    if (!procedures || procedures.length === 0) return;
    await navigator.clipboard.writeText(procedures.join("\n"));
    toast.success("Copied tRPC procedures");
  };

  const copyRouterPath = async (path: string | undefined) => {
    if (!path) return;
    await navigator.clipboard.writeText(path);
    toast.success("Copied router path");
  };

  const formatDate = (value: any) => {
    if (!value) return "n/a";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  return (
    <div className="min-h-screen pb-12 space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
        <h1 className="text-2xl font-semibold text-foreground">Admin Wiring Status</h1>
        <p className="mt-2 text-muted-foreground">
          Live snapshot of wired vs partial admin features, sourced from database signals.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "..."}
        </p>
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="Admin Wiring Status Guide"
        sections={[
          {
            title: "Wiring Status Overview",
            icon: <span className="w-5 h-5 text-blue-600">🔌</span>,
            items: [
              "View <strong>implementation status</strong> of all admin features",
              "Track <strong>wired, partial, and pending</strong> feature states",
              "Identify <strong>completed vs in-progress</strong> admin functionality",
              "Access <strong>tRPC procedure names</strong> and router paths",
              "Monitor <strong>last update timestamps</strong> for each feature",
              "<strong>Database-driven</strong> live status from system signals"
            ]
          },
          {
            title: "Status Categories",
            icon: <span className="w-5 h-5 text-green-600">✅</span>,
            items: [
              { label: "Wired", text: "Fully implemented with complete backend and frontend integration" },
              { label: "Partial", text: "Backend exists but missing UI, or UI exists without full backend" },
              { label: "Pending", text: "Planned feature not yet implemented" }
            ]
          },
          {
            title: "Using Wiring Status",
            icon: <span className="w-5 h-5 text-orange-600">🔧</span>,
            items: [
              "<strong>Check feature readiness</strong> before assigning admin tasks",
              "<strong>Copy tRPC procedures</strong> - Click to copy API endpoint names for development",
              "<strong>Copy router path</strong> - Get file location of backend implementation",
              "<strong>Open route</strong> - Navigate directly to feature's admin page",
              "<strong>View stats</strong> - See feature-specific metrics (user count, last update, etc.)",
              "<strong>Prioritize partial features</strong> - Complete these for full functionality"
            ]
          },
          {
            title: "Feature Statistics",
            icon: <span className="w-5 h-5 text-purple-600">📊</span>,
            items: [
              "<strong>Last Updated</strong> - When feature was last modified",
              "<strong>Route</strong> - Admin panel URL path (e.g., /admin/users)",
              "<strong>Component</strong> - React component file name",
              "<strong>Router Path</strong> - Backend tRPC router file location",
              "<strong>Procedures</strong> - List of API endpoints for this feature",
              "<strong>Custom Stats</strong> - Feature-specific metrics (e.g., total users, pending count)"
            ]
          },
          {
            title: "Developer Actions",
            icon: <span className="w-5 h-5 text-blue-600">👨‍💻</span>,
            items: [
              "<strong>Copy tRPC</strong> - Get procedure names for API calls in code",
              "<strong>Copy Router Path</strong> - Locate backend file for modifications",
              "<strong>Open Route</strong> - Test feature UI directly",
              "<strong>Review Stats</strong> - Identify performance or data issues",
              "Use this page as <strong>development roadmap</strong> to track progress"
            ]
          }
        ]}
        features={[
          "Live feature implementation status",
          "Wired/Partial/Pending categorization",
          "tRPC procedure name display",
          "Router path and component info",
          "Copy-to-clipboard helpers",
          "Direct route navigation",
          "Feature-specific statistics",
          "Database-driven live updates"
        ]}
        proTip="Use this page as your <strong>admin feature inventory</strong> - bookmark it for quick reference. When assigning tasks to admins, <strong>verify feature is 'Wired'</strong> before creating workflows. For developers, <strong>copy tRPC procedure names</strong> to speed up API integration. <strong>Prioritize 'Partial' features</strong> for completion - they're closest to being production-ready. <strong>Export feature list</strong> for project planning and sprint tracking."
        warning="<strong>Pending features may have no UI</strong> - avoid assigning admin tasks until status changes to Wired. <strong>Partial features may have bugs</strong> or incomplete functionality - test thoroughly before production use. <strong>Router paths are code file locations</strong> - only useful for developers with codebase access. <strong>Stats may be cached</strong> - manually refresh page for latest status if you just deployed code changes."
      />

      {error && (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load wiring status: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6 text-sm text-muted-foreground">
          Loading live wiring status...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {(["wired", "partial", "pending"] as const).map((bucket) => (
              <div key={bucket} className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{statusConfig[bucket].label}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[bucket].badge}`}>
                    {statusConfig[bucket].label}
                  </span>
                </div>

                <div className="mt-4 space-y-4 text-sm">
                  {(grouped[bucket] || []).map((feature: any) => {
                    const statEntries = Object.entries(feature.stats || {});
                    return (
                      <div key={feature.key} className={`rounded-xl border ${statusConfig[bucket].accent} bg-background/40 p-4 space-y-3`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{feature.title}</p>
                            <p className="text-xs text-muted-foreground">Last updated: {feature.stats?.lastUpdated ? new Date(feature.stats.lastUpdated as string).toLocaleString() : "n/a"}</p>
                            <p className="text-xs text-muted-foreground">Route: {feature.route || "-"}</p>
                          </div>
                          <span className="text-[11px] text-muted-foreground">{feature.routerPath || "server/trpc/router/admin.ts"}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {statEntries.length === 0 && (
                            <p className="text-muted-foreground">No stats</p>
                          )}
                          {statEntries.map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-border/60 bg-card/50 p-3">
                              <p className="text-muted-foreground capitalize">{key}</p>
                              <p className="font-semibold text-foreground">{typeof value === "string" || typeof value === "number" ? value : value ? new Date(value as string).toLocaleString() : "n/a"}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {feature.route && (
                            <Link
                              href={feature.route}
                              className="rounded-lg border border-border px-3 py-1.5 hover:bg-background"
                            >
                              Open route
                            </Link>
                          )}
                          <button
                            onClick={() => copyProcedures(feature.procedures || [])}
                            className="rounded-lg border border-border px-3 py-1.5 hover:bg-background"
                          >
                            Copy tRPC
                          </button>
                          <button
                            onClick={() => copyRouterPath(feature.routerPath)}
                            className="rounded-lg border border-border px-3 py-1.5 hover:bg-background"
                          >
                            Router path
                          </button>
                          {feature.component && (
                            <span className="rounded-lg border border-border px-3 py-1.5 bg-background/60">
                              Component: {feature.component}
                            </span>
                          )}
                          {feature.stats?.lastUpdated && (
                            <span className="rounded-lg border border-border px-3 py-1.5 bg-background/60">
                              Last updated: {formatDate(feature.stats.lastUpdated)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(grouped[bucket] || []).length === 0 && (
                    <p className="text-muted-foreground text-xs">No items in this bucket.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
