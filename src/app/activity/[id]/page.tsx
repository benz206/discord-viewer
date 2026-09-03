import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { getActivityEvent } from "@/lib/data/activity";
import { getPackageStats } from "@/lib/data/meta";
import { cn } from "@/lib/utils";
import { EventDetail } from "@/components/activity/event-detail";
import { effectiveIds } from "@/components/activity/context";
import { activityHref } from "@/components/activity/query";
import { resolveActivityContext } from "@/app/activity/resolve-context";

const navClass =
  "flex h-7 items-center gap-1 rounded bg-surface-3 px-2 text-[13px] text-channel transition-colors hover:text-interactive-hover [&_svg]:size-4";

export default async function ActivityEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric < 1) notFound();

  const found = getActivityEvent(numeric);
  if (!found) notFound();

  const ids = effectiveIds(found.event, found.raw);
  const context = resolveActivityContext([{ ...found.event, ...ids }]);
  const lastId = getPackageStats().activityEventCount;

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <Link href="/activity" className="flex items-center gap-1.5 text-channel hover:text-interactive-hover">
          <ArrowLeft className="size-4" />
          <span className="text-sm">Activity</span>
        </Link>
        <span aria-hidden className="h-6 w-px shrink-0 bg-divider" />
        <h1 className="min-w-0 flex-1 truncate font-mono text-base leading-5 font-semibold text-header">
          {found.event.eventType}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={activityHref({
              domain: found.event.domain,
              eventType: found.event.eventType,
              event: String(found.event.id),
            })}
            className={navClass}
          >
            Open in explorer
          </Link>
          <Link
            href={`/activity/${numeric - 1}`}
            aria-disabled={numeric <= 1}
            className={cn(navClass, numeric <= 1 && "pointer-events-none opacity-40")}
          >
            <ChevronLeft />
            Prev
          </Link>
          <Link
            href={`/activity/${numeric + 1}`}
            aria-disabled={numeric >= lastId}
            className={cn(navClass, numeric >= lastId && "pointer-events-none opacity-40")}
          >
            Next
            <ChevronRight />
          </Link>
        </div>
      </header>

      <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-4">
          <EventDetail event={found.event} raw={found.raw} context={context} />
        </div>
      </div>
    </>
  );
}
