"use client";

type TimelineEvent = {
  id: string;
  eventType: string;
  summary: string;
  createdAt: string | Date;
};

export default function PluginEventTimeline({
  events,
  isLoading,
}: {
  events: TimelineEvent[];
  isLoading?: boolean;
}) {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <h3 className="mb-3 text-base font-semibold text-foreground">Lifecycle Timeline</h3>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading lifecycle events...</p>
      ) : events.length ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{event.eventType}</span>
                <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{event.summary}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No install events recorded yet.</p>
      )}
    </div>
  );
}
