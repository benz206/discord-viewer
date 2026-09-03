// Builds data/index.db from the extracted Discord data package at data/package.
// Run with `pnpm ingest`. Deletes and rebuilds the database from scratch.

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import Database from "better-sqlite3";

const ROOT = process.cwd();
const PACKAGE_DIR = path.join(ROOT, "data", "package");
const DB_PATH = path.join(ROOT, "data", "index.db");

const ACTIVITY_DOMAINS = [
  { domain: "Tns", dir: "activity/tns" },
  { domain: "Reporting", dir: "activity/reporting" },
  { domain: "Modeling", dir: "activity/modeling" },
];

const SUMMARY_KEYS = [
  "os",
  "browser",
  "device",
  "client_version",
  "city",
  "channel_type",
  "message_type",
  "length",
  "word_count",
  "num_attachments",
  "emoji_name",
  "game",
  "game_name",
  "name",
  "location",
  "duration",
  "reason",
  "opened_from",
  "theme",
  "type",
  "bucket",
  "search_type",
];

const GUILD_ID_KEYS = ["guild_id", "server", "guild"];
const CHANNEL_ID_KEYS = ["channel_id", "channel"];
const MESSAGE_ID_KEYS = ["message_id"];

const SCHEMA = `
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT,
  icon_file TEXT,
  has_guild_json INTEGER NOT NULL DEFAULT 0,
  has_channels INTEGER NOT NULL DEFAULT 0,
  has_audit_log INTEGER NOT NULL DEFAULT 0,
  has_bans INTEGER NOT NULL DEFAULT 0,
  has_emoji INTEGER NOT NULL DEFAULT 0,
  has_webhooks INTEGER NOT NULL DEFAULT 0,
  role_count INTEGER NOT NULL DEFAULT 0,
  channel_count INTEGER NOT NULL DEFAULT 0,
  emoji_count INTEGER NOT NULL DEFAULT 0,
  ban_count INTEGER NOT NULL DEFAULT 0,
  webhook_count INTEGER NOT NULL DEFAULT 0,
  audit_log_count INTEGER NOT NULL DEFAULT 0,
  message_channel_count INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT,
  type INTEGER NOT NULL,
  guild_id TEXT,
  guild_name TEXT,
  index_name TEXT,
  recipients_json TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  first_ts INTEGER,
  last_ts INTEGER
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  contents TEXT NOT NULL,
  attachments TEXT
);

CREATE TABLE message_days (
  channel_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (channel_id, day)
) WITHOUT ROWID;

CREATE TABLE activity_sources (
  domain TEXT PRIMARY KEY,
  file TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  lines INTEGER NOT NULL
);

CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY,
  domain TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ts INTEGER,
  day TEXT,
  byte_offset INTEGER NOT NULL,
  byte_length INTEGER NOT NULL,
  guild_id TEXT,
  channel_id TEXT,
  message_id TEXT,
  summary_json TEXT
);

CREATE TABLE activity_event_types (
  domain TEXT NOT NULL,
  event_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  first_ts INTEGER,
  last_ts INTEGER,
  PRIMARY KEY (domain, event_type)
) WITHOUT ROWID;

CREATE TABLE activity_daily (
  day TEXT NOT NULL,
  domain TEXT NOT NULL,
  event_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (day, domain, event_type)
) WITHOUT ROWID;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  discriminator TEXT,
  avatar TEXT,
  note TEXT,
  sources_json TEXT NOT NULL
);
`;

const INDEXES = `
CREATE INDEX idx_channels_guild ON channels(guild_id);
CREATE INDEX idx_channels_last_ts ON channels(last_ts DESC);
CREATE INDEX idx_channels_message_count ON channels(message_count DESC);
CREATE INDEX idx_messages_channel_ts ON messages(channel_id, ts);
CREATE INDEX idx_messages_ts ON messages(ts);
CREATE INDEX idx_message_days_day ON message_days(day);
CREATE INDEX idx_activity_domain_type_ts ON activity_events(domain, event_type, ts);
CREATE INDEX idx_activity_type_ts ON activity_events(event_type, ts);
CREATE INDEX idx_activity_ts ON activity_events(ts);
CREATE INDEX idx_activity_guild_ts ON activity_events(guild_id, ts) WHERE guild_id IS NOT NULL;
CREATE INDEX idx_activity_channel_ts ON activity_events(channel_id, ts) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_activity_message ON activity_events(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX idx_users_name ON users(name);
`;

