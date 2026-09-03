import Link from "next/link";
import { notFound } from "next/navigation";
import { Hash } from "lucide-react";

import { getChannel } from "@/lib/data/channels";
import { getGuild } from "@/lib/data/servers";
import { channelTypeName, type GuildChannelJson, type GuildRole } from "@/lib/data/types";
import { ChannelIcon, channelKindFromType } from "@/components/layout/channel-icon";
import {
  AUTO_ARCHIVE_DURATIONS,
  CHANNEL_FLAGS,
  OVERWRITE_TYPES,
  SORT_ORDERS,
  decodeFlags,
} from "@/components/servers/constants";
import { DefinitionList, ScalarValue } from "@/components/servers/definition-list";
import { formatBitrate, formatDuration, formatNumber, roleColor } from "@/components/servers/format";
import { MissingFile } from "@/components/servers/missing-file";
import { PageBody, PageHeader, Pill, Section } from "@/components/servers/page-shell";
import { OverwriteBreakdown } from "@/components/servers/permission-breakdown";
import { RawDetails } from "@/components/servers/raw-details";
import { UserRef } from "@/components/users/user-ref";

function humanize(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ChannelCard({
  guildId,
  channel,
  roles,
}: {
  guildId: string;
  channel: GuildChannelJson;
  roles: Record<string, GuildRole>;
}) {
  const row = getChannel(channel.id);
  const hasMessages = (row?.messageCount ?? 0) > 0;
  const flags = decodeFlags(channel.flags, CHANNEL_FLAGS);
  const record = channel as unknown as Record<string, unknown>;

  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ChannelIcon kind={channelKindFromType(channel.type)} className="size-5 text-channel" />
        {hasMessages ? (
          <Link href={`/channels/${guildId}/${channel.id}`} className="text-[15px] font-medium text-link hover:underline">
            {channel.name}
          </Link>
        ) : (
          <span className="text-[15px] font-medium text-header">{channel.name}</span>
        )}
        <Pill>{channelTypeName(channel.type)}</Pill>
        {channel.nsfw ? <Pill tone="danger">NSFW</Pill> : null}
        {channel.rate_limit_per_user ? (
          <Pill tone="warning">Slowmode {formatDuration(channel.rate_limit_per_user)}</Pill>
        ) : null}
        {channel.bitrate ? <Pill>{formatBitrate(channel.bitrate)}</Pill> : null}
        {channel.user_limit ? <Pill>Limit {channel.user_limit}</Pill> : null}
        {channel.rtc_region ? <Pill>{channel.rtc_region}</Pill> : null}
        {channel.default_auto_archive_duration ? (
          <Pill>Archive {AUTO_ARCHIVE_DURATIONS[channel.default_auto_archive_duration] ?? channel.default_auto_archive_duration}</Pill>
        ) : null}
        {channel.default_sort_order !== null && channel.default_sort_order !== undefined ? (
          <Pill>Sort {SORT_ORDERS[channel.default_sort_order] ?? channel.default_sort_order}</Pill>
        ) : null}
        {flags.map((flag) => (
          <Pill key={flag} tone="brand">
            {flag}
          </Pill>
        ))}
        <span className="ml-auto shrink-0 text-xs text-channel">
          {hasMessages ? `${formatNumber(row?.messageCount)} messages` : "no exported messages"}
        </span>
      </div>

      {channel.topic ? <p className="mt-1.5 text-sm whitespace-pre-wrap text-channel">{channel.topic}</p> : null}

      <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-[11px] text-faint">
        <span>id {channel.id}</span>
        <span>position {channel.position}</span>
        <span>flags {channel.flags}</span>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
          Permission overwrites ({channel.permission_overwrites?.length ?? 0})
        </summary>
        <div className="mt-2 space-y-2">
          {(channel.permission_overwrites ?? []).length === 0 ? (
            <p className="text-xs text-faint">This channel inherits every permission from its category.</p>
          ) : (
            channel.permission_overwrites.map((overwrite) => {
              const role = roles[overwrite.id];
              const color = role ? roleColor(role.color) : null;
              return (
                <div key={`${overwrite.type}-${overwrite.id}`} className="rounded bg-surface-3/60 p-2.5">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Pill>{OVERWRITE_TYPES[overwrite.type] ?? `Type ${overwrite.type}`}</Pill>
                    {overwrite.type === 1 ? (
                      <UserRef id={overwrite.id} size={18} />
                    ) : role ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span
                          aria-hidden
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: color ?? "#99aab5" }}
                        />
                        <span style={{ color: color ?? undefined }}>{role.name}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-faint">unknown role</span>
                    )}
                    <span className="font-mono text-[10px] text-faint">{overwrite.id}</span>
                  </div>
                  <OverwriteBreakdown allow={overwrite.allow} deny={overwrite.deny} />
                </div>
              );
            })
          )}
        </div>
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-wide text-channel uppercase select-none hover:text-interactive-hover">
          All {Object.keys(record).length} fields
        </summary>
        <DefinitionList
          className="mt-2 bg-surface-3/60"
          fields={Object.keys(record).map((key) => ({
            key,
            label: humanize(key),
            value:
              key === "permission_overwrites" ? (
                <span className="text-channel">{channel.permission_overwrites?.length ?? 0} overwrites (above)</span>
              ) : (
                <ScalarValue value={record[key]} />
              ),
          }))}
        />
      </details>
    </div>
  );
}

