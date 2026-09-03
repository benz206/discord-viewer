"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { domainColor } from "@/components/activity/domains";
import { formatCount, formatDay } from "@/components/activity/format";
import { activityHref } from "@/components/activity/query";

export type EventTypeStat = {
  domain: string;
  eventType: string;
  count: number;
  activeDays: number;
  firstDay: string | null;
  lastDay: string | null;
};

type SortKey = "eventType" | "count" | "activeDays" | "firstDay" | "lastDay" | "domain";

const COLUMNS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "domain", label: "Domain" },
  { key: "eventType", label: "Event type" },
  { key: "count", label: "Events", align: "right" },
  { key: "activeDays", label: "Active days", align: "right" },
  { key: "firstDay", label: "First seen" },
  { key: "lastDay", label: "Last seen" },
];

export function TypesTable({ rows }: { rows: EventTypeStat[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "count", desc: true });

  const max = rows.reduce((peak, row) => Math.max(peak, row.count), 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? rows.filter(
          (row) =>
            row.eventType.toLowerCase().includes(needle) || row.domain.toLowerCase().includes(needle),
        )
      : rows;
    return [...filtered].sort((a, b) => {
      const left = a[sort.key];
      const right = b[sort.key];
      let result: number;
      if (typeof left === "number" && typeof right === "number") result = left - right;
      else result = String(left ?? "").localeCompare(String(right ?? ""));
      return sort.desc ? -result : result;
    });
  }, [query, rows, sort]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-channel" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter event types"
            className="h-8 w-full rounded bg-surface-3 pr-2 pl-7 text-sm text-normal outline-none placeholder:text-faint"
          />
        </div>
        <span className="text-sm text-channel">
          {formatCount(visible.length)} of {formatCount(rows.length)} types
        </span>
      </div>

      <div className="overflow-hidden rounded-md border border-divider bg-surface-2">
        <div className="grid grid-cols-[110px_minmax(0,1fr)_120px_110px_130px_130px] gap-3 border-b border-divider px-3 py-2 text-[10px] font-semibold tracking-wide text-faint uppercase">
          {COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() =>
                setSort((current) =>
                  current.key === column.key
                    ? { key: column.key, desc: !current.desc }
                    : { key: column.key, desc: column.key === "count" || column.key === "activeDays" },
                )
              }
              className={cn(
                "flex items-center gap-1 uppercase transition-colors hover:text-interactive-hover",
                column.align === "right" && "justify-end",
                sort.key === column.key && "text-normal",
              )}
            >
              {column.label}
              {sort.key === column.key ? (
                sort.desc ? (
                  <ArrowDown className="size-3" />
                ) : (
                  <ArrowUp className="size-3" />
                )
              ) : null}
            </button>
          ))}
        </div>

        {visible.map((row) => (
          <Link
            key={`${row.domain}:${row.eventType}`}
            href={activityHref({ domain: row.domain, eventType: row.eventType })}
            className="grid grid-cols-[110px_minmax(0,1fr)_120px_110px_130px_130px] items-center gap-3 border-t border-divider/50 px-3 py-1.5 text-[13px] transition-colors hover:bg-hover"
          >
            <span className="flex items-center gap-1.5 text-channel">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: domainColor(row.domain) }}
              />
              {row.domain}
            </span>
            <span className="min-w-0 truncate font-mono text-normal">{row.eventType}</span>
            <span className="relative flex items-center justify-end gap-2 tabular-nums text-normal">
              <span
                aria-hidden
                className="h-2 rounded-sm"
                style={{
                  width: `${Math.max((row.count / max) * 56, 2)}px`,
                  backgroundColor: domainColor(row.domain),
                  opacity: 0.55,
                }}
              />
              {formatCount(row.count)}
            </span>
            <span className="text-right text-channel tabular-nums">{formatCount(row.activeDays)}</span>
            <span className="text-channel tabular-nums">{formatDay(row.firstDay)}</span>
            <span className="text-channel tabular-nums">{formatDay(row.lastDay)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
