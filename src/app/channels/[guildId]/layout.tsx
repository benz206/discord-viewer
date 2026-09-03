import { getOwnerId } from "@/lib/data/meta";
import { listChannels, listGuildsWithChannels } from "@/lib/data/channels";
import { getGuild } from "@/lib/data/servers";
import { buildUserDirectory } from "@/lib/data/users";
import type { ChannelRow, GuildChannelJson, UserDirectoryEntry } from "@/lib/data/types";
import { channelKindFromType } from "@/components/layout/channel-icon";
import { ChannelNav, type NavCategory, type NavChannel } from "@/components/app/channel-nav";
import { formatCount } from "@/components/app/format";

function dmLabel(
  channel: ChannelRow,
  directory: Map<string, UserDirectoryEntry>,
  ownerId: string | null,
): string {
  if (channel.name) return channel.name;
  const other = channel.recipients?.find((id) => id !== ownerId);
  const entry = other ? directory.get(other) : undefined;
  if (entry?.name) return entry.name;
  if (channel.indexName) return channel.indexName.replace(/^Direct Message with /, "");
  return channel.id;
}

function DmNav() {
  const directory = buildUserDirectory();
  const ownerId = getOwnerId();
  const conversations = [
    ...listChannels({ dm: true, orderBy: "recent", limit: 2000 }),
    ...listChannels({ groupDm: true, orderBy: "recent", limit: 200 }),
  ].sort((a, b) => (b.lastTs ?? 0) - (a.lastTs ?? 0));

  const channels: NavChannel[] = conversations.map((channel) => ({
    id: channel.id,
    name: dmLabel(channel, directory, ownerId),
    href: `/channels/@me/${channel.id}`,
    kind: channelKindFromType(channel.type),
    messageCount: channel.messageCount,
  }));

  const total = conversations.reduce((sum, channel) => sum + channel.messageCount, 0);

  return (
    <ChannelNav
      title="Direct Messages"
      subtitle={`${formatCount(conversations.length)} conversations · ${formatCount(total)} messages`}
      channels={channels}
      placeholder="Find a conversation"
    />
  );
}

function UnknownNav() {
  const group = listGuildsWithChannels({ withMessagesOnly: true }).find(
    (entry) => entry.kind === "unknown",
  );
  const rows = group?.channels ?? [];

  return (
    <ChannelNav
      title="Unsorted Channels"
      subtitle={`${formatCount(rows.length)} channels · ${formatCount(group?.messageCount ?? 0)} messages`}
      channels={rows.map((channel) => ({
        id: channel.id,
        name: channel.name ?? channel.indexName ?? channel.id,
        href: `/channels/unknown/${channel.id}`,
        kind: channelKindFromType(channel.type),
        messageCount: channel.messageCount,
      }))}
      placeholder="Filter channels"
    />
  );
}

function sortJsonChannels(a: GuildChannelJson, b: GuildChannelJson) {
  const voice = (channel: GuildChannelJson) => (channel.type === 2 || channel.type === 13 ? 1 : 0);
  return voice(a) - voice(b) || a.position - b.position || a.name.localeCompare(b.name);
}

function GuildNav({ guildId }: { guildId: string }) {
  const guild = getGuild(guildId);
  const rows = listChannels({ guildId, orderBy: "name", limit: 5000 });
  const counts = new Map(rows.map((channel) => [channel.id, channel]));
  const json = guild?.channels ?? null;

  const toNav = (id: string, name: string, type: number): NavChannel => ({
    id,
    name,
    href: `/channels/${guildId}/${id}`,
    kind: channelKindFromType(type),
    messageCount: counts.get(id)?.messageCount ?? 0,
  });

  const channels: NavChannel[] = [];
  const categories: NavCategory[] = [];

  if (json) {
    const placed = new Set<string>();
    const children = new Map<string, GuildChannelJson[]>();
    for (const channel of json) {
      if (channel.type === 4) continue;
      const parent = channel.parent_id ?? "";
      const list = children.get(parent) ?? [];
      list.push(channel);
      children.set(parent, list);
      placed.add(channel.id);
    }

    for (const channel of (children.get("") ?? []).sort(sortJsonChannels)) {
      channels.push(toNav(channel.id, channel.name, channel.type));
    }

    for (const category of json.filter((channel) => channel.type === 4).sort(sortJsonChannels)) {
      categories.push({
        id: category.id,
        name: category.name,
        channels: (children.get(category.id) ?? [])
          .sort(sortJsonChannels)
          .map((channel) => toNav(channel.id, channel.name, channel.type)),
      });
      placed.add(category.id);
    }

    const extra = rows
      .filter((channel) => !placed.has(channel.id))
      .sort((a, b) => b.messageCount - a.messageCount);
    if (extra.length > 0) {
      categories.push({
        id: "not-in-export",
        name: "Not in channels.json",
        channels: extra.map((channel) =>
          toNav(channel.id, channel.name ?? channel.indexName ?? channel.id, channel.type),
        ),
      });
    }
  } else {
    for (const channel of [...rows].sort((a, b) => b.messageCount - a.messageCount)) {
      channels.push(toNav(channel.id, channel.name ?? channel.indexName ?? channel.id, channel.type));
    }
  }

  const total = rows.reduce((sum, channel) => sum + channel.messageCount, 0);

  return (
    <ChannelNav
      title={guild?.name ?? guildId}
      subtitle={`${formatCount(rows.length)} channels · ${formatCount(total)} messages`}
      channels={channels}
      categories={categories}
    />
  );
}

export default async function ChannelsLayout({
  params,
  children,
}: {
  params: Promise<{ guildId: string }>;
  children: React.ReactNode;
}) {
  const { guildId } = await params;
  const key = decodeURIComponent(guildId);

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {key === "@me" ? (
        <DmNav />
      ) : key === "unknown" ? (
        <UnknownNav />
      ) : (
        <GuildNav guildId={key} />
      )}
      {children}
    </div>
  );
}
