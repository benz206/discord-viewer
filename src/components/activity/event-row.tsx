"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActivityEventRow as ActivityEvent } from "@/lib/data/types";
import { domainColor } from "@/components/activity/domains";
import { formatShortTimestamp } from "@/components/activity/format";
import { EventMeta, EventSummary } from "@/components/activity/event-summary";
import type { ActivityContext } from "@/components/activity/context";

export function EventRow({
  event,
  context,
  selected,
  onSelect,
}: {
  event: ActivityEvent;
  context: ActivityContext;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(event.id)}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
          keyEvent.preventDefault();
          onSelect(event.id);
        }
      }}
      className={cn(
        "group grid cursor-pointer grid-cols-[132px_180px_minmax(0,1fr)_auto] items-center gap-3 border-l-2 px-3 py-1 text-[13px] outline-none",
        selected
          ? "border-brand bg-selected"
          : "border-transparent hover:bg-hover focus-visible:bg-hover",
      )}
    >
      <span className="font-mono text-[12px] text-faint tabular-nums">
        {formatShortTimestamp(event.ts)}
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: domainColor(event.domain) }}
          title={event.domain}
        />
        <span className="truncate font-mono text-[12.5px] text-normal">{event.eventType}</span>
      </span>
      <span className="min-w-0 truncate">
        <EventSummary event={event} context={context} />
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="hidden max-w-[220px] truncate text-[11px] text-faint xl:block">
          <EventMeta event={event} />
        </span>
        <Link
          href={`/activity/${event.id}`}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          aria-label={`Open event ${event.id}`}
          className="text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-interactive-hover focus-visible:opacity-100 [&_svg]:size-3.5"
        >
          <ExternalLink />
        </Link>
      </span>
    </div>
  );
}
