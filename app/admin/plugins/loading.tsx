export default function AdminPluginsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
    </div>
  );
}
