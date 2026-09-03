import Link from "next/link";

import type { DayCount } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { domainColor } from "@/components/activity/domains";
import { formatCompact, formatCount, formatDay, formatMonth } from "@/components/activity/format";
import { activityHref, type ActivityQuery, type Granularity } from "@/components/activity/query";

export type TimelineSeries = { domain: string; points: DayCount[] };

type Bucket = { key: string; total: number; parts: Array<{ domain: string; count: number }> };

function addMonth(key: string): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;
}

function addDay(key: string): string {
  const next = new Date(`${key}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function buildKeys(min: string, max: string, granularity: Granularity): string[] {
  const keys: string[] = [];
  let cursor = min;
  const step = granularity === "month" ? addMonth : addDay;
  while (cursor <= max && keys.length < 4000) {
    keys.push(cursor);
    cursor = step(cursor);
  }
  return keys;
}

function monthEnd(key: string): string {
  const next = addMonth(key);
  return addDayBackwards(`${next}-01`);
}

function addDayBackwards(day: string): string {
  const previous = new Date(`${day}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}

function bucketize(series: TimelineSeries[], granularity: Granularity): Bucket[] {
  const totals = new Map<string, Map<string, number>>();
  let min: string | null = null;
  let max: string | null = null;

  for (const entry of series) {
    for (const point of entry.points) {
      const key = granularity === "month" ? point.day.slice(0, 7) : point.day;
      if (min === null || key < min) min = key;
      if (max === null || key > max) max = key;
      let byDomain = totals.get(key);
      if (!byDomain) {
        byDomain = new Map();
        totals.set(key, byDomain);
      }
      byDomain.set(entry.domain, (byDomain.get(entry.domain) ?? 0) + point.count);
    }
  }

  if (min === null || max === null) return [];

  return buildKeys(min, max, granularity).map((key) => {
    const byDomain = totals.get(key);
    const parts = series
      .map((entry) => ({ domain: entry.domain, count: byDomain?.get(entry.domain) ?? 0 }))
      .filter((part) => part.count > 0);
    return { key, total: parts.reduce((sum, part) => sum + part.count, 0), parts };
  });
}

function bucketTitle(bucket: Bucket, granularity: Granularity): string {
  const label = granularity === "month" ? formatMonth(bucket.key) : formatDay(bucket.key);
  const breakdown = bucket.parts.map((part) => `${part.domain} ${formatCount(part.count)}`).join(", ");
  return `${label} — ${formatCount(bucket.total)} events${breakdown ? ` (${breakdown})` : ""}`;
}

function axisTicks(buckets: Bucket[], granularity: Granularity): Array<{ index: number; label: string }> {
  const boundaries: Array<{ index: number; key: string }> = [];
  const unit = granularity === "month" ? 4 : 7;
  buckets.forEach((bucket, index) => {
    const current = bucket.key.slice(0, unit);
    if (index === 0 || current !== buckets[index - 1].key.slice(0, unit)) {
      boundaries.push({ index, key: bucket.key });
    }
  });

  const step = Math.max(1, Math.ceil(boundaries.length / 12));
  return boundaries
    .filter((_, index) => index % step === 0)
    .map((boundary, index) => ({
      index: boundary.index,
      label:
        granularity === "month"
          ? boundary.key.slice(0, 4)
          : index === 0 || boundary.key.slice(5, 7) === "01"
            ? formatMonth(boundary.key.slice(0, 7))
            : formatMonth(boundary.key.slice(0, 7)).slice(0, 3),
    }));
}

export function TimelineChart({
  series,
  granularity,
  query,
  className,
}: {
  series: TimelineSeries[];
  granularity: Granularity;
  query: ActivityQuery;
  className?: string;
}) {
  const buckets = bucketize(series, granularity);
  if (buckets.length === 0) {
    return (
      <div className={cn("rounded-md border border-divider bg-surface-2 px-4 py-8 text-center text-sm text-channel", className)}>
        No events match this filter.
      </div>
    );
  }

  const max = Math.max(...buckets.map((bucket) => bucket.total));
  const width = buckets.length;
  const gap = buckets.length > 200 ? 0 : 0.18;
  const barWidth = 1 - gap;
  const ticks = axisTicks(buckets, granularity);

  return (
    <div className={cn("rounded-md border border-divider bg-surface-2 p-3", className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="h-px w-full bg-divider/60" />
          ))}
        </div>
        <svg
          viewBox={`0 0 ${width} 100`}
          preserveAspectRatio="none"
          className="relative block h-44 w-full"
          role="img"
          aria-label="Events over time"
        >
          {buckets.map((bucket, index) => {
            let offset = 0;
            const column = (
              <>
                {bucket.parts.map((part) => {
                  const height = (part.count / max) * 100;
                  const y = 100 - offset - height;
                  offset += height;
                  return (
                    <rect
                      key={part.domain}
                      x={index + gap / 2}
                      y={y}
                      width={barWidth}
                      height={Math.max(height, bucket.total > 0 ? 0.4 : 0)}
                      fill={domainColor(part.domain)}
                    />
                  );
                })}
                <rect
                  x={index}
                  y={0}
                  width={1}
                  height={100}
                  fill="transparent"
                  className="hover:fill-white/10"
                >
                  <title>{bucketTitle(bucket, granularity)}</title>
                </rect>
              </>
            );

            if (granularity !== "month") {
              return <g key={bucket.key}>{column}</g>;
            }
            return (
              <Link
                key={bucket.key}
                href={activityHref({
                  ...query,
                  event: undefined,
                  granularity: undefined,
                  from: `${bucket.key}-01`,
                  to: monthEnd(bucket.key),
                })}
                prefetch={false}
              >
                {column}
              </Link>
            );
          })}
        </svg>
      </div>

      <div className="relative mt-1 h-4">
        {ticks.map((tick) => (
          <span
            key={tick.index}
            className="absolute top-0 text-[11px] text-faint tabular-nums"
            style={{ left: `${(tick.index / width) * 100}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-channel">
        <span className="text-faint">
          peak {formatCompact(max)} / {granularity === "month" ? "month" : "day"}
        </span>
        {series
          .filter((entry) => entry.points.length > 0)
          .map((entry) => (
            <span key={entry.domain} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: domainColor(entry.domain) }}
              />
              {entry.domain}
            </span>
          ))}
        {granularity === "month" ? <span className="text-faint">click a month to zoom in</span> : null}
      </div>
    </div>
  );
}