export default async function GuildChannelsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const channels = guild.channels;
  if (!channels) {
    return (
      <>
        <PageHeader icon={<Hash />} title="Channels" subtitle={guild.name} />
        <MissingFile file="channels.json" what="channel" />
      </>
    );
  }

  const roles = guild.guild?.roles ?? {};
  const byPosition = (a: GuildChannelJson, b: GuildChannelJson) => a.position - b.position || a.id.localeCompare(b.id);
  const categories = channels.filter((channel) => channel.type === 4).sort(byPosition);
  const uncategorized = channels.filter((channel) => channel.type !== 4 && !channel.parent_id).sort(byPosition);
  const orphans = channels.filter(
    (channel) =>
      channel.type !== 4 && channel.parent_id && !categories.some((category) => category.id === channel.parent_id),
  );

  return (
    <>
      <PageHeader
        icon={<Hash />}
        title="Channels"
        subtitle={`${guild.name} · ${channels.length} channels in ${categories.length} categories`}
      />
      <PageBody>
        {uncategorized.length > 0 ? (
          <Section title="No category">
            <div className="space-y-2">
              {uncategorized.map((channel) => (
                <ChannelCard key={channel.id} guildId={guild.id} channel={channel} roles={roles} />
              ))}
            </div>
          </Section>
        ) : null}

        {categories.map((category) => {
          const children = channels.filter((channel) => channel.parent_id === category.id).sort(byPosition);
          return (
            <Section key={category.id} title={`${category.name} (${children.length})`}>
              <div className="space-y-2">
                <ChannelCard guildId={guild.id} channel={category} roles={roles} />
                {children.map((channel) => (
                  <div key={channel.id} className="ml-4 border-l-2 border-divider pl-3">
                    <ChannelCard guildId={guild.id} channel={channel} roles={roles} />
                  </div>
                ))}
              </div>
            </Section>
          );
        })}

        {orphans.length > 0 ? (
          <Section title={`Orphaned channels (${orphans.length})`} description="parent_id points at a missing category.">
            <div className="space-y-2">
              {orphans.map((channel) => (
                <ChannelCard key={channel.id} guildId={guild.id} channel={channel} roles={roles} />
              ))}
            </div>
          </Section>
        ) : null}

        <RawDetails value={channels} name="channels.json" />
      </PageBody>
    </>
  );
}
