"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityEventRow as ActivityEvent } from "@/lib/data/types";
import { formatCount } from "@/components/activity/format";
import { EventPanel } from "@/components/activity/event-panel";
import { EventRow } from "@/components/activity/event-row";
import type { ActivityContext } from "@/components/activity/context";

type EventsResponse = {
  events: ActivityEvent[];
  nextCursor: string | null;
  context: ActivityContext;
};

function mergeContext(base: ActivityContext, next: ActivityContext): ActivityContext {
  return {
    guilds: { ...base.guilds, ...next.guilds },
    channels: { ...base.channels, ...next.channels },
    messages: { ...base.messages, ...next.messages },
  };
}

export function ActivityExplorer({
  initialEvents,
  initialCursor,
  initialContext,
  initialSelectedId,
  apiQuery,
  totalLabel,
  children,
}: {
  initialEvents: ActivityEvent[];
  initialCursor: string | null;
  initialContext: ActivityContext;
  initialSelectedId: number | null;
  apiQuery: string;
  totalLabel: string;
  children: React.ReactNode;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [context, setContext] = useState(initialContext);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    try {
      const search = new URLSearchParams(apiQuery);
      search.set("cursor", cursor);
      const response = await fetch(`/api/activity/events?${search.toString()}`);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = (await response.json()) as EventsResponse;
      setEvents((current) => [...current, ...data.events]);
      setContext((current) => mergeContext(current, data.context));
      setCursor(data.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load more events");
    } finally {
      setLoading(false);
    }
  }, [apiQuery, cursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { root: scrollRef.current, rootMargin: "600px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, error, loadMore, loading]);

  const select = (id: number) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("event", String(id));
    window.history.replaceState(null, "", url);
  };

  const close = () => {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div ref={scrollRef} className="scrollbar-discord min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {children}

          <div className="overflow-hidden rounded-md border border-divider bg-surface-2">
            <div className="grid grid-cols-[132px_180px_minmax(0,1fr)] gap-3 border-b border-l-2 border-divider border-l-transparent px-3 py-1.5 text-[10px] font-semibold tracking-wide text-faint uppercase">
              <span>Timestamp (UTC)</span>
              <span>Event type</span>
              <span>Summary</span>
            </div>
            {events.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-channel">No events match this filter.</p>
            ) : (
              events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  context={context}
                  selected={selectedId === event.id}
                  onSelect={select}
                />
              ))
            )}
          </div>

          <div ref={sentinelRef} className="flex items-center justify-center gap-3 pb-6 text-sm text-channel">
            {error ? <span className="text-danger">{error}</span> : null}
            {cursor ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loading}
                className="rounded bg-surface-3 px-3 py-1.5 text-[13px] text-channel transition-colors hover:text-interactive-hover disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            ) : (
              <span className="text-faint">
                {formatCount(events.length)} of {totalLabel} events shown
              </span>
            )}
          </div>
        </div>
      </div>

      {selectedId !== null ? (
        <aside className="hidden w-[420px] shrink-0 flex-col border-l border-divider bg-surface-2 lg:flex">
          <EventPanel key={selectedId} eventId={selectedId} onClose={close} />
        </aside>
      ) : null}
    </div>
  );
}
