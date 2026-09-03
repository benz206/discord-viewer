import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export const PACKAGE_DIR = path.join(process.cwd(), "data", "package");
export const DB_PATH = path.join(process.cwd(), "data", "index.db");

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (instance) return instance;
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Missing ${DB_PATH}. Run \`pnpm ingest\` first.`);
  }
  const connection = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  connection.pragma("cache_size = -65536");
  connection.pragma("temp_store = MEMORY");
  connection.pragma("mmap_size = 268435456");
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
