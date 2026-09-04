// Readers for the package folders that live outside account/user.json.
//
// Newer Discord exports moved billing, store, promotion and virtual-currency data
// out of user.json into account/user_data_exports/, and added whole top-level
// Ads/, Activities/ and Support_Tickets/ folders. All of these are small enough to
// read straight off disk per request, so none of them go through the SQLite index.

import "server-only";

import fs from "node:fs";
import path from "node:path";
import { PACKAGE_DIR, packageFile } from "./db";

type Rec = Record<string, unknown>;

function asRecord(value: unknown): Rec {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Rec) : {};
}

function readJsonFile<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Package-relative path usable as an /api/asset/<path> URL. */
function assetPath(absolute: string): string {
  return path.relative(PACKAGE_DIR, absolute).split(path.sep).join("/");
}

function isDirectory(file: string): boolean {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function listDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * account/user_data_exports
 * ------------------------------------------------------------------ */

export interface DataExportColumn {
  name: string;
  description: string | null;
}

export interface DataExportSection {
  /** Folder name, e.g. "discord_billing". */
  schema: string;
  /** File name without extension, e.g. "payments". */
  slug: string;
  /** Discord's own label, e.g. "Payments". */
  section: string;
  schemaDescription: string | null;
  description: string | null;
  generatedAt: string | null;
  recordCount: number;
  columns: DataExportColumn[];
  records: Rec[];
  assetPath: string;
}

function toColumns(metadata: Rec): DataExportColumn[] {
  const columns = Array.isArray(metadata.columns) ? metadata.columns : [];
  return columns.map((column) => {
    const entry = asRecord(column);
    return {
      name: typeof entry.name === "string" ? entry.name : "",
      description: typeof entry.description === "string" ? entry.description : null,
    };
  });
}

export function getDataExports(): DataExportSection[] {
  const root = packageFile("account", "user_data_exports");
  if (!fs.existsSync(root)) return [];

  const sections: DataExportSection[] = [];
  for (const schema of listDir(root)) {
    const schemaDir = path.join(root, schema);
    if (!isDirectory(schemaDir)) continue;

    for (const name of listDir(schemaDir)) {
      if (!name.endsWith(".json")) continue;
      const file = path.join(schemaDir, name);
      const payload = readJsonFile<Rec>(file);
      if (!payload) continue;

      const metadata = asRecord(payload.metadata);
      const records = Array.isArray(payload.records) ? payload.records.map(asRecord) : [];
      sections.push({
        schema,
        slug: name.replace(/\.json$/, ""),
        section: typeof payload.section === "string" ? payload.section : name,
        schemaDescription: typeof metadata.schema_description === "string" ? metadata.schema_description : null,
        description: typeof metadata.description === "string" ? metadata.description : null,
        generatedAt: typeof payload.generated_at === "string" ? payload.generated_at : null,
        recordCount: typeof payload.record_count === "number" ? payload.record_count : records.length,
        columns: toColumns(metadata),
        records,
        assetPath: assetPath(file),
      });
    }
  }
  return sections;
}

export function getDataExportsBySchema(schema: string): DataExportSection[] {
  return getDataExports().filter((section) => section.schema === schema);
}

/* ------------------------------------------------------------------ *
 * Ads/
 * ------------------------------------------------------------------ */

export interface AdsData {
  /** Ad-targeting traits Discord derived for this account. */
  traits: Rec | null;
  traitsAssetPath: string | null;
  /** One row per quest the account was enrolled in. */
  questStatus: Rec[];
  questStatusAssetPath: string | null;
}

export function getAds(): AdsData {
  const traitsFile = packageFile("ads", "traits.json");
  const questFile = packageFile("ads", "quests_user_status.json");

  const traits = fs.existsSync(traitsFile) ? readJsonFile<Rec>(traitsFile) : null;
  const quests = fs.existsSync(questFile) ? readJsonFile<unknown>(questFile) : null;

  return {
    traits: traits ? asRecord(traits) : null,
    traitsAssetPath: traits ? assetPath(traitsFile) : null,
    questStatus: Array.isArray(quests) ? quests.map(asRecord) : [],
    questStatusAssetPath: quests ? assetPath(questFile) : null,
  };
}

export function hasAds(): boolean {
  return fs.existsSync(packageFile("ads"));
}

/* ------------------------------------------------------------------ *
 * Support_Tickets/
 * ------------------------------------------------------------------ */

export interface SupportTicketComment {
  author: string | null;
  comment: string;
  createdAt: string | null;
}

export interface SupportTicket {
  id: string;
  subject: string | null;
  status: string | null;
  createdAt: string | null;
  comments: SupportTicketComment[];
}

export function getSupportTickets(): { tickets: SupportTicket[]; assetPath: string | null } {
  const file = packageFile("support_tickets", "tickets.json");
  if (!fs.existsSync(file)) return { tickets: [], assetPath: null };
  const payload = readJsonFile<Rec>(file);
  if (!payload) return { tickets: [], assetPath: assetPath(file) };

  const tickets: SupportTicket[] = [];
  for (const [id, value] of Object.entries(payload)) {
    const ticket = asRecord(value);
    const comments = Array.isArray(ticket.comments) ? ticket.comments : [];
    tickets.push({
      id: String(ticket.ticket_id ?? id),
      subject: typeof ticket.subject === "string" ? ticket.subject : null,
      status: typeof ticket.status === "string" ? ticket.status : null,
      createdAt: typeof ticket.created_at === "string" ? ticket.created_at : null,
      comments: comments.map((entry) => {
        const comment = asRecord(entry);
        return {
          author: typeof comment.author === "string" ? comment.author : null,
          comment: typeof comment.comment === "string" ? comment.comment : "",
          createdAt: typeof comment.created_at === "string" ? comment.created_at : null,
        };
      }),
    });
  }

  // Newest first, falling back to id order when a ticket has no timestamp.
  tickets.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id));
  return { tickets, assetPath: assetPath(file) };
}

