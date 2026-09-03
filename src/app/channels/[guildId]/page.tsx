import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, AtSign, Hash, Users } from "lucide-react";

import { listChannels, listGuildsWithChannels } from "@/lib/data/channels";
import { getOwnerId, getUser } from "@/lib/data/meta";
import { getGuild } from "@/lib/data/servers";
import { buildUserDirectory } from "@/lib/data/users";
import { RELATIONSHIP_TYPES, type ChannelRow, type UserDirectoryEntry } from "@/lib/data/types";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import {
  LinkRow,
  PaneBody,
  PaneHeader,
  Section,
  Stat,
  StatGrid,
} from "@/components/app/overview";
import { formatCount, formatDate } from "@/components/app/format";

function avatarUrl(id: string, hash: string | null | undefined) {
  if (!hash) return null;
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${hash.startsWith("a_") ? "gif" : "png"}?size=64`;
}

function dmName(
  channel: ChannelRow,
  directory: Map<string, UserDirectoryEntry>,
  ownerId: string | null,
) {
  if (channel.name) return channel.name;
  const other = channel.recipients?.find((id) => id !== ownerId);
  const entry = other ? directory.get(other) : undefined;
  if (entry?.name) return entry.name;
  if (channel.indexName) return channel.indexName.replace(/^Direct Message with /, "");
  return channel.id;
}

function DmHome() {
  const ownerId = getOwnerId();
  const directory = buildUserDirectory();
  const dms = listChannels({ dm: true, orderBy: "messages", limit: 2000 });
  const groups = listChannels({ groupDm: true, orderBy: "messages", limit: 200 });
  const relationships = getUser()?.relationships ?? [];

  const all = [...dms, ...groups];
  const messages = all.reduce((sum, channel) => sum + channel.messageCount, 0);
  const first = Math.min(...all.filter((c) => c.firstTs).map((c) => c.firstTs as number));
  const last = Math.max(...all.filter((c) => c.lastTs).map((c) => c.lastTs as number));

  const byType = new Map<number, typeof relationships>();
  for (const relationship of relationships) {
    byType.set(relationship.type, [...(byType.get(relationship.type) ?? []), relationship]);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface">
      <PaneHeader icon={<AtSign />} title="Direct Messages" />
      <PaneBody>
        <StatGrid>
          <Stat label="Conversations" value={formatCount(dms.length)} hint="one-to-one DMs" />
          <Stat label="Group DMs" value={formatCount(groups.length)} />
          <Stat label="Messages" value={formatCount(messages)} hint="sent by you" />
          <Stat
            label="Span"
            value={formatDate(first)}
            hint={`through ${formatDate(last)}`}
          />
        </StatGrid>

        <Section title={`Most active conversations`}>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {dms.slice(0, 12).map((channel) => {
              const other = channel.recipients?.find((id) => id !== ownerId);
              const entry = other ? directory.get(other) : undefined;
              return (
                <LinkRow
                  key={channel.id}
                  href={`/channels/@me/${channel.id}`}
                  leading={
                    <Avatar
                      size={32}
                      id={other ?? channel.id}
                      name={dmName(channel, directory, ownerId)}
                      src={entry ? avatarUrl(entry.id, entry.avatar) : null}
                    />
                  }
                  title={dmName(channel, directory, ownerId)}
                  subtitle={`${formatDate(channel.firstTs)} – ${formatDate(channel.lastTs)}`}
                  trailing={formatCount(channel.messageCount)}
                />
              );
            })}
          </div>
        </Section>

        {groups.length > 0 ? (
          <Section title="Group DMs">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {groups.map((channel) => (
                <LinkRow
                  key={channel.id}
                  href={`/channels/@me/${channel.id}`}
                  leading={<Users className="size-5 shrink-0 text-channel" />}
                  title={channel.name ?? channel.indexName ?? channel.id}
                  subtitle={`${formatDate(channel.firstTs)} – ${formatDate(channel.lastTs)}`}
                  trailing={formatCount(channel.messageCount)}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {[...byType.entries()]
          .sort(([a], [b]) => a - b)
          .map(([type, list]) => (
            <Section
              key={type}
              title={`${RELATIONSHIP_TYPES[type] ?? `Type ${type}`} — ${list.length}`}
            >
              <div className="grid gap-1.5 sm:grid-cols-3">
                {list.map((relationship) => (
                  <LinkRow
                    key={relationship.id}
                    href={`/users/${relationship.id}`}
                    leading={
                      <Avatar
                        size={28}
                        id={relationship.user.id}
                        name={relationship.user.username}
                        src={avatarUrl(relationship.user.id, relationship.user.avatar)}
                      />
                    }
                    title={relationship.user.username}
                    subtitle={`#${relationship.user.discriminator}`}
                  />
                ))}
              </div>
            </Section>
          ))}
      </PaneBody>
    </div>
  );
}

