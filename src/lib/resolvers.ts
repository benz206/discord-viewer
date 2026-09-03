import "server-only";

import { getChannel } from "@/lib/data/channels";
import { getGuild } from "@/lib/data/servers";
import { getUserEntry } from "@/lib/data/users";
import type { ChannelRow } from "@/lib/data/types";
import { channelKindFromType } from "@/components/layout/channel-icon";
import type { ResolverMap } from "@/lib/resolvers-client";

const MENTION_PATTERN = /<@!?(\d+)>|<#(\d+)>|<@&(\d+)>/g;

export function channelHref(channelId: string, guildId?: string | null): string {
  return `/channels/${guildId ?? "@me"}/${channelId}`;
}

export function channelLabel(channel: ChannelRow, directoryName?: string | null): string {
  if (channel.name) return channel.name;
  if (directoryName) return directoryName;
  if (channel.indexName) {
    return channel.indexName.replace(/^Direct Message with /, "");
  }
  return channel.id;
}

function roleColor(color: number | undefined): string | null {
  if (!color) return null;
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function buildResolverMap(contents: string[], guildId?: string | null): ResolverMap {
  const userIds = new Set<string>();
  const channelIds = new Set<string>();
  const roleIds = new Set<string>();

  for (const text of contents) {
    for (const match of text.matchAll(MENTION_PATTERN)) {
      if (match[1]) userIds.add(match[1]);
      else if (match[2]) channelIds.add(match[2]);
      else if (match[3]) roleIds.add(match[3]);
    }
  }

  const map: ResolverMap = { users: {}, channels: {}, roles: {} };

  for (const id of userIds) {
    const entry = getUserEntry(id);
    map.users[id] = entry?.name ? { name: entry.name, href: `/users/${id}` } : { name: id };
  }

  for (const id of channelIds) {
    const channel = getChannel(id);
    if (!channel) {
      map.channels[id] = { name: id };
      continue;
    }
    map.channels[id] = {
      name: channelLabel(channel),
      href: channelHref(channel.id, channel.guildId),
      kind: channelKindFromType(channel.type),
    };
  }

  if (roleIds.size > 0) {
    const roles = guildId ? (getGuild(guildId)?.guild?.roles ?? {}) : {};
    for (const id of roleIds) {
      const role = roles[id];
      map.roles[id] = role
        ? { name: role.name, color: roleColor(role.color) }
        : { name: id };
    }
  }

  return map;
}
