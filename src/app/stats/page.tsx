import fs from "node:fs";
import Link from "next/link";
import { BarChart3, Download, FolderOpen, Hash, Server, User } from "lucide-react";

import { db, packageFile } from "@/lib/data/db";
import { listActivityDomains } from "@/lib/data/activity";
import { listChannels } from "@/lib/data/channels";
import { getMessageCountByDay, getMessageCountByGuild } from "@/lib/data/messages";
import { getActivitySources, getPackageStats } from "@/lib/data/meta";
import { channelTypeName } from "@/lib/data/types";
import { JsonViewer } from "@/components/common/json-viewer";
import { AreaChart, BarChart, BarList } from "@/components/stats/charts";
import { StatTile, StatsSection } from "@/components/stats/stat-tile";
import { formatBytes, formatNumber, formatTimestamp } from "@/components/account/format";

const NAV = [
  { href: "#overview", label: "Overview", icon: BarChart3 },
  { href: "#messages", label: "Messages over time", icon: Hash },
  { href: "#guilds", label: "Messages by guild", icon: Server },
  { href: "#channels", label: "Top channels", icon: Hash },
  { href: "#activity", label: "Activity domains", icon: User },
  { href: "#package", label: "Package contents", icon: FolderOpen },
];

function fillDays(days: Array<{ day: string; count: number }>) {
  if (days.length === 0) return [];
  const counts = new Map(days.map((entry) => [entry.day, entry.count]));
  const filled: Array<{ label: string; value: number }> = [];
  const cursor = new Date(`${days[0].day}T00:00:00Z`);
  const end = new Date(`${days[days.length - 1].day}T00:00:00Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    filled.push({ label: key, value: counts.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return filled;
}

function bucket(days: Array<{ label: string; value: number }>, length: number) {
  const totals = new Map<string, number>();
  for (const day of days) {
    const key = day.label.slice(0, length);
    totals.set(key, (totals.get(key) ?? 0) + day.value);
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}

export default function StatsPage() {
  const stats = getPackageStats();
  const days = fillDays(getMessageCountByDay());
  const months = bucket(days, 7);
  const years = bucket(days, 4);
  const byGuild = getMessageCountByGuild();
  const topChannels = listChannels({ orderBy: "messages", withMessagesOnly: true, limit: 25 });
  const domains = listActivityDomains();
  const sources = getActivitySources();

  const attachments = db()
    .prepare(
      `SELECT COUNT(*) AS messages, SUM(LENGTH(attachments) - LENGTH(REPLACE(attachments, ' ', '')) + 1) AS urls
       FROM messages WHERE attachments IS NOT NULL AND attachments <> ''`,
    )
    .get() as { messages: number; urls: number | null };

  const readme = fs.readFileSync(packageFile("README.txt"), "utf8");
  const programs = fs.readdirSync(packageFile("programs"));
  const activityBytes = sources.reduce((total, source) => total + source.bytes, 0);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-surface text-normal">
      <nav className="scrollbar-discord flex w-60 shrink-0 flex-col gap-0.5 overflow-y-auto bg-surface-2 px-3 py-14">
        <h2 className="px-2.5 pb-1 text-[11px] font-bold tracking-wide text-channel uppercase">Package Overview</h2>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-sm font-medium text-interactive hover:bg-hover hover:text-interactive-hover"
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </a>
          );
        })}
        <div className="mt-4 rounded-lg bg-surface-3 px-3 py-2.5 text-xs text-channel">
          <p className="font-semibold text-header">Indexed</p>
          <p className="pt-1">{formatTimestamp(new Date(stats.ingestedAt).getTime())}</p>
          <p className="pt-0.5">in {stats.ingestSeconds.toFixed(1)}s</p>
        </div>
      </nav>

      <main className="scrollbar-discord min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-10 py-14">
          <div>
            <h1 className="text-xl font-semibold text-header">Package Statistics</h1>
            <p className="mt-1 text-sm text-channel">
              Everything the ingest pipeline counted across the Discord data package.
            </p>
          </div>

          <StatsSection id="overview" title="Overview">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatTile label="Messages" value={formatNumber(stats.messageCount)} hint="all authored by the owner" />
              <StatTile label="Channels" value={formatNumber(stats.channelCount)} hint="messages/index.json entries" />
              <StatTile label="DM channels" value={formatNumber(stats.dmChannelCount)} />
              <StatTile label="Group DMs" value={formatNumber(stats.groupDmChannelCount)} />
              <StatTile label="Guild channels" value={formatNumber(stats.guildChannelCount)} />
              <StatTile label="Guilds" value={formatNumber(stats.guildCount)} hint="servers/index.json" />
              <StatTile label="Known users" value={formatNumber(stats.userCount)} />
              <StatTile
                label="Attachments"
                value={formatNumber(attachments.urls ?? 0)}
                hint={`${formatNumber(attachments.messages)} messages with attachments`}
              />
              <StatTile label="Activity events" value={formatNumber(stats.activityEventCount)} />
              <StatTile label="Activity event types" value={formatNumber(stats.activityEventTypeCount)} />
              <StatTile label="Activity bytes" value={formatBytes(activityBytes)} hint="3 NDJSON files" />
              <StatTile label="Days with messages" value={formatNumber(getMessageCountByDay().length)} />
              <StatTile
                label="First message"
                value={<span className="text-base">{formatTimestamp(stats.firstMessageTs)}</span>}
              />
              <StatTile
                label="Last message"
                value={<span className="text-base">{formatTimestamp(stats.lastMessageTs)}</span>}
              />
              <StatTile
                label="First activity event"
                value={<span className="text-base">{formatTimestamp(stats.firstActivityTs)}</span>}
              />
              <StatTile
                label="Last activity event"
                value={<span className="text-base">{formatTimestamp(stats.lastActivityTs)}</span>}
              />
            </div>
            <JsonViewer value={stats} name="stats" defaultExpandedDepth={1} />
          </StatsSection>

          <StatsSection
            id="messages"
            title="Messages over time"
            description={`${formatNumber(days.length)} days between ${days[0]?.label} and ${days[days.length - 1]?.label}.`}
          >
            <div className="rounded-lg bg-surface-2 p-4">
              <p className="pb-2 text-[11px] font-semibold tracking-wide text-channel uppercase">Per day</p>
              <AreaChart points={days} />
            </div>
            <div className="rounded-lg bg-surface-2 p-4">
              <p className="pb-2 text-[11px] font-semibold tracking-wide text-channel uppercase">
                Per month ({months.length})
              </p>
              <BarChart points={months} />
            </div>
            <div className="rounded-lg bg-surface-2 p-4">
              <p className="pb-2 text-[11px] font-semibold tracking-wide text-channel uppercase">
                Per year ({years.length})
              </p>
              <BarChart points={years} />
              <ul className="flex flex-wrap gap-4 pt-3 text-sm">
                {years.map((year) => (
                  <li key={year.label} className="text-channel">
                    <span className="font-semibold text-header">{year.label}</span> {formatNumber(year.value)}
                  </li>
                ))}
              </ul>
            </div>
          </StatsSection>

          <StatsSection
            id="guilds"
            title="Messages by guild"
            description="Channels with no guild in the package (DMs, group DMs and orphan guild channels) are grouped together."
            action={
              <Link href="/servers" className="text-xs text-link hover:underline">
                All servers
              </Link>
            }
          >
            <div className="rounded-lg bg-surface-2 py-1">
              <BarList
                items={byGuild.map((guild) => ({
                  key: guild.guildId ?? "none",
                  value: guild.count,
                  label: guild.guildId ? (
                    <Link href={`/servers/${guild.guildId}`} className="text-link hover:underline">
                      {guild.guildName ?? guild.guildId}
                    </Link>
                  ) : (
                    "DMs & guild-less channels"
                  ),
                  hint: guild.guildId ?? "no guild id",
                }))}
              />
            </div>
          </StatsSection>

          <StatsSection
            id="channels"
            title="Top channels by message count"
            description={`Top ${topChannels.length} of ${formatNumber(stats.channelCount)} channels.`}
          >
            <div className="rounded-lg bg-surface-2 py-1">
              <BarList
                items={topChannels.map((channel) => ({
                  key: channel.id,
                  value: channel.messageCount,
                  label: (
                    <Link
                      href={channel.guildId ? `/channels/${channel.guildId}/${channel.id}` : `/channels/@me/${channel.id}`}
                      className="text-link hover:underline"
                    >
                      {channel.name ?? channel.indexName ?? channel.id}
                    </Link>
                  ),
                  hint: `${channelTypeName(channel.type)}${channel.guildName ? ` · ${channel.guildName}` : ""}`,
                }))}
              />
            </div>
          </StatsSection>

          <StatsSection id="activity" title="Activity domains">
            <div className="grid gap-3 sm:grid-cols-3">
              {domains.map((domain) => (
                <Link key={domain.domain} href={`/activity?domain=${domain.domain}`} className="block">
                  <StatTile
                    label={domain.domain}
                    value={formatNumber(domain.count)}
                    hint={`${domain.typeCount} event types`}
                    className="hover:bg-surface-alt"
                  />
                </Link>
              ))}
            </div>
            <div className="overflow-x-auto rounded-lg bg-surface-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
                    <th className="px-3 py-2 font-semibold">Domain</th>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Lines</th>
                    <th className="px-3 py-2 font-semibold">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.domain} className="border-b border-divider last:border-0">
                      <td className="px-3 py-2 font-medium text-header">{source.domain}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-subhead">{source.file}</td>
                      <td className="px-3 py-2">{formatNumber(source.lines)}</td>
                      <td className="px-3 py-2">{formatBytes(source.bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </StatsSection>

          <StatsSection
            id="package"
            title="Package contents"
            description="Every top-level entry of the extracted data package and where it is browsable."
          >
            <div className="overflow-x-auto rounded-lg bg-surface-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-divider text-left text-[11px] tracking-wide text-channel uppercase">
                    <th className="px-3 py-2 font-semibold">Entry</th>
                    <th className="px-3 py-2 font-semibold">Contents</th>
                    <th className="px-3 py-2 font-semibold">Browse</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-divider">
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">account/</td>
                    <td className="px-3 py-2">user.json, avatar.gif, 5 bot applications</td>
                    <td className="px-3 py-2">
                      <Link href="/account" className="text-link hover:underline">
                        /account
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-b border-divider">
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">messages/</td>
                    <td className="px-3 py-2">
                      {formatNumber(stats.channelCount)} channels, {formatNumber(stats.messageCount)} messages
                    </td>
                    <td className="px-3 py-2">
                      <Link href="/channels/@me" className="text-link hover:underline">
                        /channels
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-b border-divider">
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">servers/</td>
                    <td className="px-3 py-2">{formatNumber(stats.guildCount)} guilds</td>
                    <td className="px-3 py-2">
                      <Link href="/servers" className="text-link hover:underline">
                        /servers
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-b border-divider">
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">activity/</td>
                    <td className="px-3 py-2">
                      {formatNumber(stats.activityEventCount)} events · {formatBytes(activityBytes)}
                    </td>
                    <td className="px-3 py-2">
                      <Link href="/activity" className="text-link hover:underline">
                        /activity
                      </Link>
                    </td>
                  </tr>
                  <tr className="border-b border-divider">
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">programs/</td>
                    <td className="px-3 py-2">
                      {programs.length === 0 ? (
                        <span className="text-faint">empty directory — Discord shipped nothing here</span>
                      ) : (
                        programs.join(", ")
                      )}
                    </td>
                    <td className="px-3 py-2 text-faint">—</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-[12px] text-mention-fg">README.txt</td>
                    <td className="px-3 py-2">{formatBytes(Buffer.byteLength(readme))} welcome text</td>
                    <td className="px-3 py-2">
                      <a
                        href="/api/asset/README.txt"
                        className="inline-flex items-center gap-1 text-link hover:underline"
                      >
                        <Download className="size-3.5" /> README.txt
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <pre className="scrollbar-discord overflow-x-auto rounded-lg border border-code-border bg-code p-4 font-mono text-[12px] leading-[1.5] whitespace-pre text-normal">
              {readme}
            </pre>
          </StatsSection>
        </div>
      </main>
    </div>
  );
}