type Json = Record<string, unknown>;

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function parseCsvTimestamp(value: string): number {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = Number(value.slice(17, 19));
  const ms = value.charCodeAt(19) === 46 ? Number(value.slice(20, 23)) : 0;
  return Date.UTC(year, month - 1, day, hour, minute, second, ms);
}

function parseIsoUtc(value: string): number | null {
  let text = value;
  if (text.charCodeAt(0) === 34) text = text.slice(1, -1);
  if (text.length < 19) return null;
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  const hour = Number(text.slice(11, 13));
  const minute = Number(text.slice(14, 16));
  const second = Number(text.slice(17, 19));
  const ms = text.charCodeAt(19) === 46 ? Number(text.slice(20, 23)) : 0;
  const stamp = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  return Number.isNaN(stamp) ? null : stamp;
}

function idField(event: Json, keys: string[]): string | null {
  for (const key of keys) {
    const value = event[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function dayFromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function elapsed(startedAt: number): string {
  return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

interface UserEntry {
  name: string | null;
  discriminator: string | null;
  avatar: string | null;
  note: string | null;
  sources: Set<string>;
}

const userDirectory = new Map<string, UserEntry>();

function recordUser(
  id: string | null | undefined,
  source: string,
  fields?: { name?: string | null; discriminator?: string | null; avatar?: string | null; note?: string | null },
): void {
  if (!id || !/^\d{5,}$/.test(id)) return;
  let entry = userDirectory.get(id);
  if (!entry) {
    entry = { name: null, discriminator: null, avatar: null, note: null, sources: new Set() };
    userDirectory.set(id, entry);
  }
  entry.sources.add(source);
  if (fields?.name && !entry.name) entry.name = fields.name;
  if (fields?.discriminator && !entry.discriminator) entry.discriminator = fields.discriminator;
  if (fields?.avatar && !entry.avatar) entry.avatar = fields.avatar;
  if (fields?.note && !entry.note) entry.note = fields.note;
}

function ingestAccount(db: Database.Database): void {
  const user = readJson<Json>(path.join(PACKAGE_DIR, "account", "user.json"));
  if (!user) return;
  recordUser(user.id as string, "account", {
    name: user.username as string,
    discriminator: String(user.discriminator ?? ""),
    avatar: (user.avatar_hash as string) ?? null,
  });
  for (const rel of (user.relationships as Json[]) ?? []) {
    const target = rel.user as Json | undefined;
    if (!target) continue;
    recordUser(target.id as string, "relationship", {
      name: target.username as string,
      discriminator: target.discriminator as string,
      avatar: (target.avatar as string) ?? null,
    });
  }
  for (const [id, note] of Object.entries((user.notes as Record<string, string>) ?? {})) {
    recordUser(id, "note", { note });
  }
  db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run("owner_id", String(user.id ?? ""));

  const appsDir = path.join(PACKAGE_DIR, "account", "applications");
  if (!fs.existsSync(appsDir)) return;
  for (const appId of fs.readdirSync(appsDir)) {
    const app = readJson<Json>(path.join(appsDir, appId, "application.json"));
    const bot = app?.bot as Json | undefined;
    if (bot) {
      recordUser(bot.id as string, "application_bot", {
        name: bot.username as string,
        discriminator: bot.discriminator as string,
        avatar: (bot.avatar as string) ?? null,
      });
    }
  }
}

function ingestGuilds(db: Database.Database): number {
  const index = readJson<Record<string, string>>(path.join(PACKAGE_DIR, "servers", "index.json")) ?? {};
  const insert = db.prepare(`
    INSERT INTO guilds (
      id, name, owner_id, icon_file, has_guild_json, has_channels, has_audit_log,
      has_bans, has_emoji, has_webhooks, role_count, channel_count, emoji_count,
      ban_count, webhook_count, audit_log_count
    ) VALUES (
      @id, @name, @owner_id, @icon_file, @has_guild_json, @has_channels, @has_audit_log,
      @has_bans, @has_emoji, @has_webhooks, @role_count, @channel_count, @emoji_count,
      @ban_count, @webhook_count, @audit_log_count
    )
  `);

  const run = db.transaction(() => {
    for (const [id, name] of Object.entries(index)) {
      const dir = path.join(PACKAGE_DIR, "servers", id);
      const guild = readJson<Json>(path.join(dir, "guild.json"));
      const channels = readJson<Json[]>(path.join(dir, "channels.json"));
      const auditLog = readJson<Json[]>(path.join(dir, "audit-log.json"));
      const bans = readJson<Json[]>(path.join(dir, "bans.json"));
      const emoji = readJson<Json[]>(path.join(dir, "emoji.json"));
      const webhooks = readJson<Json[]>(path.join(dir, "webhooks.json"));

      const iconName = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.startsWith("icon.")) : undefined;
      const iconFile = iconName ? `servers/${id}/${iconName}` : null;

      const ownerId = (guild?.owner_id as string) ?? null;
      recordUser(ownerId, "guild_owner");
      for (const entry of auditLog ?? []) recordUser(entry.user_id as string, "audit_log");
      for (const ban of bans ?? []) recordUser(ban.user_id as string, "ban");
      for (const item of emoji ?? []) recordUser(item.user_id as string, "emoji_uploader");
      for (const hook of webhooks ?? []) {
        recordUser(hook.id as string, "webhook", { name: hook.name as string, avatar: (hook.avatar as string) ?? null });
        recordUser(hook.application_id as string, "webhook_application");
      }

      insert.run({
        id,
        name: name ?? id,
        owner_id: ownerId,
        icon_file: iconFile,
        has_guild_json: guild ? 1 : 0,
        has_channels: channels ? 1 : 0,
        has_audit_log: auditLog ? 1 : 0,
        has_bans: bans ? 1 : 0,
        has_emoji: emoji ? 1 : 0,
        has_webhooks: webhooks ? 1 : 0,
        role_count: guild?.roles ? Object.keys(guild.roles as Json).length : 0,
        channel_count: channels?.length ?? 0,
        emoji_count: emoji?.length ?? 0,
        ban_count: bans?.length ?? 0,
        webhook_count: webhooks?.length ?? 0,
        audit_log_count: auditLog?.length ?? 0,
      });
    }
  });
  run();
  return Object.keys(index).length;
}

function ingestChannels(db: Database.Database): number {
  const index = readJson<Record<string, string | null>>(path.join(PACKAGE_DIR, "messages", "index.json")) ?? {};
  const messagesDir = path.join(PACKAGE_DIR, "messages");
  const dirs = fs.readdirSync(messagesDir).filter((entry) => entry.startsWith("c"));

  const insert = db.prepare(`
    INSERT INTO channels (id, name, type, guild_id, guild_name, index_name, recipients_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const owner = db.prepare("SELECT value FROM meta WHERE key = 'owner_id'").get() as { value: string } | undefined;
  const ownerId = owner?.value ?? null;

  const run = db.transaction(() => {
    for (const dir of dirs) {
      const id = dir.slice(1);
      const channel = readJson<Json>(path.join(messagesDir, dir, "channel.json"));
      if (!channel) continue;
      const guild = channel.guild as Json | undefined;
      const recipients = (channel.recipients as string[]) ?? null;
      const indexName = index[id] ?? null;

      if (recipients && channel.type === 1 && indexName?.startsWith("Direct Message with ")) {
        const label = indexName.slice("Direct Message with ".length);
        const hashAt = label.lastIndexOf("#");
        const name = hashAt > 0 ? label.slice(0, hashAt) : label;
        const discriminator = hashAt > 0 ? label.slice(hashAt + 1) : null;
        for (const recipient of recipients) {
          if (recipient === ownerId) continue;
          recordUser(recipient, "dm_channel", { name, discriminator });
        }
      } else if (recipients) {
        for (const recipient of recipients) recordUser(recipient, "group_dm_recipient");
      }

      insert.run(
        id,
        (channel.name as string) ?? null,
        (channel.type as number) ?? 0,
        (guild?.id as string) ?? null,
        (guild?.name as string) ?? null,
        indexName,
        recipients ? JSON.stringify(recipients) : null,
      );
    }
  });
  run();
  return dirs.length;
}

async function ingestMessages(db: Database.Database): Promise<number> {
  const messagesDir = path.join(PACKAGE_DIR, "messages");
  const dirs = fs.readdirSync(messagesDir).filter((entry) => entry.startsWith("c"));

  const insertMessage = db.prepare("INSERT OR REPLACE INTO messages (id, channel_id, ts, contents, attachments) VALUES (?, ?, ?, ?, ?)");
  const insertDay = db.prepare("INSERT INTO message_days (channel_id, day, count) VALUES (?, ?, ?)");
  const updateChannel = db.prepare("UPDATE channels SET message_count = ?, first_ts = ?, last_ts = ? WHERE id = ?");

  let total = 0;
  let processed = 0;
  const startedAt = Date.now();

  db.exec("BEGIN");
  for (const dir of dirs) {
    const id = dir.slice(1);
    const file = path.join(messagesDir, dir, "messages.csv");
    if (!fs.existsSync(file)) continue;

    const days = new Map<string, number>();
    let count = 0;
    let firstTs: number | null = null;
    let lastTs: number | null = null;

    const parser = fs
      .createReadStream(file)
      .pipe(parse({ columns: true, bom: true, relax_quotes: true, skip_empty_lines: true, record_delimiter: ["\r\n", "\n"] }));

    for await (const record of parser as AsyncIterable<Record<string, string>>) {
      const messageId = record.ID;
      const timestamp = record.Timestamp;
      if (!messageId || !timestamp) continue;
      const ts = parseCsvTimestamp(timestamp);
      if (Number.isNaN(ts)) continue;
      insertMessage.run(messageId, id, ts, record.Contents ?? "", record.Attachments || null);
      const day = timestamp.slice(0, 10);
      days.set(day, (days.get(day) ?? 0) + 1);
      count += 1;
      if (firstTs === null || ts < firstTs) firstTs = ts;
      if (lastTs === null || ts > lastTs) lastTs = ts;
    }

    for (const [day, dayCount] of days) insertDay.run(id, day, dayCount);
    updateChannel.run(count, firstTs, lastTs, id);
    total += count;

    processed += 1;
    if (processed % 1000 === 0) {
      db.exec("COMMIT");
      db.exec("BEGIN");
      log(`  messages: ${processed}/${dirs.length} channels, ${total} rows (${elapsed(startedAt)})`);
    }
  }
  db.exec("COMMIT");
  log(`  messages: ${processed}/${dirs.length} channels, ${total} rows (${elapsed(startedAt)})`);
  return total;
}

function eachLine(file: string, onLine: (line: string, offset: number, length: number) => void): number {
  const CHUNK = 1 << 23;
  const buffer = Buffer.allocUnsafe(CHUNK);
  const fd = fs.openSync(file, "r");
  let carry: Buffer | null = null;
  let filePos = 0;
  let lines = 0;
  try {
    for (;;) {
      const bytes = fs.readSync(fd, buffer, 0, CHUNK, filePos);
      if (bytes === 0) break;
      const view = buffer.subarray(0, bytes);
      let cursor = 0;
      for (;;) {
        const newline = view.indexOf(10, cursor);
        if (newline === -1) {
          const tail = view.subarray(cursor, bytes);
          carry = carry ? Buffer.concat([carry, tail]) : Buffer.from(tail);
          break;
        }
        if (carry) {
          const full = Buffer.concat([carry, view.subarray(cursor, newline)]);
          onLine(full.toString("utf8"), filePos + cursor - carry.length, full.length);
          carry = null;
        } else {
          onLine(view.toString("utf8", cursor, newline), filePos + cursor, newline - cursor);
        }
        lines += 1;
        cursor = newline + 1;
      }
      filePos += bytes;
    }
    if (carry && carry.length > 0) {
      onLine(carry.toString("utf8"), filePos - carry.length, carry.length);
      lines += 1;
    }
  } finally {
    fs.closeSync(fd);
  }
  return lines;
}

function ingestActivity(db: Database.Database): number {
  const insertEvent = db.prepare(`
    INSERT INTO activity_events (domain, event_type, ts, day, byte_offset, byte_length, guild_id, channel_id, message_id, summary_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSource = db.prepare("INSERT INTO activity_sources (domain, file, bytes, lines) VALUES (?, ?, ?, ?)");

  let total = 0;
  for (const { domain, dir } of ACTIVITY_DOMAINS) {
    const absoluteDir = path.join(PACKAGE_DIR, dir);
    if (!fs.existsSync(absoluteDir)) continue;
    for (const name of fs.readdirSync(absoluteDir).sort()) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(absoluteDir, name);
      const relative = path.posix.join(dir, name);
      const size = fs.statSync(file).size;
      const startedAt = Date.now();
      let inserted = 0;
      let failed = 0;

      db.exec("BEGIN");
      const lines = eachLine(file, (line, offset, length) => {
        let event: Json;
        try {
          event = JSON.parse(line) as Json;
        } catch {
          failed += 1;
          return;
        }
        let ts: number | null = null;
        if (typeof event.timestamp === "string") ts = parseIsoUtc(event.timestamp);
        if (ts === null && typeof event._hour_utc === "string") ts = parseIsoUtc(event._hour_utc);
        if (ts === null && typeof event._day_utc === "string") ts = parseIsoUtc(event._day_utc);

        const summary: Record<string, string | number | boolean> = {};
        for (const key of SUMMARY_KEYS) {
          const value = event[key];
          if (value === undefined || value === null) continue;
          if (typeof value === "string") {
            if (value.length === 0) continue;
            summary[key] = value.length > 80 ? `${value.slice(0, 80)}…` : value;
          } else if (typeof value === "number" || typeof value === "boolean") {
            summary[key] = value;
          }
        }

        insertEvent.run(
          domain,
          (event.event_type as string) ?? "unknown",
          ts,
          ts === null ? null : dayFromMs(ts),
          offset,
          length,
          idField(event, GUILD_ID_KEYS),
          idField(event, CHANNEL_ID_KEYS),
          idField(event, MESSAGE_ID_KEYS),
          Object.keys(summary).length > 0 ? JSON.stringify(summary) : null,
        );
        inserted += 1;
        if (inserted % 200000 === 0) {
          db.exec("COMMIT");
          db.exec("BEGIN");
          log(`  activity ${domain}: ${inserted} events (${elapsed(startedAt)})`);
        }
      });
      db.exec("COMMIT");

      insertSource.run(domain, relative, size, lines);
      total += inserted;
      log(`  activity ${domain}: ${inserted} events from ${lines} lines, ${failed} unparsable (${elapsed(startedAt)})`);
    }
  }
  return total;
}

function buildAggregates(db: Database.Database): void {
  db.exec(`
    INSERT INTO activity_event_types (domain, event_type, count, first_ts, last_ts)
    SELECT domain, event_type, COUNT(*), MIN(ts), MAX(ts) FROM activity_events GROUP BY domain, event_type;

    INSERT INTO activity_daily (day, domain, event_type, count)
    SELECT day, domain, event_type, COUNT(*) FROM activity_events WHERE day IS NOT NULL GROUP BY day, domain, event_type;

    UPDATE guilds SET
      message_channel_count = (SELECT COUNT(*) FROM channels WHERE channels.guild_id = guilds.id),
      message_count = (SELECT COALESCE(SUM(message_count), 0) FROM channels WHERE channels.guild_id = guilds.id);
  `);
}

function persistUsers(db: Database.Database): number {
  const insert = db.prepare("INSERT OR REPLACE INTO users (id, name, discriminator, avatar, note, sources_json) VALUES (?, ?, ?, ?, ?, ?)");
  const run = db.transaction(() => {
    for (const [id, entry] of userDirectory) {
      insert.run(id, entry.name, entry.discriminator, entry.avatar, entry.note, JSON.stringify([...entry.sources].sort()));
    }
  });
  run();
  return userDirectory.size;
}

async function main(): Promise<void> {
  if (!fs.existsSync(PACKAGE_DIR)) {
    throw new Error(`Data package not found at ${PACKAGE_DIR}`);
  }
  const startedAt = Date.now();
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = OFF");
  db.pragma("synchronous = OFF");
  db.pragma("temp_store = MEMORY");
  db.pragma("cache_size = -262144");
  db.exec(SCHEMA);

  log("account…");
  ingestAccount(db);

  log("guilds…");
  const guildCount = ingestGuilds(db);
  log(`  ${guildCount} guilds`);

  log("channels…");
  const channelCount = ingestChannels(db);
  log(`  ${channelCount} channels`);

  log("messages…");
  const messageCount = await ingestMessages(db);

  log("activity…");
  const activityCount = ingestActivity(db);

  log("users…");
  const userCount = persistUsers(db);
  log(`  ${userCount} users`);

  log("aggregates…");
  buildAggregates(db);

  log("indexes…");
  const indexStart = Date.now();
  db.exec(INDEXES);
  log(`  indexes built (${elapsed(indexStart)})`);

  log("full-text index…");
  const ftsStart = Date.now();
  db.exec(
    "CREATE VIRTUAL TABLE messages_fts USING fts5(contents, channel_id UNINDEXED, content='messages', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');",
  );
  db.exec("INSERT INTO messages_fts(messages_fts) VALUES('rebuild');");
  db.exec("INSERT INTO messages_fts(messages_fts) VALUES('optimize');");
  log(`  fts built (${elapsed(ftsStart)})`);

  const ingestSeconds = (Date.now() - startedAt) / 1000;
  const range = db
    .prepare("SELECT MIN(ts) AS min_ts, MAX(ts) AS max_ts FROM messages")
    .get() as { min_ts: number | null; max_ts: number | null };
  const activityRange = db
    .prepare("SELECT MIN(ts) AS min_ts, MAX(ts) AS max_ts FROM activity_events")
    .get() as { min_ts: number | null; max_ts: number | null };
  const typeCount = (db.prepare("SELECT COUNT(*) AS n FROM activity_event_types").get() as { n: number }).n;
  const byType = db.prepare("SELECT type, COUNT(*) AS n FROM channels GROUP BY type").all() as Array<{ type: number; n: number }>;
  const countOfType = (type: number) => byType.find((row) => row.type === type)?.n ?? 0;

  const stats = {
    channelCount,
    dmChannelCount: countOfType(1),
    groupDmChannelCount: countOfType(3),
    guildChannelCount: channelCount - countOfType(1) - countOfType(3),
    messageCount,
    guildCount,
    activityEventCount: activityCount,
    activityEventTypeCount: typeCount,
    userCount,
    firstMessageTs: range.min_ts,
    lastMessageTs: range.max_ts,
    firstActivityTs: activityRange.min_ts,
    lastActivityTs: activityRange.max_ts,
    ingestedAt: new Date().toISOString(),
    ingestSeconds: Number(ingestSeconds.toFixed(1)),
  };
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("stats", JSON.stringify(stats));

  log("analyze…");
  db.exec("PRAGMA optimize; ANALYZE;");
  db.close();

  const dbSize = fs.statSync(DB_PATH).size;
  log("");
  log(`done in ${ingestSeconds.toFixed(1)}s — ${(dbSize / 1024 / 1024).toFixed(0)} MB at ${DB_PATH}`);
  log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
