import "server-only";

import fs from "node:fs";
import path from "node:path";
import { openDatabase, type SqliteDatabase } from "./sqlite";

export const PACKAGE_DIR = path.join(process.cwd(), "data", "package");
export const DB_PATH = path.join(process.cwd(), "data", "index.db");

let instance: SqliteDatabase | null = null;

export function db(): SqliteDatabase {
  if (instance) return instance;
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Missing ${DB_PATH}. Run \`bun run ingest\` first.`);
  }
  const connection = openDatabase(DB_PATH, { readonly: true });
  connection.exec("PRAGMA cache_size = -65536; PRAGMA temp_store = MEMORY; PRAGMA mmap_size = 268435456;");
  instance = connection;
  return instance;
}

export function packageFile(...segments: string[]): string {
  return path.join(PACKAGE_DIR, ...segments);
}

export function readPackageJson<T>(...segments: string[]): T | null {
  try {
    return JSON.parse(fs.readFileSync(packageFile(...segments), "utf8")) as T;
  } catch {
    return null;
  }
}
