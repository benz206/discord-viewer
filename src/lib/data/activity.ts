import "server-only";

import fs from "node:fs";
import { db, packageFile } from "./db";
import type { ActivityEventPage, ActivityEventRow, ActivityEventTypeRow, DayCount } from "./types";

interface ActivityDbRow {
  id: number;
  domain: string;
  event_type: string;
  ts: number | null;
  day: string | null;
  guild_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  summary_json: string | null;
}

const EVENT_COLUMNS = "id, domain, event_type, ts, day, guild_id, channel_id, message_id, summary_json";

function toEvent(row: ActivityDbRow): ActivityEventRow {
  return {
    id: row.id,
    domain: row.domain,
    eventType: row.event_type,
    ts: row.ts,
    day: row.day,
    guildId: row.guild_id,
    channelId: row.channel_id,
    messageId: row.message_id,
    summary: row.summary_json ? (JSON.parse(row.summary_json) as Record<string, string | number | boolean>) : {},
  };
}

export function listActivityEventTypes(domain?: string): ActivityEventTypeRow[] {
  const rows = domain
    ? (db()
        .prepare("SELECT domain, event_type, count FROM activity_event_types WHERE domain = ? ORDER BY count DESC")
        .all(domain) as Array<{ domain: string; event_type: string; count: number }>)
    : (db()
        .prepare("SELECT domain, event_type, count FROM activity_event_types ORDER BY count DESC")
        .all() as Array<{ domain: string; event_type: string; count: number }>);
  return rows.map((row) => ({ domain: row.domain, eventType: row.event_type, count: row.count }));
}

export interface ListActivityEventsOptions {
  domain?: string;
  eventType?: string;
  from?: number;
  to?: number;
  guildId?: string;
  channelId?: string;
  messageId?: string;
  limit?: number;
  cursor?: string;
}

export function listActivityEvents(options: ListActivityEventsOptions = {}): ActivityEventPage {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const where: string[] = [];
  const params: Record<string, string | number> = {};

  if (options.domain) {
    where.push("domain = @domain");
    params.domain = options.domain;
  }
  if (options.eventType) {
    where.push("event_type = @eventType");
    params.eventType = options.eventType;
  }
  if (options.from !== undefined) {
    where.push("ts >= @from");
    params.from = options.from;
  }
  if (options.to !== undefined) {
    where.push("ts <= @to");
    params.to = options.to;
  }
  if (options.guildId) {
    where.push("guild_id = @guildId");
    params.guildId = options.guildId;
  }
  if (options.channelId) {
    where.push("channel_id = @channelId");
    params.channelId = options.channelId;
  }
  if (options.messageId) {
    where.push("message_id = @messageId");
    params.messageId = options.messageId;
  }
  if (options.cursor) {
    const [cursorTs, cursorId] = options.cursor.split(":").map(Number);
    if (Number.isFinite(cursorTs) && Number.isFinite(cursorId)) {
      where.push("(ts < @cursorTs OR (ts = @cursorTs AND id < @cursorId))");
      params.cursorTs = cursorTs;
      params.cursorId = cursorId;
    }
  }

  const sql = `SELECT ${EVENT_COLUMNS} FROM activity_events ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY ts DESC, id DESC LIMIT @limit`;
  params.limit = limit;

  const rows = db().prepare(sql).all(params) as ActivityDbRow[];
  const events = rows.map(toEvent);
  const last = events[events.length - 1];
  return {
    events,
    nextCursor: events.length === limit && last ? `${last.ts}:${last.id}` : null,
  };
}

export function countActivityEvents(options: ListActivityEventsOptions = {}): number {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (options.domain) {
    where.push("domain = @domain");
    params.domain = options.domain;
  }
  if (options.eventType) {
    where.push("event_type = @eventType");
    params.eventType = options.eventType;
  }
  if (options.from !== undefined) {
    where.push("ts >= @from");
    params.from = options.from;
  }
  if (options.to !== undefined) {
    where.push("ts <= @to");
    params.to = options.to;
  }
  if (options.guildId) {
    where.push("guild_id = @guildId");
    params.guildId = options.guildId;
  }
  if (options.channelId) {
    where.push("channel_id = @channelId");
    params.channelId = options.channelId;
  }
  const sql = `SELECT COUNT(*) AS n FROM activity_events ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`;
  return (db().prepare(sql).get(params) as { n: number }).n;
}

export function getActivityEvent(id: number): { event: ActivityEventRow; raw: Record<string, unknown> } | null {
  const row = db()
    .prepare(`SELECT ${EVENT_COLUMNS}, byte_offset, byte_length FROM activity_events WHERE id = ?`)
    .get(id) as (ActivityDbRow & { byte_offset: number; byte_length: number }) | undefined;
  if (!row) return null;

  const source = db().prepare("SELECT file FROM activity_sources WHERE domain = ?").get(row.domain) as
    | { file: string }
    | undefined;
  if (!source) return null;

  const buffer = Buffer.allocUnsafe(row.byte_length);
  const fd = fs.openSync(packageFile(source.file), "r");
  try {
    fs.readSync(fd, buffer, 0, row.byte_length, row.byte_offset);
  } finally {
    fs.closeSync(fd);
  }

  try {
    return { event: toEvent(row), raw: JSON.parse(buffer.toString("utf8")) as Record<string, unknown> };
  } catch {
    return null;
  }
}

export interface ActivityDailyOptions {
  domain?: string;
  eventType?: string;
  from?: string;
  to?: string;
}

export function getActivityDaily(options: ActivityDailyOptions = {}): DayCount[] {
  const where: string[] = [];
  const params: Record<string, string> = {};
  if (options.domain) {
    where.push("domain = @domain");
    params.domain = options.domain;
  }
  if (options.eventType) {
    where.push("event_type = @eventType");
    params.eventType = options.eventType;
  }
  if (options.from) {
    where.push("day >= @from");
    params.from = options.from;
  }
  if (options.to) {
    where.push("day <= @to");
    params.to = options.to;
  }
  const sql = `SELECT day, SUM(count) AS count FROM activity_daily ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } GROUP BY day ORDER BY day`;
  return db().prepare(sql).all(params) as DayCount[];
}

export function listActivityDomains(): Array<{ domain: string; count: number; typeCount: number }> {
  return db()
    .prepare(
      `SELECT domain, SUM(count) AS count, COUNT(*) AS typeCount
       FROM activity_event_types GROUP BY domain ORDER BY count DESC`,
    )
    .all() as Array<{ domain: string; count: number; typeCount: number }>;
}
