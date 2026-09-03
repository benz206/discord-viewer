import { Activity } from "lucide-react";

import {
  countActivityEvents,
  getActivityDaily,
  listActivityEventTypes,
  listActivityEvents,
} from "@/lib/data/activity";
import { ActivityExplorer } from "@/components/activity/activity-explorer";
import { DOMAIN_ORDER } from "@/components/activity/domains";
import { FilterBar } from "@/components/activity/filter-bar";
import { TimelineChart, type TimelineSeries } from "@/components/activity/timeline-chart";
import { formatCount } from "@/components/activity/format";
import { parseActivityQuery, pickGranularity, type ActivityQuery } from "@/components/activity/query";
import { apiQueryString, listOptionsFor } from "@/app/activity/list-options";
import { resolveActivityContext } from "@/app/activity/resolve-context";

function daySpan(series: TimelineSeries[]): number {
  let min: string | null = null;
  let max: string | null = null;
  for (const entry of series) {
    for (const point of entry.points) {
      if (min === null || point.day < min) min = point.day;
      if (max === null || point.day > max) max = point.day;
    }
  }
  if (!min || !max) return 0;
  return Math.round((Date.parse(`${max}T00:00:00Z`) - Date.parse(`${min}T00:00:00Z`)) / 86_400_000) + 1;
}

function headline(query: ActivityQuery): string {
  if (query.eventType) return query.eventType;
  if (query.domain) return `${query.domain} events`;
  return "All activity";
}

function subtitle(query: ActivityQuery): string {
  const parts: string[] = [];
  if (query.domain && query.eventType) parts.push(query.domain);
  if (query.from || query.to) parts.push(`${query.from ?? "start"} → ${query.to ?? "end"}`);
  if (query.guildId) parts.push(`guild ${query.guildId}`);
  if (query.channelId) parts.push(`channel ${query.channelId}`);
  if (query.messageId) parts.push(`message ${query.messageId}`);
  return parts.join(" · ");
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseActivityQuery(await searchParams);
  const options = listOptionsFor(query);
  const page = listActivityEvents(options);
  const context = resolveActivityContext(page.events);

  const exactTotal = query.messageId ? null : countActivityEvents(options);
  const totalLabel =
    exactTotal !== null
      ? formatCount(exactTotal)
      : `${formatCount(page.events.length)}${page.nextCursor ? "+" : ""}`;

  const series: TimelineSeries[] = DOMAIN_ORDER.filter(
    (domain) => !query.domain || domain === query.domain,
  ).map((domain) => ({
    domain,
    points: getActivityDaily({
      domain,
      eventType: query.eventType,
      from: query.from,
      to: query.to,
    }),
  }));

  const granularity = pickGranularity(query, daySpan(series));
  const types = listActivityEventTypes();
  const eventTypes = [...new Set(types.map((type) => type.eventType))].sort();
  const apiQuery = apiQueryString(query);
  const selected = Number(query.event);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <Activity className="size-5 shrink-0 text-channel" />
        <h1 className="shrink-0 font-mono text-base leading-5 font-semibold text-header">
          {headline(query)}
        </h1>
        <span aria-hidden className="h-6 w-px shrink-0 bg-divider" />
        <p className="min-w-0 flex-1 truncate text-sm text-channel">
          {subtitle(query) || "Analytics events extracted from the data package"}
        </p>
        <span className="shrink-0 text-sm text-faint tabular-nums">{totalLabel} events</span>
      </header>

      <ActivityExplorer
        key={apiQuery}
        initialEvents={page.events}
        initialCursor={page.nextCursor}
        initialContext={context}
        initialSelectedId={Number.isInteger(selected) && selected > 0 ? selected : null}
        apiQuery={apiQuery}
        totalLabel={totalLabel}
      >
        <FilterBar
          query={query}
          domains={[...DOMAIN_ORDER]}
          eventTypes={eventTypes}
          totalLabel={totalLabel}
          granularity={granularity}
        />
        <TimelineChart series={series} granularity={granularity} query={query} />
      </ActivityExplorer>
    </>
  );
}
