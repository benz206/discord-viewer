"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { EventDetail, type ActivityEventDetail } from "@/components/activity/event-detail";

export function EventPanel({ eventId, onClose }: { eventId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<ActivityEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/activity/events/${eventId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Event ${eventId} not found`);
        return (await response.json()) as ActivityEventDetail;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-divider px-3">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-header">
          Event #{eventId}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event"
          className="rounded p-1 text-channel transition-colors hover:bg-hover hover:text-interactive-hover [&_svg]:size-4"
        >
          <X />
        </button>
      </div>
      <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto p-3">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {!error && !detail ? <p className="text-sm text-channel">Loading…</p> : null}
        {detail ? <EventDetail {...detail} compact /> : null}
      </div>
    </>
  );
}
