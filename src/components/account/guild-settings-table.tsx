"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FieldList } from "@/components/account/field-list";
import { BoolValue, Mono, Pill } from "@/components/account/section";
import { MESSAGE_NOTIFICATION_LEVELS, NOTIFY_HIGHLIGHTS, enumName } from "@/components/account/enums";
import { formatDateTime, formatNumber, type Rec } from "@/components/account/format";

export type ChannelOverrideView = {
  channelId: string;
  channelName: string | null;
  channelLink: string | null;
  raw: Rec;
};

export type GuildSettingView = {
  key: string;
  guildId: string | null;
  guildName: string | null;
  guildLink: string | null;
  overrides: ChannelOverrideView[];
  raw: Rec;
};

function MuteConfig({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return <span className="text-faint">null</span>;
  const config = value as Rec;
  const window = Number(config.selected_time_window ?? -1);
  return (
    <span className="text-xs">
      {config.end_time ? formatDateTime(config.end_time) : "no end time"}
      {window >= 0 ? ` · ${formatNumber(window)}s window` : " · indefinite"}
    </span>
  );
}

export function GuildSettingsTable({ rows }: { rows: GuildSettingView[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      if ((row.guildName ?? "").toLowerCase().includes(needle)) return true;
      if ((row.guildId ?? "").includes(needle)) return true;
      return row.overrides.some(
        (override) =>
          override.channelId.includes(needle) || (override.channelName ?? "").toLowerCase().includes(needle),
      );
    });
  }, [rows, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-channel" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by guild name, guild id, or channel"
            className="h-9 bg-surface-3 pl-8 text-sm"
          />
        </div>
        <span className="shrink-0 text-xs text-channel">
          {formatNumber(filtered.length)} / {formatNumber(rows.length)}
        </span>
      </div>

      <div className="scrollbar-discord overflow-x-auto rounded-lg bg-surface-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
              <th className="px-3 py-2 font-semibold">Guild</th>
              <th className="px-3 py-2 font-semibold">Muted</th>
              <th className="px-3 py-2 font-semibold">Notifications</th>
              <th className="px-3 py-2 font-semibold">Mobile push</th>
              <th className="px-3 py-2 font-semibold">Suppress @everyone</th>
              <th className="px-3 py-2 font-semibold">Suppress roles</th>
              <th className="px-3 py-2 font-semibold">Mute events</th>
              <th className="px-3 py-2 font-semibold">Hide muted</th>
              <th className="px-3 py-2 font-semibold">Highlights</th>
              <th className="px-3 py-2 font-semibold">Flags</th>
              <th className="px-3 py-2 font-semibold">Version</th>
              <th className="px-3 py-2 font-semibold">Overrides</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const raw = row.raw;
              const expanded = open === row.key;
              return (
                <Fragment key={row.key}>
                  <tr
                    onClick={() => setOpen(expanded ? null : row.key)}
                    className={cn("cursor-pointer border-b border-divider hover:bg-hover", expanded && "bg-hover")}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <ChevronRight
                          className={cn("size-3.5 shrink-0 text-channel transition-transform", expanded && "rotate-90")}
                        />
                        {row.guildLink ? (
                          <Link
                            href={row.guildLink}
                            onClick={(event) => event.stopPropagation()}
                            className="font-medium text-link hover:underline"
                          >
                            {row.guildName}
                          </Link>
                        ) : (
                          <span className="font-medium text-channel">
                            {row.guildName ?? (row.guildId ? "Not in package" : "Global (no guild)")}
                          </span>
                        )}
                        {row.guildId ? <Mono className="text-[11px] whitespace-nowrap text-faint">{row.guildId}</Mono> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.muted)} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {enumName(MESSAGE_NOTIFICATION_LEVELS, raw.message_notifications)}
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.mobile_push)} />
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.suppress_everyone)} />
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.suppress_roles)} />
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.mute_scheduled_events)} />
                    </td>
                    <td className="px-3 py-2">
                      <BoolValue value={Boolean(raw.hide_muted_channels)} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {enumName(NOTIFY_HIGHLIGHTS, raw.notify_highlights)}
                    </td>
                    <td className="px-3 py-2">
                      <Mono>{formatNumber(Number(raw.flags ?? 0))}</Mono>
                    </td>
                    <td className="px-3 py-2">
                      <Mono>{String(raw.version ?? "—")}</Mono>
                    </td>
                    <td className="px-3 py-2">
                      {row.overrides.length > 0 ? (
                        <Pill tone="brand">{row.overrides.length}</Pill>
                      ) : (
                        <span className="text-faint">0</span>
                      )}
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="border-b border-divider bg-surface-3/40">
                      <td colSpan={12} className="px-3 py-4">
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="pb-2 text-[11px] font-bold tracking-wide text-channel uppercase">
                              Mute config
                            </p>
                            <MuteConfig value={raw.mute_config} />
                          </div>
                          <div>
                            <p className="pb-2 text-[11px] font-bold tracking-wide text-channel uppercase">
                              Channel overrides ({row.overrides.length})
                            </p>
                            {row.overrides.length === 0 ? (
                              <p className="text-sm text-faint">No channel overrides.</p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
                                    <th className="px-2 py-1.5 font-semibold">Channel</th>
                                    <th className="px-2 py-1.5 font-semibold">Notifications</th>
                                    <th className="px-2 py-1.5 font-semibold">Muted</th>
                                    <th className="px-2 py-1.5 font-semibold">Collapsed</th>
                                    <th className="px-2 py-1.5 font-semibold">Mute config</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.overrides.map((override) => (
                                    <tr key={override.channelId} className="border-b border-divider/60">
                                      <td className="px-2 py-1.5">
                                        {override.channelLink ? (
                                          <Link href={override.channelLink} className="text-link hover:underline">
                                            #{override.channelName}
                                          </Link>
                                        ) : (
                                          <span className="text-channel">Not in package</span>
                                        )}
                                        <Mono className="ml-2 text-[11px] text-faint">{override.channelId}</Mono>
                                      </td>
                                      <td className="px-2 py-1.5">
                                        {enumName(MESSAGE_NOTIFICATION_LEVELS, override.raw.message_notifications)}
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <BoolValue value={Boolean(override.raw.muted)} />
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <BoolValue value={Boolean(override.raw.collapsed)} />
                                      </td>
                                      <td className="px-2 py-1.5">
                                        <MuteConfig value={override.raw.mute_config} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                          <div>
                            <p className="pb-2 text-[11px] font-bold tracking-wide text-channel uppercase">
                              Every field
                            </p>
                            <FieldList value={raw} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-faint">No matching guilds.</p> : null}
      </div>
    </div>
  );
}