function UnknownHome() {
  const group = listGuildsWithChannels({ withMessagesOnly: true }).find(
    (entry) => entry.kind === "unknown",
  );
  const rows = group?.channels ?? [];
  const allUnknown = listChannels({ orderBy: "messages", limit: 20000 }).filter(
    (channel) => !channel.guildId && channel.type !== 1 && channel.type !== 3,
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface">
      <PaneHeader icon={<Hash />} title="Unsorted Channels" />
      <PaneBody>
        <p className="text-sm text-channel">
          These channels appear in <code className="rounded bg-code px-1">messages/index.json</code>{" "}
          but their <code className="rounded bg-code px-1">channel.json</code> has no guild
          attached, so the export cannot tell which server they belong to.
        </p>
        <StatGrid>
          <Stat label="Channels" value={formatCount(allUnknown.length)} />
          <Stat label="With messages" value={formatCount(rows.length)} />
          <Stat label="Messages" value={formatCount(group?.messageCount ?? 0)} />
          <Stat
            label="Empty"
            value={formatCount(allUnknown.length - rows.length)}
            hint="no messages.csv rows"
          />
        </StatGrid>
        <Section title="Most active">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {rows.slice(0, 20).map((channel) => (
              <LinkRow
                key={channel.id}
                href={`/channels/unknown/${channel.id}`}
                leading={<Hash className="size-4 shrink-0 text-channel" />}
                title={channel.name ?? channel.id}
                subtitle={`${formatDate(channel.firstTs)} – ${formatDate(channel.lastTs)}`}
                trailing={formatCount(channel.messageCount)}
              />
            ))}
          </div>
        </Section>
      </PaneBody>
    </div>
  );
}

function GuildHome({ guildId }: { guildId: string }) {
  const guild = getGuild(guildId);
  if (!guild) notFound();

  const rows = listChannels({ guildId, orderBy: "messages", limit: 5000 });
  const withMessages = rows.filter((channel) => channel.messageCount > 0);
  const first = Math.min(...withMessages.map((c) => c.firstTs ?? Infinity));
  const last = Math.max(...withMessages.map((c) => c.lastTs ?? 0));

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface">
      <PaneHeader
        icon={<Hash />}
        title={guild.name}
        actions={
          <Link
            href={`/servers/${guild.id}`}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-link hover:underline"
          >
            Server details
            <ArrowUpRight className="size-3.5" />
          </Link>
        }
      />
      <PaneBody>
        <div className="flex items-center gap-4">
          <Avatar
            size={80}
            rounded="lg"
            id={guild.id}
            name={guild.name}
            src={guild.iconFile ? `/api/asset/${guild.iconFile}` : null}
          />
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold text-header">{guild.name}</div>
            <div className="font-mono text-xs text-faint">{guild.id}</div>
            {guild.guild?.description ? (
              <p className="mt-1 text-sm text-channel">{guild.guild.description}</p>
            ) : null}
          </div>
        </div>

        <StatGrid>
          <Stat label="Messages" value={formatCount(guild.messageCount)} hint="sent by you" />
          <Stat
            label="Channels"
            value={formatCount(rows.length)}
            hint={`${formatCount(withMessages.length)} with messages`}
          />
          <Stat
            label="Span"
            value={withMessages.length > 0 ? formatDate(first) : "—"}
            hint={withMessages.length > 0 ? `through ${formatDate(last)}` : undefined}
          />
          <Stat
            label="In export"
            value={guild.hasChannels ? "channels.json" : "messages only"}
            hint={guild.hasChannels ? `${formatCount(guild.channelCount)} channels` : undefined}
          />
        </StatGrid>

        <StatGrid>
          <Stat label="Roles" value={formatCount(guild.roleCount)} />
          <Stat label="Emoji" value={formatCount(guild.emojiCount)} />
          <Stat label="Webhooks" value={formatCount(guild.webhookCount)} />
          <Stat label="Audit log" value={formatCount(guild.auditLogCount)} />
        </StatGrid>

        {withMessages.length > 0 ? (
          <Section title="Most active channels">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {withMessages.slice(0, 20).map((channel) => (
                <LinkRow
                  key={channel.id}
                  href={`/channels/${guildId}/${channel.id}`}
                  leading={<Hash className="size-4 shrink-0 text-channel" />}
                  title={channel.name ?? channel.id}
                  subtitle={`${formatDate(channel.firstTs)} – ${formatDate(channel.lastTs)}`}
                  trailing={formatCount(channel.messageCount)}
                />
              ))}
            </div>
          </Section>
        ) : (
          <EmptyState
            icon={<Hash />}
            title="No messages in this server"
            description="The export contains metadata for this server but no messages you sent."
          />
        )}
      </PaneBody>
    </div>
  );
}

export default async function GuildPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const key = decodeURIComponent(guildId);
  if (key === "@me") return <DmHome />;
  if (key === "unknown") return <UnknownHome />;
  return <GuildHome guildId={key} />;
}
