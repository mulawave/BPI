"use client";

export default function AdminHelpPage() {
  return (
    <div className="min-h-screen pb-12 space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
        <h1 className="text-2xl font-semibold text-foreground">Admin Wiring Status</h1>
        <p className="mt-2 text-muted-foreground">
          Clear view of what is fully wired to real data, partially wired, and still UI-only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Wired</h2>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
              Ready
            </span>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Users</p>
              <p className="mt-1 text-muted-foreground">
                List, details modal, edit modal, role updates, audit history.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Payments</p>
              <p className="mt-1 text-muted-foreground">
                Gateway configs and transaction/ledger-based analytics.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Auth (Admin)</p>
              <p className="mt-1 text-muted-foreground">
                Supports both admin and super_admin access for admin procedures.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Partial</h2>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
              Mixed
            </span>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Settings</p>
              <p className="mt-1 text-muted-foreground">
                Some buttons are UI-only (toast feedback) and need backend wiring to do real work.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Community / Bulk Actions</p>
              <p className="mt-1 text-muted-foreground">
                Confirmations use the in-app confirmation dialog and toasts.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Not Wired</h2>
            <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300">
              Pending
            </span>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Moderators</p>
              <p className="mt-1 text-muted-foreground">
                Backend role enum does not currently include a moderator role.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="font-semibold text-foreground">Maintenance Actions</p>
              <p className="mt-1 text-muted-foreground">
                Actions like cache clears/backups require server-side implementations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
