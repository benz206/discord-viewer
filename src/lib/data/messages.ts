import "server-only";

import { db } from "./db";
import type { DayCount, MessagePage, MessageRow, SearchHit, SearchResult } from "./types";

interface MessageDbRow {
  rowid: number;
  id: string;
  channel_id: string;
  ts: number;
  contents: string;
  attachments: string | null;
}

const MESSAGE_COLUMNS = "rowid, id, channel_id, ts, contents, attachments";

function toMessage(row: MessageDbRow): MessageRow {
  return {
    id: row.id,
    channelId: row.channel_id,
    ts: row.ts,
    contents: row.contents,
    attachments: row.attachments ? row.attachments.split(/\s+/).filter(Boolean) : [],
    cursor: `${row.ts}:${row.rowid}`,
  };
}

function decodeCursor(cursor: string): { ts: number; rowid: number } | null {
  const [ts, rowid] = cursor.split(":");
  const parsedTs = Number(ts);
  const parsedRowid = Number(rowid);
  if (!Number.isFinite(parsedTs) || !Number.isFinite(parsedRowid)) return null;
  return { ts: parsedTs, rowid: parsedRowid };
}

function pageOf(messages: MessageRow[]): MessagePage {
  return {
    messages,
    nextCursor: messages.length > 0 ? messages[messages.length - 1].cursor : null,
    prevCursor: messages.length > 0 ? messages[0].cursor : null,
  };
}

export interface GetMessagesOptions {
  before?: string;
  after?: string;
  limit?: number;
}

export function getMessages(channelId: string, options: GetMessagesOptions = {}): MessagePage {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);

  if (options.after) {
    const cursor = decodeCursor(options.after);
    if (!cursor) return pageOf([]);
    const rows = db()
      .prepare(
        `SELECT ${MESSAGE_COLUMNS} FROM messages
         WHERE channel_id = ? AND (ts > ? OR (ts = ? AND rowid > ?))
         ORDER BY ts ASC, rowid ASC LIMIT ?`,
      )
      .all(channelId, cursor.ts, cursor.ts, cursor.rowid, limit) as MessageDbRow[];
    return pageOf(rows.map(toMessage).reverse());
  }

  const cursor = options.before ? decodeCursor(options.before) : null;
  const rows = cursor
    ? (db()
        .prepare(
          `SELECT ${MESSAGE_COLUMNS} FROM messages
           WHERE channel_id = ? AND (ts < ? OR (ts = ? AND rowid < ?))
           ORDER BY ts DESC, rowid DESC LIMIT ?`,
        )
        .all(channelId, cursor.ts, cursor.ts, cursor.rowid, limit) as MessageDbRow[])
    : (db()
        .prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE channel_id = ? ORDER BY ts DESC, rowid DESC LIMIT ?`)
        .all(channelId, limit) as MessageDbRow[]);
  return pageOf(rows.map(toMessage));
}

export function getMessage(id: string): MessageRow | null {
  const row = db().prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE id = ?`).get(id) as MessageDbRow | undefined;
  return row ? toMessage(row) : null;
}

export function getMessagesAround(messageId: string, limit = 25): MessagePage {
  const target = db().prepare(`SELECT ${MESSAGE_COLUMNS} FROM messages WHERE id = ?`).get(messageId) as
    | MessageDbRow
    | undefined;
  if (!target) return pageOf([]);

  const older = db()
    .prepare(
      `SELECT ${MESSAGE_COLUMNS} FROM messages
       WHERE channel_id = ? AND (ts < ? OR (ts = ? AND rowid < ?))
       ORDER BY ts DESC, rowid DESC LIMIT ?`,
    )
    .all(target.channel_id, target.ts, target.ts, target.rowid, limit) as MessageDbRow[];
  const newer = db()
    .prepare(
      `SELECT ${MESSAGE_COLUMNS} FROM messages
       WHERE channel_id = ? AND (ts > ? OR (ts = ? AND rowid > ?))
       ORDER BY ts ASC, rowid ASC LIMIT ?`,
    )
    .all(target.channel_id, target.ts, target.ts, target.rowid, limit) as MessageDbRow[];

  return pageOf([...newer.reverse(), target, ...older].map(toMessage));
}

