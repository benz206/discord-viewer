import "server-only";

import fs from "node:fs";
import { db, packageFile, readPackageJson } from "./db";
import type {
  AuditLogEntry,
  GuildAssets,
  GuildBan,
  GuildChannelJson,
  GuildDetail,
  GuildEmoji,
  GuildJson,
  GuildRow,
  GuildWebhook,
} from "./types";

interface GuildDbRow {
  id: string;
  name: string;
  owner_id: string | null;
  icon_file: string | null;
  has_guild_json: number;
  has_channels: number;
  has_audit_log: number;
  has_bans: number;
  has_emoji: number;
  has_webhooks: number;
  role_count: number;
  channel_count: number;
  emoji_count: number;
  ban_count: number;
  webhook_count: number;
  audit_log_count: number;
  message_channel_count: number;
  message_count: number;
}

function toGuild(row: GuildDbRow): GuildRow {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    iconFile: row.icon_file,
    hasGuildJson: row.has_guild_json === 1,
    hasChannels: row.has_channels === 1,
    hasAuditLog: row.has_audit_log === 1,
    hasBans: row.has_bans === 1,
    hasEmoji: row.has_emoji === 1,
    hasWebhooks: row.has_webhooks === 1,
    roleCount: row.role_count,
    channelCount: row.channel_count,
    emojiCount: row.emoji_count,
    banCount: row.ban_count,
    webhookCount: row.webhook_count,
    auditLogCount: row.audit_log_count,
    messageChannelCount: row.message_channel_count,
    messageCount: row.message_count,
  };
}

export function listGuilds(): GuildRow[] {
  const rows = db()
    .prepare("SELECT * FROM guilds ORDER BY message_count DESC, name COLLATE NOCASE ASC")
    .all() as GuildDbRow[];
  return rows.map(toGuild);
}

function listAssetDir(guildId: string, dir: string): string[] {
  const absolute = packageFile("servers", guildId, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute).sort();
}

export function getGuildAssets(guild: GuildRow): GuildAssets {
  return {
    icon: guild.iconFile,
    emoji: listAssetDir(guild.id, "emoji").map((file) => ({
      id: file.replace(/\.[^.]+$/, ""),
      path: `servers/${guild.id}/emoji/${file}`,
    })),
    webhookAvatars: listAssetDir(guild.id, "webhooks").map((file) => ({
      hash: file.replace(/\.[^.]+$/, ""),
      path: `servers/${guild.id}/webhooks/${file}`,
    })),
  };
}

export function getGuild(id: string): GuildDetail | null {
  const row = db().prepare("SELECT * FROM guilds WHERE id = ?").get(id) as GuildDbRow | undefined;
  if (!row) return null;
  const guild = toGuild(row);
  return {
    ...guild,
    guild: readPackageJson<GuildJson>("servers", id, "guild.json"),
    channels: readPackageJson<GuildChannelJson[]>("servers", id, "channels.json"),
    auditLog: readPackageJson<AuditLogEntry[]>("servers", id, "audit-log.json"),
    bans: readPackageJson<GuildBan[]>("servers", id, "bans.json"),
    emoji: readPackageJson<GuildEmoji[]>("servers", id, "emoji.json"),
    webhooks: readPackageJson<GuildWebhook[]>("servers", id, "webhooks.json"),
    assets: getGuildAssets(guild),
  };
}
