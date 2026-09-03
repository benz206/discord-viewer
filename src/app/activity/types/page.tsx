import { Table2 } from "lucide-react";

import { getActivityDaily, listActivityDomains, listActivityEventTypes } from "@/lib/data/activity";
import { formatCount } from "@/components/activity/format";
import { sortDomains } from "@/components/activity/domains";
import { TypesTable, type EventTypeStat } from "@/components/activity/types-table";

export default function ActivityTypesPage() {
  const domains = sortDomains(listActivityDomains());
  const rows: EventTypeStat[] = listActivityEventTypes().map((type) => {
    const days = getActivityDaily({ domain: type.domain, eventType: type.eventType });
    return {
      domain: type.domain,
      eventType: type.eventType,
      count: type.count,
      activeDays: days.length,
      firstDay: days[0]?.day ?? null,
      lastDay: days[days.length - 1]?.day ?? null,
    };
  });

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 px-4 shadow-[0_1px_0_rgba(0,0,0,0.2)]">
        <Table2 className="size-5 shrink-0 text-channel" />
        <h1 className="shrink-0 text-base leading-5 font-semibold text-header">Event types</h1>
        <span aria-hidden className="h-6 w-px shrink-0 bg-divider" />
        <p className="min-w-0 flex-1 truncate text-sm text-channel">
          {formatCount(rows.length)} types across {domains.length} domains ·{" "}
          {formatCount(total)} events
        </p>
      </header>

      <div className="scrollbar-discord min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {domains.map((domain) => (
              <div key={domain.domain} className="rounded-md border border-divider bg-surface-2 p-3">
                <div className="text-sm font-semibold text-header">{domain.domain}</div>
                <div className="mt-1 text-[13px] text-channel tabular-nums">
                  {formatCount(domain.count)} events · {formatCount(domain.typeCount)} types
                </div>
              </div>
            ))}
          </div>
          <TypesTable rows={rows} />
        </div>
      </div>
    </>
  );
}