export function toFtsQuery(input: string): string | null {
  const tokens = input.match(/"[^"]*"|\S+/g) ?? [];
  const parts: string[] = [];
  for (const token of tokens) {
    const unquoted = token.startsWith('"') ? token.slice(1, token.endsWith('"') ? -1 : undefined) : token;
    const prefix = unquoted.endsWith("*");
    const core = (prefix ? unquoted.slice(0, -1) : unquoted).replace(/"/g, " ").trim();
    if (!core) continue;
    parts.push(`"${core}"${prefix ? "*" : ""}`);
  }
  return parts.length > 0 ? parts.join(" AND ") : null;
}

export interface SearchMessagesOptions {
  channelId?: string;
  guildId?: string;
  order?: "newest" | "oldest" | "relevance";
  limit?: number;
  offset?: number;
}

export function searchMessages(query: string, options: SearchMessagesOptions = {}): SearchResult {
  const match = toFtsQuery(query);
  if (!match) return { hits: [], total: 0 };

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);
  const where = ["messages_fts MATCH @match"];
  const params: Record<string, string | number> = { match };

  if (options.channelId) {
    where.push("m.channel_id = @channelId");
    params.channelId = options.channelId;
  }
  if (options.guildId) {
    where.push("c.guild_id = @guildId");
    params.guildId = options.guildId;
  }

  const order =
    options.order === "relevance" ? "rank" : options.order === "oldest" ? "m.ts ASC, m.rowid ASC" : "m.ts DESC, m.rowid DESC";

  const clause = where.join(" AND ");
  const from = `FROM messages_fts f JOIN messages m ON m.rowid = f.rowid LEFT JOIN channels c ON c.id = m.channel_id WHERE ${clause}`;

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n ${from}`)
      .get(params) as { n: number }
  ).n;

  const rows = db()
    .prepare(
      `SELECT m.rowid AS rowid, m.id AS id, m.channel_id AS channel_id, m.ts AS ts, m.contents AS contents,
              m.attachments AS attachments,
              snippet(messages_fts, 0, '<mark>', '</mark>', '…', 24) AS snippet,
              c.name AS channel_name, c.index_name AS channel_index_name, c.guild_id AS guild_id, c.guild_name AS guild_name
       ${from}
       ORDER BY ${order}
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset }) as Array<
    MessageDbRow & {
      snippet: string;
      channel_name: string | null;
      channel_index_name: string | null;
      guild_id: string | null;
      guild_name: string | null;
    }
  >;

  const hits: SearchHit[] = rows.map((row) => ({
    ...toMessage(row),
    snippet: row.snippet,
    channelName: row.channel_name ?? row.channel_index_name,
    guildId: row.guild_id,
    guildName: row.guild_name,
  }));

  return { hits, total };
}

export function getMessageCountByDay(channelId?: string): DayCount[] {
  const rows = channelId
    ? (db()
        .prepare("SELECT day, count FROM message_days WHERE channel_id = ? ORDER BY day")
        .all(channelId) as Array<{ day: string; count: number }>)
    : (db()
        .prepare("SELECT day, SUM(count) AS count FROM message_days GROUP BY day ORDER BY day")
        .all() as Array<{ day: string; count: number }>);
  return rows;
}

export function getMessageCountByGuild(): Array<{ guildId: string | null; guildName: string | null; count: number }> {
  return db()
    .prepare(
      `SELECT guild_id AS guildId, guild_name AS guildName, SUM(message_count) AS count
       FROM channels WHERE message_count > 0 GROUP BY guild_id ORDER BY count DESC`,
    )
    .all() as Array<{ guildId: string | null; guildName: string | null; count: number }>;
}
