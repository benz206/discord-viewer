import "server-only";

import { db } from "./db";
import type { ChannelRow } from "./types";

interface ChannelDbRow {
  id: string;
  name: string | null;
  type: number;
  guild_id: string | null;
  guild_name: string | null;
  index_name: string | null;
  recipients_json: string | null;
  message_count: number;
  first_ts: number | null;
  last_ts: number | null;
}

const CHANNEL_COLUMNS =
  "id, name, type, guild_id, guild_name, index_name, recipients_json, message_count, first_ts, last_ts";

function toChannel(row: ChannelDbRow): ChannelRow {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    guildId: row.guild_id,
    guildName: row.guild_name,
    indexName: row.index_name,
    recipients: row.recipients_json ? (JSON.parse(row.recipients_json) as string[]) : null,
    messageCount: row.message_count,
    firstTs: row.first_ts,
    lastTs: row.last_ts,
  };
}

export interface ListChannelsOptions {
  guildId?: string;
  dm?: boolean;
  groupDm?: boolean;
  withMessagesOnly?: boolean;
  search?: string;
  orderBy?: "messages" | "recent" | "name";
  limit?: number;
  offset?: number;
}

export function listChannels(options: ListChannelsOptions = {}): ChannelRow[] {
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (options.guildId) {
    where.push("guild_id = @guildId");
    params.guildId = options.guildId;
  }
  if (options.dm) where.push("type = 1");
  if (options.groupDm) where.push("type = 3");
  if (options.withMessagesOnly) where.push("message_count > 0");
  if (options.search) {
    where.push("(name LIKE @search OR index_name LIKE @search OR guild_name LIKE @search)");
    params.search = `%${options.search}%`;
  }

  const order =
    options.orderBy === "recent"
      ? "last_ts DESC NULLS LAST"
      : options.orderBy === "name"
        ? "COALESCE(name, index_name, id) COLLATE NOCASE ASC"
        : "message_count DESC, last_ts DESC";

  const sql = `SELECT ${CHANNEL_COLUMNS} FROM channels ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order} LIMIT @limit OFFSET @offset`;
  params.limit = options.limit ?? 500;
  params.offset = options.offset ?? 0;

  return (db().prepare(sql).all(params) as ChannelDbRow[]).map(toChannel);
}

export function listChannelsForUser(userId: string): ChannelRow[] {
  const rows = db()
    .prepare(
      `SELECT ${CHANNEL_COLUMNS} FROM channels
       WHERE recipients_json LIKE @needle
       ORDER BY message_count DESC, last_ts DESC`,
    )
    .all({ needle: `%"${userId}"%` }) as ChannelDbRow[];
  return rows.map(toChannel).filter((channel) => channel.recipients?.includes(userId));
}

export function getChannel(id: string): ChannelRow | null {
  const row = db().prepare(`SELECT ${CHANNEL_COLUMNS} FROM channels WHERE id = ?`).get(id) as ChannelDbRow | undefined;
  return row ? toChannel(row) : null;
}

export interface ChannelGroup {
  kind: "guild" | "dm" | "group_dm" | "unknown";
  id: string | null;
  name: string;
  messageCount: number;
  channels: ChannelRow[];
}

export function listGuildsWithChannels(options: { withMessagesOnly?: boolean } = {}): ChannelGroup[] {
  const filter = options.withMessagesOnly ? "WHERE message_count > 0" : "";
  const rows = (
    db()
      .prepare(`SELECT ${CHANNEL_COLUMNS} FROM channels ${filter} ORDER BY message_count DESC, last_ts DESC`)
      .all() as ChannelDbRow[]
  ).map(toChannel);

  const guilds = new Map<string, ChannelGroup>();
  const dms: ChannelRow[] = [];
  const groupDms: ChannelRow[] = [];
  const unknown: ChannelRow[] = [];

  for (const channel of rows) {
    if (channel.type === 1) {
      dms.push(channel);
    } else if (channel.type === 3) {
      groupDms.push(channel);
    } else if (channel.guildId) {
      let group = guilds.get(channel.guildId);
      if (!group) {
        group = {
          kind: "guild",
          id: channel.guildId,
          name: channel.guildName ?? channel.guildId,
          messageCount: 0,
          channels: [],
        };
        guilds.set(channel.guildId, group);
      }
      group.channels.push(channel);
      group.messageCount += channel.messageCount;
    } else {
      unknown.push(channel);
    }
  }

  const groups = [...guilds.values()].sort((a, b) => b.messageCount - a.messageCount);
  const sum = (list: ChannelRow[]) => list.reduce((total, channel) => total + channel.messageCount, 0);

  if (dms.length > 0) {
    groups.push({ kind: "dm", id: null, name: "Direct Messages", messageCount: sum(dms), channels: dms });
  }
  if (groupDms.length > 0) {
    groups.push({ kind: "group_dm", id: null, name: "Group DMs", messageCount: sum(groupDms), channels: groupDms });
  }
  if (unknown.length > 0) {
    groups.push({ kind: "unknown", id: null, name: "Unknown", messageCount: sum(unknown), channels: unknown });
  }
  return groups;
}

export function getChannelDisplayName(channel: ChannelRow): string {
  if (channel.name) return channel.name;
  if (channel.indexName) return channel.indexName;
  return channel.id;
}
