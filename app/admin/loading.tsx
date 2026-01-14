export default function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-3xl dark:opacity-5" />
        <div className="absolute bottom-0 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] opacity-10 blur-3xl dark:opacity-5" />
      </div>

      <div className="premium-card rounded-2xl px-8 py-7 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-[hsl(var(--primary))]" />
        <p className="text-sm font-semibold text-foreground">Loading admin module…</p>
        <p className="mt-1 text-xs text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  );
}
