import "server-only";

import { db } from "./db";
import type { UserDirectoryEntry } from "./types";

interface UserDbRow {
  id: string;
  name: string | null;
  discriminator: string | null;
  avatar: string | null;
  note: string | null;
  sources_json: string;
}

function toEntry(row: UserDbRow): UserDirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    discriminator: row.discriminator,
    avatar: row.avatar,
    note: row.note,
    sources: JSON.parse(row.sources_json) as string[],
  };
}

export function buildUserDirectory(): Map<string, UserDirectoryEntry> {
  const rows = db().prepare("SELECT * FROM users").all() as UserDbRow[];
  return new Map(rows.map((row) => [row.id, toEntry(row)]));
}

export interface ListUsersOptions {
  source?: string;
  namedOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

function buildUserFilter(options: ListUsersOptions): {
  where: string[];
  params: Record<string, string | number>;
} {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (options.namedOnly) where.push("name IS NOT NULL");
  if (options.source) {
    where.push("sources_json LIKE @source");
    params.source = `%"${options.source}"%`;
  }
  if (options.search) {
    where.push("(name LIKE @search OR id LIKE @search)");
    params.search = `%${options.search}%`;
  }
  return { where, params };
}

export function listUsers(options: ListUsersOptions = {}): UserDirectoryEntry[] {
  const { where, params } = buildUserFilter(options);
  params.limit = options.limit ?? 1000;
  params.offset = options.offset ?? 0;

  const sql = `SELECT * FROM users ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY name IS NULL, name COLLATE NOCASE ASC LIMIT @limit OFFSET @offset`;
  return (db().prepare(sql).all(params) as UserDbRow[]).map(toEntry);
}

export function countUsers(options: ListUsersOptions = {}): number {
  const { where, params } = buildUserFilter(options);
  const sql = `SELECT COUNT(*) AS n FROM users ${where.length ? `WHERE ${where.join(" AND ")}` : ""}`;
  return (db().prepare(sql).get(params) as { n: number }).n;
}

export function getUserEntry(id: string): UserDirectoryEntry | null {
  const row = db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserDbRow | undefined;
  return row ? toEntry(row) : null;
}

export function getUserNotes(): Array<{ id: string; name: string | null; note: string }> {
  return db()
    .prepare("SELECT id, name, note FROM users WHERE note IS NOT NULL ORDER BY name IS NULL, name COLLATE NOCASE")
    .all() as Array<{ id: string; name: string | null; note: string }>;
}
