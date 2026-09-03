import "server-only";

import fs from "node:fs";
import { db, packageFile, readPackageJson } from "./db";
import type { AccountUser, Application, ApplicationEntry, PackageStats } from "./types";

export function getUser(): AccountUser | null {
  return readPackageJson<AccountUser>("account", "user.json");
}

export function getOwnerId(): string | null {
  const row = db().prepare("SELECT value FROM meta WHERE key = 'owner_id'").get() as { value: string } | undefined;
  return row?.value ?? null;
}

export function getUserAvatarPath(): string | null {
  const relative = "account/avatar.gif";
  return fs.existsSync(packageFile(relative)) ? relative : null;
}

export function getApplications(): ApplicationEntry[] {
  const dir = packageFile("account", "applications");
  if (!fs.existsSync(dir)) return [];
  const entries: ApplicationEntry[] = [];
  for (const id of fs.readdirSync(dir).sort()) {
    const application = readPackageJson<Application>("account", "applications", id, "application.json");
    if (!application) continue;
    const iconPath = fs.existsSync(packageFile("account", "applications", id, "icon.png"))
      ? `account/applications/${id}/icon.png`
      : null;
    const botAvatarPath = fs.existsSync(packageFile("account", "applications", id, "bot-avatar.png"))
      ? `account/applications/${id}/bot-avatar.png`
      : null;
    entries.push({ application, iconPath, botAvatarPath });
  }
  return entries;
}

export function getPackageStats(): PackageStats {
  const row = db().prepare("SELECT value FROM meta WHERE key = 'stats'").get() as { value: string } | undefined;
  if (!row) throw new Error("Missing ingest stats. Run `pnpm ingest` first.");
  return JSON.parse(row.value) as PackageStats;
}

export function getActivitySources(): Array<{ domain: string; file: string; bytes: number; lines: number }> {
  return db()
    .prepare("SELECT domain, file, bytes, lines FROM activity_sources ORDER BY domain")
    .all() as Array<{ domain: string; file: string; bytes: number; lines: number }>;
}
