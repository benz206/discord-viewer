import { createRequire } from "node:module";

export interface SqliteStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): unknown;
}

export interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
  exec(sql: string): void;
  transaction<T>(fn: () => T): () => T;
  close(): void;
}

const load = createRequire(import.meta.url);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !Buffer.isBuffer(value);
}

function prefixNamedParams(params: unknown[]): unknown[] {
  return params.map((param) => {
    if (!isPlainObject(param)) return param;
    const prefixed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(param)) {
      prefixed[/^[@$:]/.test(key) ? key : `@${key}`] = value;
    }
    return prefixed;
  });
}

function wrapBunDatabase(database: SqliteDatabase): SqliteDatabase {
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      return {
        get: (...params) => statement.get(...prefixNamedParams(params)),
        all: (...params) => statement.all(...prefixNamedParams(params)),
        run: (...params) => statement.run(...prefixNamedParams(params)),
      };
    },
    exec: (sql) => database.exec(sql),
    transaction: (fn) => database.transaction(fn),
    close: () => database.close(),
  };
}

export function openDatabase(file: string, options: { readonly?: boolean } = {}): SqliteDatabase {
  const readonly = options.readonly ?? false;
  if (process.versions.bun) {
    const { Database } = load("bun:sqlite");
    return wrapBunDatabase(new Database(file, { readonly, create: !readonly }));
  }
  const Database = load("better-sqlite3");
  return new Database(file, { readonly, fileMustExist: readonly });
}
