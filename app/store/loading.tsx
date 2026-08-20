export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
