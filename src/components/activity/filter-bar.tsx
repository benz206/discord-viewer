"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { activityHref, type ActivityQuery, type Granularity } from "@/components/activity/query";

const fieldClass =
  "h-7 rounded bg-surface-3 px-2 text-[13px] text-normal outline-none placeholder:text-faint focus:ring-1 focus:ring-brand";

const labelClass = "flex flex-col gap-1 text-[10px] font-semibold tracking-wide text-channel uppercase";

export function FilterBar({
  query,
  domains,
  eventTypes,
  totalLabel,
  granularity,
}: {
  query: ActivityQuery;
  domains: string[];
  eventTypes: string[];
  totalLabel: string;
  granularity: Granularity;
}) {
  const router = useRouter();

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const value = (key: string) => {
      const entry = data.get(key);
      return typeof entry === "string" && entry.trim() ? entry.trim() : undefined;
    };
    router.push(
      activityHref({
        domain: value("domain"),
        eventType: value("eventType"),
        from: value("from"),
        to: value("to"),
        guildId: value("guildId"),
        channelId: value("channelId"),
        messageId: value("messageId"),
        granularity: query.granularity,
      }),
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(event.currentTarget);
      }}
      onChange={(event) => {
        const target = event.target;
        if (
          target instanceof HTMLSelectElement ||
          (target instanceof HTMLInputElement && target.type === "date")
        ) {
          submit(event.currentTarget);
        }
      }}
      className="flex flex-wrap items-end gap-3 rounded-md border border-divider bg-surface-2 px-3 py-2.5"
    >
      <label className={labelClass}>
        Domain
        <select name="domain" defaultValue={query.domain ?? ""} className={cn(fieldClass, "w-32")}>
          <option value="">All</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Event type
        <input
          name="eventType"
          list="activity-event-types"
          defaultValue={query.eventType ?? ""}
          placeholder="any"
          className={cn(fieldClass, "w-52")}
        />
        <datalist id="activity-event-types">
          {eventTypes.map((eventType) => (
            <option key={eventType} value={eventType} />
          ))}
        </datalist>
      </label>

      <label className={labelClass}>
        From
        <input type="date" name="from" defaultValue={query.from ?? ""} className={cn(fieldClass, "w-36")} />
      </label>

      <label className={labelClass}>
        To
        <input type="date" name="to" defaultValue={query.to ?? ""} className={cn(fieldClass, "w-36")} />
      </label>

      <label className={labelClass}>
        Guild id
        <input name="guildId" defaultValue={query.guildId ?? ""} placeholder="any" className={cn(fieldClass, "w-40 font-mono")} />
      </label>

      <label className={labelClass}>
        Channel id
        <input name="channelId" defaultValue={query.channelId ?? ""} placeholder="any" className={cn(fieldClass, "w-40 font-mono")} />
      </label>

      <label className={labelClass}>
        Message id
        <input name="messageId" defaultValue={query.messageId ?? ""} placeholder="any" className={cn(fieldClass, "w-40 font-mono")} />
      </label>

      <div className="ml-auto flex items-end gap-2">
        <div className="flex flex-col gap-1 text-[10px] font-semibold tracking-wide text-channel uppercase">
          Scale
          <div className="flex h-7 overflow-hidden rounded bg-surface-3">
            {(["day", "month"] as const).map((option) => (
              <Link
                key={option}
                href={activityHref({ ...query, event: undefined, granularity: option })}
                className={cn(
                  "flex items-center px-2 text-[13px] capitalize transition-colors",
                  granularity === option
                    ? "bg-brand text-white"
                    : "text-channel hover:bg-hover hover:text-interactive-hover",
                )}
              >
                {option}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-[10px] font-semibold tracking-wide text-channel uppercase">
          <span className="text-right">{totalLabel} matches</span>
          <div className="flex gap-2">
            <button
              type="submit"
              className="h-7 rounded bg-brand px-3 text-[13px] font-medium text-white normal-case transition-colors hover:bg-brand-hover"
            >
              Apply
            </button>
            <Link
              href="/activity"
              className="flex h-7 items-center gap-1 rounded bg-surface-3 px-2 text-[13px] text-channel normal-case transition-colors hover:text-interactive-hover"
            >
              <X className="size-3.5" />
              Reset
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