/* ------------------------------------------------------------------ *
 * Activities/
 * ------------------------------------------------------------------ */

export interface ActivityFile {
  /** Path within the activity group, e.g. "poker/poker.json". */
  name: string;
  assetPath: string;
  size: number;
  json: unknown;
  text: string | null;
}

export interface ActivityGroup {
  name: string;
  files: ActivityFile[];
}

const ACTIVITY_TEXT_LIMIT = 200_000;

function walkActivityFiles(dir: string, prefix: string, out: ActivityFile[]): void {
  for (const entry of listDir(dir)) {
    const absolute = path.join(dir, entry);
    const name = prefix ? `${prefix}/${entry}` : entry;
    if (isDirectory(absolute)) {
      walkActivityFiles(absolute, name, out);
      continue;
    }

    let size = 0;
    try {
      size = fs.statSync(absolute).size;
    } catch {
      continue;
    }

    const isJson = entry.endsWith(".json");
    const isText = entry.endsWith(".txt") || entry.endsWith(".md");
    out.push({
      name,
      assetPath: assetPath(absolute),
      size,
      json: isJson ? readJsonFile<unknown>(absolute) : null,
      text: isText && size <= ACTIVITY_TEXT_LIMIT ? fs.readFileSync(absolute, "utf8") : null,
    });
  }
}

export function getActivityGroups(): ActivityGroup[] {
  const root = packageFile("activities");
  if (!fs.existsSync(root)) return [];

  const groups: ActivityGroup[] = [];
  for (const name of listDir(root)) {
    const dir = path.join(root, name);
    if (!isDirectory(dir)) continue;
    const files: ActivityFile[] = [];
    walkActivityFiles(dir, "", files);
    groups.push({ name, files });
  }
  return groups;
}

/* ------------------------------------------------------------------ *
 * account/recent_avatars
 * ------------------------------------------------------------------ */

export interface RecentAvatar {
  id: string;
  assetPath: string;
  size: number;
}

export function getRecentAvatars(): RecentAvatar[] {
  const dir = packageFile("account", "recent_avatars");
  if (!fs.existsSync(dir)) return [];

  const avatars: RecentAvatar[] = [];
  for (const name of listDir(dir)) {
    const absolute = path.join(dir, name);
    let size = 0;
    try {
      const stats = fs.statSync(absolute);
      if (!stats.isFile()) continue;
      size = stats.size;
    } catch {
      continue;
    }
    avatars.push({ id: name.replace(/\.[^.]+$/, ""), assetPath: assetPath(absolute), size });
  }

  // File names are snowflake ids, so the largest is the most recent.
  avatars.sort((a, b) => b.id.localeCompare(a.id));
  return avatars;
}
